import React, { useState, useMemo } from 'react';
import { DateManager } from '../classes/DateManager';
import { ArchiveManager } from '../classes/ArchiveManager';

const Archive = ({ images, onImageSelect }) => {

    const [selectedPeriod, setSelectedPeriod] = useState('recent'); 
    const [selectedImages, setSelectedImages] = useState([]);
    const [isDownloading, setIsDownloading] = useState(false); 
  
    //групування фото по періодах 
    const periodGroups = useMemo(() => {
      return DateManager.getAllPeriodGroups(images);
    }, [images]);

  // Обробник вибору/скасування вибору окремого фото
  const handleImageSelect = (imageId, isSelected) => {
    if (isSelected) {
      setSelectedImages(prev => [...prev, imageId]); // Додаємо ID до вибраних
    } else {
      setSelectedImages(prev => prev.filter(id => id !== imageId)); // Видаляємо ID з вибраних
    }
  };

  // Обробник кліку на фото - відкриває детальний перегляд, якщо клік не на чекбоксі
  const handleImageClick = (image, event) => {
    if (event.target.type === 'checkbox') {
      return; // Ігноруємо кліки на чекбоксі
    }
    console.log('Перехід до деталей фото:', image.id);
    onImageSelect(image); // Викликаємо колбек для відкриття детального перегляду
  };

  // Обрати всі фото в поточному періоді
  const handleSelectAll = () => {
    const currentImages = periodGroups[selectedPeriod]?.images || [];
    setSelectedImages(currentImages.map(img => img.id)); // Встановлюємо всі ID фото поточного періоду
  };

  // Скасувати вибір всіх фото
  const handleDeselectAll = () => {
    setSelectedImages([]); // Очищаємо масив обраних фото
  };

  // Основна функція створення та завантаження ZIP архіву
  const downloadSelectedAsZip = async () => {
    if (selectedImages.length === 0) {
      alert('Оберіть фото для архівування');
      return;
    }

    setIsDownloading(true); // Вмикаємо стан завантаження
    
    try {
      const selectedImageObjects = images.filter(img => selectedImages.includes(img.id));
      
      // Використовуємо ArchiveManager для створення ZIP архіву
      const downloadUrl = await ArchiveManager.downloadImagesAsZip(selectedImageObjects);
      
      // Створюємо тимчасове посилання для завантаження
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `photos-${new Date().toISOString().split('T')[0]}.zip`; // Назва файлу з поточною датою
      document.body.appendChild(a);
      a.click(); // Імітуємо клік для завантаження
      document.body.removeChild(a);
      
      // Очищаємо URL після завантаження (через 100мс)
      setTimeout(() => URL.revokeObjectURL(downloadUrl), 100);
      
      alert(`📦 Готово! Завантажено ${selectedImages.length} фото`);
      setSelectedImages([]); // Очищаємо вибір після успішного завантаження
      
    } catch (error) {
      console.error('Помилка створення архіву:', error);
      alert('❌ Помилка створення архіву: ' + error.message);
    } finally {
      setIsDownloading(false); 
    }
  };

  // Поточна обрана група фото для відображення
  const currentGroup = periodGroups[selectedPeriod];

  return (
    <div style={styles.container}>
      <h2 style={styles.title}> архів</h2>
      
      <div style={styles.controls}>
        {/* Селектор вибору періоду */}
        <select 
          value={selectedPeriod} 
          onChange={(e) => {
            setSelectedPeriod(e.target.value); // Змінюємо період
            setSelectedImages([]); // Очищаємо вибір при зміні періоду
          }}
          style={styles.periodSelect}
        >
          <option value="recent">📅 Останній тиждень</option>
          <option value="month">📅 Останній місяць</option>
          
          {/* Динамічні опції для місяців */}
          {DateManager.getSortedMonths(images).map(([key, group]) => (
            <option key={key} value={key}>📅 {group.name}</option>
        ))}
        
        {/* Динамічні опції для років */}
        {DateManager.getSortedYears(images).map(([year, yearImages]) => (
            <option key={`year-${year}`} value={`year-${year}`}>
            📅 Рік {year} ({yearImages.length} фото)
            </option>
        ))}
        </select>

        {/* Панель дій для обраних фото (показується тільки якщо є обрані фото) */}
        {selectedImages.length > 0 && (
          <div style={styles.archiveActions}>
            <span style={styles.selectedCount}>
              ✅ Обрано: {selectedImages.length} фото
            </span>
            <button 
              onClick={downloadSelectedAsZip} 
              style={{
                ...styles.downloadButton,
                ...(isDownloading && styles.downloadButtonDisabled)
              }}
              disabled={isDownloading}
            >
              {isDownloading ? '⏳ Створення...' : '📥 Завантажити ZIP'}
            </button>
            <button onClick={handleDeselectAll} style={styles.clearButton}>
              ❌ Очистити
            </button>
          </div>
        )}
      </div>

      <div style={styles.periodSection}>
        <h3 style={styles.periodTitle}>
          {currentGroup?.name || 'Оберіть період'}
          {currentGroup && ` (${currentGroup.images.length} фото)`}
        </h3>
        
        {currentGroup?.images.length > 0 ? (
          <div style={styles.gallery}>
            {/* Кнопки масового вибору */}
            <div style={styles.bulkActions}>
              <button 
                onClick={handleSelectAll}
                style={styles.selectAllButton}
              >
                ✅ Обрати всі ({currentGroup.images.length})
              </button>
              {selectedImages.length > 0 && (
                <button 
                  onClick={handleDeselectAll}
                  style={styles.deselectButton}
                >
                  ❌ Скасувати вибір
                </button>
              )}
            </div>

            {/* Сітка з фото поточного періоду */}
            <div style={styles.imagesGrid}>
              {currentGroup.images.map(image => (
                <div 
                  key={image.id} 
                  style={{
                    ...styles.imageCard,
                    ...(selectedImages.includes(image.id) && styles.selectedImageCard) // Підсвічуємо обране фото
                  }}
                  onClick={(e) => handleImageClick(image, e)}
                >
                  {/* Чекбокс для вибору фото */}
                  <input
                    type="checkbox"
                    checked={selectedImages.includes(image.id)}
                    onChange={(e) => handleImageSelect(image.id, e.target.checked)}
                    style={styles.checkbox}
                    onClick={(e) => e.stopPropagation()} // Запобігаємо всплиттю події до батьківського елемента
                  />
                  {/* Прев'ю фото */}
                  <img
                    src={`https://senchuknazar123.online/original/${image.id}-${image.filename}`}
                    alt={image.name}
                    style={styles.image}
                    loading="lazy" // Ліниве завантаження для оптимізації
                  />
                  {/* Інформація про фото */}
                  <div style={styles.imageInfo}>
                    <div style={styles.imageName}>{image.name}</div>
                    <div style={styles.imageDate}>
                      {DateManager.formatImageDate(image.created_at)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          // Повідомлення якщо немає фото в обраному періоді
          <div style={styles.emptyState}>
            <p>📷 Немає фото за обраний період</p>
            <p style={styles.hint}>Завантажте нові фото у вкладці "🏠 Всі фото"</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Inline стилі компонента
const styles = {
  container: {
    padding: '20px',
    maxWidth: '1200px',
    margin: '0 auto'
  },
  title: {
    textAlign: 'center',
    color: '#333',
    marginBottom: '30px',
    fontSize: '2rem'
  },
  controls: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
    flexWrap: 'wrap',
    gap: '15px'
  },
  periodSelect: {
    padding: '12px 20px',
    borderRadius: '25px',
    border: '2px solid #4a90e2',
    fontSize: '16px',
    minWidth: '300px',
    backgroundColor: 'white',
    outline: 'none'
  },
  archiveActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    padding: '12px 20px',
    backgroundColor: '#e3f2fd',
    borderRadius: '25px',
    border: '2px solid #4a90e2'
  },
  selectedCount: {
    fontWeight: 'bold',
    color: '#333'
  },
  downloadButton: {
    padding: '10px 20px',
    backgroundColor: '#4caf50',
    color: 'white',
    border: 'none',
    borderRadius: '20px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
    transition: 'all 0.3s ease'
  },
  clearButton: {
    padding: '10px 15px',
    backgroundColor: '#ff5252',
    color: 'white',
    border: 'none',
    borderRadius: '20px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 'bold'
  },
  periodSection: {
    backgroundColor: 'white',
    borderRadius: '20px',
    padding: '30px',
    boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
  },
  periodTitle: {
    margin: '0 0 25px 0',
    color: '#333',
    fontSize: '1.5rem',
    textAlign: 'center',
    paddingBottom: '15px',
    borderBottom: '2px solid #f0f0f0'
  },
  gallery: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  bulkActions: {
    display: 'flex',
    gap: '15px',
    justifyContent: 'center',
    flexWrap: 'wrap'
  },
  selectAllButton: {
    padding: '10px 20px',
    backgroundColor: '#4a90e2',
    color: 'white',
    border: 'none',
    borderRadius: '20px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold'
  },
  deselectButton: {
    padding: '10px 20px',
    backgroundColor: '#ff9800',
    color: 'white',
    border: 'none',
    borderRadius: '20px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold'
  },
  imagesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', // Адаптивна сітка
    gap: '25px'
  },
  imageCard: {
    position: 'relative',
    border: '3px solid #e0e0e0',
    borderRadius: '15px',
    overflow: 'hidden',
    backgroundColor: 'white',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  selectedImageCard: {
    borderColor: '#4caf50', // Зелена рамка для обраних фото
    boxShadow: '0 4px 15px rgba(76, 175, 80, 0.3)',
    transform: 'translateY(-2px)' // Легкий ефект підняття
  },
  checkbox: {
    position: 'absolute',
    top: '12px',
    left: '12px',
    transform: 'scale(1.4)', // Збільшений чекбокс
    zIndex: 1,
    accentColor: '#4caf50' // Зелений колір чекбокса
  },
  image: {
    width: '100%',
    height: '160px',
    objectFit: 'cover', // Заповнення контейнера зі збереженням пропорцій
    transition: 'transform 0.3s ease'
  },
  imageInfo: {
    padding: '15px'
  },
  imageName: {
    fontSize: '14px',
    fontWeight: 'bold',
    marginBottom: '8px',
    color: '#333',
    textAlign: 'center'
  },
  imageDate: {
    fontSize: '12px',
    color: '#666',
    textAlign: 'center'
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#666'
  },
  hint: {
    fontSize: '14px',
    color: '#999',
    marginTop: '10px'
  }
};

export default Archive;