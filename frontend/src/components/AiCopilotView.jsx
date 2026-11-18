import { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Terminal, 
  Copy, 
  Check, 
  Cpu, 
  Send, 
  CornerDownLeft, 
  RotateCcw, 
  Bot, 
  User, 
  AlertOctagon, 
  FileText,
  Zap
} from 'lucide-react';

export default function AiCopilotView({
  query,
  setQuery,
  onDiagnose,
  aiLoading,
  chatMessages,
  onClearChat,
  onToast
}) {
  const [copiedIndex, setCopiedIndex] = useState(null);
  const chatEndRef = useRef(null);

  const samplePrompts = [
    {
      title: 'Analyze 503 Outage',
      desc: 'Investigate synthetic outage & ingress gateway',
      text: 'Why did https://httpstat.us/503 fail? Analyze the root cause and provide an AWS CLI recovery runbook.'
    },
    {
      title: 'Latency Spikes',
      desc: 'Examine Z-Score > 2.5 deviation on github.com',
      text: 'Analyze the recent latency spike for https://www.github.com. Predict degradation factors and network diagnostics.'
    },
    {
      title: 'Container Runbook',
      desc: 'Generate AWS ECS & Lambda recovery commands',
      text: 'Generate an AWS CLI runbook to restart unhealthy container tasks and check Lambda worker execution logs.'
    },
    {
      title: 'Post-Mortem Report',
      desc: 'Produce formal SEV-2 incident post-mortem',
      text: 'Generate a comprehensive incident post-mortem report for the recent telemetry outages and latency anomalies.'
    }
  ];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, aiLoading]);

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      onDiagnose(e);
    }
  };

  const copyToClipboard = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    if (onToast) onToast('CLI Command copied to clipboard!', 'success');
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Formatter for markdown and code blocks
  const renderMessageContent = (content, msgIdx) => {
    if (!content) return null;
    const parts = content.split(/(```[\s\S]*?```)/g);

    return parts.map((part, pIdx) => {
      if (part.startsWith('```')) {
        const lines = part.slice(3, -3).trim().split('\n');
        const lang = lines[0].trim() || 'bash';
        const code = lines.slice(lang.length > 0 && !lang.includes(' ') ? 1 : 0).join('\n');
        const codeToCopy = code.length > 0 ? code : lines.join('\n');
        const blockId = `${msgIdx}-${pIdx}`;

        return (
          <div key={pIdx} className="cli-terminal-card">
            <div className="terminal-topbar">
              <div className="terminal-dots">
                <span className="dot red"></span>
                <span className="dot yellow"></span>
                <span className="dot green"></span>
                <span className="terminal-lang-tag">{lang}</span>
              </div>
              <button
                className="btn-copy-terminal"
                onClick={() => copyToClipboard(codeToCopy, blockId)}
                title="Copy commands"
              >
                {copiedIndex === blockId ? (
                  <>
                    <Check size={12} className="text-green" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy size={12} />
                    <span>Copy Runbook</span>
                  </>
                )}
              </button>
            </div>
            <pre className="terminal-code-body">
              <code>{codeToCopy}</code>
            </pre>
          </div>
        );
      }

      // Prose formatting
      const lines = part.split('\n');
      return (
        <div key={pIdx} className="chat-prose">
          {lines.map((line, lIdx) => {
            const trimmed = line.trim();
            if (!trimmed) return <div key={lIdx} className="prose-gap" />;

            if (trimmed.startsWith('>')) {
              return (
                <blockquote key={lIdx} className="chat-blockquote">
                  {trimmed.replace(/^>\s*/, '')}
                </blockquote>
              );
            }

            if (trimmed.startsWith('####')) {
              return <h5 key={lIdx} className="chat-h5">{trimmed.replace(/^####\s*/, '')}</h5>;
            }
            if (trimmed.startsWith('###')) {
              return <h4 key={lIdx} className="chat-h4">{trimmed.replace(/^###\s*/, '')}</h4>;
            }
            if (trimmed.startsWith('##')) {
              return <h3 key={lIdx} className="chat-h3">{trimmed.replace(/^##\s*/, '')}</h3>;
            }

            if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
              const text = trimmed.replace(/^[-*]\s*/, '');
              return (
                <div key={lIdx} className="chat-bullet-row">
                  <span className="bullet-point">▸</span>
                  <span>{parseInline(text)}</span>
                </div>
              );
            }

            return <p key={lIdx} className="chat-p">{parseInline(trimmed)}</p>;
          })}
        </div>
      );
    });
  };

  const parseInline = (text) => {
    const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
    return parts.map((chunk, i) => {
      if (chunk.startsWith('`') && chunk.endsWith('`')) {
        return <code key={i} className="chat-inline-code">{chunk.slice(1, -1)}</code>;
      }
      if (chunk.startsWith('**') && chunk.endsWith('**')) {
        return <strong key={i}>{chunk.slice(2, -2)}</strong>;
      }
      return chunk;
    });
  };

  return (
    <div className="ai-copilot-container">
      {/* Copilot Header */}
      <div className="copilot-top-strip">
        <div className="copilot-identity">
          <div className="ai-pulse-avatar">
            <Sparkles size={18} className="ai-spark-icon" />
          </div>
          <div>
            <h2 className="copilot-title">CloudPulse Autonomous SRE Copilot</h2>
            <p className="copilot-subtitle">Real-time FAISS RAG Retrieval & Ollama Incident Runbooks</p>
          </div>
        </div>

        <div className="copilot-tech-badges">
          <span className="tech-badge">
            <Cpu size={12} />
            <span>llama3.2</span>
          </span>
          <span className="tech-badge">all-MiniLM-L6-v2</span>
          <span className="tech-badge">FAISS Vector Index</span>
          <button
            className="btn-clear-conversation"
            onClick={onClearChat}
            title="Reset conversation"
          >
            <RotateCcw size={12} />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Suggested Prompt Cards */}
      <div className="copilot-quick-prompts">
        <span className="prompts-eyebrow">QUICK INCIDENT ACTIONS:</span>
        <div className="prompt-cards-grid">
          {samplePrompts.map((p, idx) => (
            <button
              key={idx}
              className="quick-action-card"
              onClick={() => {
                setQuery(p.text);
              }}
            >
              <div className="action-card-header">
                <span className="action-card-title">{p.title}</span>
                <Zap size={12} className="action-card-zap" />
              </div>
              <span className="action-card-desc">{p.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Messages Stream */}
      <div className="copilot-messages-viewport">
        {chatMessages.map((msg, idx) => (
          <div
            key={idx}
            className={`message-bubble-row ${msg.sender === 'user' ? 'row-user' : 'row-assistant'}`}
          >
            <div className="message-sender-avatar">
              {msg.sender === 'user' ? <User size={15} /> : <Bot size={15} />}
            </div>

            <div className="message-content-box">
              <div className="message-header-meta">
                <span className="sender-name">
                  {msg.sender === 'user' ? 'You (DevOps SRE)' : 'CloudPulse AI Sentinel'}
                </span>
                <span className="message-time">{msg.time}</span>
              </div>

              <div className="message-body">
                {renderMessageContent(msg.text, idx)}
              </div>
            </div>
          </div>
        ))}

        {aiLoading && (
          <div className="message-bubble-row row-assistant">
            <div className="message-sender-avatar">
              <Bot size={15} />
            </div>
            <div className="message-content-box ai-thinking-box">
              <div className="ai-thinking-header">
                <div className="spinner-dots">
                  <span></span><span></span><span></span>
                </div>
                <span className="thinking-status">Synthesizing Incident Runbook...</span>
              </div>
              <p className="thinking-details">
                Vectorizing DynamoDB telemetry via SentenceTransformers → FAISS L2 Search → Generating Llama 3.2 remediation instructions.
              </p>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input Form Bar */}
      <div className="copilot-input-tray">
        <form onSubmit={onDiagnose} className="copilot-form">
          <div className="input-textarea-wrapper">
            <textarea
              className="copilot-textarea"
              placeholder="Ask CloudPulse AI about recent outages, latency spikes, or paste error codes... (Ctrl+Enter to send)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={2}
            />

            <div className="tray-bottom-row">
              <span className="keyboard-helper">
                Use <kbd>Ctrl</kbd> + <kbd>Enter</kbd> to submit
              </span>

              <div className="tray-actions">
                {query && (
                  <button
                    type="button"
                    className="btn-clear-input"
                    onClick={() => setQuery('')}
                  >
                    Clear
                  </button>
                )}
                <button
                  type="submit"
                  disabled={aiLoading || !query.trim()}
                  className="btn-send-message"
                >
                  <Send size={14} />
                  <span>Execute Diagnostic</span>
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
