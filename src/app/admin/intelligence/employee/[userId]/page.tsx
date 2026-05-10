"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useCompanyId } from "@/lib/intelligence/useCompanyId";
import {
  getEmployeeDaily,
  getEmployeeMonthly,
  getEmployeeRolling,
  getEmployeeWeekly,
  subscribeUserPresence,
} from "@/services/intelligenceService";
import {
  appDisplayName,
  categoryColor,
  categoryDisplayName,
  categoryPercentages,
  deriveDailyMetrics,
  formatDuration,
  presenceLabel,
  productivityColor,
  productivityDisplayName,
  productivityLabel,
  productivityPercentages,
  topEntries,
} from "@/lib/intelligence/derived";
import { prettyDayKey } from "@/lib/intelligence/keys";
import type {
  EmployeeBehaviorDaily,
  EmployeeBehaviorMonthly,
  EmployeeBehaviorRolling,
  EmployeeBehaviorWeekly,
  LivePresence,
} from "@/lib/intelligence/types";

// ── tiny colour helpers ──────────────────────────────────────────────────
function prodColor(score: number) {
  return score >= 70 ? "#059669" : score >= 45 ? "#d97706" : "#dc2626";
}
function healthColor(score: number) {
  return score >= 70 ? "#059669" : score >= 40 ? "#d97706" : "#dc2626";
}

type Period = "daily" | "weekly" | "monthly";

export default function EmployeeDetailPage() {
  const { userId: rawId } = useParams<{ userId: string }>();
  const userId = decodeURIComponent(rawId || "");
  const { companyId } = useCompanyId();

  const [period, setPeriod] = useState<Period>("daily");
  const [presence, setPresence] = useState<LivePresence | null>(null);
  const [rolling, setRolling] = useState<EmployeeBehaviorRolling | null>(null);
  const [daily, setDaily] = useState<EmployeeBehaviorDaily | null>(null);
  const [weekly, setWeekly] = useState<EmployeeBehaviorWeekly | null>(null);
  const [monthly, setMonthly] = useState<EmployeeBehaviorMonthly | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!companyId || !userId) return;
    let alive = true;
    setLoading(true);
    setError(null);
    Promise.all([
      getEmployeeDaily(companyId, userId),
      getEmployeeWeekly(companyId, userId),
      getEmployeeMonthly(companyId, userId),
      getEmployeeRolling(companyId, userId),
    ])
      .then(([d, w, m, r]) => {
        if (!alive) return;
        setDaily(d);
        setWeekly(w);
        setMonthly(m);
        setRolling(r);
        setLoading(false);
      })
      .catch((e) => {
        if (!alive) return;
        setError(e?.message || "Gagal memuat agregat");
        setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [companyId, userId]);

  useEffect(() => {
    if (!companyId || !userId) return;
    const unsub = subscribeUserPresence(companyId, userId, setPresence);
    return () => unsub();
  }, [companyId, userId]);

  const active: EmployeeBehaviorDaily | null =
    period === "daily" ? daily : period === "weekly" ? weekly : monthly;

  const derived = useMemo(() => (active ? deriveDailyMetrics(active) : null), [active]);
  const cats = useMemo(
    () => (active ? categoryPercentages(active.categories) : []),
    [active]
  );
  const dist = useMemo(
    () => (active ? productivityPercentages(active.productivityDistribution) : []),
    [active]
  );
  const apps = useMemo(
    () => (active ? topEntries(active.appUsage, 8) : []),
    [active]
  );

  const name = presence?.userName || presence?.userEmail || userId;
  const stateCol =
    presence?.state === "active" ? "#059669" :
    presence?.state === "idle"   ? "#d97706" : "#94a3b8";

  return (
    <div className="ed">
      {/* ── Breadcrumb ── */}
      <div className="breadcrumb">
        <Link href="/admin/intelligence" className="bc-link">
          <span className="material-icons">groups</span>
          Device Intelligence
        </Link>
        <span className="material-icons bc-sep">chevron_right</span>
        <span className="bc-cur">Employee Detail</span>
      </div>

      {/* ── Hero card ── */}
      <div className="hero">
        <div className="hero-left">
          <div className="avatar">
            {(name || "?").trim().split(" ").filter(Boolean).slice(0,2).map(s=>s[0]?.toUpperCase()).join("")}
            {presence && <span className="av-dot" style={{ background: stateCol }} />}
          </div>
          <div className="hero-info">
            <h1>{name}</h1>
            {presence?.userEmail && presence.userEmail !== name && (
              <div className="hero-email">{presence.userEmail}</div>
            )}
            <div className="hero-uid">
              <span className="material-icons">fingerprint</span>
              <code>{userId}</code>
            </div>
          </div>
        </div>

        <div className="hero-right">
          {/* Live presence card */}
          <div className="live-card" style={{ borderColor: `${stateCol}30`, background: `${stateCol}06` }}>
            <div className="live-header">
              <span className="live-dot" style={{ background: stateCol }} />
              <span className="live-state" style={{ color: stateCol }}>
                {presence ? presenceLabel(presence.state) : "Offline"}
              </span>
            </div>
            <div className="live-app">
              {presence ? appDisplayName(presence.currentApp) : "—"}
            </div>
            {presence?.activeWindow && (
              <div className="live-window">{presence.activeWindow}</div>
            )}
            {presence?.deviceId && (
              <Link
                href={`/admin/intelligence/device/${encodeURIComponent(presence.deviceId)}`}
                className="live-device-link"
              >
                <span className="material-icons">computer</span>
                Lihat perangkat
              </Link>
            )}
          </div>

          {/* Rolling stats */}
          {rolling && (
            <div className="rolling-stats">
              <div className="rs-item">
                <span className="rs-val">{rolling.totalSessions}</span>
                <span className="rs-lbl">Total Sesi</span>
              </div>
              <div className="rs-div" />
              <div className="rs-item">
                <span className="rs-val">{formatDuration(rolling.totalActiveSeconds)}</span>
                <span className="rs-lbl">Total Aktif</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Period selector ── */}
      <div className="period-bar">
        <div className="period-tabs">
          {(["daily", "weekly", "monthly"] as Period[]).map((p) => (
            <button
              key={p}
              className={period === p ? "ptab active" : "ptab"}
              onClick={() => setPeriod(p)}
            >
              {p === "daily" ? "Harian" : p === "weekly" ? "Mingguan" : "Bulanan"}
            </button>
          ))}
        </div>
        {active && (
          <span className="period-label">
            <span className="material-icons">calendar_today</span>
            {period === "daily" && active.date && prettyDayKey(active.date)}
            {period === "weekly" && (active as EmployeeBehaviorWeekly).weekKey}
            {period === "monthly" && (active as EmployeeBehaviorMonthly).monthKey}
          </span>
        )}
      </div>

      {error && (
        <div className="err-banner">
          <span className="material-icons">error_outline</span>
          {error}
        </div>
      )}

      {loading ? (
        <div className="loading-card">
          <div className="spinner" />
          <span>Memuat data analitik...</span>
        </div>
      ) : !active || !derived ? (
        <div className="empty-card">
          <span className="material-icons">bar_chart</span>
          <p>Belum ada data {period === "daily" ? "harian" : period === "weekly" ? "mingguan" : "bulanan"} untuk karyawan ini.</p>
        </div>
      ) : (
        <>
          {/* ── KPI strip ── */}
          <div className="kpi-strip">
            <StatCard
              icon="trending_up"
              label="Produktivitas"
              value={derived.productivityScore.toFixed(1)}
              sub={productivityLabel(derived.productivityScore)}
              color="#7c3aed"
            />
            <StatCard
              icon="schedule"
              label="Jam Aktif"
              value={formatDuration(derived.activeHours * 3600)}
              sub={`Idle ${formatDuration(derived.idleHours * 3600)}`}
              color="#059669"
            />
            <StatCard
              icon="psychology"
              label="Rasio Fokus"
              value={`${(derived.focusRatio * 100).toFixed(1)}%`}
              sub={`Terpecah ${(derived.fragmentedRatio * 100).toFixed(1)}%`}
              color="#3b82f6"
            />
            <StatCard
              icon="swap_horiz"
              label="Switch / Jam"
              value={derived.switchPerHour.toFixed(1)}
              sub={`${derived.sessionCount} sesi`}
              color="#d97706"
            />
            <StatCard
              icon="favorite"
              label="Health Score"
              value={derived.healthScore.toFixed(1)}
              sub=""
              color={healthColor(derived.healthScore)}
            />
            <StatCard
              icon="warning_amber"
              label="Anomali"
              value={derived.anomalyCount}
              sub=""
              color={derived.anomalyCount > 0 ? "#dc2626" : "#94a3b8"}
            />
          </div>

          {/* ── Trend charts ── */}
          {period === "weekly" && (active as EmployeeBehaviorWeekly).dailyTrend && (
            <DetailPanel title="Tren Harian — Minggu Ini" icon="show_chart">
              <TrendChart
                entries={Object.entries((active as EmployeeBehaviorWeekly).dailyTrend!).sort(([a],[b])=>a.localeCompare(b))}
                labelFn={(k) => k.slice(6,8)}
                secondsFn={(v) => v.totalActiveSeconds || 0}
                scoreFn={(v) => (v.productivityTotalSeconds||0)>0 ? (v.productivityWeightedSum||0)/(v.productivityTotalSeconds||1) : 0}
              />
            </DetailPanel>
          )}

          {period === "monthly" && (active as EmployeeBehaviorMonthly).weeklyTrend && (
            <DetailPanel title="Tren Mingguan — Bulan Ini" icon="show_chart">
              <TrendChart
                entries={Object.entries((active as EmployeeBehaviorMonthly).weeklyTrend!).sort(([a],[b])=>a.localeCompare(b))}
                labelFn={(k) => k.split("_").pop() || k}
                secondsFn={(v) => v.totalSeconds || 0}
                scoreFn={(v) => (v.productivityTotalSeconds||0)>0 ? (v.productivityWeightedSum||0)/(v.productivityTotalSeconds||1) : 0}
              />
            </DetailPanel>
          )}

          {/* ── Category + Productivity dist ── */}
          <div className="two-col">
            <DetailPanel title="Distribusi Kategori" icon="donut_small">
              {cats.length === 0 ? <EmptyInline /> : (
                <DistBars items={cats} colorFor={categoryColor} nameFor={categoryDisplayName} />
              )}
            </DetailPanel>

            <DetailPanel title="Mode Produktivitas" icon="psychology">
              {dist.length === 0 ? <EmptyInline /> : (
                <DistBars items={dist} colorFor={productivityColor} nameFor={productivityDisplayName} />
              )}
            </DetailPanel>
          </div>

          {/* ── Top apps ── */}
          <DetailPanel title="Top Aplikasi" icon="apps">
            {apps.length === 0 ? <EmptyInline /> : (
              <div className="apps-grid">
                {apps.map((a, i) => {
                  const maxSec = apps[0]?.seconds || 1;
                  return (
                    <div key={a.key} className="app-row">
                      <span className="app-rank">{i + 1}</span>
                      <div className="app-info">
                        <span className="app-nm">{appDisplayName(a.key)}</span>
                        <div className="app-bar-track">
                          <div className="app-bar-fill" style={{ width: `${(a.seconds/maxSec)*100}%` }} />
                        </div>
                      </div>
                      <span className="app-dur">{formatDuration(a.seconds)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </DetailPanel>
        </>
      )}

      <style jsx>{`
        .ed {
          display: flex;
          flex-direction: column;
          gap: 16px;
          padding-bottom: 32px;
        }

        /* Breadcrumb */
        .breadcrumb {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
        }
        .bc-link {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          color: #6d28d9;
          text-decoration: none;
          font-weight: 600;
          transition: color 0.15s;
        }
        .bc-link:hover { color: #4c1d95; }
        .bc-link .material-icons { font-size: 15px; }
        .bc-sep { font-size: 16px; color: #cbd5e1; }
        .bc-cur { color: #64748b; font-weight: 500; }

        /* Hero */
        .hero {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 20px 24px;
          display: flex;
          gap: 20px;
          flex-wrap: wrap;
          align-items: flex-start;
          justify-content: space-between;
          box-shadow: 0 1px 3px rgba(15,23,42,0.04);
        }
        .hero-left { display: flex; gap: 16px; align-items: center; }
        .avatar {
          width: 60px; height: 60px;
          border-radius: 16px;
          background: linear-gradient(135deg, #7c3aed, #4f46e5);
          color: white;
          display: flex; align-items: center; justify-content: center;
          font-size: 20px; font-weight: 600;
          position: relative;
          flex-shrink: 0;
          letter-spacing: -0.5px;
        }
        .av-dot {
          position: absolute;
          bottom: -3px; right: -3px;
          width: 14px; height: 14px;
          border-radius: 50%;
          border: 2.5px solid white;
        }
        h1 {
          margin: 0 0 3px;
          font-size: 18px;
          font-weight: 600;
          color: #0f172a;
          letter-spacing: -0.3px;
        }
        .hero-email { font-size: 13px; color: #64748b; }
        .hero-uid {
          display: flex; align-items: center; gap: 5px;
          margin-top: 6px;
          font-size: 11px; color: #94a3b8;
        }
        .hero-uid .material-icons { font-size: 13px; }
        .hero-uid code {
          background: #f1f5f9;
          padding: 2px 7px;
          border-radius: 4px;
          font-family: ui-monospace, 'JetBrains Mono', monospace;
          font-size: 11px;
          color: #475569;
        }

        .hero-right { display: flex; gap: 12px; align-items: stretch; flex-wrap: wrap; }

        /* Live card */
        .live-card {
          border: 1px solid;
          border-radius: 12px;
          padding: 14px 16px;
          min-width: 200px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .live-header {
          display: flex; align-items: center; gap: 7px;
          font-size: 10px; font-weight: 600;
          text-transform: uppercase; letter-spacing: 0.4px;
        }
        .live-dot {
          width: 7px; height: 7px;
          border-radius: 50%;
          animation: blink 1.6s infinite;
        }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.35} }
        .live-state { }
        .live-app { font-size: 14px; font-weight: 600; color: #0f172a; margin-top: 2px; }
        .live-window { font-size: 11px; color: #64748b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 220px; }
        .live-device-link {
          display: inline-flex; align-items: center; gap: 4px;
          margin-top: 8px;
          font-size: 11px; font-weight: 600; color: #6d28d9;
          text-decoration: none;
          transition: color 0.15s;
        }
        .live-device-link:hover { color: #4c1d95; }
        .live-device-link .material-icons { font-size: 13px; }

        /* Rolling stats */
        .rolling-stats {
          display: flex;
          align-items: center;
          gap: 0;
          background: #fafbfd;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 14px 20px;
        }
        .rs-item { display: flex; flex-direction: column; gap: 5px; text-align: center; padding: 0 16px; }
        .rs-val { font-size: 20px; font-weight: 600; color: #0f172a; font-variant-numeric: tabular-nums; }
        .rs-lbl { font-size: 9px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #94a3b8; white-space: nowrap; }
        .rs-div { width: 1px; background: #e2e8f0; align-self: stretch; }

        /* Period bar */
        .period-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 6px 10px 6px 6px;
          gap: 12px;
        }
        .period-tabs { display: flex; gap: 4px; }
        .ptab {
          border: none;
          background: transparent;
          padding: 7px 16px;
          border-radius: 8px;
          font-family: inherit;
          font-size: 13px;
          font-weight: 500;
          color: #64748b;
          cursor: pointer;
          transition: all 0.15s;
        }
        .ptab:hover { background: #f8fafc; }
        .ptab.active { background: #f5f3ff; color: #6d28d9; font-weight: 600; }
        .period-label {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 12px;
          color: #94a3b8;
          font-weight: 500;
        }
        .period-label .material-icons { font-size: 14px; }

        /* Error / loading / empty */
        .err-banner {
          display: flex; align-items: center; gap: 10px;
          background: #fef2f2; border: 1px solid #fecaca;
          color: #b91c1c; padding: 12px 16px;
          border-radius: 10px; font-size: 13px;
        }
        .err-banner .material-icons { font-size: 18px; }
        .loading-card {
          display: flex; align-items: center; justify-content: center; gap: 12px;
          background: white; border: 1px solid #e2e8f0;
          border-radius: 14px; padding: 48px;
          color: #64748b; font-size: 13px;
        }
        .spinner {
          width: 20px; height: 20px;
          border: 2px solid #e2e8f0;
          border-top-color: #7c3aed;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .empty-card {
          background: white; border: 1px solid #e2e8f0;
          border-radius: 14px; padding: 56px;
          text-align: center; color: #64748b;
        }
        .empty-card .material-icons { font-size: 44px; color: #cbd5e1; display: block; }
        .empty-card p { margin: 10px 0 0; font-size: 13px; }

        /* KPI strip */
        .kpi-strip {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
          gap: 12px;
        }

        /* Two-col layout */
        .two-col {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        @media (max-width: 860px) { .two-col { grid-template-columns: 1fr; } }

        /* Apps grid */
        .apps-grid {
          display: flex;
          flex-direction: column;
          gap: 0;
        }
        .app-row {
          display: grid;
          grid-template-columns: 26px 1fr auto;
          gap: 12px;
          align-items: center;
          padding: 10px 20px;
          border-bottom: 1px solid #f8fafc;
        }
        .app-row:last-child { border-bottom: none; }
        .app-rank {
          width: 22px; height: 22px;
          border-radius: 6px;
          background: #f1f5f9;
          color: #64748b;
          font-size: 11px; font-weight: 600;
          display: flex; align-items: center; justify-content: center;
        }
        .app-info { min-width: 0; display: flex; flex-direction: column; gap: 5px; }
        .app-nm { font-size: 13px; font-weight: 500; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .app-bar-track { height: 3px; background: #f1f5f9; border-radius: 99px; overflow: hidden; }
        .app-bar-fill { height: 100%; border-radius: 99px; background: linear-gradient(90deg, #7c3aed, #6366f1); }
        .app-dur { font-size: 12px; font-weight: 600; color: #6d28d9; white-space: nowrap; font-variant-numeric: tabular-nums; }
      `}</style>
    </div>
  );
}

// ── StatCard ─────────────────────────────────────────────────────────────
function StatCard({
  icon, label, value, sub, color,
}: {
  icon: string; label: string; value: string | number; sub?: string; color: string;
}) {
  return (
    <div className="sc">
      <div className="sc-icon" style={{ background: `${color}14`, color }}>
        <span className="material-icons">{icon}</span>
      </div>
      <div className="sc-body">
        <div className="sc-lbl">{label}</div>
        <div className="sc-val" style={{ color }}>{value}</div>
        {sub && <div className="sc-sub">{sub}</div>}
      </div>
      <style jsx>{`
        .sc {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          padding: 16px;
          display: flex;
          gap: 12px;
          align-items: flex-start;
          box-shadow: 0 1px 3px rgba(15,23,42,0.04);
          transition: box-shadow 0.15s;
        }
        .sc:hover { box-shadow: 0 4px 12px rgba(15,23,42,0.08); }
        .sc-icon {
          width: 38px; height: 38px;
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .sc-icon .material-icons { font-size: 20px; }
        .sc-body { min-width: 0; }
        .sc-lbl { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.4px; color: #94a3b8; margin-bottom: 5px; }
        .sc-val { font-size: 20px; font-weight: 600; line-height: 1; letter-spacing: -0.3px; }
        .sc-sub { font-size: 11px; color: #64748b; margin-top: 5px; }
      `}</style>
    </div>
  );
}

// ── DetailPanel ───────────────────────────────────────────────────────────
function DetailPanel({
  title, icon, children,
}: {
  title: string; icon: string; children: React.ReactNode;
}) {
  return (
    <section className="dp">
      <header className="dp-hd">
        <span className="material-icons">{icon}</span>
        <h3>{title}</h3>
      </header>
      <div>{children}</div>
      <style jsx>{`
        .dp {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(15,23,42,0.04);
        }
        .dp-hd {
          display: flex; align-items: center; gap: 9px;
          padding: 14px 18px;
          border-bottom: 1px solid #f1f5f9;
          background: #fafbfd;
        }
        .dp-hd .material-icons { font-size: 18px; color: #7c3aed; }
        h3 { margin: 0; font-size: 13px; font-weight: 600; color: #0f172a; }
      `}</style>
    </section>
  );
}

// ── TrendChart ────────────────────────────────────────────────────────────
function TrendChart<T>({
  entries, labelFn, secondsFn, scoreFn,
}: {
  entries: [string, T][];
  labelFn: (k: string) => string;
  secondsFn: (v: T) => number;
  scoreFn: (v: T) => number;
}) {
  const max = Math.max(...entries.map(([, v]) => secondsFn(v)), 1);
  return (
    <div className="tc">
      {entries.map(([key, val]) => {
        const score = scoreFn(val);
        const h = (secondsFn(val) / max) * 100;
        const color =
          score >= 70 ? "#059669" : score >= 50 ? "#3b82f6" : score >= 30 ? "#d97706" : "#dc2626";
        return (
          <div key={key} className="tc-col">
            <div className="tc-bar" style={{ height: `${h}%`, background: color }}>
              <span className="tc-dur">{formatDuration(secondsFn(val))}</span>
            </div>
            <div className="tc-lbl">{labelFn(key)}</div>
            <div className="tc-score" style={{ color }}>{Math.round(score)}</div>
          </div>
        );
      })}
      <style jsx>{`
        .tc {
          display: grid;
          grid-template-columns: repeat(${entries.length}, 1fr);
          gap: 8px;
          height: 200px;
          align-items: end;
          padding: 28px 18px 14px;
        }
        .tc-col { display: flex; flex-direction: column; align-items: center; gap: 4px; height: 100%; }
        .tc-bar {
          width: 100%; border-radius: 6px 6px 0 0;
          min-height: 6px; position: relative; margin-top: auto;
          transition: height 0.4s; opacity: 0.9;
        }
        .tc-dur {
          position: absolute; top: -18px; left: 50%;
          transform: translateX(-50%);
          font-size: 9px; font-weight: 500; color: #64748b;
          white-space: nowrap;
        }
        .tc-lbl { font-size: 11px; font-weight: 500; color: #64748b; }
        .tc-score { font-size: 10px; font-weight: 600; }
      `}</style>
    </div>
  );
}

// ── DistBars ──────────────────────────────────────────────────────────────
function DistBars({
  items, colorFor, nameFor,
}: {
  items: { key: string; seconds: number; pct: number }[];
  colorFor: (k: string) => string;
  nameFor: (k: string) => string;
}) {
  return (
    <div className="db">
      {items.map((c) => (
        <div key={c.key} className="db-row">
          <div className="db-head">
            <span className="db-dot" style={{ background: colorFor(c.key) }} />
            <span className="db-name">{nameFor(c.key)}</span>
            <span className="db-pct">{c.pct.toFixed(1)}%</span>
          </div>
          <div className="db-track">
            <div className="db-fill" style={{ width: `${c.pct}%`, background: colorFor(c.key) }} />
          </div>
          <div className="db-time">{formatDuration(c.seconds)}</div>
        </div>
      ))}
      <style jsx>{`
        .db { display: flex; flex-direction: column; gap: 12px; padding: 16px 18px; }
        .db-row { display: grid; gap: 5px; }
        .db-head { display: flex; align-items: center; gap: 8px; }
        .db-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .db-name { font-size: 13px; font-weight: 500; color: #0f172a; flex: 1; }
        .db-pct { font-size: 11px; font-weight: 600; color: #475569; }
        .db-track { height: 5px; background: #f1f5f9; border-radius: 99px; overflow: hidden; }
        .db-fill { height: 100%; border-radius: 99px; opacity: 0.85; transition: width 0.3s; }
        .db-time { font-size: 11px; color: #94a3b8; padding-left: 16px; }
      `}</style>
    </div>
  );
}

// ── EmptyInline ───────────────────────────────────────────────────────────
function EmptyInline() {
  return (
    <div className="ei">
      <span className="material-icons">inbox</span>
      <span>Tidak ada data.</span>
      <style jsx>{`
        .ei {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          padding: 32px; color: #94a3b8; font-size: 13px;
        }
        .ei .material-icons { font-size: 22px; color: #cbd5e1; }
      `}</style>
    </div>
  );
}
