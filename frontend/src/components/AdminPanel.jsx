import React, { useState, useEffect } from 'react';
import { Api } from '../services/Api'; // Changed from mockApi to Api

const AdminPanel = () => {
  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('stats');

  useEffect(() => {
    loadStats();
    loadLogs();
  }, []);

  const loadStats = async () => {
    const statsData = await Api.getAdminStats(); // Changed to Api
    setStats(statsData);
  };

  const loadLogs = async () => {
    const logsData = await Api.getProcessingLogs(); // Changed to Api
    setLogs(logsData);
  };

  if (!stats) {
    return <div style={styles.loading}>Завантаження...</div>;
  }

  return (
    <div style={styles.adminPanel}>
      <h2>Панель адміністратора</h2>
      
      <div style={styles.tabs}>
        <button
          style={{...styles.tab, ...(activeTab === 'stats' && styles.activeTab)}}
          onClick={() => setActiveTab('stats')}
        >
          Статистика
        </button>
        <button
          style={{...styles.tab, ...(activeTab === 'logs' && styles.activeTab)}}
          onClick={() => setActiveTab('logs')}
        >
          Логи обробки
        </button>
      </div>

      {activeTab === 'stats' && (
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <h3>Загалом зображень</h3>
            <p style={styles.statNumber}>{stats.totalImages}</p>
          </div>
          <div style={styles.statCard}>
            <h3>Оброблено</h3>
            <p style={styles.statNumber}>{stats.processedImages}</p>
          </div>
          <div style={styles.statCard}>
            <h3>В черзі</h3>
            <p style={styles.statNumber}>{stats.processingQueue}</p>
          </div>
          <div style={styles.statCard}>
            <h3>Помилки</h3>
            <p style={styles.statNumber}>{stats.errorCount}</p>
          </div>
        </div>
      )}

      {activeTab === 'logs' && (
        <div style={styles.logsTable}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.tableTh}>Файл</th>
                <th style={styles.tableTh}>Операція</th>
                <th style={styles.tableTh}>Статус</th>
                <th style={styles.tableTh}>Час</th>
                <th style={styles.tableTh}>Тривалість</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id}>
                  <td style={styles.tableTd}>{log.filename}</td>
                  <td style={styles.tableTd}>{log.operation}</td>
                  <td style={styles.tableTd}>
                    <span style={{
                      ...styles.status,
                      ...(log.status === 'completed' ? styles.statusCompleted : styles.statusError)
                    }}>
                      {log.status}
                    </span>
                  </td>
                  <td style={styles.tableTd}>{new Date(log.timestamp).toLocaleString()}</td>
                  <td style={styles.tableTd}>{log.duration}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const styles = {
  adminPanel: {
    padding: '20px',
    backgroundColor: 'white',
    borderRadius: '8px',
    margin: '20px 0'
  },
  tabs: {
    display: 'flex',
    marginBottom: '20px',
    borderBottom: '1px solid #ddd'
  },
  tab: {
    padding: '10px 20px',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    borderBottom: '2px solid transparent'
  },
  activeTab: {
    borderBottomColor: '#007bff',
    color: '#007bff'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px'
  },
  statCard: {
    padding: '20px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    textAlign: 'center'
  },
  statNumber: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#007bff',
    margin: '10px 0 0 0'
  },
  logsTable: {
    overflowX: 'auto'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  tableTh: {
    backgroundColor: '#f8f9fa',
    padding: '12px',
    textAlign: 'left',
    borderBottom: '1px solid #ddd'
  },
  tableTd: {
    padding: '12px',
    borderBottom: '1px solid #eee'
  },
  status: {
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 'bold'
  },
  statusCompleted: {
    backgroundColor: '#d4edda',
    color: '#155724'
  },
  statusError: {
    backgroundColor: '#f8d7da',
    color: '#721c24'
  },
  loading: {
    textAlign: 'center',
    padding: '40px'
  }
};

export default AdminPanel;