from typing import Optional
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from app.aws_client import (
    fetch_recent_logs,
    detect_latency_anomalies,
    fetch_chat_history,
    clear_chat_history
)
from app.rag_engine import query_rag_engine

app = FastAPI(title="CloudPulse AI Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class DiagnoseRequest(BaseModel):
    query: str
    session_id: Optional[str] = "default-session"

@app.get("/api/logs")
def get_logs():
    logs = fetch_recent_logs(limit=50)
    return {"logs": logs}

@app.get("/api/metrics/summary")
def get_metrics_summary():
    """Calculates overall uptime percentage and average latency for monitored endpoints."""
    logs = fetch_recent_logs(limit=100)
    summary = {}

    for log in logs:
        url = log.get("WebsiteURL")
        if not url:
            continue

        if url not in summary:
            summary[url] = {"total_checks": 0, "successful_checks": 0, "total_latency": 0}

        summary[url]["total_checks"] += 1
        summary[url]["total_latency"] += int(log.get("LatencyMS", 0))
        if log.get("IsUp"):
            summary[url]["successful_checks"] += 1

    results = []
    for url, stats in summary.items():
        total = stats["total_checks"]
        uptime_pct = round((stats["successful_checks"] / total) * 100, 2) if total > 0 else 0
        avg_latency = round(stats["total_latency"] / total, 1) if total > 0 else 0
        results.append({
            "url": url,
            "uptime_percentage": uptime_pct,
            "avg_latency_ms": avg_latency,
            "total_checks": total
        })

    return {"summary": results}

@app.get("/api/metrics/anomalies")
def get_anomalies():
    """Returns predictive performance degradation warnings."""
    logs = fetch_recent_logs(limit=200)
    anomalies = detect_latency_anomalies(logs)
    return {"anomalies": anomalies}

@app.post("/api/diagnose")
def diagnose(req: DiagnoseRequest):
    session = req.session_id or "default-session"
    diagnosis = query_rag_engine(req.query, session_id=session)
    return {
        "session_id": session,
        "query": req.query,
        "diagnosis": diagnosis
    }

@app.get("/api/chat/{session_id}")
def get_session_history(session_id: str):
    """Fetches stored conversation history for a debugging session."""
    history = fetch_chat_history(session_id, limit=20)
    return {"session_id": session_id, "messages": history}

@app.delete("/api/chat/{session_id}")
def reset_session_history(session_id: str):
    """Clears stored conversation memory for a debugging session."""
    cleared = clear_chat_history(session_id)
    return {"session_id": session_id, "cleared": cleared}