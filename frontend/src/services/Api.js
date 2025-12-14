
import axios from 'axios';

class PhotoApi {
  static baseURL = window.env?.VITE_API_URL || import.meta.env.VITE_API_URL;
  
  static async request(endpoint, options = {}) {
    try {
      const response = await axios({
        baseURL: this.baseURL,
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
        },
        ...options,
        url: endpoint
      });
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  static handleError(error) {
    if (error.response) {
      switch (error.response.status) {
        case 400: error.message = 'Невірні дані'; break;
        case 404: error.message = 'Не знайдено'; break;
        case 500: error.message = 'Помилка сервера'; break;
        default: error.message = `Помилка: ${error.response.status}`;
      }
    } else if (error.request) {
      error.message = 'Помилка з\'єднання з сервером';
    }
    console.error('API Error:', error.message);
  }

  // Методи для фото
  static getImages = () => this.request('/images');
  
  static getImageById = (imageId) => this.request(`/images/${imageId}`);
  
  static uploadImage = (file, name, description = '') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', name);
    formData.append('description', description);
    
    return this.request('/images', {
      method: 'POST',
      data: formData,
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 30000,
    });
  };

  //  Методи для тасків
  static getTasks = async (imageId = null) => {
    const endpoint = imageId ? `/tasks/${imageId}` : '/tasks';
    const response = await this.request(endpoint);
    return response.tasks || [];
  };
  
  static createTask = (imageId, processingType) => {
    const formData = new FormData();
    formData.append('image_id', imageId.toString());
    formData.append('processing_type', processingType);
    
    return this.request('/tasks', {
      method: 'POST',
      data: formData,
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  };

}

export default PhotoApi;