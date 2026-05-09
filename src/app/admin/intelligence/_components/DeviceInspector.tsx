"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  getActivityPage,
  getEmployeeDaily,
} from "@/services/intelligenceService";
import {
  appDisplayName,
  categoryColor,
  categoryDisplayName,
  deriveDailyMetrics,
  formatDuration,
  presenceLabel,
  productivityColor,
  productivityDisplayName,
  productivityLabel,
} from "@/lib/intelligence/derived";
import type {
  ActivityTimelineEntry,
  EmployeeBehaviorDaily,
  LivePresence,
} from "@/lib/intelligence/types";
import { Avatar, EmptyState, MeterBar } from "./shared";

interface Props {
  companyId: string;
  device: LivePresence;
  onClose: () => void;
}

export function DeviceInspector({ companyId, device, onClose }: Props) {
  const [daily, setDaily] = useState<EmployeeBehaviorDaily | null>(null);
  const [activity, setActivity] = useState<ActivityTimelineEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    Promise.all([
      getEmployeeDaily(companyId, device.userId),
      getActivityPage(companyId, { pageSize: 15, deviceId: device.deviceId }),
    ])
      .then(([d, a]) => {
        if (!alive) return;
        setDaily(d);
        setActivity(a.items);
        setLoading(false);
      })
      .catch(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [companyId, device.deviceId, device.userId]);

  // Esc to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const stateColor =
    device.state === "active"
      ? "#10b981"
      : device.state === "idle"
      ? "#f59e0b"
      : "#94a3b8";
  const m = daily ? deriveDailyMetrics(daily) : null;

  return (
    <>
      <div className="backdrop" onClick={onClose} />
      <aside className="inspector" role="dialog">
        <header className="head">
          <div className="head-l">
            <Avatar name={device.userName || device.userEmail} state={device.state} size={48} />
            <div className="who">
              <h2>{device.userName || device.userEmail}</h2>
              <div className="email">{device.userEmail}</div>
            </div>
          </div>
          <button className="close" onClick={onClose} aria-label="Close">
            <span className="material-icons">close</span>
          </button>
        </header>

        <div className="meta-row">
          <div
            className="state-pill"
            style={{
              color: stateColor,
              borderColor: `${stateColor}55`,
              background: `${stateColor}10`,
            }}
          >
            <span className="ldot" style={{ background: stateColor }} />
            {presenceLabel(device.state)}
          </div>
          <div className="device-id" title={device.deviceId}>
            <span className="material-icons">computer</span>
            <code>{device.deviceId.slice(0, 18)}…</code>
          </div>
        </div>

        <section className="section">
          <h4>Aktivitas Saat Ini</h4>
          <div className="now">
            <span
              className="cat"
              style={{
                background: `${categoryColor(device.currentCategory)}1a`,
                color: categoryColor(device.currentCategory),
              }}
            >
              {categoryDisplayName(device.currentCategory)}
            </span>
            <div className="app">{appDisplayName(device.currentApp)}</div>
            {device.activeWindow && <div className="window">{device.activeWindow}</div>}
          </div>
        </section>

        <section className="section">
          <h4>Telemetri Sekarang</h4>
          <div className="meters">
            <Meter label="CPU" value={device.cpuNow ?? 0} reverse={false} thresholdHigh={80} thresholdMid={60} suffix="%" />
            <Meter label="RAM" value={device.ramNow ?? 0} reverse={false} thresholdHigh={80} thresholdMid={60} suffix="%" />
            <Meter label="Health" value={device.healthScore ?? 0} reverse thresholdHigh={70} thresholdMid={40} />
          </div>
        </section>

        <section className="section">
          <h4>Ringkasan Hari Ini</h4>
          {loading ? (
            <div className="loading-line">Memuat...</div>
          ) : !daily || !m ? (
            <EmptyState icon="trending_flat" message="Belum ada agregat harian." />
          ) : (
            <div className="day-grid">
              <Stat label="Skor Produktivitas" value={m.productivityScore.toFixed(1)} sub={productivityLabel(m.productivityScore)} />
              <Stat label="Jam Aktif" value={formatDuration(m.activeHours * 3600)} sub={`Idle ${formatDuration(m.idleHours * 3600)}`} />
              <Stat label="Sesi" value={m.sessionCount} sub={`${m.anomalyCount} anomali`} />
              <Stat label="Switch / Jam" value={m.switchPerHour.toFixed(1)} sub={`Fokus ${(m.focusRatio * 100).toFixed(0)}%`} />
            </div>
          )}
        </section>

        <section className="section">
          <h4>Sesi Terbaru</h4>
          {loading ? (
            <div className="loading-line">Memuat sesi...</div>
          ) : activity.length === 0 ? (
            <EmptyState icon="history_toggle_off" message="Belum ada sesi tercatat." />
          ) : (
            <div className="acts">
              {activity.map((a) => {
                const start = a.startedAt?.toDate?.() ?? new Date();
                const focus = Math.round(a.focusScore || 0);
                return (
                  <div key={a.sessionId} className="act">
                    <div
                      className="dot"
                      style={{ background: categoryColor(a.category) }}
                    />
                    <div className="t">
                      {start.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                    <div className="info">
                      <div className="row1">
                        <span className="app">{appDisplayName(a.app)}</span>
                        <span
                          className="prod"
                          style={{
                            background: `${productivityColor(a.productivityType)}1a`,
                            color: productivityColor(a.productivityType),
                          }}
                        >
                          {productivityDisplayName(a.productivityType)}
                        </span>
                      </div>
                      <div className="row2">
                        <span>{categoryDisplayName(a.category)}</span>
                        <span className="sep">·</span>
                        <span>{formatDuration(a.durationSeconds)}</span>
                        <span className="sep">·</span>
                        <span style={{ color: focus >= 70 ? "#10b981" : focus >= 40 ? "#f59e0b" : "#ef4444" }}>
                          Fokus {focus}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <footer className="foot">
          <Link
            href={`/admin/intelligence/employee/${encodeURIComponent(device.userId)}`}
            className="full-btn"
          >
            <span className="material-icons">open_in_full</span>
            Buka Profil Lengkap Karyawan
          </Link>
        </footer>
      </aside>

      <style jsx>{`
        .backdrop {
          position: fixed; inset: 0;
          background: rgba(15, 23, 42, 0.45);
          backdrop-filter: blur(3px);
          z-index: 80;
          animation: fadeIn 0.18s ease;
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

        .inspector {
          position: fixed;
          top: 0;
          right: 0;
          bottom: 0;
          width: clamp(360px, 38vw, 540px);
          background: white;
          z-index: 90;
          box-shadow: -16px 0 40px rgba(15, 23, 42, 0.12);
          display: flex;
          flex-direction: column;
          overflow-y: auto;
          animation: slideIn 0.22s cubic-bezier(0.32, 0.72, 0.4, 1);
        }
        @keyframes slideIn {
          from { transform: translateX(40px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }

        .head {
          display: flex; align-items: center; gap: 14px;
          padding: 22px 24px 16px;
          border-bottom: 1px solid #f1f5f9;
        }
        .head-l { display: flex; gap: 14px; align-items: center; flex: 1; min-width: 0; }
        .who { min-width: 0; flex: 1; }
        h2 { font-size: 17px; font-weight: 700; color: #0f172a; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .email { font-size: 12px; color: #94a3b8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        .close {
          background: #f1f5f9;
          border: none;
          width: 36px; height: 36px;
          border-radius: 10px;
          color: #475569;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          transition: all 0.15s;
        }
        .close:hover { background: #e2e8f0; color: #0f172a; }

        .meta-row {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 24px;
          border-bottom: 1px solid #f1f5f9;
          flex-wrap: wrap;
        }
        .state-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 12px;
          border-radius: 99px;
          border: 1px solid;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.4px;
          text-transform: uppercase;
        }
        .ldot { width: 6px; height: 6px; border-radius: 50%; }
        .device-id { display: flex; align-items: center; gap: 4px; font-size: 11px; color: #94a3b8; margin-left: auto; }
        .device-id .material-icons { font-size: 14px; }
        .device-id code { background: #f1f5f9; padding: 2px 8px; border-radius: 4px; font-family: 'JetBrains Mono', monospace; }

        .section { padding: 18px 24px; border-bottom: 1px solid #f1f5f9; }
        .section h4 {
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          color: #94a3b8;
          margin: 0 0 12px;
        }
        .loading-line { font-size: 13px; color: #94a3b8; padding: 16px 0; }

        .now { display: flex; flex-direction: column; gap: 4px; }
        .cat {
          align-self: flex-start;
          padding: 3px 10px;
          border-radius: 6px;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.3px;
          text-transform: uppercase;
        }
        .app { font-weight: 700; font-size: 15px; color: #0f172a; }
        .window { font-size: 12px; color: #64748b; }

        .meters { display: flex; flex-direction: column; gap: 10px; }

        .day-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        .acts { display: flex; flex-direction: column; gap: 10px; }
        .act {
          display: grid;
          grid-template-columns: 8px 50px 1fr;
          gap: 10px;
          align-items: center;
          padding: 8px 0;
        }
        .dot { width: 8px; height: 8px; border-radius: 50%; }
        .t { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #475569; font-weight: 600; }
        .info { min-width: 0; }
        .row1 { display: flex; align-items: center; gap: 8px; }
        .app { font-weight: 700; font-size: 13px; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .prod { padding: 2px 8px; border-radius: 99px; font-size: 9px; font-weight: 800; letter-spacing: 0.3px; text-transform: uppercase; }
        .row2 { font-size: 11px; color: #64748b; display: flex; gap: 6px; align-items: center; margin-top: 2px; }
        .sep { color: #cbd5e1; }

        .foot { padding: 18px 24px; margin-top: auto; }
        .full-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          padding: 12px;
          background: linear-gradient(135deg, #7c3aed, #4f46e5);
          color: white;
          border-radius: 12px;
          font-weight: 700;
          font-size: 13px;
          text-decoration: none;
          transition: opacity 0.15s;
        }
        .full-btn:hover { opacity: 0.9; }
        .full-btn .material-icons { font-size: 18px; }
      `}</style>
    </>
  );
}

function Meter({
  label,
  value,
  reverse,
  thresholdHigh,
  thresholdMid,
  suffix = "",
}: {
  label: string;
  value: number;
  reverse?: boolean;
  thresholdHigh: number;
  thresholdMid: number;
  suffix?: string;
}) {
  return (
    <div className="m">
      <div className="lbl">{label}</div>
      <MeterBar
        value={value}
        reverse={reverse}
        thresholdHigh={thresholdHigh}
        thresholdMid={thresholdMid}
        suffix={suffix}
      />
      <style jsx>{`
        .m { display: grid; grid-template-columns: 60px 1fr; gap: 12px; align-items: center; }
        .lbl { font-size: 11px; font-weight: 700; color: #64748b; }
      `}</style>
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="s">
      <div className="lbl">{label}</div>
      <div className="val">{value}</div>
      {sub && <div className="sub">{sub}</div>}
      <style jsx>{`
        .s {
          background: #fafbfd;
          padding: 12px;
          border-radius: 10px;
        }
        .lbl { font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; }
        .val { font-size: 18px; font-weight: 800; color: #0f172a; margin-top: 4px; line-height: 1; }
        .sub { font-size: 11px; color: #64748b; margin-top: 4px; }
      `}</style>
    </div>
  );
}
