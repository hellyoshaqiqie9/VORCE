"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  listAllEmployeeDaily,
  subscribeRecentAnomalies,
} from "@/services/intelligenceService";
import {
  appDisplayName,
  categoryColor,
  categoryDisplayName,
  categoryPercentages,
  deriveDailyMetrics,
  formatDuration,
  productivityLabel,
  severityColor,
  topEntries,
} from "@/lib/intelligence/derived";
import type {
  AnomalyEvent,
  EmployeeBehaviorDaily,
  LivePresence,
} from "@/lib/intelligence/types";
import { Avatar, EmptyState, Kpi, LoadingBars, Panel } from "./shared";

interface Props {
  companyId: string;
  presence: LivePresence[];
  presenceLoading: boolean;
  goLive: () => void;
  goAnomalies: () => void;
  goWorkforce: () => void;
}

const SEV_LABEL: Record<string, string> = {
  low: "Rendah",
  medium: "Sedang",
  high: "Tinggi",
  critical: "Kritis",
};

const TYPE_LABEL: Record<string, string> = {
  cpu_spike: "Lonjakan CPU",
  ram_pressure: "Tekanan RAM",
  high_switching: "Switching Tinggi",
  prolonged_idle: "Idle Berkepanjangan",
};

function timeAgo(d: Date): string {
  const sec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (sec < 60) return "baru saja";
  if (sec < 3600) return `${Math.floor(sec / 60)}m`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}j`;
  return `${Math.floor(sec / 86400)}h`;
}

export function OverviewTab({
  companyId,
  presence,
  presenceLoading,
  goLive,
  goAnomalies,
  goWorkforce,
}: Props) {
  const [aggregates, setAggregates] = useState<EmployeeBehaviorDaily[]>([]);
  const [aggLoading, setAggLoading] = useState(true);
  const [anomalies, setAnomalies] = useState<AnomalyEvent[]>([]);

  useEffect(() => {
    if (!companyId) return;
    setAggLoading(true);
    listAllEmployeeDaily(companyId)
      .then((rows) => setAggregates(rows))
      .finally(() => setAggLoading(false));
    const unsub = subscribeRecentAnomalies(companyId, 24, setAnomalies);
    return () => unsub();
  }, [companyId]);

  // Presence stats
  const onlineCount = presence.filter((p) => p.state === "active").length;
  const idleCount = presence.filter((p) => p.state === "idle").length;
  const awayCount = presence.filter((p) => p.state === "away").length;
  const cpuAvg = presence.length
    ? presence.reduce((s, p) => s + (p.cpuNow || 0), 0) / presence.length
    : 0;

  // Aggregate stats
  const summary = useMemo(() => {
    let prodSum = 0,
      prodTot = 0,
      activeSec = 0,
      sessions = 0;
    const cats: Record<string, number> = {};
    const apps: Record<string, number> = {};
    for (const r of aggregates) {
      const c = r.counters;
      prodSum += c.productivityWeightedSum || 0;
      prodTot += c.productivityTotalSeconds || 0;
      activeSec += c.totalActiveSeconds || 0;
      sessions += c.sessionCount || 0;
      for (const [k, v] of Object.entries(r.categories || {}))
        if (typeof v === "number") cats[k] = (cats[k] || 0) + v;
      for (const [k, v] of Object.entries(r.appUsage || {}))
        if (typeof v === "number") apps[k] = (apps[k] || 0) + v;
    }
    return {
      productivityScore: prodTot > 0 ? prodSum / prodTot : 0,
      activeSec,
      sessions,
      cats: categoryPercentages(cats).slice(0, 6),
      topApps: topEntries(apps, 6),
    };
  }, [aggregates]);

  // Top performers
  const topPerformers = useMemo(() => {
    return aggregates
      .map((r) => ({ raw: r, m: deriveDailyMetrics(r) }))
      .sort((a, b) => b.m.productivityScore - a.m.productivityScore)
      .slice(0, 5);
  }, [aggregates]);

  // Recent online employees
  const recentOnline = useMemo(() => {
    return presence
      .filter((p) => p.state === "active")
      .slice(0, 6);
  }, [presence]);

  const criticalAnoms = anomalies.filter(
    (a) => a.severity === "critical" || a.severity === "high"
  );

  return (
    <div className="overview">
      {/* KPI row */}
      <div className="kpi-grid">
        <Kpi
          icon="sensors"
          label="Aktif sekarang"
          value={presenceLoading ? "—" : onlineCount}
          sub={`${idleCount} idle · ${awayCount} away`}
          color="#10b981"
          pulse={onlineCount > 0}
        />
        <Kpi
          icon="trending_up"
          label="Skor Produktivitas"
          value={aggLoading ? "—" : summary.productivityScore.toFixed(1)}
          sub={!aggLoading ? productivityLabel(summary.productivityScore) : undefined}
          color="#7c3aed"
        />
        <Kpi
          icon="schedule"
          label="Total jam aktif hari ini"
          value={aggLoading ? "—" : formatDuration(summary.activeSec)}
          sub={`${summary.sessions} sesi`}
          color="#3b82f6"
        />
        <Kpi
          icon="memory"
          label="CPU rata-rata"
          value={presenceLoading ? "—" : `${cpuAvg.toFixed(0)}%`}
          sub={`${presence.length} perangkat`}
          color="#f59e0b"
        />
        <Kpi
          icon="warning_amber"
          label="Anomali kritis 24j"
          value={criticalAnoms.length}
          sub={`${anomalies.length} total`}
          color={criticalAnoms.length > 0 ? "#ef4444" : "#94a3b8"}
          pulse={criticalAnoms.length > 0}
        />
      </div>

      {/* Two-column body */}
      <div className="grid-2">
        <Panel
          title="Aktif Saat Ini"
          icon="bolt"
          action={
            <button className="link-btn" onClick={goLive}>
              Lihat semua
              <span className="material-icons">arrow_forward</span>
            </button>
          }
        >
          {presenceLoading && presence.length === 0 ? (
            <LoadingBars rows={4} />
          ) : recentOnline.length === 0 ? (
            <EmptyState icon="sensors_off" message="Tidak ada perangkat aktif." />
          ) : (
            <div className="online-list">
              {recentOnline.map((p) => (
                <div key={p.deviceId} className="oitem">
                  <Avatar name={p.userName || p.userEmail} state={p.state} size={36} />
                  <div className="oinfo">
                    <div className="oname">{p.userName || p.userEmail}</div>
                    <div className="oapp">
                      <span
                        className="ocat"
                        style={{
                          background: `${categoryColor(p.currentCategory)}1a`,
                          color: categoryColor(p.currentCategory),
                        }}
                      >
                        {categoryDisplayName(p.currentCategory)}
                      </span>
                      <span>{appDisplayName(p.currentApp)}</span>
                    </div>
                  </div>
                  <div className="ometric">
                    CPU <span style={{ color: (p.cpuNow ?? 0) >= 80 ? "#ef4444" : "#0f172a" }}>{Math.round(p.cpuNow ?? 0)}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel
          title="Anomali Terbaru"
          icon="warning_amber"
          action={
            <button className="link-btn" onClick={goAnomalies}>
              Semua
              <span className="material-icons">arrow_forward</span>
            </button>
          }
        >
          {anomalies.length === 0 ? (
            <EmptyState icon="verified" message="Tidak ada anomali dalam 24 jam terakhir." />
          ) : (
            <div className="anom-list">
              {anomalies.slice(0, 6).map((a) => {
                const color = severityColor(a.severity);
                const detected = a.detectedAt?.toDate?.() ?? new Date();
                return (
                  <div key={a.eventId} className="aitem" style={{ borderLeftColor: color }}>
                    <div className="aleft">
                      <div className="atitle">
                        {TYPE_LABEL[a.type] || a.type}
                        <span className="asev" style={{ background: `${color}15`, color }}>
                          {SEV_LABEL[a.severity] || a.severity}
                        </span>
                      </div>
                      <div className="adesc">{a.description}</div>
                      <div className="ameta">
                        {a.userName || a.userEmail || a.userId} · {timeAgo(detected)} lalu
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Panel>
      </div>

      <div className="grid-2">
        <Panel
          title="Top Performers Hari Ini"
          icon="leaderboard"
          action={
            <button className="link-btn" onClick={goWorkforce}>
              Workforce
              <span className="material-icons">arrow_forward</span>
            </button>
          }
        >
          {aggLoading ? (
            <LoadingBars rows={4} />
          ) : topPerformers.length === 0 ? (
            <EmptyState icon="trending_flat" message="Belum ada data agregat." />
          ) : (
            <div className="rank-list">
              {topPerformers.map((p, i) => {
                const score = p.m.productivityScore;
                const color =
                  score >= 70 ? "#10b981" : score >= 50 ? "#3b82f6" : "#f59e0b";
                return (
                  <Link
                    key={p.raw.userId}
                    href={`/admin/intelligence/employee/${encodeURIComponent(p.raw.userId)}`}
                    className="rank-row"
                  >
                    <div className="rank-no">{i + 1}</div>
                    <div className="rank-info">
                      <div className="rid">{p.raw.userId}</div>
                      <div className="rmeta">
                        {formatDuration(p.m.activeHours * 3600)} aktif · {p.m.sessionCount} sesi
                      </div>
                    </div>
                    <div className="rscore">
                      <div className="rnum" style={{ color }}>{score.toFixed(0)}</div>
                      <div className="rbar">
                        <div
                          className="rfill"
                          style={{ width: `${Math.min(100, score)}%`, background: color }}
                        />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </Panel>

        <Panel title="Distribusi Aktivitas Perusahaan" icon="pie_chart">
          {aggLoading ? (
            <LoadingBars rows={4} />
          ) : summary.cats.length === 0 ? (
            <EmptyState icon="pie_chart_outline" message="Belum ada data kategori." />
          ) : (
            <div className="dist">
              {summary.cats.map((c) => (
                <div key={c.key} className="drow">
                  <div className="dhead">
                    <div className="ddot" style={{ background: categoryColor(c.key) }} />
                    <span className="dname">{categoryDisplayName(c.key)}</span>
                    <span className="dpct">{c.pct.toFixed(0)}%</span>
                  </div>
                  <div className="dbar">
                    <div
                      className="dfill"
                      style={{
                        width: `${c.pct}%`,
                        background: categoryColor(c.key),
                      }}
                    />
                  </div>
                  <div className="dtime">{formatDuration(c.seconds)}</div>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>

      <Panel title="Aplikasi Paling Banyak Digunakan" icon="apps">
        {aggLoading ? (
          <LoadingBars rows={2} />
        ) : summary.topApps.length === 0 ? (
          <EmptyState icon="apps" message="Belum ada data aplikasi." />
        ) : (
          <div className="apps">
            {summary.topApps.map((a) => (
              <div key={a.key} className="app-tile">
                <div className="app-name">{appDisplayName(a.key)}</div>
                <div className="app-time">{formatDuration(a.seconds)}</div>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <style jsx>{`
        .overview { display: flex; flex-direction: column; gap: 18px; }

        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 14px;
        }

        .grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 18px;
        }
        @media (max-width: 1100px) { .grid-2 { grid-template-columns: 1fr; } }

        .link-btn {
          background: transparent;
          border: none;
          color: #6d28d9;
          font-family: inherit;
          font-weight: 700;
          font-size: 11px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 8px;
          border-radius: 6px;
          transition: background 0.15s;
        }
        .link-btn:hover { background: #f5f3ff; }
        .link-btn .material-icons { font-size: 14px; }

        .online-list, .anom-list, .rank-list { display: flex; flex-direction: column; gap: 10px; }

        .oitem {
          display: grid;
          grid-template-columns: auto 1fr auto;
          gap: 12px;
          align-items: center;
          padding: 8px 10px;
          background: #fafbfd;
          border: 1px solid #f1f5f9;
          border-radius: 10px;
        }
        .oinfo { min-width: 0; }
        .oname { font-weight: 700; font-size: 13px; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .oapp { display: flex; gap: 6px; font-size: 11px; color: #64748b; align-items: center; margin-top: 2px; }
        .ocat { padding: 1px 6px; border-radius: 4px; font-size: 9px; font-weight: 800; letter-spacing: 0.3px; text-transform: uppercase; }
        .ometric { font-size: 11px; color: #94a3b8; font-weight: 600; white-space: nowrap; }

        .aitem {
          padding: 10px 12px;
          background: #fafbfd;
          border: 1px solid #f1f5f9;
          border-left: 3px solid;
          border-radius: 8px;
        }
        .atitle { font-weight: 700; font-size: 12px; color: #0f172a; display: flex; align-items: center; gap: 8px; }
        .asev { font-size: 9px; padding: 1px 6px; border-radius: 99px; font-weight: 800; letter-spacing: 0.3px; text-transform: uppercase; }
        .adesc { font-size: 12px; color: #475569; margin-top: 4px; line-height: 1.5; }
        .ameta { font-size: 11px; color: #94a3b8; margin-top: 4px; }

        .rank-row {
          display: grid;
          grid-template-columns: 32px 1fr auto;
          gap: 12px;
          align-items: center;
          padding: 10px 12px;
          background: #fafbfd;
          border: 1px solid #f1f5f9;
          border-radius: 10px;
          text-decoration: none;
          color: inherit;
          transition: all 0.15s;
        }
        .rank-row:hover { border-color: #c4b5fd; background: white; }
        .rank-no {
          width: 28px; height: 28px;
          border-radius: 8px;
          background: #ede9fe;
          color: #6d28d9;
          display: flex; align-items: center; justify-content: center;
          font-weight: 800; font-size: 12px;
        }
        .rid { font-weight: 600; color: #0f172a; font-size: 12px; word-break: break-all; }
        .rmeta { font-size: 11px; color: #94a3b8; margin-top: 2px; }
        .rscore { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; min-width: 80px; }
        .rnum { font-size: 16px; font-weight: 800; line-height: 1; }
        .rbar { width: 70px; height: 4px; background: #f1f5f9; border-radius: 99px; overflow: hidden; }
        .rfill { height: 100%; transition: width 0.3s; }

        .dist { display: flex; flex-direction: column; gap: 12px; }
        .drow { display: grid; gap: 4px; }
        .dhead { display: flex; align-items: center; gap: 8px; }
        .ddot { width: 9px; height: 9px; border-radius: 50%; }
        .dname { font-size: 12px; font-weight: 600; color: #1e293b; flex: 1; }
        .dpct { font-size: 11px; font-weight: 700; color: #475569; }
        .dbar { height: 5px; background: #f1f5f9; border-radius: 99px; overflow: hidden; }
        .dfill { height: 100%; transition: width 0.3s; }
        .dtime { font-size: 10px; color: #94a3b8; padding-left: 17px; }

        .apps {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 10px;
        }
        .app-tile {
          background: linear-gradient(135deg, #f5f3ff, #f0f9ff);
          border: 1px solid #ede9fe;
          padding: 12px;
          border-radius: 10px;
        }
        .app-name { font-weight: 700; font-size: 13px; color: #1e293b; }
        .app-time { font-size: 12px; color: #6d28d9; font-weight: 700; margin-top: 4px; }
      `}</style>
    </div>
  );
}
