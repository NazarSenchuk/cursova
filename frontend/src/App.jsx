import React, { useState, useEffect } from 'react';
import ImageUpload from './components/ImageUpload';
import ImageGallery from './components/ImageGallery';
import ImageDetail from './components/ImageDetail';
import Archive from './components/Archive';
import PhotoApi  from './services/Api';
import './App.css';

function App() {
  const [images, setImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [activeTab, setActiveTab] = useState('gallery');
  const [viewMode, setViewMode] = useState('grid');
// Загрузка всіх фото при загрузці сайту
  useEffect(() => {
    loadImages();
  }, []);
  // Загрузка всіх фото
  const loadImages = async () => {
    try {
      const imagesData = await PhotoApi.getImages();
      setImages(imagesData.images);
    } catch (error) {
      console.error('Помилка завантаження фото:', error);
    }
  };
  // Додавання нового зоображення після загрузки фото
  const handleImageUploaded = (newImage) => {
    loadImages();
  };
  // Перехід до деталей фото
  const handleImageSelect = (image) => {
    setSelectedImage(image);
    setViewMode('detail');
    setActiveTab('gallery'); 
  };
  // Перехід до назад 
  const handleBackToGallery = () => {
    setViewMode('grid');
    setSelectedImage(null);
  };

  const handleProcessingComplete = () => {
    if (selectedImage) {
      loadImageDetail(selectedImage.id);
    }
  };
  // Завантаження  з апі деталей про фото 
  const loadImageDetail = async (imageId) => {
    try {
      const imageDetail = await PhotoApi.getImageById(imageId);
      setSelectedImage(imageDetail);
    } catch (error) {
      console.error('Помилка завантаження деталей фото:', error);
    }
  };

  return (
    <div className="App">
      <header style={styles.header}>
        <h1 style={styles.title}> Фототека</h1>
        <nav style={styles.nav}>
          <button
            style={{
              ...styles.navButton,
              ...(activeTab === 'gallery' && styles.activeNavButton)
            }}
            onClick={() => {
              setActiveTab('gallery');
              setViewMode('grid');
              setSelectedImage(null);
            }}
          >
            🏠 Всі фото
          </button>
          <button
            style={{
              ...styles.navButton,
              ...(activeTab === 'archive' && styles.activeNavButton)
            }}
            onClick={() => setActiveTab('archive')}
          >
            📦 Архів
          </button>
        </nav>
      </header>

      <main style={styles.main}>
      
        {activeTab === 'gallery' && (        // Відображення галереї або  деталей фото якщо viewMode = grid
          <> 
            {viewMode === 'grid' ? (
              <>
                <ImageUpload onImageUploaded={handleImageUploaded} />
                <ImageGallery
                  images={images}
                  onImageSelect={handleImageSelect}
                />
              </>
            ) : (
              <ImageDetail
                image={selectedImage}
                onBack={handleBackToGallery}
                onProcessingComplete={handleProcessingComplete}
              />
            )}
          </>
        )}

        {activeTab === 'archive' && ( // Відображення archive
          <Archive 
            images={images} 
            onImageSelect={handleImageSelect}
          />
        )}
      </main>
    </div>
  );
}

const styles = {
  header: {
    backgroundColor: '#4a90e2',
    color: 'white',
    padding: '1rem 2rem',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
  },
  title: {
    margin: '0 0 1rem 0',
    fontSize: '1.8rem',
    fontWeight: 'bold',
    textAlign: 'center'
  },
  nav: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'center'
  },
  navButton: {
    padding: '10px 20px',
    backgroundColor: 'transparent',
    color: 'white',
    border: '2px solid white',
    borderRadius: '25px',
    cursor: 'pointer',
    fontSize: '16px',
    transition: 'all 0.3s ease'
  },
  activeNavButton: {
    backgroundColor: '#357ae8',
    borderColor: '#357ae8'
  },
  main: {
    padding: '2rem',
    minHeight: 'calc(100vh - 140px)',
    backgroundColor: '#f0f8ff'
  },
  footer: {
    backgroundColor: '#4a90e2',
    color: 'white',
    textAlign: 'center',
    padding: '1rem',
    fontSize: '14px'
  }
};

export default App;