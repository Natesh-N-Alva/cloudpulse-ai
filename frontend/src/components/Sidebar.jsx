import { 
  Activity, 
  LayoutDashboard, 
  Globe, 
  FileText, 
  Sparkles, 
  Terminal, 
  Sliders, 
  Cpu, 
  Server,
  Radio,
  ExternalLink
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

      {/* Cluster Details Widget */}
      <div className="sidebar-cluster-widget">
        <div className="cluster-header">
          <div className="cluster-icon-wrap">
            <Radio size={14} className="cluster-pulse-icon" />
          </div>
          <span className="cluster-title">Active Mesh</span>
        </div>
        <div className="cluster-meta-row">
          <span className="meta-label">Region</span>
          <span className="meta-val">ap-south-1</span>
        </div>
        <div className="cluster-meta-row">
          <span className="meta-label">Probe Engine</span>
          <span className="meta-val">AWS EventBridge</span>
        </div>
        <div className="cluster-meta-row">
          <span className="meta-label">Telemetry TTL</span>
          <span className="meta-val">7 Days</span>
        </div>
        <div className="cluster-status-line">
          <span className={`status-dot ${backendOnline ? 'online' : 'demo'}`}></span>
          <span className="status-label">
            {backendOnline ? 'FastAPI & DynamoDB Live' : 'Simulation Mode'}
          </span>
        </div>
      </div>

      {/* User / SRE Profile Footer */}
      <div className="sidebar-footer">
        <div className="user-profile">
          <div className="user-avatar">
            <span>SRE</span>
          </div>
          <div className="user-details">
            <span className="user-name">DevOps Operator</span>
            <span className="user-role">CloudPulse Admin</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
