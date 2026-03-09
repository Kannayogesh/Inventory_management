from app.core.database import get_db_connection
from typing import List, Optional

def get_all_maintenance_requests() -> List[dict]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT maintenance_id, asset_id, reported_by, issue_description,
        status, reported_date, resolved_date, remarks FROM Maintenance_Request
    """)
    columns = [column[0] for column in cursor.description]
    results = [dict(zip(columns, row)) for row in cursor.fetchall()]
    conn.close()
    return results

def get_maintenance_request_by_id(maintenance_id: int) -> Optional[dict]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT maintenance_id, asset_id, reported_by, issue_description,
        status, reported_date, resolved_date, remarks FROM Maintenance_Request
        WHERE maintenance_id = ?
    """, (maintenance_id,))
    row = cursor.fetchone()
    if row:
        columns = [column[0] for column in cursor.description]
        result = dict(zip(columns, row))
        conn.close()
        return result
    conn.close()
    return None

def create_maintenance_request(
    asset_id: int, reported_by: int, issue_description: str, remarks: str = None
) -> int:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        INSERT INTO Maintenance_Request (
            asset_id, reported_by, issue_description, status, remarks
        ) OUTPUT INSERTED.maintenance_id VALUES (
            ?, ?, ?, 'Open', ?
        )
        """,
        (asset_id, reported_by, issue_description, remarks)
    )
    new_id = cursor.fetchone()[0]
    conn.commit()
    conn.close()
    return new_id

def update_maintenance_request(maintenance_id: int, updates: dict) -> bool:
    if not updates:
        return True
    set_clause = ", ".join([f"{k} = ?" for k in updates.keys()])
    values = list(updates.values())
    values.append(maintenance_id)
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(f"UPDATE Maintenance_Request SET {set_clause} WHERE maintenance_id = ?", values)
    conn.commit()
    rowcount = cursor.rowcount
    conn.close()
    return rowcount > 0

def record_maintenance_history(maintenance_id: int, status: str, notes: str, performed_by: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        INSERT INTO Maintenance_History (maintenance_id, status, notes, performed_by)
        VALUES (?, ?, ?, ?)
        """,
        (maintenance_id, status, notes, performed_by)
    )
    conn.commit()
    conn.close()

def get_maintenance_history_by_asset(asset_id: int) -> List[dict]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT h.history_id, h.maintenance_id, h.status, h.notes, h.action_date, 
               u.full_name as performed_by_name, m.issue_description
        FROM Maintenance_History h
        JOIN Maintenance_Request m ON h.maintenance_id = m.maintenance_id
        JOIN Users u ON h.performed_by = u.user_id
        WHERE m.asset_id = ?
        ORDER BY h.action_date DESC
    """, (asset_id,))
    
    columns = [column[0] for column in cursor.description]
    results = [dict(zip(columns, row)) for row in cursor.fetchall()]
    conn.close()
    return results
