#ifndef IMAGE_H
#define IMAGE_H

#include <string>
#include <pqxx/pqxx> 

class Image {
public:
    int id;
    std::string name;
    std::string description;
    std::string filename;
    std::string original_path;
    std::string status;  // "pending", "processing", "completed", "error"
    std::string error_message;
    std::string created_at;
    std::string updated_at;
    Image();
    
    // Конструктор для нових зображень
    Image(const std::string& name, const std::string& description,
             const std::string& filename, const std::string& url);
    std::string toJson() const;
    
    // Заповнення з результату запиту
    void fromPgResult(const pqxx::row& row);
};

#endif