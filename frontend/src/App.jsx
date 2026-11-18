import { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import TopNav from './components/TopNav';
import ToastContainer from './components/ToastContainer';
import StatCards from './components/StatCards';
import AnomalyAlertBanner from './components/AnomalyAlertBanner';
import LatencyChart from './components/LatencyChart';
import MonitorsView from './components/MonitorsView';
import LogsExplorer from './components/LogsExplorer';
import LogDetailDrawer from './components/LogDetailDrawer';
import AiCopilotView from './components/AiCopilotView';
import LiveProbeTester from './components/LiveProbeTester';
import ArchitectureView from './components/ArchitectureView';
import AddMonitorModal from './components/AddMonitorModal';

import {
  fetchMonitoringLogs,
  fetchMetricsSummary,
  fetchAnomalies,
  fetchNotifications,
  diagnoseIncident,
  checkBackendStatus,
  probeEndpointLive,
  getSavedEndpoints,
  saveEndpoints,
  generateUptimeHistory
} from './services/api';

import { Globe, ArrowRight, Sparkles } from 'lucide-react';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [logs, setLogs] = useState([]);
  const [summary, setSummary] = useState([]);
  const [anomalies, setAnomalies] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const [backendOnline, setBackendOnline] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(30000);
  const [selectedEndpoint, setSelectedEndpoint] = useState('');

  // Modals & Drawers
  const [isAddMonitorOpen, setIsAddMonitorOpen] = useState(false);
  const [activeDetailLog, setActiveDetailLog] = useState(null);

  // Toasts
  const [toasts, setToasts] = useState([]);

  // AI Copilot state
  const [query, setQuery] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    {
      sender: 'assistant',
      time: 'Autonomous SRE Agent Active',
      text: `👋 **CloudPulse AI Copilot Initialized.**
I am continuously analyzing multi-endpoint health telemetry from AWS DynamoDB.

**What I can do for you:**
- 🔍 **Root-Cause Diagnostics:** Correlate 5xx failures and HTTP errors with FAISS semantic retrieval.
- 📈 **Predictive Anomaly Analysis:** Review Z-score (>2.5σ) latency outliers before outages spread.
- 🛠️ **Remediation Runbooks:** Generate copy-paste AWS CLI, Kubernetes, and Linux shell commands.
- 📝 **Incident Post-Mortems:** Compile formal incident summaries for your engineering team.

*Select a quick prompt above or ask a diagnostic question below.*`
    }
  ]);

  const addToast = (message, type = 'success', title = null) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type, title }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Telemetry Fetcher
  const reloadData = useCallback(async (showToast = false) => {
    setIsRefreshing(true);
    try {
      const status = await checkBackendStatus();
      setBackendOnline(status.online);

      const useMock = !status.online || isDemoMode;
      const [fetchedLogs, fetchedSummary, fetchedAnomalies, fetchedNotifications] = await Promise.all([
        fetchMonitoringLogs(useMock),
        fetchMetricsSummary(useMock),
        fetchAnomalies(useMock),
        fetchNotifications(useMock)
      ]);

      setLogs(fetchedLogs);
      setSummary(fetchedSummary);
      setAnomalies(fetchedAnomalies);
      setNotifications(fetchedNotifications);

      if (showToast) {
        addToast('Telemetry refreshed from DynamoDB logs.', 'success');
      }
    } catch (err) {
      console.error('Failed to update telemetry:', err);
      addToast('Error refreshing telemetry.', 'error');
    } finally {
      setIsRefreshing(false);
    }
  }, [isDemoMode]);

  // Initial load
  useEffect(() => {
    let isCancelled = false;

    const init = async () => {
      try {
        const status = await checkBackendStatus();
        if (isCancelled) return;
        setBackendOnline(status.online);

        const useMock = !status.online || isDemoMode;
        const [fetchedLogs, fetchedSummary, fetchedAnomalies, fetchedNotifications] = await Promise.all([
          fetchMonitoringLogs(useMock),
          fetchMetricsSummary(useMock),
          fetchAnomalies(useMock),
          fetchNotifications(useMock)
        ]);

        if (isCancelled) return;
        setLogs(fetchedLogs);
        setSummary(fetchedSummary);
        setAnomalies(fetchedAnomalies);
        setNotifications(fetchedNotifications);
      } catch (err) {
        if (!isCancelled) console.error('Initial telemetry error:', err);
      }
    };

    init();
    return () => { isCancelled = true; };
  }, [isDemoMode]);

  // Polling Interval
  useEffect(() => {
    if (!refreshInterval || refreshInterval <= 0) return;
    const interval = setInterval(() => {
      reloadData(false);
    }, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval, reloadData]);

  // AI Diagnostic Executor
  const executeDiagnosis = async (promptQuery) => {
    const q = promptQuery || query;
    if (!q || !q.trim()) return;

    const userMsg = {
      sender: 'user',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: q
    };

    setChatMessages(prev => [...prev, userMsg]);
    setQuery('');
    setAiLoading(true);

    try {
      const response = await diagnoseIncident(q, isDemoMode || !backendOnline);
      const assistantMsg = {
        sender: 'assistant',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: response
      };
      setChatMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      setChatMessages(prev => [
        ...prev,
        {
          sender: 'assistant',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: `⚠️ Diagnostic Engine Error: ${err.message}`
        }
      ]);
    } finally {
      setAiLoading(false);
    }
  };

  const handleAiSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    executeDiagnosis(query);
  };

  // Actions from various components
  const handleDiagnoseAnomaly = (anomaly) => {
    const prompt = `Diagnose latency spike for ${anomaly.url}. Normal baseline is ~${anomaly.normal_latency}ms, but observed ${anomaly.current_latency}ms with Z-Score of ${anomaly.z_score}. Provide root-cause hypothesis and AWS remediation CLI commands.`;
    setActiveTab('ai');
    executeDiagnosis(prompt);
  };

  const handleDiagnoseEndpoint = (url) => {
    const prompt = `Analyze recent telemetry for ${url}. Identify uptime reliability, latency trends, and recommend monitoring alert thresholds.`;
    setActiveTab('ai');
    executeDiagnosis(prompt);
  };

  const handleDiagnoseLog = (log) => {
    const prompt = `Analyze failure event for ${log.WebsiteURL}: Status ${log.StatusCode}, Latency ${log.LatencyMS}ms, Error: "${log.ErrorMessage}". Generate immediate DevOps troubleshooting runbook.`;
    setActiveTab('ai');
    executeDiagnosis(prompt);
  };

  const handleDiagnoseProbe = (probeResult) => {
    const prompt = `Analyze live probe result for ${probeResult.url}: Status ${probeResult.status} (${probeResult.statusText}), Total Latency: ${probeResult.latency}ms. Provide connectivity guidance.`;
    setActiveTab('ai');
    executeDiagnosis(prompt);
  };

  // Monitor management
  const handleAddMonitor = (newMonitor) => {
    const current = getSavedEndpoints();
    const updated = [newMonitor, ...current];
    saveEndpoints(updated);

    const newSummaryItem = {
      url: newMonitor.url,
      name: newMonitor.name,
      group: newMonitor.group,
      is_up: true,
      uptime_percentage: 100.0,
      avg_latency_ms: 45.0,
      total_checks: 1,
      history: generateUptimeHistory(newMonitor.url),
      ssl_status: 'Valid (Verified TLS)',
      last_check: 'Just now',
    };
    setSummary(prev => [newSummaryItem, ...prev]);
    addToast(`Monitor ${newMonitor.name} registered.`, 'success');
  };

  // Live Ping from Monitor Card
  const handlePingMonitor = async (url) => {
    const res = await probeEndpointLive(url);
    if (res.isUp) {
      addToast(`Ping to ${url}: ${res.status} OK (${res.latency}ms)`, 'success');
    } else {
      addToast(`Ping to ${url} failed: ${res.statusText}`, 'error');
    }
  };

  const failingCount = summary.filter(s =>
    s.is_up !== undefined ? !s.is_up : s.uptime_percentage < 90
  ).length;

  return (
    <div className="saas-layout">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        monitorCount={summary.length}
        logsCount={logs.length}
        anomalyCount={anomalies.length}
        backendOnline={backendOnline}
      />

      <div className="saas-main-viewport">
        <TopNav
          activeTab={activeTab}
          isDemoMode={isDemoMode}
          setIsDemoMode={setIsDemoMode}
          onRefresh={() => reloadData(true)}
          isRefreshing={isRefreshing}
          refreshInterval={refreshInterval}
          setRefreshInterval={setRefreshInterval}
          anomalies={anomalies}
          notifications={notifications}
          onOpenAddMonitor={() => setIsAddMonitorOpen(true)}
          onOpenQuickProbe={() => setActiveTab('probe')}
          summary={summary}
        />

        <main className="saas-content-body">
          {activeTab === 'overview' && (
            <div className="view-fade-in dashboard-overview-stack">
              <StatCards summary={summary} anomalies={anomalies} />

              <AnomalyAlertBanner
                anomalies={anomalies}
                onDiagnoseAnomaly={handleDiagnoseAnomaly}
              />

              <LatencyChart logs={logs} />

              <div className="dashboard-split-panels">
                <div className="dashboard-panel">
                  <div className="panel-top-title">
                    <div className="flex-align gap-sm">
                      <Globe size={16} className="text-cyan" />
                      <h3>Active Monitors ({summary.length})</h3>
                    </div>
                    <button
                      className="btn-link-action"
                      onClick={() => setActiveTab('monitors')}
                    >
                      <span>View All Monitors</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>

                  <div className="quick-monitors-list">
                    {summary.slice(0, 3).map((item, idx) => {
                      const isDown = item.is_up !== undefined ? !item.is_up : item.uptime_percentage < 90;
                      return (
                        <div key={idx} className="quick-monitor-row">
                          <div className="qm-left">
                            <span className={`qm-dot ${isDown ? 'dot-red' : 'dot-green'}`}></span>
                            <div>
                              <div className="qm-name">{item.name || item.url}</div>
                              <div className="qm-url">{item.url}</div>
                            </div>
                          </div>
                          <div className="qm-right">
                            <span className="qm-latency">{item.avg_latency_ms} ms</span>
                            <span className={`qm-uptime ${isDown ? 'text-red' : 'text-green'}`}>
                              {isDown ? 'DOWN' : 'UP'} ({item.uptime_percentage}%)
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="dashboard-panel ai-highlight-panel">
                  <div className="panel-top-title">
                    <div className="flex-align gap-sm">
                      <Sparkles size={16} className="text-violet" />
                      <h3>CloudPulse AI Copilot</h3>
                    </div>
                    <button
                      className="btn-link-action"
                      onClick={() => setActiveTab('ai')}
                    >
                      <span>Open Console</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>

                  <div className="ai-highlight-content">
                    <p className="ai-welcome-text">
                      Autonomous SRE Sentinel analyzing real-time DynamoDB telemetry logs. Detected <strong>{anomalies.length}</strong> predictive anomaly alerts and <strong>{failingCount}</strong> failing endpoints.
                    </p>

                    <div className="ai-quick-triggers">
                      <button
                        className="btn-quick-trigger"
                        onClick={() => {
                          setActiveTab('ai');
                          executeDiagnosis('Why did httpbin.org/status/503 fail and how to fix it?');
                        }}
                      >
                        🚨 Diagnose HTTP 503 Outage
                      </button>
                      <button
                        className="btn-quick-trigger"
                        onClick={() => {
                          setActiveTab('ai');
                          executeDiagnosis('Analyze recent latency spikes and predict degradations.');
                        }}
                      >
                        📈 Analyze Latency Spikes
                      </button>
                      <button
                        className="btn-quick-trigger"
                        onClick={() => {
                          setActiveTab('ai');
                          executeDiagnosis('Generate AWS CLI runbook to restart ECS/Lambda containers.');
                        }}
                      >
                        🛠️ Generate AWS Remediation Runbook
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'monitors' && (
            <div className="view-fade-in">
              <MonitorsView
                summary={summary}
                onSelectEndpoint={(url) => {
                  setSelectedEndpoint(url);
                  setActiveTab('logs');
                }}
                onDiagnoseEndpoint={handleDiagnoseEndpoint}
                onOpenAddMonitor={() => setIsAddMonitorOpen(true)}
                onPingMonitor={handlePingMonitor}
              />
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="view-fade-in">
              <LogsExplorer
                logs={logs}
                selectedEndpoint={selectedEndpoint}
                setSelectedEndpoint={setSelectedEndpoint}
                onDiagnoseLog={handleDiagnoseLog}
                onOpenLogDetail={(log) => setActiveDetailLog(log)}
                onRefresh={() => reloadData(true)}
                isRefreshing={isRefreshing}
              />
            </div>
          )}

          {activeTab === 'ai' && (
            <div className="view-fade-in">
              <AiCopilotView
                query={query}
                setQuery={setQuery}
                onDiagnose={handleAiSubmit}
                aiLoading={aiLoading}
                chatMessages={chatMessages}
                onClearChat={() => setChatMessages([
                  {
                    sender: 'assistant',
                    time: 'Just now',
                    text: 'Conversation reset. Ready for next incident analysis or remediation runbook query.'
                  }
                ])}
                onToast={addToast}
              />
            </div>
          )}

          {activeTab === 'probe' && (
            <div className="view-fade-in">
              <LiveProbeTester
                onAddEndpoint={(url) => {
                  handleAddMonitor({
                    url,
                    name: url.replace(/^https?:\/\//, ''),
                    group: 'Manual Probe',
                    expectedCode: 200,
                  });
                }}
                onDiagnoseProbe={handleDiagnoseProbe}
                onToast={addToast}
              />
            </div>
          )}

          {activeTab === 'architecture' && (
            <div className="view-fade-in">
              <ArchitectureView backendOnline={backendOnline} />
            </div>
          )}
        </main>
      </div>

      {activeDetailLog && (
        <LogDetailDrawer
          log={activeDetailLog}
          onClose={() => setActiveDetailLog(null)}
          onDiagnoseLog={handleDiagnoseLog}
          onToast={addToast}
        />
      )}

      <AddMonitorModal
        isOpen={isAddMonitorOpen}
        onClose={() => setIsAddMonitorOpen(false)}
        onSave={handleAddMonitor}
        onToast={addToast}
      />
    </div>
  );
}

export default App;