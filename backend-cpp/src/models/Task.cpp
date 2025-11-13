#include "Task.h"
#include <sstream>
#include <iostream>
#include <pqxx/pqxx>

Task::Task() 
    : id(-1), status("pending") {
}

Task::Task(int image_id, const std::string& processing_type, const std::string& status)
    : id(-1), image_id(image_id), processing_type(processing_type), status(status) {}

    
void Task::fromPgResult(const pqxx::row& row) {
    id = row["id"].as<int>();
    image_id = row["image_id"].as<int>();
    processing_type = row["processing_type"].as<std::string>();
    status = row["status"].as<std::string>();
    
    
    if (!row["duration"].is_null()) {
    duration = row["duration"].as<std::string>();
    } else {
        duration = "";
    }
    created_at = row["created_at"].as<std::string>();
    if (!row["completed_at"].is_null()) {
        completed_at = row["completed_at"].as<std::string>();
    } else {
        completed_at = "";
    }
}

std::string Task::toJson() const {
    std::stringstream json;
    json << "{"
         << "\"id\":" << id << ","
         << "\"processing_type\":\"" << processing_type << "\","
         << "\"image_id\":" << image_id << "," 
         << "\"created_at\":\"" << created_at << "\","
         << "\"completed_at\":\"" << completed_at << "\","
         << "\"duration\":\"" << duration << "\""
         << "}";
    return json.str();
}