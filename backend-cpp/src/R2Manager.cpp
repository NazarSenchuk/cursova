#include "R2Manager.h"
#include <iostream>
#include <sstream>

R2Manager::R2Manager(const R2Config& r2_config)
    : config(r2_config) {}

R2Manager::~R2Manager() = default;

bool R2Manager::testConnect() {
    Aws::SDKOptions options;
    Aws::InitAPI(options);
    bool success = false;

    {
        Aws::Client::ClientConfiguration client_config;
        client_config.endpointOverride = config.endpoint;
        client_config.scheme = Aws::Http::Scheme::HTTPS;
        client_config.region = "auto";

        Aws::Auth::AWSCredentials creds(config.access_key, config.secret_key);

        Aws::S3::S3Client s3(
            creds,
            client_config,
            Aws::Client::AWSAuthV4Signer::PayloadSigningPolicy::Never,
            false
        );

        Aws::S3::Model::ListObjectsV2Request request;
        request.WithBucket(config.bucket_name);

        auto outcome = s3.ListObjectsV2(request);
        if (outcome.IsSuccess()) {
            std::cout << "✅ Connected to R2 successfully! Objects in bucket:\n";
            for (auto& obj : outcome.GetResult().GetContents()) {
                std::cout << "  - " << obj.GetKey() << " (" << obj.GetSize() << " bytes)\n";
            }
            success = true;
        } else {
            std::cerr << "❌ Connection test failed: "
                      << outcome.GetError().GetMessage() << std::endl;
        }
    }

    Aws::ShutdownAPI(options);
    return success;
}

std::string R2Manager::uploadImageToR2(const std::string& filename, const std::string& file_data) {
    Aws::Client::ClientConfiguration client_config;
    client_config.endpointOverride = config.endpoint;
    client_config.scheme = Aws::Http::Scheme::HTTPS;
    client_config.region = "auto";

    Aws::Auth::AWSCredentials creds(config.access_key, config.secret_key);

    Aws::S3::S3Client s3(
        creds,
        client_config,
        Aws::Client::AWSAuthV4Signer::PayloadSigningPolicy::Never,
        false
    );

    Aws::S3::Model::PutObjectRequest request;
    request.SetBucket(config.bucket_name);
    request.SetKey(filename);

    auto data = std::make_shared<std::stringstream>(file_data);
    request.SetBody(data);

    auto outcome = s3.PutObject(request);

    if (!outcome.IsSuccess()) {
        std::cerr << "❌ Upload failed: " << outcome.GetError().GetMessage() << std::endl;
        return "";
    }

    std::cout << "✅ Uploaded successfully to R2: " << filename << std::endl;
    return config.endpoint + "/" + filename;
}
