import { useState } from 'react';
import { X, Plus, Globe, Layers, Clock, ShieldCheck } from 'lucide-react';

export default function AddMonitorModal({ isOpen, onClose, onSave, onToast }) {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [group, setGroup] = useState('Production Core');
  const [expectedCode, setExpectedCode] = useState('200');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!url.trim()) return;

    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = 'https://' + formattedUrl;
    }

    onSave({
      name: name.trim() || formattedUrl,
      url: formattedUrl,
      group: group.trim() || 'General',
      expectedCode: Number(expectedCode) || 200,
      interval: '5m',
    });

    if (onToast) onToast(`Added monitor: ${name || formattedUrl}`, 'success');
    setName('');
    setUrl('');
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-wrap">
            <div className="modal-icon-glow">
              <Plus size={18} />
            </div>
            <div>
              <h3>Add New Monitor</h3>
              <p>Configure automated AWS EventBridge & Lambda health checks for this endpoint.</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label className="form-label">Monitor Friendly Name</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Payment Gateway Ingress"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Target Website / API URL</label>
            <div className="input-with-icon">
              <Globe size={15} className="input-prefix-icon" />
              <input
                type="text"
                className="form-input with-prefix"
                placeholder="https://api.example.com/health"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label">Service Group / Category</label>
              <select
                className="form-select"
                value={group}
                onChange={(e) => setGroup(e.target.value)}
              >
                <option value="Production Core">Production Core</option>
                <option value="External API">External API</option>
                <option value="Developer Core">Developer Core</option>
                <option value="Chaos Staging">Chaos Staging</option>
                <option value="Database / Microservice">Database / Microservice</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Expected HTTP Code</label>
              <input
                type="number"
                className="form-input"
                value={expectedCode}
                onChange={(e) => setExpectedCode(e.target.value)}
                placeholder="200"
              />
            </div>
          </div>

          <div className="modal-notice-box">
            <Clock size={14} className="notice-icon" />
            <span>EventBridge will trigger probes every 5 minutes. Telemetry logs will persist in DynamoDB with a 7-day TTL.</span>
          </div>

          <div className="modal-actions-row">
            <button type="button" className="btn-modal-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-modal-submit">
              <Plus size={15} />
              <span>Create Monitor</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
