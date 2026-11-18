import { 
  Activity, 
  LayoutDashboard, 
  Globe, 
  FileText, 
  Sparkles, 
  Terminal, 
  Sliders, 
  Radio
} from 'lucide-react';

export default function Sidebar({
  activeTab,
  setActiveTab,
  monitorCount,
  logsCount,
  anomalyCount,
  backendOnline
}) {
  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'monitors', label: 'Monitors', icon: Globe, badge: monitorCount },
    { id: 'logs', label: 'Telemetry Logs', icon: FileText, badge: logsCount },
    { id: 'ai', label: 'AI Incident Copilot', icon: Sparkles, badge: anomalyCount > 0 ? `${anomalyCount} Alert` : null, badgeDanger: anomalyCount > 0 },
    { id: 'probe', label: 'Live Probe Tester', icon: Terminal },
    { id: 'architecture', label: 'System Topology', icon: Sliders },
  ];

  return (
    <aside className="app-sidebar">
      {/* Brand Header */}
      <div className="sidebar-brand">
        <div className="brand-logo-container">
          <Activity className="brand-pulse-icon" size={20} />
        </div>
        <div className="brand-info">
          <div className="brand-name-row">
            <span className="brand-name">CloudPulse</span>
            <span className="brand-accent">AI</span>
            <span className="brand-badge">SaaS</span>
          </div>
          <span className="brand-role">Cloud Telemetry Sentinel</span>
        </div>
      </div>

      {/* Navigation Group */}
      <div className="sidebar-nav-section">
        <span className="nav-section-title">OBSERVABILITY</span>
        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                className={`nav-item-btn ${isActive ? 'active' : ''}`}
                onClick={() => setActiveTab(item.id)}
              >
                <div className="nav-item-left">
                  <Icon size={17} className="nav-icon" />
                  <span className="nav-label">{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`nav-badge ${item.badgeDanger ? 'badge-danger' : ''}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Enhanced Active Mesh Telemetry Card */}
      <div
        style={{
          margin: '12px',
          padding: '14px',
          borderRadius: '14px',
          background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.9) 0%, rgba(15, 23, 42, 0.55) 100%)',
          border: '1px solid rgba(148, 163, 184, 0.14)',
          boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.04)'
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
            <Radio size={14} color="#34d399" />
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.08em',
                color: '#f1f5f9'
              }}
            >
              ACTIVE MESH
            </span>
          </div>
          <span
            style={{
              fontSize: '10px',
              fontWeight: 600,
              color: '#34d399',
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              padding: '1px 7px',
              borderRadius: '999px'
            }}
          >
            AWS
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#64748b' }}>Region</span>
            <span
              style={{
                fontFamily: 'monospace',
                fontSize: '11px',
                color: '#38bdf8',
                background: 'rgba(56, 189, 248, 0.1)',
                padding: '1px 7px',
                borderRadius: '6px'
              }}
            >
              ap-south-1
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#64748b' }}>Probe Engine</span>
            <span style={{ fontFamily: 'monospace', color: '#cbd5e1', fontSize: '11px' }}>
              EventBridge • 5m
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#64748b' }}>Retention</span>
            <span style={{ fontFamily: 'monospace', color: '#cbd5e1', fontSize: '11px' }}>
              7 Days TTL
            </span>
          </div>
        </div>

        <div
          style={{
            marginTop: '12px',
            paddingTop: '10px',
            borderTop: '1px solid rgba(148, 163, 184, 0.12)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: backendOnline ? '#10b981' : '#f59e0b',
              boxShadow: backendOnline ? '0 0 8px #10b981' : '0 0 8px #f59e0b',
              flexShrink: 0
            }}
          />
          <span style={{ fontSize: '11px', fontWeight: 500, color: '#cbd5e1' }}>
            {backendOnline ? 'FastAPI & DynamoDB Live' : 'Local Fallback Active'}
          </span>
        </div>
      </div>

      {/* Operator Profile Footer */}
      <div
        style={{
          padding: '12px 14px',
          borderTop: '1px solid rgba(148, 163, 184, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ position: 'relative' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
                color: '#042f2e',
                fontWeight: 800,
                fontSize: '11px',
                letterSpacing: '0.04em',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)'
              }}
            >
              SRE
            </div>
            <span
              style={{
                position: 'absolute',
                bottom: '-2px',
                right: '-2px',
                width: '9px',
                height: '9px',
                borderRadius: '50%',
                background: '#22c55e',
                border: '2px solid #0b1120'
              }}
            />
          </div>

          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc', lineHeight: 1.2 }}>
              User
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
              CloudPulse SRE Admin
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}