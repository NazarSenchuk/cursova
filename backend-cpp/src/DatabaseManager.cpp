#include "DatabaseManager.h"
#include <iostream>
#include <sstream>
#include <exception>

DatabaseManager::DatabaseManager(const DatabaseConfig& db_config) 
    : config(db_config) {
}

// Підключення до бази даних
bool DatabaseManager::connect() {
    try {
        connection = std::make_unique<pqxx::connection>(config.getConnectionString());
        if (connection->is_open()) {
            std::cout << "Підключено до PostgreSQL бази даних: " << config.name << std::endl;
            createTables();
            return true;
        } else {
            std::cerr << "Не вдалося підключитися до бази даних" << std::endl;
            return false;
        }
    } catch (const std::exception& e) {
        std::cerr << "Помилка підключення до бази даних: " << e.what() << std::endl;
        return false;
    }
}

// Перевірка підключення до бази даних
bool DatabaseManager::isConnected() const {
    return connection && connection->is_open();
}

// Ініціалізація таблиць
void DatabaseManager::createTables() {
    try {
        pqxx::work txn(*connection);
        
        std::string createTableSQL = R"(
            CREATE TABLE IF NOT EXISTS images (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) , 
                description TEXT , 
                filename VARCHAR(255) NOT NULL,
                original_path TEXT,
                processed_path TEXT ,
                status VARCHAR(50) DEFAULT 'pending',
                error_message TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            
            CREATE INDEX IF NOT EXISTS idx_images_name  ON images(name);
            CREATE INDEX IF NOT EXISTS idx_images_description  ON images(description);
            CREATE INDEX IF NOT EXISTS idx_images_status ON images(status);
            CREATE INDEX IF NOT EXISTS idx_images_created_at ON images(created_at);

            CREATE TABLE IF NOT EXISTS tasks (
                id SERIAL PRIMARY KEY,
                processing_type VARCHAR(255) NOT NULL,
                status VARCHAR(255) NOT NULL DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                completed_at TIMESTAMP NULL,
                duration INTERVAL NULL,
                image_id INT NOT NULL,
                CONSTRAINT fk_image FOREIGN KEY (image_id)
                REFERENCES images(id) ON DELETE CASCADE
            );

            CREATE INDEX IF NOT EXISTS idx_tasks_image_id ON tasks(image_id);
            CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
            CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at);
            
        )";
        
        txn.exec(createTableSQL);
        txn.commit();
        
        std::cout << "Таблиці бази даних успішно створені/перевірені" << std::endl;
        
    } catch (const std::exception& e) {
        std::cerr << "Помилка створення таблиць: " << e.what() << std::endl;
    }
}

// ОПЕРАЦІЇ З ЗОБРАЖЕННЯМИ ---------

// Створення зображення
int DatabaseManager::createImage(const Image& image) {
    try {
        pqxx::work txn(*connection);
        
        std::string sql = R"(
            INSERT INTO images (name , description, filename, original_path, processed_path, status)
            VALUES ($1, $2, $3, $4, $5 , $6 )
            RETURNING id
        )";
        
        pqxx::result result = txn.exec_params(
            sql, image.name , image.description, image.filename, image.original_path, image.processed_path ,
            image.status
        );
        
        txn.commit();
        
        // Повернення ID
        if (!result.empty()) {
            return result[0][0].as<int>();
        }
        
        return -1;
        
    } catch (const std::exception& e) {
        std::cerr << "Помилка створення зображення: " << e.what() << std::endl;
        return -1;
    }
}

// Отримання зображення за ID
Image DatabaseManager::getImage(int id) {
    try {
        pqxx::nontransaction txn(*connection);
        
        std::string sql = "SELECT * FROM images WHERE id = $1";
        pqxx::result result = txn.exec_params(sql, id);
        
        if (!result.empty()) {
            Image image;
            image.fromPgResult(result[0]);
            return image;
        }
        
        return Image(); // Повертаємо пусте зображення якщо не знайдено
        
    } catch (const std::exception& e) {
        std::cerr << "Помилка отримання зображення: " << e.what() << std::endl;
        return Image();
    }
}

// Отримання всіх зображень
std::vector<Image> DatabaseManager::getAllImages() {
    std::vector<Image> images;
    
    try {
        pqxx::nontransaction txn(*connection);
        
        std::string sql = "SELECT * FROM images ORDER BY created_at DESC";
        pqxx::result result = txn.exec(sql);
        
        for (const auto& row : result) {
            Image image;
            image.fromPgResult(row);
            images.push_back(image);
        }
        
    } catch (const std::exception& e) {
        std::cerr << "Помилка отримання всіх зображень: " << e.what() << std::endl;
    }
    
    return images;
}

// Отримання зображень за статусом
std::vector<Image> DatabaseManager::getImagesByStatus(const std::string& status) {
    std::vector<Image> images;
    
    try {
        pqxx::nontransaction txn(*connection);
        
        std::string sql = "SELECT * FROM images WHERE status = $1 ORDER BY created_at DESC";
        pqxx::result result = txn.exec_params(sql, status);
        
        for (const auto& row : result) {
            Image image;
            image.fromPgResult(row);
            images.push_back(image);
        }
        
    } catch (const std::exception& e) {
        std::cerr << "Помилка отримання зображень за статусом: " << e.what() << std::endl;
    }
    
    return images;
}

// Оновлення статусу зображення
bool DatabaseManager::updateImageStatus(int id, const std::string& status, 
                                       const std::string& error_msg ) {
    try {
        pqxx::work txn(*connection);
        
        std::string sql = R"(
            UPDATE images 
            SET status = $1,  error_message = $2, updated_at = CURRENT_TIMESTAMP
            WHERE id = $3
        )";
        
        txn.exec_params(sql, status,  error_msg, id);
        txn.commit();
        
        return true;
        
    } catch (const std::exception& e) {
        std::cerr << "Помилка оновлення статусу зображення: " << e.what() << std::endl;
        return false;
    }
}

// ОПЕРАЦІЇ З ЗАВДАННЯМИ-----

// Створення завдання
int DatabaseManager::createTask(const Task& task) {
    try {
        pqxx::work txn(*connection);

        // Виправлено: INSERT INTO tasks (не images)
        std::string sql = R"(
            INSERT INTO tasks (processing_type, status, image_id)
            VALUES ($1, $2, $3)
            RETURNING id
        )";
        
        // Виправлено: видалено зайву кому
        pqxx::result result = txn.exec_params(
            sql, task.processing_type, task.status, task.image_id
        );
        
        txn.commit();
        
        // Повернення ID
        if (!result.empty()) {
            return result[0][0].as<int>();
        }
        
        return -1;
        
    } catch (const std::exception& e) {
        std::cerr << "Помилка створення завдання: " << e.what() << std::endl;
        return -1;
    }
}

// Отримання завдань для зображення
std::vector<Task> DatabaseManager::getTasks(const int image_id ) {
    std::vector<Task> tasks;
    
    try {
        pqxx::nontransaction txn(*connection);
        
        std::string sql = "SELECT * FROM tasks WHERE  image_id = $1";
        pqxx::result result = txn.exec_params(sql , image_id);
        
        for (const auto& row : result) {
            Task task;
            task.fromPgResult(row);
            tasks.push_back(task); 
        }
        
    } catch (const std::exception& e) {
        std::cerr << "Помилка отримання всіх завдань: " << e.what() << std::endl;
    }
    
    return tasks;
}