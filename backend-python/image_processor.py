import cv2
import numpy as np
import os
from enum import Enum

class ProcessingType(Enum):
    WHITE_BLUE = "white-blue"
    GRAYSCALE = "grayscale"
    BLUR = "blur"
    SHARPEN = "sharpen"
    EDGE_DETECTION = "edge-detection"
    SEPIA = "sepia"
    INVERT = "invert"
    BRIGHTNESS = "brightness"
    CONTRAST = "contrast"

def process_image(input_path, output_path, processing_type):
    """Process image based on type using OpenCV"""
    try:
        print(f"Processing image: {input_path} -> {output_path} with type: {processing_type}")
        
        # Read the image
        if not os.path.exists(input_path):
            print(f"Input file not found: {input_path}")
            return False
            
        image = cv2.imread(input_path)
        if image is None:
            print(f"Failed to read image: {input_path}")
            return False
        
        # Process based on type
        processed_image = None
        
        if processing_type == ProcessingType.WHITE_BLUE.value:
            processed_image = apply_white_blue_effect(image)
        elif processing_type == ProcessingType.GRAYSCALE.value:
            processed_image = apply_grayscale(image)
        elif processing_type == ProcessingType.BLUR.value:
            processed_image = apply_blur(image)
        elif processing_type == ProcessingType.SHARPEN.value:
            processed_image = apply_sharpen(image)
        elif processing_type == ProcessingType.EDGE_DETECTION.value:
            processed_image = apply_edge_detection(image)
        elif processing_type == ProcessingType.SEPIA.value:
            processed_image = apply_sepia(image)
        elif processing_type == ProcessingType.INVERT.value:
            processed_image = apply_invert(image)
        elif processing_type == ProcessingType.BRIGHTNESS.value:
            processed_image = adjust_brightness(image, value=50)
        elif processing_type == ProcessingType.CONTRAST.value:
            processed_image = adjust_contrast(image, value=1.5)
        
        # Save the processed image
        success = cv2.imwrite(output_path, processed_image)
        if not success:
            print(f"Failed to save processed image: {output_path}")
            return False
            
        print(f"Successfully processed and saved: {output_path}")
        return True
        
    except Exception as e:
        print(f"Error processing image: {e}")
        return False

def apply_white_blue_effect(image):
    # Convert to float for processing
    result = image.astype(np.float32) / 255.0
    
    # Enhance blue channel, reduce red and green
    result[:, :, 0] = result[:, :, 0] * 1.2  # Blue
    result[:, :, 1] = result[:, :, 1] * 0.8  # Green
    result[:, :, 2] = result[:, :, 2] * 0.8  # Red
    
    # Increase brightness for white effect
    result = cv2.addWeighted(result, 1.2, result, 0, 0.1)
    
    # Clip values to valid range and convert back
    result = np.clip(result, 0, 1)
    return (result * 255).astype(np.uint8)

def apply_grayscale(image):
    return cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

def apply_blur(image, kernel_size=15):
    return cv2.GaussianBlur(image, (kernel_size, kernel_size), 0)

def apply_sharpen(image):
    kernel = np.array([[-1, -1, -1],
                       [-1,  9, -1],
                       [-1, -1, -1]])
    return cv2.filter2D(image, -1, kernel)

def apply_edge_detection(image):
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    edges = cv2.Canny(gray, 100, 200)
    return cv2.cvtColor(edges, cv2.COLOR_GRAY2BGR)

def apply_sepia(image):
    kernel = np.array([[0.272, 0.534, 0.131],
                       [0.349, 0.686, 0.168],
                       [0.393, 0.769, 0.189]])
    sepia = cv2.transform(image, kernel)
    return np.clip(sepia, 0, 255).astype(np.uint8)

def apply_invert(image):
    return 255 - image

def adjust_brightness(image, value=30):
    hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
    h, s, v = cv2.split(hsv)
    
    v = cv2.add(v, value)
    v = np.clip(v, 0, 255)
    
    hsv = cv2.merge([h, s, v])
    return cv2.cvtColor(hsv, cv2.COLOR_HSV2BGR)

def adjust_contrast(image, value=1.5):
    return cv2.convertScaleAbs(image, alpha=value, beta=0)

def cleanup_files(file_paths):
    for path in file_paths:
        try:
            if os.path.exists(path):
                os.remove(path)
                print(f"Cleaned up: {path}")
        except Exception as e:
            print(f"Cleanup failed {path}: {e}")