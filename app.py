from flask import * 
from flask import flash
import json, time
from flask_wtf import FlaskForm
from wtforms import FileField, SubmitField
from werkzeug.utils import secure_filename
import os
import pandas as pd
import requests, json
from flask import Flask, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
import mysql.connector
from mysql.connector import Error
from itsdangerous import URLSafeTimedSerializer, SignatureExpired
from smtplib import SMTP
import ssl 
from flask_mail import Mail, Message
import bcrypt
import io
import tempfile
import pandas as pd
import stripe
from prettytable import PrettyTable 
from prettytable.colortable import ColorTable, Themes
import datetime
import xmltodict
from python_random_strings import random_strings
from Resume_analysis import OpusResume, OpusJDAnalyzer
from opus_conn import create_conn
from opus_conn import get_competencies_hamza,get_job_info_from_db
import secrets
from flask_cors import CORS

app = Flask(__name__)
CORS(app, origins=['http://localhost:5173/', "https://opus-backend.azurewebsites.net/", "https://opus-openai.azurewebsites.net/"])

# Hamza's code
# Assuming you have imported the `OpusResume` class and helper functions
opus_resume = OpusResume(api_base='https://opusgptus2.openai.azure.com/', api_key='c23514f5b6f64bfd84046ab0fad95da0')
opus_jd_analyzer = OpusJDAnalyzer(api_base='https://opusgptus2.openai.azure.com/', api_key='c23514f5b6f64bfd84046ab0fad95da0')

app.config['SECRET_KEY'] = 'test123'
app.config['UPLOAD_FOLDER'] = 'static/files'
app.config['MAIL_SERVER'] = 'smtp.office365.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USERNAME'] = 'CustomerExperience@opusanalytics.ai'

app.config['MAIL_PASSWORD'] = 'W&980415171710aM'
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USE_SSL'] = False
powerbi_blueprint = Blueprint('powerbi', __name__)


mail = Mail(app)

s = URLSafeTimedSerializer(app.config['SECRET_KEY'])
class UploadFile(FlaskForm):
    file = FileField("File")
    submit = SubmitField("Submit File")

@app.route("/")

def home():
    username = ''
    if session.get('token') == None:
        return render_template("index.html")
    else:
        if session.get('username') == None:
            return render_template("index.html")
        else:
            username = session.get('username')
        return render_template("home.html",username=username)


@app.route("/our-offerings")

def our_offerings():
    username = ''
    if session.get('token') == None:
        return render_template("our-offerings.html")
    else:
        if session.get('username') == None:
            return render_template("our-offerings.html")
        else:
            username = session.get('username')
        return render_template("our-offerings-authenticated.html",username=username)


@app.route("/partners")
def partners():
    username = ''
    if session.get('token') == None:
        return render_template("partners.html")
    else:
        if session.get('username') == None:
            return render_template("partners.html")
        else:
            username = session.get('username')
        return render_template("partners-authenticated.html",username=username)


@app.route("/contact", methods = ["GET", "POST"])

def contact():
    username = ''
    if session.get('token') == None:
        return render_template("contact.html")
    else:
        if session.get('username') == None:
            return render_template("contact.html")
        else:
            username = session.get('username')
        return render_template("contact-authenticated.html",username=username)


@app.route("/privacy-policy")

def privacy_policy():
    username = ''
    if session.get('token') == None:
        return render_template("privacy-policy.html")
    else:
        if session.get('username') == None:
            return render_template("privacy-policy.html")
        else:
            username = session.get('username')
        return render_template("privacy-policy-authenticated.html",username=username)


@app.route("/cookie-policy")

def cookie_policy():
    username = ''
    if session.get('token') == None:
        return render_template("cookie-policy.html")
    else:
        if session.get('username') == None:
            return render_template("cookie-policy.html")
        else:
            username = session.get('username')
        return render_template("cookie-policy-authenticated.html",username=username)


@app.route("/terms-of-use")

def terms_of_use():
    if session.get('token') == None:
        return render_template("terms-of-use.html")
    else:
        if session.get('username') == None:
            return render_template("terms-of-use.html")
        else:
            username = session.get('username')
        return render_template("terms-of-use-authenticated.html",username=username)


@app.route("/sign-in", methods = ["GET","POST"])

def sign_in():
    email = request.form.get('User-Name')
    password = request.form.get("Password")
    r = requests.post(url="https://opus-backend.azurewebsites.net/authenticate", json={"username":email,"password":password})
    if request.method == "POST":
        if r.status_code == 200:
            session['token'] = r.json()['token']
            session['username'] = email
            session['type'] = r.json()['user_type']
            
            return redirect(url_for('dashboard'))
        else:
            print(r.status_code)
            flash('Login Failed!','error')
    return (render_template("sign-in.html"))


@app.route("/sign-up", methods = ["GET","POST"])

def sign_up():
    token = ''
    connection = mysql.connector.connect(host='opus-server.mysql.database.azure.com',database='opus_prod',user='opusadmin',password='OAg@1234')
    cursor = connection.cursor()
    full_name = request.form.get("Full-Name")
    email = request.form.get("Email-3")
    password = request.form.get("Password-5")
    
    company = request.form.get("Company-Name")

    check_mail_query = f"SELECT email From users where email = '{email}' AND verification_status != 'Pending'"
    
    if request.method == "POST":
        cursor.execute(check_mail_query)
        cursor.fetchall()
        count = cursor.rowcount
        if count > 0:
            flash('email already exists!','error')
        else:
            password = bytes(password, encoding = 'utf-8')
            salt = bcrypt.gensalt()
            hashed_pwd = bcrypt.hashpw(password, salt)
            hashed_pwd = hashed_pwd.decode()
            insertion_query = f"REPLACE INTO users (username, password, email, full_name, company_name,verification_status) VALUES ('{email}','{hashed_pwd}','{email}', '{full_name}', '{company}', 'Pending')"
            cursor.execute(insertion_query)
            connection.commit()
            connection.close()
            token = s.dumps(email, salt= 'email-confirm')
            msg = Message('Confirm Email', sender='CustomerExperience@opusanalytics.ai', recipients=[email])
            link = url_for('confirmed_mail',token=token, _external=True)
            msg.html = render_template('verification.html',link = link)
            mail.send(msg)
            return (redirect(url_for('confirmation_mail')))

    return (render_template("signup.html",token = token))


@app.route("/template")
def template():
        return render_template("email_template.html", link = "https://opus-analytics.azurewebsites.net/confirmed-mail/", title = "Welcome to Opus!", subTitle="Your Opus Account is Ready", message = "We're excited to welcome you to the Opus community! \nYour manager has created an Opus account for you.\nTo activate your account, please click on the button below:", btnText = "Activate Your Account")

@app.route("/confirmation-mail")
def confirmation_mail():
    
    return (render_template('confirmation-mail.html'))




@app.route("/confirmed-mail/<token>", methods = ["GET","POST"])
def confirmed_mail(token):
    try:
        email = s.loads(token, salt='email-confirm', max_age=3600)
        connection = mysql.connector.connect(host='opus-server.mysql.database.azure.com',database='opus_prod',user='opusadmin',password='OAg@1234')
        cursor = connection.cursor()   
        check_mail_query = f"UPDATE USERS SET verification_status = 'Verified' WHERE email = '{email}'"
        cursor.execute(check_mail_query)
        connection.commit()
        connection.close()

    except SignatureExpired:
        return (render_template('404.html'))
    return (render_template('confirm-email.html'))

def create_subscription(connection, email, subscription, resourceId):
    cursor = connection.cursor()
    create = f"INSERT INTO subscription (email, subscription, subscription_status, resource_id) VALUES ('{email}','{subscription}','Active', '{resourceId}');"
    cursor.execute(create)
    

@app.route("/create", methods = ["POST"])
def create_user():
    
    xml_data = request.data;
    # Parse the XML data using xmltodict
    parsed_data = xmltodict.parse(xml_data)
    # Access data as a Python dictionary
    user = parsed_data['properties']
    
    userInfo = user['userInfo'].split('@')
    full_name = userInfo[0]
    company_name = userInfo[1]
    user_type = userInfo[2]
    
    phoneNumber = user['msisdn']
    
    # user email
    email = user['email']
    
    if (user['productId'] != '1' and user['productId'] != '2' and user['productId'] != '3'):
        return Response(status=500, response=json.dumps({"message":"Invalid product ID"}), mimetype='application/json')
    
    # User type
    if (user['productId'] == '1'):
        userType = 'Start'
    elif (user['productId'] == '2'):
        userType = 'Advance'
    else:
        userType = 'Enable'
    
    # Unique Resource ID for each subscription
    resourceId = user['resourceId']
        
    try:
        connection = mysql.connector.connect(host='opus-server.mysql.database.azure.com',database='opus_prod',user='opusadmin',password='OAg@1234')
        cursor = connection.cursor()   
        # Step 1: Check if the email already exists in subscription table
        subscription_query = f"SELECT subscription FROM subscription WHERE email = '{email}';"
        cursor.execute(subscription_query)
        subscriptions = cursor.fetchall()

        if len(subscriptions) == 0:
            # New user, insert user in user and subscription table
            # For user password
            passwordGenerated = random_strings.random_letters(8)
            tempPassword = passwordGenerated
            password = bytes(passwordGenerated, encoding = 'utf-8')
            salt = bcrypt.gensalt()
            hashed_pwd = bcrypt.hashpw(password, salt)
            hashed_pwd = hashed_pwd.decode()
            create = f"INSERT INTO users (username,password,email,full_name,company_name,user_type,verification_status, phoneNo) VALUES ('{user['email']}','{hashed_pwd}','{user['email']}','{full_name}','{company_name}','{userType}','Verified', '{phoneNumber}');"
            cursor.execute(create)
            
            create_subscription(connection, email, userType, resourceId)

            connection.commit()
            connection.close()
            try:
                msg = Message('Account Created', sender='CustomerExperience@opusanalytics.ai', recipients=[email])
                subtitle= f"Your Opus Account is Ready with temporary password: {tempPassword}"
                msg.html = render_template("email_template.html", link = "https://opusanalytics.ai/sign-in", title = "Welcome to Opus!", subTitle=subtitle, message = "\nWe're excited to welcome you to the Opus community! \nTo activate your account, please click on the button below:", btnText = "Activate Your Account")
                mail.send(msg)
            except Exception as e:
                return Response(status=500, response=json.dumps({"message":"Error"}), mimetype='application/json')
            
            return Response(status=200, response=json.dumps({"message":"Generated successfully", "userEmail": email, "password": tempPassword, "Subscription": userType}), mimetype='application/json')
        # Check if the userType is in the subscriptions
        else:
            for sub in subscriptions:
                if sub[0] == userType:
                    connection.commit()
                    connection.close()
                    return Response(status=500, response=json.dumps({"message":"User subscription already exists"}), mimetype='application/json')
            else:
                # User subscription does not exist, create a new subscription
                create_subscription(connection, email, userType, resourceId)
                connection.commit()
                connection.close()
                
                msg = Message('Account Created', sender='CustomerExperience@opusanalytics.ai', recipients=[email])
                subtitle= f"Your new Opus Account is Ready"
                msg.html = render_template("email_template.html", link = "https://opusanalytics.ai/sign-in", title = "Welcome Again to Opus!", subTitle=subtitle, message = "\nWe're excited to activate your new subscription! \nYou can access your new subscription with the same Opus account you do have, please click on the button below:", btnText = "Activate Your Account")
                mail.send(msg)
                return Response(status=200, response=json.dumps({"message":"Generated successfully", "userEmail": email, "password":'Same User Account Password'  ,"Subscription": userType}), mimetype='application/json')

    except Error as e:
        if(e.errno == 1062):
            return Response(status=500, response=json.dumps({"message":"Email already exists"}), mimetype='application/json')
        return Response(status=500, response=json.dumps({"message":"Error"}), mimetype='application/json')

@app.route("/suspend", methods = ["POST"])
def suspend_user():
    xml_data = request.data;
    # Parse the XML data using xmltodict
    parsed_data = xmltodict.parse(xml_data)
    # Access data as a Python dictionary
    user = parsed_data['properties']
    
    # user email
    email = user['email']
    resourceID = user['resourceId']
        
    try:
        connection = mysql.connector.connect(host='opus-server.mysql.database.azure.com',database='opus_prod',user='opusadmin',password='OAg@1234')
        cursor = connection.cursor()   
        statusQuery = f"select subscription_status from subscription where email = '{email}' and resource_id = '{resourceID}';"
        cursor.execute(statusQuery)
        status = cursor.fetchone()
        if status is None:
            # The user does not exist, throw an error
            xml_error = f"<?xml version='1.0' encoding='UTF-8' standalone='yes'?><feedback><code>404</code><error>User subscription not found</error><resourceId>{user['resourceId']}</resourceId><status>Failed</status><url>https://opusanalytics.ai/</url></feedback>"
            return Response(status=404, response=xml_error, mimetype='application/xml')
        if status[0] == 'Terminated':
            # The user subscription is already terminated
            xml_error = f"<?xml version='1.0' encoding='UTF-8' standalone='yes'?><feedback><code>400</code><error>User subscription already terminated</error><resourceId>{user['resourceId']}</resourceId><status>Failed</status><url>https://opusanalytics.ai/</url></feedback>"
            return Response(status=400, response=xml_error, mimetype='application/xml')
        
        #  Update the subscription status to suspended
        update = f"UPDATE subscription SET subscription_status = 'Suspended' WHERE email = '{email}' and resource_id = '{resourceID}';"
        cursor.execute(update)
        connection.commit()
        connection.close()
        # Return XML Success message
        xml_response = f"<?xml version='1.0' encoding='UTF-8' standalone='yes'?><feedback><code>200</code><error></error><resourceId>{user['resourceId']}</resourceId><status>Success</status><url>https://opusanalytics.ai/</url></feedback>"
        return Response(status=200, response=xml_response, mimetype='application/xml')
    except Error as e:
        return Response(status=500, response=json.dumps({"message":"Error"}), mimetype='application/json')
    
@app.route("/reactivate", methods = ["POST"])
def reactivate_user():
    xml_data = request.data;
    # Parse the XML data using xmltodict
    parsed_data = xmltodict.parse(xml_data)
    # Access data as a Python dictionary
    user = parsed_data['properties']
    
    # user email
    email = user['email']
    resourceID = user['resourceId']
        
    try:
        connection = mysql.connector.connect(host='opus-server.mysql.database.azure.com',database='opus_prod',user='opusadmin',password='OAg@1234')
        cursor = connection.cursor()   
        statusQuery = f"select subscription_status from subscription where email = '{email}' and resource_id = '{resourceID}';"
        cursor.execute(statusQuery)
        status = cursor.fetchone()
        if status is None:
            # The user does not exist, throw an error
            xml_error = f"<?xml version='1.0' encoding='UTF-8' standalone='yes'?><feedback><code>404</code><error>User subscription not found</error><resourceId>{user['resourceId']}</resourceId><status>Failed</status><url>https://opusanalytics.ai/</url></feedback>"
            return Response(status=404, response=xml_error, mimetype='application/xml')
        if status[0] == 'Terminated':
            # The user subscription is already terminated
            xml_error = f"<?xml version='1.0' encoding='UTF-8' standalone='yes'?><feedback><code>400</code><error>User subscription already terminated</error><resourceId>{user['resourceId']}</resourceId><status>Failed</status><url>https://opusanalytics.ai/</url></feedback>"
            return Response(status=400, response=xml_error, mimetype='application/xml')
        
        #  Update the subscription status to suspended
        update = f"UPDATE subscription SET subscription_status = 'Active' WHERE email = '{email}' and resource_id = '{resourceID}';"
        cursor.execute(update)
        connection.commit()
        connection.close()
        # Return XML Success message
        xml_response = f"<?xml version='1.0' encoding='UTF-8' standalone='yes'?><feedback><code>200</code><error></error><resourceId>{user['resourceId']}</resourceId><status>Success</status><url>https://opusanalytics.ai/</url></feedback>"
        return Response(status=200, response=xml_response, mimetype='application/xml')
    except Error as e:
        return Response(status=500, response=json.dumps({"message":"Error"}), mimetype='application/json')
    
            
@app.route("/terminate", methods = ["POST"])
def terminate_user():
    xml_data = request.data;
    # Parse the XML data using xmltodict
    parsed_data = xmltodict.parse(xml_data)
    # Access data as a Python dictionary
    user = parsed_data['properties']
    
    # user email
    email = user['email']
    resourceID = user['resourceId']
        
    try:
        connection = mysql.connector.connect(host='opus-server.mysql.database.azure.com',database='opus_prod',user='opusadmin',password='OAg@1234')
        cursor = connection.cursor()   
        # Check if the subscription status is not already terminated
        statusQuery = f"select subscription_status from subscription where email = '{email}' and resource_id = '{resourceID}';"
        cursor.execute(statusQuery)
        status = cursor.fetchone()
        if status is None:
            # The user does not exist, throw an error
            xml_error = f"<?xml version='1.0' encoding='UTF-8' standalone='yes'?><feedback><code>404</code><error>User subscription not found</error><resourceId>{user['resourceId']}</resourceId><status>Failed</status><url>https://opusanalytics.ai/</url></feedback>"
            return Response(status=404, response=xml_error, mimetype='application/xml')
        if status[0] == 'Terminated':
            # The user subscription is already terminated
            xml_error = f"<?xml version='1.0' encoding='UTF-8' standalone='yes'?><feedback><code>400</code><error>User subscription already terminated</error><resourceId>{user['resourceId']}</resourceId><status>Failed</status><url>https://opusanalytics.ai/</url></feedback>"
            return Response(status=400, response=xml_error, mimetype='application/xml')
        
        #  Update the subscription status to suspended
        update = f"UPDATE subscription SET subscription_status = 'Terminated' WHERE email = '{email}' and resource_id = '{resourceID}';"
        cursor.execute(update)
        connection.commit()
        connection.close()
        # Return XML Success message
        xml_response = f"<?xml version='1.0' encoding='UTF-8' standalone='yes'?><feedback><code>200</code><error></error><resourceId>{user['resourceId']}</resourceId><status>Success</status><url>https://opusanalytics.ai/</url></feedback>"
        return Response(status=200, response=xml_response, mimetype='application/xml')
    except Error as e:
        return Response(status=500, response=json.dumps({"message":"Error"}), mimetype='application/json')
    

@app.route("/getState", methods = ["POST"])
def getUserState():
    xml_data = request.data
    try:
        parsed_data = xmltodict.parse(xml_data)
        user = parsed_data['properties']
        userInfo = user['userInfo'].split('@')
        full_name = userInfo[0]
        company_name = userInfo[1]
        user_type = userInfo[2]
        email = user['email']
        
        resourceID = user['resourceId']

        try:
            connection = mysql.connector.connect(
                host='opus-server.mysql.database.azure.com',
                database='opus_prod',
                user='opusadmin',
                password='OAg@1234'
            )
            cursor = connection.cursor()
            statusQuery = f"select subscription_status from subscription where email = '{email}' and resource_id = '{resourceID}';"
            cursor.execute(statusQuery)
            status = cursor.fetchone()

            if status is None:
                # The user does not exist, throw an error
                xml_error = f"<?xml version='1.0' encoding='UTF-8' standalone='yes'?><feedback><code>404</code><error>User subscription not found</error><resourceId>{user['resourceId']}</resourceId><status>Failed</status><url>https://opusanalytics.ai/</url></feedback>"
                return Response(status=404, response=xml_error, mimetype='application/xml')

            state = status[0]

            connection.commit()
            connection.close()

            xml_response = f"<?xml version='1.0' encoding='UTF-8' standalone='yes'?><feedback><code>200</code><error></error><resourceId>{user['resourceId']}</resourceId><status>{state}</status><url>https://opusanalytics.ai/</url></feedback>"
            return Response(status=200, response=xml_response, mimetype='application/xml')

        except Error as e:
            xml_error = f"<?xml version='1.0' encoding='UTF-8' standalone='yes'?><feedback><code>500</code><error>{e}</error><resourceId>{user['resourceId']}</resourceId><status>Failed</status><url>https://opusanalytics.ai/</url></feedback>"
            return Response(status=500, response=xml_error, mimetype='application/xml')

    except Exception as e:
        xml_error = f"<?xml version='1.0' encoding='UTF-8' standalone='yes'?><feedback><code>400</code><error>Invalid XML or data: {e}</error><resourceId>N/A</resourceId><status>Failed</status><url>https://opusanalytics.ai/</url></feedback>"
        return Response(status=400, response=xml_error, mimetype='application/xml')


@app.route("/add-competency", methods = ["POST"])
def add_competency():
    data = request.get_json()
    connection = mysql.connector.connect(host='opus-server.mysql.database.azure.com',database='opus_prod',user='opusadmin',password='OAg@1234')
    cursor = connection.cursor() 
      
    create = f"INSERT INTO competency_assessment (name, jobFunction, jobTitle, monthsInRole, jobSkills, username, score) VALUES('{data['name']}', '{data['jobFunction']}', '{data['jobTitle']}', '{data['monthsInRole']}', '{data['jobSkills']}', '{data['username']}', '{data['score']}');"
    cursor.execute(create)
    connection.commit()
    connection.close()
    return Response(status=200, response=json.dumps({"message":"Competency added successfully"}), mimetype='application/json')

@app.route("/get-my-competencies", methods = ["POST"])
def get_my_competencies():
    data = request.get_json()
    try:
        # Establish database connection
        connection = mysql.connector.connect(
            host='opus-server.mysql.database.azure.com',
            database='opus_prod',
            user='opusadmin',
            password='OAg@1234'
        )

        # Create cursor object
        cursor = connection.cursor(dictionary=True)  # Use dictionary cursor for easy JSON conversion

        # Execute query
        cursor.execute(f"SELECT * FROM competency_assessment where username='{data['username']}';")

        # Fetch results as a list of dictionaries
        results = cursor.fetchall()

        # Check if any results were found
        if not results:
            return json.dumps({"error": "No data found."})

        # Convert to JSON
        json_data = json.dumps(results)
        
    except mysql.connector.Error as err:
        # Handle database connection errors
        return json.dumps({"error": f"Database connection error: {err}"})

    finally:
        # Close cursor and connection
        if cursor:
            cursor.close()
        if connection:
            connection.close()
            

    return json_data
@app.route("/update-manager-competency", methods = ["POST"])
def update_manager_competency():
    data = request.get_json()
    connection = mysql.connector.connect(host='opus-server.mysql.database.azure.com',database='opus_prod',user='opusadmin',password='OAg@1234')
    cursor = connection.cursor() 
      
    create = f"UPDATE competency_assessment_extra SET jobSkills = '{data['jobSkills']}', score='{data['score']}' where token='{data['token']}';"
    cursor.execute(create)
    connection.commit()
    connection.close()
    return Response(status=200, response=json.dumps({"message":"Competency added successfully"}), mimetype='application/json')
    
@app.route("/get-competency", methods = ["POST"])
def get_competencies():
    data = request.get_json()
    try:
        # Establish database connection
        connection = mysql.connector.connect(
            host='opus-server.mysql.database.azure.com',
            database='opus_prod',
            user='opusadmin',
            password='OAg@1234'
        )

        # Create cursor object
        cursor = connection.cursor(dictionary=True)  # Use dictionary cursor for easy JSON conversion

        # Execute query
        cursor.execute(f"SELECT main.jobFunction, main.jobTitle, main.monthsInRole, main.name, extra.jobSkills FROM competency_assessment_extra as extra inner join competency_assessment as main on main.Id = extra.competency_Id where token='{data['token']}';")

        # Fetch results as a list of dictionaries
        results = cursor.fetchall()

        # Check if any results were found
        if not results:
            return json.dumps({"error": "No data found."})

        # Convert to JSON
        json_data = json.dumps(results[0])
        
    except mysql.connector.Error as err:
        # Handle database connection errors
        return json.dumps({"error": f"Database connection error: {err}"})

    finally:
        # Close cursor and connection
        if cursor:
            cursor.close()
        if connection:
            connection.close()
            

    return json_data
    
@app.route("/calculate-competency", methods = ["POST"])
def calculate_competency_list():
    data = request.get_json()
    
    answers = data['answers']
    monthsInRole = data['monthsInRole']
    
    userExperience = 0;
    if (monthsInRole < 24) :
      # If user has been in role for 1 year
      userExperience = 0.5;
    elif (monthsInRole >= 24 and monthsInRole < 36) :
      # If user has been in role for 2 years
      userExperience = 0.75;
    elif (monthsInRole >= 36 and monthsInRole < 48) :
      # If user has been in role for 3 years
      userExperience = 0.9;
    elif (monthsInRole >= 48 and monthsInRole < 72) :
      # If user has been in role for 4-5 years
      userExperience = 1;
    elif (monthsInRole >= 72 and monthsInRole < 84) :
      # If user has been in role for 6 years
      userExperience = 0.95;
    elif (monthsInRole >= 84 and monthsInRole < 96) :
      # If user has been in role for 7 years
      userExperience = 0.9;
    elif (monthsInRole >= 96 and monthsInRole < 108) :
      # If user has been in role for 8 years
      userExperience = 0.8;
    elif (monthsInRole >= 108 and monthsInRole < 120) :
      # If user has been in role for 9 years
      userExperience = 0.75;
    elif (monthsInRole >= 120) :
      # If user has been in role for 10 years or more
      userExperience = 0.65;

    sum = 0;
    count = 0;    
    for answer in answers:
        sum += answer
        if (answer > 0):
            count += 1;
    
    average = sum / count;
    assessmentScore = average * userExperience;
    if (assessmentScore >= 85) :
      weightedAssessmentScore = 0.85;
    elif (assessmentScore >= 75 and assessmentScore < 85) :
      weightedAssessmentScore = 0.75;
    elif (assessmentScore >= 70 and assessmentScore < 75) :
      weightedAssessmentScore = 0.7;
    elif (assessmentScore >= 65 and assessmentScore < 70) :
      weightedAssessmentScore = 0.65;
    elif (assessmentScore < 65) :
      weightedAssessmentScore = 0.6;
    
    return Response(status=200, response=json.dumps({"message":"Competency calculated successfully", "score": weightedAssessmentScore*100}), mimetype='application/json')
    
@app.route("/reset-password", methods=["GET", "POST"])
def reset_password():
    if request.method == "POST":
        email = request.form.get("Email")

        try:
            connection = mysql.connector.connect(
                host='opus-server.mysql.database.azure.com',
                database='opus_prod',
                user='opusadmin',
                password='OAg@1234'
            )
            cursor = connection.cursor()
            check_mail_query = "SELECT email FROM users WHERE email = %s AND verification_status = 'Verified'"
            cursor.execute(check_mail_query, (email,))
            result = cursor.fetchone()
            if result:
                token = s.dumps(email, salt='email-confirm')

                msg = Message('Confirm Email', sender='CustomerExperience@opusanalytics.ai', recipients=[email])
                link = url_for('new_password', token=token, _external=True)
                msg.html = render_template('reset_password_mail.html', link=link)
                mail.send(msg)
                flash('Reset mail has been sent!', 'success')
            else:
                flash('Email does not exist!', 'error')
        except mysql.connector.Error as err:
            flash(f'Database error: {err}', 'error')
        finally:
            if connection and connection.is_connected():
                cursor.close()
                connection.close()

    return render_template('reset-password.html')
            

@app.route("/new-password/<token>", methods = ["GET","POST"])
def new_password(token):
    try:
        email = s.loads(token, salt='email-confirm', max_age=3600)
        password = request.form.get("Password")
        confirm_password = request.form.get("Confirm-Password")
        if request.method == "POST":
            if password != confirm_password:
                flash('Passwords do not match!','error')
            else:
                password = bytes(password, encoding = 'utf-8')
                salt = bcrypt.gensalt()
                hashed_pwd = bcrypt.hashpw(password, salt)
                hashed_pwd = hashed_pwd.decode()
                connection = mysql.connector.connect(host='opus-server.mysql.database.azure.com',database='opus_prod',user='opusadmin',password='OAg@1234')
                cursor = connection.cursor()   
                check_mail_query = f"UPDATE USERS SET password = '{hashed_pwd}' WHERE email = '{email}'"
                cursor.execute(check_mail_query)
                connection.commit()
                connection.close()
                return redirect(url_for("sign_in"))


    except SignatureExpired:
        return (render_template('404.html'))
    return (render_template('new-password.html'))


@app.route("/log-out", methods = ["GET","POST"])

def log_out():
    session.pop('token',None)
    session.pop('username',None)
    session.pop('type',None) 
    return redirect(url_for('home'))

'''
@app.route("/choose-feature", methods = ["GET","POST"])

def choose_feature():
     if session.get('token') == None:
        return render_template("choose-feature-unauthenticated.html")
     else:
        return (render_template('choose-feature.html'))
'''

@app.route("/compare_resume_job", methods = ["GET","POST"])

def compare_resume_job():
    type = session.get('type')
    username = ''
    enable_multiple = False
    has_job = True
    token = session.get('token')
    if token == None:
        return redirect(url_for('sign_in'))
    elif session.get('username') == None:
        return redirect(url_for('sign_in'))
    else:
       username = session.get('username')
       bearer_token = "Bearer " + token 
       r =  requests.post(url="https://opus-openai.azurewebsites.net/compare/resume/translate", headers={'Authorization': bearer_token})
       if r.status_code == 401:
            return redirect(url_for('sign_in'))
       else:
        tag = "Upload one file and submit a job title!"
        result = ''
        job_title = request.form.get('field-2')
        job_description = request.form.get('job_description')
        language = request.form.get('Language') 
        file = request.form.get('file-field')
        if request.method == "POST":
            file_ = request.files['file-field']       
            file_name = secure_filename(file_.filename)     
            file_.save(os.path.join(app.config['UPLOAD_FOLDER'], file_name))
            test_file = open(os.path.join(app.config['UPLOAD_FOLDER'], file_name), "rb")
            r = requests.post(url="https://opus-openai.azurewebsites.net/compare/resume/translate", headers={'Authorization': bearer_token},data = {"description" : job_title, "job_description" : job_description},  files={"analyze-files" : test_file})
            if r.status_code == 200:
                jsonData = json.dumps(r.json()[0])
                resp = json.loads(jsonData)
                if language == 'English':
                    result = resp['message']['content']
                    result = "</br>".join(result.split("\n"))
                elif language == 'Arabic':
                    result = resp['message']['contentAr']
                    result = "<span dir='rtl'>" + result
                    result = "</br>".join(result.split("\n"))
                    result += "</span>"
                else:
                    result = resp['message']['contentFr']
                    result = "</br>".join(result.split("\n"))
                flash('Files Uploaded Successfully','success')
            elif r.status_code == 403:
                flash('You have used the free features five times. Please subscribe!','warning')
            elif r.status_code == 500:
                return redirect(url_for("sign_in"))
            else:
                flash('Invalid Data','error')
                result = r.status_code
            @after_this_request
            def remove_file(response):
                file_name = secure_filename(file_.filename)
                os.remove(os.path.join(app.config['UPLOAD_FOLDER'], file_name))
                return response
    return (render_template("account-not-premium-form.html",result= result,tag=tag, enable_multiple = enable_multiple,username=username,has_job=has_job, type=type))


@app.route("/compare_resumes", methods = ["GET","POST"])

def compare_resumes():
    type = session.get('type')
    username = ''
    enable_multiple = True
    has_job = True
    token = session.get('token')
    if session.get('token') == None:
        return redirect(url_for('sign_in'))
    elif session.get('username') == None:
        return redirect(url_for('sign_in'))
    else : 
        username = session.get('username')
        bearer_token = "Bearer " + token 
        tag = "Upload two files and submit a job title!"
        result = ''
        job_title = request.form.get('field-2')
        job_description = request.form.get('job_description')
        files = []
        language = request.form.get('Language')
        if request.method == "POST":    
            files_form = request.files.getlist('file-field') 
            
            for file in files_form:    
                file_name = secure_filename(file.filename)
                file.save(os.path.join(app.config['UPLOAD_FOLDER'], file_name))
                file_saved = open(os.path.join(app.config['UPLOAD_FOLDER'], file_name), "rb")
                files.append(("analyze-files",file_saved))
            r = requests.post(url="https://opus-openai.azurewebsites.net/compare/resumes/translate", headers= {'Authorization':bearer_token},data={"description" : job_title, "job_description" : job_description},  files=files)
            if r.status_code == 200:
                jsonData = json.dumps(r.json()[0])
                resp = json.loads(jsonData)
                if language == 'English':
                    result = resp['message']['content']
                    result = "</br>".join(result.split("\n"))
                elif language == 'Arabic':
                    result = resp['message']['contentAr']
                    result = "<span dir='rtl'>" + result
                    result = "</br>".join(result.split("\n"))
                    result += "</span>"
                else:
                    result = resp['message']['contentFr']
                    result = "</br>".join(result.split("\n"))
                flash('Files Uploaded Successfully','success')
            elif r.status_code == 403:
                flash('You have used the free features five times. Please subscribe!','warning')
            elif r.status_code == 500:
                return redirect(url_for("sign_in"))
            else:
                flash('Invalid Data','error')
            @after_this_request
            def remove_file(response):
                for file in files_form: 
                    file_name = secure_filename(file.filename)
                    os.remove(os.path.join(app.config['UPLOAD_FOLDER'], file_name))
                return response
    return (render_template("account-not-premium-form.html",result= result,tag=tag,username=username,enable_multiple=enable_multiple,has_job=has_job,type=type))



@app.route("/compare-resumes-job", methods = ["GET","POST"])

def compare_resumes_job():
    type = session.get('type')
    username = ''
    enable_multiple = True
    has_job = True
    token = session.get('token')
    if session.get('token') == None:
        return (render_template('404.html'))
    elif session.get('username') == None:
        return redirect(url_for('sign_in'))
    else :
        username = session.get('username')
        bearer_token = "Bearer " + token 
        tag = "Upload two files and submit a job title!"
        result = ''
        job_title = request.form.get('field-2')
        job_description = request.form.get('job_description')
        files = []
        language = request.form.get('Language')
        if request.method == "POST":    
            files_form = request.files.getlist('file-field') 
            
            for file in files_form:    
                file_name = secure_filename(file.filename)
                file.save(os.path.join(app.config['UPLOAD_FOLDER'], file_name))
                file_saved = open(os.path.join(app.config['UPLOAD_FOLDER'], file_name), "rb")
                files.append(("analyze-files",file_saved))
            r = requests.post(url="https://opus-openai.azurewebsites.net/compare/each/resume/translate", headers= {'Authorization':bearer_token},data={"description" : job_title, "job_description" : job_description},  files=files)
            if r.status_code == 200:
                jsonData = json.dumps(r.json()[0])
                resp = json.loads(jsonData)
                if language == 'English':
                    result = resp['message']['content'].replace("{","").replace("}","").replace("]","").replace("[","").replace('"', '')
                    result = "</br>".join(result.split("\n"))
                    result = result.replace("pros:","<br/><b>Pros : </b><br/>").replace("cons:","<br/><b>Cons : </b><br/>")
                elif language == 'Arabic':
                    result = resp['message']['contentAr'].replace("{","").replace("}","").replace("]","").replace("[","").replace('"', '')
                    result = "<span dir='rtl'>" + result
                    result = "</br>".join(result.split("\n"))
                    result = result.replace("الايجابيات:","<br/><b>الإيجابيات : </b><br/>").replace("pros:","<br/><b>الإيجابيات : </b><br/>").replace("سلبيات:","<br/><b>سلبيات : </b><br/>").replace("السلبيات:","<br/><b>سلبيات : </b><br/>")
                    result += "</span>"
                else:
                    result = resp['message']['contentFr'].replace("{","").replace("}","").replace("]","").replace("[","").replace('"', '').replace("»","").replace("«","")
                    result = "</br>".join(result.split("\n"))
                    result = result.replace("pros","<br/><b>Pros :</b><br/>").replace("contre","<br/><b>Contre :</b><br/>").replace("Inconvénients","<br/><b>Inconvénients :</b><br/>").replace("pours","<br/><b>Pours :</b><br/>").replace("cons","<br/><b>Cons :</b><br/>")
                flash('Files Uploaded Successfully','success')
            elif r.status_code == 403:
                flash('You have used the free features five times. Please subscribe!','warning')
            elif r.status_code == 500:
                return redirect(url_for("sign_in"))
            else:
                flash('Invalid Data','error')
            @after_this_request
            def remove_file(response):
                for file in files_form: 
                    file_name = secure_filename(file.filename)
                    os.remove(os.path.join(app.config['UPLOAD_FOLDER'], file_name))
                return response
    return (render_template("account-not-premium-form.html",result= result,tag=tag,username=username,enable_multiple=enable_multiple,has_job=has_job,type=type))


@app.route("/analyze-resume", methods = ["GET","POST"])

def analyze_resume():
    type = session.get('type')
    username = ''
    enable_multiple = True
    has_job = False
    token = session.get('token')
    if session.get('token') == None:
        return (render_template('404.html'))
    elif session.get('username') == None:
        return redirect(url_for('sign_in'))
    else :
        username = session.get('username')
        bearer_token = "Bearer " + token 
        tag = "Upload a resume to get analyzed!"
        result = ''
        file = request.form.get('file-field')
        language = request.form.get('Language')
        if request.method == "POST":
            file_ = request.files['file-field']        
            file_name = secure_filename(file_.filename)
                    
            file_.save(os.path.join(app.config['UPLOAD_FOLDER'], file_name))
            test_file = open(os.path.join(app.config['UPLOAD_FOLDER'], file_name), "rb")
            r = requests.post(url="https://opus-openai.azurewebsites.net/analyze/resume/translate",headers= {'Authorization':bearer_token},files={"analyze-file" : test_file})
            if r.status_code == 200:
                jsonData = json.dumps(r.json()[0])
                resp = json.loads(jsonData)
                if language == 'English':
                    result = resp['message']['content']
                    result = "</br>".join(result.split("\n"))
                elif language == 'Arabic':
                    result = resp['message']['contentAr']
                    result = "<span dir='rtl'>" + result
                    result = "</br>".join(result.split("\n"))
                    result += "</span>"
                else:
                    result = resp['message']['contentFr']
                    result = "</br>".join(result.split("\n"))
                flash('Files Uploaded Successfully','success')
            elif r.status_code == 403:
                flash('You have used the free features five times. Please subscribe!','warning')
            elif r.status_code == 500:
                return redirect(url_for("sign_in"))
            else:
                flash('Invalid Data','error')
            @after_this_request
            def remove_file(response):
                file_name = secure_filename(file_.filename)
                os.remove(os.path.join(app.config['UPLOAD_FOLDER'], file_name))
                return response
    return (render_template("account-not-premium-form.html",result= result,tag=tag,username=username,enable_multiple=enable_multiple,has_job=has_job,type=type))


"""
@app.route("/analyze-employees", methods = ["GET","POST"])

def analyze_employees():
    if session.get('token') == None:
        return (render_template('404.html'))
    else :
        tag = "Upload one file for employees data to get analyzed!"
        result = ''
        file = request.form.get('file-field')
        if request.method == "POST":
            file_ = request.files['file-field']        
            file_name = secure_filename(file_.filename)
                    
            file_.save(os.path.join(app.config['UPLOAD_FOLDER'], file_name))
            test_file = open(os.path.join(app.config['UPLOAD_FOLDER'], file_name), "rb")
            r = requests.post(url="https://opus-openai.azurewebsites.net/analyze/employees",files={"analyze-file" : test_file})
            if r.status_code == 200:
                jsonData = json.dumps(r.json()[0])
                resp = json.loads(jsonData)
                result = resp['message']['content']
                result = "</br>".join(result.split("\n"))
                flash('Files Uploaded Successfully','success')

            else:
                flash('Invalid Data','error')
            @after_this_request
            def remove_file(response):
                file_name = secure_filename(file_.filename)
                os.remove(os.path.join(app.config['UPLOAD_FOLDER'], file_name))
                return response
    return (render_template("analyze.html",result= result,tag=tag))

"""

@app.route("/analyze-company-data", methods = ["GET","POST"])

def analyze_company_data():
    results = []
    type = session.get('type')
    username = ''
    token = session.get('token')
    table = ''
    json_array = []
    if session.get('token') == None:
        return redirect(url_for('sign_in'))
    elif session.get('username') == None:
        return redirect(url_for('sign_in'))
    else :
        username = session.get('username')
        bearer_token = 'Bearer ' + token
        tag = "Upload one file for employees data to get analyzed!"
        primary_key = request.form.get('field-2')
        measure = request.form.get('select')
        files = []
        if request.method == "POST":
            files_form = request.files.getlist('file-field') 
            
            print(files_form)
            for file in files_form:  
                file_name = secure_filename(file.filename)
                file.save(os.path.join(app.config['UPLOAD_FOLDER'], file_name))
                file_saved = open(os.path.join(app.config['UPLOAD_FOLDER'], file_name), "rb")
                files.append(("file",file_saved))
            
            print(bearer_token)
            r = requests.post(url="https://opus-backend.azurewebsites.net/upload", headers={'Authorization': bearer_token}, data={'primary_key':primary_key,'uploader':token,'measure':measure},files=files)
            print(r)
            
            if r.status_code == 200:
                # print(r.json())
                
                for item in r.json().get("root", []):
                    measure = item.get("measure", "")
                    result = item.get("result", "")
                    results.append(result)
                    labels = result.split(";")[0]
                    labels = labels.split(",")
                    values = result.split(";")[1:]

                    if len(values) > 0:
                        myTable = PrettyTable(labels)
                        myTable.title = measure 
                        
                        json_values = []
                        for i in values:
                            json_values.append(i.split(","))
                            # myTable.add_row(i.split(","))
                        myTable.align = "l"
                        #myTable.border = True
                        #myTable.padding_width = 3
                        table += myTable.get_html_string(attributes={"class":"tbl"}, format=True)
                    else:
                        json_values.append(values)
                    json_object = {
                        "title": measure,
                        "labels": labels,
                        "values": json_values
                    }
                    json_array.append(json_object)
                flash('Files Uploaded Successfully','success')
            elif r.status_code == 403:
                flash('You have used the free features five times. Please subscribe!','warning')
            elif r.status_code == 401:
                return redirect(url_for('sign_in'))
            else:
                flash('Invalid Data','error')
            @after_this_request
            def remove_file(response):
                for file in files_form: 
                    file_name = secure_filename(file.filename)
                    os.remove(os.path.join(app.config['UPLOAD_FOLDER'], file_name))
                return response
            
            print(json_array)       
    return (render_template("account-form-upload.html",table= table,tag=tag,username=username,type=type, json_array=json_array))



@app.route("/subscription", methods = ["GET","POST"])

def subscription():
    username = ''
    if session.get('token') == None:
        return (render_template("subscription-authenticated.html"))
    
    else:
        if session.get('username') == None:
            return (render_template("subscription-authenticated.html"))
        else:
            username = session.get('username')
        return (render_template("subscription-authenticated.html",username=username))
    

@app.route("/dashboard", methods = ["GET","POST"])
def dashboard():
    username = ''
    type = session.get('type')
    full_name = ''
    company_name = ''
    if session.get('token') == None:
        print("token is none")
        return redirect(url_for('sign_in'))
    else:
        if session.get('username') == None:
            return redirect(url_for('sign_in'))
        else:
            username = session.get('username')
            connection = mysql.connector.connect(host='opus-server.mysql.database.azure.com',database='opus_prod',user='opusadmin',password='OAg@1234')
            cursor = connection.cursor()
            query = f"SELECT full_name,company_name FROM USERS WHERE email = '{username}'"
            cursor.execute(query)
            result = cursor.fetchone()
            full_name = result[0]
            company_name = result[1]
            session['company_name'] = company_name
            
            subscriptions_array = f"SELECT subscription FROM subscription WHERE email = '{username}';"
            subscriptions = cursor.execute(subscriptions_array)
            subscriptions = cursor.fetchall()
            # I want to concatenate the subscriptions into a single string
            subscriptions = [i[0] for i in subscriptions]
            subscriptions = ' '.join(subscriptions)
            # Concatenate the type with them
            if type not in subscriptions:
                subscriptions = type + subscriptions

            connection.commit()
            connection.close()
        if type == 'Partner':
            return (render_template("account.html",username=username,type=type,full_name=full_name,company_name=company_name, subscriptions = subscriptions))
        
        # account-not-premium.html
    return (render_template("account.html",username=username,type=type,full_name=full_name,company_name=company_name, subscriptions = subscriptions))

# """
# def dashboard():
#     username = ''
#     embed_url = ''
#     embed_token = ''
#     report_id = ''
#     type = session.get('type')
#     if session.get('token') == None:
#         return redirect(url_for('sign_in'))
#     else:
#         if session.get('username') == None:
#             return redirect(url_for('sign_in'))
#         elif type == 'Partner':
#             bearer_token = 'Bearer ' + session.get('token')
#             username = session.get('username')
#             tenantid = '6b18344a-5dd4-4c5a-b955-c585da922019'
#             client_id = '0227a726-59b5-4bb1-8e06-db339069aa19'
#             client_secret = 'Us48Q~uf42f_tflzheJUDL8U-j3zQ4NOkf4hxcZ-'
#             r = requests.post(url="https://opus-backend.azurewebsites.net/powerBIADDToken", headers={'Authorization': bearer_token}, data={'tenantid':'6b18344a-5dd4-4c5a-b955-c585da922019','grant_type':'client_credentials','client_id':'0227a726-59b5-4bb1-8e06-db339069aa19','client_secret':'Us48Q~uf42f_tflzheJUDL8U-j3zQ4NOkf4hxcZ-','resource':'https://analysis.windows.net/powerbi/api'})
#             if r.status_code != 200:
#                 return redirect(url_for('sign_in'))
#             else:
#                 access_token = r.json().get("access_token")
#                 workspace = '55661f01-33a3-4beb-aea1-f20245199f2f'
#                 report_id = '507a6282-b50e-461d-97c1-e6d647a26a56'
#                 report = requests.post(url="https://opus-backend.azurewebsites.net/powerBISingleReport", headers={'Authorization': bearer_token}, data={'workspace':workspace,'report':report_id,'token':access_token})
#                 if report.status_code == 200:
#                     embed_url = report.json().get("embedUrl")
#                     dataset_id = 'f9403e03-fa1f-465e-bb2d-aab8b6b856f7'
#                     generate_embed = requests.post(url="https://opus-backend.azurewebsites.net/powerBIGenerateToken", headers={'Authorization': bearer_token}, data={'workspace':workspace,'report':report_id,'token':access_token,'username':'hamza', 'datasets':dataset_id})
#                     if generate_embed.status_code == 200:
#                         embed_token = generate_embed.json().get("token")
    
#             return (render_template("account.html",username=username,type=type,embed_url=embed_url,embed_token=embed_token,report_id=report_id))
#         else:
#             username = session.get('username')
        
#         return (render_template("account-not-premium.html",username=username,type=type))

# """


@app.route("/payment", methods = ["GET","POST"])
def payment():
        
    connection = mysql.connector.connect(host='opus-server.mysql.database.azure.com',database='opus_prod',user='opusadmin',password='OAg@1234')
    cursor = connection.cursor()

    data = request.get_json().get('data').get('object')
    #billing_details = data.get('billing_details', {})

    email = data.get("customer_email")
    description = data['lines']['data'][0]['description']

    period_start = data['lines']['data'][0]['period']['start']
    period_end = data['lines']['data'][0]['period']['end']
    dt_start = datetime.datetime.fromtimestamp(period_start)
    dt_end = datetime.datetime.fromtimestamp(period_end)
    if 'Standard' in description:
        plan = 'SAAS'
    if 'Advanced' in description:
        plan = 'Partner'
    check_mail_query = f"UPDATE users SET user_type = '{plan}', subscription_from_date = '{dt_start}', subscription_expiration_date = '{dt_end}' where email = '{email}' "
    cursor.execute(check_mail_query)
    connection.commit()
    connection.close()
    print(dt_end)
    return (render_template("subscription.html"))

@app.route("/knowledge-graph")
def knowledge_graph():
    username = session.get('username')
    return (render_template("knowledge-graph-starting-form.html", username=username))

@app.route("/knowledge-graph-portal")
def knowledge_graph_portal():
    username = session.get('username')

    return (render_template("knowledge-graph-portal.html", username=username))

@app.route("/knowledge-graph-resume")
def knowledge_graph_resume():
    username = session.get('username')

    return (render_template("knowledge-graph-resume.html", username=username))

@app.route("/knowledge-graph-jd")
def knowledge_graph_jd():
    username = session.get('username')

    return (render_template("knowledge-graph-jd.html", username=username))

@app.route("/salaries_functionality")
def salaries_functionality():
    username = session.get('username')

    return (render_template("salaries-functionality.html", username=username))

@app.route("/manage-users")
def manage_users():
    username = session.get('username')
     # Establish database connection
    connection = mysql.connector.connect(
        host='opus-server.mysql.database.azure.com',
        database='opus_prod',
        user='opusadmin',
        password='OAg@1234'
    )

    # Create cursor object
    cursor = connection.cursor(dictionary=True)  # Use dictionary cursor for easy JSON conversion

    # Execute query
    cursor.execute(f"SELECT username, full_name FROM opus_prod.users where company_name='Manager' and admin_account='{username}';")

    # Fetch results as a list of dictionaries
    results = cursor.fetchall()
    
    managers = json.dumps(results)


    # Close cursor and connection
    if cursor:
        cursor.close()
    if connection:
        connection.close()

    return (render_template("manage-users.html", username=username, managers=managers))

@app.route("/add-user", methods = ["POST"])
def add_user():
    
    data = request.get_json()
    username = session.get('username')
    user_type = session.get('type')
    manager = data['manager']
    email = data['username']
    
    
    # For user password
    passwordGenerated = random_strings.random_letters(8)
    tempPassword = passwordGenerated
    password = bytes(passwordGenerated, encoding = 'utf-8')
    salt = bcrypt.gensalt()
    hashed_pwd = bcrypt.hashpw(password, salt)
    hashed_pwd = hashed_pwd.decode()
    
    try:
        # Establish database connection
        connection = mysql.connector.connect(
            host='opus-server.mysql.database.azure.com',
            database='opus_prod',
            user='opusadmin',
            password='OAg@1234'
        )

        # Cursor and prepared statement
        cursor = connection.cursor()
        if(manager):
            create_user = ("INSERT INTO users (username, password, email, full_name, company_name, user_type, verification_status, manager_account ,admin_account) "
                        "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)")
            cursor.execute(create_user, (data['username'], hashed_pwd, data['username'], data['fullname'], data['userAccess'], user_type, 'Verified', data['manager'], username))

        else:
            create_user = ("INSERT INTO users (username, password, email, full_name, company_name, user_type, verification_status, admin_account) "
                        "VALUES (%s, %s, %s, %s, %s, %s, %s, %s)")
            cursor.execute(create_user, (data['username'], hashed_pwd, data['username'], data['fullname'], data['userAccess'], user_type, 'Verified', username))
        # Commit changes and close connection (important!)
        connection.commit()

        results = jsonify({"success": f"Account created successfully. An email has been sent to with Password: {tempPassword}"})
        msg = Message('Account Created', sender='CustomerExperience@opusanalytics.ai', recipients=[email])
        subtitle= f"Your Opus Account is Ready with temporary password: {tempPassword}"
        if(manager):
            msg.html = render_template("email_template.html", link = "https://opusanalytics.ai/sign-in", title = "Welcome to Opus!", subTitle=subtitle, message = "\nWe're excited to welcome you to the Opus community! \nYour manager has created an Opus account for you.\nTo activate your account, please click on the button below:", btnText = "Activate Your Account")
        else:
            msg.html = render_template("email_template.html", link = "https://opusanalytics.ai/sign-in", title = "Welcome to Opus!", subTitle=subtitle, message = "\nWe're excited to welcome you to the Opus community! \nA Manager Opus account has been created for you.\nTo activate your account, please click on the button below:", btnText = "Activate Your Account")
        mail.send(msg)
        

        return results, 201  # Created status code
    
        
    except mysql.connector.Error as err:
        # Handle database connection errors
        return json.dumps({"error": f"Database connection error: {err}"})

    finally:
        # Close cursor and connection
        if cursor:
            cursor.close()
        if connection:
            connection.close()
            
    return results


@app.route("/get-my-competency", methods = ["POST"])
def get_my_competency():
    username = session.get('username')
    try:
        # Establish database connection
        connection = mysql.connector.connect(
            host='opus-server.mysql.database.azure.com',
            database='opus_prod',
            user='opusadmin',
            password='OAg@1234'
        )

        # Create cursor object
        cursor = connection.cursor(dictionary=True)  # Use dictionary cursor for easy JSON conversion

        # Execute query
        cursor.execute(f"SELECT comp.*, job_title.title FROM competency_assessment as comp inner join job_title on job_title.Id = comp.jobTitle where username='{username}';")

        # Fetch results as a list of dictionaries
        results = cursor.fetchall()

        # Check if any results were found
        if not results:
            return json.dumps({"error": "No data found."})
        
    except mysql.connector.Error as err:
        # Handle database connection errors
        return json.dumps({"error": f"Database connection error: {err}"})

    finally:
        # Close cursor and connection
        if cursor:
            cursor.close()
        if connection:
            connection.close()
            
    return results

@app.route("/knowledge-graph-manager/<id>")
def knowledge_graph_manager(id):
    
    # Render the template with the fetched data
    return (render_template("knowledge-graph-manager.html", id=id))

@app.route("/knowledge-graph-extra", methods = ["POST"])
def knowledge_graph_extra():
    
    data = request.get_json()

    try:
        # Establish database connection
        connection = mysql.connector.connect(
            host='opus-server.mysql.database.azure.com',
            database='opus_prod',
            user='opusadmin',
            password='OAg@1234'
        )

        # Create cursor object
        cursor = connection.cursor(dictionary=True)  # Use dictionary cursor for easy JSON conversion

        # Execute query
        cursor.execute(f"INSERT INTO `competency_assessment_extra` (`competency_Id`, `email`) VALUES (%(competencyId)s, %(email)s);", data)

        # Get the ID of the inserted row
        inserted_id = cursor.lastrowid

        # Commit the changes to the database
        connection.commit()  # This is crucial to save the inserted data

        # Return a success message with the inserted ID
        return jsonify({"message": "Data inserted successfully", "inserted_id": inserted_id})

    except mysql.connector.Error as err:
        # Handle database connection errors
        return json.dumps({"error": f"Database connection error: {err}"})

    finally:
        # Close cursor and connection
        if cursor:
            cursor.close()
        if connection:
            connection.close()
            
@app.route("/knowledge-graph-extra-getId", methods = ["POST"])
def knowledge_graph_extra_getId():
    
    data = request.get_json()


    # Establish database connection
    connection = mysql.connector.connect(
        host='opus-server.mysql.database.azure.com',
        database='opus_prod',
        user='opusadmin',
        password='OAg@1234'
    )

    # Create cursor object
    cursor = connection.cursor(dictionary=True)  # Use dictionary cursor for easy JSON conversion

    # Execute query
    cursor.execute(f"SELECT c.token, c.email, name FROM competency_assessment_extra as c inner join competency_assessment on c.competency_Id = competency_assessment.Id where c.Id='{data['Id']}';")

    # Fetch results as a list of dictionaries
    results = cursor.fetchall()

    # Check if any results were found
    if not results:
        return json.dumps({"error": "No data found."})
    

    # Close cursor and connection
    if cursor:
        cursor.close()
    if connection:
        connection.close()
        
        email = results[0]['email']
        token = results[0]['token']
        name = results[0]['name']
    
        msg = Message('Request for Reassessment', sender='CustomerExperience@opusanalytics.ai', recipients=[email])
        subtitle= f"{name} has requested a reassessment of his skills."
        msg.html = render_template("email_template.html", link = f"https://opusanalytics.ai/knowledge-graph-manager/{token}", title = "Opus Analytics Enable!", subTitle=subtitle, message = "Please click on the button below and you will be redirected:", btnText = "Assessment Link")
        mail.send(msg)
        
    return results[0]
 
@app.route("/get-competency-results", methods = ["GET", "POST"]) 
def get_competency_results():
    username = session.get('username')
    userType = session.get('company_name')
    # Establish database connection
    connection = mysql.connector.connect(
        host='opus-server.mysql.database.azure.com',
        database='opus_prod',
        user='opusadmin',
        password='OAg@1234'
    )

    # Create cursor object
    cursor = connection.cursor()

    # Call stored procedure with username as parameter
    # This is a simple example, you can pass more parameters as needed
    
    if userType == 'Manager':
        cursor.execute(f"CALL opus_prod.get_results_manager('{username}');")
    elif userType == 'Contributor':
        cursor.execute(f"CALL opus_prod.get_results('{username}');")
    else:
        cursor.execute(f"CALL opus_prod.get_results_admin('{username}');")
    
    # Fetch results
    results = cursor.fetchall()
    # Check if any results were found
    if not results:
        return json.dumps({"error": "No data found."})
    

    # Close cursor and connection
    if cursor:
        cursor.close()
    if connection:
        connection.close()
    
    return jsonify(results)
 
            
@app.route("/competency-results")
def competency_results():
    username = session.get('username')

    return (render_template("competency-results.html", username=username))

@app.route("/competency-results-manager")
def competency_results_manager():
    username = session.get('username')
    userType = session.get('company_name')
    
    return (render_template("competency-results-manager.html", username=username, userType=userType))

@app.route("/.well-known/pki-validation/godaddy.html")
def goddadyVerification():
    return (render_template("godaddy.html"))


@app.route('/analyze-resume-hamza', methods=['POST'])
def analyze_resume_hamza():
    resume_file = request.files['resume']
    filename = secrets.token_hex(10) + '_' + resume_file.filename
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    
    try:
        resume_file.save(filepath)
    
        try:
            resume_filepath = filepath
            user_id =  request.form['user_id']

            if not resume_filepath or not user_id:
                return jsonify({'error': 'Missing required parameters.'}), 400

            # Step 1: Extract resume text
            resume_text = opus_resume.extract_resume_text(resume_filepath)
            

            # Step 2: Create connection and get job info
            connection = create_conn()
            job_title, job_function, job_skills,monthsInRole = get_job_info_from_db(connection, user_id)

            # Step 3: Get competencies
            competencies_df = get_competencies_hamza(connection, job_title, job_function, job_skills,monthsInRole)
            
            # Step 4: Analyze resume to generate insights
            analysis_results = opus_resume.analyze_resume(
                resume_text=resume_text,
                competencies=competencies_df["Title"].to_list()
            )

            education_insights = analysis_results["education_details"]
            industry_and_job_insights = analysis_results["jobs_industory"]
            promotions_insights = analysis_results["promotions_details"]
            

            # Step 5: Update competency scores
            updated_df = opus_resume.update_scores_education(df=competencies_df, education_json=education_insights)
            updated_df = opus_resume.update_scores_promotion_industory(
                df=updated_df, promotion_json=promotions_insights, industory_json=industry_and_job_insights
            )

            # Step 6: Calculate overall competency score
            finalScore = updated_df["scores"].mean()

            # Step 7: Make final score two decimal places
            finalScore = round(finalScore, 2)
            
            # Returning the updated competencies in JSON format
            return jsonify({
                'updated_competencies': updated_df.to_dict(orient='records'),
                'finalScore': finalScore
            })

        except Exception as e:
            return jsonify({'error': str(e)}), 500
        
        # I want to delete the file after the analysis is done
        finally:
            os.remove(filepath)
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
@app.route('/analyze_jd_hamza', methods=['POST'])
def analyze_jd_hamza():
    resume_file = request.files['resume']
    filename = secrets.token_hex(10) + '_' + resume_file.filename
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
     
    try:
        resume_file.save(filepath)
    
        try:
            resume_filepath = filepath
            user_id =  request.form['user_id']
            
            # Step 2: Create connection and get job info
            connection = create_conn()
            job_title, job_function, job_skills,monthsInRole = get_job_info_from_db(connection, user_id)

            # Step 3: Get competencies
            competencies_df = get_competencies_hamza(connection, job_title, job_function, job_skills,monthsInRole)
            
            # Step 4: Analyze resume to generate insights
            analysis_results = opus_jd_analyzer.analyze_jd(
                filepath=resume_filepath,
                competencies=competencies_df["Title"].to_list()
            )
            
            # Make this a string
            analysis_results = json.dumps(analysis_results)
            
            # Step 5: Update competency scores
            updated_df = opus_jd_analyzer.update_scores_job_description(df=competencies_df, job_description_json=analysis_results)
            
            # Step 6: Calculate overall competency score
            finalScore = updated_df["scores"].mean()
            
            # Step 7: Make final score two decimal places
            
            finalScore = round(finalScore, 2)
            
            return jsonify({
                'updated_competencies': updated_df.to_dict(orient='records'),
                'finalScore': finalScore
            })
            

        except Exception as e:
                return jsonify({'error': str(e)}), 500
            
        # I want to delete the file after the analysis is done
        finally:
            os.remove(filepath)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
        
@app.route("/add-competency-resume-jd", methods = ["POST"])
def add_competency_resume_jd():
    username = session.get('username')
    
    data = request.get_json()
    analysis_type = data['analysis_type']
    score = data['score']
    competencyId = data['competencyId']
    
     # Establish database connection
    connection = mysql.connector.connect(
        host='opus-server.mysql.database.azure.com',
        database='opus_prod',
        user='opusadmin',
        password='OAg@1234'
    )

    # Create cursor object
    cursor = connection.cursor(dictionary=True)  # Use dictionary cursor for easy JSON conversion

    # Execute query
    cursor.execute(f"INSERT INTO competency_assessment_resume_jd (name,type,score,competencyId) VALUES ('{username}', '{analysis_type}', '{score}', '{competencyId}');")
    connection.commit()
    
    # Close cursor and connection
    if cursor:
        cursor.close()
    if connection:
        connection.close()

    return jsonify({"message": "Data inserted successfully"}), 201

@app.route("/get-salaries-country", methods = ["GET", "POST"]) 
def get_salaries_country():

    # Establish database connection
    connection = mysql.connector.connect(
        host='opus-server.mysql.database.azure.com',
        database='opus_prod',
        user='opusadmin',
        password='OAg@1234'
    )

    # Create cursor object
    cursor = connection.cursor()

    # Call stored procedure with username as parameter
    # This is a simple example, you can pass more parameters as needed
    cursor.execute(f"CALL opus_prod.get_salaries_country();")
    
    
    # Fetch results
    results = cursor.fetchall()
    
    # Add all results to a single list
    familyJobs = []
    for result in results:
        familyJobs.append(result[0])
        
    # Check if any results were found
    if not results:
        return json.dumps({"error": "No data found."})
    

    # Close cursor and connection
    if cursor:
        cursor.close()
    if connection:
        connection.close()
    
    return jsonify(familyJobs)

@app.route("/get-salaries-family", methods = ["GET", "POST"]) 
def get_salaries_family():
    
    data = request.get_json()
    country = data['countryName']

    # Establish database connection
    connection = mysql.connector.connect(
        host='opus-server.mysql.database.azure.com',
        database='opus_prod',
        user='opusadmin',
        password='OAg@1234'
    )

    # Create cursor object
    cursor = connection.cursor()

    # Call stored procedure with username as parameter
    # This is a simple example, you can pass more parameters as needed
    cursor.execute(f"CALL opus_prod.get_salaries_family('{country}');")
    
    
    # Fetch results
    results = cursor.fetchall()
    
    # Add all results to a single list
    familyJobs = []
    for result in results:
        familyJobs.append(result[0])
        
    # Check if any results were found
    if not results:
        return json.dumps({"error": "No data found."})
    

    # Close cursor and connection
    if cursor:
        cursor.close()
    if connection:
        connection.close()
    
    return jsonify(familyJobs)

@app.route("/get-salaries-jobs", methods = ["GET", "POST"]) 
def get_salaries_jobs():
    
    data = request.get_json()
    jobFamily = data['jobFamily']
    country = data['countryName']


    # Establish database connection
    connection = mysql.connector.connect(
        host='opus-server.mysql.database.azure.com',
        database='opus_prod',
        user='opusadmin',
        password='OAg@1234'
    )

    # Create cursor object
    cursor = connection.cursor()

    # Call stored procedure with username as parameter
    # This is a simple example, you can pass more parameters as needed
    cursor.execute(f"CALL opus_prod.get_salaries_job('{ jobFamily }', '{country}');")
    
    
    # Fetch results
    results = cursor.fetchall()
    
    # Add all results to a single list
    jobs = []
    for result in results:
        jobs.append(result[0])
        
    # Check if any results were found
    if not results:
        return json.dumps({"error": "No data found."})
    

    # Close cursor and connection
    if cursor:
        cursor.close()
    if connection:
        connection.close()
    
    return jsonify(jobs)

@app.route("/get-salaries-experience", methods = ["GET", "POST"]) 
def get_salaries_experience():
    
    data = request.get_json()
    jobTitle = data['jobTitle']
    country = data['countryName']
    

    # Establish database connection
    connection = mysql.connector.connect(
        host='opus-server.mysql.database.azure.com',
        database='opus_prod',
        user='opusadmin',
        password='OAg@1234'
    )

    # Create cursor object
    cursor = connection.cursor()

    # Call stored procedure with username as parameter
    # This is a simple example, you can pass more parameters as needed
    cursor.execute(f"CALL opus_prod.get_salaries_experience('{ jobTitle }', '{country}');")
    
    
    # Fetch results
    results = cursor.fetchall()
    
    # Add all results to a single list
    experience = []
    for result in results:
        experience.append(result[0])
        
    # Check if any results were found
    if not results:
        return json.dumps({"error": "No data found."})
    

    # Close cursor and connection
    if cursor:
        cursor.close()
    if connection:
        connection.close()
    
    return jsonify(experience)


@app.route("/get-salaries-chart", methods = ["GET", "POST"]) 
def get_salaries_chart():
    
    data = request.get_json()
    familyJob = data['familyJob']
    jobTitle = data['jobTitle']
    experience = data['experience']
    country = data['countryName']

    # Establish database connection
    connection = mysql.connector.connect(
        host='opus-server.mysql.database.azure.com',
        database='opus_prod',
        user='opusadmin',
        password='OAg@1234'
    )

    # Create cursor object
    cursor = connection.cursor()

    # Call stored procedure with username as parameter
    # This is a simple example, you can pass more parameters as needed

    cursor.execute(f"CALL opus_prod.get_salaries_chart('{ familyJob }','{ jobTitle }','{ experience }', '{country}');")
    
    
    # Fetch results
    results = cursor.fetchall()
        
    # Check if any results were found
    if not results:
        return json.dumps({"error": "No data found."})
    

    # Close cursor and connection
    if cursor:
        cursor.close()
    if connection:
        connection.close()
    
    return jsonify(results[0])

if __name__ == '__main__':
    app.run(debug=True)
    print("Server is running")
