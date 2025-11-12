import React, { useState, useEffect } from 'react';
import { Api } from '../services/Api';

const ImageDetail = ({ image, onBack, onDelete, onProcessingComplete }) => {
  const [activeTab, setActiveTab] = useState('info');
  const [selectedOperation, setSelectedOperation] = useState('enhance');
  const [isProcessing, setIsProcessing] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [processedVersions, setProcessedVersions] = useState([]);
  const [imageDetail, setImageDetail] = useState(image);

  useEffect(() => {
    if (image) {
      loadImageDetail();
      loadProcessedVersions();
    }
  }, [image]);

  const loadImageDetail = async () => {
    try {
      const detail = await Api.getImageDetail(image.id);
      setImageDetail(detail);
    } catch (error) {
      console.error('Error loading image detail:', error);
    }
  };

  const loadProcessedVersions = async () => {
    try {
      const versions = await Api.getProcessedVersions(image.id);
      setProcessedVersions(versions);
    } catch (error) {
      console.error('Error loading processed versions:', error);
    }
  };

  const aiOperations = [
    { value: 'enhance', label: 'Покращити якість', description: 'AI покращення різкості та кольорів' },
    { value: 'style_transfer', label: 'Перенести стиль', description: 'Застосувати художній стиль' },
    { value: 'super_resolution', label: 'Супер-дозвіл', description: 'Збільшити роздільну здатність' },
    { value: 'denoise', label: 'Видалити шум', description: 'AI видалення цифрового шуму' },
    { value: 'colorize', label: 'Колоризація', description: 'Розфарбувати чорно-біле зображення' },
    { value: 'background_remove', label: 'Видалити фон', description: 'AI видалення фону' },
    { value: 'object_remove', label: 'Видалити об\'єкт', description: 'Видалити об\'єкт з зображення' },
    { value: 'custom', label: 'Кастомна обробка', description: 'Обробка за власним запитом' }
  ];

  const handleProcess = async () => {
    if (!imageDetail) return;

    setIsProcessing(true);
    try {
      const processingOptions = {
        operation: selectedOperation,
        prompt: selectedOperation === 'custom' ? customPrompt : undefined
      };

      await Api.processImageWithAI(imageDetail.id, processingOptions);
      
      // Reload processed versions and image detail
      await loadProcessedVersions();
      await loadImageDetail();
      
      onProcessingComplete();
      
      // Reset custom prompt
      if (selectedOperation === 'custom') {
        setCustomPrompt('');
      }
      
      alert('Обробка успішно завершена!');
    } catch (error) {
      alert('Помилка AI обробки: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteProcessed = async (processedImageId) => {
    if (window.confirm('Видалити цю оброблену версію?')) {
      try {
        await Api.deleteImage(processedImageId);
        setProcessedVersions(prev => prev.filter(img => img.id !== processedImageId));
      } catch (error) {
        alert('Помилка видалення: ' + error.message);
      }
    }
  };

  if (!imageDetail) {
    return (
      <div style={styles.emptyState}>
        <p>Зображення не знайдено</p>
        <button onClick={onBack} style={styles.backButton}>
          Назад до галереї
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button onClick={onBack} style={styles.backButton}>
          ← Назад до галереї
        </button>
        <h2 style={styles.title}>{imageDetail.name}</h2>
        <button
          onClick={() => onDelete(imageDetail.id)}
          style={styles.deleteButton}
        >
          Видалити
        </button>
      </div>

      <div style={styles.content}>
        <div style={styles.imageSection}>
          <img
            src={imageDetail.url}
            alt={imageDetail.name}
            style={styles.mainImage}
          />
          
          {/* Processing Controls */}
          <div style={styles.processingCard}>
            <h3 style={styles.cardTitle}>AI Обробка зображення</h3>
            
            <div style={styles.operationSelection}>
              <label style={styles.label}>Тип обробки:</label>
              <select 
                value={selectedOperation} 
                onChange={(e) => setSelectedOperation(e.target.value)}
                style={styles.select}
                disabled={isProcessing}
              >
                {aiOperations.map(op => (
                  <option key={op.value} value={op.value}>
                    {op.label}
                  </option>
                ))}
              </select>
              
              <div style={styles.operationDescription}>
                {aiOperations.find(op => op.value === selectedOperation)?.description}
              </div>

              {selectedOperation === 'custom' && (
                <div style={styles.promptSection}>
                  <label style={styles.label}>AI Запит:</label>
                  <textarea
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    style={styles.promptInput}
                    placeholder="Опишіть, як ви хочете обробити зображення (наприклад: 'зроби закат', 'додай сніг', тощо)..."
                    rows={3}
                    disabled={isProcessing}
                  />
                </div>
              )}
            </div>

            <button
              onClick={handleProcess}
              disabled={isProcessing || (selectedOperation === 'custom' && !customPrompt.trim())}
              style={styles.processButton}
            >
              {isProcessing ? 'AI Обробка...' : 'Запустити AI обробку'}
            </button>
          </div>
        </div>

        <div style={styles.infoSection}>
          <div style={styles.tabs}>
            <button
              style={{
                ...styles.tab,
                ...(activeTab === 'info' && styles.activeTab)
              }}
              onClick={() => setActiveTab('info')}
            >
              Інформація
            </button>
            <button
              style={{
                ...styles.tab,
                ...(activeTab === 'processed' && styles.activeTab)
              }}
              onClick={() => setActiveTab('processed')}
            >
              Оброблені версії ({processedVersions.length})
            </button>
            <button
              style={{
                ...styles.tab,
                ...(activeTab === 'history' && styles.activeTab)
              }}
              onClick={() => setActiveTab('history')}
            >
              Історія
            </button>
          </div>

          <div style={styles.tabContent}>
            {activeTab === 'info' && (
              <div>
                <h3>Основна інформація</h3>
                <div style={styles.infoGrid}>
                  <div style={styles.infoItem}>
                    <strong>Назва:</strong>
                    <span>{imageDetail.name}</span>
                  </div>
                  <div style={styles.infoItem}>
                    <strong>Опис:</strong>
                    <span>{imageDetail.description || 'Без опису'}</span>
                  </div>
                  <div style={styles.infoItem}>
                    <strong>Розмір файлу:</strong>
                    <span>{imageDetail.fileSize || 'Невідомо'}</span>
                  </div>
                  <div style={styles.infoItem}>
                    <strong>Формат:</strong>
                    <span>{imageDetail.format || 'Невідомо'}</span>
                  </div>
                  <div style={styles.infoItem}>
                    <strong>Розмір зображення:</strong>
                    <span>
                      {imageDetail.width && imageDetail.height 
                        ? `${imageDetail.width} × ${imageDetail.height}` 
                        : 'Невідомо'}
                    </span>
                  </div>
                  <div style={styles.infoItem}>
                    <strong>Дата завантаження:</strong>
                    <span>
                      {imageDetail.uploadDate
                        ? new Date(imageDetail.uploadDate).toLocaleDateString('uk-UA')
                        : 'Невідомо'}
                    </span>
                  </div>
                  <div style={styles.infoItem}>
                    <strong>Кількість обробок:</strong>
                    <span>{imageDetail.processingCount || 0}</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'processed' && (
              <div>
                <h3>Оброблені версії</h3>
                {processedVersions.length > 0 ? (
                  <div style={styles.processedGrid}>
                    {processedVersions.map(version => (
                      <div key={version.id} style={styles.processedCard}>
                        <img
                          src={version.url}
                          alt={`Processed: ${version.name}`}
                          style={styles.processedImage}
                        />
                        <div style={styles.processedInfo}>
                          <strong>{version.operation}</strong>
                          <span>Якість: {version.qualityScore?.toFixed(1) || 'N/A'}</span>
                          <span>{new Date(version.processedAt).toLocaleDateString('uk-UA')}</span>
                          <button
                            onClick={() => handleDeleteProcessed(version.id)}
                            style={styles.deleteSmallButton}
                          >
                            Видалити
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={styles.emptyVersions}>
                    <p>Ще немає оброблених версій</p>
                    <p style={styles.hint}>Використайте AI обробку для створення нових версій</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'history' && (
              <div>
                <h3>Історія обробки</h3>
                <div style={styles.history}>
                  {imageDetail.processingHistory?.length > 0 ? (
                    imageDetail.processingHistory.map((item, index) => (
                      <div key={index} style={styles.historyItem}>
                        <div style={styles.historyHeader}>
                          <strong>{item.operation}</strong>
                          <span style={styles.historyDate}>
                            {new Date(item.timestamp).toLocaleString('uk-UA')}
                          </span>
                        </div>
                        <div style={styles.historyDetails}>
                          <span>Статус: {item.status}</span>
                          {item.qualityScore && (
                            <span>Якість: {item.qualityScore}</span>
                          )}
                          {item.duration && (
                            <span>Час: {item.duration}с</span>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p>Немає історії обробки</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: '20px',
    maxWidth: '1400px',
    margin: '0 auto'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
    paddingBottom: '15px',
    borderBottom: '2px solid #e9ecef'
  },
  backButton: {
    padding: '10px 20px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold'
  },
  title: {
    margin: 0,
    color: '#333',
    fontSize: '24px',
    textAlign: 'center',
    flex: 1
  },
  deleteButton: {
    padding: '10px 20px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold'
  },
  content: {
    display: 'grid',
    gridTemplateColumns: '400px 1fr',
    gap: '40px',
    alignItems: 'start'
  },
  imageSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  mainImage: {
    width: '100%',
    borderRadius: '12px',
    boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
  },
  processingCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '25px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    border: '1px solid #e9ecef'
  },
  cardTitle: {
    margin: '0 0 20px 0',
    color: '#333',
    fontSize: '20px',
    textAlign: 'center'
  },
  operationSelection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
    marginBottom: '20px'
  },
  label: {
    fontWeight: 'bold',
    color: '#333',
    fontSize: '14px'
  },
  select: {
    padding: '12px',
    borderRadius: '6px',
    border: '1px solid #ddd',
    fontSize: '14px',
    backgroundColor: 'white'
  },
  operationDescription: {
    fontSize: '13px',
    color: '#666',
    fontStyle: 'italic',
    padding: '8px',
    backgroundColor: '#f8f9fa',
    borderRadius: '4px',
    borderLeft: '3px solid #007bff'
  },
  promptSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  promptInput: {
    padding: '12px',
    borderRadius: '6px',
    border: '1px solid #ddd',
    fontSize: '14px',
    fontFamily: 'inherit',
    resize: 'vertical',
    minHeight: '80px'
  },
  processButton: {
    padding: '15px 25px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold',
    transition: 'all 0.3s ease',
    width: '100%'
  },
  infoSection: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '0',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    border: '1px solid #e9ecef',
    overflow: 'hidden'
  },
  tabs: {
    display: 'flex',
    borderBottom: '1px solid #dee2e6',
    backgroundColor: '#f8f9fa'
  },
  tab: {
    padding: '15px 25px',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    borderBottom: '3px solid transparent',
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#6c757d',
    transition: 'all 0.3s ease'
  },
  activeTab: {
    borderBottomColor: '#007bff',
    color: '#007bff',
    backgroundColor: 'white'
  },
  tabContent: {
    padding: '25px',
    minHeight: '400px'
  },
  infoGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  infoItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '12px 0',
    borderBottom: '1px solid #f0f0f0',
    alignItems: 'center'
  },
  processedGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '20px',
    marginTop: '15px'
  },
  processedCard: {
    border: '1px solid #e9ecef',
    borderRadius: '8px',
    overflow: 'hidden',
    backgroundColor: 'white',
    transition: 'transform 0.2s ease',
    cursor: 'pointer'
  },
  processedImage: {
    width: '100%',
    height: '150px',
    objectFit: 'cover'
  },
  processedInfo: {
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
    fontSize: '12px'
  },
  deleteSmallButton: {
    padding: '4px 8px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '3px',
    cursor: 'pointer',
    fontSize: '11px',
    marginTop: '5px'
  },
  emptyVersions: {
    textAlign: 'center',
    padding: '40px',
    color: '#6c757d'
  },
  hint: {
    fontSize: '14px',
    color: '#999',
    marginTop: '10px'
  },
  history: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  historyItem: {
    padding: '15px',
    backgroundColor: '#f8f9fa',
    borderRadius: '6px',
    borderLeft: '4px solid #007bff'
  },
  historyHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px'
  },
  historyDate: {
    fontSize: '12px',
    color: '#6c757d'
  },
  historyDetails: {
    display: 'flex',
    gap: '15px',
    fontSize: '13px',
    color: '#666'
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px',
    color: '#666'
  }
};

export default ImageDetail;