#ifndef Task_H
#define Task_H

#include <string>
#include <pqxx/pqxx> 

class Task {
public:
    int id;
    int image_id ;
    std::string processing_type;
    std::string status;  // "pending", "processing", "completed", "error"
    std::string created_at;
    std::string completed_at;
    std::string duration;
    Task();
    
    // Constructor for new Task
    Task(int image_id, const std::string& processing_type, const std::string& status);
    
    //function to convert to JSON format
    std::string toJson() const;
    
    // Get  from postgresql resutl
    void fromPgResult(const pqxx::row& row);
};

#endif