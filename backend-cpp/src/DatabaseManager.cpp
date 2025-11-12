#include "DatabaseManager.h"
#include <iostream>
#include <sstream>
#include <exception>


DatabaseManager::DatabaseManager(const DatabaseConfig& db_config) 
    : config(db_config) {
}


// Database connection
bool DatabaseManager::connect() {
    try {
        connection = std::make_unique<pqxx::connection>(config.getConnectionString());
        if (connection->is_open()) {
            std::cout << "Connected to PostgreSQL database: " << config.name << std::endl;
            createTables();
            return true;
        } else {
            std::cerr << "Failed to connect to database" << std::endl;
            return false;
        }
    } catch (const std::exception& e) {
        std::cerr << "Database connection error: " << e.what() << std::endl;
        return false;
    }
}



// Database connection check
bool DatabaseManager::isConnected() const {
    return connection && connection->is_open();
}

// Init Tables
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
        
        std::cout << "Database tables created/verified successfully" << std::endl;
        
    } catch (const std::exception& e) {
        std::cerr << "Table creation error: " << e.what() << std::endl;
    }
}
// Image Creating 
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
        
        // return id 
        if (!result.empty()) {
            return result[0][0].as<int>();
        }
        
        return -1;
        
    } catch (const std::exception& e) {
        std::cerr << "Create image error: " << e.what() << std::endl;
        return -1;
    }
}

// Creating task
int DatabaseManager::createTask(const Task& task) {
    try {
        pqxx::work txn(*connection);

        // Fixed: INSERT INTO tasks (not images)
        std::string sql = R"(
            INSERT INTO tasks (processing_type, status, image_id)
            VALUES ($1, $2, $3)
            RETURNING id
        )";
        
        // Fixed: removed extra comma
        pqxx::result result = txn.exec_params(
            sql, task.processing_type, task.status, task.image_id
        );
        
        txn.commit();
        
        // Return id
        if (!result.empty()) {
            return result[0][0].as<int>();
        }
        
        return -1;
        
    } catch (const std::exception& e) {
        std::cerr << "Create task error: " << e.what() << std::endl;
        return -1;
    }
}



Image DatabaseManager::getImage(int id) {
    try {
        pqxx::work txn(*connection);
        
        std::string sql = "SELECT * FROM images WHERE id = $1";
        pqxx::result result = txn.exec_params(sql, id);
        
        if (!result.empty()) {
            Image image;
            image.fromPgResult(result[0]);
            return image;
        }
        
        return Image(); 
        
    } catch (const std::exception& e) {
        std::cerr << "Get image error: " << e.what() << std::endl;
        return Image();
    }
}

std::vector<Image> DatabaseManager::getAllImages() {
    std::vector<Image> images;
    
    try {
        pqxx::work txn(*connection);
        
        std::string sql = "SELECT * FROM images ORDER BY created_at DESC";
        pqxx::result result = txn.exec(sql);
        
        for (const auto& row : result) {
            Image image;
            image.fromPgResult(row);
            images.push_back(image); //  MAKE UNDERSTAND 
        }
        
    } catch (const std::exception& e) {
        std::cerr << "Get all images error: " << e.what() << std::endl;
    }
    
    return images;
}


std::vector<Task> DatabaseManager::getTasks(const int image_id ) {
    std::vector<Task> tasks;
    
    try {
        pqxx::work txn(*connection);
        
        std::string sql = "SELECT * FROM tasks WHERE  image_id = $1";
        pqxx::result result = txn.exec_params(sql , image_id);
        
        for (const auto& row : result) {
            Task task;
            task.fromPgResult(row);
            tasks.push_back(task); 
        }
        
    } catch (const std::exception& e) {
        std::cerr << "Get all tasks error: " << e.what() << std::endl;
    }
    
    return tasks;
}


std::vector<Image> DatabaseManager::getImagesByStatus(const std::string& status) {
    std::vector<Image> images;
    
    try {
        pqxx::work txn(*connection);
        
        std::string sql = "SELECT * FROM images WHERE status = $1 ORDER BY created_at DESC";
        pqxx::result result = txn.exec_params(sql, status);
        
        for (const auto& row : result) {
            Image image;
            image.fromPgResult(row);
            images.push_back(image);
        }
        
    } catch (const std::exception& e) {
        std::cerr << "Get images by status error: " << e.what() << std::endl;
    }
    
    return images;
}

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
        std::cerr << "Update image status error: " << e.what() << std::endl;
        return false;
    }
}

DatabaseManager::Statistics DatabaseManager::getStatistics() {  // ВИНЕСТИ  В ІНШУ ЛОГІКУ
    Statistics stats = {0}; 
    
    try {
        pqxx::work txn(*connection);
        
        // Загальна кількість
        std::string count_sql = "SELECT COUNT(*) FROM images";
        pqxx::result count_result = txn.exec(count_sql);
        if (!count_result.empty()) {
            stats.total_images = count_result[0][0].as<int>();
        }
        
        // Кількість по статусах
        std::string status_sql = R"(
            SELECT status, COUNT(*) 
            FROM images 
            GROUP BY status
        )";
        pqxx::result status_result = txn.exec(status_sql);
        
        for (const auto& row : status_result) {
            std::string status = row[0].as<std::string>();
            int count = row[1].as<int>();
            
            if (status == "pending") stats.pending_count = count;
            else if (status == "processing") stats.processing_count = count;
            else if (status == "completed") stats.completed_count = count;
            else if (status == "error") stats.error_count = count;
        }
        
        // Найпопулярніша операція
        std::string op_sql = R"(
            SELECT operation, COUNT(*) as count 
            FROM images 
            WHERE operation != '' 
            GROUP BY operation 
            ORDER BY count DESC 
            LIMIT 1
        )";
        pqxx::result op_result = txn.exec(op_sql);
        if (!op_result.empty()) {
            stats.most_popular_operation = op_result[0][0].as<std::string>();
        }
        
    } catch (const std::exception& e) {
        std::cerr << "Get statistics error: " << e.what() << std::endl;
    }
    
    return stats;
}