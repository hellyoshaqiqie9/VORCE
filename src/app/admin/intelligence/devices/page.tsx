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

type SortKey = "name" | "health" | "cpu" | "ram" | "state";

export default function DeviceIntelligencePage() {
  const { companyId, loading: cidLoading } = useCompanyId();
  const [rows, setRows] = useState<LivePresence[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("health");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    if (!companyId) return;
    setLoading(true);
    const unsub = subscribeLivePresence(companyId, (data) => {
      setRows(data);
      setLoading(false);
    });
    return () => unsub();
  }, [companyId]);

  const stats = useMemo(() => {
    const total = rows.length;
    const healthy = rows.filter((r) => (r.healthScore ?? 0) >= 70).length;
    const stressed = rows.filter((r) => (r.cpuNow ?? 0) >= 80 || (r.ramNow ?? 0) >= 80).length;
    const cpuAvg =
      total > 0 ? rows.reduce((s, r) => s + (r.cpuNow || 0), 0) / total : 0;
    const ramAvg =
      total > 0 ? rows.reduce((s, r) => s + (r.ramNow || 0), 0) / total : 0;
    return { total, healthy, stressed, cpuAvg, ramAvg };
  }, [rows]);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    let out = rows;
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
  }, [rows, search, sort, sortDir]);

  function toggleSort(key: SortKey) {
    if (sort === key) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else {
      setSort(key);
      setSortDir(key === "name" ? "asc" : "desc");
    }
  }

  return (
    <div className="dev-page">
      <header className="page-head">
        <div>
          <h1>Device Intelligence</h1>
          <p>Health score, beban CPU/RAM, dan status presence per perangkat.</p>
        </div>
      </header>

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

      {(cidLoading || loading) && !rows.length ? (
        <div className="placeholder">Memuat data perangkat...</div>
      ) : filtered.length === 0 ? (
        <div className="placeholder">
          <span className="material-icons">desktop_access_disabled</span>
          <p>Tidak ada perangkat ditemukan.</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="dev-table">
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
                <Row key={r.deviceId} row={r} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <style jsx>{`
        .dev-page { display: flex; flex-direction: column; gap: 24px; }

        .page-head h1 { font-size: 24px; font-weight: 700; color: #0f172a; margin: 0 0 6px; }
        .page-head p { font-size: 13px; color: #64748b; margin: 0; }

        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 14px;
        }

        .search-bar {
          display: flex;
          align-items: center;
          gap: 10px;
          background: white;
          border: 1px solid #f1f5f9;
          border-radius: 12px;
          padding: 10px 16px;
        }
        .search-bar .material-icons { color: #94a3b8; }
        .search-bar input {
          flex: 1;
          border: none;
          font-size: 14px;
          font-family: inherit;
          color: #0f172a;
        }
        .search-bar input:focus { outline: none; }

        .table-wrap {
          background: white;
          border: 1px solid #f1f5f9;
          border-radius: 16px;
          overflow: hidden;
        }
        .dev-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }
        .dev-table th, .dev-table td {
          padding: 14px 16px;
          text-align: left;
          border-bottom: 1px solid #f1f5f9;
        }
        .dev-table th {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #94a3b8;
          background: #fafbfd;
        }
        .dev-table th button {
          background: none;
          border: none;
          padding: 0;
          color: inherit;
          font: inherit;
          cursor: pointer;
          text-transform: inherit;
          letter-spacing: inherit;
        }
        .dev-table tbody tr { transition: background 0.15s; }
        .dev-table tbody tr:hover { background: #fafbfd; }

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
      `}</style>
    </div>
  );
}

function Kpi({
  icon,
  label,
  value,
  color,
}: {
  icon: string;
  label: string;
  value: number | string;
  color: string;
}) {
  return (
    <div className="kpi">
      <div className="kpi-icon" style={{ background: `${color}1a`, color }}>
        <span className="material-icons">{icon}</span>
      </div>
      <div>
        <div className="kpi-val">{value}</div>
        <div className="kpi-lbl">{label}</div>
      </div>
      <style jsx>{`
        .kpi {
          background: white;
          border: 1px solid #f1f5f9;
          border-radius: 14px;
          padding: 16px;
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .kpi-icon {
          width: 42px; height: 42px;
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
        }
        .kpi-val { font-size: 22px; font-weight: 800; color: #0f172a; }
        .kpi-lbl { font-size: 11px; color: #94a3b8; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
      `}</style>
    </div>
  );
}

function Row({ row }: { row: LivePresence }) {
  const stateColor =
    row.state === "active" ? "#10b981" : row.state === "idle" ? "#f59e0b" : "#94a3b8";
  const cpu = Math.round(row.cpuNow || 0);
  const ram = Math.round(row.ramNow || 0);
  const health = Math.round(row.healthScore || 0);
  const initials = (row.userName || row.userEmail || "?")
    .trim()
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");
  return (
    <tr>
      <td>
        <div className="user-cell">
          <div className="avatar">{initials || "?"}</div>
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
          style={{ color: stateColor, borderColor: `${stateColor}55`, background: `${stateColor}10` }}
        >
          {presenceLabel(row.state)}
        </span>
      </td>
      <td>
        <Bar value={cpu} thresholdHigh={80} thresholdMid={60} />
      </td>
      <td>
        <Bar value={ram} thresholdHigh={80} thresholdMid={60} />
      </td>
      <td>
        <Bar value={health} reversed thresholdHigh={70} thresholdMid={40} />
      </td>
      <td>
        <Link href={`/admin/intelligence/device/${encodeURIComponent(row.deviceId)}`} className="link">
          Detail
          <span className="material-icons">arrow_forward</span>
        </Link>
      </td>
      <style jsx>{`
        .user-cell { display: flex; align-items: center; gap: 10px; }
        .avatar {
          width: 32px; height: 32px;
          border-radius: 50%;
          background: linear-gradient(135deg, #7c3aed, #4f46e5);
          color: white;
          display: flex; align-items: center; justify-content: center;
          font-size: 12px; font-weight: 700;
        }
        .name { font-weight: 600; color: #0f172a; }
        .email { font-size: 11px; color: #94a3b8; }
        .mono code { font-family: 'JetBrains Mono', 'SF Mono', monospace; font-size: 11px; color: #475569; background: #f1f5f9; padding: 3px 6px; border-radius: 4px; }
        .cat-tag {
          padding: 3px 8px;
          border-radius: 5px;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          display: inline-block;
        }
        .app-name { font-size: 12px; color: #475569; margin-top: 4px; }
        .state-pill {
          padding: 3px 10px;
          border-radius: 99px;
          border: 1px solid;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.3px;
          text-transform: uppercase;
        }
        .link {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          color: #7c3aed;
          font-weight: 700;
          font-size: 12px;
          text-decoration: none;
        }
        .link:hover { color: #4c1d95; }
        .link .material-icons { font-size: 14px; }
      `}</style>
    </tr>
  );
}

function Bar({
  value,
  reversed,
  thresholdHigh,
  thresholdMid,
}: {
  value: number;
  reversed?: boolean;
  thresholdHigh: number;
  thresholdMid: number;
}) {
  let color = "#64748b";
  if (reversed) {
    // higher is better
    color =
      value >= thresholdHigh ? "#10b981" : value >= thresholdMid ? "#f59e0b" : "#ef4444";
  } else {
    // lower is better
    color =
      value >= thresholdHigh ? "#ef4444" : value >= thresholdMid ? "#f59e0b" : "#10b981";
  }
  return (
    <div className="bar">
      <div className="track">
        <div className="fill" style={{ width: `${Math.min(100, value)}%`, background: color }} />
      </div>
      <div className="num" style={{ color }}>
        {value}
      </div>
      <style jsx>{`
        .bar { display: flex; align-items: center; gap: 8px; min-width: 100px; }
        .track {
          flex: 1;
          height: 6px;
          background: #f1f5f9;
          border-radius: 99px;
          overflow: hidden;
        }
        .fill { height: 100%; border-radius: 99px; transition: width 0.3s; }
        .num { font-weight: 700; font-size: 12px; min-width: 28px; text-align: right; }
      `}</style>
    </div>
  );
}
