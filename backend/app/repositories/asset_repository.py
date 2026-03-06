from app.core.database import get_db_connection
from typing import List, Optional
from datetime import date

def get_all_assets() -> List[dict]:
    conn = get_db_connection()
    cursor = conn.cursor()

    query = """
        SELECT asset_id, asset_tag, serial_number, category_id, brand, model,
        configuration, purchase_date, purchase_cost, depreciation_years,
        current_value, warranty_expiry, location, condition_status, status,
        last_audit_date, invoice_path, created_at FROM Assets
    """
    
    cursor.execute(query)
    
    columns = [column[0] for column in cursor.description]
    results = [dict(zip(columns, row)) for row in cursor.fetchall()]
    conn.close()
    return results

def get_asset_by_id(asset_id: int) -> Optional[dict]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT asset_id, asset_tag, serial_number, category_id, brand, model,
        configuration, purchase_date, purchase_cost, depreciation_years,
        current_value, warranty_expiry, location, condition_status, status,
        last_audit_date, invoice_path, created_at FROM Assets 
        WHERE asset_id = ?
    """, (asset_id,))
    
    row = cursor.fetchone()
    if row:
        columns = [column[0] for column in cursor.description]
        result = dict(zip(columns, row))
        conn.close()
        return result
    conn.close()
    return None

def create_asset(
    asset_tag: str, 
    category_id: int,
    condition_status: str,
    status: str, 
    serial_number: str = None, 
    brand: str = None,
    model: str = None,
    configuration: str = None,
    purchase_date: date = None,
    purchase_cost: float = None,
    depreciation_years: int = None,
    warranty_expiry: date = None,
    location: str = None,
    invoice_path: str = None
) -> int:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        INSERT INTO Assets (
            asset_tag, serial_number, category_id, brand, model, configuration,
            purchase_date, purchase_cost, depreciation_years, current_value, 
            warranty_expiry, location, condition_status, status, invoice_path
        ) OUTPUT INSERTED.asset_id VALUES (
            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
        )
        """,
        (asset_tag, serial_number, category_id, brand, model, configuration,
         purchase_date, purchase_cost, depreciation_years, purchase_cost, # Initially, current_value = purchase_cost
         warranty_expiry, location, condition_status, status, invoice_path)
    )
    new_id = cursor.fetchone()[0]
    conn.commit()
    conn.close()
    return new_id

def update_asset(asset_id: int, updates: dict) -> bool:
    if not updates:
        return True
        
    set_clause = ", ".join([f"{k} = ?" for k in updates.keys()])
    values = list(updates.values())
    values.append(asset_id)
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(f"UPDATE Assets SET {set_clause} WHERE asset_id = ?", values)
    conn.commit()
    rowcount = cursor.rowcount
    conn.close()
    return rowcount > 0

def delete_asset(asset_id: int) -> bool:
    conn = get_db_connection()
    cursor = conn.cursor()
    # Also need to delete dependencies (logs, assignments, maintenance) to avoid foreign key violations
    cursor.execute("DELETE FROM Asset_Log WHERE asset_id = ?", (asset_id,))
    cursor.execute("DELETE FROM Asset_Assignment WHERE asset_id = ?", (asset_id,))
    cursor.execute("DELETE FROM Maintenance_Request WHERE asset_id = ?", (asset_id,))
    
    cursor.execute("DELETE FROM Assets WHERE asset_id = ?", (asset_id,))
    conn.commit()
    rowcount = cursor.rowcount
    conn.close()
    return rowcount > 0
