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

def classify_ssl_status(ssl_days: int) -> str:
    if ssl_days < 0:
        return "N/A"
    if ssl_days < 7:
        return "CRITICAL"
    if ssl_days < 14:
        return "WARNING"
    return "HEALTHY"

@app.get("/api/logs")
def get_logs():
    logs = fetch_recent_logs(limit=50)
    return {"logs": logs}

@app.get("/api/metrics/summary")
def get_metrics_summary():
    """Calculates per-endpoint metrics and overall multi-endpoint fleet health."""
    logs = fetch_recent_logs(limit=100)
    summary = {}

    for log in logs:
        url = log.get("WebsiteURL")
        if not url:
            continue

        if url not in summary:
            summary[url] = {
                "total_checks": 0,
                "successful_checks": 0,
                "total_latency": 0,
                "latest_ssl": -1,
                "latest_is_up": bool(log.get("IsUp", False))
            }

        summary[url]["total_checks"] += 1
        summary[url]["total_latency"] += int(log.get("LatencyMS", 0))
        if log.get("IsUp"):
            summary[url]["successful_checks"] += 1

        ssl_val = int(log.get("SSLDaysRemaining", -1))
        if summary[url]["latest_ssl"] == -1 and ssl_val >= 0:
            summary[url]["latest_ssl"] = ssl_val

    results = []
    healthy_count = 0
    for url, stats in summary.items():
        total = stats["total_checks"]
        uptime_pct = round((stats["successful_checks"] / total) * 100, 2) if total > 0 else 0
        avg_latency = round(stats["total_latency"] / total, 1) if total > 0 else 0
        ssl_days = stats["latest_ssl"]

        if stats["latest_is_up"]:
            healthy_count += 1

        results.append({
            "url": url,
            "source_type": "pushed_service" if url.startswith("service://") else "monitored_url",
            "is_up": stats["latest_is_up"],
            "uptime_percentage": uptime_pct,
            "avg_latency_ms": avg_latency,
            "total_checks": total,
            "ssl_days_remaining": ssl_days,
            "ssl_status": classify_ssl_status(ssl_days)
        })

    total_endpoints = len(results)
    degraded_count = total_endpoints - healthy_count
    overall_uptime = round(
        sum(r["uptime_percentage"] for r in results) / total_endpoints, 1
    ) if total_endpoints > 0 else 100.0

    # Multi-endpoint fleet status instead of branding entire system "Degraded" for 1 probe
    if total_endpoints == 0 or degraded_count == 0:
        fleet_status = "Operational"
    elif healthy_count >= degraded_count:
        fleet_status = "Operational"
    else:
        fleet_status = "Degraded"

    return {
        "fleet_status": fleet_status,
        "healthy_count": healthy_count,
        "degraded_count": degraded_count,
        "total_endpoints": total_endpoints,
        "overall_uptime_pct": overall_uptime,
        "summary": results
    }

@app.get("/api/notifications")
def get_notifications():
    """Mirrors deduplicated Slack alert events (Outages, Recoveries, SSL Warnings, Push Alerts)."""
    logs = fetch_recent_logs(limit=100)
    chronological = list(reversed(logs))
    last_state = {}
    last_ssl_alerted = {}
    raw_notifications = []

    for idx, log in enumerate(chronological):
        url = log.get("WebsiteURL", "unknown")
        is_up = bool(log.get("IsUp", True))
        status_code = int(log.get("StatusCode", 0))
        error_msg = log.get("ErrorMessage", "None")
        timestamp = log.get("Timestamp", "")
        ssl_days = int(log.get("SSLDaysRemaining", -1))

        # 1. Push Telemetry Incident (service://)
        if url.startswith("service://") and not is_up:
            raw_notifications.append({
                "id": f"push-{idx}-{timestamp}",
                "type": "PUSH_ALERT",
                "severity": "critical",
                "title": f"Push Incident: {url}",
                "message": f"Status {status_code} — {error_msg}",
                "source": url,
                "timestamp": timestamp,
                "channel": "Slack + API Gateway"
            })
        else:
            prev_up = last_state.get(url, True)
            # 2. Outage Transition
            if prev_up and not is_up:
                raw_notifications.append({
                    "id": f"outage-{idx}-{timestamp}",
                    "type": "OUTAGE",
                    "severity": "critical",
                    "title": f"Endpoint Down: {url}",
                    "message": f"HTTP {status_code} ({error_msg})",
                    "source": url,
                    "timestamp": timestamp,
                    "channel": "Slack Webhook"
                })
            # 3. Recovery Transition
            elif not prev_up and is_up:
                raw_notifications.append({
                    "id": f"recovery-{idx}-{timestamp}",
                    "type": "RECOVERY",
                    "severity": "resolved",
                    "title": f"Recovered: {url}",
                    "message": f"Back online with HTTP {status_code}",
                    "source": url,
                    "timestamp": timestamp,
                    "channel": "Slack Webhook"
                })
            last_state[url] = is_up

        # 4. SSL Expiration Warning (< 14 days) — emit only when day count changes
        if 0 <= ssl_days < 14 and last_ssl_alerted.get(url) != ssl_days:
            last_ssl_alerted[url] = ssl_days
            raw_notifications.append({
                "id": f"ssl-{idx}-{timestamp}",
                "type": "SSL_WARNING",
                "severity": "warning",
                "title": f"SSL Expiring Soon: {url}",
                "message": f"Certificate expires in {ssl_days} days",
                "source": url,
                "timestamp": timestamp,
                "channel": "Slack Security Alert"
            })

    # Keep newest-first and deduplicate identical (type, source, message) alerts
    raw_notifications.reverse()
    seen_keys = set()
    unique_notifications = []
    for item in raw_notifications:
        dedup_key = (item["type"], item["source"], item["message"])
        if dedup_key not in seen_keys:
            seen_keys.add(dedup_key)
            unique_notifications.append(item)

    return {
        "unread_count": len(unique_notifications[:15]),
        "notifications": unique_notifications[:15]
    }
    
@app.get("/api/metrics/ssl")
def get_ssl_posture():
    logs = fetch_recent_logs(limit=100)
    seen = {}

    for log in logs:
        url = log.get("WebsiteURL", "")
        if not url.startswith("https://") or url in seen:
            continue

        ssl_days = int(log.get("SSLDaysRemaining", -1))
        if ssl_days >= 0:
            seen[url] = {
                "url": url,
                "ssl_days_remaining": ssl_days,
                "ssl_status": classify_ssl_status(ssl_days),
                "last_checked": log.get("Timestamp")
            }

    return {"certificates": list(seen.values())}

@app.get("/api/metrics/anomalies")
def get_anomalies():
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
    history = fetch_chat_history(session_id, limit=20)
    return {"session_id": session_id, "messages": history}

@app.delete("/api/chat/{session_id}")
def reset_session_history(session_id: str):
    cleared = clear_chat_history(session_id)
    return {"session_id": session_id, "cleared": cleared}

URL_ALIASES = {
    "https://lms.nmamit.in/login/index.php": "https://lms.nmamit.in/login"
}

def get_normalized_logs(limit: int = 50):
    logs = fetch_recent_logs(limit=limit)
    for log in logs:
        raw_url = log.get("WebsiteURL")
        if raw_url in URL_ALIASES:
            log["WebsiteURL"] = URL_ALIASES[raw_url]
    return logs