import openai
import PyPDF2
import docx2txt
from opus_conn import get_competencies_hamza,get_job_info_from_db
from opus_conn import create_conn
from datetime import datetime
import json
import ast
import pandas as pd

class OpusResume:
    def __init__(self, api_base: str, api_key: str, api_version: str = "2023-05-15") -> None:
        """Initialize OpenAI API configuration"""
        openai.api_type = "azure"
        openai.api_base = api_base
        openai.api_key = api_key
        openai.api_version = api_version

    @staticmethod
    def extract_text_from_pdf(filepath: str) -> str:
        """Extracts text from a PDF file."""
        try:
            with open(filepath, 'rb') as file:
                reader = PyPDF2.PdfReader(file)
                text = ''.join([reader.pages[page].extract_text() for page in range(len(reader.pages))])
            return text
        except Exception as e:
            raise ValueError(f"Error reading PDF file: {e}")

    @staticmethod
    def extract_text_from_docx(filepath: str) -> str:
        """Extracts text from a DOCX file."""
        try:
            text = docx2txt.process(filepath)
            return text
        except Exception as e:
            raise ValueError(f"Error reading DOCX file: {e}")

    def extract_resume_text(self, filepath: str) -> str:
        """Detects file type and extracts text from either PDF or DOCX."""
        if filepath.endswith('.pdf'):
            return self.extract_text_from_pdf(filepath)
        elif filepath.endswith('.docx'):
            return self.extract_text_from_docx(filepath)
        else:
            raise ValueError("Unsupported file type. Please use PDF or DOCX.")

    def get_insights(self, test_table: str, engine: str = "opus-gpt4-32k", temperature: float = 0) -> str:
        """Generates insights from the provided data using OpenAI API."""
        try:
            response = openai.ChatCompletion.create(
                engine=engine,
                temperature=temperature,
                messages=[
                    {"role": "system", "content": '''You are an AI assistant that generates insights from data.
                    You will be given data and should provide concise and to-the-point insights using bullet points.'''},
                    {"role": "user", "content": test_table}
                ]
            )
            insights = response['choices'][0]['message']['content']
            return insights
        except Exception as e:
            raise ValueError(f"Error generating insights: {e}")
        
    def generate_prompts(self,resume_text, competencies):
        """
        Generate prompts for LLM insights based on the resume text, job title, job function, and competencies.

        :param resume_text: The extracted text of the resume
        :param connection: Database connection object
        :param competencies: List of competencies fetched based on the job title and function
        :return: Dictionary of prompts for different sections
        """

        competencies_str = ', '.join(competencies)
        
        # Generate the prompts based on the job title, function, competencies, and resume text
        prompts = {
            "education": (
                f"""
                "From the resume, extract and list all educational qualifications and certifications. Each entry should be linked to the relevant job title to show which education or certifications correspond to which job. For educational qualifications, include the degree type, institution name, and dates attended. For certifications, include the certification title, issuing organization, and date of certification (or expiration, if available).
                For each certification , also provide list of competencies these certification are for. Here is the list [Insert competencies list here: {competencies_str}
                Your response should always be in JSON format which can be deserialized into JSON object. Sample output is enclosed in <Output_Format></Output_Format> tags.
                    

                For Education:
                    <Output_Format>
                    [{{
                    "Degree": "[Degree Type]",
                    "Institution": "[Institution Name]",
                    "Dates": "[Start Date — End Date]",
                    "Linked_Job": "[Job Title]"
                    "Level": "[Graduation/Post Graduation]"
                    }}
                    </Output_Format>


                For Certifications:
                    <Output_Format>
                    {{
                    "Certification": "[Certification Title]",
                    "Issuing_Organization": "[Issuing Body]",
                    "Date": "[Date Issued] / [Expiration Date (if applicable)]",
                    "Linked_Competencies": ["Competency 1", "Competency 2"]
                    }}]
                    </Output_Format>
                            """ +
                resume_text
            ),
            
            "title_with_duration": (
                f"""
                    "From the resume, extract and list only job titles and employers. Do not include educational institute details. Also, analyze the job industry for each job based on the given job description and map it to one of the following predefined industries:

                    Information Technology
                    Healthcare
                    Finance
                    Education
                    Manufacturing
                    Retail
                    Telecommunications
                    Hospitality
                    Transportation
                    Real Estate
                    Legal
                    Marketing and Advertising
                    Media and Entertainment
                    Energy
                    Construction
                    Nonprofit
                    Government

                Include the industry in the results. If the industry changes between jobs, clearly mark the change. Also, include the duration of employment in months.Job should be sorted based on Started Date Acending order.
                Map the extracted competencies to the following predefined list of competencies: [Insert competencies list here: "{competencies_str}"] for each role and in the output return the only the new competencies that 
                does not exist in the previous role.
                Your response should always be in JSON format which can be deserialized into JSON object. Sample output is enclosed in <Output_Format></Output_Format> tags.Stictly Follow the output format.
                Dont add anyting in the response apart from JSON output.        
                    <Output_Format>
                    {[{
                    "Job_Title": "[Job Title]",
                    "Employer": "[Employer Name]",
                    "Industry": "[Mapped Industry Name]",
                    "Duration_Months": "[Start Date — End Date] (Months)",
                    "Industry_Change": "[Yes/No]",
                    "New_Competencies": ["Competency 1", "Competency 2"],
                    }] }
                    </Output_Format>

                Make sure the sorting logic processes jobs from the earliest date to the most recent one.

                """ +

                resume_text
            ),
            "promotions": (
            
            """
                Given a resume, your task is to identify if the person has been promoted. A promotion is defined as when the Employer of a person remains the same but their job title changes over time.
                Analyze the resume text to determine if the person has been promoted or not.

                Your response should always be in JSON format which can be deserialized into JSON object. Sample output is enclosed in <Output_Format></Output_Format> tags.Stictly Follow the output format.
                Dont add anyting in the response apart from JSON output.
            
                <Output_Format>
                [{
                "Role": "[Job Title]",
                "Employer": "[Employer Name]",
                "Promoted": "Yes|No",
                "Duration_Months": "Duration"
                }]
                </Output_Format>

                """
                +
                resume_text
            ),
            "responsibilities_and_competencies": (
                f"""
                "From the resume, extract and list the main responsibilities and competencies for each role. For each job title, read through the job description and map the competencies that align with the role. Identify both functional and core competencies, and calculate the duration of each role in months. If the job is ongoing, use the current date to calculate the duration (as of {datetime.now()}).

                Strictly follow the JSON output format below. Map the extracted competencies to the following predefined list of competencies: [Insert competencies list here: "{competencies_str}"]. Ensure that only competencies from this list are returned in the output.   
                Competencies should be concise phrases, no more than 3-4 words each. 
                Your response should always be in JSON format which can be deserialized into JSON object. Sample output is enclosed in <Output_Format></Output_Format> tags.Stictly Follow the output format.
            
                <Output_Format>
                {[{
                "Role": "[Job Title]",
                "Core_Competencies": ["Core Competency 1", "Core Competency 2"],
                "Functional_Competencies": ["Functional Competency 1", "Functional Competency 2"],
                "Duration_Months": "Duration"
                }]}
                </Output_Format>


                """       
                    +
                resume_text
            )
        }
        
        return prompts
    
        

    def analyze_resume(self,resume_text, competencies):
        """
        Analyze the resume by generating LLM-based insights for various sections.
        
        :param filepath: Path to the resume file
        :param connection: Database connection object
        :param competencies: List of competencies fetched based on the user's job title and function
        :param user_id: The user ID to fetch job information from the database
        :return: Dictionary of results containing insights for each section
        """
        
        # Extract the resume text from the provided file path
        # resume_text = extract_resume_text(filepath)
        # Check if resume text is valid
        if not resume_text or not isinstance(resume_text, str):
            raise ValueError("The resume text must be a valid non-empty string.")

        # # Fetch job information (job title and job function) for the user
        # job_info = get_job_info_from_db(connection, user_id)


        # Generate prompts for each section using the extracted resume text
        prompts = self.generate_prompts(resume_text, competencies)


        # Analyze each section using the LLM with the generated prompts
        education = self.get_insights(prompts["education"])
        # duration = get_insights(prompts["duration"])
        titles_and_competencies = self.get_insights(prompts["title_with_duration"])
        promotions = self.get_insights(prompts["promotions"])
        # responsibilities = self.get_insights(prompts["responsibilities_and_competencies"])

        # Store the results for each section in a dictionary
        analysis_results = {
            "education_details": education,
            # "duration_details": duration,
            "jobs_industory": titles_and_competencies,
            "promotions_details": promotions,
            # "responsibilities_details": responsibilities
        }


        return analysis_results 

    ## updating score using education Post Graduation  and Graduation

    def update_scores_education(self,df,education_json):
        # edcuation_certifications = json.loads(education_json)
        try:
            edcuation_certifications = ast.literal_eval(education_json)
            print(edcuation_certifications)
            
            multiplier = 0
            if "Education" in edcuation_certifications.keys():
                for rows in edcuation_certifications['Education']:
                    # print(rows["Level"])
                    if rows["Level"] ==  "Graduation":
                        multiplier = 0.70
                    elif rows["Level"] ==  "Post Graduation":
                        multiplier = 0.85

            competencies= []
            if "Certifications" in edcuation_certifications.keys():
                for rows in edcuation_certifications['Certifications']:
                    for competency in rows["Linked_Competencies"]:
                        competencies.append(competency)


            #updating score for all the competencies for education
            if multiplier != 0:
                df["scores"]  = df["scores"] * multiplier

            #updating scores for only certification related competencies
            df.loc[df['Title'].isin(competencies), 'scores'] *= .10
            return df
        
        except Exception as e:
            return df



    def update_scores_promotion_industory(self,df,promotion_json,industory_json):
        # promotion_json = json.loads(promotion_json)
        try:
            promotion_json = ast.literal_eval(promotion_json)
            promtion_count = 0
            multiplier = 0
            for row in promotion_json:
                if row['Promoted'] == "Yes":
                    # print(row['Employer'])
                    multiplier = .25



            # jobs_industory_json=json.loads(industory_json)
            jobs_industory_json = ast.literal_eval(industory_json)
            competencies = []
            
            if type(jobs_industory_json) != list: 
                for keys in jobs_industory_json.keys():
                    for row in jobs_industory_json[keys]:
                        if row['Industry_Change'] == "Yes":
                            for competency in row["New_Competencies"]:
                                competencies.append(competency)
            
            if type(jobs_industory_json) == list: 
                    for row in jobs_industory_json:
                        if row['Industry_Change'] == "Yes":
                            for competency in row["New_Competencies"]:
                                competencies.append(competency)

            #updating score for all the competencies for promotoin
            if multiplier != 0:
                df["scores"]  = df["scores"] * multiplier

            #updating scores for only Industory related  new competencies
            df.loc[df['Title'].isin(competencies), 'scores'] *= .25

            return df
        except Exception as e:
            return df

    

class OpusJDAnalyzer(OpusResume):
    def __init__(self, api_base: str, api_key: str, api_version: str = "2023-05-15"):
        """Initialize OpenAI API configuration and inherit from OpusResume"""
        super().__init__(api_base, api_key, api_version)

    @staticmethod
    def generate_prompts(resume_text: str, competencies: list) -> dict:
        """
        Generate prompts for LLM insights based on the resume text and competencies.

        :param resume_text: The extracted text of the resume or job description
        :param competencies: List of competencies fetched based on the job title and function
        :return: Dictionary of prompts for different sections
        """
        competencies_str = ', '.join(competencies)
        
        # Generate the prompts based on the competencies and resume/job description text
        prompts = {
            "Job_description": (
                f"""
                "From the Job Description, extract and list the main Core and Functional competencies for that role.
                Strictly follow the JSON output format below. Map the extracted competencies to the following predefined list of competencies: [Insert competencies list here: "{competencies_str}"]. Ensure that only competencies from this list are returned in the output.   
                Competencies should be concise phrases, no more than 3-4 words each. 
                Your response should always be in JSON format which can be deserialized into JSON object. Sample output is enclosed in <Output_Format></Output_Format> tags.
               
                <Output_Format>
                {[{
                "Role": "[Job Title]",
                "Core_Competencies": ["Core Competency 1", "Core Competency 2"],
                "Functional_Competencies": ["Functional Competency 1", "Functional Competency 2"]
                }]}
                </Output_Format>
                """ + resume_text
            )
        }
        
        return prompts

    def analyze_jd(self, filepath: str, competencies: list) -> dict:
        """
        Analyze the job description (JD) by generating LLM-based insights for core and functional competencies.

        :param filepath: Path to the JD file
        :param competencies: List of competencies fetched based on the job role
        :return: Dictionary of results containing insights for each section
        """
        # Step 1: Extract the text from the JD file (PDF or DOCX)
        resume_text = self.extract_resume_text(filepath)
        
        # Validate that extracted text is non-empty
        if not resume_text or not isinstance(resume_text, str):
            raise ValueError("The job description text must be a valid non-empty string.")
        
        # Step 2: Generate prompts for the JD analysis
        prompts = self.generate_prompts(resume_text, competencies)

        # Step 3: Analyze the job description using LLM (Opus GPT) insights
        responsibilities = self.get_insights(prompts["Job_description"])

        # Step 4: Store and return the results in a dictionary
        analysis_results = {
            "Job_description": responsibilities
        }

        return analysis_results

    @staticmethod
    def update_scores_job_description(df: pd.DataFrame, job_description_json: str) -> pd.DataFrame:
        """
        Update the scores of the competencies in the DataFrame based on the Job Description JSON.

        :param df: DataFrame containing 'Title' and 'scores' columns
        :param job_description_json: JSON string of core and functional competencies
        :return: Updated DataFrame with modified scores
        """
        # Parse the job description JSON
        jd = ast.literal_eval(job_description_json)
        if type(jd) == list:
            jd = jd[0]
        competencies = []

        # Collect Core and Functional competencies from the JSON
        for key in jd:
            if key == "Core_Competencies" or key == "Functional_Competencies":
                competencies.extend(jd[key])

        # Update the scores of matching competencies in the DataFrame
        df.loc[df['Title'].isin(competencies), 'scores'] += (3 / 5)

        # Return the updated DataFrame with selected columns
        return df[['Title', 'scores', 'iscore']]


