# CloudPulse AI

**CloudPulse AI** is a hybrid cloud-and-edge infrastructure monitoring, predictive telemetry, and AI-powered incident response platform. It pairs serverless AWS observability with a local Retrieval-Augmented Generation (RAG) engine to detect outages, eliminate alert fatigue, and generate actionable CLI remediation runbooks.

---

## Architecture & Tech Stack

* **Serverless Cloud Pipeline (AWS):**
  * **AWS Lambda:** Python health-check worker using native `urllib` and `boto3` for zero-dependency execution and fast cold starts.
  * **Amazon EventBridge:** Automated scheduler triggering multi-endpoint probes every 5 minutes.
  * **Amazon DynamoDB:** NoSQL telemetry store configured with a **7-day Time-To-Live (TTL)** (`ExpirationTime`) for automatic log pruning.
  * **Amazon CloudWatch:** Custom metrics pipeline (`CloudPulse/Monitoring` namespace) tracking `LatencyMS` and `UptimeState`.
  * **Slack Incoming Webhooks:** Real-time state-change notifications.
* **Local AI & Telemetry Backend:**
  * **FastAPI & Uvicorn:** High-performance REST API serving health logs, uptime summaries, anomaly detection, and AI diagnostics.
  * **SentenceTransformers & FAISS:** Local semantic vector search (`all-MiniLM-L6-v2` + `IndexFlatL2`) retrieving relevant incident context from recent telemetry.
  * **Ollama (`llama3.2`):** Locally hosted LLM generating private, zero-API-cost root-cause analyses and CLI remediation runbooks.
* **Frontend Dashboard:**
  * **React (Vite):** Real-time operational dashboard for viewing live health logs and interacting with the AI Incident Diagnosis assistant.
* **Infrastructure as Code (IaC):**
  * **AWS SAM (`template.yaml`):** Declarative serverless stack definition for reproducible production deployments.

---

## Key Features

* **Automated Multi-Endpoint Health Checks:** Probes configured endpoints and logs HTTP status codes, response latency (ms), availability state, and localized IST (`UTC+5:30`) timestamps.
* **Smart Alert Deduplication & Recovery Alerts:** Checks previous endpoint state in DynamoDB before alerting—firing Slack notifications strictly on state transitions (`UP -> DOWN` and `DOWN -> UP`) to prevent alert spam.
* **Self-Pruning Telemetry (DynamoDB TTL):** Automatically expires logs after 7 days to keep storage lean without manual cleanup.
* **Predictive Latency Anomaly Detection:** Computes rolling Z-scores across historical latency data (`/api/metrics/anomalies`) to flag performance degradation (>2.5 standard deviations above normal baseline) before full outages occur.
* **AI Incident Diagnosis & Runbook Generator:** Uses FAISS semantic retrieval + local `llama3.2` (`/api/diagnose`) to analyze error patterns and output copy-paste AWS CLI, Linux, or Kubernetes troubleshooting commands.

---

## Project Structure

```text
cloudpulse-ai/
├── backend-rag/             # FastAPI server, DynamoDB client, and FAISS + Ollama RAG engine
│   ├── app/
│   │   ├── aws_client.py    # DynamoDB log retrieval, sorting, and Z-score anomaly math
│   │   ├── main.py          # FastAPI routes (/api/logs, /api/metrics/*, /api/diagnose)
│   │   └── rag_engine.py    # SentenceTransformer embeddings, FAISS index, and Ollama prompt
│   └── requirements.txt
├── frontend/                # React (Vite) live monitoring dashboard & AI console
├── infra-monitoring/        # AWS SAM Infrastructure as Code templates & Lambda source
│   ├── functions/           # Lambda monitoring worker code
│   └── template.yaml        # CloudFormation / SAM resource definitions
└── .gitignore
```

---

## Local Setup & Running

### 1. Start Local LLM (Ollama)
```bash
ollama serve
ollama run llama3.2
```

### 2. Run the FastAPI Backend
```bash
cd backend-rag
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```
API docs will be available at `http://127.0.0.1:8000/docs`.

### 3. Run the React Frontend
```bash
cd frontend
npm install
npm run dev
```
Open the local URL printed by Vite (typically `http://localhost:5173`).

---

## Roadmap
* **DevSecOps & SSL Posture:** Migrate webhook secrets to AWS Secrets Manager and add socket-level SSL/TLS certificate expiration checks.
* **Multi-Channel Paging & Auto-Remediation:** Integrate Amazon SNS (SMS/Email) and AWS Step Functions for automated container/service recovery.
* **Conversational AI Memory:** Persist multi-turn debugging sessions in DynamoDB.