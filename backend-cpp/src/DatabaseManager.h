#ifndef DATABASE_MANAGER_H
#define DATABASE_MANAGER_H

#include <pqxx/pqxx>
#include <vector>
#include <string>
#include <memory>
#include "models/Image.h"
#include "models/Task.h"
#include "config/Config.h"


// Клас для взаємодії з базою даних
class DatabaseManager {
private:
    //унікальне посилання на стрічку підключення
    std::unique_ptr<pqxx::connection> connection;

    DatabaseConfig config;
    // Ініціалізує таблиці в базі даних
    void createTables();
    
public:
    DatabaseManager(const DatabaseConfig& db_config);
    
    

    bool connect();
    bool isConnected() const;
    
    // CRUD operations

    //Зоображення
    int createImage(const Image& image); 
    Image getImage(int id);
    std::vector<Image> getAllImages();
    std::vector<Image> getImagesByStatus(const std::string& status); //delete
    bool updateImageStatus(int id, const std::string& status,   //delete
                          const std::string& error_msg);
    bool deleteImage(int id);
    
    //Таски
    std::vector<Task> getTasks(const int image_id );
    int createTask(const Task& task);
    

};

#endif