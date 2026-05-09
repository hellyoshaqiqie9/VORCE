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

  return (
    <div className="ed-page">
      <Link href="/admin/intelligence/workforce" className="back">
        <span className="material-icons">arrow_back</span>
        Workforce Analytics
      </Link>

      <EmployeeHero
        userId={userId}
        presence={presence}
        rolling={rolling}
      />

      <div className="period-tabs">
        {(["daily", "weekly", "monthly"] as Period[]).map((p) => (
          <button
            key={p}
            className={period === p ? "tab active" : "tab"}
            onClick={() => setPeriod(p)}
          >
            {p === "daily" ? "Harian" : p === "weekly" ? "Mingguan" : "Bulanan"}
          </button>
        ))}
        {active && (
          <span className="period-meta">
            {period === "daily" && active.date && `Tanggal ${prettyDayKey(active.date)}`}
            {period === "weekly" &&
              (active as EmployeeBehaviorWeekly).weekKey &&
              `Minggu ${(active as EmployeeBehaviorWeekly).weekKey}`}
            {period === "monthly" &&
              (active as EmployeeBehaviorMonthly).monthKey &&
              `Bulan ${(active as EmployeeBehaviorMonthly).monthKey}`}
          </span>
        )}
      </div>

      {error && (
        <div className="error">
          <span className="material-icons">error</span>
          {error}
        </div>
      )}

      {loading ? (
        <div className="placeholder">Memuat data...</div>
      ) : !active || !derived ? (
        <div className="placeholder">
          <span className="material-icons">trending_flat</span>
          <p>Belum ada data {period === "daily" ? "harian" : period === "weekly" ? "mingguan" : "bulanan"} untuk karyawan ini.</p>
        </div>
      ) : (
        <>
          <div className="kpi-grid">
            <BigKpi
              icon="trending_up"
              label="Skor Produktivitas"
              value={derived.productivityScore.toFixed(1)}
              sub={productivityLabel(derived.productivityScore)}
              color="#7c3aed"
            />
            <BigKpi
              icon="schedule"
              label="Jam Aktif"
              value={formatDuration(derived.activeHours * 3600)}
              sub={`Idle ${formatDuration(derived.idleHours * 3600)}`}
              color="#10b981"
            />
            <BigKpi
              icon="psychology"
              label="Rasio Fokus"
              value={`${(derived.focusRatio * 100).toFixed(1)}%`}
              sub={`Terpecah ${(derived.fragmentedRatio * 100).toFixed(1)}%`}
              color="#3b82f6"
            />
            <BigKpi
              icon="bolt"
              label="Switch / Jam"
              value={derived.switchPerHour.toFixed(1)}
              sub={`${derived.sessionCount} sesi`}
              color="#f59e0b"
            />
            <BigKpi
              icon="favorite"
              label="Health Score"
              value={derived.healthScore.toFixed(1)}
              color="#ef4444"
            />
            <BigKpi
              icon="warning_amber"
              label="Anomali"
              value={derived.anomalyCount}
              color="#7f1d1d"
            />
          </div>

          {period === "weekly" && (active as EmployeeBehaviorWeekly).dailyTrend && (
            <Panel title="Tren Harian dalam Minggu Ini" icon="show_chart">
              <DailyTrendChart trend={(active as EmployeeBehaviorWeekly).dailyTrend} />
            </Panel>
          )}

          {period === "monthly" && (active as EmployeeBehaviorMonthly).weeklyTrend && (
            <Panel title="Tren Mingguan dalam Bulan Ini" icon="show_chart">
              <WeeklyTrendChart trend={(active as EmployeeBehaviorMonthly).weeklyTrend} />
            </Panel>
          )}

          <div className="two-col">
            <Panel title="Distribusi Kategori" icon="pie_chart">
              {cats.length === 0 ? (
                <Empty />
              ) : (
                <DistList
                  items={cats}
                  colorFor={categoryColor}
                  nameFor={categoryDisplayName}
                />
              )}
            </Panel>

            <Panel title="Mode Produktivitas" icon="psychology">
              {dist.length === 0 ? (
                <Empty />
              ) : (
                <DistList
                  items={dist}
                  colorFor={productivityColor}
                  nameFor={productivityDisplayName}
                />
              )}
            </Panel>
          </div>

          <Panel title="Top Aplikasi" icon="apps">
            {apps.length === 0 ? (
              <Empty />
            ) : (
              <div className="apps">
                {apps.map((a) => (
                  <div key={a.key} className="app-tile">
                    <div className="app-name">{appDisplayName(a.key)}</div>
                    <div className="app-time">{formatDuration(a.seconds)}</div>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </>
      )}

      <style jsx>{`
        .ed-page { display: flex; flex-direction: column; gap: 20px; }

        .back {
          display: inline-flex; align-items: center; gap: 6px;
          color: #6d28d9; font-weight: 700; font-size: 13px;
          text-decoration: none;
        }
        .back .material-icons { font-size: 18px; }
        .back:hover { color: #4c1d95; }

        .period-tabs {
          display: flex;
          align-items: center;
          gap: 8px;
          background: white;
          padding: 6px;
          border-radius: 12px;
          border: 1px solid #f1f5f9;
        }
        .tab {
          background: transparent;
          border: none;
          padding: 8px 18px;
          border-radius: 8px;
          font-family: inherit;
          font-weight: 700;
          font-size: 13px;
          color: #64748b;
          cursor: pointer;
        }
        .tab:hover { background: #f8fafc; }
        .tab.active { background: #f5f3ff; color: #6d28d9; }
        .period-meta { margin-left: auto; padding-right: 12px; color: #94a3b8; font-size: 12px; }

        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 14px;
        }
        .two-col {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        @media (max-width: 900px) { .two-col { grid-template-columns: 1fr; } }

        .apps {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 10px;
          padding: 20px;
        }
        .app-tile {
          background: linear-gradient(135deg, #f5f3ff, #f8fafc);
          border: 1px solid #ede9fe;
          padding: 14px;
          border-radius: 12px;
        }
        .app-name { font-weight: 700; color: #1e293b; }
        .app-time { font-size: 13px; color: #7c3aed; font-weight: 600; margin-top: 4px; }

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

function EmployeeHero({
  userId,
  presence,
  rolling,
}: {
  userId: string;
  presence: LivePresence | null;
  rolling: EmployeeBehaviorRolling | null;
}) {
  const stateColor =
    presence?.state === "active"
      ? "#10b981"
      : presence?.state === "idle"
      ? "#f59e0b"
      : "#94a3b8";
  const name = presence?.userName || presence?.userEmail || userId;
  const initials = (name || "?")
    .trim()
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");

  return (
    <div className="hero">
      <div className="hero-l">
        <div className="avatar">
          {initials || "?"}
          {presence && <div className="dot" style={{ background: stateColor }} />}
        </div>
        <div>
          <h1>{name}</h1>
          {presence?.userEmail && presence.userEmail !== name && (
            <div className="email">{presence.userEmail}</div>
          )}
          <div className="user-id">
            <span className="material-icons">fingerprint</span>
            <code>{userId}</code>
          </div>
        </div>
      </div>

      <div className="hero-r">
        {presence ? (
          <div
            className="live-card"
            style={{
              borderColor: `${stateColor}40`,
              background: `${stateColor}08`,
            }}
          >
            <div className="live-row">
              <span className="live-dot" style={{ background: stateColor }} />
              <span style={{ color: stateColor }}>{presenceLabel(presence.state)}</span>
            </div>
            <div className="live-app">{appDisplayName(presence.currentApp)}</div>
            {presence.activeWindow && (
              <div className="live-window">{presence.activeWindow}</div>
            )}
            <Link
              href={`/admin/intelligence/device/${encodeURIComponent(presence.deviceId)}`}
              className="live-link"
            >
              Lihat perangkat →
            </Link>
          </div>
        ) : (
          <div className="live-card offline">
            <span className="material-icons">cloud_off</span>
            Tidak online
          </div>
        )}

        {rolling && (
          <div className="rolling">
            <div>
              <div className="rolling-num">{rolling.totalSessions}</div>
              <div className="rolling-lbl">Total sesi</div>
            </div>
            <div>
              <div className="rolling-num">{formatDuration(rolling.totalActiveSeconds)}</div>
              <div className="rolling-lbl">Total aktif</div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .hero {
          background: white;
          border: 1px solid #f1f5f9;
          border-radius: 18px;
          padding: 24px;
          display: flex;
          gap: 24px;
          flex-wrap: wrap;
          align-items: flex-start;
          justify-content: space-between;
        }
        .hero-l { display: flex; gap: 16px; align-items: center; }
        .avatar {
          width: 64px; height: 64px;
          border-radius: 50%;
          background: linear-gradient(135deg, #7c3aed, #4f46e5);
          color: white;
          display: flex; align-items: center; justify-content: center;
          font-weight: 700;
          font-size: 20px;
          position: relative;
        }
        .avatar .dot {
          position: absolute;
          bottom: 0; right: 0;
          width: 16px; height: 16px;
          border-radius: 50%;
          border: 3px solid white;
        }
        h1 { font-size: 20px; font-weight: 700; color: #0f172a; margin: 0 0 4px; }
        .email { font-size: 13px; color: #64748b; }
        .user-id {
          display: flex; align-items: center; gap: 6px;
          font-size: 11px; color: #94a3b8;
          margin-top: 8px;
        }
        .user-id .material-icons { font-size: 14px; }
        .user-id code {
          background: #f1f5f9;
          padding: 2px 8px;
          border-radius: 4px;
          font-family: 'JetBrains Mono', monospace;
        }

        .hero-r { display: flex; gap: 16px; align-items: center; flex-wrap: wrap; }
        .live-card {
          padding: 14px 18px;
          border-radius: 12px;
          border: 1px solid;
          min-width: 220px;
        }
        .live-row {
          display: flex;
          align-items: center;
          gap: 6px;
          font-weight: 700;
          font-size: 11px;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }
        .live-dot {
          width: 8px; height: 8px;
          border-radius: 50%;
          animation: pulse 1.5s infinite;
        }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
        .live-app { font-size: 14px; font-weight: 700; color: #0f172a; margin-top: 6px; }
        .live-window { font-size: 12px; color: #475569; margin-top: 2px; }
        .live-link {
          font-size: 11px;
          color: #6d28d9;
          font-weight: 700;
          text-decoration: none;
          margin-top: 8px;
          display: inline-block;
        }
        .live-card.offline {
          display: flex; align-items: center; gap: 8px;
          color: #94a3b8;
          font-size: 13px;
          font-weight: 600;
          background: #f8fafc;
          border-color: #f1f5f9;
        }

        .rolling {
          display: flex;
          gap: 24px;
          background: #fafbfd;
          border: 1px solid #f1f5f9;
          border-radius: 12px;
          padding: 14px 20px;
        }
        .rolling-num { font-size: 20px; font-weight: 800; color: #0f172a; }
        .rolling-lbl { font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 4px; }
      `}</style>
    </div>
  );
}

function DistList({
  items,
  colorFor,
  nameFor,
}: {
  items: { key: string; seconds: number; pct: number }[];
  colorFor: (k: string) => string;
  nameFor: (k: string) => string;
}) {
  return (
    <div className="dist">
      {items.map((c) => (
        <div key={c.key} className="row">
          <div className="head">
            <div className="dot" style={{ background: colorFor(c.key) }} />
            <span className="name">{nameFor(c.key)}</span>
            <span className="pct">{c.pct.toFixed(1)}%</span>
          </div>
          <div className="bar">
            <div
              className="fill"
              style={{ width: `${c.pct}%`, background: colorFor(c.key) }}
            />
          </div>
          <div className="time">{formatDuration(c.seconds)}</div>
        </div>
      ))}
      <style jsx>{`
        .dist { display: flex; flex-direction: column; gap: 14px; padding: 20px; }
        .row { display: grid; gap: 4px; }
        .head { display: flex; align-items: center; gap: 8px; }
        .dot { width: 10px; height: 10px; border-radius: 50%; }
        .name { font-weight: 600; color: #1e293b; font-size: 13px; flex: 1; }
        .pct { font-size: 12px; font-weight: 700; color: #475569; }
        .bar { height: 6px; background: #f1f5f9; border-radius: 99px; overflow: hidden; }
        .fill { height: 100%; transition: width 0.3s; }
        .time { font-size: 11px; color: #94a3b8; padding-left: 18px; }
      `}</style>
    </div>
  );
}

function DailyTrendChart({
  trend,
}: {
  trend: NonNullable<EmployeeBehaviorWeekly["dailyTrend"]>;
}) {
  const days = Object.entries(trend).sort(([a], [b]) => a.localeCompare(b));
  const max = Math.max(...days.map(([, v]) => v.totalActiveSeconds || 0), 1);
  return (
    <div className="chart">
      {days.map(([day, v]) => {
        const score =
          (v.productivityTotalSeconds || 0) > 0
            ? (v.productivityWeightedSum || 0) / (v.productivityTotalSeconds || 1)
            : 0;
        const h = ((v.totalActiveSeconds || 0) / max) * 100;
        const color =
          score >= 70 ? "#10b981" : score >= 50 ? "#3b82f6" : score >= 30 ? "#f59e0b" : "#ef4444";
        return (
          <div key={day} className="bar-col">
            <div className="bar-fill" style={{ height: `${h}%`, background: color }}>
              <span className="hours">{formatDuration(v.totalActiveSeconds || 0)}</span>
            </div>
            <div className="day-lbl">{day.slice(6, 8)}</div>
            <div className="score-lbl" style={{ color }}>{Math.round(score)}</div>
          </div>
        );
      })}
      <style jsx>{`
        .chart {
          display: grid;
          grid-template-columns: repeat(${days.length}, 1fr);
          gap: 12px;
          height: 260px;
          align-items: end;
          padding: 20px;
        }
        .bar-col { display: flex; flex-direction: column; align-items: center; gap: 4px; height: 100%; }
        .bar-fill {
          width: 100%;
          border-radius: 8px 8px 0 0;
          min-height: 8px;
          position: relative;
          margin-top: auto;
          transition: height 0.4s;
        }
        .bar-fill .hours {
          position: absolute;
          top: -20px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 10px;
          font-weight: 700;
          color: #475569;
          white-space: nowrap;
        }
        .day-lbl { font-size: 11px; font-weight: 700; color: #475569; }
        .score-lbl { font-size: 10px; font-weight: 700; }
      `}</style>
    </div>
  );
}

function WeeklyTrendChart({
  trend,
}: {
  trend: NonNullable<EmployeeBehaviorMonthly["weeklyTrend"]>;
}) {
  const weeks = Object.entries(trend).sort(([a], [b]) => a.localeCompare(b));
  const max = Math.max(...weeks.map(([, v]) => v.totalSeconds || 0), 1);
  return (
    <div className="chart">
      {weeks.map(([wk, v]) => {
        const score =
          (v.productivityTotalSeconds || 0) > 0
            ? (v.productivityWeightedSum || 0) / (v.productivityTotalSeconds || 1)
            : 0;
        const h = ((v.totalSeconds || 0) / max) * 100;
        const color =
          score >= 70 ? "#10b981" : score >= 50 ? "#3b82f6" : score >= 30 ? "#f59e0b" : "#ef4444";
        return (
          <div key={wk} className="bar-col">
            <div className="bar-fill" style={{ height: `${h}%`, background: color }}>
              <span className="hours">{formatDuration(v.totalSeconds || 0)}</span>
            </div>
            <div className="day-lbl">{wk.split("_").pop()}</div>
            <div className="score-lbl" style={{ color }}>{Math.round(score)}</div>
          </div>
        );
      })}
      <style jsx>{`
        .chart {
          display: grid;
          grid-template-columns: repeat(${weeks.length}, 1fr);
          gap: 12px;
          height: 260px;
          align-items: end;
          padding: 20px;
        }
        .bar-col { display: flex; flex-direction: column; align-items: center; gap: 4px; height: 100%; }
        .bar-fill {
          width: 100%;
          border-radius: 8px 8px 0 0;
          min-height: 8px;
          position: relative;
          margin-top: auto;
          transition: height 0.4s;
        }
        .bar-fill .hours {
          position: absolute;
          top: -20px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 10px;
          font-weight: 700;
          color: #475569;
          white-space: nowrap;
        }
        .day-lbl { font-size: 11px; font-weight: 700; color: #475569; }
        .score-lbl { font-size: 10px; font-weight: 700; }
      `}</style>
    </div>
  );
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
      <div>
        <div className="kpi-lbl">{label}</div>
        <div className="kpi-val">{value}</div>
        {sub && <div className="kpi-sub">{sub}</div>}
      </div>
      <style jsx>{`
        .kpi {
          background: white;
          border: 1px solid #f1f5f9;
          border-radius: 16px;
          padding: 18px;
          display: flex;
          gap: 14px;
          align-items: flex-start;
        }
        .kpi-icon {
          width: 42px; height: 42px;
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
        }
        .kpi-lbl { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #94a3b8; margin-bottom: 6px; }
        .kpi-val { font-size: 22px; font-weight: 800; color: #0f172a; line-height: 1; }
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
          display: flex; align-items: center; gap: 10px;
          padding: 16px 20px;
          border-bottom: 1px solid #f1f5f9;
          background: #fafbfd;
        }
        header .material-icons { color: #7c3aed; font-size: 20px; }
        h3 { margin: 0; font-size: 14px; font-weight: 700; color: #0f172a; }
      `}</style>
    </section>
  );
}

function Empty() {
  return (
    <div className="empty">
      <span className="material-icons">inbox</span>
      <p>Tidak ada data.</p>
      <style jsx>{`
        .empty { padding: 40px; text-align: center; color: #94a3b8; }
        .empty .material-icons { font-size: 40px; color: #cbd5e1; }
        p { font-size: 13px; margin: 8px 0 0; }
      `}</style>
    </div>
  );
}
