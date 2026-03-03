import pyodbc
from app.core.config import settings

def get_db_connection():
    conn = pyodbc.connect(settings.DATABASE_URL)
    # The repositories will handle mapping rows
    return conn
    
def init_db():
    # Database and tables are managed via schema.sql and SQL Server
    pass
