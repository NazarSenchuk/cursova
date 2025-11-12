#include "crow.h"
#include "crow/middlewares/cors.h"
#include "ImageController.h"
#include "DatabaseManager.h"
#include "config/Config.h"
#include <iostream>



int main() {
    // SDK and Crow app init 
    crow::App<crow::CORSHandler> app;
    Aws::SDKOptions options;
    Aws::InitAPI(options);



    // adding midleware for CORS
    auto& cors = app.get_middleware<crow::CORSHandler>();
    cors.global()
        .origin("*")  // allowing all origins
        .methods("GET"_method, "POST"_method, "PUT"_method, "DELETE"_method, "OPTIONS"_method)
        .headers("Content-Type", "Authorization", "X-Requested-With", "Origin", "Accept");


    // database config
    DatabaseConfig db_config;


    //server config
    ServerConfig server_config;
    server_config.port = 8080;

    //r2_config
    R2Config r2_config;

    // Database initialization
    DatabaseManager db_manager(db_config);
    if (!db_manager.connect()) {
        std::cerr << "Failed to connect to database!" << std::endl;
        return 1;
    }


    // R2  initialization
    R2Manager r2_manager(r2_config);
    if(!r2_manager.testConnect()){
        std::cerr << "Failed to connect to r2" << std::endl;
        return 1;
    }
    
    // Controller initialization
    ImageController image_controller(db_manager, r2_manager);

    // routes
    CROW_ROUTE(app, "/api/images")
        .methods("POST"_method)
        ([&image_controller](const crow::request& req) {
            return image_controller.uploadImage(req);
        });
    
    CROW_ROUTE(app, "/api/images")
        .methods("GET"_method)
        ([&image_controller](const crow::request& req) {
            return image_controller.getAllImages(req);
        });
    
    CROW_ROUTE(app, "/api/images/<int>")
        .methods("GET"_method)
        ([&image_controller](const crow::request& req, int id) {
            return image_controller.getImageById(req, id);
        });
    
    CROW_ROUTE(app, "/api/stats")
        .methods("GET"_method)
        ([&image_controller](const crow::request& req) {
            return image_controller.getStats(req);
        });
    
    CROW_ROUTE(app, "/api/images/status/<string>")
        .methods("GET"_method)
        ([&image_controller](const crow::request& req, const std::string& status) {
            return image_controller.getImagesByStatus(req, status);
        });

    CROW_ROUTE(app, "/health")
        .methods("GET"_method)
        ([]() {
            crow::json::wvalue result;
            result["message"] = "CORS test successful";
            result["status"] = "ok";
            return crow::response(result);
        });
    
    std::cout << "C++ API Server with CORS middleware starting on http://localhost:" 
              << server_config.port << std::endl;
    
    // running server with multi thread
    app.port(server_config.port).multithreaded().run();
    //shutdown  AWS SDK
    Aws::ShutdownAPI(options);
    return 0;
}