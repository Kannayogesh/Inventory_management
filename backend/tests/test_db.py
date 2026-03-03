import pyodbc
conn = pyodbc.connect(
    'DRIVER={ODBC Driver 18 for SQL Server};'
    'SERVER=localhost;'
    'DATABASE=TaskManagementDB;'
    'Trusted_Connection=yes;'
    'TrustServerCertificate=yes;'
)
print('Connected successfully!')
conn.close()