"use client";

import React from "react";

// ── Panel ────────────────────────────────────────────────────────────────
export function Panel({
  title,
  icon,
  action,
  pad = true,
  children,
}: {
  title?: string;
  icon?: string;
  action?: React.ReactNode;
  pad?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="ic-panel">
      {title && (
        <header>
          {icon && <span className="material-icons">{icon}</span>}
          <h3>{title}</h3>
          {action && <div className="action">{action}</div>}
        </header>
      )}
      <div className={pad ? "body" : "body nopad"}>{children}</div>
      <style jsx>{`
        .ic-panel {
          background: white;
          border: 1px solid #f1f5f9;
          border-radius: 16px;
          overflow: hidden;
        }
        header {
          display: flex; align-items: center; gap: 10px;
          padding: 14px 18px;
          border-bottom: 1px solid #f1f5f9;
          background: #fafbfd;
        }
        header .material-icons { color: #7c3aed; font-size: 19px; }
        h3 { margin: 0; font-size: 13px; font-weight: 700; color: #0f172a; letter-spacing: -0.2px; }
        .action { margin-left: auto; }
        .body { padding: 18px; }
        .body.nopad { padding: 0; }
      `}</style>
    </section>
  );
}

// ── KPI ──────────────────────────────────────────────────────────────────
export function Kpi({
  icon,
  label,
  value,
  sub,
  color,
  trend,
  pulse,
}: {
  icon: string;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
  trend?: { dir: "up" | "down" | "flat"; text?: string };
  pulse?: boolean;
}) {
  return (
    <div className="kpi">
      <div className="kpi-icon" style={{ background: `${color}1a`, color }}>
        <span className="material-icons">{icon}</span>
        {pulse && <span className="pulse" style={{ background: color }} />}
      </div>
      <div className="kpi-body">
        <div className="kpi-lbl">{label}</div>
        <div className="kpi-val">{value}</div>
        {(sub || trend) && (
          <div className="kpi-sub">
            {trend && (
              <span className={`trend ${trend.dir}`}>
                <span className="material-icons">
                  {trend.dir === "up"
                    ? "trending_up"
                    : trend.dir === "down"
                    ? "trending_down"
                    : "trending_flat"}
                </span>
                {trend.text}
              </span>
            )}
            {sub && <span>{sub}</span>}
          </div>
        )}
      </div>
      <style jsx>{`
        .kpi {
          background: white;
          border: 1px solid #f1f5f9;
          border-radius: 16px;
          padding: 18px;
          display: flex;
          gap: 14px;
          align-items: flex-start;
          transition: all 0.2s;
        }
        .kpi:hover {
          border-color: #e0e7ff;
          box-shadow: 0 6px 20px rgba(99, 102, 241, 0.06);
        }
        .kpi-icon {
          width: 42px; height: 42px;
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          position: relative;
        }
        .kpi-icon .material-icons { font-size: 22px; }
        .pulse {
          position: absolute;
          top: 4px; right: 4px;
          width: 7px; height: 7px;
          border-radius: 50%;
          animation: pulse 1.6s infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.6); }
        }
        .kpi-body { flex: 1; min-width: 0; }
        .kpi-lbl { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #94a3b8; margin-bottom: 6px; }
        .kpi-val { font-size: 22px; font-weight: 650; color: #0f172a; line-height: 1; letter-spacing: -0.35px; }
        .kpi-sub { font-size: 11px; color: #64748b; margin-top: 8px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .trend { display: inline-flex; align-items: center; gap: 2px; font-weight: 700; }
        .trend .material-icons { font-size: 14px; }
        .trend.up { color: #10b981; }
        .trend.down { color: #dc2626; }
        .trend.flat { color: #94a3b8; }
      `}</style>
    </div>
  );
}

// ── Empty/Loading ────────────────────────────────────────────────────────
export function EmptyState({
  icon = "inbox",
  title,
  message,
}: {
  icon?: string;
  title?: string;
  message?: string;
}) {
  return (
    <div className="empty">
      <span className="material-icons">{icon}</span>
      {title && <h4>{title}</h4>}
      {message && <p>{message}</p>}
      <style jsx>{`
        .empty {
          padding: 48px 32px;
          text-align: center;
          color: #94a3b8;
        }
        .empty .material-icons { font-size: 44px; color: #cbd5e1; }
        h4 { color: #0f172a; margin: 12px 0 4px; font-size: 14px; }
        p { font-size: 12px; margin: 0; max-width: 280px; margin-inline: auto; line-height: 1.6; }
      `}</style>
    </div>
  );
}

export function LoadingBars({ rows = 5 }: { rows?: number }) {
  return (
    <div className="lb">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="row" />
      ))}
      <style jsx>{`
        .lb { display: flex; flex-direction: column; gap: 8px; padding: 16px; }
        .row {
          height: 44px;
          background: linear-gradient(90deg, #f8fafc 25%, #f1f5f9 50%, #f8fafc 75%);
          background-size: 200% 100%;
          border-radius: 10px;
          animation: shim 1.4s infinite;
        }
        @keyframes shim { from { background-position: 200% 0; } to { background-position: -200% 0; } }
      `}</style>
    </div>
  );
}

// ── Avatar ───────────────────────────────────────────────────────────────
export function Avatar({
  name,
  state,
  size = 36,
}: {
  name: string;
  state?: "active" | "idle" | "away" | null;
  size?: number;
}) {
  const initials = (name || "?")
    .trim()
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");
  const dotColor =
    state === "active"
      ? "#10b981"
      : state === "idle"
      ? "#f59e0b"
      : state === "away"
      ? "#94a3b8"
      : null;
  const fontSize = Math.round(size * 0.36);
  const dotSize = Math.max(8, Math.round(size * 0.28));
  return (
    <div className="av" style={{ width: size, height: size, fontSize }}>
      {initials || "?"}
      {dotColor && (
        <span
          className="dot"
          style={{
            background: dotColor,
            width: dotSize,
            height: dotSize,
          }}
        />
      )}
      <style jsx>{`
        .av {
          border-radius: 50%;
          background: linear-gradient(135deg, #7c3aed, #4f46e5);
          color: white;
          display: flex; align-items: center; justify-content: center;
          font-weight: 700;
          flex-shrink: 0;
          position: relative;
        }
        .dot {
          position: absolute;
          bottom: 0; right: 0;
          border-radius: 50%;
          border: 2px solid white;
        }
      `}</style>
    </div>
  );
}

// ── Bar (telemetry) ──────────────────────────────────────────────────────
export function MeterBar({
  value,
  reverse,
  thresholdHigh,
  thresholdMid,
  showNumber = true,
  suffix = "",
}: {
  value: number;
  reverse?: boolean;
  thresholdHigh: number;
  thresholdMid: number;
  showNumber?: boolean;
  suffix?: string;
}) {
  const v = Math.round(value || 0);
  const color = reverse
    ? v >= thresholdHigh ? "#059669" : v >= thresholdMid ? "#d97706" : "#dc2626"
    : v >= thresholdHigh ? "#dc2626" : v >= thresholdMid ? "#d97706" : "#059669";
  return (
    <div className="mb">
      <div className="track">
        <div className="fill" style={{ width: `${Math.min(100, v)}%`, background: color }} />
      </div>
      {showNumber && (
        <div className="num" style={{ color }}>
          {v}{suffix}
        </div>
      )}
      <style jsx>{`
        .mb { display: flex; align-items: center; gap: 8px; min-width: 90px; }
        .track {
          flex: 1;
          height: 4px;
          background: #eef2f7;
          border-radius: 99px;
          overflow: hidden;
        }
        .fill { height: 100%; transition: width 0.4s ease; border-radius: 99px; opacity: 0.88; }
        .num { font-weight: 600; font-size: 10px; min-width: 28px; text-align: right; font-variant-numeric: tabular-nums; }
      `}</style>
    </div>
  );
}

// ── Section heading ──────────────────────────────────────────────────────
export function SectionTitle({
  icon,
  title,
  subtitle,
  action,
}: {
  icon?: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="st">
      {icon && (
        <div className="ic">
          <span className="material-icons">{icon}</span>
        </div>
      )}
      <div className="text">
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {action && <div className="action">{action}</div>}
      <style jsx>{`
        .st { display: flex; align-items: center; gap: 14px; }
        .ic {
          width: 36px; height: 36px;
          background: linear-gradient(135deg, #ede9fe, #f0fdf4);
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
        }
        .ic .material-icons { color: #6d28d9; font-size: 18px; }
        .text { flex: 1; min-width: 0; }
        h2 { font-size: 18px; font-weight: 700; color: #0f172a; margin: 0; letter-spacing: -0.3px; }
        p { font-size: 12px; color: #64748b; margin: 2px 0 0; }
      `}</style>
    </div>
  );
}
