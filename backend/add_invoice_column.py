import pyodbc

try:
    conn_str = "DRIVER={ODBC Driver 18 for SQL Server};SERVER=localhost;DATABASE=ITInventoryDB;Trusted_Connection=yes;TrustServerCertificate=yes;"
    conn = pyodbc.connect(conn_str)
    cursor = conn.cursor()
    
    # Check if column already exists
    cursor.execute("""
        SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME='Assets' AND COLUMN_NAME='invoice_path'
    """)
    
    if not cursor.fetchone():
        # Add the column
        alter_sql = """
        ALTER TABLE Assets
        ADD invoice_path VARCHAR(500) NULL
        """
        cursor.execute(alter_sql)
        conn.commit()
        print("✓ Successfully added invoice_path column to Assets table")
    else:
        print("✓ invoice_path column already exists")
    
    conn.close()
    
except Exception as e:
    print(f"✗ ERROR: {type(e).__name__}")
    print(f"  Message: {e}")
