#include "R2Manager.h"
#include <iostream>
#include <sstream>
#include <thread>
#include <chrono>

R2Manager::R2Manager(const R2Config& r2_config)
    : config(r2_config) {}

R2Manager::~R2Manager() = default;

// Метод для тестування підключення до Cloudflare R2
bool R2Manager::testConnect() {
    try {
        // Конфігурація клієнта AWS S3 для R2
        Aws::Client::ClientConfiguration client_config;
        client_config.endpointOverride = config.endpoint;  
        client_config.scheme = Aws::Http::Scheme::HTTPS;  
        client_config.region = "auto";                    
        client_config.requestTimeoutMs = 10000;          
        client_config.connectTimeoutMs = 5000;             

        // Автентифікаційні дані для R2
        Aws::Auth::AWSCredentials creds(config.access_key, config.secret_key);

        // Створення S3 клієнта для роботи з R2
        Aws::S3::S3Client s3_client(
            creds,
            client_config,
            Aws::Client::AWSAuthV4Signer::PayloadSigningPolicy::Never,
            false
        );

        // Запит на отримання списку об'єктів для тестування підключення
        Aws::S3::Model::ListObjectsV2Request request;
        request.WithBucket(config.bucket_name);  // Вказання імені бакета
        request.SetMaxKeys(10);                  // Обмеження кількості об'єктів

        std::cout << "Тестування підключення до R2..." << std::endl;
        auto outcome = s3_client.ListObjectsV2(request);  // Виконання запиту
        
        if (outcome.IsSuccess()) {
            std::cout << "✅ Успішно підключено до R2!" << std::endl;
            return true;
        } else {
            std::cerr << "❌ Тест підключення невдалий: " << outcome.GetError().GetMessage() << std::endl;
            return false;
        }
        
    } catch (const std::exception& e) {
        std::cerr << "❌ Виняток тесту підключення: " << e.what() << std::endl;
        return false;
    }
}

// Метод для завантаження зображення на R2
std::string R2Manager::uploadImageToR2(const std::string& filename, const std::string& file_data , const int id ) {
    try {
        // Конфігурація клієнта з більшими таймаутами для завантаження
        Aws::Client::ClientConfiguration client_config;
        client_config.endpointOverride = config.endpoint;
        client_config.scheme = Aws::Http::Scheme::HTTPS;
        client_config.region = "auto";
        client_config.requestTimeoutMs = 30000;   // 30 секунд для великих файлів
        client_config.connectTimeoutMs = 10000;   // 10 секунд для підключення

        // Автентифікаційні дані
        Aws::Auth::AWSCredentials creds(config.access_key, config.secret_key);

        // Створення S3 клієнта
        Aws::S3::S3Client s3_client(
            creds,
            client_config,
            Aws::Client::AWSAuthV4Signer::PayloadSigningPolicy::Never,
            false
        );

        // Запит на завантаження об'єкта
        Aws::S3::Model::PutObjectRequest request;
        request.SetBucket(config.bucket_name);  // Вказання бакета
        // Формування ключа: original/{id}-{filename}
        request.SetKey("original/" + std::to_string(id) + "-" + filename);

        // Створення потоку для даних файлу
        auto stream = Aws::MakeShared<Aws::StringStream>("R2Upload");
        *stream << file_data;  // Запис даних у потік
        request.SetBody(stream);  // Встановлення тіла запиту

        // Виконання запиту на завантаження
        auto outcome = s3_client.PutObject(request);

        if (outcome.IsSuccess()) {
            return "";  // Повертаємо пустий рядок при успіху
        } else {
            std::cerr << "❌ Помилка завантаження: " << outcome.GetError().GetMessage() << std::endl;
            std::cerr << "Тип помилки: " << outcome.GetError().GetExceptionName() << std::endl;
            return "";
        }

    } catch (const std::exception& e) {
        std::cerr << "❌ Виняток завантаження R2: " << e.what() << std::endl;
        return "";
    } catch (...) {
        std::cerr << "❌ Невідомий виняток завантаження R2" << std::endl;
        return "";
    }
}

std::string R2Manager::getPublicURL(const std::string& filename , const int id){
    // Формування публічного URL: {public_url}/original/{id}-{filename}
    return config.public_url + "/original/" + std::to_string(id) + "-" + filename;
}