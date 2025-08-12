# routes/auth.py

from flask import Blueprint, request, jsonify, current_app, render_template
from models.users import User
from models.subscriptions import Subscription
import jwt
import datetime
from flask_httpauth import HTTPTokenAuth
import bcrypt # Ensure bcrypt is imported for password hashing/checking
from flask_mail import Message, Mail # Import Message and Mail
from itsdangerous import URLSafeTimedSerializer, SignatureExpired, BadTimeSignature # For secure token generation and exception handling
import os # For accessing Flask secret key

auth_bp = Blueprint('auth', __name__)
auth = HTTPTokenAuth(scheme='Bearer')

# --- Token Validation for Protected Routes ---
@auth.verify_token
def verify_token(token):
    """
    Verifies the JWT token for protected routes.
    """
    try:
        # Decode the token using the secret key and algorithm
        payload = jwt.decode(token, current_app.config['JWT_SECRET_KEY'], algorithms=[current_app.config['JWT_ALGORITHM']])
        user_id = payload.get('user_id')
        user_email = payload.get('user_email')

        if user_id and user_email:
            # Optional: Fetch user from DB to ensure they are still active/exist
            user = User.find_by_email(user_email)
            if user and user.verification_status == 'Verified':
                return user_email # Return user email as current_user
    except jwt.ExpiredSignatureError:
        # Token has expired
        return None
    except jwt.InvalidTokenError:
        # Token is invalid
        return None
    return None

# --- Helper function to send verification email ---
def send_verification_email(user_email, token):
    try:
        mail_instance = current_app.extensions['mail'] # Access the Mail instance
        msg = Message(
            "Verify Your Email Address for [Your App Name]",
            sender=current_app.config['MAIL_DEFAULT_SENDER'],
            recipients=[user_email]
        )
        # Generate the verification URL
        # Ensure your React frontend has a route like /verify-email?token=<token>
        # And your REACT_APP_ORIGIN is set correctly in config.py / env vars
        verification_link = f"{current_app.config['REACT_APP_ORIGIN']}/verify-email?token={token}"

        msg.html = render_template('email/verification_email.html', verification_link=verification_link) # Use a Jinja2 template for email body
        # Or a simple string:
        msg.body = f"Please click the following link to verify your email: {verification_link}"

        mail_instance.send(msg)
        current_app.logger.info(f"Verification email sent to {user_email}")
        return True
    except Exception as e:
        current_app.logger.error(f"Failed to send verification email to {user_email}: {e}")
        return False

# --- User Registration ---
@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"message": "Email and password are required"}), 400

    if User.find_by_email(email):
        return jsonify({"message": "User with this email already exists"}), 409

    new_user = User.create_user(email, password, verification_status='Pending')

    if new_user:
        # Generate a secure, time-sensitive token for email verification
        serializer = URLSafeTimedSerializer(current_app.config['SECRET_KEY'])
        # The token will contain the user's email
        verification_token = serializer.dumps(email, salt='email-verification-salt')

        # Save the token and its expiration to the database
        # Token valid for 24 hours
        token_expiration = datetime.datetime.utcnow() + datetime.timedelta(hours=24)
        User.save_verification_token(new_user.user_id, verification_token, token_expiration)

        # Send the verification email
        if send_verification_email(new_user.email, verification_token):
            return jsonify({"message": "User registered successfully. Please check your email to verify your account."}), 201
        else:
            # If email sending fails, you might want to log this and potentially
            # allow registration but mark it as 'email_send_failed' or similar.
            return jsonify({"message": "User registered, but failed to send verification email. Please contact support."}), 202
    else:
        return jsonify({"message": "Failed to register user"}), 500
    
# --- Email Verification Endpoint ---
@auth_bp.route("/verify-email", methods=["GET"])
def verify_email():
    token = request.args.get('token')
    if not token:
        return jsonify({"message": "Verification token is missing"}), 400

    serializer = URLSafeTimedSerializer(current_app.config['SECRET_KEY'])
    try:
        # Load the token, max_age checks for expiration
        email_from_token = serializer.loads(token, salt='email-verification-salt', max_age=3600*24) # Token valid for 24 hours

        user = User.find_by_email(email_from_token)

        if not user:
            return jsonify({"message": "Invalid or expired verification link"}), 400

        if user.verification_status == 'Verified':
            return jsonify({"message": "Email already verified"}), 200

        # Check if the token in the database matches the one provided
        # and if it's still valid (not expired based on DB timestamp)
        if user.verification_token == token and user.token_expiration > datetime.datetime.utcnow():
            User.update_verification_status(user.user_id, 'Verified')
            # Clear the token from DB after successful verification for security
            User.save_verification_token(user.user_id, None, None)
            return jsonify({"message": "Email verified successfully! You can now log in."}), 200
        else:
            return jsonify({"message": "Invalid or expired verification link"}), 400

    except SignatureExpired:
        return jsonify({"message": "Verification link has expired"}), 400
    except BadTimeSignature:
        return jsonify({"message": "Invalid verification link"}), 400
    except Exception as e:
        current_app.logger.error(f"Error during email verification: {e}")
        return jsonify({"message": "An error occurred during verification"}), 500


# --- User Login & Token Generation ---
@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"message": "Email and password are required"}), 400

    user = User.find_by_email(email)

    if not user:
        return jsonify({"message": "Invalid email or password"}), 401

    # Check if account is verified (if applicable)
    if user.verification_status != 'Verified':
        return jsonify({"message": "Account not verified. Please check your email."}), 403

    # Verify password
    if not user.check_password(password):
        return jsonify({"message": "Invalid email or password"}), 401

    # Generate JWT token
    try:
        # Define token payload (what data to store in the token)
        payload = {
            'user_id': user.user_id,
            'user_email': user.email,
            'exp': datetime.datetime.utcnow() + datetime.timedelta(minutes=30),
            'iat': datetime.datetime.utcnow()
        }
        token = jwt.encode(payload, current_app.config['JWT_SECRET_KEY'], algorithm=current_app.config['JWT_ALGORITHM'])
        
        # Ensure token is a string (PyJWT >= 2.0.0 returns bytes)
        if isinstance(token, bytes):
            print(f"Token is bytes, decoding to string for user {email}")
            token = token.decode('utf-8')
        
        # Get Active Subscription list 
        user_subscription = Subscription.find_by_email(user.email)
        if not user_subscription:
            return jsonify({"message": "No active subscription found for this user"}), 404
        # Initialize an empty list to hold just the subscription names
        serializable_subscription_names = []

        # Iterate through the Subscription objects
        for sub in user_subscription:
            # Append only the 'subscription' name to the list
            serializable_subscription_names.append(sub.subscription)
        
        #  Sort the subscription names free, Start, Advanced, Enable
        serializable_subscription_names.sort(key=lambda x: ['Free', 'Start', 'Advanced', 'Enable'].index(x) if x in ['Free', 'Start', 'Advanced', 'Enable'] else 100)
        return jsonify({
            "message": "Login successful",
            "access_token": token,
            "user": {
                "id": user.user_id,
                "email": user.email,
                "full_name": user.full_name,
                "user_type": user.user_type
            },
            "subscriptions": serializable_subscription_names
        }), 200
    except Exception as e:
        current_app.logger.error(f"Error generating JWT for user {email}: {e}")
        return jsonify({"message": "Could not generate authentication token"}), 500

# --- Protected Test Endpoint ---
@auth_bp.route("/protected-data", methods=["GET"])
@auth.login_required # This decorator protects the route
def protected_data():
    # The `auth.current_user()` will contain the value returned by `verify_token`
    # In our case, it's the user's email.
    return jsonify({
        "message": f"Welcome, {auth.current_user()}! You have access to protected data.",
        "data": "This is sensitive information."
    }), 200