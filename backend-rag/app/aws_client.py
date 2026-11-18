import os
import time
from datetime import datetime, timezone, timedelta
import boto3
from boto3.dynamodb.conditions import Key
import numpy as np

AWS_REGION = os.environ.get("AWS_REGION", "ap-south-1")
TABLE_NAME = os.environ.get("TABLE_NAME", "CloudPulse-MonitoringLogs")
CHAT_TABLE_NAME = os.environ.get("CHAT_TABLE_NAME", "CloudPulse-ChatHistory")

dynamodb = boto3.resource('dynamodb', region_name=AWS_REGION)
table = dynamodb.Table(TABLE_NAME)
chat_table = dynamodb.Table(CHAT_TABLE_NAME)

ist_offset = timezone(timedelta(hours=5, minutes=30))

def fetch_recent_logs(limit=100):
    """Fetches and chronologically sorts recent health and SSL logs."""
    try:
        response = table.scan(Limit=300)
        items = response.get('Items', [])

        for item in items:
            item['StatusCode'] = int(item.get('StatusCode', 0))
            item['LatencyMS'] = int(item.get('LatencyMS', 0))
            item['IsUp'] = bool(item.get('IsUp', False))
            if 'SSLDaysRemaining' in item:
                item['SSLDaysRemaining'] = int(item['SSLDaysRemaining'])

        items.sort(key=lambda x: x.get('Timestamp', ''), reverse=True)
        return items[:limit]
    except Exception as e:
        print(f"Error fetching logs: {e}")
        return []

def detect_latency_anomalies(logs):
    """Calculates Z-score to predict infrastructure degradation for all endpoints."""
    anomalies = []
    url_map = {}

    for log in logs:
        url = log.get('WebsiteURL')
        if log.get('IsUp'):
            url_map.setdefault(url, []).append(log['LatencyMS'])

    for url, latencies in url_map.items():
        if len(latencies) < 5:
            continue

        current_latency = latencies[0]
        historical_latencies = latencies[1:]

        mean = np.mean(historical_latencies)
        std_dev = np.std(historical_latencies)
        z_score = (current_latency - mean) / (std_dev + 1e-5)

        if z_score > 2.5:
            anomalies.append({
                "url": url,
                "current_latency": current_latency,
                "normal_latency": int(mean),
                "z_score": round(z_score, 2),
                "warning": f"⚠️ Spiked to {current_latency}ms (Normal: ~{int(mean)}ms)"
            })

    return anomalies

def save_chat_message(session_id: str, role: str, content: str):
    """Persists a single conversation turn in DynamoDB with a 24-hour TTL."""
    try:
        ttl_seconds = int(time.time()) + (24 * 60 * 60)
        timestamp = datetime.now(ist_offset).isoformat()
        chat_table.put_item(
            Item={
                'SessionID': session_id,
                'Timestamp': timestamp,
                'Role': role,
                'Content': content,
                'ExpirationTime': ttl_seconds
            }
        )
    except Exception as e:
        print(f"Failed to save chat message: {e}")

def fetch_chat_history(session_id: str, limit: int = 6):
    """Retrieves the most recent conversation turns for a session in chronological order."""
    try:
        response = chat_table.query(
            KeyConditionExpression=Key('SessionID').eq(session_id),
            ScanIndexForward=False,
            Limit=limit
        )
        items = response.get('Items', [])
        items.reverse()
        return items
    except Exception as e:
        print(f"Failed to fetch chat history: {e}")
        return []

def clear_chat_history(session_id: str):
    """Deletes all messages for a given debugging session."""
    try:
        response = chat_table.query(
            KeyConditionExpression=Key('SessionID').eq(session_id)
        )
        with chat_table.batch_writer() as batch:
            for item in response.get('Items', []):
                batch.delete_item(
                    Key={
                        'SessionID': item['SessionID'],
                        'Timestamp': item['Timestamp']
                    }
                )
        return True
    except Exception as e:
        print(f"Failed to clear chat history: {e}")
        return False