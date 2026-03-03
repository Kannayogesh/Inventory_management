from app.core.database import get_db_connection

def get_all_categories():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT category_id, category_name, description FROM Asset_Categories")
    rows = cursor.fetchall()
    conn.close()
    
    return [
        {
            "category_id": row.category_id,
            "category_name": row.category_name,
            "description": row.description
        }
        for row in rows
    ]

def get_category_count():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) as count FROM Asset_Categories")
    row = cursor.fetchone()
    conn.close()
    return row.count if row else 0

def create_category(category_name: str, description: str = None):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO Asset_Categories (category_name, description) VALUES (?, ?)",
        (category_name, description)
    )
    conn.commit()
    conn.close()
