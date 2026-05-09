"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useCompanyId } from "@/lib/intelligence/useCompanyId";
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
import type { EmployeeBehaviorDaily } from "@/lib/intelligence/types";
import { prettyDayKey } from "@/lib/intelligence/keys";

function dayOffset(d: Date, days: number): Date {
  const c = new Date(d);
  c.setUTCDate(c.getUTCDate() + days);
  return c;
}

export default function WorkforceAnalyticsPage() {
  const { companyId, loading: cidLoading } = useCompanyId();
  const [daysBack, setDaysBack] = useState(0); // 0 = today, 1 = yesterday
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
        setError(e.message || "Gagal memuat data");
        setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [companyId, targetDate]);

  // Aggregate company-wide metrics
  const summary = useMemo(() => {
    const total = data.length;
    let activeSec = 0,
      idleSec = 0,
      switches = 0,
      anomalies = 0,
      prodSum = 0,
      prodTot = 0,
      sessions = 0;
    const cats: Record<string, number> = {};
    const apps: Record<string, number> = {};
    const dist: Record<string, number> = {};
    for (const r of data) {
      const c = r.counters;
      activeSec += c.totalActiveSeconds || 0;
      idleSec += c.totalIdleSeconds || 0;
      switches += c.switchCount || 0;
      anomalies += c.anomalyCount || 0;
      prodSum += c.productivityWeightedSum || 0;
      prodTot += c.productivityTotalSeconds || 0;
      sessions += c.sessionCount || 0;
      for (const [k, v] of Object.entries(r.categories || {})) {
        if (typeof v === "number") cats[k] = (cats[k] || 0) + v;
      }
      for (const [k, v] of Object.entries(r.appUsage || {})) {
        if (typeof v === "number") apps[k] = (apps[k] || 0) + v;
      }
      for (const [k, v] of Object.entries(r.productivityDistribution || {})) {
        if (typeof v === "number") dist[k] = (dist[k] || 0) + v;
      }
    }
    return {
      total,
      activeSec,
      idleSec,
      switches,
      anomalies,
      productivityScore: prodTot > 0 ? prodSum / prodTot : 0,
      sessions,
      cats: categoryPercentages(cats),
      topApps: topEntries(apps, 8),
      dist: productivityPercentages(dist),
    };
  }, [data]);

  // Ranked employees
  const ranked = useMemo(() => {
    return data
      .map((r) => ({
        userId: r.userId,
        derived: deriveDailyMetrics(r),
        raw: r,
      }))
      .sort((a, b) => b.derived.productivityScore - a.derived.productivityScore);
  }, [data]);

  return (
    <div className="wf-page">
      <header className="page-head">
        <div>
          <h1>Workforce Analytics</h1>
          <p>
            Aggregate <code>employee_behavior_daily</code> seluruh karyawan untuk
            tanggal terpilih.
          </p>
        </div>
        <div className="date-picker">
          <button onClick={() => setDaysBack(daysBack + 1)} title="Hari sebelumnya">
            <span className="material-icons">chevron_left</span>
          </button>
          <div>
            <div className="date-label">{daysBack === 0 ? "Hari ini" : daysBack === 1 ? "Kemarin" : `${daysBack} hari lalu`}</div>
            <div className="date-iso">{prettyDayKey(targetDate.toISOString().slice(0, 10).replace(/-/g, ""))}</div>
          </div>
          <button
            onClick={() => setDaysBack(Math.max(0, daysBack - 1))}
            disabled={daysBack === 0}
            title="Hari berikutnya"
          >
            <span className="material-icons">chevron_right</span>
          </button>
        </div>
      </header>

      {error && (
        <div className="error">
          <span className="material-icons">error</span>
          {error}
        </div>
      )}

      <div className="kpi-grid">
        <BigKpi
          icon="trending_up"
          label="Skor produktivitas"
          value={summary.productivityScore.toFixed(1)}
          sub={productivityLabel(summary.productivityScore)}
          color="#7c3aed"
        />
        <BigKpi
          icon="people_alt"
          label="Karyawan tercatat"
          value={summary.total}
          sub={`${summary.sessions} sesi`}
          color="#3b82f6"
        />
        <BigKpi
          icon="schedule"
          label="Total jam aktif"
          value={formatDuration(summary.activeSec)}
          sub={`Idle ${formatDuration(summary.idleSec)}`}
          color="#10b981"
        />
        <BigKpi
          icon="warning_amber"
          label="Anomali hari ini"
          value={summary.anomalies}
          sub={`${summary.switches} window switch`}
          color="#f59e0b"
        />
      </div>

      <div className="two-col">
        <Panel title="Distribusi Kategori Aktivitas" icon="pie_chart">
          {summary.cats.length === 0 ? (
            <Empty />
          ) : (
            <div className="dist-list">
              {summary.cats.map((c) => (
                <div key={c.key} className="dist-row">
                  <div className="dist-head">
                    <div className="dot" style={{ background: categoryColor(c.key) }} />
                    <span className="dist-name">{categoryDisplayName(c.key)}</span>
                    <span className="dist-pct">{c.pct.toFixed(1)}%</span>
                  </div>
                  <div className="dist-bar">
                    <div
                      className="dist-fill"
                      style={{
                        width: `${c.pct}%`,
                        background: categoryColor(c.key),
                      }}
                    />
                  </div>
                  <div className="dist-time">{formatDuration(c.seconds)}</div>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Mode Produktivitas" icon="psychology">
          {summary.dist.length === 0 ? (
            <Empty />
          ) : (
            <div className="dist-list">
              {summary.dist.map((c) => (
                <div key={c.key} className="dist-row">
                  <div className="dist-head">
                    <div className="dot" style={{ background: productivityColor(c.key) }} />
                    <span className="dist-name">{productivityDisplayName(c.key)}</span>
                    <span className="dist-pct">{c.pct.toFixed(1)}%</span>
                  </div>
                  <div className="dist-bar">
                    <div
                      className="dist-fill"
                      style={{
                        width: `${c.pct}%`,
                        background: productivityColor(c.key),
                      }}
                    />
                  </div>
                  <div className="dist-time">{formatDuration(c.seconds)}</div>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>

      <Panel title="Top Aplikasi (jam digunakan)" icon="apps">
        {summary.topApps.length === 0 ? (
          <Empty />
        ) : (
          <div className="apps-grid">
            {summary.topApps.map((a) => (
              <div key={a.key} className="app-tile">
                <div className="app-name">{appDisplayName(a.key)}</div>
                <div className="app-time">{formatDuration(a.seconds)}</div>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Panel title="Ranking Karyawan" icon="leaderboard">
        {loading || cidLoading ? (
          <div className="loading">Memuat...</div>
        ) : ranked.length === 0 ? (
          <Empty message="Belum ada agregat untuk hari ini." />
        ) : (
          <div className="rank-list">
            {ranked.map((r, i) => (
              <Link
                key={r.userId}
                href={`/admin/intelligence/employee/${encodeURIComponent(r.userId)}`}
                className="rank-row"
              >
                <div className="rank-no">{i + 1}</div>
                <div className="rank-info">
                  <div className="rank-id">{r.userId}</div>
                  <div className="rank-meta">
                    {formatDuration(r.derived.activeHours * 3600)} aktif · {r.derived.sessionCount} sesi
                  </div>
                </div>
                <div className="rank-score">
                  <div className="score-num">{r.derived.productivityScore.toFixed(0)}</div>
                  <div className="score-bar">
                    <div
                      className="score-fill"
                      style={{
                        width: `${Math.min(100, r.derived.productivityScore)}%`,
                        background: productivityScoreColor(r.derived.productivityScore),
                      }}
                    />
                  </div>
                </div>
                <span className="material-icons chev">chevron_right</span>
              </Link>
            ))}
          </div>
        )}
      </Panel>

      <style jsx>{`
        .wf-page { display: flex; flex-direction: column; gap: 24px; }

        .page-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
        }
        .page-head h1 { font-size: 24px; font-weight: 700; color: #0f172a; margin: 0 0 6px; }
        .page-head p { font-size: 13px; color: #64748b; margin: 0; }
        .page-head code { background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-size: 12px; }

        .date-picker {
          display: flex;
          align-items: center;
          gap: 12px;
          background: white;
          border: 1px solid #f1f5f9;
          border-radius: 12px;
          padding: 6px 10px;
        }
        .date-picker button {
          background: #f8fafc;
          border: none;
          width: 32px; height: 32px;
          border-radius: 8px;
          color: #475569;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
        }
        .date-picker button:hover:not(:disabled) { background: #ede9fe; color: #6d28d9; }
        .date-picker button:disabled { opacity: 0.4; cursor: not-allowed; }
        .date-label { font-size: 13px; font-weight: 700; color: #0f172a; }
        .date-iso { font-size: 11px; color: #94a3b8; font-family: 'JetBrains Mono', monospace; }

        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 14px;
        }

        .two-col {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        @media (max-width: 900px) {
          .two-col { grid-template-columns: 1fr; }
        }

        .dist-list { display: flex; flex-direction: column; gap: 14px; }
        .dist-row { display: grid; grid-template-rows: auto auto; gap: 4px; }
        .dist-head { display: flex; align-items: center; gap: 8px; }
        .dot { width: 10px; height: 10px; border-radius: 50%; }
        .dist-name { font-weight: 600; color: #1e293b; font-size: 13px; flex: 1; }
        .dist-pct { font-size: 12px; font-weight: 700; color: #475569; }
        .dist-bar { height: 6px; background: #f1f5f9; border-radius: 99px; overflow: hidden; }
        .dist-fill { height: 100%; transition: width 0.3s; }
        .dist-time { font-size: 11px; color: #94a3b8; padding-left: 18px; }

        .apps-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 10px;
        }
        .app-tile {
          background: linear-gradient(135deg, #f5f3ff, #f8fafc);
          border: 1px solid #ede9fe;
          padding: 14px;
          border-radius: 12px;
        }
        .app-name { font-weight: 700; color: #1e293b; margin-bottom: 4px; }
        .app-time { font-size: 13px; color: #7c3aed; font-weight: 600; }

        .rank-list { display: flex; flex-direction: column; gap: 8px; }
        .rank-row {
          display: grid;
          grid-template-columns: 36px 1fr auto auto;
          align-items: center;
          gap: 14px;
          padding: 12px 14px;
          background: #fafbfd;
          border: 1px solid #f1f5f9;
          border-radius: 12px;
          text-decoration: none;
          color: inherit;
          transition: all 0.15s;
        }
        .rank-row:hover { border-color: #c4b5fd; background: white; }
        .rank-no {
          width: 32px; height: 32px;
          border-radius: 50%;
          background: #ede9fe;
          color: #6d28d9;
          display: flex; align-items: center; justify-content: center;
          font-weight: 700;
          font-size: 13px;
        }
        .rank-info { min-width: 0; }
        .rank-id { font-weight: 600; color: #0f172a; font-size: 13px; word-break: break-all; }
        .rank-meta { font-size: 11px; color: #94a3b8; margin-top: 2px; }
        .rank-score { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; min-width: 90px; }
        .score-num { font-size: 16px; font-weight: 800; color: #0f172a; }
        .score-bar { width: 80px; height: 4px; background: #f1f5f9; border-radius: 99px; overflow: hidden; }
        .score-fill { height: 100%; transition: width 0.3s; }
        .chev { color: #cbd5e1; }

        .loading {
          padding: 40px;
          text-align: center;
          color: #94a3b8;
          font-size: 13px;
        }

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

function productivityScoreColor(score: number): string {
  if (score >= 70) return "#10b981";
  if (score >= 50) return "#3b82f6";
  if (score >= 30) return "#f59e0b";
  return "#ef4444";
}

function BigKpi({
  icon,
  label,
  value,
  sub,
  color,
}: {
  icon: string;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
}) {
  return (
    <div className="kpi">
      <div className="kpi-icon" style={{ background: `${color}1a`, color }}>
        <span className="material-icons">{icon}</span>
      </div>
      <div className="kpi-body">
        <div className="kpi-lbl">{label}</div>
        <div className="kpi-val">{value}</div>
        {sub && <div className="kpi-sub">{sub}</div>}
      </div>
      <style jsx>{`
        .kpi {
          background: white;
          border: 1px solid #f1f5f9;
          border-radius: 16px;
          padding: 20px;
          display: flex;
          align-items: flex-start;
          gap: 14px;
        }
        .kpi-icon {
          width: 44px; height: 44px;
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .kpi-icon .material-icons { font-size: 22px; }
        .kpi-lbl { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #94a3b8; margin-bottom: 6px; }
        .kpi-val { font-size: 24px; font-weight: 800; color: #0f172a; line-height: 1; }
        .kpi-sub { font-size: 12px; color: #64748b; margin-top: 6px; }
      `}</style>
    </div>
  );
}

function Panel({
  title,
  icon,
  children,
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <section className="panel">
      <header>
        <span className="material-icons">{icon}</span>
        <h3>{title}</h3>
      </header>
      <div className="body">{children}</div>
      <style jsx>{`
        .panel {
          background: white;
          border: 1px solid #f1f5f9;
          border-radius: 16px;
          overflow: hidden;
        }
        header {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 16px 20px;
          border-bottom: 1px solid #f1f5f9;
          background: #fafbfd;
        }
        header .material-icons { color: #7c3aed; font-size: 20px; }
        h3 { margin: 0; font-size: 14px; font-weight: 700; color: #0f172a; }
        .body { padding: 20px; }
      `}</style>
    </section>
  );
}

function Empty({ message }: { message?: string }) {
  return (
    <div className="empty">
      <span className="material-icons">inbox</span>
      <p>{message || "Tidak ada data."}</p>
      <style jsx>{`
        .empty {
          padding: 40px;
          text-align: center;
          color: #94a3b8;
        }
        .empty .material-icons { font-size: 40px; color: #cbd5e1; }
        p { font-size: 13px; margin: 8px 0 0; }
      `}</style>
    </div>
  );
}
