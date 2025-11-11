#include "R2Manager.h"
#include <iostream>
#include <sstream>
#include <thread>
#include <chrono>

R2Manager::R2Manager(const R2Config& r2_config)
    : config(r2_config) {}

R2Manager::~R2Manager() = default;

bool R2Manager::testConnect() {
    std::cout << "=== R2 CONNECTION TEST ===" << std::endl;
    
    try {
        Aws::Client::ClientConfiguration client_config;
        client_config.endpointOverride = config.endpoint;
        client_config.scheme = Aws::Http::Scheme::HTTPS;
        client_config.region = "auto";
        client_config.requestTimeoutMs = 10000;
        client_config.connectTimeoutMs = 5000;

        Aws::Auth::AWSCredentials creds(config.access_key, config.secret_key);

        Aws::S3::S3Client s3_client(
            creds,
            client_config,
            Aws::Client::AWSAuthV4Signer::PayloadSigningPolicy::Never,
            false
        );

        Aws::S3::Model::ListObjectsV2Request request;
        request.WithBucket(config.bucket_name);
        request.SetMaxKeys(10);

        std::cout << "Testing R2 connection..." << std::endl;
        auto outcome = s3_client.ListObjectsV2(request);
        
        if (outcome.IsSuccess()) {
            std::cout << "✅ Connected to R2 successfully! Objects in bucket:" << std::endl;
            auto objects = outcome.GetResult().GetContents();
            if (objects.empty()) {
                std::cout << "  - (bucket is empty)" << std::endl;
            } else {
                for (const auto& obj : objects) {
                    std::cout << "  - " << obj.GetKey() << " (" << obj.GetSize() << " bytes)" << std::endl;
                }
            }
            return true;
        } else {
            std::cerr << "❌ Connection test failed: " << outcome.GetError().GetMessage() << std::endl;
            return false;
        }
        
    } catch (const std::exception& e) {
        std::cerr << "❌ Connection test exception: " << e.what() << std::endl;
        return false;
    }
}

std::string R2Manager::uploadImageToR2(const std::string& filename, const std::string& file_data , const int id ) {
    std::cout << "=== R2 UPLOAD START ===" << std::endl;
    std::cout << "Filename: " << filename << std::endl;
    std::cout << "File size: " << file_data.size() << std::endl;

    try {
        Aws::Client::ClientConfiguration client_config;
        client_config.endpointOverride = config.endpoint;
        client_config.scheme = Aws::Http::Scheme::HTTPS;
        client_config.region = "auto";
        client_config.requestTimeoutMs = 30000;
        client_config.connectTimeoutMs = 10000;

        Aws::Auth::AWSCredentials creds(config.access_key, config.secret_key);

        Aws::S3::S3Client s3_client(
            creds,
            client_config,
            Aws::Client::AWSAuthV4Signer::PayloadSigningPolicy::Never,
            false
        );

        Aws::S3::Model::PutObjectRequest request;
        request.SetBucket(config.bucket_name);
        request.SetKey("original/" +   std::to_string(id) + "-" + filename);

        auto stream = Aws::MakeShared<Aws::StringStream>("R2Upload");
        *stream << file_data;
        request.SetBody(stream);

        std::cout << "Making PutObject request..." << std::endl;

        // Single attempt with detailed error handling
        auto outcome = s3_client.PutObject(request);

        if (outcome.IsSuccess()) {
            std::cout << "✅ Uploaded successfully to R2: " << filename << std::endl;
            std::string url = config.endpoint + "/" + config.bucket_name + "/" + "/original/" + filename;
            std::cout << "Generated URL: " << url << std::endl;
            return url;
        } else {
            std::cerr << "❌ Upload failed: " << outcome.GetError().GetMessage() << std::endl;
            std::cerr << "Error type: " << outcome.GetError().GetExceptionName() << std::endl;
            return "";
        }

    } catch (const std::exception& e) {
        std::cerr << "❌ R2 Upload Exception: " << e.what() << std::endl;
        return "";
    } catch (...) {
        std::cerr << "❌ R2 Upload Unknown Exception" << std::endl;
        return "";
    }
}