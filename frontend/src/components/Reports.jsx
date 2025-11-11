import React, { useState } from 'react';
import { Api } from '../services/Api'; // Changed from mockApi to Api

const Reports = () => {
  const [reportType, setReportType] = useState('quality');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedReport, setGeneratedReport] = useState(null);

  const reportTypes = [
    { value: 'quality', label: 'Звіт по якості' },
    { value: 'processing', label: 'Звіт по обробці' },
    { value: 'usage', label: 'Статистика використання' }
  ];

  const generateReport = async () => {
    setIsGenerating(true);
    try {
      const report = await Api.generateReport(reportType); // Changed to Api
      setGeneratedReport(report);
    } catch (error) {
      alert('Помилка генерації звіту: ' + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div style={styles.reports}>
      <h2>Генерація звітів</h2>
      
      <div style={styles.controls}>
        <select 
          value={reportType} 
          onChange={(e) => setReportType(e.target.value)}
          style={styles.select}
        >
          {reportTypes.map(type => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>

        <button
          onClick={generateReport}
          disabled={isGenerating}
          style={styles.generateButton}
        >
          {isGenerating ? 'Генерація...' : 'Згенерувати звіт'}
        </button>
      </div>

      {generatedReport && (
        <div style={styles.reportResult}>
          <h3>Звіт згенеровано</h3>
          <p>Тип: {reportTypes.find(t => t.value === generatedReport.type)?.label}</p>
          <p>Час генерації: {new Date(generatedReport.generatedAt).toLocaleString()}</p>
          <button style={styles.downloadButton}>
            Завантажити звіт
          </button>
        </div>
      )}
    </div>
  );
};

const styles = {
  reports: {
    padding: '20px',
    backgroundColor: 'white',
    borderRadius: '8px',
    margin: '20px 0'
  },
  controls: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
    marginBottom: '20px'
  },
  select: {
    padding: '8px 12px',
    borderRadius: '4px',
    border: '1px solid #ddd',
    minWidth: '200px'
  },
  generateButton: {
    padding: '8px 16px',
    backgroundColor: '#17a2b8',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  reportResult: {
    padding: '20px',
    backgroundColor: '#f8f9fa',
    borderRadius: '4px',
    border: '1px solid #dee2e6'
  },
  downloadButton: {
    padding: '8px 16px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    marginTop: '10px'
  }
};

export default Reports;