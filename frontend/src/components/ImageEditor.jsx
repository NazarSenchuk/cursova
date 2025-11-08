import React, { useState } from 'react';
import { mockApi } from '../services/mockApi';

const ImageEditor = ({ selectedImage, onProcessingComplete }) => {
  const [selectedOperation, setSelectedOperation] = useState('resize');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingResult, setProcessingResult] = useState(null);

  const operations = [
    { value: 'resize', label: 'Змінити розмір' },
    { value: 'grayscale', label: 'Чорно-біле' },
    { value: 'blur', label: 'Розмиття' },
    { value: 'enhance', label: 'Покращити якість' },
    { value: 'edges', label: 'Виявити контури' }
  ];

  const handleProcess = async () => {
    if (!selectedImage) return;

    setIsProcessing(true);
    try {
      const result = await mockApi.processImage(selectedImage.id, selectedOperation);
      setProcessingResult(result);
      onProcessingComplete(result);
    } catch (error) {
      alert('Помилка обробки: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!selectedImage) {
    return (
      <div style={styles.emptyState}>
        <p>Виберіть зображення для обробки</p>
      </div>
    );
  }

  return (
    <div style={styles.editor}>
      <div style={styles.previewSection}>
        <div style={styles.imageContainer}>
          <img src={selectedImage.url} alt="Original" style={styles.previewImage} />
          <p style={styles.imageLabel}>Оригінал</p>
        </div>
        
        {processingResult && (
          <div style={styles.imageContainer}>
            <img src={processingResult.resultUrl} alt="Processed" style={styles.previewImage} />
            <p style={styles.imageLabel}>Результат ({processingResult.operation})</p>
            <p style={styles.qualityScore}>
              Оцінка якості: {processingResult.qualityScore.toFixed(1)}
            </p>
          </div>
        )}
      </div>

      <div style={styles.controls}>
        <select 
          value={selectedOperation} 
          onChange={(e) => setSelectedOperation(e.target.value)}
          style={styles.select}
          disabled={isProcessing}
        >
          {operations.map(op => (
            <option key={op.value} value={op.value}>
              {op.label}
            </option>
          ))}
        </select>

        <button
          onClick={handleProcess}
          disabled={isProcessing}
          style={styles.processButton}
        >
          {isProcessing ? 'Обробка...' : 'Обробити'}
        </button>
      </div>
    </div>
  );
};

const styles = {
  editor: {
    padding: '20px',
    backgroundColor: 'white',
    borderRadius: '8px',
    margin: '20px 0'
  },
  previewSection: {
    display: 'flex',
    gap: '20px',
    marginBottom: '20px',
    flexWrap: 'wrap'
  },
  imageContainer: {
    textAlign: 'center',
    flex: 1,
    minWidth: '200px'
  },
  previewImage: {
    maxWidth: '100%',
    maxHeight: '300px',
    borderRadius: '4px'
  },
  imageLabel: {
    margin: '10px 0 5px 0',
    fontSize: '14px',
    color: '#666'
  },
  qualityScore: {
    fontSize: '12px',
    color: '#007bff',
    fontWeight: 'bold'
  },
  controls: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
    justifyContent: 'center'
  },
  select: {
    padding: '8px 12px',
    borderRadius: '4px',
    border: '1px solid #ddd'
  },
  processButton: {
    padding: '8px 16px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px',
    color: '#666'
  }
};

export default ImageEditor;
