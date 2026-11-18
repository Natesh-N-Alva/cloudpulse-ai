import { useState, useRef, useEffect } from 'react';
import {
  RefreshCw,
  Bell,
  Plus,
  Wifi,
  WifiOff,
  CheckCircle2,
  AlertTriangle,
  Play,
  ShieldAlert,
  Radio
} from 'lucide-react';

export default function TopNav({
  activeTab,
  isDemoMode,
  setIsDemoMode,
  onRefresh,
  isRefreshing,
  refreshInterval,
  setRefreshInterval,
  anomalies = [],
  notifications = [],
  onOpenAddMonitor,
  onOpenQuickProbe,
  summary = []
}) {
  const [isBellOpen, setIsBellOpen] = useState(false);
  const bellRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) {
        setIsBellOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const totalEndpoints = summary.length;
const degradedCount = summary.filter(s =>
  s.is_up !== undefined ? !s.is_up : s.uptime_percentage < 90
).length;
const healthyCount = totalEndpoints - degradedCount;
  const isFleetDegraded = totalEndpoints > 0 && healthyCount < degradedCount;

  // Combine Slack-mirrored notifications + live predictive anomalies
  const combinedAlerts = [
    ...anomalies.map((a, i) => ({
      id: `anom-${i}-${a.url}`,
      type: 'ANOMALY',
      severity: 'warning',
      title: `Latency Spike: ${a.url}`,
      message: `${a.current_latency}ms observed (baseline ${a.normal_latency}ms, Z=${a.z_score})`,
      timestamp: 'Predictive Z-Score',
      channel: 'CloudPulse AI'
    })),
    ...notifications
  ];

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
        {/* Multi-Endpoint Fleet Health Pill */}
        <div className={`system-health-pill ${isFleetDegraded ? 'health-warning' : 'health-ok'}`}>
          {isFleetDegraded ? <AlertTriangle size={13} /> : <CheckCircle2 size={13} />}
          <span>
            {totalEndpoints > 0
              ? `${healthyCount}/${totalEndpoints} Endpoints Operational`
              : 'Systems Operational'}
          </span>
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

        {/* Alert Bell + Slack Notifications Popover */}
        <div ref={bellRef} style={{ position: 'relative' }}>
          <button
            type="button"
            className="alert-bell-wrap"
            onClick={() => setIsBellOpen(prev => !prev)}
            title={`${combinedAlerts.length} Slack & Telemetry Alerts`}
            style={{ cursor: 'pointer', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <Bell size={16} />
            {combinedAlerts.length > 0 && (
              <span className="bell-badge">{combinedAlerts.length}</span>
            )}
          </button>

          {isBellOpen && (
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: 'calc(100% + 10px)',
                width: '360px',
                maxHeight: '420px',
                overflowY: 'auto',
                background: '#0f172a',
                border: '1px solid rgba(148, 163, 184, 0.2)',
                borderRadius: '12px',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.55)',
                zIndex: 1000,
                padding: '12px'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingBottom: '8px',
                  marginBottom: '8px',
                  borderBottom: '1px solid rgba(148, 163, 184, 0.15)'
                }}
              >
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#f8fafc', letterSpacing: '0.03em' }}>
                  SLACK &amp; TELEMETRY ALERTS ({combinedAlerts.length})
                </span>
                <span style={{ fontSize: '11px', color: '#38bdf8' }}>Live Sync</span>
              </div>

              {combinedAlerts.length === 0 ? (
                <div style={{ padding: '20px 8px', textAlign: 'center', color: '#94a3b8', fontSize: '12px' }}>
                  No recent outage or SSL alerts triggered.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {combinedAlerts.map((item) => {
                    const isCritical = item.severity === 'critical';
                    const isResolved = item.severity === 'resolved';
                    const badgeColor = isCritical ? '#ef4444' : isResolved ? '#10b981' : '#f59e0b';

                    return (
                      <div
                        key={item.id}
                        style={{
                          padding: '10px',
                          borderRadius: '8px',
                          background: 'rgba(30, 41, 59, 0.65)',
                          borderLeft: `3px solid ${badgeColor}`
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <span style={{ fontSize: '12px', fontWeight: 600, color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            {isCritical ? <ShieldAlert size={13} color={badgeColor} /> : <Radio size={13} color={badgeColor} />}
                            {item.title}
                          </span>
                        </div>
                        <div style={{ fontSize: '11px', color: '#cbd5e1', marginBottom: '6px' }}>
                          {item.message}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#94a3b8' }}>
                          <span>{item.channel}</span>
                          <span>{item.timestamp ? item.timestamp.slice(0, 19).replace('T', ' ') : ''}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}