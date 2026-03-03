from app.core.database import get_db_connection
from typing import List, Optional
from datetime import date

def get_all_assignments() -> List[dict]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT assignment_id, asset_id, user_id, assigned_date, expected_return_date,
        returned_date, approved_by, condition_at_issue, condition_at_return,
        confirmation_status, status, remarks FROM Asset_Assignment
    """)
    columns = [column[0] for column in cursor.description]
    results = [dict(zip(columns, row)) for row in cursor.fetchall()]
    conn.close()
    return results

def get_assignment_by_id(assignment_id: int) -> Optional[dict]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT assignment_id, asset_id, user_id, assigned_date, expected_return_date,
        returned_date, approved_by, condition_at_issue, condition_at_return,
        confirmation_status, status, remarks FROM Asset_Assignment WHERE assignment_id = ?
    """, (assignment_id,))
    row = cursor.fetchone()
    if row:
        columns = [column[0] for column in cursor.description]
        result = dict(zip(columns, row))
        conn.close()
        return result
    conn.close()
    return None

def create_assignment(
    asset_id: int, user_id: int, approved_by: int, status: str,
    condition_at_issue: str = None, expected_return_date: date = None, remarks: str = None
) -> int:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        INSERT INTO Asset_Assignment (
            asset_id, user_id, assigned_date, expected_return_date, approved_by, 
            condition_at_issue, confirmation_status, status, remarks
        ) OUTPUT INSERTED.assignment_id VALUES (
            ?, ?, SYSDATETIME(), ?, ?, ?, 'Pending', ?, ?
        )
        """,
        (asset_id, user_id, expected_return_date, approved_by, condition_at_issue, status, remarks)
    )
    new_id = cursor.fetchone()[0]
    conn.commit()
    conn.close()
    return new_id

def update_assignment(assignment_id: int, updates: dict) -> bool:
    if not updates:
        return True
    set_clause = ", ".join([f"{k} = ?" for k in updates.keys()])
    values = list(updates.values())
    values.append(assignment_id)
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(f"UPDATE Asset_Assignment SET {set_clause} WHERE assignment_id = ?", values)
    conn.commit()
    rowcount = cursor.rowcount
    conn.close()
    return rowcount > 0
