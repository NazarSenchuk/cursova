import axios from 'axios';

// Get the base URL once
const getBaseURL = () => {
  const baseURL = window.env?.VITE_API_URL || import.meta.env.VITE_API_URL;
  console.log('Using API URL:', baseURL);
  return baseURL;
};

const API_CONFIG = {
  baseURL: getBaseURL(), // Fixed: baseURL not baseUrl
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
};

const apiClient = axios.create(API_CONFIG);

class FamilyPhotoApi {
  static async getImages() {
    try {
      console.log('Making API call to:', API_CONFIG.baseURL + '/images');
      const response = await apiClient.get('/images');
      return response.data.images || [];
    } catch (error) {
      console.error('Помилка завантаження фото:', error);
      console.error('Full error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url
      });
      return [];
    }
  }

  static async getImageById(imageId) {
    try {
      const response = await apiClient.get(`/images/${imageId}`);
      return response.data;
    } catch (error) {
      console.error('Помилка завантаження деталей фото:', error);
      throw new Error('Не вдалося завантажити фото');
    }
  }

  static async uploadImage(file, name, description = '') {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', name);
      formData.append('description', description);

      const response = await apiClient.post('/images', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 30000,
      });

      return {
        id: response.data.id,
        filename: response.data.filename,
        url: response.data.url,
        name: name,
        description: description,
        created_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('Помилка завантаження:', error);
      if (error.response && error.response.status === 400) {
        throw new Error('Невірний формат зображення');
      }
      throw new Error('Не вдалося завантажити фото');
    }
  }

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

  static async downloadSelectedImages(imageIds) {
    try {
      const response = await apiClient.post('/download-selected', {
        image_ids: imageIds
      });
      
      return response.data;
    } catch (error) {
      console.error('Помилка створення ZIP архіву:', error);
      throw new Error('Не вдалося створити архів');
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
      throw new Error('Не вдалося створити завдання обробки');
    }
  }
}

// Обробники помилок
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      switch (error.response.status) {
        case 400:
          error.message = 'Невірні дані';
          break;
        case 404:
          error.message = 'Не знайдено';
          break;
        case 500:
          error.message = 'Помилка сервера';
          break;
        default:
          error.message = `Помилка: ${error.response.status}`;
      }
    } else if (error.request) {
      error.message = 'Помилка з\'єднання з сервером';
    }
    
    return Promise.reject(error);
  }
);

export const Api = FamilyPhotoApi;