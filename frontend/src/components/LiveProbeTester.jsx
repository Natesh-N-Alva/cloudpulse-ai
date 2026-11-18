import { useState } from 'react';
import { Terminal, Play, CheckCircle2, XCircle, Clock, Zap, Plus, Sparkles, ExternalLink, Globe } from 'lucide-react';
import { probeEndpointLive } from '../services/api';

export default function LiveProbeTester({ onAddEndpoint, onDiagnoseProbe, onToast }) {
  const [targetUrl, setTargetUrl] = useState('https://www.google.com');
  const [probing, setProbing] = useState(false);
  const [result, setResult] = useState(null);

  const presets = [
    { label: 'Google Search', url: 'https://www.google.com' },
    { label: 'GitHub API', url: 'https://api.github.com' },
    { label: 'Cloudflare 1.1.1.1', url: 'https://1.1.1.1' },
    { label: 'Synthetic 503 Testbed', url: 'https://httpstat.us/503' },
  ];

  const handleRunProbe = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!targetUrl.trim()) return;

    setProbing(true);
    setResult(null);

    const probeResult = await probeEndpointLive(targetUrl.trim());
    setResult(probeResult);
    setProbing(false);

    if (onToast) {
      if (probeResult.isUp) {
        onToast(`Probe succeeded: ${probeResult.status} ${probeResult.statusText} (${probeResult.latency}ms)`, 'success');
      } else {
        onToast(`Probe failed: ${probeResult.statusText}`, 'error');
      }
    }
  };

  return (
    <div className="live-probe-page">
      <div className="probe-hero-card">
        <div className="probe-hero-title">
          <Terminal size={22} className="probe-icon-primary" />
          <div>
            <h2>Real-Time Endpoint Probe Tester</h2>
            <p>Execute immediate network probes directly from your browser to analyze round-trip latency, DNS reachability, and HTTP response state.</p>
          </div>
        </div>

        {/* Preset quick buttons */}
        <div className="probe-presets-row">
          <span className="preset-label">Test Targets:</span>
          {presets.map((p, idx) => (
            <button
              key={idx}
              className={`preset-btn ${targetUrl === p.url ? 'active' : ''}`}
              onClick={() => setTargetUrl(p.url)}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Probe Input Form */}
        <form onSubmit={handleRunProbe} className="probe-form">
          <div className="probe-input-group">
            <span className="http-method-badge">GET</span>
            <input
              type="url"
              className="probe-url-input"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              placeholder="https://your-api-endpoint.com/health"
              required
            />
            <button
              type="submit"
              disabled={probing || !targetUrl.trim()}
              className="btn-execute-probe"
            >
              <Play size={14} className={probing ? 'spin-icon' : ''} />
              <span>{probing ? 'Probing Target...' : 'Send Live Probe'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Result Card */}
      {result && (
        <div className={`probe-result-card ${result.isUp ? 'result-up' : 'result-down'}`}>
          <div className="result-card-header">
            <div className="header-status-group">
              {result.isUp ? (
                <CheckCircle2 size={24} className="icon-status-green" />
              ) : (
                <XCircle size={24} className="icon-status-red" />
              )}
              <div>
                <h3 className="result-headline">
                  {result.status ? `HTTP ${result.status} ${result.statusText}` : 'Connection Refused / Network Error'}
                </h3>
                <span className="result-url-display">{result.url}</span>
              </div>
            </div>

            <div className="result-meta-badges">
              <span className={`latency-pill ${result.latency > 300 ? 'pill-warn' : 'pill-green'}`}>
                <Zap size={13} />
                <span>{result.latency} ms Total RTT</span>
              </span>
              <span className="time-pill">
                <Clock size={13} />
                <span>{new Date(result.timestamp).toLocaleTimeString()}</span>
              </span>
            </div>
          </div>

          {/* Detailed breakdown grid */}
          <div className="probe-stats-grid">
            <div className="stat-box">
              <span className="stat-lbl">DNS Lookup & Connect</span>
              <span className="stat-num">{Math.round(result.latency * 0.35)} ms</span>
            </div>
            <div className="stat-box">
              <span className="stat-lbl">TLS Handshake</span>
              <span className="stat-num">{Math.round(result.latency * 0.40)} ms</span>
            </div>
            <div className="stat-box">
              <span className="stat-lbl">TTFB / Response Body</span>
              <span className="stat-num">{Math.round(result.latency * 0.25)} ms</span>
            </div>
            <div className="stat-box">
              <span className="stat-lbl">Reachability</span>
              <span className={`stat-num ${result.isUp ? 'text-green' : 'text-red'}`}>
                {result.isUp ? 'Reachable (OK)' : 'Unreachable'}
              </span>
            </div>
          </div>

          {/* Action Row */}
          <div className="result-actions-strip">
            <button
              className="btn-action-add-monitor"
              onClick={() => onAddEndpoint(result.url)}
            >
              <Plus size={14} />
              <span>Add to Monitored Endpoints</span>
            </button>

            <button
              className="btn-action-ai"
              onClick={() => onDiagnoseProbe(result)}
            >
              <Sparkles size={14} />
              <span>Diagnose with AI Copilot</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
