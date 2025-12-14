import React from 'react';
import {DateManager} from "../classes/DateManager.jsx"
const ImageGallery = ({ images, onImageSelect }) => {
  if (images.length === 0) {  // Показувати що немає завантажених фото
    return (
      <div style={styles.emptyState}>
        <p>📷 Ще немає завантажених фото</p>
        <p style={styles.hint}>Завантажте перше фото вище!</p>
      </div>
    );
  }

  return (
    <div style={styles.gallery}>
      <h3 style={styles.galleryTitle}>📂 Всі фото ({images.length})</h3>
      <div style={styles.imagesGrid}> 
        {images.map(image => (    //  Робимо ітерацію  по кожному фото та відображаємо
          <div 
            key={image.id} 
            style={styles.imageCard}
            onClick={() => onImageSelect(image)}
          >
            <img
              src={`https://senchuknazar123.online/original/${image.id}-${image.filename}`}
              alt={image.name}
              style={styles.image}
            />
            <div style={styles.imageInfo}>
              <div style={styles.imageName}>{image.name}</div>
              {image.description && (
                <div style={styles.imageDescription}>{image.description}</div>
              )}
              <div style={styles.imageDate}>
                {DateManager.formatImageDate(image.created_at)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const styles = {
  gallery: {
    padding: '20px 0'
  },
  galleryTitle: {
    textAlign: 'center',
    color: '#333',
    marginBottom: '25px',
    fontSize: '1.5rem'
  },
  imagesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: '25px'
  },
  imageCard: {
    border: '2px solid #e0e0e0',
    borderRadius: '15px',
    overflow: 'hidden',
    backgroundColor: 'white',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  imageCardHover: {
    transform: 'translateY(-5px)',
    boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
  },
  image: {
    width: '100%',
    height: '180px',
    objectFit: 'cover'
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
  imageDescription: {
    fontSize: '12px',
    color: '#666',
    marginBottom: '8px',
    textAlign: 'center',
    fontStyle: 'italic'
  },
  imageDate: {
    fontSize: '11px',
    color: '#999',
    textAlign: 'center'
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#666',
    fontSize: '18px'
  },
  hint: {
    fontSize: '14px',
    color: '#999',
    marginTop: '10px'
  }
};

export default ImageGallery;