from database import get_cursor, get_db
import mysql.connector


class Assessment:
    def __init__(self, Id, name, jobFunction, jobTitle, monthsInRole, jobSkills, username, score):
        self.my_row_id = Id
        self.email = name
        self.subscription = jobFunction
        self.subscription_status = jobTitle
        self.subscription_from_date = monthsInRole
        self.subscription_expiration_date = jobSkills
        self.resource_id = username
        self.owner = score

    @staticmethod
    def find_by_email(email):
        cursor = get_cursor()
        query = "SELECT * FROM competency_assessment WHERE username = %s"
        cursor.execute(query, (email,))
        assessment_data = cursor.fetchall()
        if assessment_data:
            return [Assessment(*data) for data in assessment_data]
        
        return None
    
    @staticmethod
    def create_assessment(name, jobFunction, jobTitle, monthsInRole, jobSkills, username, score):
        try:
            cursor = get_cursor()
            db = get_db()
            query = """
                INSERT INTO competency_assessment 
                (name, jobFunction, jobTitle, monthsInRole, jobSkills, username, score) 
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """
            cursor.execute(query, (name, jobFunction, jobTitle, monthsInRole, jobSkills, username, score))
            db.commit()
            return cursor.lastrowid
        except mysql.connector.Error as err:
            print(f"Error: {err}")
            return None
        
    def update_assessment(self, name=None, jobFunction=None, jobTitle=None, monthsInRole=None, jobSkills=None, score=None):
        cursor = get_cursor()
        query = """UPDATE competency_assessment
                    SET name = %s, jobFunction = %s, jobTitle = %s, monthsInRole = %s, jobSkills = %s, score = %s 
                    WHERE Id = %s"""        
        cursor.execute(query, (name or self.email, jobFunction or self.subscription, jobTitle or self.subscription_status, 
                               monthsInRole or self.subscription_from_date, jobSkills or self.subscription_expiration_date, 
                               score or self.owner, self.my_row_id))
        get_db().commit()
        # Update the current object's attributes
        if name:
            self.email = name
        if jobFunction:
            self.subscription = jobFunction
        if jobTitle:    
            self.subscription_status = jobTitle     
        if monthsInRole:
            self.subscription_from_date = monthsInRole
        if jobSkills:
            self.subscription_expiration_date = jobSkills
        if score:
            self.owner = score
        return self
    
    @staticmethod
    def delete_assessment(assessment_id):
        cursor = get_cursor()
        query = "DELETE FROM competency_assessment WHERE Id = %s"
        cursor.execute(query, (assessment_id,))
        get_db().commit()
        return cursor.rowcount > 0
    
    @staticmethod
    def get_assessment_by_owner(owner):
        cursor = get_cursor()
        query = "SELECT * FROM competency_assessment WHERE username = %s"
        cursor.execute(query, (owner,))
        assessment_data = cursor.fetchall()
        
        if assessment_data:
            return [Assessment(*data) for data in assessment_data]
        return None
    
    @staticmethod
    def get_assessment_list(jobFunction: str, jobTitle: str) -> list:
        """
        Calls the stored procedure to get a list of required assessments (skills) 
        for a given job function and title.

        Returns:
            A list of dictionaries containing the assessment details (Id, Title, etc.).
        """
        connection = None
        cursor = None
        assessments = []

        # The expected output columns from the stored procedure
        column_names = ['id', 'title', 'description', 'is_core']
        
        try:
            # 1. Get Connection and Cursor
            connection = get_db()
            cursor = connection.cursor()
            
            # 2. Define and Execute the Stored Procedure Call
            sp_call = "CALL opus_prod.get_assessment(%s, %s);"
            cursor.execute(sp_call, (jobFunction, jobTitle))
            
            # 3. Fetch all results
            results = cursor.fetchall()
            
            # 4. Map rows to dictionaries
            for row in results:
                assessment = dict(zip(column_names, row))
                assessments.append(assessment)

            # 5. Crucial: Consume any remaining result sets (necessary for SPs in MySQL connector)
            while cursor.nextset():
                pass

            return assessments
        
        except mysql.connector.Error as err:
            print(f"Database Error fetching assessment list: {err}")
            return [] # Return empty list on failure
        except Exception as e:
            print(f"An unexpected error occurred: {e}")
            return []
        finally:
            # 6. Ensure resources are closed
            if cursor:
                cursor.close()
            if connection:
                connection.close()
                
    @staticmethod
    def get_assessment_job_titles(jobFunction: int):
        """
        Calls the stored procedure to get a list of required assessments (skills) 
        for a given job function and title.

        Returns:
            A list of dictionaries containing the assessment details (Id, Title, etc.).
        """
        connection = None
        cursor = None
        assessments = []

        # The expected output columns from the stored procedure
        column_names = ['id', 'title', 'job_functionality_id']
        
        try:
            # 1. Get Connection and Cursor
            connection = get_db()
            cursor = connection.cursor()
            
            # 2. Define and Execute the Stored Procedure Call
            sp_call = "CALL opus_prod.get_assessment_job_titles(%s);"
            cursor.execute(sp_call, (jobFunction,)) 
            
            # 3. Fetch all results
            results = cursor.fetchall()
            
            print(results)
            
            # 4. Map rows to dictionaries
            for row in results:
                assessment = dict(zip(column_names, row))
                assessments.append(assessment)

            # 5. Crucial: Consume any remaining result sets (necessary for SPs in MySQL connector)
            while cursor.nextset():
                pass

            return assessments
        
        except mysql.connector.Error as err:
            print(f"Database Error fetching assessment list: {err}")
            return [] # Return empty list on failure
        except Exception as e:
            print(f"An unexpected error occurred: {e}")
            return []
        finally:
            # 6. Ensure resources are closed
            if cursor:
                cursor.close()
            if connection:
                connection.close()

    