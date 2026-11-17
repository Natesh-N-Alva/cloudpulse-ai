import os
import boto3
import numpy as np

AWS_REGION = os.environ.get("AWS_REGION", "ap-south-1")
TABLE_NAME = os.environ.get("TABLE_NAME", "CloudPulse-MonitoringLogs")

dynamodb = boto3.resource('dynamodb', region_name=AWS_REGION)
table = dynamodb.Table(TABLE_NAME)

def fetch_recent_logs(limit=100):
    """Fetches and chronologically sorts recent health logs."""
    try:
        # Increase scan limit to ensure we don't miss healthy endpoint logs
        response = table.scan(Limit=300)
        items = response.get('Items', [])
        
        for item in items:
            item['StatusCode'] = int(item.get('StatusCode', 0))
            item['LatencyMS'] = int(item.get('LatencyMS', 0))
            item['IsUp'] = bool(item.get('IsUp', False))
            
        # Sort items by Timestamp (Newest first) so React UI gets accurate, mixed data
        items.sort(key=lambda x: x.get('Timestamp', ''), reverse=True)
        
        return items[:limit]
    except Exception as e:
        print(f"Error fetching logs: {e}")
        return []

def detect_latency_anomalies(logs):
    """Calculates Z-score to predict infrastructure degradation for all endpoints."""
    anomalies = []
    url_map = {}
    
    # Group latencies by URL for statistical analysis
    for log in logs:
        url = log.get('WebsiteURL')
        if log.get('IsUp'):
            if url not in url_map:
                url_map[url] = []
            url_map[url].append(log['LatencyMS'])
            
    for url, latencies in url_map.items():
        if len(latencies) < 5:
            continue  # Need a baseline of at least 5 pings
            
        current_latency = latencies[0] # Newest log is at index 0
        historical_latencies = latencies[1:]
        
        mean = np.mean(historical_latencies)
        std_dev = np.std(historical_latencies)
        z_score = (current_latency - mean) / (std_dev + 1e-5)
        
        # Flag if latency is 2.5 standard deviations higher than normal baseline
        if z_score > 2.5:
            anomalies.append({
                "url": url,
                "current_latency": current_latency,
                "normal_latency": int(mean),
                "z_score": round(z_score, 2),
                "warning": f"⚠️ Spiked to {current_latency}ms (Normal: ~{int(mean)}ms)"
            })
            
    return anomalies