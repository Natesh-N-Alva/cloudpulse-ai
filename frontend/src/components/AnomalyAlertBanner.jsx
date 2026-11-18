import { AlertOctagon, Sparkles, ArrowRight } from 'lucide-react';

export default function AnomalyAlertBanner({ anomalies, onDiagnoseAnomaly }) {
  if (!anomalies || anomalies.length === 0) return null;

  return (
    <div className="anomaly-banner-container">
      {anomalies.map((anomaly, idx) => (
        <div key={idx} className="anomaly-card">
          <div className="anomaly-icon-wrap">
            <AlertOctagon className="anomaly-icon" size={22} />
          </div>
          <div className="anomaly-content">
            <div className="anomaly-header">
              <span className="anomaly-badge">PREDICTIVE ANOMALY DETECTED</span>
              <span className="anomaly-zscore">Z-Score: +{anomaly.z_score}σ</span>
            </div>
            <div className="anomaly-title">
              <strong>{anomaly.url}</strong>: {anomaly.warning || `Latency spiked to ${anomaly.current_latency}ms (Normal: ~${anomaly.normal_latency}ms)`}
            </div>
            <p className="anomaly-desc">
              CloudPulse rolling Z-score math detected significant deviation from historical baseline (&gt;2.5 std dev). This often signals upstream congestion or memory leaks before a total service outage.
            </p>
          </div>
          <button
            className="btn-diagnose-anomaly"
            onClick={() => onDiagnoseAnomaly(anomaly)}
            title="Send this anomaly context to CloudPulse AI RAG engine"
          >
            <Sparkles size={16} />
            <span>Diagnose with AI</span>
            <ArrowRight size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
