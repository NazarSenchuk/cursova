#ifndef TASK_CONTROLLER_H
#define TASK_CONTROLLER_H

#include "crow.h"
#include "DatabaseManager.h"
#include "R2Manager.h"
#include "models/Task.h"
#include <string>


class TaskController {
private:
    DatabaseManager& db_manager;
    R2Manager& r2_manager;

    
public:
    TaskController(DatabaseManager& db , R2Manager& r2_manager );
    crow::response createTask(const crow::request& req );
    crow::response getTasks(const crow::request& req , int image_id );
};




#endif