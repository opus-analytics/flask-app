# routes/auth.py

from flask import Blueprint, request, jsonify, current_app
from models.users import User
import jwt
import datetime
from flask_httpauth import HTTPTokenAuth
import bcrypt # Ensure bcrypt is imported for password hashing/checking

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
            # You might want to fetch the user from the DB here to ensure they still exist and are active
            # For simplicity, we'll just return the user_email
            return user_email
    except jwt.ExpiredSignatureError:
        # Token has expired
        return None
    except jwt.InvalidTokenError:
        # Token is invalid
        return None
    return None

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

    new_user = User.create_user(email, password, verification_status='Verified') # Assuming auto-verified for simplicity, adjust as needed

    if new_user:
        return jsonify({"message": "User registered successfully", "user_id": new_user.id, "email": new_user.email}), 201
    else:
        return jsonify({"message": "Failed to register user"}), 500

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
            'user_id': user.id,
            'user_email': user.email,
            'exp': datetime.datetime.utcnow() + datetime.timedelta(minutes=current_app.config['JWT_ACCESS_TOKEN_EXPIRES_MINUTES']),
            'iat': datetime.datetime.utcnow()
        }
        token = jwt.encode(payload, current_app.config['JWT_SECRET_KEY'], algorithm=current_app.config['JWT_ALGORITHM'])

        return jsonify({
            "message": "Login successful",
            "access_token": token,
            "user": {
                "id": user.id,
                "email": user.email,
                "full_name": user.full_name
            }
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