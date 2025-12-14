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
    
    print(f"\n=== Обробка завдання {task_id} ===")
    
    # Тимчасові файли для збереження
    temp_input = f"temp_input_{task_id}_{filename}"
    temp_output = f"temp_output_{task_id}_{filename}"
    
    # Шляхи в R2
    r2_input_path = f"original/{image_id}-{filename}"
    r2_output_path = f"processed/{task_id}-{filename}"
    
    try:
        # Визначаємо з якого кроку продовжити
        current_step = determine_current_step(task_id, temp_input, temp_output)
        
        if current_step == "download":
            print(f" Продовження завдання {task_id} з кроку завантаження")
            # Крок 2: Завантаження з R2
            if not download_from_r2(r2_input_path, temp_input):
                raise Exception("Помилка завантаження")
            current_step = "process"
        
        if current_step == "process":
            print(f" Продовження завдання {task_id} з кроку обробки")
            # Крок 3: Обробка зображення
            if not process_image(temp_input, temp_output, processing_type):
                raise Exception("Помилка обробки")
            current_step = "upload"
        
        if current_step == "upload":
            print(f"Продовження завдання {task_id} з кроку завантаження")
            # Крок 4: Завантаження в R2 у папку processed
            if not upload_to_r2(temp_output, r2_output_path):
                raise Exception("Помилка завантаження")
        
        # Крок 5: Оновлення статусу в базі даних на "completed"
        update_task_status(task_id, "completed", r2_output_path)
        
        print(f"Завдання {task_id} успішно завершено!")
        return True
        
    except Exception as e:
        print(f"Завдання {task_id} невдале: {e}")
        update_task_status(task_id, "failed")
        return False
        
    finally:
        # Очищення тимчасових файлів тільки якщо завдання завершено або невдале
        if not os.path.exists(temp_input) and not os.path.exists(temp_output):
            cleanup_files([temp_input, temp_output])

def determine_current_step(task_id, temp_input_path, temp_output_path):
    # Перевіряємо чи вихідний файл вже існує (завантаження було в процесі)
    if os.path.exists(temp_output_path):
        print(f"Вихідний файл існує, продовження з кроку завантаження")
        return "upload"
    
    # Перевіряємо чи вхідний файл існує (обробка була в процесі)
    elif os.path.exists(temp_input_path):
        print(f"Вхідний файл існує, продовження з кроку обробки")
        return "process"
    
    # Інакше починаємо з завантаження
    else:
        print(f"Тимчасових файлів не знайдено, починаємо з кроку завантаження")
        return "download"

def process_pending_tasks():
    pending_tasks = get_pending_tasks()
    
    for task in pending_tasks:
        task_id = task['task_id']
        
        # Спочатку оновлюємо статус на "processing"
        update_task_status(task_id, "processing")
        
        # Потім обробляємо з тією ж функцією
        process_single_task(task)

if __name__ == "__main__":
    # Створюємо тимчасову директорію якщо потрібно
    if not os.path.exists('temp'):
        os.makedirs('temp')
    
    print("Запуск Python обробника")
    while True:
        
        # Крок 1: Спочатку відновлюємо будь-які "застряглі" завдання в обробці
        processing_tasks = get_processing_tasks()
        
        if processing_tasks:
            print(f"Знайдено {len(processing_tasks)} завдань в статусі обробки. Відновлення...")
            for task in processing_tasks:
                process_single_task(task)
        
        # Крок 2: Потім обробляємо нові завдання в очікуванні
        process_pending_tasks()
        
        # Чекаємо перед наступною ітерацією
        print("Немає завдань для обробки. Очікування 10 секунд")
        time.sleep(10)
        