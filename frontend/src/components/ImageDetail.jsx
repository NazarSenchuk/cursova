import React, { useState, useEffect } from 'react';
import { Api } from '../services/Api';

const ImageDetail = ({ image, onBack, onDelete, onProcessingComplete }) => {
  const [activeTab, setActiveTab] = useState('info');
  const [selectedOperation, setSelectedOperation] = useState('enhance');
  const [isProcessing, setIsProcessing] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [tasks, setTasks] = useState([]);
  const [imageDetail, setImageDetail] = useState(image);

  useEffect(() => {
    if (image) {
      loadImageDetail();
      loadTasks();
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

  const loadTasks = async () => {
    try {
      const tasksData = await Api.getTasks(image.id);
      setTasks(tasksData);
    } catch (error) {
      console.error('Error loading tasks:', error);
    }
  };

  const aiOperations = [
    { value: 'enhance', label: 'Покращити якість', description: 'AI покращення різкості та кольорів' },
    { value: 'restore', label: 'Відновити', description: 'Відновлення старих та пошкоджених фотографій' },
    { value: 'anime', label: 'Аніме', description: 'Перетворення фотографії в  аніме стиль' },

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
      
      // Reload tasks and image detail
      await loadTasks();
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

  const handleDeleteTask = async (taskId) => {
    if (window.confirm('Видалити це завдання обробки?')) {
      try {
        await Api.deleteImage(taskId);
        setTasks(prev => prev.filter(task => task.id !== taskId));
      } catch (error) {
        alert('Помилка видалення: ' + error.message);
      }
    }
  };

  const getOperationLabel = (operationType) => {
    const operation = aiOperations.find(op => op.value === operationType);
    return operation ? operation.label : operationType;
  };

  const getStatusLabel = (status) => {
    const statusMap = {
      'pending': 'В очікуванні',
      'processing': 'Обробляється',
      'completed': 'Завершено',
      'error': 'Помилка'
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status) => {
    const colorMap = {
      'pending': '#ffc107',
      'processing': '#17a2b8',
      'completed': '#28a745',
      'error': '#dc3545'
    };
    return colorMap[status] || '#6c757d';
  };

  const downloadImage = (url, filename) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
                ...(activeTab === 'tasks' && styles.activeTab)
              }}
              onClick={() => setActiveTab('tasks')}
            >
              Завдання обробки ({tasks.length})
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

            {activeTab === 'tasks' && (
              <div>
                <h3>Завдання обробки</h3>
                {tasks.length > 0 ? (
                  <div style={styles.tasksList}>
                    {tasks.map(task => (
                      <div key={task.id} style={styles.taskCard}>
                        <div style={styles.taskHeader}>
                          <div style={styles.taskInfo}>
                            <strong style={styles.taskOperation}>
                              {getOperationLabel(task.processing_type)}
                            </strong>
                            <span 
                              style={{
                                ...styles.taskStatus,
                                backgroundColor: getStatusColor(task.status)
                              }}
                            >
                              {getStatusLabel(task.status)}
                            </span>
                          </div>
                          <div style={styles.taskDate}>
                            Створено: {new Date(task.created_at).toLocaleString('uk-UA')}
                          </div>
                        </div>

                        {task.status === 'completed' && task.processed_url && (
                          <div style={styles.completedTask}>
                            <div style={styles.processedImageSection}>
                              <img
                                src={task.processed_url}
                                alt={`Processed: ${task.processing_type}`}
                                style={styles.processedThumbnail}
                              />
                              <div style={styles.processedActions}>
                                <button
                                  onClick={() => window.open(task.processed_url, '_blank')}
                                  style={styles.viewButton}
                                >
                                  Переглянути
                                </button>
                                <button
                                  onClick={() => downloadImage(task.processed_url, `processed_${task.id}.jpg`)}
                                  style={styles.downloadButton}
                                >
                                  Завантажити
                                </button>
                              </div>
                            </div>
                            <div style={styles.taskDetails}>
                              <div style={styles.detailItem}>
                                <strong>Завершено:</strong>
                                <span>{task.completed_at ? new Date(task.completed_at).toLocaleString('uk-UA') : 'Невідомо'}</span>
                              </div>
                              {task.duration && (
                                <div style={styles.detailItem}>
                                  <strong>Тривалість:</strong>
                                  <span>{task.duration}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        <div style={styles.taskActions}>
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            style={styles.deleteSmallButton}
                            disabled={task.status === 'processing'}
                          >
                            Видалити
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={styles.emptyTasks}>
                    <p>Ще немає завдань обробки</p>
                    <p style={styles.hint}>Використайте AI обробку для створення нових завдань</p>
                  </div>
                )}
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
  tasksList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px'
  },
  taskCard: {
    border: '1px solid #e9ecef',
    borderRadius: '8px',
    padding: '15px',
    backgroundColor: 'white'
  },
  taskHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '10px'
  },
  taskInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px'
  },
  taskOperation: {
    fontSize: '16px',
    color: '#333'
  },
  taskStatus: {
    padding: '4px 8px',
    borderRadius: '12px',
    color: 'white',
    fontSize: '12px',
    fontWeight: 'bold',
    width: 'fit-content'
  },
  taskDate: {
    fontSize: '12px',
    color: '#6c757d'
  },
  completedTask: {
    marginTop: '10px',
    padding: '15px',
    backgroundColor: '#f8f9fa',
    borderRadius: '6px',
    border: '1px solid #e9ecef'
  },
  processedImageSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    marginBottom: '10px'
  },
  processedThumbnail: {
    width: '80px',
    height: '80px',
    objectFit: 'cover',
    borderRadius: '6px',
    border: '1px solid #ddd'
  },
  processedActions: {
    display: 'flex',
    gap: '10px'
  },
  viewButton: {
    padding: '8px 12px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px'
  },
  downloadButton: {
    padding: '8px 12px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px'
  },
  taskDetails: {
    display: 'flex',
    gap: '20px',
    fontSize: '13px'
  },
  detailItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px'
  },
  taskActions: {
    marginTop: '10px',
    textAlign: 'right'
  },
  deleteSmallButton: {
    padding: '6px 12px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px'
  },
  emptyTasks: {
    textAlign: 'center',
    padding: '40px',
    color: '#6c757d'
  },
  hint: {
    fontSize: '14px',
    color: '#999',
    marginTop: '10px'
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px',
    color: '#666'
  }
};

export default ImageDetail;