import sqlite3
import time
from .config import DB_PATH

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp REAL,
            avg_hr REAL,
            calories REAL,
            wrong_moves INTEGER,
            ai_report TEXT
        )
    ''')
    conn.commit()
    conn.close()

def log_session(avg_hr, calories, wrong_moves, ai_report):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO sessions (timestamp, avg_hr, calories, wrong_moves, ai_report)
        VALUES (?, ?, ?, ?, ?)
    ''', (time.time(), avg_hr, calories, wrong_moves, ai_report))
    conn.commit()
    conn.close()

def get_last_session_time():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('SELECT MAX(timestamp) FROM sessions')
    result = cursor.fetchone()[0]
    conn.close()
    return result
