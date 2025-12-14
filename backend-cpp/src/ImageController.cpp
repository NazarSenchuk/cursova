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
        // Парсинг multipart form data
        crow::multipart::message msg(req);
        
        // Отримання назви з запиту
        std::string name = msg.get_part_by_name("name").body;
        std::cout << "   Назва: " << name << std::endl;

        // Отримання опису з запиту
        std::string description = msg.get_part_by_name("description").body;
        std::cout << "   Опис: " << description << std::endl;

        // Отримання бінарних даних файлу
        auto file_part = msg.get_part_by_name("file");
        auto content_disposition = file_part.get_header_object("Content-Disposition");
        std::cout << "   Content-Disposition: " << content_disposition.value << std::endl;
        
        // Безпечне отримання імені файлу
        std::string filename;
        auto it = content_disposition.params.find("filename");
        if (it != content_disposition.params.end()) {
            filename = it->second;
            std::cout << "Ім'я файлу: " << filename << std::endl;
        } else {
            std::cout << "   ПОМИЛКА: Ім'я файлу не знайдено" << std::endl;
            return crow::response(400, "Ім'я файлу не надано");
        }
        
        // Витягнення даних файлу
        std::string file_data = file_part.body;
        
        // Перевірка формату зображення
        if (!isValidImageFormat(filename)) {
            std::cout << "   ПОМИЛКА: Невірний формат зображення" << std::endl;
            return crow::response(400, "Невірний формат зображення");
        }

        // Завантаження метаданих в базу даних
        std::cout << "Завантажуємо метадані в базу даних" << std::endl;
        Image new_image(name, description, filename, "", "", "uploaded");
        int image_id = db_manager.createImage(new_image);
        
        // Якщо функція createImage повертає -1, база даних не створила зображення
        if (image_id == -1) {
            std::cout << "   ПОМИЛКА: Помилка створення в базі даних" << std::endl;
            return crow::response(500, "Помилка бази даних");
        }

        // Завантаження фото на віддалене сховище
        std::cout << "Завантажуємо фото на S3" << std::endl;
        r2_manager.uploadImageToR2(filename, file_data ,image_id);
        
        std::cout << "Фото збережене " << image_id << std::endl;
        
        // Формування відповіді
        crow::json::wvalue response; 
        
        response["id"] = image_id;
        response["url"]  = r2_manager.getPublicURL(filename , image_id);
        response["name"] = name ; 
        response["description"] =  description;
        response["filename"] = filename;
        response["status"] = "pending";        
        return crow::response(201, response);
        
    } catch (const std::exception& e) {
        // Логування помилки якщо щось пішло не так
        std::cout << "Виняток: " << e.what() << std::endl;
        std::cout << "Тип винятку: " << typeid(e).name() << std::endl;
        return crow::response(500, std::string("Помилка завантаження: ") + e.what());
    } catch (...) {
        return crow::response(500, "Невідома помилка завантаження");
    }
}

crow::response ImageController::getAllImages(const crow::request& req) {
    try {
        // Використання менеджера бази даних для отримання зображень
        auto images = db_manager.getAllImages();
        crow::json::wvalue response;
        crow::json::wvalue::list images_list;
        
        for (const auto& image : images) {
            // Конвертація кожного зображення в JSON
            crow::json::wvalue img_json;
            img_json["id"] = image.id;
            img_json["name"] = image.name;
            img_json["description"] = image.description;
            img_json["filename"] = image.filename;
            img_json["created_at"] = image.created_at;
            // Додавання зображення до списку
            images_list.push_back(img_json);
        }
        
        response["images"] = std::move(images_list);

        // Повернення відповіді зі списком зображень
        return crow::response(200, response);
        
    } catch (const std::exception& e) {
        // Повернення винятку, якщо щось пішло не так
        return crow::response(500, std::string("Помилка: ") + e.what());
    }
}



crow::response ImageController::getImagesByStatus(const crow::request& req, const std::string& status) {
    try {
        if (status.empty()) {
            return crow::response(400, "Параметр статусу обов'язковий");
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
        return crow::response(500, std::string("Помилка: ") + e.what());
    }
}

crow::response ImageController::getImageById(const crow::request& req, int id) {
    try {
        Image image = db_manager.getImage(id); 

        if (image.id == -1) {
            return crow::response(404, "Зображення не знайдено");
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
        return crow::response(500, std::string("Помилка: ") + e.what());
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
