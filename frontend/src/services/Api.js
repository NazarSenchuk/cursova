import axios from 'axios';

const API_CONFIG = {
  baseURL: import.meta.env.APP_API_URL || 'http://localhost:8080/api', 
  timeout:  10000,
  headers: {
    'Content-Type': 'application/json',
  }
};

console.log('API Configuration:', {
  baseURL: API_CONFIG.baseURL,
  timeout: API_CONFIG.timeout,
  mode: 'no-cors',
});

const apiClient = axios.create(API_CONFIG);

export class Api {

  static async getImages() {
    try {
      console.log('Fetching images from:', `${API_CONFIG.baseURL}/images`);
      const response = await apiClient.get('/images');

      return response.data.images || [];
    } catch (error) {
      console.error('Error fetching images:', error);
      return this.getMockImages();
    }
  }

  static async getImageById(imageId) {
    try {
      const response = await apiClient.get(`/images/${imageId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching image by ID:', error);
      throw new Error('Failed to fetch image');
    }
  }

  static async uploadImage(file, name ,description ) {
    try {
      const formData = new FormData();
      formData.append('file', file); 
      formData.append('name', name);
      formData.append('description', description || '');
      console.log(formData);
      const response = await apiClient.post('/images', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000,
        onUploadProgress: (progressEvent) => {
          const progress = (progressEvent.loaded / progressEvent.total) * 100;
          console.log(`Upload progress: ${progress}%`);
        }
      });

      return {
        id: response.data.id,
        filename: response.data.filename,
        url: response.data.url || `https://picsum.photos/200/300?random=${response.data.id}`,
        status: response.data.status,
        uploadedAt: new Date().toISOString(),
        name: name,
        description: description
      };
    } catch (error) {
      console.error('Error uploading image:', error);
      if (error.response && error.response.status === 400) {
        throw new Error('Invalid image format. Please use JPG, JPEG, PNG, GIF, or BMP.');
      }
      throw new Error('Failed to upload image');
    }
  }

  static async deleteImage(imageId) {
    try {

      const response = await apiClient.delete(`/images/${imageId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting image:', error);
      throw new Error('Failed to delete image');
    }
  }

  // Stats endpoints
  static async getAdminStats() {
    try {
      const response = await apiClient.get('/stats');
      
      // Your API returns different field names, map them to expected format
      const stats = response.data;
      return {
        totalImages: stats.total_images || 0,
        processedImages: stats.completed || 0,
        processingQueue: stats.processing || 0,
        errorCount: stats.error || 0,
        pendingCount: stats.pending || 0,
        mostPopularOperation: stats.most_popular_operation || 'None'
      };
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      return this.getMockStats();
    }
  }

  // Image processing endpoints (you'll need to implement these in your C++ API)
  static async processImage(imageId, operation, params = {}) {
    try {
      // You'll need to add this endpoint to your ImageController
      const response = await apiClient.post(`/images/${imageId}/process`, {
        operation,
        params
      });
      return response.data;
    } catch (error) {
      console.error('Error processing image:', error);
      throw new Error('Failed to process image');
    }
  }

  static async getProcessedImages() {
    try {
      // You can use the status filter endpoint if you implement it
      const response = await apiClient.get('/images/status/completed');
      return response.data.images || [];
    } catch (error) {
      console.error('Error fetching processed images:', error);
      return [];
    }
  }

  static async getProcessingLogs() {
    try {
      // You'll need to implement this endpoint in your C++ API
      const response = await apiClient.get('/admin/logs');
      return response.data;
    } catch (error) {
      console.error('Error fetching processing logs:', error);
      return this.getMockLogs();
    }
  }

  static async generateReport(reportType) {
    try {
      // You'll need to implement this endpoint in your C++ API
      const response = await apiClient.post('/reports/generate', {
        reportType
      });
      return response.data;
    } catch (error) {
      console.error('Error generating report:', error);
      throw new Error('Failed to generate report');
    }
  }

  // Helper method to get images by status (you have this endpoint in C++)
  static async getImagesByStatus(status) {
    try {
      const response = await apiClient.get(`/images/status/${status}`);
      return response.data.images || [];
    } catch (error) {
      console.error(`Error fetching ${status} images:`, error);
      return [];
    }
  }

  // Mock data fallbacks
  static getMockImages() {
    console.warn('Using mock images data - API might be unavailable');
    return [
      {
        id: 1,
        filename: 'sample1.jpg',
        name: 'Sample Image 1',
        description: 'This is a sample image',
        url: 'https://picsum.photos/200/300',
        status: 'completed',
        uploadedAt: new Date().toISOString(),
        size: 1024 * 1024,
        type: 'image/jpeg'
      },
      {
        id: 2,
        filename: 'sample2.jpg',
        name: 'Sample Image 2',
        description: 'Another sample image',
        url: 'https://picsum.photos/200/301',
        status: 'pending',
        uploadedAt: new Date().toISOString(),
        size: 1024 * 512,
        type: 'image/jpeg'
      }
    ];
  }

  static getMockStats() {
    return {
      totalImages: 15,
      processedImages: 8,
      processingQueue: 2,
      errorCount: 1,
      pendingCount: 4,
      storageUsed: '45.2 MB',
      activeUsers: 3,
      mostPopularOperation: 'resize'
    };
  }

  static getMockLogs() {
    return [
      {
        id: 1,
        filename: 'image1.jpg',
        operation: 'resize',
        status: 'completed',
        timestamp: new Date().toISOString(),
        duration: '1.2s',
        userId: 'user123'
      },
      {
        id: 2,
        filename: 'image2.jpg',
        operation: 'grayscale',
        status: 'error',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        duration: '0.5s',
        userId: 'user123',
        error: 'Invalid image format'
      }
    ];
  }
}

// Add request interceptor for logging
apiClient.interceptors.request.use(
  (config) => {
    console.log(`Making ${config.method?.toUpperCase()} request to: ${config.url}`);
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      // Server responded with error status
      console.error('API Error:', error.response.status, error.response.data);
      
      // You can handle specific status codes here
      switch (error.response.status) {
        case 400:
          error.message = 'Bad request: ' + (error.response.data || 'Invalid data');
          break;
        case 404:
          error.message = 'Resource not found';
          break;
        case 500:
          error.message = 'Server error: ' + (error.response.data || 'Internal server error');
          break;
        default:
          error.message = `Request failed with status ${error.response.status}`;
      }
    } else if (error.request) {
      // Request made but no response received
      console.error('Network Error:', error.message);
      error.message = 'Network error: Unable to connect to server';
    } else {
      // Something else happened
      console.error('Error:', error.message);
    }
    
    return Promise.reject(error);
  }
);