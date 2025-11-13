#ifndef IMAGE_CONTROLLER_H
#define IMAGE_CONTROLLER_H

#include "crow.h"
#include "DatabaseManager.h"
#include "R2Manager.h"
#include "models/Image.h"
#include <string>


class ImageController {
private:
    DatabaseManager& db_manager;
    R2Manager& r2_manager;

    
    std::string saveFile(const crow::request& req, const std::string& filename);
    bool isValidImageFormat(const std::string& filename);
    
public:
    ImageController(DatabaseManager& db , R2Manager& r2_manager );
    crow::response uploadImage(const crow::request& req);
    crow::response getAllImages(const crow::request& req);
    crow::response getImageById(const crow::request& req, int id);
    crow::response getImagesByStatus(const crow::request& req ,  const std::string& status);
    crow::response deleteImage(const crow::request& req, int id);
    crow::response getStats(const crow::request& req);
    
};




#endif