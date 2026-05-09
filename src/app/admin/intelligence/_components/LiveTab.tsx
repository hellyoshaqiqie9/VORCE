"use client";

import { useMemo, useState } from "react";
import {
  appDisplayName,
  categoryColor,
  categoryDisplayName,
  presenceLabel,
} from "@/lib/intelligence/derived";
import type { LivePresence } from "@/lib/intelligence/types";
import { Avatar, EmptyState, LoadingBars, MeterBar } from "./shared";

type FilterState = "all" | "active" | "idle" | "away";

function timeAgo(d: Date | null): string {
  if (!d) return "—";
  const sec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (sec < 10) return "baru saja";
  if (sec < 60) return `${sec}d`;
  if (sec < 3600) return `${Math.floor(sec / 60)}m`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}j`;
  return `${Math.floor(sec / 86400)}h`;
}

interface Props {
  presence: LivePresence[];
  loading: boolean;
  onSelectDevice: (d: LivePresence) => void;
}

export function LiveTab({ presence, loading, onSelectDevice }: Props) {
  const [filter, setFilter] = useState<FilterState>("all");
  const [search, setSearch] = useState("");

  const counts = useMemo(() => {
    const c = { all: presence.length, active: 0, idle: 0, away: 0 };
    for (const r of presence) {
      if (r.state === "active") c.active++;
      else if (r.state === "idle") c.idle++;
      else if (r.state === "away") c.away++;
    }
    return c;
  }, [presence]);

  const filtered = useMemo(() => {
    let out = presence;
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
  }, [presence, filter, search]);

  return (
    <div className="lt">
      <div className="filter-bar">
        {(
          [
            ["all", "Semua", counts.all],
            ["active", "Aktif", counts.active],
            ["idle", "Idle", counts.idle],
            ["away", "Away", counts.away],
          ] as const
        ).map(([v, label, count]) => (
          <button
            key={v}
            className={`pill ${filter === v ? "active" : ""}`}
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

      {loading && presence.length === 0 ? (
        <LoadingBars rows={6} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="sensors_off"
          title="Belum ada perangkat aktif"
          message="Agent VORCE belum melaporkan presence. Pastikan aplikasi desktop terinstal."
        />
      ) : (
        <div className="grid">
          {filtered.map((r) => (
            <Card key={r.deviceId} row={r} onClick={() => onSelectDevice(r)} />
          ))}
        </div>
      )}

      <style jsx>{`
        .lt { display: flex; flex-direction: column; gap: 16px; }

        .filter-bar {
          display: flex;
          align-items: center;
          gap: 8px;
          background: white;
          border: 1px solid #f1f5f9;
          border-radius: 14px;
          padding: 6px;
          flex-wrap: wrap;
        }
        .pill {
          background: transparent;
          border: none;
          padding: 7px 14px;
          border-radius: 9px;
          font-family: inherit;
          font-weight: 700;
          font-size: 12px;
          color: #64748b;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: all 0.15s;
        }
        .pill:hover { background: #f8fafc; color: #1e293b; }
        .pill.active { background: #f5f3ff; color: #6d28d9; }
        .count {
          background: #e2e8f0;
          color: #475569;
          padding: 1px 7px;
          border-radius: 99px;
          font-size: 10px;
          font-weight: 800;
        }
        .pill.active .count { background: #ddd6fe; color: #6d28d9; }
        .search {
          margin-left: auto;
          display: flex;
          align-items: center;
          gap: 6px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 5px 10px;
          flex: 1;
          min-width: 200px;
          max-width: 320px;
        }
        .search .material-icons { color: #94a3b8; font-size: 17px; }
        .search input {
          border: none;
          background: transparent;
          width: 100%;
          font-size: 12px;
          font-family: inherit;
          color: #0f172a;
        }
        .search input:focus { outline: none; }

        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(310px, 1fr));
          gap: 14px;
        }
      `}</style>
    </div>
  );
}

function Card({ row, onClick }: { row: LivePresence; onClick: () => void }) {
  const stateColor =
    row.state === "active"
      ? "#10b981"
      : row.state === "idle"
      ? "#f59e0b"
      : "#94a3b8";
  const lastBeat = row.lastHeartbeat?.toDate?.() ?? null;

  return (
    <button className="card" onClick={onClick} type="button">
      <div className="head">
        <Avatar name={row.userName || row.userEmail} state={row.state} size={40} />
        <div className="who">
          <div className="name">{row.userName || row.userEmail}</div>
          <div className="email">{row.userEmail}</div>
        </div>
        <div
          className="state"
          style={{
            color: stateColor,
            borderColor: `${stateColor}55`,
            background: `${stateColor}10`,
          }}
        >
          {presenceLabel(row.state)}
        </div>
      </div>

      <div className="now">
        <span
          className="cat"
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
        <div className="m">
          <span className="lbl">CPU</span>
          <MeterBar value={row.cpuNow ?? 0} thresholdHigh={80} thresholdMid={60} suffix="%" />
        </div>
        <div className="m">
          <span className="lbl">RAM</span>
          <MeterBar value={row.ramNow ?? 0} thresholdHigh={80} thresholdMid={60} suffix="%" />
        </div>
        <div className="m">
          <span className="lbl">Health</span>
          <MeterBar value={row.healthScore ?? 0} reverse thresholdHigh={70} thresholdMid={40} />
        </div>
      </div>

      <div className="foot">
        <span className="material-icons">schedule</span>
        {lastBeat ? `Update ${timeAgo(lastBeat)} lalu` : "Belum ada heartbeat"}
        <span className="material-icons chev">chevron_right</span>
      </div>

      <style jsx>{`
        .card {
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 16px;
          background: white;
          border: 1px solid #f1f5f9;
          border-radius: 14px;
          cursor: pointer;
          font-family: inherit;
          text-align: left;
          transition: all 0.2s;
        }
        .card:hover {
          border-color: #c4b5fd;
          box-shadow: 0 8px 24px rgba(124, 58, 237, 0.08);
          transform: translateY(-2px);
        }

        .head { display: flex; align-items: center; gap: 10px; }
        .who { flex: 1; min-width: 0; }
        .name {
          font-weight: 700;
          color: #0f172a;
          font-size: 13px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .email {
          font-size: 11px;
          color: #94a3b8;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .state {
          padding: 3px 9px;
          border-radius: 99px;
          border: 1px solid;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.3px;
          text-transform: uppercase;
        }

        .now { display: flex; flex-direction: column; gap: 4px; }
        .cat {
          align-self: flex-start;
          padding: 2px 8px;
          border-radius: 5px;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.3px;
          text-transform: uppercase;
        }
        .app { font-weight: 700; color: #1e293b; font-size: 13px; }
        .window {
          font-size: 11px;
          color: #64748b;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .metrics {
          display: flex;
          flex-direction: column;
          gap: 6px;
          padding-top: 6px;
          border-top: 1px dashed #f1f5f9;
        }
        .m { display: grid; grid-template-columns: 50px 1fr; gap: 10px; align-items: center; }
        .lbl { font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.3px; }

        .foot {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          color: #94a3b8;
        }
        .foot .material-icons { font-size: 13px; }
        .chev { margin-left: auto; }
      `}</style>
    </button>
  );
}
