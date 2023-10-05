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
from itsdangerous import URLSafeTimedSerializer

from flask_mail import Mail, Message

app = Flask(__name__)
app.config['SECRET_KEY'] = 'test123'
app.config['UPLOAD_FOLDER'] = 'static/files'
app.config['MAIL_SERVER'] = 'smtp-mail.outlook.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USERNAME'] = 'info@opusanalytics.ai'
app.config['MAIL_PASSWORD'] = 'YhnvfR^1998'
app.config['MAIL_USE_TLS'] = False
app.config['MAIL_USE_SSL'] = True
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
    connection = mysql.connector.connect(host='opus-server.mysql.database.azure.com',database='opus_prod',user='opusadmin',password='OAg@1234')
    cursor = connection.cursor()
    full_name = request.form.get("Full-Name")
    email = request.form.get("Email-3")
    password = request.form.get("Password-5")
    company = request.form.get("Company-Name")

    check_mail_query = f"SELECT email From users where email = '{email}'"
    
    if request.method == "POST":
        cursor.execute(check_mail_query)
        cursor.fetchall()
        count = cursor.rowcount
        if count > 0:
            flash('email already exists!','error')
        else:
            hashed_pwd = generate_password_hash(password)
            insertion_query = f"INSERT INTO users (username, password, email, full_name, company_name,verification_status) VALUES ('{email}','{hashed_pwd}','{email}', '{full_name}', '{company}', 'Pending')"
            cursor.execute(insertion_query)
            connection.commit()
            token = s.dumps(email, salt= 'email-confirm')
            #msg = Message('Confirm Email', sender='info@opusanalytics.ai', recipients=[email])
            #link = url_for('confirm_email',token=token, external=True)
            return (redirect(url_for('confirmation_mail')))

    return (render_template("signup.html"))


@app.route("/confirmation-mail")
def confirmation_mail():
    
    return (render_template('confirmation-mail.html'))
            

@app.route("/log-out", methods = ["GET","POST"])

def log_out():
    session.pop('token',None)
    return redirect(url_for('home'))




@app.route("/success", methods = ["POST"])

def success():
    file = request.files['file']
    file_name = secure_filename(file.filename)
    file.save(os.path.join(app.config['UPLOAD_FOLDER'], file_name))
    df = pd.read_csv(os.path.join(app.config['UPLOAD_FOLDER'], file_name))
    df = df.head(5).to_html()
    return(df)

if __name__ == '__main__':
    app.run(debug=True)