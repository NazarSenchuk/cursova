#include "Image.h"
#include <sstream>
#include <iostream>
#include <pqxx/pqxx>

Image::Image() 
    : id(-1), status("pending") {
}

Image::Image(const std::string& name, const std::string& description,
             const std::string& filename, const std::string& url ,const std::string& processed_path  ,const std::string& status )
    : id(-1), name(name), description(description), filename(filename),
      original_path(url), processed_path(url) , status(status) {}

void Image::fromPgResult(const pqxx::row& row) {
    id = row["id"].as<int>();
    name = row["name"].as<std::string>();
    filename = row["filename"].as<std::string>();
    original_path = row["original_path"].as<std::string>();
    processed_path = row["processed_path"].as<std::string>();
    status = row["status"].as<std::string>();
    
    if (!row["error_message"].is_null()) {
        error_message = row["error_message"].as<std::string>();
    }
    
    description  = row["description"].as<std::string>();
    
    created_at = row["created_at"].as<std::string>();
    updated_at = row["updated_at"].as<std::string>();
}

std::string Image::toJson() const {
    std::stringstream json;
    json << "{"
         << "\"id\":" << id << ","
         << "\"name\":\"" << name << "\","
         << "\"description\":\"" << description<< "\","
         << "\"filename\":\"" << filename << "\","
         << "\"original_path\":\"" << original_path << "\","
         << "\"processed_path\":\"" << processed_path << "\","
         << "\"status\":\"" << status << "\","
         << "\"error_message\":\"" << error_message << "\","
         << "\"created_at\":\"" << created_at << "\","
         << "\"updated_at\":\"" << updated_at << "\""
         << "}";
    return json.str();
}