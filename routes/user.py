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
        print(f"Verifying token: {token}")  # Debugging line to check the token being verified
        print(f"Using secret key: {current_app.config['JWT_SECRET_KEY'][:15]}...")  # Debugging line to check the secret key
        print(f"Using algorithm: {current_app.config['JWT_ALGORITHM']}")
        
        payload = jwt.decode(token, current_app.config['JWT_SECRET_KEY'], algorithms=[current_app.config['JWT_ALGORITHM']])
        # Debugging line to check the decoded payload
        print(f"Decoded payload: {payload}")
        
        user_id = payload.get('user_id')
        user_email = payload.get('user_email')
        
        print(f"User ID: {user_id}, User Email: {user_email}")  # Debugging line to check user ID and email

        if user_id and user_email:
            # You might want to fetch the user from the DB here to ensure they still exist and are active
            # For simplicity, we'll just return the user_email
            return user_email
    except jwt.ExpiredSignatureError:
        print("Token has expired")  # Debugging line for expired token
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
        "user_id": user.user_id,
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
    
    # Check if the user is the owner of the subscription
    owned_subscriptions = Subscription.get_subscription_by_owner(user_email)
    
    assigned_subscriptions = []
    assignable_subscriptions = []
    
    
    if owned_subscriptions is None:
        assigned_subscriptions = []
        assignable_subscriptions = []
    else:
        assigned_subscriptions = [sub for sub in owned_subscriptions if sub.email != None]
        assignable_subscriptions = [sub for sub in owned_subscriptions if sub.email == None]
        
    # Convert Subscription objects to a serializable format
    # This is necessary because Subscription objects may contain non-serializable fields
    if not user_subscription:
        return jsonify({"message": "No user_subscription found for this user"}), 404

    
    try:
        return jsonify({
            "statistics": {
                "my_subscription": {
                    "total_subscriptions": len(user_subscription),
                    "active_subscriptions": len([sub for sub in user_subscription if sub.subscription_status.lower() == 'active']),
                    "inactive_subscriptions": len([sub for sub in user_subscription if sub.subscription_status.lower() != 'active'])
                },
                "owned_subscriptions": {
                    "total_subscriptions": len(owned_subscriptions),
                    "assigned_subscriptions": len(assigned_subscriptions),
                    "assignable_subscriptions": len(assignable_subscriptions)
                }
            },
            "subscriptions": [sub.to_dict() for sub in user_subscription],
            "owned_subscriptions": {
                "assigned": [sub.to_dict() for sub in assigned_subscriptions],
                "assignable": [sub.to_dict() for sub in assignable_subscriptions]
            }
        }), 200
    
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