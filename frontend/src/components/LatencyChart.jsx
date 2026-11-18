import { useState } from 'react';
import { BarChart3 } from 'lucide-react';

export default function LatencyChart({ logs }) {
  const [hoveredPoint, setHoveredPoint] = useState(null);

  if (!logs || logs.length === 0) return null;

  // Take the most recent 18-20 logs in chronological order (oldest to newest)
  const recentLogs = [...logs].reverse().slice(-18);

  // Find max latency for scaling
  const maxLatency = Math.max(...recentLogs.map(l => l.LatencyMS || 0), 600);
  const chartHeight = 140;
  const chartWidth = 720;
  const paddingX = 40;
  const paddingY = 25;

  const availableWidth = chartWidth - paddingX * 2;
  const availableHeight = chartHeight - paddingY * 2;

  // Thresholds
  const warningY = chartHeight - paddingY - (300 / maxLatency) * availableHeight;

  return (
    <div className="latency-chart-card">
      <div className="chart-header">
        <div className="chart-title-wrap">
          <BarChart3 size={18} className="chart-icon" />
          <h3 className="chart-title">Recent Telemetry Latency Trend (ms)</h3>
        </div>
        <div className="chart-legend">
          <div className="legend-item">
            <span className="legend-dot dot-green"></span>
            <span>&lt; 150ms Optimal</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot dot-yellow"></span>
            <span>150-300ms Warning</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot dot-red"></span>
            <span>&gt; 300ms Critical / 503</span>
          </div>
        </div>
      </div>

      <div className="chart-svg-container">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="latency-svg"
          preserveAspectRatio="none"
        >
          {/* Background grid lines */}
          <line
            x1={paddingX}
            y1={paddingY}
            x2={chartWidth - paddingX}
            y2={paddingY}
            className="grid-line"
          />
          <line
            x1={paddingX}
            y1={chartHeight / 2}
            x2={chartWidth - paddingX}
            y2={chartHeight / 2}
            className="grid-line"
          />
          <line
            x1={paddingX}
            y1={chartHeight - paddingY}
            x2={chartWidth - paddingX}
            y2={chartHeight - paddingY}
            className="grid-line"
          />

          {/* 300ms Warning Threshold Line */}
          {warningY > paddingY && warningY < chartHeight - paddingY && (
            <g className="threshold-group">
              <line
                x1={paddingX}
                y1={warningY}
                x2={chartWidth - paddingX}
                y2={warningY}
                className="threshold-line"
                strokeDasharray="4 4"
              />
              <text x={chartWidth - paddingX - 6} y={warningY - 4} className="threshold-text">
                300ms SLA
              </text>
            </g>
          )}

          {/* Y Axis Labels */}
          <text x={paddingX - 8} y={paddingY + 4} className="axis-label" textAnchor="end">
            {maxLatency}ms
          </text>
          <text x={paddingX - 8} y={chartHeight - paddingY + 3} className="axis-label" textAnchor="end">
            0ms
          </text>

          {/* Latency Bars */}
          {recentLogs.map((log, index) => {
            const barWidth = Math.max(6, Math.min(22, availableWidth / recentLogs.length - 8));
            const x = paddingX + (index * (availableWidth / (recentLogs.length - 1 || 1))) - (barWidth / 2);
            const latency = Math.min(log.LatencyMS || 0, maxLatency);
            const barHeight = Math.max(4, (latency / maxLatency) * availableHeight);
            const y = chartHeight - paddingY - barHeight;

            let barClass = 'bar-green';
            if (!log.IsUp || latency > 350) barClass = 'bar-red';
            else if (latency > 150) barClass = 'bar-yellow';

            const isHovered = hoveredPoint?.index === index;

            return (
              <g
                key={index}
                className="chart-bar-group"
                onMouseEnter={() => setHoveredPoint({ ...log, index, x, y })}
                onMouseLeave={() => setHoveredPoint(null)}
              >
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  rx="3"
                  className={`latency-bar ${barClass} ${isHovered ? 'bar-hover' : ''}`}
                />
                {/* Visual pulse for down or spiked */}
                {(!log.IsUp || latency > 500) && (
                  <circle
                    cx={x + barWidth / 2}
                    cy={y}
                    r="3.5"
                    className="spike-indicator"
                  />
                )}
              </g>
            );
          })}
        </svg>

        {/* Floating tooltip */}
        {hoveredPoint && (
          <div
            className="chart-tooltip"
            style={{
              left: `${(hoveredPoint.x / chartWidth) * 100}%`,
              top: `${Math.max(10, hoveredPoint.y - 45)}px`
            }}
          >
            <div className="tooltip-url">{hoveredPoint.WebsiteURL}</div>
            <div className="tooltip-stats">
              <span>{hoveredPoint.LatencyMS}ms</span>
              <span className={`tooltip-status ${hoveredPoint.IsUp ? 'up' : 'down'}`}>
                {hoveredPoint.IsUp ? 'UP' : `DOWN (${hoveredPoint.StatusCode})`}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
