# CloudPulse AI - Frontend Dashboard

A modern, responsive React + Vite observability and AI incident diagnosis dashboard for **CloudPulse AI**. It provides real-time telemetry from AWS DynamoDB health probes, predictive latency anomaly detection, and an interactive RAG runbook console.

---

## Features

- **Live Infrastructure Telemetry:** Monitors target endpoint uptime, HTTP status codes, and latency (ms) probed by AWS Lambda / EventBridge.
- **Predictive Anomaly Detection:** Real-time Z-score alerting for performance degradation (> 2.5 standard deviations above baseline).
- **Interactive Latency Visualization:** Pure SVG latency trend chart with SLA threshold indicators and tooltip inspections.
- **DynamoDB Logs Explorer:** Search, filter by health status (Healthy / Outages / Slow), and inspect error messages.
- **AI Incident Diagnosis & CLI Runbook Generator:** Integrates with the backend RAG engine (SentenceTransformers + FAISS + Ollama `llama3.2`) with one-click copyable DevOps remediation runbooks.
- **Offline / Demo Resilience:** Built-in demo simulation mode ensures full dashboard functionality even when the local backend or AWS DynamoDB isn't actively running.

---

## Running the Frontend

### 1. Start the Vite Development Server
```bash
cd frontend
npm run dev
```
By default, the application runs at `http://localhost:5173`.

### 2. Build for Production
```bash
npm run build
```

### 3. Lint Code
```bash
npm run lint
```

---

## Configuration

The frontend connects by default to `http://localhost:8000`. You can configure a custom backend URL by creating a `.env` file in the `frontend` root:

```env
VITE_API_BASE_URL=http://localhost:8000
```
