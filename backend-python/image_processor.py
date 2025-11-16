import torch
from PIL import Image
from RealESRGAN import RealESRGAN
import os

# Initialize AI model once
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
print(f"Using device: {device}")

model = RealESRGAN(device, scale=2)
model.load_weights('weights/RealESRGAN_x2.pth', download=True)

def process_image(input_path, output_path, processing_type):
    """Process image based on type"""
    try:
        print(f"Processing {input_path} -> {output_path}")
        
        image = Image.open(input_path).convert('RGB')
        
        if processing_type == "enhance":
            sr_image = model.predict(image)
        else:
            # Default processing
            sr_image = model.predict(image)
        
        sr_image.save(output_path)
        print("Processing completed")
        return True
        
    except Exception as e:
        print(f"Processing failed: {e}")
        return False

def cleanup_files(file_paths):
    """Clean up temporary files"""
    for path in file_paths:
        try:
            if os.path.exists(path):
                os.remove(path)
                print(f"Cleaned up: {path}")
        except Exception as e:
            print(f"Cleanup failed {path}: {e}")