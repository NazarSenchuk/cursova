#ifndef R2_MANAGER_H
#define R2_MANAGER_H
#include <aws/core/auth/AWSCredentials.h>  
#include <aws/core/Aws.h>
#include <aws/s3/S3Client.h>
#include <aws/s3/model/PutObjectRequest.h>
#include <aws/s3/model/GetObjectRequest.h>
#include <aws/s3/model/DeleteObjectRequest.h>
#include <aws/s3/model/ListObjectsV2Request.h>
#include <vector>
#include <string>
#include <memory>
#include <iostream>
#include "models/Image.h"
#include "config/Config.h"

class R2Manager {
private:
    
    R2Config config;
    

    
public:
    R2Manager(const R2Config& r2_config);
    ~R2Manager();
    
    bool testConnect();
    std::string uploadImageToR2(const std::string& filename, const std::string& file_data);
    //Image getImageFromS3(int id);
    //int countFiles();
    //bool deleteImageFromS3(int id);
};

#endif