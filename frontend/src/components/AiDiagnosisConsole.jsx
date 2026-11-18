import { useState } from 'react';
import { Sparkles, Terminal, Copy, Check, Cpu, CornerDownLeft, RotateCcw } from 'lucide-react';

export default function AiDiagnosisConsole({
  query,
  setQuery,
  diagnosis,
  loading,
  onDiagnose,
  onClear
}) {
  const [copiedIndex, setCopiedIndex] = useState(null);

  const samplePrompts = [
    {
      title: 'Analyze 503 Outage',
      text: 'Why did https://httpstat.us/503 fail and how to fix it?'
    },
    {
      title: 'Latency Spikes',
      text: 'Analyze the latency spikes and predict infrastructure degradation.'
    },
    {
      title: 'Container Runbook',
      text: 'Generate AWS CLI runbook to restart unhealthy ECS tasks and inspect logs.'
    },
    {
      title: 'DynamoDB Telemetry',
      text: 'Explain DynamoDB 7-day TTL pruning and monitoring metrics.'
    }
  ];

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      onDiagnose(e);
    }
  };

  const copyToClipboard = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Custom parser to render markdown headers, bullet points, and syntax-highlighted code blocks with copy buttons
  const renderFormattedDiagnosis = (content) => {
    if (!content) return null;

    // Split by fenced code blocks
    const parts = content.split(/(```[\s\S]*?```)/g);

    return parts.map((part, pIdx) => {
      if (part.startsWith('```')) {
        // Code block
        const lines = part.slice(3, -3).trim().split('\n');
        const lang = lines[0].trim() || 'bash';
        const code = lines.slice(lang.length > 0 && !lang.includes(' ') ? 1 : 0).join('\n');
        const codeToCopy = code.length > 0 ? code : lines.join('\n');

        return (
          <div key={pIdx} className="cli-runbook-block">
            <div className="runbook-header">
              <div className="runbook-lang">
                <Terminal size={14} />
                <span>{lang || 'bash'}</span>
              </div>
              <button
                className="btn-copy-code"
                onClick={() => copyToClipboard(codeToCopy, pIdx)}
                title="Copy command to clipboard"
              >
                {copiedIndex === pIdx ? (
                  <>
                    <Check size={13} className="text-emerald" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy size={13} />
                    <span>Copy Command</span>
                  </>
                )}
              </button>
            </div>
            <pre className="runbook-code">
              <code>{codeToCopy}</code>
            </pre>
          </div>
        );
      }

      // Regular markdown paragraphs, lists, and headers
      const lines = part.split('\n');
      return (
        <div key={pIdx} className="markdown-prose">
          {lines.map((line, lIdx) => {
            const trimmed = line.trim();
            if (!trimmed) return <div key={lIdx} className="prose-spacing" />;

            // Blockquotes
            if (trimmed.startsWith('>')) {
              return (
                <blockquote key={lIdx} className="prose-blockquote">
                  {trimmed.replace(/^>\s*/, '')}
                </blockquote>
              );
            }

            // H3 / H4 headers
            if (trimmed.startsWith('####')) {
              return <h5 key={lIdx} className="prose-h5">{trimmed.replace(/^####\s*/, '')}</h5>;
            }
            if (trimmed.startsWith('###')) {
              return <h4 key={lIdx} className="prose-h4">{trimmed.replace(/^###\s*/, '')}</h4>;
            }
            if (trimmed.startsWith('##')) {
              return <h3 key={lIdx} className="prose-h3">{trimmed.replace(/^##\s*/, '')}</h3>;
            }

            // Bullet points
            if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
              const text = trimmed.replace(/^[-*]\s*/, '');
              return (
                <div key={lIdx} className="prose-bullet-row">
                  <span className="prose-bullet-dot">•</span>
                  <span>{parseInlineFormatting(text)}</span>
                </div>
              );
            }

            // Standard line
            return (
              <p key={lIdx} className="prose-p">
                {parseInlineFormatting(trimmed)}
              </p>
            );
          })}
        </div>
      );
    });
  };

  // Helper for inline backticks and bold text
  const parseInlineFormatting = (text) => {
    const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
    return parts.map((chunk, i) => {
      if (chunk.startsWith('`') && chunk.endsWith('`')) {
        return <code key={i} className="inline-code">{chunk.slice(1, -1)}</code>;
      }
      if (chunk.startsWith('**') && chunk.endsWith('**')) {
        return <strong key={i}>{chunk.slice(2, -2)}</strong>;
      }
      return chunk;
    });
  };

  return (
    <div className="ai-console-panel">
      {/* Console Header */}
      <div className="ai-header">
        <div className="ai-title-wrap">
          <div className="ai-icon-glow">
            <Sparkles size={20} className="ai-sparkle-icon" />
          </div>
          <div>
            <h2 className="ai-title">AI Incident Diagnosis & Runbook Engine</h2>
            <p className="ai-subtitle">
              FAISS Vector Search + SentenceTransformers + Local Llama 3.2
            </p>
          </div>
        </div>
        <div className="ai-badge-group">
          <span className="ai-model-tag">
            <Cpu size={12} />
            <span>llama3.2</span>
          </span>
          <span className="ai-rag-tag">RAG: FAISS</span>
        </div>
      </div>

      {/* Suggested Prompts */}
      <div className="prompts-suggestion-bar">
        <span className="suggestions-label">Quick Prompts:</span>
        <div className="suggestion-chips">
          {samplePrompts.map((p, idx) => (
            <button
              key={idx}
              className="prompt-chip"
              onClick={() => setQuery(p.text)}
              type="button"
            >
              <span>{p.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Diagnostic Query Input */}
      <form onSubmit={onDiagnose} className="ai-form">
        <div className="textarea-container">
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask AI about recent failure incidents, latency spikes, or remediation runbooks (e.g., Why did httpstat.us fail?)..."
            rows={3}
            className="ai-textarea"
          />
          <div className="textarea-footer">
            <span className="keyboard-hint">
              Press <kbd>Ctrl</kbd> + <kbd>Enter</kbd> to submit
            </span>
            <div className="form-actions">
              {query && (
                <button
                  type="button"
                  className="btn-clear-query"
                  onClick={() => setQuery('')}
                  title="Clear input"
                >
                  Clear
                </button>
              )}
              <button
                type="submit"
                disabled={loading || !query.trim()}
                className={`btn-submit-ai ${loading ? 'loading' : ''}`}
              >
                {loading ? (
                  <>
                    <span className="spinner"></span>
                    <span>Analyzing Logs...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={15} />
                    <span>Diagnose Incident</span>
                    <CornerDownLeft size={13} className="enter-icon" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Loading state indicator */}
      {loading && (
        <div className="ai-loading-box">
          <div className="loading-pulse-ring">
            <Sparkles size={24} className="pulse-icon" />
          </div>
          <div className="loading-text-wrap">
            <h4>CloudPulse RAG Engine in Progress...</h4>
            <p>1. Vectorizing recent DynamoDB logs with SentenceTransformers</p>
            <p>2. Querying FAISS L2 index for highest semantic error correlation</p>
            <p>3. Synthesizing root-cause analysis and CLI remediation runbook</p>
          </div>
        </div>
      )}

      {/* Diagnosis Output Result */}
      {!loading && diagnosis && (
        <div className="ai-result-card">
          <div className="result-header">
            <div className="result-meta">
              <span className="result-badge">AI RUNBOOK & DIAGNOSIS</span>
              <span className="result-timestamp">
                Generated {new Date().toLocaleTimeString()}
              </span>
            </div>
            <div className="result-actions">
              <button
                className="btn-reset-ai"
                onClick={onClear}
                title="Clear current diagnosis"
              >
                <RotateCcw size={13} />
                <span>Reset</span>
              </button>
            </div>
          </div>

          <div className="result-body">
            {renderFormattedDiagnosis(diagnosis)}
          </div>
        </div>
      )}
    </div>
  );
}
