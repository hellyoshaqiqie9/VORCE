"use client";

import { useMemo, useState } from "react";
import {
  appDisplayName,
  categoryColor,
  categoryDisplayName,
  presenceLabel,
} from "@/lib/intelligence/derived";
import type { LivePresence } from "@/lib/intelligence/types";
import { Avatar, EmptyState, Kpi, LoadingBars, MeterBar } from "./shared";

type SortKey = "name" | "health" | "cpu" | "ram" | "state";

interface Props {
  presence: LivePresence[];
  loading: boolean;
  onSelectDevice: (d: LivePresence) => void;
}

export function DeviceHealthTab({ presence, loading, onSelectDevice }: Props) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("health");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const stats = useMemo(() => {
    const total = presence.length;
    const healthy = presence.filter((r) => (r.healthScore ?? 0) >= 70).length;
    const stressed = presence.filter(
      (r) => (r.cpuNow ?? 0) >= 80 || (r.ramNow ?? 0) >= 80
    ).length;
    const cpuAvg =
      total > 0 ? presence.reduce((s, r) => s + (r.cpuNow || 0), 0) / total : 0;
    const ramAvg =
      total > 0 ? presence.reduce((s, r) => s + (r.ramNow || 0), 0) / total : 0;
    return { total, healthy, stressed, cpuAvg, ramAvg };
  }, [presence]);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    let out = presence;
    if (s)
      out = out.filter(
        (r) =>
          r.userName?.toLowerCase().includes(s) ||
          r.userEmail?.toLowerCase().includes(s) ||
          r.deviceId.toLowerCase().includes(s) ||
          r.executable?.toLowerCase().includes(s)
      );
    out = [...out].sort((a, b) => {
      let av: any, bv: any;
      switch (sort) {
        case "name":
          av = (a.userName || a.userEmail || "").toLowerCase();
          bv = (b.userName || b.userEmail || "").toLowerCase();
          break;
        case "health":
          av = a.healthScore ?? 0;
          bv = b.healthScore ?? 0;
          break;
        case "cpu":
          av = a.cpuNow ?? 0;
          bv = b.cpuNow ?? 0;
          break;
        case "ram":
          av = a.ramNow ?? 0;
          bv = b.ramNow ?? 0;
          break;
        case "state":
          av = a.state;
          bv = b.state;
          break;
      }
      if (av === bv) return 0;
      const cmp = av > bv ? 1 : -1;
      return sortDir === "asc" ? cmp : -cmp;
    });
    return out;
  }, [presence, search, sort, sortDir]);

  function toggleSort(key: SortKey) {
    if (sort === key) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else {
      setSort(key);
      setSortDir(key === "name" ? "asc" : "desc");
    }
  }

  return (
    <div className="dh">
      <div className="kpi-grid">
        <Kpi icon="devices" label="Total Perangkat" value={stats.total} color="#3b82f6" />
        <Kpi icon="favorite" label="Sehat (≥70)" value={stats.healthy} color="#10b981" />
        <Kpi icon="warning" label="Beban Tinggi" value={stats.stressed} color="#ef4444" />
        <Kpi icon="memory" label="CPU rata-rata" value={`${stats.cpuAvg.toFixed(0)}%`} color="#7c3aed" />
        <Kpi icon="dns" label="RAM rata-rata" value={`${stats.ramAvg.toFixed(0)}%`} color="#06b6d4" />
      </div>

      <div className="search-bar">
        <span className="material-icons">search</span>
        <input
          placeholder="Cari nama, email, atau device ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading && presence.length === 0 ? (
        <LoadingBars rows={6} />
      ) : filtered.length === 0 ? (
        <EmptyState icon="desktop_access_disabled" message="Tidak ada perangkat ditemukan." />
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>
                  <button onClick={() => toggleSort("name")}>
                    Karyawan {sort === "name" && (sortDir === "asc" ? "▲" : "▼")}
                  </button>
                </th>
                <th>Perangkat</th>
                <th>Aplikasi</th>
                <th>
                  <button onClick={() => toggleSort("state")}>
                    Status {sort === "state" && (sortDir === "asc" ? "▲" : "▼")}
                  </button>
                </th>
                <th>
                  <button onClick={() => toggleSort("cpu")}>
                    CPU {sort === "cpu" && (sortDir === "asc" ? "▲" : "▼")}
                  </button>
                </th>
                <th>
                  <button onClick={() => toggleSort("ram")}>
                    RAM {sort === "ram" && (sortDir === "asc" ? "▲" : "▼")}
                  </button>
                </th>
                <th>
                  <button onClick={() => toggleSort("health")}>
                    Health {sort === "health" && (sortDir === "asc" ? "▲" : "▼")}
                  </button>
                </th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <Row key={r.deviceId} row={r} onClick={() => onSelectDevice(r)} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <style jsx>{`
        .dh { display: flex; flex-direction: column; gap: 16px; }

        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 12px;
        }

        .search-bar {
          display: flex;
          align-items: center;
          gap: 10px;
          background: white;
          border: 1px solid #f1f5f9;
          border-radius: 12px;
          padding: 8px 14px;
        }
        .search-bar .material-icons { color: #94a3b8; }
        .search-bar input {
          flex: 1;
          border: none;
          font-size: 13px;
          font-family: inherit;
          color: #0f172a;
        }
        .search-bar input:focus { outline: none; }

        .table-wrap {
          background: white;
          border: 1px solid #f1f5f9;
          border-radius: 14px;
          overflow: hidden;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
        }
        th, td {
          padding: 12px 14px;
          text-align: left;
          border-bottom: 1px solid #f1f5f9;
        }
        th {
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #94a3b8;
          background: #fafbfd;
        }
        th button {
          background: none;
          border: none;
          padding: 0;
          color: inherit;
          font: inherit;
          cursor: pointer;
          text-transform: inherit;
          letter-spacing: inherit;
        }
        tbody tr {
          transition: background 0.15s;
          cursor: pointer;
        }
        tbody tr:hover { background: #fafbfd; }
      `}</style>
    </div>
  );
}

function Row({ row, onClick }: { row: LivePresence; onClick: () => void }) {
  const stateColor =
    row.state === "active"
      ? "#10b981"
      : row.state === "idle"
      ? "#f59e0b"
      : "#94a3b8";
  return (
    <tr onClick={onClick}>
      <td>
        <div className="user-cell">
          <Avatar name={row.userName || row.userEmail} size={28} />
          <div>
            <div className="name">{row.userName || row.userEmail}</div>
            <div className="email">{row.userEmail}</div>
          </div>
        </div>
      </td>
      <td className="mono">
        <code title={row.deviceId}>{row.deviceId.slice(0, 12)}…</code>
      </td>
      <td>
        <span
          className="cat-tag"
          style={{
            background: `${categoryColor(row.currentCategory)}1a`,
            color: categoryColor(row.currentCategory),
          }}
        >
          {categoryDisplayName(row.currentCategory)}
        </span>
        <div className="app-name">{appDisplayName(row.currentApp)}</div>
      </td>
      <td>
        <span
          className="state-pill"
          style={{
            color: stateColor,
            borderColor: `${stateColor}55`,
            background: `${stateColor}10`,
          }}
        >
          {presenceLabel(row.state)}
        </span>
      </td>
      <td>
        <MeterBar value={row.cpuNow ?? 0} thresholdHigh={80} thresholdMid={60} suffix="%" />
      </td>
      <td>
        <MeterBar value={row.ramNow ?? 0} thresholdHigh={80} thresholdMid={60} suffix="%" />
      </td>
      <td>
        <MeterBar value={row.healthScore ?? 0} reverse thresholdHigh={70} thresholdMid={40} />
      </td>
      <td>
        <span className="material-icons chev">chevron_right</span>
      </td>
      <style jsx>{`
        .user-cell { display: flex; align-items: center; gap: 10px; }
        .name { font-weight: 600; color: #0f172a; }
        .email { font-size: 11px; color: #94a3b8; }
        .mono code {
          font-family: 'JetBrains Mono', 'SF Mono', monospace;
          font-size: 10px;
          color: #475569;
          background: #f1f5f9;
          padding: 2px 6px;
          border-radius: 4px;
        }
        .cat-tag {
          padding: 2px 8px;
          border-radius: 5px;
          font-size: 9px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.3px;
          display: inline-block;
        }
        .app-name { font-size: 11px; color: #475569; margin-top: 4px; }
        .state-pill {
          padding: 2px 9px;
          border-radius: 99px;
          border: 1px solid;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.3px;
          text-transform: uppercase;
        }
        .chev { color: #cbd5e1; font-size: 18px; }
      `}</style>
    </tr>
  );
}
