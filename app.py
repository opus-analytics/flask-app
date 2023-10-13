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
    if session.get('token') == None:
        return render_template("index.html")
    else:
        return render_template("home.html")


@app.route("/our-offerings")

def our_offerings():
    if session.get('token') == None:
        return render_template("our-offerings.html")
    else:
        return render_template("our-offerings-authenticated.html")


@app.route("/partners")

def partners():
    if session.get('token') == None:
        return render_template("partners.html")
    else:
        return render_template("partners-authenticated.html")


@app.route("/contact", methods = ["GET", "POST"])

def contact():
    if session.get('token') == None:
        return render_template("contact.html")
    else:
        return render_template("contact-authenticated.html")


@app.route("/privacy-policy")

def privacy_policy():
    if session.get('token') == None:
        return render_template("privacy-policy.html")
    else:
        return render_template("privacy-policy-authenticated.html")


@app.route("/cookie-policy")

def cookie_policy():
    if session.get('token') == None:
        return render_template("cookie-policy.html")
    else:
        return render_template("cookie-policy-authenticated.html")


@app.route("/terms-of-use")

def terms_of_use():
    if session.get('token') == None:
        return render_template("terms-of-use.html")
    else:
        return render_template("terms-of-use-authenticated.html")


@app.route("/sign-in", methods = ["GET","POST"])

def sign_in():
    email = request.form.get('User-Name')
    password = request.form.get("Password")
    r = requests.post(url="https://opus-backend.azurewebsites.net/authenticate", json={"username":email,"password":password})
    if request.method == "POST":
        if r.status_code == 200:
            session['token'] = r.json()['token']
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
    return redirect(url_for('home'))


@app.route("/choose-feature", methods = ["GET","POST"])

def choose_feature():
     if session.get('token') == None:
        return render_template("choose-feature-unauthenticated.html")
     else:
        return (render_template('choose-feature.html'))


@app.route("/compare_resume_job", methods = ["GET","POST"])

def compare_resume_job():
    if session.get('token') == None:
        return (render_template('404.html'))
    else :
        tag = "Upload one file and submit a job title!"
        result = ''
        job_title = request.form.get('field-2')
        file = request.form.get('file-field')
        if request.method == "POST":
            file_ = request.files['file-field']        
            file_name = secure_filename(file_.filename)
                    
            file_.save(os.path.join(app.config['UPLOAD_FOLDER'], file_name))
            test_file = open(os.path.join(app.config['UPLOAD_FOLDER'], file_name), "rb")
            r = requests.post(url="https://opus-openai.azurewebsites.net/compare/resume", headers={"description" : job_title},  files={"analyze-files" : test_file})
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
    return (render_template("upload_single_file.html",result= result,tag=tag))



@app.route("/compare_resumes", methods = ["GET","POST"])

def compare_resumes():
    if session.get('token') == None:
        return (render_template('404.html'))
    else :
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
            r = requests.post(url="https://opus-openai.azurewebsites.net/compare/resumes", headers={"description" : job_title},  files=files)
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
                for file in files_form: 
                    file_name = secure_filename(file.filename)
                    os.remove(os.path.join(app.config['UPLOAD_FOLDER'], file_name))
                return response
    return (render_template("upload.html",result= result,tag=tag))



@app.route("/compare-resumes-job", methods = ["GET","POST"])

def compare_resumes_job():
    if session.get('token') == None:
        return (render_template('404.html'))
    else :
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
            r = requests.post(url="https://opus-openai.azurewebsites.net/compare/each/resume", headers={"description" : job_title},  files=files)
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
                for file in files_form: 
                    file_name = secure_filename(file.filename)
                    os.remove(os.path.join(app.config['UPLOAD_FOLDER'], file_name))
                return response
    return (render_template("upload.html",result= result,tag=tag))


@app.route("/analyze-resume", methods = ["GET","POST"])

def analyze_resume():
    if session.get('token') == None:
        return (render_template('404.html'))
    else :
        tag = "Upload a resume to get analyzed!"
        result = ''
        file = request.form.get('file-field')
        if request.method == "POST":
            file_ = request.files['file-field']        
            file_name = secure_filename(file_.filename)
                    
            file_.save(os.path.join(app.config['UPLOAD_FOLDER'], file_name))
            test_file = open(os.path.join(app.config['UPLOAD_FOLDER'], file_name), "rb")
            r = requests.post(url="https://opus-openai.azurewebsites.net/analyze/resume",files={"analyze-file" : test_file})
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



if __name__ == '__main__':
    app.run(debug=True)