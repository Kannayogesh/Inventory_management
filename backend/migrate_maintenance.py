
import pyodbc
import os

DATABASE_URL = "DRIVER={ODBC Driver 18 for SQL Server};SERVER=localhost;DATABASE=ITInventoryDB;Trusted_Connection=yes;TrustServerCertificate=yes;"

def migrate():
    try:
        conn = pyodbc.connect(DATABASE_URL)
        cursor = conn.cursor()
        
        print("Checking for existing constraints on Maintenance_Request...")
        # Find constraint name for status column
        cursor.execute("""
            SELECT name 
            FROM sys.check_constraints 
            WHERE parent_object_id = OBJECT_ID('Maintenance_Request') 
            AND definition LIKE '%status%'
        """)
        row = cursor.fetchone()
        if row:
            constraint_name = row[0]
            print(f"Dropping constraint {constraint_name}...")
            cursor.execute(f"ALTER TABLE Maintenance_Request DROP CONSTRAINT {constraint_name}")
        
        print("Updating Maintenance_Request status constraints...")
        cursor.execute("""
            ALTER TABLE Maintenance_Request ADD CONSTRAINT CK_Maintenance_Request_Status 
            CHECK (status IN ('Under Process', 'Resolved', 'Cannot Be Resolved', 'Open', 'In Progress'))
        """)

        print("Creating Maintenance_History table...")
        cursor.execute("""
            IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Maintenance_History]') AND type in (N'U'))
            BEGIN
                CREATE TABLE Maintenance_History (
                    history_id INT IDENTITY(1,1) PRIMARY KEY,
                    maintenance_id INT NOT NULL,
                    status VARCHAR(50) NOT NULL,
                    notes VARCHAR(MAX) NULL,
                    performed_by INT NOT NULL,
                    action_date DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
                    CONSTRAINT FK_History_Maintenance FOREIGN KEY (maintenance_id) REFERENCES Maintenance_Request(maintenance_id),
                    CONSTRAINT FK_History_User FOREIGN KEY (performed_by) REFERENCES Users(user_id)
                )
            END
        """)
        
        # Add tech_notes to Maintenance_Request if not exists (for convenience)
        # Actually the timeline requirement is specific: "Each event should include: Date/time, Status change, Responsible technician/admin, Notes."
        # The history table handles this.
        
        conn.commit()
        print("Migration successful!")
    except Exception as e:
        print(f"Migration failed: {e}")
    finally:
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    migrate()
