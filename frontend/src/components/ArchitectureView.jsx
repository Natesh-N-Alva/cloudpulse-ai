import { Server, Database, Radio, Cpu, Bell, ShieldCheck, ArrowRight, CheckCircle2, Activity } from 'lucide-react';

export default function ArchitectureView({ backendOnline }) {
  const components = [
    {
      name: 'Amazon EventBridge',
      type: 'Cloud Scheduler',
      status: 'Active (Enabled)',
      desc: 'Cron schedule executing every 5 minutes (rate(5 minutes)) to dispatch health probes across all configured target endpoints.',
      icon: Radio,
      env: 'AWS ap-south-1',
    },
    {
      name: 'AWS Lambda Probe Worker',
      type: 'Serverless Compute',
      status: 'Active (Zero-Dependency)',
      desc: 'Python 3.12 micro-worker using native urllib and boto3. Measures HTTP response code, DNS timing, and millisecond latency.',
      icon: Server,
      env: 'CloudPulse-HealthCheckWorker',
    },
    {
      name: 'Amazon DynamoDB',
      type: 'NoSQL Telemetry Store',
      status: 'Online (7-Day TTL Active)',
      desc: 'High-throughput telemetry storage. Items auto-expire after 7 days via ExpirationTime TTL attribute, preventing storage bloat.',
      icon: Database,
      env: 'CloudPulse-MonitoringLogs',
    },
    {
      name: 'CloudPulse FastAPI Backend',
      type: 'Local Telemetry Gateway',
      status: backendOnline ? 'Connected (Port 8000)' : 'Offline (Demo Fallback)',
      desc: 'REST API serving recent probe logs, rolling Z-score anomaly mathematics, and FAISS RAG diagnosis endpoints.',
      icon: Activity,
      env: 'FastAPI + Uvicorn',
    },
    {
      name: 'FAISS Semantic Vector Index',
      type: 'Vector Database',
      status: 'Ready (IndexFlatL2)',
      desc: 'Vectorizes recent error logs using SentenceTransformers (all-MiniLM-L6-v2) for sub-millisecond semantic similarity search.',
      icon: ShieldCheck,
      env: '384-dimensional embeddings',
    },
    {
      name: 'Ollama LLM Engine',
      type: 'Local Generative Model',
      status: 'Configured (llama3.2)',
      desc: 'Zero-API-cost local language model generating root-cause hypotheses and actionable AWS/Linux/K8s CLI remediation runbooks.',
      icon: Cpu,
      env: 'http://localhost:11434',
    },
  ];

  return (
    <div className="architecture-page">
      <div className="arch-header-card">
        <h2>CloudPulse AI Architectural Pipeline</h2>
        <p>A hybrid cloud-and-edge telemetry topology pairing AWS serverless observability with local Retrieval-Augmented Generation (RAG) for zero-latency, private incident remediation.</p>
      </div>

      <div className="arch-cards-grid">
        {components.map((c, idx) => {
          const Icon = c.icon;
          return (
            <div key={idx} className="arch-component-card">
              <div className="arch-card-top">
                <div className="arch-icon-wrap">
                  <Icon size={20} />
                </div>
                <div className="arch-title-wrap">
                  <h3>{c.name}</h3>
                  <span className="arch-type-tag">{c.type}</span>
                </div>
              </div>

              <p className="arch-desc">{c.desc}</p>

              <div className="arch-card-footer">
                <div className="arch-status-pill">
                  <CheckCircle2 size={12} className="text-green" />
                  <span>{c.status}</span>
                </div>
                <span className="arch-env-code">{c.env}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
