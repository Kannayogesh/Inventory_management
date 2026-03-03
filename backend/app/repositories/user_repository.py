from app.core.database import get_db_connection


def get_user_by_email(email: str):
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT user_id, employee_code, full_name, email, phone, password_hash, role, designation, department, location, joining_date, status FROM Users WHERE email = ?", (email,))

    row = cursor.fetchone()
    conn.close()

    if row:
        return {
            "user_id": row.user_id,
            "employee_code": row.employee_code,
            "full_name": row.full_name,
            "email": row.email,
            "phone": row.phone,
            "password": row.password_hash,
            "role": row.role,
            "designation": row.designation,
            "department": row.department,
            "location": row.location,
            "joining_date": row.joining_date,
            "status": row.status,
        }

    return None


def get_user_count():
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) as count FROM Users")
    row = cursor.fetchone()
    conn.close()

    return row.count if row else 0


def create_user(employee_code: str, full_name: str, email: str, password: str, role: str, phone: str = None, designation: str = None, department: str = None, location: str = None, joining_date: str = None):
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute(
        "INSERT INTO Users (employee_code, full_name, email, password_hash, role, phone, designation, department, location, joining_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        (employee_code, full_name, email, password, role, phone, designation, department, location, joining_date)
    )

    conn.commit()
    conn.close()