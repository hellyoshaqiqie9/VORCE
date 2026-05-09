"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useCompanyId } from "@/lib/intelligence/useCompanyId";
import { subscribeLivePresence } from "@/services/intelligenceService";
import {
  appDisplayName,
  categoryColor,
  categoryDisplayName,
  presenceLabel,
} from "@/lib/intelligence/derived";
import type { LivePresence } from "@/lib/intelligence/types";

type FilterState = "all" | "active" | "idle" | "away";

function timeAgo(d: Date): string {
  const sec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (sec < 10) return "baru saja";
  if (sec < 60) return `${sec}d lalu`;
  if (sec < 3600) return `${Math.floor(sec / 60)}m lalu`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}j lalu`;
  return `${Math.floor(sec / 86400)}h lalu`;
}

export default function LiveMonitoringPage() {
  const { companyId, loading: cidLoading } = useCompanyId();
  const [rows, setRows] = useState<LivePresence[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterState>("all");
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!companyId) return;
    setLoading(true);
    const unsub = subscribeLivePresence(
      companyId,
      (data) => {
        setRows(data);
        setLoading(false);
      },
      (e) => {
        setError(e.message || "Gagal memuat data");
        setLoading(false);
      }
    );
    return () => unsub();
  }, [companyId]);

  const counts = useMemo(() => {
    const c = { all: rows.length, active: 0, idle: 0, away: 0 };
    for (const r of rows) {
      if (r.state === "active") c.active++;
      else if (r.state === "idle") c.idle++;
      else if (r.state === "away") c.away++;
    }
    return c;
  }, [rows]);

  const filtered = useMemo(() => {
    let out = rows;
    if (filter !== "all") out = out.filter((r) => r.state === filter);
    const s = search.trim().toLowerCase();
    if (s)
      out = out.filter(
        (r) =>
          r.userName?.toLowerCase().includes(s) ||
          r.userEmail?.toLowerCase().includes(s) ||
          r.currentApp?.toLowerCase().includes(s) ||
          r.activeWindow?.toLowerCase().includes(s)
      );
    return out;
  }, [rows, filter, search]);

  return (
    <div className="live-page">
      <header className="page-head">
        <div>
          <h1>Pemantauan Realtime</h1>
          <p>
            Subscribe langsung ke <code>live_presence</code> — diperbarui setiap
            ~20 detik oleh agent.
          </p>
        </div>
        <div className="live-pill">
          <span className="live-dot" />
          LIVE
        </div>
      </header>

      <div className="filter-bar">
        {([
          ["all", "Semua", counts.all],
          ["active", "Aktif", counts.active],
          ["idle", "Idle", counts.idle],
          ["away", "Away", counts.away],
        ] as const).map(([v, label, count]) => (
          <button
            key={v}
            className={`filter-tab ${filter === v ? "active" : ""}`}
            onClick={() => setFilter(v)}
          >
            {label}
            <span className="count">{count}</span>
          </button>
        ))}
        <div className="search">
          <span className="material-icons">search</span>
          <input
            type="text"
            placeholder="Cari nama, email, atau aplikasi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <div className="error-state">
          <span className="material-icons">error</span>
          {error}
        </div>
      )}

      {(cidLoading || loading) && !rows.length ? (
        <div className="presence-grid">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="card skeleton" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <span className="material-icons">sensors_off</span>
          <h3>Belum ada perangkat aktif</h3>
          <p>
            Agent VORCE belum melaporkan presence. Pastikan aplikasi desktop
            terinstal &amp; pengguna login.
          </p>
        </div>
      ) : (
        <div className="presence-grid">
          {filtered.map((r) => (
            <PresenceCard key={r.deviceId} row={r} />
          ))}
        </div>
      )}

      <style jsx>{`
        .live-page { display: flex; flex-direction: column; gap: 24px; }

        .page-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
        }
        .page-head h1 { font-size: 24px; font-weight: 700; color: #0f172a; margin: 0 0 6px; }
        .page-head p { font-size: 13px; color: #64748b; margin: 0; }
        .page-head code {
          background: #f1f5f9;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 12px;
        }

        .live-pill {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 14px;
          background: #ecfdf5;
          border: 1px solid #a7f3d0;
          color: #047857;
          border-radius: 99px;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.5px;
        }
        .live-dot {
          width: 8px;
          height: 8px;
          background: #10b981;
          border-radius: 50%;
          animation: pulse 1.5s infinite;
        }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }

        .filter-bar {
          display: flex;
          align-items: center;
          gap: 10px;
          background: white;
          padding: 8px;
          border-radius: 14px;
          border: 1px solid #f1f5f9;
          flex-wrap: wrap;
        }
        .filter-tab {
          background: transparent;
          border: none;
          padding: 8px 14px;
          border-radius: 10px;
          font-family: inherit;
          font-weight: 600;
          font-size: 13px;
          color: #64748b;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: all 0.15s;
        }
        .filter-tab:hover { background: #f8fafc; color: #1e293b; }
        .filter-tab.active { background: #f5f3ff; color: #6d28d9; }
        .filter-tab .count {
          background: #e2e8f0;
          color: #475569;
          padding: 2px 8px;
          border-radius: 99px;
          font-size: 11px;
          font-weight: 700;
        }
        .filter-tab.active .count { background: #ddd6fe; color: #6d28d9; }

        .search {
          margin-left: auto;
          display: flex;
          align-items: center;
          gap: 8px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 6px 12px;
          flex: 1;
          min-width: 200px;
          max-width: 320px;
        }
        .search .material-icons { color: #94a3b8; font-size: 18px; }
        .search input {
          border: none;
          background: transparent;
          width: 100%;
          font-size: 13px;
          font-family: inherit;
          color: #0f172a;
        }
        .search input:focus { outline: none; }

        .presence-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 16px;
        }

        .card.skeleton {
          background: white;
          border: 1px solid #f1f5f9;
          border-radius: 16px;
          height: 180px;
          animation: shimmer 1.2s infinite alternate;
        }
        @keyframes shimmer { from { opacity: 0.6; } to { opacity: 1; } }

        .empty-state, .error-state {
          background: white;
          border: 1px solid #f1f5f9;
          border-radius: 16px;
          padding: 48px;
          text-align: center;
          color: #64748b;
        }
        .empty-state .material-icons {
          font-size: 56px;
          color: #cbd5e1;
          margin-bottom: 12px;
        }
        .empty-state h3 { color: #0f172a; margin: 0 0 6px; }
        .empty-state p { font-size: 13px; margin: 0; max-width: 380px; margin-inline: auto; }

        .error-state {
          background: #fef2f2;
          border-color: #fecaca;
          color: #b91c1c;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px 20px;
          text-align: left;
        }
      `}</style>
    </div>
  );
}

function PresenceCard({ row }: { row: LivePresence }) {
  const stateColor =
    row.state === "active" ? "#10b981" : row.state === "idle" ? "#f59e0b" : "#94a3b8";
  const initials = (row.userName || row.userEmail || "?")
    .trim()
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");
  const lastBeat = row.lastHeartbeat?.toDate?.() ?? null;

  return (
    <Link
      href={`/admin/intelligence/device/${encodeURIComponent(row.deviceId)}`}
      className="card"
    >
      <div className="card-head">
        <div className="avatar">
          {initials || "?"}
          <div className="avatar-dot" style={{ background: stateColor }} />
        </div>
        <div className="who">
          <div className="name">{row.userName || row.userEmail || "Tidak diketahui"}</div>
          <div className="email">{row.userEmail}</div>
        </div>
        <div className="state-pill" style={{ color: stateColor, borderColor: `${stateColor}50`, background: `${stateColor}10` }}>
          {presenceLabel(row.state)}
        </div>
      </div>

      <div className="now">
        <span
          className="cat-tag"
          style={{
            background: `${categoryColor(row.currentCategory)}1a`,
            color: categoryColor(row.currentCategory),
          }}
        >
          {categoryDisplayName(row.currentCategory)}
        </span>
        <div className="app">{appDisplayName(row.currentApp)}</div>
        {row.activeWindow && (
          <div className="window" title={row.activeWindow}>
            {row.activeWindow}
          </div>
        )}
      </div>

      <div className="metrics">
        <Metric label="CPU" value={row.cpuNow ?? 0} suffix="%" />
        <Metric label="RAM" value={row.ramNow ?? 0} suffix="%" />
        <Metric label="Health" value={row.healthScore ?? 0} suffix="" tone="health" />
      </div>

      <div className="card-foot">
        <span className="material-icons">schedule</span>
        {lastBeat ? `Update ${timeAgo(lastBeat)}` : "Belum ada heartbeat"}
      </div>

      <style jsx>{`
        .card {
          display: flex;
          flex-direction: column;
          gap: 14px;
          padding: 20px;
          background: white;
          border: 1px solid #f1f5f9;
          border-radius: 16px;
          color: inherit;
          text-decoration: none;
          transition: all 0.2s;
        }
        .card:hover {
          border-color: #c4b5fd;
          box-shadow: 0 12px 28px rgba(124,58,237,0.08);
          transform: translateY(-2px);
        }

        .card-head { display: flex; align-items: center; gap: 12px; }
        .avatar {
          width: 44px; height: 44px;
          border-radius: 50%;
          background: linear-gradient(135deg, #7c3aed, #4f46e5);
          color: white;
          display: flex; align-items: center; justify-content: center;
          font-weight: 700;
          font-size: 14px;
          position: relative;
          flex-shrink: 0;
        }
        .avatar-dot {
          position: absolute;
          bottom: -2px; right: -2px;
          width: 14px; height: 14px;
          border-radius: 50%;
          border: 2px solid white;
        }
        .who { flex: 1; min-width: 0; }
        .name {
          font-weight: 700;
          color: #0f172a;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .email {
          font-size: 12px;
          color: #94a3b8;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .state-pill {
          padding: 4px 10px;
          border-radius: 99px;
          border: 1px solid;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.3px;
          text-transform: uppercase;
        }

        .now { display: flex; flex-direction: column; gap: 6px; }
        .cat-tag {
          align-self: flex-start;
          padding: 3px 10px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }
        .app {
          font-weight: 600;
          color: #1e293b;
          font-size: 14px;
        }
        .window {
          font-size: 12px;
          color: #64748b;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .metrics {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
        }

        .card-foot {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          color: #94a3b8;
          padding-top: 4px;
          border-top: 1px dashed #f1f5f9;
        }
        .card-foot .material-icons { font-size: 14px; }
      `}</style>
    </Link>
  );
}

function Metric({
  label,
  value,
  suffix,
  tone,
}: {
  label: string;
  value: number;
  suffix: string;
  tone?: "health";
}) {
  const v = Math.round(value || 0);
  let color = "#64748b";
  if (tone === "health") {
    color = v >= 70 ? "#10b981" : v >= 40 ? "#f59e0b" : "#ef4444";
  } else {
    color = v >= 80 ? "#ef4444" : v >= 60 ? "#f59e0b" : "#10b981";
  }
  return (
    <div className="metric">
      <div className="metric-bar">
        <div className="metric-fill" style={{ width: `${Math.min(100, v)}%`, background: color }} />
      </div>
      <div className="metric-row">
        <span className="metric-label">{label}</span>
        <span className="metric-val" style={{ color }}>
          {v}{suffix}
        </span>
      </div>
      <style jsx>{`
        .metric { display: flex; flex-direction: column; gap: 4px; }
        .metric-bar {
          height: 6px;
          background: #f1f5f9;
          border-radius: 99px;
          overflow: hidden;
        }
        .metric-fill {
          height: 100%;
          border-radius: 99px;
          transition: width 0.3s ease;
        }
        .metric-row {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
        }
        .metric-label { color: #94a3b8; font-weight: 600; }
        .metric-val { font-weight: 700; }
      `}</style>
    </div>
  );
}
