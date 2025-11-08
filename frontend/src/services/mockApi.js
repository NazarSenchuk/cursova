class MockApi {
  constructor() {
    this.images = [];
    this.processedImages = [];
    this.nextId = 1;
    this.initializeMockData();
  }

  initializeMockData() {
    for (let i = 1; i <= 5; i++) {
      this.images.push({
        id: i,
        filename: `image${i}.jpg`,
        url: `https://picsum.photos/400/300?random=${i}`,
        uploadDate: new Date().toISOString(),
        size: Math.floor(Math.random() * 5000000) + 1000000,
        status: 'uploaded'
      });
    }
  }

  async getImages() {
    await this.delay(500);
    return this.images;
  }

  async uploadImage(file) {
    await this.delay(1000);
    const newImage = {
      id: this.nextId++,
      filename: file.name,
      url: URL.createObjectURL(file),
      uploadDate: new Date().toISOString(),
      size: file.size,
      status: 'uploaded'
    };
    this.images.unshift(newImage);
    return newImage;
  }

  async deleteImage(id) {
    await this.delay(300);
    this.images = this.images.filter(img => img.id !== id);
    return { success: true };
  }

  async processImage(imageId, operation, params) {
    await this.delay(1500);
    const originalImage = this.images.find(img => img.id === imageId);
    
    if (!originalImage) {
      throw new Error('Image not found');
    }

    const processedImage = {
      id: Date.now(),
      originalId: imageId,
      operation: operation,
      params: params,
      status: 'completed',
      resultUrl: `${originalImage.url}?processed=${operation}`,
      processedAt: new Date().toISOString(),
      qualityScore: Math.random() * 10
    };

    this.processedImages.unshift(processedImage);
    return processedImage;
  }

  async getProcessedImages() {
    await this.delay(500);
    return this.processedImages;
  }

  async getAdminStats() {
    await this.delay(300);
    return {
      totalImages: this.images.length,
      processedImages: this.processedImages.length,
      processingQueue: 0,
      errorCount: 0,
      popularOperations: this.getPopularOperations(),
      averageProcessingTime: '1.2s'
    };
  }

  async getProcessingLogs() {
    await this.delay(500);
    return this.processedImages.map(img => ({
      id: img.id,
      filename: `processed_${img.originalId}.jpg`,
      operation: img.operation,
      status: img.status,
      timestamp: img.processedAt,
      duration: '1.1s'
    }));
  }

  async generateReport(type) {
    await this.delay(2000);
    return {
      id: Date.now(),
      type: type,
      generatedAt: new Date().toISOString(),
      downloadUrl: '#',
      data: this.getReportData(type)
    };
  }

  getPopularOperations() {
    const ops = {};
    this.processedImages.forEach(img => {
      ops[img.operation] = (ops[img.operation] || 0) + 1;
    });
    return ops;
  }

  getReportData(type) {
    const baseData = {
      totalProcessed: this.processedImages.length,
      successRate: 95,
      averageQuality: 7.8
    };

    if (type === 'quality') {
      return {
        ...baseData,
        qualityDistribution: {
          excellent: 25,
          good: 50,
          average: 20,
          poor: 5
        }
      };
    }

    return baseData;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const mockApi = new MockApi();
