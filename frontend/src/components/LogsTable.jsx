import { useState, useMemo } from 'react';
import { Search, Filter, CheckCircle2, XCircle, Clock, Sparkles, RefreshCw } from 'lucide-react';

export default function LogsTable({
  logs,
  selectedEndpoint,
  setSelectedEndpoint,
  onDiagnoseLog,
  onRefresh,
  isRefreshing
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, UP, DOWN, SLOW

  // Filtered logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // 1. Endpoint filter
      if (selectedEndpoint && log.WebsiteURL !== selectedEndpoint) {
        return false;
      }

      // 2. Status filter
      if (statusFilter === 'UP' && !log.IsUp) return false;
      if (statusFilter === 'DOWN' && log.IsUp) return false;
      if (statusFilter === 'SLOW' && (log.LatencyMS || 0) < 300) return false;

      // 3. Search query
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const urlMatch = (log.WebsiteURL || '').toLowerCase().includes(term);
        const errorMatch = (log.ErrorMessage || '').toLowerCase().includes(term);
        const codeMatch = String(log.StatusCode || '').includes(term);
        return urlMatch || errorMatch || codeMatch;
      }

      return true;
    });
  }, [logs, selectedEndpoint, statusFilter, searchTerm]);

  // Format timestamp nicely
  const formatTime = (ts) => {
    if (!ts) return '--:--:--';
    try {
      const d = new Date(ts);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + 
        ' (' + d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ')';
    } catch {
      return ts;
    }
  };

  return (
    <div className="logs-panel">
      <div className="panel-header">
        <div className="panel-title-group">
          <h2 className="panel-title">Real-Time DynamoDB Health Logs</h2>
          <span className="log-count-pill">{filteredLogs.length} of {logs.length} records</span>
          {selectedEndpoint && (
            <div className="active-filter-tag">
              <span>Filtered: {selectedEndpoint}</span>
              <button
                className="btn-clear-tag"
                onClick={() => setSelectedEndpoint('')}
                title="Clear endpoint filter"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        <button
          className="btn-panel-refresh"
          onClick={onRefresh}
          disabled={isRefreshing}
          title="Refresh logs from backend"
        >
          <RefreshCw size={14} className={isRefreshing ? 'spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Search and Filters Bar */}
      <div className="filter-controls-bar">
        <div className="search-input-wrap">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search by URL, status code (e.g. 503), error..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="search-clear-btn" onClick={() => setSearchTerm('')}>
              ✕
            </button>
          )}
        </div>

        <div className="status-filter-pills">
          <button
            className={`filter-btn ${statusFilter === 'ALL' ? 'active' : ''}`}
            onClick={() => setStatusFilter('ALL')}
          >
            All Logs
          </button>
          <button
            className={`filter-btn ${statusFilter === 'UP' ? 'active' : ''}`}
            onClick={() => setStatusFilter('UP')}
          >
            Healthy (UP)
          </button>
          <button
            className={`filter-btn ${statusFilter === 'DOWN' ? 'active' : ''}`}
            onClick={() => setStatusFilter('DOWN')}
          >
            Outages (DOWN)
          </button>
          <button
            className={`filter-btn ${statusFilter === 'SLOW' ? 'active' : ''}`}
            onClick={() => setStatusFilter('SLOW')}
          >
            Slow (&gt;300ms)
          </button>
        </div>
      </div>

      {/* Logs Table */}
      <div className="table-responsive">
        <table className="logs-table">
          <thead>
            <tr>
              <th style={{ width: '170px' }}>Timestamp (IST)</th>
              <th>Endpoint URL</th>
              <th style={{ width: '110px' }}>HTTP Status</th>
              <th style={{ width: '120px' }}>Latency</th>
              <th style={{ width: '100px' }}>State</th>
              <th>Error Details</th>
              <th style={{ width: '90px', textAlign: 'center' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan="7" className="table-empty-row">
                  <div className="empty-state">
                    <Filter size={24} className="empty-icon" />
                    <p>No telemetry logs match the current search or filters.</p>
                    {(searchTerm || statusFilter !== 'ALL' || selectedEndpoint) && (
                      <button
                        className="btn-reset-filters"
                        onClick={() => {
                          setSearchTerm('');
                          setStatusFilter('ALL');
                          setSelectedEndpoint('');
                        }}
                      >
                        Reset All Filters
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              filteredLogs.map((log, index) => {
                const is200 = log.StatusCode === 200;
                const is503 = log.StatusCode === 503;
                const isDown = !log.IsUp;
                const latency = log.LatencyMS || 0;

                let latencyBadgeClass = 'lat-green';
                if (latency > 400 || isDown) latencyBadgeClass = 'lat-red';
                else if (latency > 150) latencyBadgeClass = 'lat-yellow';

                return (
                  <tr key={index} className={isDown ? 'row-down' : ''}>
                    <td className="col-timestamp">
                      <div className="time-wrap">
                        <Clock size={13} className="time-icon" />
                        <span>{formatTime(log.Timestamp)}</span>
                      </div>
                    </td>

                    <td className="col-url">
                      <span className="url-text" title={log.WebsiteURL}>
                        {log.WebsiteURL}
                      </span>
                    </td>

                    <td className="col-status">
                      <span className={`status-code-pill ${is200 ? 'code-200' : is503 ? 'code-503' : 'code-other'}`}>
                        {log.StatusCode || 'ERR'}
                      </span>
                    </td>

                    <td className="col-latency">
                      <div className="latency-cell">
                        <span className={`latency-number ${latencyBadgeClass}`}>
                          {latency}ms
                        </span>
                        <div className="mini-latency-track">
                          <div
                            className={`mini-latency-bar ${latencyBadgeClass}`}
                            style={{ width: `${Math.min(100, Math.max(8, (latency / 800) * 100))}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>

                    <td className="col-state">
                      <span className={`state-badge ${log.IsUp ? 'state-up' : 'state-down'}`}>
                        {log.IsUp ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                        <span>{log.IsUp ? 'UP' : 'DOWN'}</span>
                      </span>
                    </td>

                    <td className="col-error">
                      {log.ErrorMessage && log.ErrorMessage !== 'None' ? (
                        <span className="error-message-text" title={log.ErrorMessage}>
                          {log.ErrorMessage}
                        </span>
                      ) : (
                        <span className="no-error-text">None (Healthy)</span>
                      )}
                    </td>

                    <td className="col-action" style={{ textAlign: 'center' }}>
                      <button
                        className="btn-log-diagnose"
                        onClick={() => onDiagnoseLog(log)}
                        title="Analyze this log record with CloudPulse AI"
                      >
                        <Sparkles size={13} />
                        <span>Diagnose</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
