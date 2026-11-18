import { useState, useMemo } from 'react';
import { BarChart3 } from 'lucide-react';

const WEBSITE_LABELS = {
  'https://www.google.com': 'Google',
  'https://mail.google.com': 'Gmail',
  'https://www.github.com': 'GitHub',
  'https://lms.nmamit.in/login': 'NMAMIT LMS',
  'https://chatgpt.com': 'ChatGPT',
  'https://www.whatsapp.com': 'WhatsApp',
  'https://www.ilovepdf.com/': 'iLovePDF',
  'https://aws.amazon.com': 'AWS Cloud',
  'https://www.wikipedia.org': 'Wikipedia',
  'https://www.python.org': 'Python.org',
  'https://httpbin.org/status/503': 'HTTPBin 503 Probe',
  'service://payment-gateway': 'Payment Gateway',
  'service://auth-service': 'Auth Service'
};

function getWebsiteDisplayName(url = '') {
  if (WEBSITE_LABELS[url]) return WEBSITE_LABELS[url];
  if (url.startsWith('service://')) {
    return url
      .replace('service://', '')
      .split('-')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }
  try {
    const host = new URL(url).hostname.replace(/^www\./, '');
    const base = host.split('.')[0];
    return base.charAt(0).toUpperCase() + base.slice(1);
  } catch {
    return url;
  }
}

function formatShortAxisLabel(url = '') {
  const name = getWebsiteDisplayName(url);
  return name.length > 12 ? `${name.slice(0, 11)}…` : name;
}

function formatTimeIST(ts = '') {
  if (!ts || !ts.includes('T')) return '';
  return ts.split('T')[1].slice(0, 5);
}

export default function LatencyChart({ logs = [] }) {
  const [selectedTarget, setSelectedTarget] = useState('ALL');
  const [hoveredIdx, setHoveredIdx] = useState(null);

  const uniqueTargets = useMemo(() => {
    const set = new Set();
    logs.forEach(l => {
      if (l.WebsiteURL) set.add(l.WebsiteURL);
    });
    return Array.from(set);
  }, [logs]);

  const chartPoints = useMemo(() => {
    if (!logs || logs.length === 0) return [];

    if (selectedTarget === 'ALL') {
      const seen = new Set();
      const latestPerHost = [];
      for (const log of logs) {
        const url = log.WebsiteURL;
        if (url && !seen.has(url)) {
          seen.add(url);
          latestPerHost.push({
            ...log,
            xLabel: formatShortAxisLabel(url)
          });
        }
      }
      return latestPerHost.slice(0, 13);
    }

    return [...logs]
      .filter(l => l.WebsiteURL === selectedTarget)
      .reverse()
      .slice(-15)
      .map(log => ({
        ...log,
        xLabel: formatTimeIST(log.Timestamp) || formatShortAxisLabel(log.WebsiteURL)
      }));
  }, [logs, selectedTarget]);

  if (!logs || logs.length === 0) return null;

  const rawMax = Math.max(...chartPoints.map(p => Number(p.LatencyMS) || 0), 1400);
  const maxLatency = Math.ceil(rawMax / 200) * 200;

  const toVisualPct = (ms) => {
    if (ms <= 0) return 10;
    const ratio = Math.min(1, ms / maxLatency);
    return Math.min(100, Math.max(14, Math.pow(ratio, 0.58) * 100));
  };

  const slaThresholdMs = 1200;
  const slaVisualPct = toVisualPct(slaThresholdMs);
  const midLabelVal = Math.round(maxLatency * 0.25);

  return (
    <div className="latency-chart-card" style={{ overflow: 'visible' }}>
      <style>{`
        @keyframes cpBarRise {
          0% {
            transform: scaleY(0);
            opacity: 0.35;
          }
          100% {
            transform: scaleY(1);
            opacity: 1;
          }
        }
        .cp-animated-bar {
          transform-origin: bottom center;
          animation: cpBarRise 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
          transition: filter 0.18s ease, transform 0.18s ease, box-shadow 0.18s ease, outline 0.18s ease;
        }
      `}</style>

      {/* Header + Target Selector + Legend */}
      <div
        className="chart-header"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <BarChart3 size={18} className="chart-icon" />
          <h3 className="chart-title" style={{ whiteSpace: 'nowrap' }}>
            {selectedTarget === 'ALL'
              ? 'Latest Endpoint Latency Comparison (ms)'
              : `Latency Trend: ${getWebsiteDisplayName(selectedTarget)}`}
          </h3>

          <select
            value={selectedTarget}
            onChange={(e) => setSelectedTarget(e.target.value)}
            style={{
              background: '#0f172a',
              color: '#e2e8f0',
              border: '1px solid rgba(148, 163, 184, 0.25)',
              borderRadius: '8px',
              padding: '4px 10px',
              fontSize: '12px',
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            <option value="ALL">All Endpoints (Latest)</option>
            {uniqueTargets.map(url => (
              <option key={url} value={url}>
                {getWebsiteDisplayName(url)} ({url.replace(/^https?:\/\//, '')})
              </option>
            ))}
          </select>
        </div>

        <div className="chart-legend" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', fontSize: '11px' }}>
          <div className="legend-item">
            <span className="legend-dot dot-green"></span>
            <span>&lt;1.1s Optimal</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot dot-yellow"></span>
            <span>1.1–2.5s Moderate</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot dot-red"></span>
            <span>&gt;2.5s / Down</span>
          </div>
        </div>
      </div>

      {/* Responsive Bar Plot */}
      <div
        style={{
          position: 'relative',
          height: '215px',
          padding: '24px 14px 34px 52px',
          userSelect: 'none'
        }}
      >
        {/* Horizontal Gridlines */}
        {[
          { pct: 100, label: `${maxLatency}ms` },
          { pct: 50, label: `${midLabelVal}ms` },
          { pct: 0, label: '0ms' }
        ].map((line) => (
          <div
            key={line.pct}
            style={{
              position: 'absolute',
              left: '52px',
              right: '14px',
              bottom: `calc(34px + ${(line.pct / 100) * 150}px)`,
              borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
              pointerEvents: 'none'
            }}
          >
            <span
              style={{
                position: 'absolute',
                left: '-46px',
                top: '-7px',
                width: '40px',
                textAlign: 'right',
                fontSize: '10px',
                color: '#64748b',
                fontFamily: 'monospace'
              }}
            >
              {line.label}
            </span>
          </div>
        ))}

        {/* 1200ms SLA Threshold Line */}
        {maxLatency >= slaThresholdMs && (
          <div
            style={{
              position: 'absolute',
              left: '52px',
              right: '14px',
              bottom: `calc(34px + ${(slaVisualPct / 100) * 150}px)`,
              borderBottom: '1px dashed rgba(245, 158, 11, 0.5)',
              pointerEvents: 'none',
              zIndex: 2
            }}
          >
            <span
              style={{
                position: 'absolute',
                right: '2px',
                top: '-17px',
                fontSize: '10px',
                fontWeight: 600,
                color: '#fbbf24',
                background: 'rgba(15, 23, 42, 0.88)',
                padding: '1px 6px',
                borderRadius: '4px',
                fontFamily: 'monospace'
              }}
            >
              1200ms SLA
            </span>
          </div>
        )}

        {/* Bars Container */}
        <div
          key={`${selectedTarget}-${chartPoints.length}`}
          style={{
            position: 'relative',
            height: '150px',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            gap: '6px',
            zIndex: 3
          }}
        >
          {chartPoints.map((point, idx) => {
            const latency = Number(point.LatencyMS) || 0;
            const isDown = !point.IsUp;
            const heightPct = isDown ? 24 : toVisualPct(latency);
            const isCriticalSlow = latency > 2500;
            const isModerate = latency >= 1100 && latency <= 2500;

            let barBackground = 'linear-gradient(180deg, rgba(16, 185, 129, 0.92) 0%, rgba(5, 150, 105, 0.45) 100%)';
            let topCapColor = '#34d399';
            let glowColor = 'rgba(16, 185, 129, 0.45)';
            let activeOutline = '1.5px solid rgba(52, 211, 153, 0.85)';

            if (isDown || isCriticalSlow) {
              barBackground = 'linear-gradient(180deg, rgba(244, 63, 94, 0.92) 0%, rgba(190, 18, 60, 0.45) 100%)';
              topCapColor = '#fda4af';
              glowColor = 'rgba(244, 63, 94, 0.45)';
              activeOutline = '1.5px solid rgba(253, 164, 175, 0.85)';
            } else if (isModerate) {
              barBackground = 'linear-gradient(180deg, rgba(245, 158, 11, 0.92) 0%, rgba(217, 119, 6, 0.45) 100%)';
              topCapColor = '#fcd34d';
              glowColor = 'rgba(245, 158, 11, 0.45)';
              activeOutline = '1.5px solid rgba(252, 211, 77, 0.85)';
            }

            const isHovered = hoveredIdx === idx;

            return (
              <div
                key={`${point.WebsiteURL}-${idx}`}
                style={{
                  position: 'relative',
                  flex: '1 1 0%',
                  minWidth: 0,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                  alignItems: 'center'
                }}
              >
                {/* Hover Tooltip */}
                {isHovered && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: `calc(${heightPct}% + 24px)`,
                      left: idx < 2 ? '0' : idx > chartPoints.length - 3 ? 'auto' : '50%',
                      right: idx > chartPoints.length - 3 ? '0' : 'auto',
                      transform: idx < 2 || idx > chartPoints.length - 3 ? 'none' : 'translateX(-50%)',
                      background: '#0f172a',
                      border: '1px solid rgba(148, 163, 184, 0.35)',
                      borderRadius: '8px',
                      padding: '8px 10px',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.7)',
                      whiteSpace: 'nowrap',
                      zIndex: 40,
                      pointerEvents: 'none'
                    }}
                  >
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#f8fafc', marginBottom: '2px' }}>
                      {getWebsiteDisplayName(point.WebsiteURL)}
                    </div>
                    <div style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '4px' }}>
                      {point.WebsiteURL}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontFamily: 'monospace' }}>
                      <span style={{ color: '#cbd5e1' }}>{latency}ms</span>
                      <span style={{ color: isDown ? '#fb7185' : '#34d399', fontWeight: 700 }}>
                        {isDown ? `DOWN (${point.StatusCode})` : `UP (${point.StatusCode || 200})`}
                      </span>
                      {point.Timestamp && (
                        <span style={{ color: '#64748b' }}>
                          {formatTimeIST(point.Timestamp)} IST
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Value / Error Micro-Label */}
                <span
                  style={{
                    fontSize: '10px',
                    fontFamily: 'monospace',
                    color: isDown ? '#fb7185' : isHovered ? '#f8fafc' : '#94a3b8',
                    marginBottom: '4px',
                    fontWeight: isDown || isHovered ? 600 : 400,
                    pointerEvents: 'none'
                  }}
                >
                  {isDown ? 'ERR' : latency}
                </span>

                {/* Bar Element */}
                <div
                  className="cp-animated-bar"
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  style={{
                    width: '72%',
                    maxWidth: '30px',
                    minWidth: '10px',
                    height: `${heightPct}%`,
                    background: barBackground,
                    borderTop: `2px solid ${topCapColor}`,
                    borderRadius: '6px 6px 2px 2px',
                    cursor: 'pointer',
                    filter: isHovered ? 'brightness(1.22)' : 'none',
                    transform: isHovered ? 'scaleY(1.04)' : 'scaleY(1)',
                    outline: isHovered ? activeOutline : 'none',
                    boxShadow: isHovered ? `0 0 16px ${glowColor}` : 'none',
                    animationDelay: `${idx * 25}ms`
                  }}
                />

                {/* X-Axis Label */}
                <span
                  style={{
                    position: 'absolute',
                    bottom: '-22px',
                    fontSize: '10px',
                    color: isHovered ? '#f8fafc' : '#64748b',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '100%',
                    textAlign: 'center',
                    pointerEvents: 'none'
                  }}
                >
                  {point.xLabel}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}