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
    std::cout << "=== Початок створення завдання ===" << std::endl;
    try {
        // Парсинг multipart form data з запиту
        crow::multipart::message msg(req);
        
        // Отримання ID зображення з тіла запиту
        int image_id = std::stoi(msg.get_part_by_name("image_id").body);
        std::cout << "   Image_id: " << image_id << std::endl;

        // Отримання типу обробки з тіла запиту
        std::string processing_type = msg.get_part_by_name("processing_type").body;
        std::cout << "   Processing_type: " << processing_type << std::endl;

        // Збереження завдання в базі даних
        std::cout << "Збереження завдання в базі даних" << std::endl;
        Task new_Task(image_id , processing_type, "pending");  // Статус "очікує"
        int Task_id = db_manager.createTask(new_Task);
        
        // Перевірка успішності створення завдання
        if (Task_id == -1) {
            std::cout << "   ПОМИЛКА: Помилка створення в базі даних" << std::endl;
            return crow::response(500, "Помилка бази даних");
        }     
      
        std::cout << "Завдання збережене " << Task_id << std::endl;
        
        // Формування успішної відповіді
        crow::json::wvalue response; 
        response["image_id"] = image_id;
        response["id"] = Task_id ;
        response["processing_type"] = processing_type;
        response["status"] = "pending";        
        return crow::response(201, response);  // 201 Created
        
    } catch (const std::exception& e) {
        // Обробка винятків з детальним логуванням
        return crow::response(500, std::string("Помилка завантаження: ") + e.what());
    }
}

crow::response TaskController::getTasks(const crow::request& req , int image_id ) {
    try {
        // Отримання завдань з бази даних
        auto Tasks = db_manager.getTasks(image_id );
        crow::json::wvalue response;
        
        // Формування списку завдань у форматі JSON
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
            Tasks_list.push_back(tsk_json);  // Додавання завдання до списку
        }
        
        response["tasks"] = std::move(Tasks_list);  // Переміщення списку у відповідь
        return crow::response(200, response);  // 200 OK
        
    } catch (const std::exception& e) {
        // Обробка помилок при отриманні завдань
        return crow::response(500, std::string("Помилка: ") + e.what());
    }
}