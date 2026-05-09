"use client";

import { useEffect, useMemo, useState } from "react";
import { useCompanyId } from "@/lib/intelligence/useCompanyId";
import {
  subscribeLivePresence,
  subscribeRecentAnomalies,
} from "@/services/intelligenceService";
import type { AnomalyEvent, LivePresence } from "@/lib/intelligence/types";

import { OverviewTab } from "./_components/OverviewTab";
import { LiveTab } from "./_components/LiveTab";
import { DeviceHealthTab } from "./_components/DeviceHealthTab";
import { WorkforceTab } from "./_components/WorkforceTab";
import { TimelineTab } from "./_components/TimelineTab";
import { AnomaliesTab } from "./_components/AnomaliesTab";
import { SessionsTab } from "./_components/SessionsTab";
import { DeviceInspector } from "./_components/DeviceInspector";

type TabId =
  | "overview"
  | "live"
  | "health"
  | "workforce"
  | "timeline"
  | "anomalies"
  | "sessions";

interface TabDef {
  id: TabId;
  icon: string;
  label: string;
  short?: string;
}

const TABS: TabDef[] = [
  { id: "overview", icon: "dashboard", label: "Overview" },
  { id: "live", icon: "sensors", label: "Live Monitoring", short: "Live" },
  { id: "health", icon: "monitor_heart", label: "Device Health", short: "Health" },
  { id: "workforce", icon: "groups", label: "Workforce Analytics", short: "Workforce" },
  { id: "timeline", icon: "timeline", label: "Activity Timeline", short: "Timeline" },
  { id: "anomalies", icon: "warning_amber", label: "Anomalies" },
  { id: "sessions", icon: "manage_search", label: "Employee Sessions", short: "Sessions" },
];

export default function DeviceIntelligenceCenter() {
  const { companyId, loading: cidLoading, error: cidError } = useCompanyId();
  const [tab, setTab] = useState<TabId>("overview");

  // Shared realtime presence stream — subscribed once at the workspace level
  const [presence, setPresence] = useState<LivePresence[]>([]);
  const [presenceLoading, setPresenceLoading] = useState(true);

  // Critical anomaly stream for the alert banner (last 24h)
  const [anomalies, setAnomalies] = useState<AnomalyEvent[]>([]);

  // Slide-over device inspector
  const [selectedDevice, setSelectedDevice] = useState<LivePresence | null>(null);

  useEffect(() => {
    if (!companyId) return;
    setPresenceLoading(true);
    const unsubP = subscribeLivePresence(
      companyId,
      (rows) => {
        setPresence(rows);
        setPresenceLoading(false);
      },
      () => setPresenceLoading(false)
    );
    const unsubA = subscribeRecentAnomalies(companyId, 24, setAnomalies);
    return () => {
      unsubP();
      unsubA();
    };
  }, [companyId]);

  // Keep selectedDevice in sync if presence updates
  useEffect(() => {
    if (!selectedDevice) return;
    const fresh = presence.find((p) => p.deviceId === selectedDevice.deviceId);
    if (fresh && fresh !== selectedDevice) setSelectedDevice(fresh);
  }, [presence, selectedDevice]);

  // Ribbon stats
  const ribbon = useMemo(() => {
    const online = presence.filter((p) => p.state === "active").length;
    const idle = presence.filter((p) => p.state === "idle").length;
    const away = presence.filter((p) => p.state === "away").length;
    const stressed = presence.filter(
      (p) => (p.cpuNow ?? 0) >= 80 || (p.ramNow ?? 0) >= 80
    ).length;
    const critical = anomalies.filter(
      (a) => a.severity === "critical" || a.severity === "high"
    ).length;
    return { total: presence.length, online, idle, away, stressed, critical };
  }, [presence, anomalies]);

  if (cidError) {
    return (
      <div className="dic-error">
        <span className="material-icons">error</span>
        <h3>Gagal memuat profil perusahaan</h3>
        <p>{cidError.message}</p>
      </div>
    );
  }

  return (
    <div className="dic">
      {/* Command center hero */}
      <header className="hero">
        <div className="hero-bg" />
        <div className="hero-content">
          <div className="hero-l">
            <div className="hero-icon">
              <span className="material-icons">insights</span>
            </div>
            <div>
              <div className="hero-eyebrow">
                <span className="live-dot" />
                VORCE Device Intelligence Center
              </div>
              <h1>Centralized workforce observability</h1>
              <p>
                Monitor presence, device health, dan produktivitas tim secara realtime
                dari pipeline analitik on-device VORCE.
              </p>
            </div>
          </div>

          <div className="ribbon">
            <RibbonStat
              icon="devices"
              label="Devices"
              value={presenceLoading ? "—" : String(ribbon.total)}
              tone="default"
            />
            <RibbonStat
              icon="bolt"
              label="Aktif"
              value={presenceLoading ? "—" : String(ribbon.online)}
              tone="active"
              pulse={ribbon.online > 0}
            />
            <RibbonStat
              icon="hourglass_top"
              label="Idle"
              value={presenceLoading ? "—" : String(ribbon.idle)}
              tone="idle"
            />
            <RibbonStat
              icon="cloud_off"
              label="Away"
              value={presenceLoading ? "—" : String(ribbon.away)}
              tone="away"
            />
            <RibbonStat
              icon="warning"
              label="Beban Tinggi"
              value={presenceLoading ? "—" : String(ribbon.stressed)}
              tone={ribbon.stressed > 0 ? "warn" : "default"}
            />
            <RibbonStat
              icon="warning_amber"
              label="Anomali Kritis 24j"
              value={String(ribbon.critical)}
              tone={ribbon.critical > 0 ? "danger" : "default"}
              pulse={ribbon.critical > 0}
            />
          </div>
        </div>
      </header>

      {/* Tab bar */}
      <nav className="tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`tab ${tab === t.id ? "active" : ""}`}
            onClick={() => setTab(t.id)}
          >
            <span className="material-icons">{t.icon}</span>
            <span className="tab-label">{t.label}</span>
            <span className="tab-label-short">{t.short || t.label}</span>
            {t.id === "anomalies" && ribbon.critical > 0 && (
              <span className="tab-badge">{ribbon.critical}</span>
            )}
          </button>
        ))}
      </nav>

      {/* Workspace content */}
      <main className="workspace">
        {cidLoading ? (
          <div className="loading-block">
            <div className="spinner" />
            <p>Memuat workspace...</p>
          </div>
        ) : !companyId ? (
          <div className="dic-error">
            <span className="material-icons">no_accounts</span>
            <h3>Profil perusahaan tidak ditemukan</h3>
            <p>Pastikan akun Anda terkait dengan suatu perusahaan.</p>
          </div>
        ) : (
          <>
            {tab === "overview" && (
              <OverviewTab
                companyId={companyId}
                presence={presence}
                presenceLoading={presenceLoading}
                goLive={() => setTab("live")}
                goAnomalies={() => setTab("anomalies")}
                goWorkforce={() => setTab("workforce")}
              />
            )}
            {tab === "live" && (
              <LiveTab
                presence={presence}
                loading={presenceLoading}
                onSelectDevice={setSelectedDevice}
              />
            )}
            {tab === "health" && (
              <DeviceHealthTab
                presence={presence}
                loading={presenceLoading}
                onSelectDevice={setSelectedDevice}
              />
            )}
            {tab === "workforce" && <WorkforceTab companyId={companyId} />}
            {tab === "timeline" && <TimelineTab companyId={companyId} />}
            {tab === "anomalies" && <AnomaliesTab companyId={companyId} />}
            {tab === "sessions" && (
              <SessionsTab companyId={companyId} presence={presence} />
            )}
          </>
        )}
      </main>

      {/* Slide-over device inspector */}
      {selectedDevice && companyId && (
        <DeviceInspector
          companyId={companyId}
          device={selectedDevice}
          onClose={() => setSelectedDevice(null)}
        />
      )}

      <style jsx>{`
        .dic {
          display: flex;
          flex-direction: column;
          gap: 18px;
          margin: -32px;
          padding: 28px 32px 40px;
          min-height: calc(100vh - 80px);
          background:
            radial-gradient(circle at 100% 0%, rgba(124, 58, 237, 0.04), transparent 50%),
            radial-gradient(circle at 0% 100%, rgba(59, 130, 246, 0.04), transparent 50%),
            #f8fafc;
        }

        /* ── Hero ──────────────────────────────────────────────────── */
        .hero {
          position: relative;
          background: linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #0f172a 100%);
          border-radius: 22px;
          padding: 28px 32px 24px;
          color: white;
          overflow: hidden;
          box-shadow: 0 20px 50px rgba(15, 23, 42, 0.15);
        }
        .hero-bg {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at 10% 0%, rgba(124, 58, 237, 0.5), transparent 35%),
            radial-gradient(circle at 90% 100%, rgba(59, 130, 246, 0.4), transparent 35%),
            radial-gradient(circle at 60% 50%, rgba(16, 185, 129, 0.15), transparent 30%);
          pointer-events: none;
        }
        .hero-content {
          position: relative;
          display: flex;
          flex-direction: column;
          gap: 22px;
        }
        .hero-l {
          display: flex;
          align-items: flex-start;
          gap: 18px;
        }
        .hero-icon {
          width: 52px;
          height: 52px;
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.12);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.15);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .hero-icon .material-icons { color: white; font-size: 26px; }
        .hero-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 1px;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.75);
        }
        .live-dot {
          width: 8px; height: 8px;
          background: #10b981;
          border-radius: 50%;
          box-shadow: 0 0 10px #10b981;
          animation: pulse 1.6s infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.3); }
        }
        .hero h1 {
          font-size: clamp(20px, 2.6vw, 26px);
          font-weight: 800;
          margin: 6px 0 4px;
          letter-spacing: -0.5px;
        }
        .hero p {
          font-size: 13px;
          opacity: 0.8;
          margin: 0;
          max-width: 600px;
          line-height: 1.55;
        }

        /* ── Ribbon stats ─────────────────────────────────────────── */
        .ribbon {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 10px;
        }
        @media (max-width: 1100px) {
          .ribbon { grid-template-columns: repeat(3, 1fr); }
        }
        @media (max-width: 600px) {
          .ribbon { grid-template-columns: repeat(2, 1fr); }
        }

        /* ── Tabs ─────────────────────────────────────────────────── */
        .tabs {
          display: flex;
          background: white;
          border: 1px solid #f1f5f9;
          border-radius: 14px;
          padding: 5px;
          gap: 2px;
          overflow-x: auto;
          scrollbar-width: none;
          position: sticky;
          top: 0;
          z-index: 5;
          box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04);
        }
        .tabs::-webkit-scrollbar { display: none; }
        .tab {
          background: transparent;
          border: none;
          padding: 9px 16px;
          border-radius: 9px;
          font-family: inherit;
          font-weight: 700;
          font-size: 13px;
          color: #64748b;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          white-space: nowrap;
          transition: all 0.18s ease;
          position: relative;
        }
        .tab .material-icons { font-size: 17px; }
        .tab:hover {
          color: #1e293b;
          background: #f8fafc;
        }
        .tab.active {
          background: linear-gradient(135deg, #f5f3ff, #ede9fe);
          color: #5b21b6;
          box-shadow: 0 2px 6px rgba(124, 58, 237, 0.08);
        }
        .tab-label-short { display: none; }
        @media (max-width: 1200px) {
          .tab-label { display: none; }
          .tab-label-short { display: inline; }
        }
        @media (max-width: 700px) {
          .tab-label-short { display: none; }
        }
        .tab-badge {
          background: #ef4444;
          color: white;
          padding: 1px 7px;
          border-radius: 99px;
          font-size: 10px;
          font-weight: 800;
          margin-left: 2px;
        }

        /* ── Workspace ────────────────────────────────────────────── */
        .workspace {
          flex: 1;
          min-height: 0;
        }

        .loading-block {
          padding: 80px 20px;
          text-align: center;
          color: #94a3b8;
        }
        .spinner {
          width: 36px; height: 36px;
          border: 3px solid #e2e8f0;
          border-top-color: #7c3aed;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin: 0 auto 14px;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .loading-block p { font-size: 13px; margin: 0; }

        .dic-error {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #b91c1c;
          padding: 32px 24px;
          border-radius: 14px;
          text-align: center;
        }
        .dic-error .material-icons { font-size: 40px; }
        .dic-error h3 { margin: 8px 0 4px; }
        .dic-error p { margin: 0; font-size: 13px; opacity: 0.8; }
      `}</style>
    </div>
  );
}

function RibbonStat({
  icon,
  label,
  value,
  tone,
  pulse,
}: {
  icon: string;
  label: string;
  value: string;
  tone: "default" | "active" | "idle" | "away" | "warn" | "danger";
  pulse?: boolean;
}) {
  const colors: Record<typeof tone, string> = {
    default: "#cbd5e1",
    active: "#34d399",
    idle: "#fbbf24",
    away: "#94a3b8",
    warn: "#fb923c",
    danger: "#f87171",
  } as const;
  const color = colors[tone];
  return (
    <div className={`rs ${tone}`}>
      <div className="rs-icon" style={{ color }}>
        <span className="material-icons">{icon}</span>
        {pulse && <span className="rs-pulse" style={{ background: color }} />}
      </div>
      <div className="rs-body">
        <div className="rs-num">{value}</div>
        <div className="rs-lbl">{label}</div>
      </div>
      <style jsx>{`
        .rs {
          background: rgba(255, 255, 255, 0.07);
          border: 1px solid rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          padding: 10px 14px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 10px;
          transition: all 0.2s;
        }
        .rs.danger { border-color: rgba(239, 68, 68, 0.4); background: rgba(239, 68, 68, 0.08); }
        .rs.warn { border-color: rgba(251, 146, 60, 0.4); background: rgba(251, 146, 60, 0.08); }

        .rs-icon {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .rs-icon .material-icons { font-size: 20px; }
        .rs-pulse {
          position: absolute;
          top: 0; right: -3px;
          width: 6px; height: 6px;
          border-radius: 50%;
          animation: rspulse 1.4s infinite;
        }
        @keyframes rspulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.3; transform: scale(1.7); }
        }

        .rs-body { line-height: 1.1; }
        .rs-num {
          font-size: 17px;
          font-weight: 800;
          color: white;
          font-variant-numeric: tabular-nums;
        }
        .rs-lbl {
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.6);
          margin-top: 3px;
        }
      `}</style>
    </div>
  );
}
