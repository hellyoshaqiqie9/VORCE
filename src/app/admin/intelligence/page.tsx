"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useCompanyId } from "@/lib/intelligence/useCompanyId";
import {
  listAllEmployeeDaily,
  subscribeLivePresence,
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
  PresenceState,
} from "@/lib/intelligence/types";
import { Avatar, EmptyState, LoadingBars, MeterBar } from "./_components/shared";

type FilterKey = "all" | "online" | "idle" | "alerts" | "workload";
type SortKey =
  | "employee"
  | "productivity"
  | "focus"
  | "alerts"
  | "cpu"
  | "ram"
  | "session"
  | "health";

type EmployeeRow = {
  userId: string;
  userName: string;
  userEmail: string;
  state: PresenceState | "offline";
  devices: LivePresence[];
  primaryDevice: LivePresence | null;
  deviceCount: number;
  currentApp: string;
  currentCategory: string;
  activeWindow: string;
  cpu: number;
  ram: number;
  health: number;
  sessionSeconds: number;
  productivityScore: number;
  focusScore: number;
  switchPerHour: number;
  anomalyCount: number;
  criticalCount: number;
  workload: "Normal" | "Elevated" | "High";
  lastActivity: Date | null;
  daily: EmployeeBehaviorDaily | null;
};

const FILTERS: { key: FilterKey; label: string; icon: string }[] = [
  { key: "all", label: "All workforce", icon: "groups" },
  { key: "online", label: "Online", icon: "bolt" },
  { key: "idle", label: "Idle", icon: "hourglass_top" },
  { key: "alerts", label: "Alerts", icon: "warning_amber" },
  { key: "workload", label: "High workload", icon: "speed" },
];

const SORT_LABEL: Record<SortKey, string> = {
  employee: "Employee",
  productivity: "Productivity",
  focus: "Focus",
  alerts: "Alerts",
  cpu: "CPU",
  ram: "RAM",
  session: "Session duration",
  health: "Health",
};

const TYPE_LABEL: Record<string, string> = {
  cpu_spike: "CPU spike",
  ram_pressure: "RAM pressure",
  high_switching: "High switching",
  prolonged_idle: "Prolonged idle",
};

function toDate(v: any): Date | null {
  return v?.toDate?.() ?? null;
}

function secondsSince(d: Date | null): number {
  if (!d) return 0;
  return Math.max(0, Math.floor((Date.now() - d.getTime()) / 1000));
}

function timeAgo(d: Date | null): string {
  if (!d) return "—";
  const sec = secondsSince(d);
  if (sec < 60) return "baru saja";
  if (sec < 3600) return `${Math.floor(sec / 60)}m lalu`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}j lalu`;
  return `${Math.floor(sec / 86400)}h lalu`;
}

function stateRank(state: PresenceState): number {
  if (state === "active") return 3;
  if (state === "idle") return 2;
  return 1;
}

function stateLabel(state: EmployeeRow["state"]): string {
  if (state === "active") return "Online";
  if (state === "idle") return "Idle";
  if (state === "away") return "Away";
  return "Offline";
}

function stateColor(state: EmployeeRow["state"]): string {
  if (state === "active") return "#10b981";
  if (state === "idle") return "#f59e0b";
  if (state === "away") return "#94a3b8";
  return "#cbd5e1";
}

function average(nums: number[]): number {
  if (!nums.length) return 0;
  return nums.reduce((s, n) => s + n, 0) / nums.length;
}

function choosePrimaryDevice(devices: LivePresence[]): LivePresence | null {
  if (!devices.length) return null;
  return [...devices].sort((a, b) => {
    const byState = stateRank(b.state) - stateRank(a.state);
    if (byState) return byState;
    return secondsSince(toDate(a.lastHeartbeat)) - secondsSince(toDate(b.lastHeartbeat));
  })[0];
}

export default function DeviceIntelligenceCenter() {
  const router = useRouter();
  const { companyId, loading: cidLoading, error: cidError } = useCompanyId();
  const [presence, setPresence] = useState<LivePresence[]>([]);
  const [presenceLoading, setPresenceLoading] = useState(true);
  const [daily, setDaily] = useState<EmployeeBehaviorDaily[]>([]);
  const [dailyLoading, setDailyLoading] = useState(true);
  const [anomalies, setAnomalies] = useState<AnomalyEvent[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [sort, setSort] = useState<SortKey>("alerts");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [lastManualRefresh, setLastManualRefresh] = useState<Date | null>(null);

  useEffect(() => {
    if (!companyId) return;
    setPresenceLoading(true);
    const unsubPresence = subscribeLivePresence(
      companyId,
      (rows) => {
        setPresence(rows);
        setPresenceLoading(false);
      },
      () => setPresenceLoading(false)
    );
    const unsubAnomalies = subscribeRecentAnomalies(companyId, 24, setAnomalies);
    return () => {
      unsubPresence();
      unsubAnomalies();
    };
  }, [companyId]);

  const loadDaily = useCallback(async () => {
    if (!companyId) return;
    setDailyLoading(true);
    try {
      const rows = await listAllEmployeeDaily(companyId);
      setDaily(rows);
      setLastManualRefresh(new Date());
    } finally {
      setDailyLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    void loadDaily();
  }, [loadDaily]);

  const dailyByUser = useMemo(() => {
    const map = new Map<string, EmployeeBehaviorDaily>();
    for (const row of daily) map.set(row.userId, row);
    return map;
  }, [daily]);

  const anomaliesByUser = useMemo(() => {
    const map = new Map<string, AnomalyEvent[]>();
    for (const item of anomalies) {
      const arr = map.get(item.userId) || [];
      arr.push(item);
      map.set(item.userId, arr);
    }
    return map;
  }, [anomalies]);

  const workforce = useMemo<EmployeeRow[]>(() => {
    const userIds = new Set<string>();
    for (const p of presence) userIds.add(p.userId);
    for (const d of daily) userIds.add(d.userId);
    for (const a of anomalies) userIds.add(a.userId);

    return Array.from(userIds).map((userId) => {
      const devices = presence.filter((p) => p.userId === userId);
      const primaryDevice = choosePrimaryDevice(devices);
      const aggregate = dailyByUser.get(userId) || null;
      const metrics = aggregate ? deriveDailyMetrics(aggregate) : null;
      const userAnomalies = anomaliesByUser.get(userId) || [];
      const criticalCount = userAnomalies.filter(
        (a) => a.severity === "critical" || a.severity === "high"
      ).length;
      const state: EmployeeRow["state"] = devices.some((d) => d.state === "active")
        ? "active"
        : devices.some((d) => d.state === "idle")
        ? "idle"
        : devices.some((d) => d.state === "away")
        ? "away"
        : "offline";
      const cpu = primaryDevice?.cpuNow ?? average(devices.map((d) => d.cpuNow || 0));
      const ram = primaryDevice?.ramNow ?? average(devices.map((d) => d.ramNow || 0));
      const health = devices.length
        ? average(devices.map((d) => d.healthScore || 0))
        : metrics?.healthScore ?? 0;
      const workload = cpu >= 85 || ram >= 85 ? "High" : cpu >= 65 || ram >= 70 ? "Elevated" : "Normal";
      const lastActivity = primaryDevice ? toDate(primaryDevice.lastHeartbeat) : null;
      const fallbackName = userAnomalies[0]?.userName || userAnomalies[0]?.userEmail || userId;
      return {
        userId,
        userName: primaryDevice?.userName || fallbackName,
        userEmail: primaryDevice?.userEmail || userAnomalies[0]?.userEmail || userId,
        state,
        devices,
        primaryDevice,
        deviceCount: devices.length,
        currentApp: primaryDevice?.currentApp || "—",
        currentCategory: primaryDevice?.currentCategory || "other",
        activeWindow: primaryDevice?.activeWindow || "—",
        cpu,
        ram,
        health,
        sessionSeconds: secondsSince(toDate(primaryDevice?.sessionStartedAt)),
        productivityScore: metrics?.productivityScore ?? 0,
        focusScore: metrics ? metrics.focusRatio * 100 : 0,
        switchPerHour: metrics?.switchPerHour ?? 0,
        anomalyCount: userAnomalies.length,
        criticalCount,
        workload,
        lastActivity,
        daily: aggregate,
      };
    });
  }, [presence, daily, anomalies, dailyByUser, anomaliesByUser]);

  const stats = useMemo(() => {
    const online = workforce.filter((r) => r.state === "active").length;
    const idle = workforce.filter((r) => r.state === "idle").length;
    const productive = workforce.filter((r) => r.productivityScore >= 60).length;
    const critical = workforce.reduce((s, r) => s + r.criticalCount, 0);
    const avgProductivity = average(workforce.map((r) => r.productivityScore).filter(Boolean));
    const avgFocus = average(workforce.map((r) => r.focusScore).filter(Boolean));
    const avgHealth = average(workforce.map((r) => r.health).filter(Boolean));
    const devicesOnline = presence.filter((p) => p.state === "active" || p.state === "idle").length;
    const highWorkload = workforce.filter((r) => r.workload !== "Normal").length;
    return {
      total: workforce.length,
      online,
      idle,
      productive,
      critical,
      avgProductivity,
      avgFocus,
      avgHealth,
      devicesOnline,
      highWorkload,
    };
  }, [workforce, presence]);

  const secondary = useMemo(() => {
    const catSeconds: Record<string, number> = {};
    const appSeconds: Record<string, number> = {};
    for (const d of daily) {
      for (const [k, v] of Object.entries(d.categories || {})) {
        if (typeof v === "number") catSeconds[k] = (catSeconds[k] || 0) + v;
      }
      for (const [k, v] of Object.entries(d.appUsage || {})) {
        if (typeof v === "number") appSeconds[k] = (appSeconds[k] || 0) + v;
      }
    }
    return {
      categories: categoryPercentages(catSeconds).slice(0, 5),
      apps: topEntries(appSeconds, 5),
      topProductive: [...workforce]
        .filter((r) => r.productivityScore > 0)
        .sort((a, b) => b.productivityScore - a.productivityScore)
        .slice(0, 5),
      recentAnomalies: anomalies.slice(0, 6),
    };
  }, [daily, workforce, anomalies]);

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    let rows = workforce.filter((r) => {
      if (filter === "online" && r.state !== "active") return false;
      if (filter === "idle" && r.state !== "idle") return false;
      if (filter === "alerts" && r.anomalyCount === 0) return false;
      if (filter === "workload" && r.workload === "Normal") return false;
      if (!q) return true;
      return (
        r.userName.toLowerCase().includes(q) ||
        r.userEmail.toLowerCase().includes(q) ||
        r.currentApp.toLowerCase().includes(q) ||
        r.activeWindow.toLowerCase().includes(q) ||
        r.userId.toLowerCase().includes(q)
      );
    });

    rows = [...rows].sort((a, b) => {
      let av: string | number = 0;
      let bv: string | number = 0;
      switch (sort) {
        case "employee":
          av = a.userName.toLowerCase();
          bv = b.userName.toLowerCase();
          break;
        case "productivity":
          av = a.productivityScore;
          bv = b.productivityScore;
          break;
        case "focus":
          av = a.focusScore;
          bv = b.focusScore;
          break;
        case "alerts":
          av = a.criticalCount * 10 + a.anomalyCount;
          bv = b.criticalCount * 10 + b.anomalyCount;
          break;
        case "cpu":
          av = a.cpu;
          bv = b.cpu;
          break;
        case "ram":
          av = a.ram;
          bv = b.ram;
          break;
        case "session":
          av = a.sessionSeconds;
          bv = b.sessionSeconds;
          break;
        case "health":
          av = a.health;
          bv = b.health;
          break;
      }
      if (av === bv) return 0;
      const cmp = av > bv ? 1 : -1;
      return sortDir === "asc" ? cmp : -cmp;
    });
    return rows;
  }, [workforce, query, filter, sort, sortDir]);

  function toggleSort(key: SortKey) {
    if (sort === key) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else {
      setSort(key);
      setSortDir(key === "employee" ? "asc" : "desc");
    }
  }

  function openEmployee(row: EmployeeRow) {
    router.push(`/admin/intelligence/employee/${encodeURIComponent(row.userId)}`);
  }

  if (cidError) {
    return (
      <div className="error-state">
        <span className="material-icons">error</span>
        <h3>Gagal memuat profil perusahaan</h3>
        <p>{cidError.message}</p>
      </div>
    );
  }

  return (
    <div className="ops">
      <header className="topbar">
        <div className="brand">
          <div className="brand-icon">
            <span className="material-icons">groups</span>
          </div>
          <div>
            <div className="eyebrow">
              <span className="sync-dot" />
              Workforce Intelligence Platform
            </div>
            <h1>Device Intelligence</h1>
          </div>
        </div>

        <div className="top-actions">
          <div className="global-search">
            <span className="material-icons">search</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search employee, app, window..."
            />
          </div>
          <div className="company-chip" title={companyId || "Company"}>
            <span className="material-icons">business</span>
            <span>{companyId ? companyId.slice(0, 10) : "Company"}</span>
          </div>
          <button className="icon-btn alerts" onClick={() => setFilter("alerts")} title="Critical alerts">
            <span className="material-icons">notifications</span>
            {stats.critical > 0 && <span className="badge">{stats.critical}</span>}
          </button>
          <button className="refresh" onClick={() => void loadDaily()} disabled={dailyLoading || cidLoading}>
            <span className="material-icons">refresh</span>
            Refresh
          </button>
        </div>
      </header>

      <section className="status-banner">
        <div className="banner-main">
          <div className="banner-title">
            <span className="material-icons">monitoring</span>
            Live workforce operations
          </div>
          <p>
            {presenceLoading
              ? "Connecting to realtime employee presence..."
              : `${stats.online} employees active · ${stats.devicesOnline} devices online · ${timeAgo(lastManualRefresh)} aggregate sync`}
          </p>
        </div>
        <div className="banner-kpis">
          <KpiBox label="Online" value={presenceLoading ? "—" : stats.online} tone="green" />
          <KpiBox label="Productive" value={dailyLoading ? "—" : stats.productive} tone="purple" />
          <KpiBox label="Idle" value={presenceLoading ? "—" : stats.idle} tone="amber" />
          <KpiBox label="Critical" value={stats.critical} tone={stats.critical > 0 ? "red" : "slate"} />
          <KpiBox label="Avg Prod" value={dailyLoading ? "—" : stats.avgProductivity.toFixed(0)} tone="blue" />
          <KpiBox label="Avg Focus" value={dailyLoading ? "—" : `${stats.avgFocus.toFixed(0)}%`} tone="cyan" />
          <KpiBox label="Health" value={presenceLoading ? "—" : stats.avgHealth.toFixed(0)} tone="green" />
        </div>
      </section>

      <main className="main-grid">
        <section className="workforce-card">
          <div className="table-head">
            <div>
              <h2>Realtime Workforce Table</h2>
              <p>
                Employee-first operations view powered by <code>live_presence</code>, <code>employee_behavior_daily</code>, and <code>anomaly_events</code>.
              </p>
            </div>
            <div className="table-controls">
              <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
                {Object.entries(SORT_LABEL).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
              <button onClick={() => setSortDir(sortDir === "asc" ? "desc" : "asc")}>
                <span className="material-icons">{sortDir === "asc" ? "north" : "south"}</span>
              </button>
            </div>
          </div>

          <div className="filters">
            {FILTERS.map((f) => {
              const count =
                f.key === "all"
                  ? workforce.length
                  : f.key === "online"
                  ? workforce.filter((r) => r.state === "active").length
                  : f.key === "idle"
                  ? workforce.filter((r) => r.state === "idle").length
                  : f.key === "alerts"
                  ? workforce.filter((r) => r.anomalyCount > 0).length
                  : workforce.filter((r) => r.workload !== "Normal").length;
              return (
                <button
                  key={f.key}
                  className={filter === f.key ? "filter active" : "filter"}
                  onClick={() => setFilter(f.key)}
                >
                  <span className="material-icons">{f.icon}</span>
                  {f.label}
                  <span className="filter-count">{count}</span>
                </button>
              );
            })}
          </div>

          {cidLoading || (presenceLoading && workforce.length === 0) ? (
            <LoadingBars rows={9} />
          ) : filteredRows.length === 0 ? (
            <EmptyState
              icon="manage_search"
              title="No workforce rows"
              message="No employee matches the current filters. Presence and aggregate docs will appear here as agents report data."
            />
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <Th label="Employee" sortKey="employee" active={sort} dir={sortDir} onSort={toggleSort} />
                    <th>Status</th>
                    <th>Current App</th>
                    <Th label="Productivity" sortKey="productivity" active={sort} dir={sortDir} onSort={toggleSort} />
                    <Th label="Focus" sortKey="focus" active={sort} dir={sortDir} onSort={toggleSort} />
                    <Th label="CPU" sortKey="cpu" active={sort} dir={sortDir} onSort={toggleSort} />
                    <Th label="RAM" sortKey="ram" active={sort} dir={sortDir} onSort={toggleSort} />
                    <Th label="Session" sortKey="session" active={sort} dir={sortDir} onSort={toggleSort} />
                    <Th label="Health" sortKey="health" active={sort} dir={sortDir} onSort={toggleSort} />
                    <Th label="Alerts" sortKey="alerts" active={sort} dir={sortDir} onSort={toggleSort} />
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((row) => (
                    <WorkforceRow key={row.userId} row={row} onClick={() => openEmployee(row)} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <aside className="side-panels">
          <PanelCompact title="Latest anomalies" icon="warning_amber">
            {secondary.recentAnomalies.length === 0 ? (
              <SmallEmpty text="No alerts in the last 24h" />
            ) : (
              <div className="mini-list">
                {secondary.recentAnomalies.map((a) => {
                  const color = severityColor(a.severity);
                  return (
                    <button
                      key={a.eventId}
                      className="anom-item"
                      onClick={() => router.push(`/admin/intelligence/employee/${encodeURIComponent(a.userId)}`)}
                    >
                      <span className="sev-dot" style={{ background: color }} />
                      <div>
                        <strong>{TYPE_LABEL[a.type] || a.type}</strong>
                        <span>{a.userName || a.userEmail || a.userId} · {timeAgo(toDate(a.detectedAt))}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </PanelCompact>

          <PanelCompact title="Top productive" icon="leaderboard">
            {dailyLoading ? (
              <LoadingBars rows={3} />
            ) : secondary.topProductive.length === 0 ? (
              <SmallEmpty text="No daily aggregates yet" />
            ) : (
              <div className="mini-list">
                {secondary.topProductive.map((r, idx) => (
                  <button key={r.userId} className="rank-item" onClick={() => openEmployee(r)}>
                    <span className="rank">{idx + 1}</span>
                    <div>
                      <strong>{r.userName}</strong>
                      <span>{r.productivityScore.toFixed(0)} score · {r.focusScore.toFixed(0)}% focus</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </PanelCompact>

          <PanelCompact title="App distribution" icon="apps">
            {secondary.apps.length === 0 ? (
              <SmallEmpty text="No app usage yet" />
            ) : (
              <div className="bars">
                {secondary.apps.map((app) => {
                  const max = secondary.apps[0]?.seconds || 1;
                  return (
                    <div key={app.key} className="bar-row">
                      <div className="bar-label">
                        <span>{appDisplayName(app.key)}</span>
                        <strong>{formatDuration(app.seconds)}</strong>
                      </div>
                      <div className="bar-track">
                        <div className="bar-fill" style={{ width: `${(app.seconds / max) * 100}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </PanelCompact>

          <PanelCompact title="Workload distribution" icon="donut_large">
            <div className="workload-boxes">
              <WorkloadBox label="Normal" value={workforce.filter((r) => r.workload === "Normal").length} color="#10b981" />
              <WorkloadBox label="Elevated" value={workforce.filter((r) => r.workload === "Elevated").length} color="#f59e0b" />
              <WorkloadBox label="High" value={workforce.filter((r) => r.workload === "High").length} color="#dc2626" />
            </div>
            <div className="category-mini">
              {secondary.categories.slice(0, 4).map((c) => (
                <div key={c.key} className="cat-line">
                  <span className="cat-dot" style={{ background: categoryColor(c.key) }} />
                  <span>{categoryDisplayName(c.key)}</span>
                  <strong>{c.pct.toFixed(0)}%</strong>
                </div>
              ))}
            </div>
          </PanelCompact>
        </aside>
      </main>

      <style jsx>{`
        .ops {
          margin: -32px;
          padding: 18px 22px 28px;
          min-height: calc(100vh - 80px);
          background: #f9fafb;
          color: #0f172a;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .topbar {
          min-height: 54px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
        }
        .brand {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 260px;
        }
        .brand-icon {
          width: 38px;
          height: 38px;
          border-radius: 11px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #5b21b6;
          background: linear-gradient(135deg, #ede9fe, #eef2ff);
          border: 1px solid #ddd6fe;
        }
        .brand-icon .material-icons { font-size: 20px; }
        .eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 10px;
          font-weight: 650;
          letter-spacing: 0.6px;
          text-transform: uppercase;
          color: #7c3aed;
        }
        .sync-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #10b981;
          box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.14);
          animation: pulse 1.6s infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.25); }
        }
        h1 {
          margin: 1px 0 0;
          font-size: 20px;
          font-weight: 700;
          letter-spacing: -0.4px;
          color: #0f172a;
        }

        .top-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          flex: 1;
          justify-content: flex-end;
          min-width: 0;
        }
        .global-search {
          max-width: 380px;
          flex: 1;
          display: flex;
          align-items: center;
          gap: 7px;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 8px 11px;
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.03);
        }
        .global-search .material-icons { color: #94a3b8; font-size: 17px; }
        .global-search input {
          width: 100%;
          border: none;
          outline: none;
          font-family: inherit;
          font-size: 12px;
          color: #0f172a;
          background: transparent;
        }
        .company-chip,
        .refresh,
        .icon-btn {
          height: 36px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          border-radius: 10px;
          border: 1px solid #e2e8f0;
          background: white;
          color: #475569;
          font-family: inherit;
          font-weight: 600;
          font-size: 11px;
          padding: 0 12px;
        }
        .company-chip .material-icons,
        .refresh .material-icons,
        .icon-btn .material-icons { font-size: 16px; }
        .refresh,
        .icon-btn { cursor: pointer; transition: all 0.15s; }
        .refresh:hover:not(:disabled),
        .icon-btn:hover { border-color: #c4b5fd; color: #6d28d9; background: #faf5ff; }
        .refresh:disabled { opacity: 0.5; cursor: wait; }
        .alerts { position: relative; width: 36px; padding: 0; }
        .badge {
          position: absolute;
          top: -6px;
          right: -6px;
          min-width: 17px;
          height: 17px;
          border-radius: 99px;
          background: #dc2626;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 9px;
          font-weight: 700;
          border: 2px solid #f8fafc;
        }

        .status-banner {
          height: 148px;
          display: grid;
          grid-template-columns: 280px 1fr;
          gap: 12px;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          background:
            linear-gradient(135deg, rgba(255, 255, 255, 0.92), rgba(248, 250, 252, 0.96)),
            radial-gradient(circle at 0% 0%, rgba(124, 58, 237, 0.14), transparent 40%),
            radial-gradient(circle at 100% 100%, rgba(16, 185, 129, 0.12), transparent 34%);
          padding: 14px;
          box-shadow: 0 8px 22px rgba(15, 23, 42, 0.05);
        }
        .banner-main {
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 0 8px;
        }
        .banner-title {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #0f172a;
          font-size: 14px;
          font-weight: 650;
        }
        .banner-title .material-icons { color: #7c3aed; font-size: 19px; }
        .banner-main p {
          margin: 8px 0 0;
          color: #64748b;
          font-size: 12px;
          line-height: 1.5;
        }
        .banner-kpis {
          display: grid;
          grid-template-columns: repeat(7, minmax(96px, 1fr));
          gap: 8px;
          min-width: 0;
        }

        .main-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 330px;
          gap: 12px;
          align-items: start;
        }
        .workforce-card,
        .panel-compact {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.03);
          overflow: hidden;
        }
        .table-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
          padding: 13px 16px 10px;
          border-bottom: 1px solid #f1f5f9;
        }
        .table-head h2 {
          margin: 0;
          font-size: 15px;
          font-weight: 650;
          letter-spacing: -0.2px;
          color: #0f172a;
        }
        .table-head p {
          margin: 3px 0 0;
          font-size: 11px;
          color: #64748b;
        }
        .table-head code {
          background: #f1f5f9;
          border-radius: 4px;
          padding: 1px 5px;
          font-size: 10px;
        }
        .table-controls {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .table-controls select,
        .table-controls button {
          height: 30px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          background: #f8fafc;
          color: #475569;
          font-family: inherit;
          font-weight: 600;
          font-size: 11px;
        }
        .table-controls select { padding: 0 10px; }
        .table-controls button {
          width: 30px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .table-controls .material-icons { font-size: 15px; }

        .filters {
          display: flex;
          gap: 7px;
          padding: 10px 12px;
          border-bottom: 1px solid #f1f5f9;
          overflow-x: auto;
        }
        .filter {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          white-space: nowrap;
          border: 1px solid #e2e8f0;
          background: #fff;
          color: #64748b;
          border-radius: 999px;
          padding: 6px 10px;
          font-family: inherit;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
        }
        .filter .material-icons { font-size: 14px; }
        .filter:hover { border-color: #c4b5fd; color: #6d28d9; }
        .filter.active { background: #f5f3ff; color: #6d28d9; border-color: #ddd6fe; }
        .filter-count {
          padding: 1px 7px;
          border-radius: 999px;
          background: #f1f5f9;
          color: #475569;
          font-size: 10px;
        }
        .filter.active .filter-count { background: #ddd6fe; color: #5b21b6; }

        .table-wrap {
          overflow: auto;
          max-height: calc(100vh - 330px);
          min-height: 430px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
          min-width: 1120px;
        }
        th,
        td {
          padding: 10px 12px;
          text-align: left;
          border-bottom: 1px solid #f1f5f9;
          vertical-align: middle;
        }
        th {
          position: sticky;
          top: 0;
          z-index: 1;
          background: #fafbfd;
          font-size: 10px;
          font-weight: 650;
          text-transform: uppercase;
          letter-spacing: 0.55px;
          color: #64748b;
        }
        tbody tr {
          cursor: pointer;
          transition: background 0.12s;
        }
        tbody tr:hover { background: #fafbfd; }

        .side-panels {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .mini-list { display: flex; flex-direction: column; gap: 7px; }
        .anom-item,
        .rank-item {
          width: 100%;
          display: flex;
          gap: 9px;
          align-items: center;
          text-align: left;
          border: 1px solid #f1f5f9;
          background: #fafbfd;
          border-radius: 9px;
          padding: 8px;
          font-family: inherit;
          cursor: pointer;
          transition: all 0.15s;
        }
        .anom-item:hover,
        .rank-item:hover { border-color: #c4b5fd; background: white; }
        .sev-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .anom-item strong,
        .rank-item strong {
          display: block;
          font-size: 11px;
          color: #0f172a;
          line-height: 1.25;
        }
        .anom-item span:not(.sev-dot),
        .rank-item span:not(.rank) {
          display: block;
          margin-top: 2px;
          font-size: 10px;
          color: #94a3b8;
        }
        .rank {
          width: 22px;
          height: 22px;
          border-radius: 7px;
          background: #ede9fe;
          color: #6d28d9;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 650;
          flex-shrink: 0;
        }
        .bars { display: flex; flex-direction: column; gap: 9px; }
        .bar-label {
          display: flex;
          justify-content: space-between;
          gap: 8px;
          font-size: 11px;
          color: #475569;
          margin-bottom: 4px;
        }
        .bar-label strong { color: #7c3aed; font-size: 10px; }
        .bar-track {
          height: 5px;
          background: #f1f5f9;
          border-radius: 999px;
          overflow: hidden;
        }
        .bar-fill {
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, #7c3aed, #3b82f6);
        }
        .workload-boxes {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 7px;
        }
        .category-mini {
          margin-top: 12px;
          display: flex;
          flex-direction: column;
          gap: 7px;
        }
        .cat-line {
          display: grid;
          grid-template-columns: 8px 1fr auto;
          gap: 7px;
          align-items: center;
          font-size: 11px;
          color: #475569;
        }
        .cat-line strong { color: #0f172a; }
        .cat-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .error-state {
          padding: 40px 24px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 14px;
          color: #b91c1c;
          text-align: center;
        }
        .error-state .material-icons { font-size: 40px; }
        .error-state h3 { margin: 8px 0 4px; }
        .error-state p { margin: 0; font-size: 13px; }

        @media (max-width: 1280px) {
          .status-banner { grid-template-columns: 1fr; height: auto; }
          .banner-kpis { grid-template-columns: repeat(4, minmax(110px, 1fr)); }
          .main-grid { grid-template-columns: 1fr; }
          .table-wrap { max-height: none; }
          .side-panels { grid-template-columns: repeat(2, 1fr); display: grid; }
        }
        @media (max-width: 760px) {
          .ops { padding: 14px; margin: -24px; }
          .topbar { align-items: flex-start; flex-direction: column; }
          .top-actions { width: 100%; flex-wrap: wrap; justify-content: flex-start; }
          .global-search { max-width: none; min-width: 100%; }
          .banner-kpis { grid-template-columns: repeat(2, 1fr); }
          .side-panels { display: flex; }
        }
      `}</style>
    </div>
  );
}

function KpiBox({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone: "green" | "purple" | "amber" | "red" | "blue" | "cyan" | "slate";
}) {
  const colorMap: Record<typeof tone, string> = {
    green: "#10b981",
    purple: "#7c3aed",
    amber: "#f59e0b",
    red: "#dc2626",
    blue: "#3b82f6",
    cyan: "#06b6d4",
    slate: "#64748b",
  } as const;
  const color = colorMap[tone];
  return (
    <div className="kbox">
      <div className="value" style={{ color }}>{value}</div>
      <div className="label">{label}</div>
      <style jsx>{`
        .kbox {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 12px 10px;
          min-width: 0;
          display: flex;
          flex-direction: column;
          justify-content: center;
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.03);
        }
        .value {
          font-size: 21px;
          font-weight: 650;
          line-height: 1;
          font-variant-numeric: tabular-nums;
          letter-spacing: -0.25px;
        }
        .label {
          margin-top: 6px;
          color: #94a3b8;
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.55px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      `}</style>
    </div>
  );
}

function Th({
  label,
  sortKey,
  active,
  dir,
  onSort,
}: {
  label: string;
  sortKey: SortKey;
  active: SortKey;
  dir: "asc" | "desc";
  onSort: (key: SortKey) => void;
}) {
  return (
    <th>
      <button className="th-btn" onClick={() => onSort(sortKey)}>
        {label}
        {active === sortKey && <span>{dir === "asc" ? "▲" : "▼"}</span>}
      </button>
      <style jsx>{`
        .th-btn {
          padding: 0;
          background: transparent;
          border: none;
          color: inherit;
          font: inherit;
          text-transform: inherit;
          letter-spacing: inherit;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 5px;
        }
        .th-btn span { font-size: 8px; color: #7c3aed; }
      `}</style>
    </th>
  );
}

function WorkforceRow({ row, onClick }: { row: EmployeeRow; onClick: () => void }) {
  const sColor = stateColor(row.state);
  const prodColor = row.productivityScore >= 70 ? "#059669" : row.productivityScore >= 45 ? "#d97706" : "#dc2626";
  const focusColor = row.focusScore >= 70 ? "#059669" : row.focusScore >= 40 ? "#d97706" : "#dc2626";
  const workloadColor = row.workload === "High" ? "#dc2626" : row.workload === "Elevated" ? "#d97706" : "#059669";

  return (
    <tr onClick={onClick}>
      <td>
        <div className="employee-cell">
          <Avatar name={row.userName || row.userEmail} state={row.state === "offline" ? null : row.state} size={32} />
          <div className="emp-meta">
            <div className="emp-name">{row.userName || row.userEmail}</div>
            <div className="emp-sub">
              {row.userEmail} · {row.deviceCount || 0} device{row.deviceCount === 1 ? "" : "s"}
            </div>
          </div>
        </div>
      </td>
      <td>
        <span className="status" style={{ color: sColor, background: `${sColor}12`, borderColor: `${sColor}44` }}>
          <span className="status-dot" style={{ background: sColor }} />
          {stateLabel(row.state)}
        </span>
        <div className="last">{timeAgo(row.lastActivity)}</div>
      </td>
      <td>
        <div className="app-cell">
          <span className="app-name">{appDisplayName(row.currentApp)}</span>
          <span className="window" title={row.activeWindow}>{row.activeWindow}</span>
          <span className="category" style={{ color: categoryColor(row.currentCategory), background: `${categoryColor(row.currentCategory)}14` }}>
            {categoryDisplayName(row.currentCategory)}
          </span>
        </div>
      </td>
      <td>
        <div className="score-cell">
          <span className="score" style={{ color: prodColor }}>{row.productivityScore ? row.productivityScore.toFixed(0) : "—"}</span>
          <span className="score-sub">{row.productivityScore ? productivityLabel(row.productivityScore) : "No aggregate"}</span>
        </div>
      </td>
      <td>
        <div className="focus-cell">
          <strong style={{ color: focusColor }}>{row.focusScore ? `${row.focusScore.toFixed(0)}%` : "—"}</strong>
          <span>{row.switchPerHour ? `${row.switchPerHour.toFixed(1)} switch/j` : "—"}</span>
        </div>
      </td>
      <td><MeterBar value={row.cpu} thresholdHigh={80} thresholdMid={60} suffix="%" /></td>
      <td><MeterBar value={row.ram} thresholdHigh={80} thresholdMid={60} suffix="%" /></td>
      <td>
        <div className="session">
          <strong>{row.sessionSeconds ? formatDuration(row.sessionSeconds) : "—"}</strong>
          <span style={{ color: workloadColor }}>{row.workload}</span>
        </div>
      </td>
      <td><MeterBar value={row.health} reverse thresholdHigh={70} thresholdMid={40} /></td>
      <td>
        <div className="alerts-cell">
          {row.anomalyCount > 0 ? (
            <span className="alert-pill" data-critical={row.criticalCount > 0}>
              {row.criticalCount > 0 ? row.criticalCount : row.anomalyCount}
            </span>
          ) : (
            <span className="ok-pill">OK</span>
          )}
          <span className="material-icons open">chevron_right</span>
        </div>
      </td>
      <style jsx>{`
        .employee-cell { display: flex; align-items: center; gap: 10px; min-width: 230px; }
        .emp-meta { min-width: 0; }
        .emp-name {
          font-weight: 650;
          color: #0f172a;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 190px;
        }
        .emp-sub {
          margin-top: 2px;
          font-size: 10px;
          color: #94a3b8;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 230px;
        }
        .status {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          border: 1px solid;
          border-radius: 999px;
          padding: 3px 9px;
          font-size: 10px;
          font-weight: 650;
          text-transform: uppercase;
          letter-spacing: 0.35px;
        }
        .status-dot { width: 6px; height: 6px; border-radius: 50%; }
        .last { font-size: 10px; color: #94a3b8; margin-top: 4px; }
        .app-cell { display: flex; flex-direction: column; gap: 3px; min-width: 210px; }
        .app-name { font-weight: 650; color: #0f172a; }
        .window {
          max-width: 260px;
          font-size: 10px;
          color: #64748b;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .category {
          align-self: flex-start;
          border-radius: 5px;
          padding: 2px 7px;
          font-size: 9px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }
        .score-cell,
        .focus-cell,
        .session { display: flex; flex-direction: column; gap: 3px; }
        .score { font-size: 14px; font-weight: 650; line-height: 1; }
        .score-sub,
        .focus-cell span,
        .session span { font-size: 10px; color: #94a3b8; white-space: nowrap; }
        .focus-cell strong,
        .session strong { font-size: 12px; font-weight: 650; color: #0f172a; }
        .alerts-cell { display: flex; align-items: center; gap: 8px; }
        .alert-pill,
        .ok-pill {
          min-width: 28px;
          height: 22px;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: 650;
        }
        .alert-pill { background: #fff1f2; color: #be123c; }
        .alert-pill[data-critical="true"] { background: #fee2e2; color: #b91c1c; }
        .ok-pill { background: #ecfdf5; color: #059669; }
        .open { color: #cbd5e1; font-size: 18px; }
      `}</style>
    </tr>
  );
}

function PanelCompact({
  title,
  icon,
  children,
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <section className="panel-compact">
      <header>
        <span className="material-icons">{icon}</span>
        <h3>{title}</h3>
      </header>
      <div className="body">{children}</div>
      <style jsx>{`
        .panel-compact {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          overflow: hidden;
        }
        header {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 11px 12px;
          border-bottom: 1px solid #f1f5f9;
          background: #fafbfd;
        }
        header .material-icons { font-size: 16px; color: #7c3aed; }
        h3 {
          margin: 0;
          font-size: 12px;
          color: #0f172a;
          font-weight: 650;
          letter-spacing: -0.1px;
        }
        .body { padding: 11px; }
      `}</style>
    </section>
  );
}

function SmallEmpty({ text }: { text: string }) {
  return (
    <div className="small-empty">
      {text}
      <style jsx>{`
        .small-empty {
          padding: 18px 10px;
          text-align: center;
          color: #94a3b8;
          font-size: 11px;
        }
      `}</style>
    </div>
  );
}

function WorkloadBox({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="wb">
      <div className="v" style={{ color }}>{value}</div>
      <div className="l">{label}</div>
      <style jsx>{`
        .wb {
          background: #fafbfd;
          border: 1px solid #f1f5f9;
          border-radius: 9px;
          padding: 9px 7px;
          text-align: center;
        }
        .v { font-size: 17px; font-weight: 650; line-height: 1; }
        .l { margin-top: 5px; font-size: 9px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.4px; }
      `}</style>
    </div>
  );
}
