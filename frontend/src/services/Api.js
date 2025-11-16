import axios from 'axios';

const API_CONFIG = {
  baseURL: import.meta.env.APP_API_URL || 'http://localhost:8080/api', 
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
};

const apiClient = axios.create(API_CONFIG);

export class Api {
  // Tasks endpoints
  static async getTasks(imageId = null) {
    try {
      const url = imageId ? `/tasks/${imageId}` : '/tasks';
      const response = await apiClient.get(url);
      const tasks = response.data.tasks || response.data || [];
      return Array.isArray(tasks) ? tasks : [tasks];
    } catch (error) {
      console.error('Error fetching tasks:', error);
      return [];
    }
  }

  static async createTask(imageId, processingType) {
    try {
      const formData = new FormData();
      formData.append('image_id', imageId.toString());
      formData.append('processing_type', processingType);
  
      const response = await apiClient.post('/tasks', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      return {
        id: response.data.id,
        processing_type: processingType,
        image_id: imageId,
        status: response.data.status || 'pending',
        created_at: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error creating task:', error);
      throw new Error('Failed to create processing task');
    }
  }

  // Image endpoints
  static async getImages() {
    try {
      const response = await apiClient.get('/images');
      return response.data.images || [];
    } catch (error) {
      console.error('Error fetching images:', error);
      return [];
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

  static async uploadImage(file, name, description) {
    try {
      const formData = new FormData();
      formData.append('file', file); 
      formData.append('name', name);
      formData.append('description', description || '');

      const response = await apiClient.post('/images', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 30000,
      });

      return {
        id: response.data.id,
        filename: response.data.filename,
        url: response.data.url,
        status: response.data.status,
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

  // Stats endpoint
  static async getAdminStats() {
    try {
      const response = await apiClient.get('/stats');
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
      return {
        totalImages: 0,
        processedImages: 0,
        processingQueue: 0,
        errorCount: 0,
        pendingCount: 0,
        mostPopularOperation: 'None'
      };
    }
  }
}

// Request interceptor
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

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error('API Error:', error.response.status, error.response.data);
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
      console.error('Network Error:', error.message);
      error.message = 'Network error: Unable to connect to server';
    } else {
      console.error('Error:', error.message);
    }
    
    return Promise.reject(error);
  }
);