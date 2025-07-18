from database import get_cursor
import mysql.connector

class Subscription:
    def __init__(self, my_row_id, email, subscription, subscription_status, subscription_from_date, subscription_expiration_date, resource_id, owner, tag='user'):
        self.my_row_id = my_row_id
        self.email = email
        self.subscription = subscription
        self.subscription_status = subscription_status
        self.subscription_from_date = subscription_from_date
        self.subscription_expiration_date = subscription_expiration_date
        self.resource_id = resource_id
        self.owner = owner
        self.tag = tag

    @staticmethod
    def find_by_email(email, include_inactive=False):
        cursor = get_cursor()
        query = """
            SELECT * FROM subscription 
            WHERE email = %s
        """
        if not include_inactive:
            query += " AND subscription_status = 'Active'"
        query += " ORDER BY subscription_from_date DESC"
        
        cursor.execute(query, (email,))
        subscription_data = cursor.fetchall()
        if subscription_data:
            return [Subscription(*data) for data in subscription_data]
        
        return None
    
    @staticmethod
    def find_active_by_email(email):
        cursor = get_cursor()
        query = """
            SELECT * FROM subscription 
            WHERE email = %s AND subscription_status = 'active'
        """
        cursor.execute(query, (email,))
        subscription_data = cursor.fetchall()
        if subscription_data:
            return [Subscription(*data) for data in subscription_data]
        
        return None
    
    @staticmethod
    def find_by_resource_id(resource_id):
        cursor = get_cursor()
        query = "SELECT * FROM subscription WHERE resource_id = %s"
        cursor.execute(query, (resource_id,))
        subscription_data = cursor.fetchone()
        if subscription_data:
            return Subscription(*subscription_data)
        return None
    
    @staticmethod
    def create_subscription(email, subscription, subscription_status, subscription_from_date, subscription_expiration_date, resource_id, owner, tag='user'):
        try:
            cursor = get_cursor()
            query = """
                INSERT INTO subscription (email, subscription, subscription_status, subscription_from_date, 
                                        subscription_expiration_date, resource_id, owner, tag)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """
            cursor.execute(query, (email, subscription, subscription_status, subscription_from_date,
                                subscription_expiration_date, resource_id, owner, tag))
            cursor.connection.commit()
            return Subscription.find_by_email(email)  # Return the created subscription object
        except mysql.connector.Error as err:
            print(f"Error: {err}")
            return None
        
    def update_subscription(self, subscription_status=None, subscription_expiration_date=None):
        cursor = get_cursor()
        query = "UPDATE subscription SET subscription_status = %s, subscription_expiration_date = %s WHERE my_row_id = %s"
        cursor.execute(query, (subscription_status, subscription_expiration_date, self.my_row_id))
        cursor.connection.commit()
        # Update the current object's attributes
        if subscription_status:
            self.subscription_status = subscription_status
        if subscription_expiration_date:
            self.subscription_expiration_date = subscription_expiration_date
        return self
       
        
    def delete_subscription(self):
        cursor = get_cursor()
        query = "DELETE FROM subscription WHERE my_row_id = %s"
        cursor.execute(query, (self.my_row_id,))
        cursor.connection.commit()
        return True