"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { listAllEmployeeDaily } from "@/services/intelligenceService";
import {
  appDisplayName,
  categoryColor,
  categoryDisplayName,
  categoryPercentages,
  deriveDailyMetrics,
  formatDuration,
  productivityColor,
  productivityDisplayName,
  productivityLabel,
  productivityPercentages,
  topEntries,
} from "@/lib/intelligence/derived";
import { prettyDayKey } from "@/lib/intelligence/keys";
import type { EmployeeBehaviorDaily } from "@/lib/intelligence/types";
import { EmptyState, Kpi, LoadingBars, Panel } from "./shared";

function dayOffset(d: Date, days: number): Date {
  const c = new Date(d);
  c.setUTCDate(c.getUTCDate() + days);
  return c;
}

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10).replace(/-/g, "");
}

interface Props {
  companyId: string;
}

export function WorkforceTab({ companyId }: Props) {
  const [daysBack, setDaysBack] = useState(0);
  const [data, setData] = useState<EmployeeBehaviorDaily[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const targetDate = useMemo(() => dayOffset(new Date(), -daysBack), [daysBack]);

  useEffect(() => {
    if (!companyId) return;
    let alive = true;
    setLoading(true);
    setError(null);
    listAllEmployeeDaily(companyId, targetDate)
      .then((rows) => {
        if (!alive) return;
        setData(rows);
        setLoading(false);
      })
      .catch((e) => {
        if (!alive) return;
        setError(e?.message || "Gagal memuat data");
        setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [companyId, targetDate]);

  const summary = useMemo(() => {
    let prodSum = 0,
      prodTot = 0,
      activeSec = 0,
      idleSec = 0,
      sessions = 0,
      anomalies = 0,
      switches = 0;
    const cats: Record<string, number> = {};
    const apps: Record<string, number> = {};
    const dist: Record<string, number> = {};
    for (const r of data) {
      const c = r.counters;
      prodSum += c.productivityWeightedSum || 0;
      prodTot += c.productivityTotalSeconds || 0;
      activeSec += c.totalActiveSeconds || 0;
      idleSec += c.totalIdleSeconds || 0;
      sessions += c.sessionCount || 0;
      anomalies += c.anomalyCount || 0;
      switches += c.switchCount || 0;
      for (const [k, v] of Object.entries(r.categories || {}))
        if (typeof v === "number") cats[k] = (cats[k] || 0) + v;
      for (const [k, v] of Object.entries(r.appUsage || {}))
        if (typeof v === "number") apps[k] = (apps[k] || 0) + v;
      for (const [k, v] of Object.entries(r.productivityDistribution || {}))
        if (typeof v === "number") dist[k] = (dist[k] || 0) + v;
    }
    return {
      total: data.length,
      productivityScore: prodTot > 0 ? prodSum / prodTot : 0,
      activeSec,
      idleSec,
      sessions,
      anomalies,
      switches,
      cats: categoryPercentages(cats),
      topApps: topEntries(apps, 8),
      dist: productivityPercentages(dist),
    };
  }, [data]);

  const ranked = useMemo(() => {
    return data
      .map((r) => ({ raw: r, m: deriveDailyMetrics(r) }))
      .sort((a, b) => b.m.productivityScore - a.m.productivityScore);
  }, [data]);

  return (
    <div className="wf">
      <div className="head">
        <p>Aggregate harian seluruh karyawan dari <code>employee_behavior_daily</code>.</p>
        <div className="dp">
          <button onClick={() => setDaysBack(daysBack + 1)} title="Hari sebelumnya">
            <span className="material-icons">chevron_left</span>
          </button>
          <div>
            <div className="dl">
              {daysBack === 0 ? "Hari ini" : daysBack === 1 ? "Kemarin" : `${daysBack} hari lalu`}
            </div>
            <div className="di">{prettyDayKey(dayKey(targetDate))}</div>
          </div>
          <button
            onClick={() => setDaysBack(Math.max(0, daysBack - 1))}
            disabled={daysBack === 0}
            title="Hari berikutnya"
          >
            <span className="material-icons">chevron_right</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="error">
          <span className="material-icons">error</span>
          {error}
        </div>
      )}

      <div className="kpi-grid">
        <Kpi
          icon="trending_up"
          label="Skor Produktivitas"
          value={loading ? "—" : summary.productivityScore.toFixed(1)}
          sub={!loading ? productivityLabel(summary.productivityScore) : undefined}
          color="#7c3aed"
        />
        <Kpi
          icon="people_alt"
          label="Karyawan Tercatat"
          value={loading ? "—" : summary.total}
          sub={`${summary.sessions} sesi`}
          color="#3b82f6"
        />
        <Kpi
          icon="schedule"
          label="Total Jam Aktif"
          value={loading ? "—" : formatDuration(summary.activeSec)}
          sub={`Idle ${formatDuration(summary.idleSec)}`}
          color="#10b981"
        />
        <Kpi
          icon="warning_amber"
          label="Anomali"
          value={loading ? "—" : summary.anomalies}
          sub={`${summary.switches} switch`}
          color="#f59e0b"
        />
      </div>

      <div className="grid-2">
        <Panel title="Distribusi Kategori Aktivitas" icon="pie_chart">
          {loading ? (
            <LoadingBars rows={4} />
          ) : summary.cats.length === 0 ? (
            <EmptyState icon="pie_chart_outline" />
          ) : (
            <div className="dist">
              {summary.cats.map((c) => (
                <div key={c.key} className="drow">
                  <div className="dhead">
                    <div className="ddot" style={{ background: categoryColor(c.key) }} />
                    <span className="dname">{categoryDisplayName(c.key)}</span>
                    <span className="dpct">{c.pct.toFixed(1)}%</span>
                  </div>
                  <div className="dbar">
                    <div
                      className="dfill"
                      style={{ width: `${c.pct}%`, background: categoryColor(c.key) }}
                    />
                  </div>
                  <div className="dtime">{formatDuration(c.seconds)}</div>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Mode Produktivitas" icon="psychology">
          {loading ? (
            <LoadingBars rows={4} />
          ) : summary.dist.length === 0 ? (
            <EmptyState icon="psychology_alt" />
          ) : (
            <div className="dist">
              {summary.dist.map((c) => (
                <div key={c.key} className="drow">
                  <div className="dhead">
                    <div className="ddot" style={{ background: productivityColor(c.key) }} />
                    <span className="dname">{productivityDisplayName(c.key)}</span>
                    <span className="dpct">{c.pct.toFixed(1)}%</span>
                  </div>
                  <div className="dbar">
                    <div
                      className="dfill"
                      style={{ width: `${c.pct}%`, background: productivityColor(c.key) }}
                    />
                  </div>
                  <div className="dtime">{formatDuration(c.seconds)}</div>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>

      <Panel title="Top Aplikasi" icon="apps">
        {loading ? (
          <LoadingBars rows={2} />
        ) : summary.topApps.length === 0 ? (
          <EmptyState icon="apps" />
        ) : (
          <div className="apps">
            {summary.topApps.map((a) => (
              <div key={a.key} className="atile">
                <div className="aname">{appDisplayName(a.key)}</div>
                <div className="atime">{formatDuration(a.seconds)}</div>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Panel title="Ranking Karyawan" icon="leaderboard">
        {loading ? (
          <LoadingBars rows={6} />
        ) : ranked.length === 0 ? (
          <EmptyState icon="emoji_events" message="Belum ada agregat untuk hari ini." />
        ) : (
          <div className="rank-list">
            {ranked.map((r, i) => {
              const score = r.m.productivityScore;
              const color =
                score >= 70 ? "#10b981" : score >= 50 ? "#3b82f6" : score >= 30 ? "#f59e0b" : "#ef4444";
              return (
                <Link
                  key={r.raw.userId}
                  href={`/admin/intelligence/employee/${encodeURIComponent(r.raw.userId)}`}
                  className="rrow"
                >
                  <div className="rno">{i + 1}</div>
                  <div className="rinfo">
                    <div className="rid">{r.raw.userId}</div>
                    <div className="rmeta">
                      {formatDuration(r.m.activeHours * 3600)} aktif · {r.m.sessionCount} sesi
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
                  <span className="material-icons chev">chevron_right</span>
                </Link>
              );
            })}
          </div>
        )}
      </Panel>

      <style jsx>{`
        .wf { display: flex; flex-direction: column; gap: 16px; }

        .head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 14px;
          flex-wrap: wrap;
        }
        .head p { font-size: 12px; color: #64748b; margin: 0; }
        .head code { background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-size: 11px; }

        .dp {
          display: flex;
          align-items: center;
          gap: 10px;
          background: white;
          border: 1px solid #f1f5f9;
          border-radius: 10px;
          padding: 4px 8px;
        }
        .dp button {
          background: #f8fafc;
          border: none;
          width: 28px;
          height: 28px;
          border-radius: 6px;
          color: #475569;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }
        .dp button:hover:not(:disabled) {
          background: #ede9fe;
          color: #6d28d9;
        }
        .dp button:disabled { opacity: 0.4; cursor: not-allowed; }
        .dl { font-size: 12px; font-weight: 700; color: #0f172a; }
        .di { font-size: 10px; color: #94a3b8; font-family: 'JetBrains Mono', monospace; }

        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 12px;
        }

        .grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        @media (max-width: 1100px) { .grid-2 { grid-template-columns: 1fr; } }

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
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 10px;
        }
        .atile {
          background: linear-gradient(135deg, #f5f3ff, #f0f9ff);
          border: 1px solid #ede9fe;
          padding: 12px;
          border-radius: 10px;
        }
        .aname { font-weight: 700; font-size: 13px; color: #1e293b; }
        .atime { font-size: 12px; color: #6d28d9; font-weight: 700; margin-top: 4px; }

        .rank-list { display: flex; flex-direction: column; gap: 8px; }
        .rrow {
          display: grid;
          grid-template-columns: 32px 1fr auto auto;
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
        .rrow:hover { border-color: #c4b5fd; background: white; }
        .rno {
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
        .chev { color: #cbd5e1; }

        .error {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #b91c1c;
          padding: 12px 16px;
          border-radius: 10px;
          display: flex;
          gap: 10px;
          align-items: center;
          font-size: 13px;
        }
      `}</style>
    </div>
  );
}
