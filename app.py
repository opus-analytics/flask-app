from flask import * 
from flask import flash
import json, time
from flask_wtf import FlaskForm
from wtforms import FileField, SubmitField
from werkzeug.utils import secure_filename
import os
import pandas as pd
import requests, json
from flask import Flask, request
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
import jwt





app = Flask(__name__)
app.config['SECRET_KEY'] = 'test123'
app.config['UPLOAD_FOLDER'] = 'static/files'
app.config['MAIL_SERVER'] = 'smtp.office365.com'
app.config['UPLOAD_FOLDER']
app.config['MAIL_PORT'] = 587
app.config['MAIL_USERNAME'] = 'eman.abdelhamied@rightfoot.org'
app.config['MAIL_PASSWORD'] = 'Em@281194'
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USE_SSL'] = False

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
        username = session.get('username')

        return render_template("home.html",username=username)


@app.route("/our-offerings")

def our_offerings():
    username = ''
    if session.get('token') == None:
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
        username = session.get('username')
        return render_template("partners-authenticated.html",username=username)


@app.route("/contact", methods = ["GET", "POST"])

def contact():
    username = ''
    if session.get('token') == None:
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
        username = session.get('username')
        return render_template("privacy-policy-authenticated.html",username=username)


@app.route("/cookie-policy")

def cookie_policy():
    username = ''
    if session.get('token') == None:
        return render_template("cookie-policy.html")
    else:
        username = session.get('username')
        return render_template("cookie-policy-authenticated.html",username=username)


@app.route("/terms-of-use")

def terms_of_use():
    if session.get('token') == None:
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
            return redirect(url_for('home'))
        else:
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
            msg = Message('Confirm Email', sender='eman.abdelhamied@rightfoot.org', recipients=[email])
            link = url_for('confirmed_mail',token=token, _external=True)
            msg.html = render_template('verification.html',link = link)
            mail.send(msg)
            return (redirect(url_for('confirmation_mail')))

    return (render_template("signup.html",token = token))


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


@app.route("/reset-password", methods = ["GET","POST"])
def reset_password():
    email = request.form.get("Email")
    token = s.dumps(email, salt= 'email-confirm')
    msg = Message('Confirm Email', sender='eman.abdelhamied@rightfoot.org', recipients=[email])
    link = url_for('new_password',token=token, _external=True)
    #msg.body = 'Your Confirmation link is {}'.format(link)
    msg.html = render_template('reset_password_mail.html',link = link)
    if request.method == "POST":
        mail.send(msg)
        flash('Reset mail has been sent!','success')
        
    return (render_template('reset-passowrd.html',token=token))
            

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
    else:
       username = session.get('username')
       bearer_token = "Bearer " + token 
       r =  requests.post(url="https://opus-openai.azurewebsites.net/compare/resume", headers={'Authorization': bearer_token})
       if r.status_code == 401:
            return redirect(url_for('sign_in'))
       else:
        tag = "Upload one file and submit a job title!"
        result = ''
        job_title = request.form.get('field-2')
        file = request.form.get('file-field')
        if request.method == "POST":
            file_ = request.files['file-field']        
            file_name = secure_filename(file_.filename)     
            file_.save(os.path.join(app.config['UPLOAD_FOLDER'], file_name))
            test_file = open(os.path.join(app.config['UPLOAD_FOLDER'], file_name), "rb")
            r = requests.post(url="https://opus-openai.azurewebsites.net/compare/resume", headers={'Authorization': bearer_token},data = {"description" : job_title},  files={"analyze-files" : test_file})
            if r.status_code == 200:
                jsonData = json.dumps(r.json()[0])
                resp = json.loads(jsonData)
                result = resp['message']['content']
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
    else :
        username = session.get('username')
        bearer_token = "Bearer " + token 
        tag = "Upload two files and submit a job title!"
        result = ''
        job_title = request.form.get('field-2')
        files = []
        if request.method == "POST":    
            files_form = request.files.getlist('file-field') 
            
            for file in files_form:    
                file_name = secure_filename(file.filename)
                file.save(os.path.join(app.config['UPLOAD_FOLDER'], file_name))
                file_saved = open(os.path.join(app.config['UPLOAD_FOLDER'], file_name), "rb")
                files.append(("analyze-files",file_saved))
            r = requests.post(url="https://opus-openai.azurewebsites.net/compare/resumes", headers= {'Authorization':bearer_token},data={"description" : job_title},  files=files)
            if r.status_code == 200:
                jsonData = json.dumps(r.json()[0])
                resp = json.loads(jsonData)
                result = resp['message']['content']
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
    else :
        username = session.get('username')
        bearer_token = "Bearer " + token 
        tag = "Upload two files and submit a job title!"
        result = ''
        job_title = request.form.get('field-2')
        files = []
        if request.method == "POST":    
            files_form = request.files.getlist('file-field') 
            
            for file in files_form:    
                file_name = secure_filename(file.filename)
                file.save(os.path.join(app.config['UPLOAD_FOLDER'], file_name))
                file_saved = open(os.path.join(app.config['UPLOAD_FOLDER'], file_name), "rb")
                files.append(("analyze-files",file_saved))
            r = requests.post(url="https://opus-openai.azurewebsites.net/compare/each/resume", headers= {'Authorization':bearer_token},data={"description" : job_title},  files=files)
            if r.status_code == 200:
                jsonData = json.dumps(r.json()[0])
                resp = json.loads(jsonData)
                result = resp['message']['content']
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


@app.route("/analyze-resume", methods = ["GET","POST"])

def analyze_resume():
    type = session.get('type')
    username = ''
    enable_multiple = True
    has_job = False
    token = session.get('token')
    if session.get('token') == None:
        return (render_template('404.html'))
    else :
        username = session.get('username')
        bearer_token = "Bearer " + token 
        tag = "Upload a resume to get analyzed!"
        result = ''
        file = request.form.get('file-field')
        if request.method == "POST":
            file_ = request.files['file-field']        
            file_name = secure_filename(file_.filename)
                    
            file_.save(os.path.join(app.config['UPLOAD_FOLDER'], file_name))
            test_file = open(os.path.join(app.config['UPLOAD_FOLDER'], file_name), "rb")
            r = requests.post(url="https://opus-openai.azurewebsites.net/analyze/resume",headers= {'Authorization':bearer_token},files={"analyze-file" : test_file})
            if r.status_code == 200:
                jsonData = json.dumps(r.json()[0])
                resp = json.loads(jsonData)
                result = resp['message']['content']
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
    type = session.get('type')
    username = ''
    enable_multiple = True
    token = session.get('token')
    table = ''
    if session.get('token') == None:
        return (render_template('404.html'))
    else :
        tag = "Upload one file for employees data to get analyzed!"
        
        if request.method == "POST":
            data_dic = {
                    'Measure': ['Hr employee ratio'],
                    'Percentage': ['35.56%']}
            columns = ['Measure', 'Percentage']
            flash('Files Uploaded Successfully','success')
            df = pd.DataFrame(data_dic, columns=columns)
            table = df.to_html(classes='table table-stripped',index=False)

            
    return (render_template("analyze-company-data.html",table= table,tag=tag,username=username,enable_multiple=enable_multiple,type=type))



"""
@app.route("/compare_resumes-demo", methods = ["GET","POST"])

def compare_resumes_demo():
    if session.get('token') == None:
        return (render_template('404.html'))
    else :
        tag = "Upload two files and submit a job title!"
        result = ''
        if request.method == "POST":    
     
            result = '''AMK's Resume:\n AMK holds extensive experience working with large multi-national and private sector corporations.
            He has also worked in various government positions, including the Ministry of Finance in Egypt and Kenya, managing financial affairs related to PPP implementation. 
            As an independent expert on PPP, he advised governments on numerous projects and achieved financial closure for several projects. 
            His previous roles include being a Finance Manager and Audit Manager, and he is a certified Chartered Accountant.
            \n\nMF's Resume:
            \nMF has a strong financial background with experience in government administration and is skilled in Procurement, Financial Analysis, and Team Management. 
            She has worked as a Financial Analyst in the Ministry of Finance. 
            She evaluated financial studies and models, prepared project documents, monitored operational procedures, 
            coordinated with all parties throughout project phases and assisted in determining the value for money of received financial bids.
            She is also an MBA holder.
            \n\nComparison:\nOverall, both candidates possess strong financial backgrounds and have had extensive experience working in government institutions. 
            However, when it comes to the finance manager role, AMK appears to be more qualified due to his extensive experience in managerial roles such as Finance Manager and General Manager at the Ministry of Finance. 
            He also has specialized qualifications such as a Chartered Accountant credential. 
            Furthermore, his experience working with multi-national and large private sector corporations gives him a broader view of financial management in different contexts, making him more suitable for a Finance Manager role. 
            MF, while having strong financial analysis skills, lacks the leadership and managerial experience that AMK possesses.'''
            flash('Files Uploaded Successfully','success')
            
    return (render_template("upload.html",result= result,tag=tag))
"""

@app.route("/subscription", methods = ["GET","POST"])

def subscription():
    username = ''
    if session.get('token') == None:
        return (render_template("subscription.html"))
    
    else:
        username = session.get('username')
        return (render_template("subscription-authenticated.html",username=username))

'''
@app.route("/payment", methods = ["GET","POST"])

def payment():
    connection = mysql.connector.connect(host='opus-server.mysql.database.azure.com',database='opus_prod',user='opusadmin',password='OAg@1234')
    cursor = connection.cursor()

    check_mail_query = "UPDATE users SET user_type = 'SAAS' where email = 'eman.a.hamied@gmail.com' "
    cursor.execute(check_mail_query)
    connection.commit()
    connection.close()
    print(request.data)
    return (render_template("subscription.html"))
'''

@app.route("/dashboard", methods = ["GET","POST"])

def dashboard():
    username = ''
    type = session.get('type')
    if session.get('token') == None:
        return redirect(url_for('sign_in'))
    else:
        username = session.get('username')
        return (render_template("account-not-premium.html",username=username,type=type))

if __name__ == '__main__':
    app.run(debug=True)