import os

# Database config
DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'port': int(os.getenv('DB_PORT', '5432')),
    'user': os.getenv('DB_USER', 'postgres'),
    'password': os.getenv('DB_PASSWORD', ''),
    'database': os.getenv('DB_NAME', 'image_processor')
}

# R2 config
R2_CONFIG = {
    'endpoint_url': os.getenv('R2_ENDPOINT', 'https://your-account.r2.cloudflarestorage.com'),
    'access_key_id': os.getenv('R2_ACCESS_KEY', 'your_access_key'),
    'secret_access_key': os.getenv('R2_SECRET_KEY', 'your_secret_key'),
    'bucket_name': os.getenv('R2_BUCKET', 'images'),
    'region_name': os.getenv('R2_REGION', 'auto')
}