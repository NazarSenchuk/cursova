import React from 'react';

const ImageGallery = ({ images, onImageSelect, onDeleteImage }) => {
  if (images.length === 0) {
    return (
      <div style={styles.emptyState}>
        <p>Немає завантажених зображень</p>
      </div>
    );
  }

  return (
    <div style={styles.gallery}>
      {images.map(image => (
        <div key={image.id} style={styles.imageCard}>
          <img
            src={image.url}
            alt={image.name}
            style={styles.image}
            onClick={() => onImageSelect(image)}
          />
          <h2> {image.name}</h2>
          <div style={styles.imageInfo}>
            <span style={styles.filename}>{image.description}</span>
            <button
              onClick={() => onDeleteImage(image.id)}
              style={styles.deleteButton}
            >
              Видалити
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

const styles = {
  gallery: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '20px',
    padding: '20px'
  },
  imageCard: {
    border: '1px solid #ddd',
    borderRadius: '8px',
    overflow: 'hidden',
    backgroundColor: 'white'
  },
  image: {
    width: '100%',
    height: '150px',
    objectFit: 'cover',
    cursor: 'pointer'
  },
  imageInfo: {
    padding: '10px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  filename: {
    fontSize: '12px',
    color: '#666',
    flex: 1
  },
  deleteButton: {
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    padding: '5px 10px',
    borderRadius: '3px',
    cursor: 'pointer',
    fontSize: '12px'
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px',
    color: '#666'
  }
};

export default ImageGallery;
