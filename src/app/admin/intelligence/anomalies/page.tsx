"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useCompanyId } from "@/lib/intelligence/useCompanyId";
import { subscribeRecentAnomalies } from "@/services/intelligenceService";
import { severityColor } from "@/lib/intelligence/derived";
import type { AnomalyEvent } from "@/lib/intelligence/types";

const TYPE_ICON: Record<string, string> = {
  cpu_spike: "memory",
  ram_pressure: "dns",
  high_switching: "swap_horiz",
  prolonged_idle: "snooze",
};

const TYPE_LABEL: Record<string, string> = {
  cpu_spike: "Lonjakan CPU",
  ram_pressure: "Tekanan RAM",
  high_switching: "Switching Tinggi",
  prolonged_idle: "Idle Berkepanjangan",
};

const SEVERITY_LABEL: Record<string, string> = {
  low: "Rendah",
  medium: "Sedang",
  high: "Tinggi",
  critical: "Kritis",
};

function timeAgo(d: Date): string {
  const sec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (sec < 60) return "baru saja";
  if (sec < 3600) return `${Math.floor(sec / 60)}m lalu`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}j lalu`;
  return d.toLocaleString("id-ID");
}

const HOURS_OPTIONS = [1, 6, 24, 72] as const;

export default function AnomaliesPage() {
  const { companyId, loading: cidLoading } = useCompanyId();
  const [hours, setHours] = useState<number>(24);
  const [items, setItems] = useState<AnomalyEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [severity, setSeverity] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!companyId) return;
    setLoading(true);
    const unsub = subscribeRecentAnomalies(
      companyId,
      hours,
      (rows) => {
        setItems(rows);
        setLoading(false);
      },
      (e) => {
        setError(e.message || "Gagal memuat anomali");
        setLoading(false);
      }
    );
    return () => unsub();
  }, [companyId, hours]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: items.length, low: 0, medium: 0, high: 0, critical: 0 };
    for (const a of items) c[a.severity] = (c[a.severity] || 0) + 1;
    return c;
  }, [items]);

  const filtered = severity
    ? items.filter((i) => i.severity === severity)
    : items;

  return (
    <div className="anom-page">
      <header className="page-head">
        <div>
          <h1>Pemantauan Anomali</h1>
          <p>
            Kejadian anomali dari pipeline deteksi agent — disubscribe via{" "}
            <code>onSnapshot(anomaly_events)</code>.
          </p>
        </div>
        <div className="window-tabs">
          {HOURS_OPTIONS.map((h) => (
            <button
              key={h}
              className={hours === h ? "wt active" : "wt"}
              onClick={() => setHours(h)}
            >
              {h}j
            </button>
          ))}
        </div>
      </header>

      {error && (
        <div className="error">
          <span className="material-icons">error</span>
          {error}
        </div>
      )}

      <div className="sev-grid">
        <SevCard
          label="Total"
          count={counts.all || 0}
          color="#7c3aed"
          icon="warning_amber"
          active={!severity}
          onClick={() => setSeverity("")}
        />
        <SevCard
          label="Kritis"
          count={counts.critical || 0}
          color="#7f1d1d"
          icon="dangerous"
          active={severity === "critical"}
          onClick={() => setSeverity("critical")}
        />
        <SevCard
          label="Tinggi"
          count={counts.high || 0}
          color="#ef4444"
          icon="error"
          active={severity === "high"}
          onClick={() => setSeverity("high")}
        />
        <SevCard
          label="Sedang"
          count={counts.medium || 0}
          color="#f59e0b"
          icon="warning"
          active={severity === "medium"}
          onClick={() => setSeverity("medium")}
        />
        <SevCard
          label="Rendah"
          count={counts.low || 0}
          color="#10b981"
          icon="info"
          active={severity === "low"}
          onClick={() => setSeverity("low")}
        />
      </div>

      {loading || cidLoading ? (
        <div className="placeholder">Memuat anomali...</div>
      ) : filtered.length === 0 ? (
        <div className="placeholder">
          <span className="material-icons">verified</span>
          <p>Tidak ada anomali dalam jendela waktu ini.</p>
        </div>
      ) : (
        <div className="list">
          {filtered.map((a) => (
            <AnomCard key={a.eventId} a={a} />
          ))}
        </div>
      )}

      <style jsx>{`
        .anom-page { display: flex; flex-direction: column; gap: 24px; }

        .page-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
        }
        .page-head h1 { font-size: 24px; font-weight: 700; color: #0f172a; margin: 0 0 6px; }
        .page-head p { font-size: 13px; color: #64748b; margin: 0; }
        .page-head code { background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-size: 12px; }

        .window-tabs {
          display: flex;
          background: white;
          border: 1px solid #f1f5f9;
          border-radius: 12px;
          padding: 4px;
        }
        .wt {
          background: transparent;
          border: none;
          padding: 6px 14px;
          border-radius: 8px;
          font-family: inherit;
          font-weight: 700;
          font-size: 12px;
          color: #64748b;
          cursor: pointer;
          transition: all 0.15s;
        }
        .wt:hover { background: #f8fafc; color: #1e293b; }
        .wt.active { background: #f5f3ff; color: #6d28d9; }

        .sev-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 12px;
        }

        .list { display: flex; flex-direction: column; gap: 10px; }

        .placeholder {
          background: white;
          border: 1px solid #f1f5f9;
          border-radius: 16px;
          padding: 60px;
          text-align: center;
          color: #64748b;
        }
        .placeholder .material-icons { font-size: 56px; color: #cbd5e1; }
        .placeholder p { margin: 10px 0 0; }

        .error {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #b91c1c;
          padding: 14px 18px;
          border-radius: 12px;
          display: flex;
          gap: 10px;
          align-items: center;
        }
      `}</style>
    </div>
  );
}

function SevCard({
  label,
  count,
  color,
  icon,
  active,
  onClick,
}: {
  label: string;
  count: number;
  color: string;
  icon: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button className={`sev ${active ? "active" : ""}`} onClick={onClick} type="button">
      <div className="ico" style={{ background: `${color}1a`, color }}>
        <span className="material-icons">{icon}</span>
      </div>
      <div>
        <div className="num" style={{ color }}>{count}</div>
        <div className="lbl">{label}</div>
      </div>
      <style jsx>{`
        .sev {
          background: white;
          border: 1px solid #f1f5f9;
          padding: 14px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          font-family: inherit;
          text-align: left;
          transition: all 0.15s;
        }
        .sev:hover { border-color: #c4b5fd; }
        .sev.active { border-color: #7c3aed; box-shadow: 0 0 0 3px rgba(124,58,237,0.1); }
        .ico {
          width: 40px; height: 40px;
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
        }
        .num { font-size: 22px; font-weight: 800; line-height: 1; }
        .lbl { font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 4px; }
      `}</style>
    </button>
  );
}

function AnomCard({ a }: { a: AnomalyEvent }) {
  const sev = a.severity || "low";
  const color = severityColor(sev);
  const icon = TYPE_ICON[a.type] || "warning_amber";
  const label = TYPE_LABEL[a.type] || a.type;
  const detected = a.detectedAt?.toDate?.() ?? new Date();
  const userLabel = a.userName || a.userEmail || a.userId;

  return (
    <div className="anom-card" style={{ borderLeft: `4px solid ${color}` }}>
      <div className="ico" style={{ background: `${color}1a`, color }}>
        <span className="material-icons">{icon}</span>
      </div>
      <div className="body">
        <div className="head">
          <h4>{label}</h4>
          <span className="sev-pill" style={{ background: `${color}15`, color }}>
            {SEVERITY_LABEL[sev] || sev}
          </span>
          <span className="time">{timeAgo(detected)}</span>
        </div>
        <p className="desc">{a.description}</p>
        <div className="meta">
          <Link
            href={`/admin/intelligence/employee/${encodeURIComponent(a.userId)}`}
            className="meta-link"
          >
            <span className="material-icons">person</span>
            {userLabel}
          </Link>
          <Link
            href={`/admin/intelligence/device/${encodeURIComponent(a.deviceId)}`}
            className="meta-link"
          >
            <span className="material-icons">computer</span>
            Device
          </Link>
          {a.metricSnapshot?.cpu != null && (
            <span className="metric">CPU {Math.round(a.metricSnapshot.cpu)}%</span>
          )}
          {a.metricSnapshot?.ram != null && (
            <span className="metric">RAM {Math.round(a.metricSnapshot.ram)}%</span>
          )}
          {a.metricSnapshot?.switchCount != null && (
            <span className="metric">Switch ×{a.metricSnapshot.switchCount}</span>
          )}
        </div>
      </div>

      <style jsx>{`
        .anom-card {
          background: white;
          border: 1px solid #f1f5f9;
          border-radius: 14px;
          padding: 16px 18px;
          display: flex;
          gap: 14px;
        }
        .ico {
          width: 40px; height: 40px;
          border-radius: 10px;
          flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
        }
        .body { flex: 1; min-width: 0; }
        .head { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        h4 { margin: 0; font-size: 14px; font-weight: 700; color: #0f172a; }
        .sev-pill {
          padding: 2px 10px;
          border-radius: 99px;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }
        .time { margin-left: auto; font-size: 11px; color: #94a3b8; }
        .desc { font-size: 13px; color: #475569; margin: 6px 0 10px; line-height: 1.5; }
        .meta { display: flex; gap: 14px; flex-wrap: wrap; align-items: center; }
        .meta-link {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          color: #6d28d9;
          font-size: 12px;
          font-weight: 600;
          text-decoration: none;
        }
        .meta-link:hover { text-decoration: underline; }
        .meta-link .material-icons { font-size: 14px; }
        .metric {
          font-size: 11px;
          font-weight: 700;
          color: #475569;
          background: #f1f5f9;
          padding: 3px 10px;
          border-radius: 99px;
          font-family: 'JetBrains Mono', monospace;
        }
      `}</style>
    </div>
  );
}
