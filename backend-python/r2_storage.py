import boto3
from botocore.config import Config
from config import R2_CONFIG

# Initialize R2 client
r2_client = boto3.client(
    's3',
    endpoint_url=R2_CONFIG['endpoint_url'],
    aws_access_key_id=R2_CONFIG['access_key_id'],
    aws_secret_access_key=R2_CONFIG['secret_access_key'],
    config=Config(signature_version='s3v4')
)

def download_from_r2(r2_path, local_path):
    """Download file from R2"""
    try:
        r2_client.download_file(R2_CONFIG['bucket_name'], r2_path, local_path)
        print(f"Downloaded: {r2_path}")
        return True
    except Exception as e:
        print(f"Download failed {r2_path}: {e}")
        return False

def upload_to_r2(local_path, r2_path):
    """Upload file to R2"""
    try:
        r2_client.upload_file(local_path, R2_CONFIG['bucket_name'], r2_path)
        print(f"Uploaded: {r2_path}")
        return True
    except Exception as e:
        print(f"Upload failed {r2_path}: {e}")
        return False