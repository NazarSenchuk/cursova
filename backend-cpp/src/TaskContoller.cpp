#include "TaskController.h"
#include <fstream>
#include <filesystem>
#include <sstream>
#include <iostream>
#include <algorithm>

TaskController::TaskController(DatabaseManager& db, R2Manager& r2_manager)
    : db_manager(db), r2_manager(r2_manager) {
}



crow::response TaskController::createTask(const crow::request& req) {
    std::cout << "=== Початок оброблення фото ===" << std::endl;
    try {
        
        // Parse multipart form data
        crow::multipart::message msg(req);
        int image_id = std::stoi(msg.get_part_by_name("image_id").body);
        std::cout << "   Image_id: " << image_id << std::endl;

        std::string processing_type = msg.get_part_by_name("processing_type").body;
        std::cout << "   Processing_type: " << processing_type << std::endl;

        std::cout << "Saving task to database" << std::endl;
        Task new_Task(image_id , processing_type, "pending");
        int Task_id = db_manager.createTask(new_Task);
        
        if (Task_id == -1) {
            std::cout << "   ERROR: Database creation failed" << std::endl;
            return crow::response(500, "Database error");
        }     
      
        std::cout << "Task saved" << Task_id << std::endl;
        
        crow::json::wvalue response; 
        response["image_id"] = image_id;
        response["id"] = Task_id ;
        response["processing_type"] = processing_type;
        response["status"] = "pending";        
        return crow::response(201, response);
        
    } catch (const std::exception& e) {
        std::cout << "=== UPLOAD Task EXCEPTION ===" << std::endl;
        std::cout << "Exception: " << e.what() << std::endl;
        std::cout << "Exception type: " << typeid(e).name() << std::endl;
        return crow::response(500, std::string("Upload error: ") + e.what());
    } catch (...) {
        std::cout << "=== UPLOAD Task UNKNOWN EXCEPTION ===" << std::endl;
        return crow::response(500, "Unknown upload error");
    }
}
crow::response TaskController::getTasks(const crow::request& req , int image_id ) {
    try {
        auto Tasks = db_manager.getTasks(image_id );
        crow::json::wvalue response;
        
        crow::json::wvalue::list Tasks_list;
        for (const auto& Task : Tasks) {
            crow::json::wvalue tsk_json;
            tsk_json["id"] = Task.id;
            tsk_json["image_id"] = Task.image_id;
            tsk_json["status"] =  Task.status;
            tsk_json["created_at"]  = Task.created_at;
            tsk_json["completed_at"] = Task.completed_at;
            tsk_json["duration"] = Task.duration;            
            tsk_json["processing_type"] = Task.processing_type;
            Tasks_list.push_back(tsk_json);
        }
        
        response["tasks"] = std::move(Tasks_list);
        return crow::response(200, response);
        
    } catch (const std::exception& e) {
        return crow::response(500, std::string("Error: ") + e.what());
    }
}
