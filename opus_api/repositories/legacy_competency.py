import mysql.connector
import pandas as pd
import ast

def get_job_info_from_db(connection,user_id):
    """
    This function allows the user to input an employee's name and fetches the relevant job title
    and job function from an already established MySQL or PostgreSQL connection.

    :param connection: The established MySQL/PostgreSQL database connection object
    :return: Job title and job function, or a message if the employee is not found
    """
    try:
        # Get name from user input
        # name = input("Enter the candidate's name : ")

        cursor = connection.cursor()

        # SQL query to fetch job function and job title using the employee's name
        query = "SELECT jobFunction, jobTitle, jobSkills,monthsInRole FROM competency_assessment WHERE Id = %s"
        cursor.execute(query, (user_id,))  # Use tuple to pass the name parameter

        # Fetch one result
        result = cursor.fetchone()
        # print(result)
        # return result
        if result:
            return result
             
        else:
            return f"No job information found for {user_id}."

    except Exception as e:
        return f"Error retrieving data: {e}"
    

def experience_percentage(months_in_role):
    years = months_in_role / 12  # Convert months to years

    if years >= 10:
        return 65
    elif years >= 9:
        return 75
    elif years >= 8:
        return 80
    elif years >= 7:
        return 90
    elif years >= 6:
        return 95
    elif years >= 5:
        return 100
    elif years >= 4:
        return 90
    elif years >= 3:
        return 85
    elif years >= 2:
        return 75
    elif years >= 1:
        return 50
    else:
        return 0  # If less than 1 year, no percentage





def get_competencies_hamza(connection,job_title,job_function,job_Skills,monthsInRole):

    
    # Creating a cursor object to interact with the database
    cursor = connection.cursor()

    # Execute SQL queries
    cursor.execute(f"CALL get_assessment({job_title}, {job_function});")
    
    results = cursor.fetchall()
    
    df = pd.DataFrame(results, columns=['Id', 'Title', 'descr','iscore'])
    job_Skills = ast.literal_eval(job_Skills)
    
    if df.shape[0] != len(job_Skills):
        df['scores'] =  job_Skills[:-1] # Removing the last emlement, as leadership competency is not present in table
    else:
        df['scores'] = job_Skills
     
    percentage = experience_percentage(monthsInRole)/100
    df['scores'] = df['scores'] * percentage
    

    return df[['Id', 'Title','scores','iscore']]
    

 


def create_conn():
     # Establishing the connection
    # connection = mysql.connector.connect(
    #     host="opusdb.mysql.database.azure.com ",     # or the IP address of your MySQL server
    #     user="opusadmin", # your MySQL username
    #     password="0pusdbuserpwd1!", # your MySQL password
    #     database='slidedb' # the database you want to connect to
    # )
    
    connection = mysql.connector.connect(
        host='opus-server.mysql.database.azure.com',
        user='opusadmin',
        password='OAg@1234',
        database='opus_prod'
    )
    
    return connection

# if __name__ == "__main__":
#     connection = create_conn()
#     user_id = "Test User"
#     job_title,job_function, job_Skills,monthsInRole = get_job_info_from_db(connection,user_id)
#     print("job_title :",job_title)
#     print("job_function :",job_function)
#     print("Job_Skills :", job_Skills)
#     #job_Skills = ast.literal_eval(job_Skills)

#     compentencies_df = get_competencies_hamza(connection,job_title,job_function,job_Skills,monthsInRole)

#     print(compentencies_df)




