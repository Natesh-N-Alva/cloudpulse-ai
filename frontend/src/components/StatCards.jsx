import { ShieldCheck, AlertTriangle, Zap, TrendingUp, Radio } from 'lucide-react';

export default function StatCards({ summary, anomalies }) {
  // Compute overall uptime
  const totalChecks = summary.reduce((acc, curr) => acc + (curr.total_checks || 0), 0);
  const upChecks = summary.reduce((acc, curr) => {
    const checks = curr.total_checks || 0;
    const uptimePct = curr.uptime_percentage || 0;
    return acc + Math.round((uptimePct / 100) * checks);
  }, 0);

  const overallUptime = totalChecks > 0 ? ((upChecks / totalChecks) * 100).toFixed(1) : '100.0';
  
  // Compute weighted average latency
  const avgLatency = summary.length > 0 
    ? Math.round(summary.reduce((acc, curr) => acc + (curr.avg_latency_ms || 0), 0) / summary.length)
    : 0;

  const hasOutages = summary.some(s => s.uptime_percentage < 90);
  const anomalyCount = anomalies.length;

  return (
    <div className="stat-cards-grid">
      {/* 1. System Health Status */}
      <div className="stat-card">
        <div className="stat-header">
          <span className="stat-title">System Status</span>
          <div className={`stat-icon-wrap ${hasOutages ? 'warning' : 'healthy'}`}>
            {hasOutages ? <AlertTriangle size={18} /> : <ShieldCheck size={18} />}
          </div>
        </div>
        <div className="stat-value-wrap">
          <span className={`stat-value ${hasOutages ? 'color-warning' : 'color-healthy'}`}>
            {hasOutages ? 'Degraded' : 'Operational'}
          </span>
          <span className="stat-pill">{overallUptime}% Uptime</span>
        </div>
        <p className="stat-footer">
          {hasOutages ? '1 or more target endpoints failing' : 'All monitored endpoints healthy'}
        </p>
      </div>

      {/* 2. Active Probes */}
      <div className="stat-card">
        <div className="stat-header">
          <span className="stat-title">Monitored Endpoints</span>
          <div className="stat-icon-wrap info">
            <Radio size={18} />
          </div>
        </div>
        <div className="stat-value-wrap">
          <span className="stat-value">{summary.length || 3}</span>
          <span className="stat-pill info">5m Interval</span>
        </div>
        <p className="stat-footer">
          EventBridge & Lambda automated probes
        </p>
      </div>

      {/* 3. Average Latency */}
      <div className="stat-card">
        <div className="stat-header">
          <span className="stat-title">Average Latency</span>
          <div className={`stat-icon-wrap ${avgLatency > 300 ? 'warning' : 'healthy'}`}>
            <Zap size={18} />
          </div>
        </div>
        <div className="stat-value-wrap">
          <span className="stat-value">{avgLatency} <span className="stat-unit">ms</span></span>
          <span className={`stat-pill ${avgLatency < 150 ? 'healthy' : 'warning'}`}>
            {avgLatency < 150 ? 'Fast' : 'Moderate'}
          </span>
        </div>
        <p className="stat-footer">
          Rolling average across all endpoints
        </p>
      </div>

      {/* 4. Active Latency Anomalies */}
      <div className="stat-card">
        <div className="stat-header">
          <span className="stat-title">Predictive Anomalies</span>
          <div className={`stat-icon-wrap ${anomalyCount > 0 ? 'danger' : 'healthy'}`}>
            <TrendingUp size={18} />
          </div>
        </div>
        <div className="stat-value-wrap">
          <span className={`stat-value ${anomalyCount > 0 ? 'color-danger' : 'color-healthy'}`}>
            {anomalyCount}
          </span>
          <span className={`stat-pill ${anomalyCount > 0 ? 'danger' : 'healthy'}`}>
            Z-Score &gt; 2.5
          </span>
        </div>
        <p className="stat-footer">
          {anomalyCount > 0 ? 'Degradation detected before outage' : 'No latency spikes detected'}
        </p>
      </div>
    </div>
  );
}
