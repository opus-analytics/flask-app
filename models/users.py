# models/user.py

from database import get_cursor, get_db
import bcrypt # For password hashing
import mysql.connector
import datetime
class User:
    def __init__(self, user_id, email, password_hash,
                 full_name=None, company_name=None, user_type='Standard', # Default user_type
                 verification_status='Pending', # Default verification status
                 created_at=None, login_count=0, phoneNo=None, # Default created_at, login_count
                 verification_token=None, token_expiration=None):
        self.user_id = user_id
        self.email = email
        self.password_hash = password_hash
        self.full_name = full_name
        self.company_name = company_name
        self.user_type = user_type
        self.verification_status = verification_status
        self.created_at = created_at if created_at is not None else datetime.datetime.utcnow() # Set default if not provided
        self.login_count = login_count
        self.phoneNo = phoneNo
        self.verification_token = verification_token
        self.token_expiration = token_expiration
        

    @staticmethod
    def find_by_email(email):
        """
        Finds a user by their email address.
        Returns a User object if found, None otherwise.
        """
        cursor = get_cursor(dictionary=True)
        query = "SELECT user_id, email, password_hash, full_name, company_name, user_type, verification_status, created_at, login_count, phoneNo, verification_token, token_expiration FROM users WHERE email = %s"
        cursor.execute(query, (email,))
        user_data = cursor.fetchone()
        if user_data:
            return User(
                user_id=user_data['user_id'],
                email=user_data['email'],
                password_hash=user_data['password_hash'],
                full_name=user_data['full_name'],
                company_name=user_data['company_name'],
                user_type=user_data['user_type'],
                created_at=user_data['created_at'],
                login_count=user_data['login_count'],
                phoneNo=user_data['phoneNo'],
                verification_status=user_data['verification_status'],
                verification_token=user_data['verification_token'],
                token_expiration=user_data['token_expiration']
            )
        return None

    def check_password(self, password):
        """
        Checks if the provided password matches the stored hash.
        """
        # Ensure password_hash is bytes before comparing with bcrypt
        return bcrypt.checkpw(password.encode('utf-8'), self.password_hash.encode('utf-8'))

    @staticmethod
    def create_user(email, password, verification_status='Pending'):
        """
        Creates a new user in the database.
        Hashes the password before storing.
        Returns the new User object or None on failure.
        """
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        cursor = get_cursor()
        
        try:
            query = "INSERT INTO users (email, password_hash, verification_status) VALUES (%s, %s, %s)"
            cursor.execute(query, (email, hashed_password, verification_status))
            get_db().commit()
            return User(cursor.lastrowid, email, hashed_password, verification_status)
        except mysql.connector.Error as err:
            print(f"Error creating user: {err}")
            get_db().rollback()
            return None
        
    @staticmethod
    def update_verification_status(user_id, status):
        cursor = get_cursor()
        try:
            query = "UPDATE users SET verification_status = %s WHERE user_id = %s"
            cursor.execute(query, (status, user_id))
            get_db().commit()
            return True
        except Exception as err:
            print(f"Error updating verification status for user {user_id}: {err}")
            get_db().rollback()
            return False

    @staticmethod
    def save_verification_token(user_id, token, expires_at):
        cursor = get_cursor()
        try:
            query = "UPDATE users SET verification_token = %s, token_expiration = %s WHERE user_id = %s"
            cursor.execute(query, (token, expires_at, user_id))
            get_db().commit()
            return True
        except Exception as err:
            print(f"Error saving verification token for user {user_id}: {err}")
            get_db().rollback()
            return False