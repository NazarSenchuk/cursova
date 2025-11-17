import time
import os
from database import get_processing_tasks, update_task_status
from r2_storage import download_from_r2, upload_to_r2
from image_processor import process_image, cleanup_files
from database import get_pending_tasks

def process_single_task(task):
    task_id = task['task_id']
    image_id = task['image_id']
    filename = task['filename']
    processing_type = task['processing_type']
    
    print(f"\n=== Task Processing {task_id} ===")
    
    # temp image saving 
    temp_input = f"temp_input_{task_id}_{filename}"
    temp_output = f"temp_output_{task_id}_{filename}"
    
    # R2 paths
    r2_input_path = f"original/{image_id}-{filename}"
    r2_output_path = f"processed/{task_id}-{filename}"
    

    try:
        # Check which step we need to resume from
        current_step = determine_current_step(task_id, temp_input, temp_output)
        
        if current_step == "download":
            print(f" Resuming task {task_id} from download step")
            # Step 2: Download from R2
            if not download_from_r2(r2_input_path, temp_input):
                raise Exception("Download failed")
            current_step = "process"
        
        if current_step == "process":
            print(f" Resuming task {task_id} from processing step")
            # Step 3: Process image
            if not process_image(temp_input, temp_output, processing_type):
                raise Exception("Processing failed")
            current_step = "upload"
        
        if current_step == "upload":
            print(f"Resuming task {task_id} from upload step")
            # Step 4: Upload to R2 processed folder
            if not upload_to_r2(temp_output, r2_output_path):
                raise Exception("Upload failed")
        
        # Step 5: Update database to completed
        update_task_status(task_id, "completed", r2_output_path)
        
        print(f"Task {task_id} completed successfully!")
        return True
        
    except Exception as e:
        print(f"Task {task_id} failed: {e}")
        update_task_status(task_id, "failed")
        return False
        
    finally:
        # Cleanup temp files only if task completed or failed
        if not os.path.exists(temp_input) and not os.path.exists(temp_output):
            cleanup_files([temp_input, temp_output])

def determine_current_step(task_id, temp_input_path, temp_output_path):
    # Check if output file already exists (upload was in progress)
    if os.path.exists(temp_output_path):
        print(f"Output file exists, resuming from upload step")
        return "upload"
    
    # Check if input file exists (processing was in progress)
    elif os.path.exists(temp_input_path):
        print(f"Input file exists, resuming from processing step")
        return "process"
    
    # Otherwise start from download
    else:
        print(f"No temp files found, starting from download step")
        return "download"



def process_pending_tasks():
    
    pending_tasks = get_pending_tasks()
    
    for task in pending_tasks:
        task_id = task['task_id']
        
        # First update status to processing
        update_task_status(task_id, "processing")
        
        # Then process with the same function
        process_single_task(task)

if __name__ == "__main__":
    # Create temp directory if needed
    if not os.path.exists('temp'):
        os.makedirs('temp')
    
    print("Start python")
    while True:
        
        # Step 1: First, recover any stuck processing tasks
        processing_tasks = get_processing_tasks()
        
        if processing_tasks:
            print(f"Found {len(processing_tasks)} tasks in processing status. Recovering...")
            for task in processing_tasks:
                process_single_task(task)
        
        # Step 2: Then process new pending tasks
        process_pending_tasks()
        
        # Wait before next iteration
        print("No tasks to process. Waiting 10 seconds")
        time.sleep(10)
        
