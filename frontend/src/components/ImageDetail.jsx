import React, { useState, useEffect } from 'react';
import PhotoApi from '../services/Api';

const ImageDetail = ({ image, onBack, onProcessingComplete }) => {

  const [activeTab, setActiveTab] = useState('info'); 
  const [selectedProcessingType, setSelectedProcessingType] = useState('white-blue');
  const [isProcessing, setIsProcessing] = useState(false); 
  const [tasks, setTasks] = useState([]); 
  const [imageDetail, setImageDetail] = useState(image); 

  // Ефект, який викликається при зміні image - завантажує деталі фото та завдання
  useEffect(() => {
    if (image) {
      loadImageDetail();
      loadTasks();
    }
  }, [image]);

  // Завантаження детальної інформації про фото з сервера
  const loadImageDetail = async () => {
    try {
      const detail = await PhotoApi.getImageById(image.id);
      setImageDetail(detail);
    } catch (error) {
      console.error('Помилка завантаження деталей фото:', error);
    }
  };

  // Завантаження списку завдань обробки для цього фото
  const loadTasks = async () => {
    try {
      const tasksData = await PhotoApi.getTasks(image.id);
      console.log(tasksData);
      setTasks(tasksData);
    } catch (error) {
      console.error('Помилка завантаження завдань:', error);
    }
  };

  // Масив доступних типів обробки з їх описом
  const processingTypes = [
    { value: 'white-blue', label: 'Біло-синій', description: 'Перетворення в біло-синю палітру' },
    { value: 'grayscale', label: 'Чорно-білий', description: 'Перетворення в чорно-біле зображення' },
    { value: 'sepia', label: 'Сепія', description: 'Вінтажний коричневий відтінок' },
    { value: 'invert', label: 'Інверсія', description: 'Інвертування кольорів зображення' },
  ];

  // Обробник створення нового завдання обробки
  const handleProcess = async () => {
    if (!imageDetail) return;

    setIsProcessing(true);
    try {
      // Створюємо нове завдання обробки
      console.log("dwa")
      await PhotoApi.createTask(imageDetail.id, selectedProcessingType);
      // Оновлюємо список завдань та деталі фото
      await loadTasks();
      await loadImageDetail();
      onProcessingComplete();
    } catch (error) {
      alert('❌ Помилка обробки: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Отримання читабельної назви типу обробки
  const getProcessingTypeLabel = (processingType) => {
    const type = processingTypes.find(pt => pt.value === processingType);
    return type ? type.label : processingType;
  };

  // Отримання читабельного статусу завдання з емодзі
  const getStatusLabel = (status) => {
    const statusMap = {
      'pending': '⏳ В очікуванні',
      'processing': '🔄 Обробляється',
      'completed': '✅ Завершено',
      'error': '❌ Помилка'
    };
    return statusMap[status] || status;
  };

  // Отримання кольору для відображення статусу
  const getStatusColor = (status) => {
    const colorMap = {
      'pending': '#ffc107', // Жовтий
      'processing': '#17a2b8', // Блакитний
      'completed': '#28a745', // Зелений
      'error': '#dc3545' // Червоний
    };
    return colorMap[status] || '#6c757d'; // Сірий за замовчуванням
  };

  // Функція для завантаження зображення
  const downloadImage = (url, filename) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Якщо фото не знайдено, показуємо повідомлення
  if (!imageDetail) {
    return (
      <div style={styles.emptyState}>
        <p>📷 Фото не знайдено</p>
        <button onClick={onBack} style={styles.backButton}>
          ↩️ Назад до галереї
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button onClick={onBack} style={styles.backButton}>
          ↩️ Назад до галереї
        </button>
        <h2 style={styles.title}>{imageDetail.name}</h2>
      </div>

      {/* Основний контент - зображення та інформація */}
      <div style={styles.content}>
        {/* Ліва колонка - зображення та панель обробки */}
        <div style={styles.imageSection}>
          <img
            src={`https://senchuknazar123.online/original/${image.id}-${image.filename}`}
            alt={imageDetail.name}
            style={styles.mainImage}
          />
          
          {/* Картка обробки фото */}
          <div style={styles.processingCard}>
            <h3 style={styles.cardTitle}>Обробка фото</h3>
            
            <div style={styles.processingTypeSelection}>
              <label style={styles.label}>Тип обробки:</label>
              <select 
                value={selectedProcessingType} 
                onChange={(e) => setSelectedProcessingType(e.target.value)}
                style={styles.select}
                disabled={isProcessing}
              >
                {processingTypes.map(pt => (
                  <option key={pt.value} value={pt.value}>
                    {pt.label}
                  </option>
                ))}
              </select>
              
              {/* Опис обраного типу обробки */}
              <div style={styles.processingTypeDescription}>
                {processingTypes.find(pt => pt.value === selectedProcessingType)?.description}
              </div>
            </div>

            {/* Кнопка запуску обробки */}
            <button
              onClick={handleProcess}
              disabled={isProcessing}
              style={styles.processButton}
            >
              {isProcessing ? '🔄  Обробка...' : '🚀 Запустити обробку'}
            </button>
          </div>
        </div>

        {/* Права колонка - інформація та завдання */}
        <div style={styles.infoSection}>
          {/* Таби для перемикання між інформацією та завданнями */}
          <div style={styles.tabs}>
            <button
              style={{
                ...styles.tab,
                ...(activeTab === 'info' && styles.activeTab)
              }}
              onClick={() => setActiveTab('info')}
            >
              📋 Інформація
            </button>
            <button
              style={{
                ...styles.tab,
                ...(activeTab === 'tasks' && styles.activeTab)
              }}
              onClick={() => setActiveTab('tasks')}
            >
              🎯 Завдання ({tasks.length})
            </button>
          </div>

          {/* Вміст активного табу */}
          <div style={styles.tabContent}>
            {activeTab === 'info' && (
              <div>
                <h3>📊 Основна інформація</h3>
                <div style={styles.infoGrid}>
                  <div style={styles.infoItem}>
                    <strong>📝 Назва:</strong>
                    <span>{imageDetail.name}</span>
                  </div>
                  <div style={styles.infoItem}>
                    <strong>📄 Опис:</strong>
                    <span>{imageDetail.description || 'Без опису'}</span>
                  </div>
                  <div style={styles.infoItem}>
                    <strong>📅 Дата завантаження:</strong>
                    <span>
                      {imageDetail.created_at
                        ? new Date(imageDetail.created_at).toLocaleDateString('uk-UA')
                        : 'Невідомо'}
                    </span>
                  </div>
                  <div style={styles.infoItem}>
                    <strong>🔄 Всього обробок:</strong>
                    <span>{tasks.length}</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'tasks' && (
              <div>
                <h3>📋 Завдання обробки</h3>
                {tasks.length > 0 ? (
                  <div style={styles.tasksList}>
                    {/* Список завдань */}
                    {tasks.map(task => (
                      <div key={task.id} style={styles.taskCard}>
                        <div style={styles.taskHeader}>
                          <div style={styles.taskInfo}>
                            <strong style={styles.taskProcessingType}>
                              {getProcessingTypeLabel(task.processing_type)}
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
                            📅 {new Date(task.created_at).toLocaleString('uk-UA')}
                          </div>
                        </div>

                        {/* Якщо завдання завершене, показуємо результат */}
                        {task.status === 'completed' && (
                          <div style={styles.completedTask}>
                            <div style={styles.processedImageSection}>
                              <img
                                src={`https://senchuknazar123.online/processed/${task.id}-${image.filename}`}
                                alt={`Processed: ${task.processing_type}`}
                                style={styles.processedThumbnail}
                              />
                              <div style={styles.processedActions}>
                                <button
                                  onClick={() => window.open(`https://senchuknazar123.online/processed/${task.id}-${image.filename}`, '_blank')}
                                  style={styles.viewButton}
                                >
                                  👀 Переглянути
                                </button>
                                <button
                                  onClick={() => downloadImage(`https://senchuknazar123.online/processed/${task.id}-${image.filename}`, `${task.id}-${image.filename}`)}
                                  style={styles.downloadButton}
                                >
                                  💾 Завантажити
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={styles.emptyTasks}>
                    <p>📭 Ще немає завдань обробки</p>
                    <p style={styles.hint}>Використайте обробку для створення нових завдань</p>
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

// Стилі компонента (inline styles)
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
    padding: '12px 25px', 
    backgroundColor: '#6c757d', 
    color: 'white',
    border: 'none', 
    borderRadius: '25px', 
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
    borderRadius: '15px', 
    boxShadow: '0 8px 25px rgba(0,0,0,0.1)' 
  },
  processingCard: {
    backgroundColor: 'white', 
    borderRadius: '15px', 
    padding: '25px',
    boxShadow: '0 4px 15px rgba(0,0,0,0.1)', 
    border: '1px solid #e9ecef'
  },
  cardTitle: { 
    margin: '0 0 20px 0', 
    color: '#333', 
    fontSize: '20px', 
    textAlign: 'center' 
  },
  processingTypeSelection: { 
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
    borderRadius: '25px', 
    border: '2px solid #4a90e2', 
    fontSize: '14px', 
    backgroundColor: 'white',
    outline: 'none'
  },
  processingTypeDescription: {
    fontSize: '13px', 
    color: '#666', 
    fontStyle: 'italic', 
    padding: '10px',
    backgroundColor: '#f8f9fa', 
    borderRadius: '10px', 
    borderLeft: '3px solid #4a90e2'
  },
  processButton: {
    padding: '15px 25px', 
    backgroundColor: '#28a745', 
    color: 'white', 
    border: 'none',
    borderRadius: '25px', 
    cursor: 'pointer', 
    fontSize: '16px', 
    fontWeight: 'bold',
    transition: 'all 0.3s ease', 
    width: '100%',
    boxShadow: '0 4px 15px rgba(40, 167, 69, 0.3)'
  },
  infoSection: {
    backgroundColor: 'white', 
    borderRadius: '15px', 
    padding: '0',
    boxShadow: '0 4px 15px rgba(0,0,0,0.1)', 
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
    flex: 1
  },
  activeTab: { 
    borderBottomColor: '#4a90e2', 
    color: '#4a90e2', 
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
    padding: '15px 0',
    borderBottom: '1px solid #f0f0f0', 
    alignItems: 'center'
  },
  tasksList: { 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '15px' 
  },
  taskCard: { 
    border: '2px solid #e9ecef', 
    borderRadius: '12px', 
    padding: '20px', 
    backgroundColor: 'white' 
  },
  taskHeader: { 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start', 
    marginBottom: '15px' 
  },
  taskInfo: { 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '8px' 
  },
  taskProcessingType: { 
    fontSize: '16px', 
    color: '#333' 
  },
  taskStatus: {
    padding: '6px 12px', 
    borderRadius: '15px', 
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
    marginTop: '15px', 
    padding: '15px', 
    backgroundColor: '#f8f9fa',
    borderRadius: '10px', 
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
    borderRadius: '8px', 
    border: '2px solid #ddd' 
  },
  processedActions: { 
    display: 'flex', 
    gap: '10px' 
  },
  viewButton: {
    padding: '8px 15px', 
    backgroundColor: '#4a90e2', 
    color: 'white',
    border: 'none', 
    borderRadius: '20px', 
    cursor: 'pointer', 
    fontSize: '12px'
  },
  downloadButton: {
    padding: '8px 15px', 
    backgroundColor: '#28a745', 
    color: 'white',
    border: 'none', 
    borderRadius: '20px', 
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