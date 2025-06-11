# models/user.py

from database import get_cursor
import bcrypt # For password hashing
import mysql.connector

class User:
    def __init__(self, id, email, password_hash, full_name, company_name, user_type, verification_status, created_at, login_count, phoneNo):
        self.id = id
        self.email = email
        self.password_hash = password_hash
        self.verification_status = verification_status
        self.full_name = full_name
        self.company_name = company_name
        self.user_type = user_type
        self.created_at = created_at
        self.login_count = login_count
        self.phoneNo = phoneNo
        

    @staticmethod
    def find_by_email(email):
        """
        Finds a user by their email address.
        Returns a User object if found, None otherwise.
        """
        cursor = get_cursor(dictionary=True)
        query = "SELECT id, email, password_hash, full_name, company_name, user_type, verification_status, created_at, login_count, phoneNo FROM users WHERE email = %s"
        cursor.execute(query, (email,))
        user_data = cursor.fetchone()
        if user_data:
            return User(
                id=user_data['id'],
                email=user_data['email'],
                password_hash=user_data['password_hash'],
                full_name=user_data['full_name'],
                company_name=user_data['company_name'],
                user_type=user_data['user_type'],
                created_at=user_data['created_at'],
                login_count=user_data['login_count'],
                phoneNo=user_data['phoneNo'],
                verification_status=user_data['verification_status']
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
            cursor.connection.commit()
            return User(cursor.lastrowid, email, hashed_password, verification_status)
        except mysql.connector.Error as err:
            print(f"Error creating user: {err}")
            cursor.connection.rollback()
            return None