import pyodbc

try:
    conn_str = "DRIVER={ODBC Driver 18 for SQL Server};SERVER=localhost;DATABASE=ITInventoryDB;Trusted_Connection=yes;TrustServerCertificate=yes;"
    conn = pyodbc.connect(conn_str)
    cursor = conn.cursor()
    
    # Test Assets table
    cursor.execute("SELECT COUNT(*) FROM Assets")
    asset_count = cursor.fetchone()[0]
    print(f"✓ Assets table exists. Records: {asset_count}")
    
    # Test if invoice_path column exists
    cursor.execute("""
        SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME='Assets' AND COLUMN_NAME='invoice_path'
    """)
    if cursor.fetchone():
        print("✓ invoice_path column exists")
    else:
        print("✗ invoice_path column NOT found")
    
    conn.close()
    print("\n✓ Database connection successful!")
    
except Exception as e:
    print(f"✗ ERROR: {type(e).__name__}")
    print(f"  Message: {e}")
