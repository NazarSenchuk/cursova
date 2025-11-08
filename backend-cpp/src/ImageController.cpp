#include "ImageController.h"
#include <fstream>
#include <filesystem>
#include <sstream>
#include <iostream>
#include <algorithm>

ImageController::ImageController(DatabaseManager& db ,  R2Manager& r2_manager)
    : db_manager(db), r2_manager(r2_manager) {
    
    
}


crow::response ImageController::uploadImage(const crow::request& req) {
    try {
        // Parse multipart form data
        crow::multipart::message msg(req);
        
        // Extract form fields
        std::string name = msg.get_part_by_name("name").body;
        std::string description = msg.get_part_by_name("description").body;
        
        // Extract file
        auto file_part = msg.get_part_by_name("file");
        auto content_disposition = file_part.get_header_object("Content-Disposition");
        
        // Safely extract filename from const params map
        std::string filename;
        auto it = content_disposition.params.find("filename");
        if (it != content_disposition.params.end()) {
            filename = it->second;
        } else {
            return crow::response(400, "No filename provided");
        }
        
        // ADD THIS LINE - Extract the actual file data
        std::string file_data = file_part.body;
        
        if (!isValidImageFormat(filename)) {
            return crow::response(400, "Invalid image format");
        }
        
        // Upload to R2
        std::string url = r2_manager.uploadImageToR2(filename, file_data);
        if (url.empty()) {
            return crow::response(500, "Failed to upload image to R2");
        }
        
        // Create DB record
        Image new_image(name, description, filename, url);
        int image_id = db_manager.createImage(new_image);
        
        if (image_id == -1) {
            return crow::response(500, "Database error");
        }
        
        crow::json::wvalue response;
        response["id"] = image_id;
        response["filename"] = filename;
        response["status"] = "pending";
        
        return crow::response(201, response);
        
    } catch (const std::exception& e) {
        return crow::response(500, std::string("Upload error: ") + e.what());
    }
}

crow::response ImageController::getAllImages(const crow::request& req) {
    try {
        auto images = db_manager.getAllImages();
        crow::json::wvalue response;
        
        response["count"] = images.size();
        
        crow::json::wvalue::list images_list;
        for (const auto& image : images) {
            crow::json::wvalue img_json;
            img_json["id"] = image.id;
            img_json["filename"] = image.filename;
            img_json["status"] = image.status;
            img_json["created_at"] = image.created_at;
            images_list.push_back(img_json);
        }
        
        response["images"] = std::move(images_list);
        return crow::response(200, response);
        
    } catch (const std::exception& e) {
        return crow::response(500, std::string("Error: ") + e.what());
    }
}



crow::response ImageController::getStats(const crow::request& req) {
    try {
        auto stats = db_manager.getStatistics();
        
        crow::json::wvalue response;
        response["total_images"] = stats.total_images;
        response["pending"] = stats.pending_count;
        response["processing"] = stats.processing_count;
        response["completed"] = stats.completed_count;
        response["error"] = stats.error_count;
        response["most_popular_operation"] = stats.most_popular_operation;
        
        return crow::response(200, response);
        
    } catch (const std::exception& e) {
        return crow::response(500, std::string("Statistics error: ") + e.what());
    }
}

crow::response ImageController::getImagesByStatus(const crow::request& req  , const std::string& status) {
    try {
        if (status.empty()) {
            return crow::response(400, "Status parameter required");
        }
        
        auto images = db_manager.getImagesByStatus(status);
        crow::json::wvalue response;
        
        response["count"] = images.size();
        response["status"] = status;
        
        crow::json::wvalue::list images_list;
        for (const auto& image : images) {
            crow::json::wvalue img_json;
            img_json["id"] = image.id;
            img_json["filename"] = image.filename;
            img_json["status"] = image.status;
            img_json["created_at"] = image.created_at;
            images_list.push_back(img_json);
        }
        
        response["images"] = std::move(images_list);
        return crow::response(200, response);
        
    } catch (const std::exception& e) {
        return crow::response(500, std::string("Error: ") + e.what());
    }
}
crow::response ImageController::getImageById(const crow::request& req, int id) {
    try {
        Image image = db_manager.getImage(id); // returns an Image object

        // If your DBManager signals "not found" by throwing or by a special ID (like -1), check that:
        if (image.id == -1) {
            return crow::response(404, "Image not found");
        }

        crow::json::wvalue response;
        response["id"] = image.id;
        response["filename"] = image.filename;
        response["status"] = image.status;
        response["created_at"] = image.created_at;
        return crow::response(200, response);

    } catch (const std::exception& e) {
        return crow::response(500, std::string("Error: ") + e.what());
    }
}

bool ImageController::isValidImageFormat(const std::string& filename) {
    std::string allowed_ext[] = {".jpg", ".jpeg", ".png", ".gif", ".bmp"};
    std::string lower_filename = filename;
    std::transform(lower_filename.begin(), lower_filename.end(), lower_filename.begin(), ::tolower);
    for (auto& ext : allowed_ext) {
        if (lower_filename.size() >= ext.size() &&
            lower_filename.compare(lower_filename.size() - ext.size(), ext.size(), ext) == 0)
            return true;
    }
    return false;
}



void ImageController::registerRoutes(crow::SimpleApp& app) {
    CROW_ROUTE(app, "/api/images")
        .methods("POST"_method)
        ([this](const crow::request& req) {
            return this->uploadImage(req);
        });
    
    CROW_ROUTE(app, "/api/images")
        .methods("GET"_method)
        ([this](const crow::request& req) {
            return this->getAllImages(req);
        });
    
    CROW_ROUTE(app, "/api/images/<int>")
        .methods("GET"_method)
        ([this](const crow::request& req, int id) {
            return this->getImageById(req, id);
        });
    
    CROW_ROUTE(app, "/api/stats")
        .methods("GET"_method)
        ([this](const crow::request& req) {
            return this->getStats(req);
        });
}

