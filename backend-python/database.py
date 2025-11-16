import mysql.connector
from config import DB_CONFIG

def get_db_connection():
    return mysql.connector.connect(**DB_CONFIG)

def get_pending_tasks():
    """Get all pending tasks with image info"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    query = """
    SELECT t.id as task_id, t.image_id, t.processing_type, i.filename
    FROM tasks t 
    JOIN images i ON t.image_id = i.id 
    WHERE t.status = 'pending'
    """
    
    cursor.execute(query)
    tasks = cursor.fetchall()
    
    cursor.close()
    conn.close()
    
    print(f"Found {len(tasks)} pending tasks")
    return tasks

def update_task_status(task_id, status, processed_path=None):
    """Update task status in database"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    if status == "completed":
        query = """
        UPDATE tasks 
        SET status = %s, completed_at = NOW(), 
            duration = TIMESTAMPDIFF(SECOND, created_at, NOW()),
            processed_file_path = %s
        WHERE id = %s
        """
        cursor.execute(query, (status, processed_path, task_id))
    else:
        query = "UPDATE tasks SET status = %s WHERE id = %s"
        cursor.execute(query, (status, task_id))
    
    conn.commit()
    cursor.close()
    conn.close()
    
    print(f"Updated task {task_id} to: {status}")