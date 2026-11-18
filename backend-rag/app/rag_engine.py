import requests
import faiss
import numpy as np
from sentence_transformers import SentenceTransformer
from app.aws_client import fetch_recent_logs, fetch_chat_history, save_chat_message

embedder = SentenceTransformer('all-MiniLM-L6-v2')
OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL_NAME = "llama3.2"

def build_vector_index(logs):
    """Embeds health + SSL logs and builds a temporary FAISS index."""
    if not logs:
        return None, []

    texts = [
        f"URL: {log.get('WebsiteURL')} | Status: {log.get('StatusCode')} | "
        f"Latency: {log.get('LatencyMS')}ms | Up: {log.get('IsUp')} | "
        f"SSL Days Left: {log.get('SSLDaysRemaining', 'Unknown')} | "
        f"Error: {log.get('ErrorMessage')} | Time: {log.get('Timestamp')}"
        for log in logs
    ]

    raw_embeddings = embedder.encode(texts, convert_to_numpy=True)
    embeddings = np.ascontiguousarray(raw_embeddings, dtype=np.float32)

    dimension = embeddings.shape[1]
    index = faiss.IndexFlatL2(dimension)
    index.add(embeddings)
    return index, texts

def query_rag_engine(user_query: str, session_id: str = "default-session"):
    """Retrieves latest endpoint snapshot + FAISS semantic logs + chat history."""
    logs = fetch_recent_logs(limit=25)
    index, texts = build_vector_index(logs)

    # 1. Guarantee the latest status & SSL posture of every unique URL is always visible
    seen_urls = set()
    latest_snapshot = []
    for log in logs:
        url = log.get('WebsiteURL')
        if url and url not in seen_urls:
            seen_urls.add(url)
            latest_snapshot.append(
                f"LATEST -> URL: {url} | Status: {log.get('StatusCode')} | "
                f"Latency: {log.get('LatencyMS')}ms | Up: {log.get('IsUp')} | "
                f"SSL Days Left: {log.get('SSLDaysRemaining', 'Unknown')} | "
                f"Error: {log.get('ErrorMessage')} | Time: {log.get('Timestamp')}"
            )

    # 2. Add top-4 semantically similar historical logs via FAISS
    semantic_logs = []
    if index and texts:
        raw_query_emb = embedder.encode([user_query], convert_to_numpy=True)
        query_embedding = np.ascontiguousarray(raw_query_emb, dtype=np.float32)
        k = min(4, len(texts))
        _, indices = index.search(query_embedding, k)
        semantic_logs = [texts[i] for i in indices[0] if 0 <= i < len(texts)]

    context = "\n".join(latest_snapshot + ["--- Historical Matches ---"] + semantic_logs) if logs else "No recent logs found."

    # 3. Load prior conversation turns
    past_turns = fetch_chat_history(session_id, limit=6)
    history_block = "\n".join(
        f"{turn.get('Role', 'User').upper()}: {turn.get('Content', '')}"
        for turn in past_turns
    ) if past_turns else "No prior messages in this session."

    prompt = f"""You are CloudPulse AI, an expert Senior DevOps & Cloud Security Engineer.
Use the real-time AWS telemetry logs and ongoing conversation history to answer concisely.

Telemetry & SSL Logs:
{context}

Conversation History:
{history_block}

Current User Question: {user_query}

Instructions:
1. Check the LATEST lines first for current outages (Up: False) and SSL Days Left.
2. Reference prior conversation history naturally for follow-up questions.
3. Provide 2-3 specific, copy-paste CLI commands (AWS CLI, Linux, or curl) for troubleshooting or remediation.

AI Diagnosis & Remediation Runbook:"""

    payload = {
        "model": MODEL_NAME,
        "prompt": prompt,
        "stream": False,
        "options": {
            "num_predict": 380,
            "temperature": 0.2,
            "top_p": 0.9
        }
    }

    try:
        response = requests.post(OLLAMA_URL, json=payload, timeout=120)
        if response.status_code == 200:
            ai_reply = response.json().get("response", "No diagnosis generated.")
            save_chat_message(session_id, "user", user_query)
            save_chat_message(session_id, "assistant", ai_reply)
            return ai_reply
        return f"⚠️ Ollama Error: Received status code {response.status_code}."
    except requests.exceptions.ConnectionError:
        return "⚠️ Connection Offline: Ollama is not running on port 11434."
    except requests.exceptions.Timeout:
        return "⚠️ CloudPulse AI Timeout: Local LLM execution timed out after 120s."
    except Exception as e:
        return f"⚠️ Unexpected RAG Engine Error: {str(e)}"