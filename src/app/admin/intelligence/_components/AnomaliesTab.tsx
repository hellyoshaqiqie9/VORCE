"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { subscribeRecentAnomalies } from "@/services/intelligenceService";
import { severityColor } from "@/lib/intelligence/derived";
import type { AnomalyEvent } from "@/lib/intelligence/types";
import { EmptyState, LoadingBars } from "./shared";

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

const SEV_LABEL: Record<string, string> = {
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

interface Props {
  companyId: string;
}

export function AnomaliesTab({ companyId }: Props) {
  const [hours, setHours] = useState<number>(24);
  const [items, setItems] = useState<AnomalyEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [severity, setSeverity] = useState<string>("");

  useEffect(() => {
    if (!companyId) return;
    setLoading(true);
    const unsub = subscribeRecentAnomalies(companyId, hours, (rows) => {
      setItems(rows);
      setLoading(false);
    });
    return () => unsub();
  }, [companyId, hours]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: items.length, low: 0, medium: 0, high: 0, critical: 0 };
    for (const a of items) c[a.severity] = (c[a.severity] || 0) + 1;
    return c;
  }, [items]);

  const filtered = severity ? items.filter((i) => i.severity === severity) : items;

  return (
    <div className="anom">
      <div className="ctrl">
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
        <div className="sev-pills">
          <button className={!severity ? "sp active" : "sp"} onClick={() => setSeverity("")}>
            Semua ({counts.all})
          </button>
          {(["critical", "high", "medium", "low"] as const).map((s) => {
            const color = severityColor(s);
            const count = counts[s] || 0;
            return (
              <button
                key={s}
                className={severity === s ? "sp active" : "sp"}
                style={
                  severity === s
                    ? {
                        background: `${color}15`,
                        color,
                        borderColor: `${color}55`,
                      }
                    : undefined
                }
                onClick={() => setSeverity(s)}
              >
                {SEV_LABEL[s]} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <LoadingBars rows={5} />
      ) : filtered.length === 0 ? (
        <EmptyState icon="verified" message="Tidak ada anomali dalam jendela waktu ini." />
      ) : (
        <div className="list">
          {filtered.map((a) => {
            const color = severityColor(a.severity);
            const icon = TYPE_ICON[a.type] || "warning_amber";
            const detected = a.detectedAt?.toDate?.() ?? new Date();
            const userLabel = a.userName || a.userEmail || a.userId;
            return (
              <div key={a.eventId} className="card" style={{ borderLeft: `3px solid ${color}` }}>
                <div className="ico" style={{ background: `${color}1a`, color }}>
                  <span className="material-icons">{icon}</span>
                </div>
                <div className="body">
                  <div className="head">
                    <h4>{TYPE_LABEL[a.type] || a.type}</h4>
                    <span className="sev" style={{ background: `${color}15`, color }}>
                      {SEV_LABEL[a.severity] || a.severity}
                    </span>
                    <span className="time">{timeAgo(detected)}</span>
                  </div>
                  <p className="desc">{a.description}</p>
                  <div className="meta">
                    <Link
                      href={`/admin/intelligence/employee/${encodeURIComponent(a.userId)}`}
                      className="ml"
                    >
                      <span className="material-icons">person</span>
                      {userLabel}
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
              </div>
            );
          })}
        </div>
      )}

      <style jsx>{`
        .anom { display: flex; flex-direction: column; gap: 14px; }

        .ctrl {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .window-tabs {
          display: flex;
          background: white;
          border: 1px solid #f1f5f9;
          border-radius: 10px;
          padding: 3px;
        }
        .wt {
          background: transparent;
          border: none;
          padding: 5px 12px;
          border-radius: 7px;
          font-family: inherit;
          font-weight: 800;
          font-size: 11px;
          color: #64748b;
          cursor: pointer;
        }
        .wt:hover { background: #f8fafc; color: #1e293b; }
        .wt.active { background: #f5f3ff; color: #6d28d9; }

        .sev-pills { display: flex; gap: 6px; flex-wrap: wrap; }
        .sp {
          background: white;
          border: 1px solid #e2e8f0;
          color: #64748b;
          padding: 5px 11px;
          border-radius: 99px;
          font-family: inherit;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s;
        }
        .sp:hover { border-color: #c4b5fd; }
        .sp.active { font-weight: 800; }

        .list { display: flex; flex-direction: column; gap: 9px; }

        .card {
          background: white;
          border: 1px solid #f1f5f9;
          border-radius: 12px;
          padding: 14px 16px;
          display: flex;
          gap: 12px;
        }
        .ico {
          width: 36px; height: 36px;
          border-radius: 9px;
          flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
        }
        .body { flex: 1; min-width: 0; }
        .head { display: flex; align-items: center; gap: 9px; flex-wrap: wrap; }
        h4 { margin: 0; font-size: 13px; font-weight: 700; color: #0f172a; }
        .sev {
          padding: 1px 9px;
          border-radius: 99px;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 0.4px;
          text-transform: uppercase;
        }
        .time { margin-left: auto; font-size: 10px; color: #94a3b8; }
        .desc { font-size: 12px; color: #475569; margin: 5px 0 8px; line-height: 1.5; }
        .meta { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
        .ml {
          display: inline-flex;
          align-items: center;
          gap: 3px;
          color: #6d28d9;
          font-size: 11px;
          font-weight: 700;
          text-decoration: none;
        }
        .ml:hover { text-decoration: underline; }
        .ml .material-icons { font-size: 13px; }
        .metric {
          font-size: 10px;
          font-weight: 700;
          color: #475569;
          background: #f1f5f9;
          padding: 2px 9px;
          border-radius: 99px;
          font-family: 'JetBrains Mono', monospace;
        }
      `}</style>
    </div>
  );
}
