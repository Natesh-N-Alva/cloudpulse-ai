import requests
import faiss
import numpy as np
from sentence_transformers import SentenceTransformer
from app.aws_client import fetch_recent_logs

# Load lightweight embedding model locally
embedder = SentenceTransformer('all-MiniLM-L6-v2')
OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL_NAME = "llama3.2"

def build_vector_index(logs):
    """Embeds logs and builds a temporary FAISS index."""
    if not logs:
        return None, []
    
    texts = [
        f"URL: {log.get('WebsiteURL')} | Status: {log.get('StatusCode')} | "
        f"Latency: {log.get('LatencyMS')}ms | Up: {log.get('IsUp')} | "
        f"Error: {log.get('ErrorMessage')} | Time: {log.get('Timestamp')}"
        for log in logs
    ]
    
    raw_embeddings = embedder.encode(texts, convert_to_numpy=True)
    embeddings = np.ascontiguousarray(raw_embeddings, dtype=np.float32)
    
    dimension = embeddings.shape[1]
    index = faiss.IndexFlatL2(dimension)
    index.add(embeddings)
    return index, texts

def query_rag_engine(user_query: str):
    """Retrieves relevant logs via FAISS semantic search and queries Ollama for diagnosis."""
    logs = fetch_recent_logs(limit=20)
    index, texts = build_vector_index(logs)
    
    context = "No recent failure logs found in DynamoDB."
    if index and texts:
        raw_query_emb = embedder.encode([user_query], convert_to_numpy=True)
        query_embedding = np.ascontiguousarray(raw_query_emb, dtype=np.float32)
        
        k = min(3, len(texts))
        distances, indices = index.search(query_embedding, k)
        
        retrieved_texts = [texts[i] for i in indices[0] if 0 <= i < len(texts)]
        if retrieved_texts:
            context = "\n".join(retrieved_texts)
        
    prompt = f"""You are CloudPulse AI, an expert Senior DevOps Engineer.
Analyze the following real-time infrastructure logs retrieved from AWS DynamoDB.

Context Logs:
{context}

User Question: {user_query}

Instructions:
1. Diagnose the issue concisely based on the logs.
2. If an outage or latency anomaly is detected, generate an "AI Remediation Runbook".
3. Provide 2-3 specific, copy-paste CLI commands (AWS CLI, Linux, or Kubernetes) that a developer could use to troubleshoot or fix the root cause.

AI Diagnosis & Remediation Runbook:"""
    
    payload = {
        "model": MODEL_NAME,
        "prompt": prompt,
        "stream": False,
        "options": {
            "num_predict": 200,      # Cap output tokens to guarantee fast generation
            "temperature": 0.2,      # Low temperature for deterministic output
            "top_p": 0.9
        }
    }
    
    try:
        # Extended timeout to 120 seconds to allow for GPU/CPU cold loading
        response = requests.post(OLLAMA_URL, json=payload, timeout=120)
        if response.status_code == 200:
            return response.json().get("response", "No diagnosis generated.")
        else:
            return f"⚠️ Ollama Error: Received status code {response.status_code}."
    except requests.exceptions.ConnectionError:
        return "⚠️ Connection Offline: Ollama service is not running on port 11434. Run `ollama serve` in terminal."
    except requests.exceptions.Timeout:
        return "⚠️ CloudPulse AI Timeout: The local LLM execution timed out after 120s."
    except Exception as e:
        return f"⚠️ Unexpected RAG Engine Error: {str(e)}"

def diagnose_with_ollama(logs_context_or_query, user_query=None):
    if user_query is not None:
        return query_rag_engine(user_query)
    return query_rag_engine(logs_context_or_query)