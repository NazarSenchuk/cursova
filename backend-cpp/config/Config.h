#ifndef CONFIG_H
#define CONFIG_H

#include <string>

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
};

struct ServerConfig {
    int port = 8080;

};

#endif