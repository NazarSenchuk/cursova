import React, { useState } from 'react';
import { mockApi } from '../services/mockApi';

const ImageUpload = ({ onImageUploaded }) => {
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Будь ласка, виберіть файл зображення');
      return;
    }

    setIsUploading(true);
    try {
      const newImage = await mockApi.uploadImage(file);
      onImageUploaded(newImage);
      event.target.value = '';
    } catch (error) {
      alert('Помилка завантаження: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div style={styles.uploadContainer}>
      <input
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        disabled={isUploading}
        style={styles.fileInput}
        id="file-upload"
      />
      <label htmlFor="file-upload" style={styles.uploadButton}>
        {isUploading ? 'Завантаження...' : 'Завантажити фото'}
      </label>
    </div>
  );
};

const styles = {
  uploadContainer: {
    margin: '20px 0',
    textAlign: 'center'
  },
  fileInput: {
    display: 'none'
  },
  uploadButton: {
    display: 'inline-block',
    padding: '10px 20px',
    backgroundColor: '#007bff',
    color: 'white',
    borderRadius: '5px',
    cursor: 'pointer',
    border: 'none',
    fontSize: '16px'
  }
};

export default ImageUpload;
