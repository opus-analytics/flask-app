# database.py

import mysql.connector
from flask import current_app, g

def get_db():
    """
    Establishes a database connection and stores it in Flask's 'g' object.
    If a connection already exists for the current request, it reuses it.
    """
    if 'db' not in g:
        g.db = mysql.connector.connect(
            host=current_app.config['MYSQL_HOST'],
            database=current_app.config['MYSQL_DATABASE'],
            user=current_app.config['MYSQL_USER'],
            password=current_app.config['MYSQL_PASSWORD'],
            use_pure=True # Add this
        )
    return g.db

def close_db(e=None):
    """
    Closes the database connection at the end of the request.
    """
    db = g.pop('db', None)
    if db is not None:
        db.close()

def init_app(app):
    """
    Registers the close_db function to be called after each request.
    """
    app.teardown_appcontext(close_db)

def get_cursor(dictionary=False):
    """
    Gets a database cursor.
    Args:
        dictionary (bool): If True, returns a dictionary cursor.
    """
    db = get_db()
    return db.cursor(dictionary=dictionary)