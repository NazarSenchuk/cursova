#ifndef CONFIG_H
#define CONFIG_H
#include <cstdlib> 
#include <iostream>
#include <string>
#include <stdexcept>

struct DatabaseConfig {
    std::string host = "localhost";
    std::string port = "5432";
    std::string name = "image_processor";
    std::string user = "postgres";
    std::string password = "password";
    
    std::string getConnectionString() const {
        return "host=" + host + 
               " port=" + port + 
               " dbname=" + name + 
               " user=" + user + 
               " password=" + password;
    }
    
    DatabaseConfig() {
        if (const char* env_host = std::getenv("DB_HOST")) host = env_host;
        if (const char* env_port = std::getenv("DB_PORT")) port = env_port;
        if (const char* env_user = std::getenv("DB_USER")) user = env_user;
        if (const char* env_password = std::getenv("DB_PASSWORD")) password = env_password;
        // Keep default for DB_NAME if not specified
        if (const char* env_name = std::getenv("DB_NAME")) name = env_name;
    }
};

struct ServerConfig {
    int port = 8080;
    
    ServerConfig() {
        if (const char* env_port = std::getenv("PORT")) {
            try {
                port = std::stoi(env_port);
            } catch (const std::exception& e) {
                std::cerr << "Warning: Invalid PORT environment variable. Using default: " << port << std::endl;
            }
        }
    }
};

struct R2Config {
    std::string bucket_name = "images";
    std::string access_key;
    std::string secret_key;
    std::string endpoint;

    R2Config() {
        if (const char* env_bucket = std::getenv("R2_BUCKET_NAME")) bucket_name = env_bucket;
        if (const char* env_access = std::getenv("R2_ACCESS_KEY")) access_key = env_access;
        if (const char* env_secret = std::getenv("R2_SECRET_KEY")) secret_key = env_secret;
        if (const char* env_endpoint = std::getenv("R2_ENDPOINT")) endpoint = env_endpoint;
    }
};

#endif