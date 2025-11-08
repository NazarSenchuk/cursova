#ifndef DATABASE_MANAGER_H
#define DATABASE_MANAGER_H

#include <pqxx/pqxx>
#include <vector>
#include <string>
#include <memory>
#include "models/Image.h"
#include "config/Config.h"

// Forward declaration only
class ImageController;

class DatabaseManager {
private:
    std::unique_ptr<pqxx::connection> connection;
    DatabaseConfig config;
    
    void createTables();
    
public:
    DatabaseManager(const DatabaseConfig& db_config);
    ~DatabaseManager();
    
    bool connect();
    bool isConnected() const;
    
    // CRUD операції
    int createImage(const Image& image);
    Image getImage(int id);
    std::vector<Image> getAllImages();
    std::vector<Image> getImagesByStatus(const std::string& status);
    bool updateImageStatus(int id, const std::string& status, 
                          const std::string& error_msg);
    bool deleteImage(int id);
    
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