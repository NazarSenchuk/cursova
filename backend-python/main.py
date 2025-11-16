import time
import os
from database import get_pending_tasks, update_task_status
from r2_storage import download_from_r2, upload_to_r2
from image_processor import process_image, cleanup_files

def process_single_task(task):
    """Process one task"""
    task_id = task['task_id']
    image_id = task['image_id']
    filename = task['filename']
    processing_type = task['processing_type']
    
    print(f"\n=== Processing Task {task_id} ===")
    
    # Define paths
    temp_input = f"temp_input_{task_id}_{filename}"
    temp_output = f"temp_output_{task_id}_{filename}"
    
    # R2 paths
    r2_input_path = f"original/{image_id}-{filename}"
    r2_output_path = f"processed/{task_id}-{filename}"
    
    try:
        # Step 1: Update status to processing
        update_task_status(task_id, "processing")
        
        # Step 2: Download from R2
        if not download_from_r2(r2_input_path, temp_input):
            raise Exception("Download failed")
        
        # Step 3: Process image
        if not process_image(temp_input, temp_output, processing_type):
            raise Exception("Processing failed")
        
        # Step 4: Upload to R2 processed folder
        if not upload_to_r2(temp_output, r2_output_path):
            raise Exception("Upload failed")
        
        # Step 5: Update database
        update_task_status(task_id, "completed", r2_output_path)
        
        print(f"✅ Task {task_id} completed successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Task {task_id} failed: {e}")
        update_task_status(task_id, "failed")
        return False
        
    finally:
        # Cleanup temp files
        cleanup_files([temp_input, temp_output])

def main_loop():
    """Main processing loop"""
    print("Starting task processor...")
    
    while True:
        try:
            # Get all pending tasks
            tasks = get_pending_tasks()
            
            if not tasks:
                print("No pending tasks. Waiting 30 seconds...")
                time.sleep(30)
                continue
            
            # Process each task
            for task in tasks:
                process_single_task(task)
            
            # Small delay between batches
            time.sleep(5)
            
        except KeyboardInterrupt:
            print("\nStopped by user")
            break
        except Exception as e:
            print(f"Unexpected error: {e}")
            time.sleep(60)

if __name__ == "__main__":
    # Create temp directory if needed
    if not os.path.exists('temp'):
        os.makedirs('temp')
    
    main_loop()