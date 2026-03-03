from app.core.database import get_db_connection
from typing import List, Optional

def get_all_procurement_requests() -> List[dict]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT request_id, category_id, requested_by, quantity, reason,
        status, requested_date, approved_by, approved_date FROM Procurement_Request
    """)
    columns = [column[0] for column in cursor.description]
    results = [dict(zip(columns, row)) for row in cursor.fetchall()]
    conn.close()
    return results

def get_procurement_request_by_id(request_id: int) -> Optional[dict]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT request_id, category_id, requested_by, quantity, reason,
        status, requested_date, approved_by, approved_date FROM Procurement_Request 
        WHERE request_id = ?
    """, (request_id,))
    row = cursor.fetchone()
    if row:
        columns = [column[0] for column in cursor.description]
        result = dict(zip(columns, row))
        conn.close()
        return result
    conn.close()
    return None

def create_procurement_request(
    category_id: int, requested_by: int, quantity: int, reason: str
) -> int:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        INSERT INTO Procurement_Request (
            category_id, requested_by, quantity, reason, status
        ) OUTPUT INSERTED.request_id VALUES (
            ?, ?, ?, ?, 'Pending'
        )
        """,
        (category_id, requested_by, quantity, reason)
    )
    new_id = cursor.fetchone()[0]
    conn.commit()
    conn.close()
    return new_id

def update_procurement_request(request_id: int, updates: dict) -> bool:
    if not updates:
        return True
    set_clause = ", ".join([f"{k} = ?" for k in updates.keys()])
    values = list(updates.values())
    values.append(request_id)
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(f"UPDATE Procurement_Request SET {set_clause} WHERE request_id = ?", values)
    conn.commit()
    rowcount = cursor.rowcount
    conn.close()
    return rowcount > 0
