import { useState } from 'react';
import { 
  Globe, 
  ExternalLink, 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  Play, 
  ShieldCheck, 
  Plus, 
  Search, 
  Clock, 
  Activity,
  Layers,
  Radio
} from 'lucide-react';

export default function MonitorsView({
  summary,
  onSelectEndpoint,
  onDiagnoseEndpoint,
  onOpenAddMonitor,
  onPingMonitor
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('ALL');
  const [hoveredTick, setHoveredTick] = useState(null);
  const [pingingUrl, setPingingUrl] = useState(null);

  // Filter monitors
  const groups = ['ALL', ...new Set(summary.map(s => s.group || 'Default'))];

  const filteredMonitors = summary.filter((m) => {
    const matchesGroup = selectedGroup === 'ALL' || (m.group || 'Default') === selectedGroup;
    const matchesSearch = !searchTerm.trim() || 
      (m.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
      (m.url || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesGroup && matchesSearch;
  });

  const handlePing = async (url) => {
    setPingingUrl(url);
    await onPingMonitor(url);
    setPingingUrl(null);
  };

  return (
    <div className="monitors-page">
      {/* Action Toolbar */}
      <div className="monitors-toolbar">
        <div className="toolbar-left">
          <div className="search-box">
            <Search size={15} className="search-box-icon" />
            <input
              type="text"
              placeholder="Search monitors by name or URL..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input-field"
            />
            {searchTerm && (
              <button className="clear-search-btn" onClick={() => setSearchTerm('')}>✕</button>
            )}
          </div>

          <div className="group-filter-pills">
            {groups.map((grp) => (
              <button
                key={grp}
                className={`group-pill ${selectedGroup === grp ? 'active' : ''}`}
                onClick={() => setSelectedGroup(grp)}
              >
                {grp}
              </button>
            ))}
          </div>
        </div>

        <button className="btn-add-monitor" onClick={onOpenAddMonitor}>
          <Plus size={15} />
          <span>Add New Monitor</span>
        </button>
      </div>

      {/* Monitors Cards Stack */}
      <div className="monitors-cards-stack">
        {filteredMonitors.length === 0 ? (
          <div className="monitors-empty-card">
            <Globe size={32} className="empty-icon" />
            <h3>No Monitors Found</h3>
            <p>Try adjusting your search query or group filter, or create a new monitor.</p>
            <button className="btn-add-monitor" onClick={onOpenAddMonitor}>
              <Plus size={15} />
              <span>Add Monitor</span>
            </button>
          </div>
        ) : (
          filteredMonitors.map((item, idx) => {
            const isFailing = item.uptime_percentage === 0;
            const isHealthy = item.uptime_percentage >= 90;
            const isPinging = pingingUrl === item.url;

            let latencyClass = 'lat-fast';
            if (item.avg_latency_ms > 350) latencyClass = 'lat-critical';
            else if (item.avg_latency_ms > 120) latencyClass = 'lat-moderate';

            const history = item.history || [];

            return (
              <div key={idx} className={`monitor-card ${isFailing ? 'monitor-failing' : ''}`}>
                {/* Card Top Row */}
                <div className="monitor-top-row">
                  <div className="monitor-title-block">
                    <div className="monitor-avatar">
                      <Globe size={18} />
                    </div>
                    <div>
                      <div className="monitor-name-line">
                        <h3 className="monitor-name">{item.name || item.url}</h3>
                        <span className="monitor-group-tag">{item.group || 'Default'}</span>
                      </div>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="monitor-url-link"
                      >
                        <span>{item.url}</span>
                        <ExternalLink size={11} />
                      </a>
                    </div>
                  </div>

                  {/* Status & Actions */}
                  <div className="monitor-top-actions">
                    <div className={`status-badge-saas ${isFailing ? 'badge-down' : isHealthy ? 'badge-up' : 'badge-warn'}`}>
                      <span className="status-ping-dot"></span>
                      <span>{isFailing ? 'DOWN (503)' : isHealthy ? 'OPERATIONAL' : 'DEGRADED'}</span>
                    </div>

                    <button
                      className={`btn-monitor-ping ${isPinging ? 'pinging' : ''}`}
                      onClick={() => handlePing(item.url)}
                      disabled={isPinging}
                      title="Run a real-time probe ping right now"
                    >
                      <Play size={12} />
                      <span>{isPinging ? 'Pinging...' : 'Ping Now'}</span>
                    </button>

                    <button
                      className="btn-monitor-diagnose"
                      onClick={() => onDiagnoseEndpoint(item.url)}
                      title="Analyze this monitor with CloudPulse AI"
                    >
                      <Sparkles size={13} />
                      <span>AI Diagnose</span>
                    </button>
                  </div>
                </div>

                {/* 30-Tick Uptime Timeline (BetterStack Style) */}
                <div className="uptime-timeline-section">
                  <div className="timeline-header">
                    <span className="timeline-title">Recent Probes (Last 30 iterations)</span>
                    <span className="timeline-val">{item.uptime_percentage}% 24h Availability</span>
                  </div>

                  <div className="timeline-bars-track">
                    {history.map((tick, tIdx) => {
                      const isTickDown = tick.status === 'DOWN';
                      const isTickSpike = tick.anomaly || tick.latency > 500;
                      let tickClass = 'tick-up';
                      if (isTickDown) tickClass = 'tick-down';
                      else if (isTickSpike) tickClass = 'tick-warn';

                      return (
                        <div
                          key={tIdx}
                          className={`timeline-tick ${tickClass}`}
                          onMouseEnter={() => setHoveredTick({ ...tick, monitorUrl: item.url, index: tIdx })}
                          onMouseLeave={() => setHoveredTick(null)}
                        ></div>
                      );
                    })}
                  </div>

                  <div className="timeline-labels-row">
                    <span>2.5 hours ago</span>
                    <span>100% uptime baseline</span>
                    <span>Just now</span>
                  </div>

                  {/* Tooltip for hovered tick */}
                  {hoveredTick && hoveredTick.monitorUrl === item.url && (
                    <div className="tick-tooltip">
                      <div className="tooltip-line">
                        <strong>Time:</strong> {hoveredTick.time}
                      </div>
                      <div className="tooltip-line">
                        <strong>Status:</strong>{' '}
                        <span className={hoveredTick.status === 'UP' ? 'text-green' : 'text-red'}>
                          {hoveredTick.code} {hoveredTick.status}
                        </span>
                      </div>
                      <div className="tooltip-line">
                        <strong>Response:</strong> {hoveredTick.latency}ms
                      </div>
                    </div>
                  )}
                </div>

                {/* Monitor Metrics Strip */}
                <div className="monitor-metrics-strip">
                  <div className="metric-cell">
                    <span className="cell-label">Current Latency</span>
                    <span className={`cell-val ${latencyClass}`}>{item.avg_latency_ms} ms</span>
                  </div>

                  <div className="metric-cell">
                    <span className="cell-label">Total Checks</span>
                    <span className="cell-val">{item.total_checks} probes</span>
                  </div>

                  <div className="metric-cell">
                    <span className="cell-label">Probe Interval</span>
                    <span className="cell-val">Every 5 mins</span>
                  </div>

                  <div className="metric-cell">
                    <span className="cell-label">TLS / SSL</span>
                    <span className="cell-val text-green flex-align">
                      <ShieldCheck size={13} />
                      <span>{item.ssl_status || 'Valid'}</span>
                    </span>
                  </div>

                  <div className="metric-cell-btn">
                    <button
                      className="btn-view-logs-text"
                      onClick={() => onSelectEndpoint(item.url)}
                    >
                      <span>View Log History</span>
                      <Activity size={12} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
