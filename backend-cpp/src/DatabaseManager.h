#ifndef DATABASE_MANAGER_H
#define DATABASE_MANAGER_H

#include <pqxx/pqxx>
#include <vector>
#include <string>
#include <memory>
#include "models/Image.h"
#include "models/Task.h"
#include "config/Config.h"


// Class to interact with database
class DatabaseManager {
private:
    //unique connection ptr for every connection
    std::unique_ptr<pqxx::connection> connection;

    DatabaseConfig config;
    // Creates tables inside database
    void createTables();
    
public:
    DatabaseManager(const DatabaseConfig& db_config);
    
    bool connect();
    bool isConnected() const;
    
    // CRUD operations

    //Image
    int createImage(const Image& image); 
    Image getImage(int id);
    std::vector<Image> getAllImages();
    std::vector<Image> getImagesByStatus(const std::string& status); //delete
    bool updateImageStatus(int id, const std::string& status,   //delete
                          const std::string& error_msg);
    bool deleteImage(int id);
    
    //Tasks
    std::vector<Task> getTasks(const int image_id );
    int createTask(const Task& task);
    
    // Статистика
    struct Statistics {
        int total_images;
        int pending_count;
        int processing_count;
        int completed_count;
        int error_count;
        std::string most_popular_operation;
    };
    
    Statistics getStatistics();
};

#endif