from app.core.database import get_db_connection


def get_user_by_employee_code(employee_code: str):
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT user_id, employee_code, full_name, email, phone, password_hash, role, designation, department, location, joining_date, status FROM Users WHERE employee_code = ?", (employee_code,))

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


def get_user_by_id(user_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT user_id, employee_code, full_name, email, phone, password_hash, role, designation, department, location, joining_date, status FROM Users WHERE user_id = ?", (user_id,))

    row = cursor.fetchone()
    conn.close()

    if row:
        return {
            "user_id": row.user_id,
            "employee_code": row.employee_code,
            "full_name": row.full_name,
            "email": row.email,
            "phone": row.phone,
            "role": row.role,
            "designation": row.designation,
            "department": row.department,
            "location": row.location,
            "joining_date": row.joining_date,
            "status": row.status,
        }

    return None


def get_all_users(status: str = "Active"):
    """Get all users with specified status (default: Active)"""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT user_id, employee_code, full_name, email, phone, role, designation, department, location, joining_date, status FROM Users WHERE status = ? ORDER BY full_name", (status,))

    rows = cursor.fetchall()
    conn.close()

    users = []
    if rows:
        for row in rows:
            users.append({
                "user_id": row.user_id,
                "employee_code": row.employee_code,
                "full_name": row.full_name,
                "email": row.email,
                "phone": row.phone,
                "role": row.role,
                "designation": row.designation,
                "department": row.department,
                "location": row.location,
                "joining_date": row.joining_date,
                "status": row.status,
            })

    return users


def search_users(query: str):
    """Search users by employee code, email, or full name"""
    conn = get_db_connection()
    cursor = conn.cursor()

    search_pattern = f"%{query}%"
    cursor.execute(
        "SELECT user_id, employee_code, full_name, email, phone, role, designation, department, location, joining_date, status FROM Users WHERE employee_code LIKE ? OR email LIKE ? OR full_name LIKE ? ORDER BY full_name",
        (search_pattern, search_pattern, search_pattern)
    )

    rows = cursor.fetchall()
    conn.close()

    users = []
    if rows:
        for row in rows:
            users.append({
                "user_id": row.user_id,
                "employee_code": row.employee_code,
                "full_name": row.full_name,
                "email": row.email,
                "phone": row.phone,
                "role": row.role,
                "designation": row.designation,
                "department": row.department,
                "location": row.location,
                "joining_date": row.joining_date,
                "status": row.status,
            })

    return users


def update_user(user_id: int, updates: dict) -> bool:
    """Update user information (Admin only). Returns True if successful."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Build dynamic UPDATE query based on provided fields
    allowed_fields = ["full_name", "email", "phone", "role", "designation", "department", "location", "status", "joining_date"]
    update_fields = []
    update_values = []
    
    for field, value in updates.items():
        if field in allowed_fields and value is not None:
            update_fields.append(f"{field} = ?")
            update_values.append(value)
    
    if not update_fields:
        conn.close()
        return False
    
    update_values.append(user_id)
    query = f"UPDATE Users SET {', '.join(update_fields)} WHERE user_id = ?"
    
    try:
        cursor.execute(query, update_values)
        conn.commit()
        conn.close()
        return cursor.rowcount > 0
    except Exception as e:
        conn.close()
        return False



def create_user(employee_code: str, full_name: str, email: str, password: str, role: str, phone: str = None, designation: str = None, department: str = None, location: str = None, joining_date: str = None):
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute(
        "INSERT INTO Users (employee_code, full_name, email, password_hash, role, phone, designation, department, location, joining_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        (employee_code, full_name, email, password, role, phone, designation, department, location, joining_date)
    )

    conn.commit()
    conn.close()