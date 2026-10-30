import sqlite3
import json
from typing import List, Optional, Dict, Any
from .config import settings

def get_connection():
    conn = sqlite3.connect(settings.DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS events (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            celebration_type TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            data TEXT NOT NULL
        )
    """)
    conn.commit()
    conn.close()

# Ensure table exists on import
init_db()

def save_event_record(event_id: str, title: str, celebration_type: str, created_at: str, updated_at: str, data: Dict[str, Any]):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO events (id, title, celebration_type, created_at, updated_at, data)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
            title = excluded.title,
            celebration_type = excluded.celebration_type,
            updated_at = excluded.updated_at,
            data = excluded.data
    """, (event_id, title, celebration_type, created_at, updated_at, json.dumps(data)))
    conn.commit()
    conn.close()

def get_event_record(event_id: str) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT data FROM events WHERE id = ?", (event_id,))
    row = cursor.fetchone()
    conn.close()
    if row:
        return json.loads(row["data"])
    return None

def list_event_records() -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, title, celebration_type, created_at, updated_at, data FROM events ORDER BY updated_at DESC")
    rows = cursor.fetchall()
    conn.close()
    results = []
    for r in rows:
        try:
            full_data = json.loads(r["data"])
            reqs = full_data.get("requirements", {})
            budget = full_data.get("budget", {})
            results.append({
                "id": r["id"],
                "title": r["title"],
                "celebration_type": r["celebration_type"],
                "created_at": r["created_at"],
                "updated_at": r["updated_at"],
                "event_date": reqs.get("event_date", ""),
                "guest_count": reqs.get("guest_count", 0),
                "total_budget": budget.get("total_budget", 0),
                "currency": reqs.get("currency", "USD"),
            })
        except Exception:
            continue
    return results

def delete_event_record(event_id: str) -> bool:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM events WHERE id = ?", (event_id,))
    deleted = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return deleted
