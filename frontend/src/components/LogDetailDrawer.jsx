import { useState } from 'react';
import { X, Copy, Check, Terminal, FileCode, Sparkles, Server, Globe } from 'lucide-react';

export default function LogDetailDrawer({ log, onClose, onDiagnoseLog, onToast }) {
  const [copiedType, setCopiedType] = useState(null);

  if (!log) return null;

  const curlCommand = `curl -Iv -w "DNS: %{time_namelookup}s | Connect: %{time_connect}s | Total: %{time_total}s\\n" "${log.WebsiteURL}"`;

  const copyText = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    if (onToast) onToast('Copied to clipboard!', 'success');
    setTimeout(() => setCopiedType(null), 2000);
  };

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <div className="drawer-panel" onClick={(e) => e.stopPropagation()}>
        {/* Drawer Header */}
        <div className="drawer-header">
          <div className="drawer-title-block">
            <span className="drawer-subtitle">TELEMETRY EVENT INSPECTOR</span>
            <h3 className="drawer-title">{log.EndpointName || log.WebsiteURL}</h3>
          </div>
          <button className="drawer-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="drawer-body">
          {/* Status highlight strip */}
          <div className={`drawer-status-strip ${log.IsUp ? 'status-up' : 'status-down'}`}>
            <div className="strip-col">
              <span className="strip-lbl">HTTP Status</span>
              <span className="strip-val">{log.StatusCode} {log.IsUp ? 'OK' : 'Error'}</span>
            </div>
            <div className="strip-col">
              <span className="strip-lbl">Response Time</span>
              <span className="strip-val">{log.LatencyMS} ms</span>
            </div>
            <div className="strip-col">
              <span className="strip-lbl">Mesh Region</span>
              <span className="strip-val">{log.Region || 'ap-south-1'}</span>
            </div>
            <div className="strip-col">
              <span className="strip-lbl">State</span>
              <span className="strip-val">{log.IsUp ? 'UP' : 'DOWN'}</span>
            </div>
          </div>

          {/* Quick AI Action Banner */}
          <div className="drawer-ai-action-card">
            <div className="ai-action-text">
              <h4>Analyze this incident event with CloudPulse AI</h4>
              <p>Generates root-cause hypothesis and AWS CLI remediation commands based on DynamoDB logs.</p>
            </div>
            <button
              className="btn-drawer-diagnose"
              onClick={() => {
                onClose();
                onDiagnoseLog(log);
              }}
            >
              <Sparkles size={14} />
              <span>Diagnose Incident</span>
            </button>
          </div>

          {/* Target Metadata Table */}
          <div className="drawer-section">
            <h4 className="section-label">PROBE METADATA</h4>
            <div className="meta-keyvalue-grid">
              <div className="meta-pair">
                <span className="meta-k">Endpoint URL</span>
                <span className="meta-v mono">{log.WebsiteURL}</span>
              </div>
              <div className="meta-pair">
                <span className="meta-k">Timestamp (UTC/IST)</span>
                <span className="meta-v mono">{log.Timestamp}</span>
              </div>
              <div className="meta-pair">
                <span className="meta-k">Request / Trace ID</span>
                <span className="meta-v mono">{log.RequestId || 'req_live_event'}</span>
              </div>
              <div className="meta-pair">
                <span className="meta-k">Error Reason</span>
                <span className={`meta-v ${log.ErrorMessage !== 'None' ? 'text-red' : ''}`}>
                  {log.ErrorMessage || 'None (Healthy response)'}
                </span>
              </div>
            </div>
          </div>

          {/* Curl Reproduction Command */}
          <div className="drawer-section">
            <div className="section-header-row">
              <div className="flex-align gap-sm">
                <Terminal size={14} />
                <h4 className="section-label">CLI REPRODUCTION COMMAND</h4>
              </div>
              <button
                className="btn-drawer-copy"
                onClick={() => copyText(curlCommand, 'curl')}
              >
                {copiedType === 'curl' ? <Check size={12} className="text-green" /> : <Copy size={12} />}
                <span>{copiedType === 'curl' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <pre className="drawer-code-block">
              <code>{curlCommand}</code>
            </pre>
          </div>

          {/* Raw JSON Payload */}
          <div className="drawer-section">
            <div className="section-header-row">
              <div className="flex-align gap-sm">
                <FileCode size={14} />
                <h4 className="section-label">RAW DYNAMODB LOG RECORD</h4>
              </div>
              <button
                className="btn-drawer-copy"
                onClick={() => copyText(JSON.stringify(log, null, 2), 'json')}
              >
                {copiedType === 'json' ? <Check size={12} className="text-green" /> : <Copy size={12} />}
                <span>{copiedType === 'json' ? 'Copied' : 'Copy JSON'}</span>
              </button>
            </div>
            <pre className="drawer-code-block json-block">
              <code>{JSON.stringify(log, null, 2)}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
