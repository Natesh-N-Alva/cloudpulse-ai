import { Globe, ExternalLink, Activity, CheckCircle2, XCircle, Sparkles } from 'lucide-react';

export default function EndpointsOverview({ summary, onSelectEndpoint, onDiagnoseEndpoint }) {
  if (!summary || summary.length === 0) {
    return (
      <div className="endpoints-empty">
        <Globe size={24} />
        <p>No endpoint metrics available. Waiting for EventBridge probe telemetry...</p>
      </div>
    );
  }

  return (
    <div className="endpoints-section">
      <div className="section-header">
        <div>
          <h2 className="section-title">Monitored Service Endpoints</h2>
          <p className="section-subtitle">Real-time health statistics aggregated from DynamoDB telemetry</p>
        </div>
      </div>

      <div className="endpoints-grid">
        {summary.map((item, idx) => {
          const isHealthy = item.uptime_percentage >= 90;
          const isFailing = item.uptime_percentage === 0;

          // Latency color tier
          let latencyColor = 'latency-green';
          if (item.avg_latency_ms > 400) latencyColor = 'latency-red';
          else if (item.avg_latency_ms > 150) latencyColor = 'latency-yellow';

          return (
            <div key={idx} className={`endpoint-card ${isFailing ? 'down' : isHealthy ? 'up' : 'degraded'}`}>
              <div className="endpoint-header">
                <div className="endpoint-icon-wrap">
                  <Globe size={18} />
                </div>
                <div className="endpoint-url-wrap">
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="endpoint-url"
                    title={item.url}
                  >
                    {item.url}
                    <ExternalLink size={12} className="link-icon" />
                  </a>
                </div>
                <div className={`endpoint-badge ${isFailing ? 'badge-down' : isHealthy ? 'badge-up' : 'badge-degraded'}`}>
                  {isFailing ? <XCircle size={13} /> : <CheckCircle2 size={13} />}
                  <span>{isFailing ? 'DOWN' : isHealthy ? 'UP' : 'DEGRADED'}</span>
                </div>
              </div>

              {/* Uptime progress bar */}
              <div className="uptime-bar-wrap">
                <div className="uptime-labels">
                  <span className="uptime-label">Uptime Availability</span>
                  <span className="uptime-val">{item.uptime_percentage}%</span>
                </div>
                <div className="progress-track">
                  <div
                    className={`progress-fill ${isFailing ? 'fill-red' : isHealthy ? 'fill-green' : 'fill-yellow'}`}
                    style={{ width: `${Math.max(item.uptime_percentage, 5)}%` }}
                  ></div>
                </div>
              </div>

              {/* Endpoint stats row */}
              <div className="endpoint-metrics">
                <div className="metric-box">
                  <span className="metric-label">Avg Response</span>
                  <span className={`metric-val ${latencyColor}`}>
                    {item.avg_latency_ms} <span className="metric-unit">ms</span>
                  </span>
                </div>
                <div className="metric-box">
                  <span className="metric-label">Probes</span>
                  <span className="metric-val">{item.total_checks}</span>
                </div>
                <div className="metric-box">
                  <span className="metric-label">Interval</span>
                  <span className="metric-val">5m</span>
                </div>
              </div>

              {/* Endpoint Actions */}
              <div className="endpoint-actions">
                <button
                  className="btn-endpoint-filter"
                  onClick={() => onSelectEndpoint(item.url)}
                  title="Filter log history for this endpoint"
                >
                  <Activity size={13} />
                  <span>Filter Logs</span>
                </button>
                <button
                  className="btn-endpoint-diagnose"
                  onClick={() => onDiagnoseEndpoint(item.url)}
                  title="Run AI Incident Diagnostic for this service"
                >
                  <Sparkles size={13} />
                  <span>AI Diagnose</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
