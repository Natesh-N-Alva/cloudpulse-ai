from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from app.aws_client import fetch_recent_logs
from app.rag_engine import diagnose_with_ollama
from app.aws_client import fetch_recent_logs, detect_latency_anomalies

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

@app.post("/api/diagnose")
def diagnose(req: DiagnoseRequest):
    logs = fetch_recent_logs(limit=15)
    logs_str = str(logs)
    diagnosis = diagnose_with_ollama(logs_str, req.query)
    return {"query": req.query, "diagnosis": diagnosis}

@app.get("/api/metrics/anomalies")
def get_anomalies():
    """Returns predictive performance degradation warnings."""
    logs = fetch_recent_logs(limit=200)
    anomalies = detect_latency_anomalies(logs)
    return {"anomalies": anomalies}
