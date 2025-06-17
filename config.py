from dotenv import load_dotenv
import os
load_dotenv()

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY')
    # Database Configuration
    MYSQL_HOST = 'opushhdb.mysql.database.azure.com'
    MYSQL_DATABASE = 'opus_prod'
    MYSQL_USER = 'opusadmin'
    MYSQL_PASSWORD = os.getenv('MYSQL_PASSWORD') 

    # Flask-Mail Configuration (if you use it)
    MAIL_SERVER = 'smtp.office365.com'
    MAIL_PORT = 587
    MAIL_USE_TLS = True
    MAIL_USE_SSL = False
    MAIL_USERNAME = 'CustomerExperience@opusanalytics.ai'
    MAIL_PASSWORD = os.getenv('MAIL_PASSWORD') 
    
    # JWT Configuration
    JWT_SECRET_KEY = 'a1b5090514d27aec8b828fd56ea87d84bf3c349246d63918586635f6ebd7e4f0d90454165ccf4012ac0c778f511df1a405b94da69f9b7aea175c9549ab2388f6e0e5b2de3f29ccf4a248e7c32ab8beb442ad7e4c06aee3adf26da79da7ebcd85270eec19c79987def1d80cab3c5f86e93fbee39dc0609d198dbcc355ecd7102a' # IMPORTANT: Another strong, random key for JWTs
    JWT_ALGORITHM = 'HS256'
    JWT_ACCESS_TOKEN_EXPIRES_MINUTES = 30 # Token expiration time in minutes