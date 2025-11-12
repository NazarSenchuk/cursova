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

  // Tasks endpoints
  static async getTasks(imageId = null) {
    try {
      const url = imageId ? `/tasks/${imageId}` : '/tasks';
      console.log('Fetching tasks from:', `${API_CONFIG.baseURL}${url}`);
      const response = await apiClient.get(url);
      
      // Ensure we return an array of tasks with the expected structure
      const tasks = response.data.tasks || response.data || [];
      return Array.isArray(tasks) ? tasks : [tasks];
    } catch (error) {
      console.error('Error fetching tasks:', error);
      return this.getMockTasks(imageId);
    }
  }

  static async createTask(imageId, processingType, customPrompt = null) {
    try {
      const payload = {
        image_id: imageId,
        processing_type: processingType,
        ...(customPrompt && { prompt: customPrompt })
      };

      console.log('Creating task with payload:', payload);
      
      const response = await apiClient.post('/tasks', payload);
      
      return {
        id: response.data.id,
        processing_type: processingType,
        image_id: imageId,
        processed_url: response.data.processed_url || null,
        status: response.data.status || 'pending',
        created_at: new Date().toISOString(),
        ...(customPrompt && { prompt: customPrompt })
      };
    } catch (error) {
      console.error('Error creating task:', error);
      throw new Error('Failed to create processing task');
    }
  }

  static async getTaskStatus(taskId) {
    try {
      const response = await apiClient.get(`/tasks/${taskId}/status`);
      return response.data;
    } catch (error) {
      console.error('Error fetching task status:', error);
      throw new Error('Failed to fetch task status');
    }
  }

  // Updated image processing to use tasks
  static async processImageWithAI(imageId, options) {
    try {
      const { operation, prompt } = options;
      return await this.createTask(imageId, operation, prompt);
    } catch (error) {
      console.error('Error processing image with AI:', error);
      throw new Error('Failed to process image with AI');
    }
  }

  // Get processed versions for an image (uses tasks endpoint)
  static async getProcessedVersions(imageId) {
    try {
      const tasks = await this.getTasks(imageId);
      
      // Filter completed tasks and map to processed images format
      const processedVersions = tasks
        .filter(task => task.status === 'completed' && task.processed_url)
        .map(task => ({
          id: task.id,
          url: task.processed_url,
          name: `Processed - ${task.processing_type}`,
          operation: this.getOperationLabel(task.processing_type),
          qualityScore: this.calculateQualityScore(task.processing_type),
          processedAt: task.completed_at || task.created_at,
          originalImageId: task.image_id
        }));

      return processedVersions;
    } catch (error) {
      console.error('Error fetching processed versions:', error);
      return [];
    }
  }

  // Get detailed image information including processing history
  static async getImageDetail(imageId) {
    try {
      const [image, tasks] = await Promise.all([
        this.getImageById(imageId),
        this.getTasks(imageId)
      ]);

      // Enhance image data with processing information
      return {
        ...image,
        processingCount: tasks.filter(task => task.status === 'completed').length,
        processingHistory: tasks.map(task => ({
          operation: task.processing_type,
          status: task.status,
          timestamp: task.created_at,
          duration: task.duration,
          qualityScore: this.calculateQualityScore(task.processing_type)
        }))
      };
    } catch (error) {
      console.error('Error fetching image detail:', error);
      throw new Error('Failed to fetch image details');
    }
  }

  // Original image endpoints (keep existing)
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

  static async uploadImage(file, name, description) {
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

  // Keep legacy processImage for backward compatibility
  static async processImage(imageId, operation, params = {}) {
    return this.processImageWithAI(imageId, { operation, ...params });
  }

  static async getProcessedImages() {
    try {
      // Get all completed tasks across all images
      const allTasks = await this.getTasks();
      const completedTasks = allTasks.filter(task => task.status === 'completed' && task.processed_url);
      
      return completedTasks.map(task => ({
        id: task.id,
        url: task.processed_url,
        name: `Processed - ${task.processing_type}`,
        originalImageId: task.image_id,
        operation: task.processing_type,
        processedAt: task.completed_at
      }));
    } catch (error) {
      console.error('Error fetching processed images:', error);
      return [];
    }
  }

  static async getProcessingLogs() {
    try {
      // Use tasks as processing logs
      const allTasks = await this.getTasks();
      
      return allTasks.map(task => ({
        id: task.id,
        filename: `Image ${task.image_id}`,
        operation: task.processing_type,
        status: task.status,
        timestamp: task.created_at,
        duration: task.duration || 'N/A',
        userId: 'user123'
      }));
    } catch (error) {
      console.error('Error fetching processing logs:', error);
      return this.getMockLogs();
    }
  }

  static async generateReport(reportType) {
    try {
      const response = await apiClient.post('/reports/generate', {
        reportType
      });
      return response.data;
    } catch (error) {
      console.error('Error generating report:', error);
      throw new Error('Failed to generate report');
    }
  }

  // Helper method to get images by status
  static async getImagesByStatus(status) {
    try {
      const response = await apiClient.get(`/images/status/${status}`);
      return response.data.images || [];
    } catch (error) {
      console.error(`Error fetching ${status} images:`, error);
      return [];
    }
  }

  // Helper methods for task processing
  static getOperationLabel(processingType) {
    const labels = {
      'enhance': 'Покращити якість',
      'style_transfer': 'Перенести стиль',
      'super_resolution': 'Супер-дозвіл',
      'denoise': 'Видалити шум',
      'colorize': 'Колоризація',
      'background_remove': 'Видалити фон',
      'object_remove': 'Видалити об\'єкт',
      'custom': 'Кастомна обробка'
    };
    return labels[processingType] || processingType;
  }

  static calculateQualityScore(processingType) {
    // Mock quality score based on operation type
    const baseScores = {
      'enhance': 8.5,
      'super_resolution': 9.0,
      'denoise': 8.0,
      'colorize': 7.5,
      'background_remove': 8.2,
      'style_transfer': 7.8,
      'object_remove': 7.0,
      'custom': 7.0
    };
    
    const baseScore = baseScores[processingType] || 7.0;
    // Add some random variation
    return baseScore + (Math.random() * 0.5 - 0.25);
  }

  // Mock data fallbacks
  static getMockTasks(imageId = null) {
    console.warn('Using mock tasks data - API might be unavailable');
    const mockTasks = [
      {
        id: 1,
        processing_type: 'enhance',
        image_id: imageId || 1,
        processed_url: 'https://picsum.photos/200/300?random=101',
        status: 'completed',
        created_at: new Date(Date.now() - 3600000).toISOString(),
        completed_at: new Date(Date.now() - 3500000).toISOString(),
        duration: '10.5s'
      },
      {
        id: 2,
        processing_type: 'style_transfer',
        image_id: imageId || 1,
        processed_url: 'https://picsum.photos/200/300?random=102',
        status: 'completed',
        created_at: new Date(Date.now() - 7200000).toISOString(),
        completed_at: new Date(Date.now() - 7100000).toISOString(),
        duration: '15.2s'
      },
      {
        id: 3,
        processing_type: 'background_remove',
        image_id: imageId || 2,
        processed_url: null,
        status: 'processing',
        created_at: new Date().toISOString(),
        duration: null
      }
    ];

    // Filter by imageId if provided
    return imageId ? mockTasks.filter(task => task.image_id === imageId) : mockTasks;
  }

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
        type: 'image/jpeg',
        width: 800,
        height: 600,
        format: 'JPEG'
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
        type: 'image/jpeg',
        width: 1024,
        height: 768,
        format: 'JPEG'
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
      mostPopularOperation: 'enhance'
    };
  }

  static getMockLogs() {
    return [
      {
        id: 1,
        filename: 'image1.jpg',
        operation: 'enhance',
        status: 'completed',
        timestamp: new Date().toISOString(),
        duration: '1.2s',
        userId: 'user123'
      },
      {
        id: 2,
        filename: 'image2.jpg',
        operation: 'style_transfer',
        status: 'error',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        duration: '0.5s',
        userId: 'user123',
        error: 'Processing timeout'
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