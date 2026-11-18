import { Activity, RefreshCw, Server, Wifi, WifiOff } from 'lucide-react';

export default function Navbar({
  backendOnline,
  isDemoMode,
  setIsDemoMode,
  onRefresh,
  isRefreshing,
  refreshInterval,
  setRefreshInterval
}) {
  return (
    <header className="navbar-container">
      <div className="navbar-brand">
        <div className="brand-logo-glow">
          <Activity className="brand-icon" size={24} />
        </div>
        <div>
          <div className="brand-title-wrap">
            <h1 className="brand-title">CloudPulse <span className="brand-highlight">AI</span></h1>
            <span className="badge-version">v1.2</span>
          </div>
          <p className="brand-subtitle">Serverless Telemetry & RAG Incident Response</p>
        </div>
      </div>

      <div className="navbar-actions">
        {/* Connection status badge */}
        <div className={`status-pill ${backendOnline ? 'online' : isDemoMode ? 'demo' : 'offline'}`}>
          <span className="status-dot"></span>
          <span className="status-text">
            {backendOnline ? 'Backend: Connected' : isDemoMode ? 'Demo Mode (Simulated)' : 'Backend: Offline'}
          </span>
        </div>

        {/* Region badge */}
        <div className="env-pill">
          <Server size={14} />
          <span>ap-south-1</span>
        </div>

        {/* Demo Mode Toggle */}
        <button
          className={`toggle-demo-btn ${isDemoMode ? 'active' : ''}`}
          onClick={() => setIsDemoMode(!isDemoMode)}
          title={isDemoMode ? "Currently using simulated data. Click to try live backend." : "Switch to demo simulated telemetry"}
        >
          {isDemoMode ? <WifiOff size={14} /> : <Wifi size={14} />}
          <span>{isDemoMode ? 'Demo Data' : 'Live Data'}</span>
        </button>

        {/* Auto Refresh dropdown */}
        <div className="refresh-select-wrap">
          <label htmlFor="refresh-select" className="refresh-label">Auto:</label>
          <select
            id="refresh-select"
            className="refresh-select"
            value={refreshInterval}
            onChange={(e) => setRefreshInterval(Number(e.target.value))}
          >
            <option value={0}>Off</option>
            <option value={10000}>10s</option>
            <option value={30000}>30s</option>
            <option value={60000}>60s</option>
          </select>
        </div>

        {/* Refresh button */}
        <button
          className={`btn-refresh ${isRefreshing ? 'spinning' : ''}`}
          onClick={onRefresh}
          disabled={isRefreshing}
          title="Manually fetch latest health logs and telemetry"
        >
          <RefreshCw size={15} />
          <span>{isRefreshing ? 'Updating...' : 'Refresh'}</span>
        </button>
      </div>
    </header>
  );
}
