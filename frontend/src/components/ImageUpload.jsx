import React, { useState } from 'react';
import { Api } from '../services/Api';

const ImageUpload = ({ onImageUploaded }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('📷 Будь ласка, оберіть файл зображення');
      return;
    }

    if (!name.trim()) {
      alert('✏️ Введіть назву для фото');
      return;
    }

    setIsUploading(true);
    try {
      const newImage = await Api.uploadImage(file, name, description);
      onImageUploaded(newImage);
      event.target.value = '';
      setName('');
      setDescription('');
    } catch (error) {
      alert('❌ Помилка завантаження: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div style={styles.uploadContainer}>
      <h3 style={styles.title}>📤 Додати нове сімейне фото</h3>
      
      <div style={styles.inputGroup}>
        <label style={styles.label}>📝 Назва фото *</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isUploading}
          style={styles.textInput}
          placeholder="Наприклад: Сімейне свято 2024"
          maxLength={100}
        />
      </div>

      <div style={styles.inputGroup}>
        <label style={styles.label}>📄 Опис фото (необов'язково)</label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={isUploading}
          style={styles.textInput}
          maxLength={200}
        />
      </div>

      <div style={styles.uploadGroup}>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          disabled={isUploading || !name.trim()}
          style={styles.fileInput}
          id="file-upload"
        />
        <label 
          htmlFor="file-upload" 
          style={{
            ...styles.uploadButton,
            ...(isUploading || !name.trim() ? styles.disabledButton : {})
          }}
        >
          {isUploading ? '⏳ Завантаження...' : '📸 Обрати та завантажити фото'}
        </label>
        {!name.trim() && (
          <div style={styles.hint}>✏️ Введіть назву фото для завантаження</div>
        )}
      </div>
    </div>
  );
};

const styles = {
  uploadContainer: {
    margin: '20px 0',
    padding: '25px',
    border: '2px dashed #4a90e2',
    borderRadius: '20px',
    backgroundColor: '#f0f8ff',
    textAlign: 'center'
  },
  title: {
    margin: '0 0 20px 0',
    color: '#333',
    fontSize: '1.3rem'
  },
  inputGroup: {
    marginBottom: '20px',
    textAlign: 'left'
  },
  uploadGroup: {
    textAlign: 'center',
    marginTop: '25px'
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontWeight: 'bold',
    color: '#333',
    fontSize: '14px'
  },
  textInput: {
    width: '100%',
    padding: '12px 15px',
    border: '2px solid #4a90e2',
    borderRadius: '15px',
    fontSize: '16px',
    boxSizing: 'border-box',
    outline: 'none',
    transition: 'border-color 0.3s ease',
    backgroundColor: 'white'
  },
  fileInput: {
    display: 'none'
  },
  uploadButton: {
    display: 'inline-block',
    padding: '15px 30px',
    backgroundColor: '#4a90e2',
    color: 'white',
    borderRadius: '25px',
    cursor: 'pointer',
    border: 'none',
    fontSize: '16px',
    fontWeight: 'bold',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 15px rgba(74, 144, 226, 0.3)'
  },
  disabledButton: {
    backgroundColor: '#ccc',
    cursor: 'not-allowed',
    boxShadow: 'none'
  },
  hint: {
    marginTop: '10px',
    fontSize: '14px',
    color: '#666'
  }
};

export default ImageUpload;