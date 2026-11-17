import os
import time
import urllib.request
from urllib.error import URLError, HTTPError
import boto3
from datetime import datetime, timezone

# Initialize DynamoDB client
dynamodb = boto3.resource('dynamodb')
table_name = os.environ.get('TABLE_NAME', 'CloudPulse-MonitoringLogs')
table = dynamodb.Table(table_name)

# List of websites to monitor (including a deliberate 503 error for testing)
TARGET_URLS = [
    "https://www.google.com",
    "https://www.github.com",
    "https://httpstat.us/503" 
]

def lambda_handler(event, context):
    for url in TARGET_URLS:
        start_time = time.time()
        status_code = 500
        is_up = False
        error_message = "None"
        
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'CloudPulse/1.0'})
            with urllib.request.urlopen(req, timeout=10) as response:
                status_code = response.getcode()
                is_up = True
        except HTTPError as e:
            status_code = e.code
            error_message = str(e.reason)
        except URLError as e:
            status_code = 0
            error_message = str(e.reason)
        except Exception as e:
            status_code = 0
            error_message = str(e)
            
        latency_ms = int((time.time() - start_time) * 1000)
        timestamp = datetime.now(timezone.utc).isoformat()
        
        print(f"[{timestamp}] {url} | Status: {status_code} | Latency: {latency_ms}ms | Up: {is_up}")
        
        # Write to DynamoDB
        try:
            table.put_item(
                Item={
                    'WebsiteURL': url,
                    'Timestamp': timestamp,
                    'StatusCode': status_code,
                    'LatencyMS': latency_ms,
                    'IsUp': is_up,
                    'ErrorMessage': error_message
                }
            )
        except Exception as e:
            print(f"Failed to write {url} to DynamoDB: {e}")
            
    return {
        'statusCode': 200,
        'body': 'Monitoring check complete.'
    }