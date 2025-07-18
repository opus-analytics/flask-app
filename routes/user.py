# routes/auth.py

from flask import Blueprint, request, jsonify, current_app
from models.users import User
from models.subscriptions import Subscription
import jwt
import datetime
from flask_httpauth import HTTPTokenAuth

user_bp = Blueprint('user', __name__)
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

# --- Get User Profile ---
@user_bp.route("/profile", methods=["GET"])
@auth.login_required # This decorator protects the route
def get_user_profile():
    user_email = auth.current_user()
    user = User.find_by_email(user_email)
    if not user:
        return jsonify({"message": "User not found"}), 404
    return jsonify({
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "company_name": user.company_name,
        "user_type": user.user_type,
        "created_at": user.created_at,
        "login_count": user.login_count,
        "phoneNo": user.phoneNo,
        "verification_status": user.verification_status
    }), 200
   
# --- Get User Subscription List ---
@user_bp.route("/subscriptions-all", methods=["GET"])
@auth.login_required # This decorator protects the route
def get_user_subscriptions_all():
    user_email = auth.current_user()
    user = User.find_by_email(user_email)
    if not user:
        return jsonify({"message": "User not found"}), 404
    # Assuming you have a method to get subscriptions by user email
    user_subscription = Subscription.find_by_email(user_email, include_inactive=True)
    
    # Object of Subscription is not JSON serializable, so we need to convert it to a dictionary
    if not user_subscription:
        return jsonify({"message": "No user_subscription found for this user"}), 404
    
    try:
        serializable_subscriptions = []
        for sub in user_subscription:
            serializable_subscriptions.append({
                " my_row_id": sub. my_row_id,
                "email": sub.email,
                "subscription": sub.subscription,
                "subscription_status": sub.subscription_status,
                # Convert date objects to ISO 8601 strings, safely handling None
                "subscription_from_date": sub.subscription_from_date.isoformat() if sub.subscription_from_date else None,
                "subscription_expiration_date": sub.subscription_expiration_date.isoformat() if sub.subscription_expiration_date else None,
                "resource_id": sub.resource_id,
                "owner": sub.owner,
                "tag": sub.tag
            })
        return jsonify(serializable_subscriptions), 200
    
    except Exception as e:
        current_app.logger.error(f"Error serializing subscriptions for user {user_email}: {e}")
        return jsonify({"message": "Error retrieving subscriptions"}), 500
    
# --- Get User Subscription List ---
@user_bp.route("/subscriptions", methods=["GET"])
@auth.login_required # This decorator protects the route
def get_user_subscriptions():
    user_email = auth.current_user()
    user = User.find_by_email(user_email)
    if not user:
        return jsonify({"message": "User not found"}), 404
    # Assuming you have a method to get subscriptions by user email
    user_subscription = Subscription.find_by_email(user_email)
    
    # Object of Subscription is not JSON serializable, so we need to convert it to a dictionary
    if not user_subscription:
        return jsonify({"message": "No user_subscription found for this user"}), 404
    
    try:
        serializable_subscriptions = []
        for sub in user_subscription:
            serializable_subscriptions.append({
                " my_row_id": sub. my_row_id,
                "email": sub.email,
                "subscription": sub.subscription,
                "subscription_status": sub.subscription_status,
                # Convert date objects to ISO 8601 strings, safely handling None
                "subscription_from_date": sub.subscription_from_date.isoformat() if sub.subscription_from_date else None,
                "subscription_expiration_date": sub.subscription_expiration_date.isoformat() if sub.subscription_expiration_date else None,
                "resource_id": sub.resource_id,
                "owner": sub.owner,
                "tag": sub.tag
            })
        return jsonify(serializable_subscriptions), 200
    
    except Exception as e:
        current_app.logger.error(f"Error serializing subscriptions for user {user_email}: {e}")
        return jsonify({"message": "Error retrieving subscriptions"}), 500
    
# # --- Protected Test Endpoint ---
# @user_bp.route("/protected-data", methods=["GET"])
# @auth.login_required # This decorator protects the route
# def protected_data():
#     # The `auth.current_user()` will contain the value returned by `verify_token`
#     # In our case, it's the user's email.
#     return jsonify({
#         "message": f"Welcome, {auth.current_user()}! You have access to protected data.",
#         "data": "This is sensitive information."
#     }), 200