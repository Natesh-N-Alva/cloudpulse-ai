import { 
  RefreshCw, 
  Bell, 
  Plus, 
  Wifi, 
  WifiOff, 
  CheckCircle2, 
  AlertTriangle,
  Play
} from 'lucide-react';

export default function TopNav({
  activeTab,
  isDemoMode,
  setIsDemoMode,
  onRefresh,
  isRefreshing,
  refreshInterval,
  setRefreshInterval,
  anomalies,
  onOpenAddMonitor,
  onOpenQuickProbe,
  summary
}) {
  const hasOutages = summary.some(s => s.uptime_percentage < 90);
  const totalChecks = summary.reduce((acc, curr) => acc + (curr.total_checks || 0), 0);
  const upChecks = summary.reduce((acc, curr) => {
    const checks = curr.total_checks || 0;
    const uptimePct = curr.uptime_percentage || 0;
    return acc + Math.round((uptimePct / 100) * checks);
  }, 0);
  const overallUptime = totalChecks > 0 ? ((upChecks / totalChecks) * 100).toFixed(1) : '99.8';

  const viewNames = {
    overview: 'System Overview & Telemetry',
    monitors: 'Monitored Service Endpoints',
    logs: 'DynamoDB Telemetry Logs',
    ai: 'AI Incident Copilot & Runbooks',
    probe: 'Live Endpoint Probe Tester',
    architecture: 'AWS Architecture & Pipeline',
  };

  return (
    <header className="app-topnav">
      {/* Breadcrumb & Title */}
      <div className="topnav-left">
        <div className="breadcrumb-trail">
          <span className="breadcrumb-root">CloudPulse</span>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-active">{viewNames[activeTab] || 'Overview'}</span>
        </div>
      </div>

      {/* Center / Right Control Center */}
      <div className="topnav-right">
        {/* System Health Status Pill */}
        <div className={`system-health-pill ${hasOutages ? 'health-warning' : 'health-ok'}`}>
          {hasOutages ? <AlertTriangle size={13} /> : <CheckCircle2 size={13} />}
          <span>{hasOutages ? 'Degraded Incident' : `${overallUptime}% Systems Operational`}</span>
        </div>

        {/* Demo Mode Switcher */}
        <button
          className={`demo-toggle-btn ${isDemoMode ? 'active' : ''}`}
          onClick={() => setIsDemoMode(!isDemoMode)}
          title={isDemoMode ? 'Running in simulation mode. Click to toggle live backend.' : 'Click to run with demonstration telemetry.'}
        >
          {isDemoMode ? <WifiOff size={13} /> : <Wifi size={13} />}
          <span>{isDemoMode ? 'Simulated' : 'Live Stream'}</span>
        </button>

        {/* Quick Probe Button */}
        <button
          className="btn-quick-probe"
          onClick={onOpenQuickProbe}
          title="Instantly test any URL response and latency"
        >
          <Play size={13} />
          <span>Quick Ping</span>
        </button>

        {/* Add Monitor Button */}
        <button
          className="btn-add-monitor-top"
          onClick={onOpenAddMonitor}
          title="Add a new website or endpoint to monitor"
        >
          <Plus size={14} />
          <span>New Monitor</span>
        </button>

        {/* Auto Refresh Select */}
        <div className="refresh-control-box">
          <span className="refresh-txt">Poll:</span>
          <select
            className="refresh-dropdown"
            value={refreshInterval}
            onChange={(e) => setRefreshInterval(Number(e.target.value))}
          >
            <option value={0}>Manual</option>
            <option value={10000}>10s</option>
            <option value={30000}>30s</option>
            <option value={60000}>1m</option>
          </select>
        </div>

        {/* Refresh Button */}
        <button
          className={`btn-sync ${isRefreshing ? 'syncing' : ''}`}
          onClick={onRefresh}
          disabled={isRefreshing}
          title="Force update dashboard telemetry"
        >
          <RefreshCw size={14} />
        </button>

        {/* Alert Bell */}
        <div className="alert-bell-wrap" title={`${anomalies.length} active predictive alerts`}>
          <Bell size={16} />
          {anomalies.length > 0 && <span className="bell-badge">{anomalies.length}</span>}
        </div>
      </div>
    </header>
  );
}
