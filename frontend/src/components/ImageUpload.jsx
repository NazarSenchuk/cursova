import React, { useState } from 'react';
import { Api } from '../services/Api'; // Changed from mockApi to Api

const ImageUpload = ({ onImageUploaded }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Будь ласка, виберіть файл зображення');
      return;
    }

    // Перевірка наявності назви
    if (!name.trim()) {
      alert('Будь ласка, введіть назву для зображення');
      return;
    }

    setIsUploading(true);
    try {
      const newImage = await Api.uploadImage(file, name, description); // Передаємо назву та опис
      onImageUploaded(newImage);
      event.target.value = '';
      // Очищаємо поля після успішного завантаження
      setName('');
      setDescription('');
    } catch (error) {
      alert('Помилка завантаження: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div style={styles.uploadContainer}>
      {/* Поле для назви */}
      <div style={styles.inputGroup}>
        <label htmlFor="image-name" style={styles.label}>
          Назва зображення *
        </label>
        <input
          type="text"
          id="image-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isUploading}
          style={styles.textInput}
          placeholder="Введіть назву зображення"
          maxLength={100}
        />
      </div>

      {/* Поле для опису */}
      <div style={styles.inputGroup}>
        <label htmlFor="image-description" style={styles.label}>
          Опис зображення
        </label>
        <textarea
          id="image-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={isUploading}
          style={styles.textarea}
          placeholder="Введіть опис зображення (необов'язково)"
          maxLength={500}
          rows={3}
        />
      </div>

      {/* Завантаження файлу */}
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
          {isUploading ? 'Завантаження...' : 'Завантажити фото'}
        </label>
        {!name.trim() && (
          <div style={styles.hint}>Введіть назву для завантаження</div>
        )}
      </div>
    </div>
  );
};

const styles = {
  uploadContainer: {
    margin: '20px 0',
    padding: '20px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    backgroundColor: '#f9f9f9'
  },
  inputGroup: {
    marginBottom: '15px',
    textAlign: 'left'
  },
  uploadGroup: {
    textAlign: 'center',
    marginTop: '20px'
  },
  label: {
    display: 'block',
    marginBottom: '5px',
    fontWeight: 'bold',
    color: '#333'
  },
  textInput: {
    width: '100%',
    padding: '10px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    fontSize: '16px',
    boxSizing: 'border-box'
  },
  textarea: {
    width: '100%',
    padding: '10px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    fontSize: '16px',
    fontFamily: 'inherit',
    resize: 'vertical',
    boxSizing: 'border-box'
  },
  fileInput: {
    display: 'none'
  },
  uploadButton: {
    display: 'inline-block',
    padding: '12px 24px',
    backgroundColor: '#007bff',
    color: 'white',
    borderRadius: '5px',
    cursor: 'pointer',
    border: 'none',
    fontSize: '16px',
    fontWeight: 'bold',
    transition: 'background-color 0.3s'
  },
  disabledButton: {
    backgroundColor: '#6c757d',
    cursor: 'not-allowed'
  },
  hint: {
    marginTop: '8px',
    fontSize: '14px',
    color: '#6c757d'
  }
};

export default ImageUpload;