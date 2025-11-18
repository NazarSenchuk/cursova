#include "ImageController.h"
#include <fstream>
#include <filesystem>
#include <sstream>
#include <iostream>
#include <algorithm>

ImageController::ImageController(DatabaseManager& db, R2Manager& r2_manager)
    : db_manager(db), r2_manager(r2_manager) {
}



crow::response ImageController::uploadImage(const crow::request& req) {
    std::cout << "=== Початок оброблення фото ===" << std::endl;
    try {
        
        // Parse multipart form data
        crow::multipart::message msg(req);
        
       
        //Getting name from request 
        std::string name = msg.get_part_by_name("name").body;
        std::cout << "   Name: " << name << std::endl;

        //Getting description from request
        std::string description = msg.get_part_by_name("description").body;
        std::cout << "   Description: " << description << std::endl;


        // Getting  binary file data
        auto file_part = msg.get_part_by_name("file");
        auto content_disposition = file_part.get_header_object("Content-Disposition");
        std::cout << "   Content-Disposition: " << content_disposition.value << std::endl;
        

        // Safely extract filename
        std::string filename;
        auto it = content_disposition.params.find("filename");
        if (it != content_disposition.params.end()) {
            filename = it->second;
            std::cout << "Filename: " << filename << std::endl;
        } else {
            std::cout << "   ERROR: No filename found" << std::endl;
            return crow::response(400, "No filename provided");
        }
        

        
        // Extract file data
        std::string file_data = file_part.body;
                if (!isValidImageFormat(filename)) {
            std::cout << "   ERROR: Invalid image format" << std::endl;
            return crow::response(400, "Invalid image format");
        }


        //Load metadata to database
        std::cout << "Загружаємо метадані в базу даних" << std::endl;
        Image new_image(name, description, filename, "", "", "uploaded");
        int image_id = db_manager.createImage(new_image);
        
        //if database function createImage returns -1 , database doesn't create image 
        if (image_id == -1) {
            std::cout << "   ERROR: Database creation failed" << std::endl;
            return crow::response(500, "Database error");
        }

        //Loading photo on remote storage
        std::cout << "Загружаємо фото на S3" << std::endl;
        r2_manager.uploadImageToR2(filename, file_data ,image_id);
        
      
        std::cout << "Фото збережене " << image_id << std::endl;
        

        // return response
        crow::json::wvalue response; 
        response["id"] = image_id;
        response["url"]  = r2_manager.getPublicURL(filename , image_id);
        response["name"] = name ; 
        response["description"] =  description;
        response["filename"] = filename;
        response["status"] = "pending";        
        return crow::response(201, response);
        
    } catch (const std::exception& e) {

        // If something wrong  we  log about error
        std::cout << "Exception: " << e.what() << std::endl;
        std::cout << "Exception type: " << typeid(e).name() << std::endl;
        return crow::response(500, std::string("Upload error: ") + e.what());
    } catch (...) {
        return crow::response(500, "Unknown upload error");
    }
}


crow::response ImageController::getAllImages(const crow::request& req) {
    try {
        // use database manager to images
        auto images = db_manager.getAllImages();
        crow::json::wvalue response;
        crow::json::wvalue::list images_list;
        for (const auto& image : images) {
            // converting every image to json
            crow::json::wvalue img_json;
            img_json["id"] = image.id;
            img_json["name"] = image.name;
            img_json["description"] = image.description;
            img_json["filename"] = image.filename;
            img_json["created_at"] = image.created_at;
            // push image to list
            images_list.push_back(img_json);
        }
        
        response["images"] = std::move(images_list);

        // returning response with list of images
        return crow::response(200, response);
        
    } catch (const std::exception& e) {
        //  Return exception , if something wrong 
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

crow::response ImageController::getImagesByStatus(const crow::request& req, const std::string& status) {
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
        Image image = db_manager.getImage(id); 

        if (image.id == -1) {
            return crow::response(404, "Image not found");
        }

        crow::json::wvalue response;
        response["id"] = image.id;
        response["name"] = image.name;
        response["filename"] = image.filename;
        response["status"] = image.status;
        response["description"] = image.description;
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
