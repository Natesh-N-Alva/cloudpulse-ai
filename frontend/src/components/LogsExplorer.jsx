import { useState, useMemo } from 'react';
import { 
  Search, 
  Download, 
  Radio, 
  Filter, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  Eye, 
  ArrowUpDown,
  RefreshCw
} from 'lucide-react';
import { exportLogsToCSV, exportLogsToJSON } from '../services/api';

export default function LogsExplorer({
  logs,
  selectedEndpoint,
  setSelectedEndpoint,
  onDiagnoseLog,
  onOpenLogDetail,
  onRefresh,
  isRefreshing
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, 200, 503, SLOW
  const [isLiveTail, setIsLiveTail] = useState(false);
  const [pageSize] = useState(15);
  const [currentPage, setCurrentPage] = useState(1);

  // Filtered logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // 1. Endpoint filter
      if (selectedEndpoint && log.WebsiteURL !== selectedEndpoint) {
        return false;
      }

      // 2. Status filter
      if (statusFilter === '200' && log.StatusCode !== 200) return false;
      if (statusFilter === '503' && log.StatusCode !== 503) return false;
      if (statusFilter === 'SLOW' && (log.LatencyMS || 0) < 300) return false;

      // 3. Search query
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const urlMatch = (log.WebsiteURL || '').toLowerCase().includes(term);
        const nameMatch = (log.EndpointName || '').toLowerCase().includes(term);
        const errorMatch = (log.ErrorMessage || '').toLowerCase().includes(term);
        const reqMatch = (log.RequestId || '').toLowerCase().includes(term);
        const codeMatch = String(log.StatusCode || '').includes(term);
        return urlMatch || nameMatch || errorMatch || reqMatch || codeMatch;
      }

      return true;
    });
  }, [logs, selectedEndpoint, statusFilter, searchTerm]);

  // Pagination
  const totalPages = Math.ceil(filteredLogs.length / pageSize) || 1;
  const paginatedLogs = filteredLogs.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const formatTimestamp = (ts) => {
    if (!ts) return '--:--:--';
    try {
      const d = new Date(ts);
      return `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
    } catch {
      return ts;
    }
  };

  return (
    <div className="logs-explorer-page">
      {/* Top Toolbar */}
      <div className="logs-toolbar-header">
        <div className="toolbar-left-group">
          {/* Search Box */}
          <div className="logs-search-wrapper">
            <Search size={15} className="logs-search-icon" />
            <input
              type="text"
              placeholder="Filter by URL, Status, Request ID, Error..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="logs-search-input"
            />
            {searchTerm && (
              <button className="clear-search-btn" onClick={() => setSearchTerm('')}>✕</button>
            )}
          </div>

          {/* Quick Filter Buttons */}
          <div className="quick-filter-pills">
            <button
              className={`filter-pill-btn ${statusFilter === 'ALL' ? 'active' : ''}`}
              onClick={() => { setStatusFilter('ALL'); setCurrentPage(1); }}
            >
              All Logs
            </button>
            <button
              className={`filter-pill-btn ${statusFilter === '200' ? 'active' : ''}`}
              onClick={() => { setStatusFilter('200'); setCurrentPage(1); }}
            >
              200 OK
            </button>
            <button
              className={`filter-pill-btn ${statusFilter === '503' ? 'active' : ''}`}
              onClick={() => { setStatusFilter('503'); setCurrentPage(1); }}
            >
              503 Outages
            </button>
            <button
              className={`filter-pill-btn ${statusFilter === 'SLOW' ? 'active' : ''}`}
              onClick={() => { setStatusFilter('SLOW'); setCurrentPage(1); }}
            >
              Latency &gt; 300ms
            </button>
          </div>
        </div>

        {/* Action Controls */}
        <div className="toolbar-right-actions">
          {/* Live Tail Toggle */}
          <button
            className={`btn-live-tail ${isLiveTail ? 'live-active' : ''}`}
            onClick={() => setIsLiveTail(!isLiveTail)}
            title="Toggle Live Log Stream"
          >
            <Radio size={13} className={isLiveTail ? 'pulse-tail' : ''} />
            <span>{isLiveTail ? 'Live Tail: ON' : 'Live Tail: OFF'}</span>
          </button>

          {/* Export Dropdown */}
          <div className="export-btn-group">
            <button
              className="btn-export-csv"
              onClick={() => exportLogsToCSV(filteredLogs)}
              title="Download filtered telemetry as CSV"
            >
              <Download size={13} />
              <span>CSV</span>
            </button>
            <button
              className="btn-export-json"
              onClick={() => exportLogsToJSON(filteredLogs)}
              title="Download filtered telemetry as JSON"
            >
              <span>JSON</span>
            </button>
          </div>

          {/* Refresh */}
          <button
            className={`btn-refresh-logs ${isRefreshing ? 'syncing' : ''}`}
            onClick={onRefresh}
            disabled={isRefreshing}
            title="Fetch latest DynamoDB records"
          >
            <RefreshCw size={13} />
          </button>
        </div>
      </div>

      {/* Selected Endpoint Filter Tag */}
      {selectedEndpoint && (
        <div className="active-endpoint-filter-banner">
          <span className="banner-text">Showing telemetry exclusively for: <strong>{selectedEndpoint}</strong></span>
          <button
            className="btn-clear-endpoint-filter"
            onClick={() => setSelectedEndpoint('')}
          >
            Show All Endpoints
          </button>
        </div>
      )}

      {/* Logs Table Container */}
      <div className="logs-table-card">
        <div className="table-responsive-wrapper">
          <table className="telemetry-table">
            <thead>
              <tr>
                <th style={{ width: '165px' }}>Timestamp</th>
                <th>Target Endpoint</th>
                <th style={{ width: '110px' }}>HTTP Status</th>
                <th style={{ width: '140px' }}>Response Time</th>
                <th style={{ width: '90px' }}>State</th>
                <th>Diagnostic / Error Details</th>
                <th style={{ width: '130px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedLogs.length === 0 ? (
                <tr>
                  <td colSpan="7" className="table-empty-cell">
                    <div className="empty-logs-state">
                      <Filter size={24} />
                      <p>No telemetry logs match the current criteria.</p>
                      <button
                        className="btn-reset-filters"
                        onClick={() => {
                          setSearchTerm('');
                          setStatusFilter('ALL');
                          setSelectedEndpoint('');
                        }}
                      >
                        Reset Filters
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((log, index) => {
                  const is200 = log.StatusCode === 200;
                  const is503 = log.StatusCode === 503;
                  const isDown = !log.IsUp;
                  const latency = log.LatencyMS || 0;

                  let latColor = 'lat-fast';
                  if (latency > 400 || isDown) latColor = 'lat-critical';
                  else if (latency > 150) latColor = 'lat-moderate';

                  return (
                    <tr
                      key={index}
                      className={`telemetry-row ${isDown ? 'row-outage' : ''}`}
                    >
                      {/* Timestamp */}
                      <td className="cell-timestamp">
                        <div className="ts-flex">
                          <Clock size={12} className="ts-icon" />
                          <span>{formatTimestamp(log.Timestamp)}</span>
                        </div>
                      </td>

                      {/* Endpoint URL & Name */}
                      <td className="cell-endpoint">
                        <div className="endpoint-identity">
                          {log.EndpointName && (
                            <span className="endpoint-name-badge">{log.EndpointName}</span>
                          )}
                          <span className="endpoint-url-span" title={log.WebsiteURL}>
                            {log.WebsiteURL}
                          </span>
                        </div>
                      </td>

                      {/* Status Code */}
                      <td className="cell-status">
                        <span className={`status-pill-code ${is200 ? 'status-200' : is503 ? 'status-503' : 'status-err'}`}>
                          {log.StatusCode || 'ERR'}
                        </span>
                      </td>

                      {/* Latency */}
                      <td className="cell-latency">
                        <div className="latency-bar-container">
                          <span className={`latency-val-text ${latColor}`}>{latency} ms</span>
                          <div className="latency-progress-track">
                            <div
                              className={`latency-progress-fill ${latColor}`}
                              style={{ width: `${Math.min(100, Math.max(10, (latency / 750) * 100))}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>

                      {/* State */}
                      <td className="cell-state">
                        <span className={`state-chip ${log.IsUp ? 'state-up' : 'state-down'}`}>
                          {log.IsUp ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
                          <span>{log.IsUp ? 'UP' : 'DOWN'}</span>
                        </span>
                      </td>

                      {/* Error details */}
                      <td className="cell-error">
                        {log.ErrorMessage && log.ErrorMessage !== 'None' ? (
                          <span className="error-text-highlight" title={log.ErrorMessage}>
                            {log.ErrorMessage}
                          </span>
                        ) : (
                          <span className="healthy-text">Normal TCP Handshake</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="cell-actions" style={{ textAlign: 'right' }}>
                        <div className="row-action-btns">
                          <button
                            className="btn-inspect-row"
                            onClick={() => onOpenLogDetail(log)}
                            title="Inspect full JSON telemetry and curl reproduction"
                          >
                            <Eye size={13} />
                          </button>
                          <button
                            className="btn-diagnose-row"
                            onClick={() => onDiagnoseLog(log)}
                            title="Send event to AI Incident Copilot"
                          >
                            <Sparkles size={12} />
                            <span>Diagnose</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer with Pagination */}
        <div className="table-pagination-footer">
          <div className="pagination-count-label">
            Showing <strong>{paginatedLogs.length}</strong> of <strong>{filteredLogs.length}</strong> telemetry logs
          </div>

          <div className="pagination-controls">
            <button
              className="btn-page"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(p => p - 1)}
            >
              Previous
            </button>
            <span className="page-indicator">
              Page {currentPage} of {totalPages}
            </span>
            <button
              className="btn-page"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(p => p + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
