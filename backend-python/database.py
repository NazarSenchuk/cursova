import psycopg2
from config import DB_CONFIG

def get_db_connection():
    return psycopg2.connect(**DB_CONFIG)

def get_processing_tasks():
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    query = """
    SELECT t.id as task_id, t.image_id, t.processing_type, i.filename
    FROM tasks t 
    JOIN images i ON t.image_id = i.id 
    WHERE t.status = 'processing'
    """
    
    cursor.execute(query)
    tasks = cursor.fetchall()
    

    columns = [desc[0] for desc in cursor.description]
    tasks = [dict(zip(columns, row)) for row in tasks]
    
    cursor.close()
    conn.close()
    
    print(f"Found {len(tasks)} tasks in processing status (for recovery)")
    return tasks

def get_pending_tasks():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    query = """
    SELECT t.id as task_id, t.image_id, t.processing_type, i.filename
    FROM tasks t 
    JOIN images i ON t.image_id = i.id 
    WHERE t.status = 'pending'
    """
    
    cursor.execute(query)
    tasks = cursor.fetchall()
    
    columns = [desc[0] for desc in cursor.description]
    tasks = [dict(zip(columns, row)) for row in tasks]
    
    cursor.close()
    conn.close()
    
    print(f"Found {len(tasks)} pending tasks")
    return tasks

def update_task_status(task_id, status, processed_path=None):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    if status == "completed":
        query = """
        UPDATE tasks 
        SET status = %s, completed_at = NOW(), 
            duration = (EXTRACT(EPOCH FROM (NOW() - created_at)) || ' seconds')::interval
        WHERE id = %s
        """
        cursor.execute(query, (status, task_id))
    else:
        query = "UPDATE tasks SET status = %s WHERE id = %s"
        cursor.execute(query, (status, task_id))
    
    conn.commit()
    cursor.close()
    conn.close()
    
    print(f"Updated task {task_id} to: {status}")