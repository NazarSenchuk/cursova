import { Api } from '../services/Api';

export class ArchiveManager {


  /**
   * Завантажує обрані зображення як ZIP архів
   * @param {Array} images - Масив об'єктів зображень
   * @returns {Promise<string>} - URL для завантаження
   */
  static async downloadImagesAsZip(images) {
    if (!images || images.length === 0) {
      throw new Error('Немає обраних зображень для архівування');
    }

    try {
      // Отримуємо ID обраних зображень
      const imageIds = images.map(img => img.id);
      
      // Викликаємо API для створення ZIP
      const response = await this.api.downloadSelectedImages(imageIds);
      
      if (!response.downloadUrl) {
        throw new Error('Не вдалося отримати URL для завантаження');
      }
      
      return response.downloadUrl;
      
    } catch (error) {
      console.error('ArchiveManager error:', error);
      
      // Fallback: створюємо простий ZIP на клієнті як резервний варіант
      if (error.message.includes('з\'єднання') || error.message.includes('сервер')) {
        return this.createClientSideZip(images);
      }
      
      throw error;
    }
  }
}