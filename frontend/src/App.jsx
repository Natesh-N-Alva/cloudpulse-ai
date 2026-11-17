import React, { useState, useEffect } from 'react';
import { fetchMonitoringLogs, diagnoseIncident } from './services/api';
import './App.css';

function App() {
  const [logs, setLogs] = useState([]);
  const [query, setQuery] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadLogs();
    const interval = setInterval(loadLogs, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadLogs = async () => {
    const data = await fetchMonitoringLogs();
    setLogs(data);
  };

  const handleDiagnose = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setDiagnosis('');
    const result = await diagnoseIncident(query);
    setDiagnosis(result);
    setLoading(false);
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'Arial, sans-serif', maxWidth: '1200px', margin: '0 auto', backgroundColor: '#0f172a', color: '#f8fafc', minHeight: '100vh' }}>
      <header style={{ marginBottom: '2rem', borderBottom: '1px solid #334155', paddingBottom: '1rem' }}>
        <h1 style={{ fontSize: '2.5rem', margin: '0', color: '#38bdf8' }}>CloudPulse AI Dashboard</h1>
        <p style={{ color: '#94a3b8' }}>Real-time AWS Infrastructure Monitoring & Local LLM Incident Diagnosis</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        <div style={{ backgroundColor: '#1e293b', padding: '1.5rem', borderRadius: '8px', border: '1px solid #334155' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ margin: '0', fontSize: '1.25rem' }}>Live Cloud Health Logs</h2>
            <button onClick={loadLogs} style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer' }}>Refresh</button>
          </div>
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {logs.length === 0 ? (
              <p style={{ color: '#94a3b8' }}>No logs found or connecting to DynamoDB...</p>
            ) : (
              logs.map((log, index) => (
                <div key={index} style={{ marginBottom: '0.75rem', padding: '0.75rem', backgroundColor: '#0f172a', borderRadius: '6px', borderLeft: `4px solid ${log.IsUp ? '#22c55e' : '#ef4444'}` }}>
                  <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>{log.Timestamp}</div>
                  <div style={{ fontWeight: 'bold', color: '#e2e8f0' }}>{log.WebsiteURL}</div>
                  <div style={{ fontSize: '0.9rem', display: 'flex', gap: '1rem', marginTop: '0.25rem' }}>
                    <span>Status: <strong>{log.StatusCode}</strong></span>
                    <span>Latency: <strong>{log.LatencyMS}ms</strong></span>
                    <span>State: <strong>{log.IsUp ? 'UP' : 'DOWN'}</strong></span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div style={{ backgroundColor: '#1e293b', padding: '1.5rem', borderRadius: '8px', border: '1px solid #334155' }}>
          <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.25rem' }}>AI Incident Diagnosis</h2>
          <form onSubmit={handleDiagnose} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask AI about recent incidents (e.g., Why did httpstat.us fail?)..."
              rows={3}
              style={{ padding: '0.75rem', borderRadius: '6px', backgroundColor: '#0f172a', color: '#fff', border: '1px solid #475569', resize: 'none' }}
            />
            <button type="submit" disabled={loading} style={{ background: '#10b981', color: '#fff', border: 'none', padding: '0.75rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
              {loading ? 'Analyzing with Llama 3.2...' : 'Diagnose with CloudPulse AI'}
            </button>
          </form>

          {diagnosis && (
            <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: '#0f172a', borderRadius: '6px', border: '1px solid #334155', maxHeight: '250px', overflowY: 'auto' }}>
              <h3 style={{ margin: '0 0 0.5rem 0', color: '#38bdf8', fontSize: '1rem' }}>AI Analysis:</h3>
              <p style={{ margin: '0', whiteSpace: 'pre-wrap', lineHeight: '1.5', color: '#e2e8f0' }}>{diagnosis}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;