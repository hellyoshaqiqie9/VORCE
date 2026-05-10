"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useCompanyId } from "@/lib/intelligence/useCompanyId";
import {
  getActivityPage,
  getDevicePresence,
  subscribeUserPresence,
} from "@/services/intelligenceService";
import {
  appDisplayName,
  categoryColor,
  categoryDisplayName,
  formatDuration,
  presenceLabel,
  productivityColor,
  productivityDisplayName,
} from "@/lib/intelligence/derived";
import type {
  ActivityTimelineEntry,
  LivePresence,
} from "@/lib/intelligence/types";

export default function DeviceDetailPage() {
  const { deviceId: rawId } = useParams<{ deviceId: string }>();
  const deviceId = decodeURIComponent(rawId || "");
  const { companyId } = useCompanyId();
  const [presence, setPresence] = useState<LivePresence | null>(null);
  const [activity, setActivity] = useState<ActivityTimelineEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!companyId || !deviceId) return;
    let alive = true;

    // Initial fetch
    (async () => {
      try {
        const p = await getDevicePresence(companyId, deviceId);
        if (!alive) return;
        setPresence(p);
        const { items } = await getActivityPage(companyId, {
          pageSize: 30,
          deviceId,
        });
        if (!alive) return;
        setActivity(items);
        setLoading(false);
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message || "Gagal memuat data");
        setLoading(false);
      }
    })();

    // Subscribe to live updates if we know the userId
    return () => {
      alive = false;
    };
  }, [companyId, deviceId]);

  // Once we know the userId, subscribe to live updates
  useEffect(() => {
    if (!companyId || !presence?.userId) return;
    const unsub = subscribeUserPresence(companyId, presence.userId, (p) => {
      if (p && p.deviceId === deviceId) setPresence(p);
    });
    return () => unsub();
  }, [companyId, presence?.userId, deviceId]);

  return (
    <div className="dd">
      {/* ── Breadcrumb ── */}
      <div className="breadcrumb">
        <Link href="/admin/intelligence" className="bc-link">
          <span className="material-icons">groups</span>
          Device Intelligence
        </Link>
        <span className="material-icons bc-sep">chevron_right</span>
        <span className="bc-cur">Device Detail</span>
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
          <span>Memuat detail perangkat...</span>
        </div>
      ) : !presence ? (
        <div className="empty-card">
          <span className="material-icons">desktop_access_disabled</span>
          <p>Perangkat tidak ditemukan atau belum melapor.</p>
        </div>
      ) : (
        <>
          <DeviceHero presence={presence} />

          <div className="metrics-grid">
            <MetricGauge
              label="CPU Usage"
              value={presence.cpuNow ?? 0}
              suffix="%"
              reverse={false}
              icon="memory"
            />
            <MetricGauge
              label="RAM Usage"
              value={presence.ramNow ?? 0}
              suffix="%"
              reverse={false}
              icon="storage"
            />
            <MetricGauge
              label="Health Score"
              value={presence.healthScore ?? 0}
              suffix=""
              reverse={true}
              icon="favorite"
            />
          </div>

          <ActivityPanel>
            {activity.length === 0 ? (
              <div className="no-activity">
                <span className="material-icons">history_toggle_off</span>
                <p>Belum ada sesi tercatat untuk perangkat ini.</p>
              </div>
            ) : (
              activity.map((a) => (
                <ActItem key={a.sessionId} a={a} />
              ))
            )}
          </ActivityPanel>
        </>
      )}

      <style jsx>{`
        .dd { display: flex; flex-direction: column; gap: 16px; padding-bottom: 32px; }

        /* Breadcrumb */
        .breadcrumb {
          display: flex; align-items: center; gap: 6px; font-size: 13px;
          padding: 10px 16px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          box-shadow: 0 1px 2px rgba(15,23,42,0.03);
        }
        .bc-link {
          display: inline-flex; align-items: center; gap: 6px;
          color: #6d28d9; text-decoration: none; font-weight: 600;
          transition: color 0.15s;
          padding: 4px 8px;
          border-radius: 6px;
        }
        .bc-link:hover { color: #4c1d95; background: #ede9fe; }
        .bc-link .material-icons { font-size: 16px; }
        .bc-sep { font-size: 16px; color: #cbd5e1; margin: 0 2px; }
        .bc-cur { color: #475569; font-weight: 600; }

        /* Metrics grid */
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 12px;
        }

        /* Error / loading / empty */
        .err-banner {
          display: flex; align-items: center; gap: 10px;
          background: #fef2f2; border: 1px solid #fecaca;
          color: #b91c1c; padding: 12px 16px;
          border-radius: 10px; font-size: 13px;
        }
        .loading-card {
          display: flex; align-items: center; justify-content: center; gap: 12px;
          background: white; border: 1px solid #e2e8f0;
          border-radius: 14px; padding: 48px;
          color: #64748b; font-size: 13px;
        }
        .spinner {
          width: 20px; height: 20px;
          border: 2px solid #e2e8f0; border-top-color: #7c3aed;
          border-radius: 50%; animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .empty-card {
          background: white; border: 1px solid #e2e8f0;
          border-radius: 14px; padding: 56px; text-align: center; color: #64748b;
        }
        .empty-card .material-icons { font-size: 44px; color: #cbd5e1; display: block; }
        .empty-card p { margin: 10px 0 0; font-size: 13px; }
        .no-activity { padding: 40px; text-align: center; color: #94a3b8; }
        .no-activity .material-icons { font-size: 36px; color: #cbd5e1; display: block; }
        .no-activity p { margin: 8px 0 0; font-size: 13px; }
      `}</style>
    </div>
  );
}

// ── DeviceHero ────────────────────────────────────────────────────────────
function DeviceHero({ presence }: { presence: LivePresence }) {
  const sc =
    presence.state === "active" ? "#059669" :
    presence.state === "idle"   ? "#d97706" : "#94a3b8";
  const initials = (presence.userName || presence.userEmail || "?")
    .trim().split(" ").filter(Boolean).slice(0,2)
    .map((s) => s[0]?.toUpperCase()).join("");
  const catCol = categoryColor(presence.currentCategory);

  return (
    <div className="dh">
      {/* Top row: identity + status */}
      <div className="dh-top">
        <div className="dh-who">
          <div className="dh-av">
            {initials || "?"}
            <span className="dh-dot" style={{ background: sc }} />
          </div>
          <div className="dh-info">
            <h1>{presence.userName || presence.userEmail}</h1>
          </div>
        </div>

        <div className="dh-right">
          <span
            className="dh-state"
            style={{ color: sc, borderColor: `${sc}30`, background: `${sc}0a` }}
          >
            <span className="dh-sdot" style={{ background: sc }} />
            {presenceLabel(presence.state)}
          </span>
          <Link
            href={`/admin/intelligence/employee/${encodeURIComponent(presence.userId)}`}
            className="dh-emp-link"
          >
            <span className="material-icons">person_search</span>
            Analitik Karyawan
          </Link>
        </div>
      </div>

      {/* Current activity row */}
      <div className="dh-activity">
        <div className="dh-cat-icon" style={{ background: `${catCol}14`, color: catCol }}>
          <span className="material-icons">work_history</span>
        </div>
        <div className="dh-act-body">
          <div className="dh-cat-lbl" style={{ color: catCol }}>
            {categoryDisplayName(presence.currentCategory)}
          </div>
          <div className="dh-app">{appDisplayName(presence.currentApp)}</div>
          {presence.activeWindow && (
            <div className="dh-window">{presence.activeWindow}</div>
          )}
          {presence.executable && (
            <div className="dh-exe">{presence.executable}</div>
          )}
        </div>
      </div>

      <style jsx>{`
        .dh {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(15,23,42,0.06);
        }
        .dh-top {
          padding: 24px 28px;
          display: flex; justify-content: space-between; align-items: flex-start;
          gap: 20px; flex-wrap: wrap;
          border-bottom: 1px solid #f1f5f9;
        }
        .dh-who { display: flex; gap: 16px; align-items: center; }
        .dh-av {
          width: 60px; height: 60px; border-radius: 16px;
          background: linear-gradient(135deg, #7c3aed, #4f46e5);
          color: white; display: flex; align-items: center; justify-content: center;
          font-size: 20px; font-weight: 700; position: relative; flex-shrink: 0;
          letter-spacing: -0.5px;
          box-shadow: 0 4px 12px rgba(124,58,237,0.25);
        }
        .dh-dot {
          position: absolute; bottom: -3px; right: -3px;
          width: 15px; height: 15px; border-radius: 50%; border: 3px solid white;
          box-shadow: 0 1px 3px rgba(0,0,0,0.12);
        }
        h1 { margin: 0; font-size: 19px; font-weight: 700; color: #0f172a; letter-spacing: -0.3px; }

        .dh-right { display: flex; flex-direction: column; align-items: flex-end; gap: 12px; }
        .dh-state {
          display: inline-flex; align-items: center; gap: 7px;
          border: 1.5px solid; border-radius: 999px;
          padding: 5px 14px; font-size: 11px; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.5px;
        }
        .dh-sdot { width: 6px; height: 6px; border-radius: 50%; animation: blink 1.6s infinite; }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.35} }
        .dh-emp-link {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 8px 16px;
          background: #f5f3ff; color: #6d28d9;
          font-size: 12px; font-weight: 600;
          border-radius: 8px; text-decoration: none;
          border: 1px solid #ede9fe;
          transition: all 0.15s;
        }
        .dh-emp-link:hover { background: #ede9fe; border-color: #ddd6fe; }
        .dh-emp-link .material-icons { font-size: 16px; }

        .dh-activity {
          padding: 18px 28px;
          background: linear-gradient(135deg, #fafbfd 0%, #f8f7ff 100%);
          display: flex; gap: 16px; align-items: center; flex-wrap: wrap;
        }
        .dh-cat-icon {
          width: 44px; height: 44px; border-radius: 12px;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .dh-cat-icon .material-icons { font-size: 22px; }
        .dh-act-body { min-width: 0; }
        .dh-cat-lbl { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.4px; }
        .dh-app { font-size: 15px; font-weight: 600; color: #0f172a; margin-top: 2px; }
        .dh-window { font-size: 12px; color: #475569; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 480px; }
        .dh-exe { font-size: 10px; color: #94a3b8; margin-top: 3px; font-family: ui-monospace, 'JetBrains Mono', monospace; }
      `}</style>
    </div>
  );
}

// ── MetricGauge ───────────────────────────────────────────────────────────
function MetricGauge({
  label, value, suffix, reverse, icon,
}: {
  label: string; value: number; suffix: string; reverse?: boolean; icon: string;
}) {
  const v = Math.round(value || 0);
  const color = reverse
    ? v >= 70 ? "#059669" : v >= 40 ? "#d97706" : "#dc2626"
    : v >= 80 ? "#dc2626" : v >= 60 ? "#d97706" : "#059669";
  return (
    <div className="mg">
      <div className="mg-head">
        <div className="mg-icon" style={{ background: `${color}12`, color }}>
          <span className="material-icons">{icon}</span>
        </div>
        <span className="mg-lbl">{label}</span>
      </div>
      <div className="mg-body">
        <span className="mg-val" style={{ color }}>{v}{suffix && <span className="mg-sfx">{suffix}</span>}</span>
      </div>
      <div className="mg-track">
        <div className="mg-fill" style={{ width: `${Math.min(100, v)}%`, background: color }} />
      </div>
      <style jsx>{`
        .mg {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          padding: 18px;
          display: flex; flex-direction: column; gap: 12px;
          box-shadow: 0 2px 6px rgba(15,23,42,0.04);
          transition: all 0.2s;
        }
        .mg:hover { box-shadow: 0 6px 16px rgba(15,23,42,0.08); transform: translateY(-1px); }
        .mg-head { display: flex; align-items: center; gap: 10px; }
        .mg-icon {
          width: 34px; height: 34px; border-radius: 9px;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .mg-icon .material-icons { font-size: 18px; }
        .mg-lbl { font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.4px; }
        .mg-body { }
        .mg-val { font-size: 28px; font-weight: 600; line-height: 1; font-variant-numeric: tabular-nums; }
        .mg-sfx { font-size: 14px; margin-left: 1px; opacity: 0.7; }
        .mg-track { height: 6px; background: #f1f5f9; border-radius: 99px; overflow: hidden; }
        .mg-fill { height: 100%; border-radius: 99px; transition: width 0.4s ease; opacity: 0.9; }
      `}</style>
    </div>
  );
}

// ── ActivityPanel ─────────────────────────────────────────────────────────
function ActivityPanel({ children }: { children: React.ReactNode }) {
  return (
    <section className="ap">
      <header className="ap-hd">
        <span className="material-icons">history</span>
        <h3>30 Sesi Terbaru</h3>
      </header>
      <div>{children}</div>
      <style jsx>{`
        .ap {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(15,23,42,0.04);
        }
        .ap-hd {
          display: flex; align-items: center; gap: 9px;
          padding: 14px 18px;
          border-bottom: 1px solid #f1f5f9;
          background: #fafbfd;
        }
        .ap-hd .material-icons { font-size: 18px; color: #7c3aed; }
        h3 { margin: 0; font-size: 13px; font-weight: 600; color: #0f172a; }
      `}</style>
    </section>
  );
}

// ── ActItem ───────────────────────────────────────────────────────────────
function ActItem({ a }: { a: ActivityTimelineEntry }) {
  const start = a.startedAt?.toDate?.() ?? new Date();
  const focus = Math.round(a.focusScore || 0);
  const fc = focus >= 70 ? "#059669" : focus >= 40 ? "#d97706" : "#dc2626";
  const catCol = categoryColor(a.category);
  const prodCol = productivityColor(a.productivityType);

  return (
    <div className="ai">
      <span className="ai-dot" style={{ background: catCol }} />
      <span className="ai-time">
        {start.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
      </span>
      <div className="ai-main">
        <div className="ai-row1">
          <span className="ai-app">{appDisplayName(a.app)}</span>
          <span className="ai-cat" style={{ color: catCol, background: `${catCol}10` }}>
            {categoryDisplayName(a.category)}
          </span>
          <span className="ai-prod" style={{ color: prodCol, background: `${prodCol}10` }}>
            {productivityDisplayName(a.productivityType)}
          </span>
        </div>
      </div>
      <div className="ai-right">
        <span className="ai-dur">{formatDuration(a.durationSeconds)}</span>
        <span className="ai-focus" style={{ color: fc }}>Focus {focus}</span>
      </div>
      <style jsx>{`
        .ai {
          display: grid;
          grid-template-columns: 8px 58px 1fr auto;
          gap: 12px;
          padding: 11px 18px;
          align-items: center;
          border-bottom: 1px solid #f8fafc;
          transition: background 0.1s;
        }
        .ai:last-child { border-bottom: none; }
        .ai:hover { background: #fafbfd; }
        .ai-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .ai-time {
          font-family: ui-monospace, 'JetBrains Mono', monospace;
          font-size: 11px; color: #64748b; font-weight: 500;
        }
        .ai-main { min-width: 0; display: flex; flex-direction: column; gap: 3px; }
        .ai-row1 { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
        .ai-app { font-size: 13px; font-weight: 500; color: #0f172a; }
        .ai-cat, .ai-prod {
          border-radius: 4px; padding: 1px 7px;
          font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.25px;
        }
        .ai-title { font-size: 11px; color: #64748b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 500px; }
        .ai-right { display: flex; flex-direction: column; align-items: flex-end; gap: 3px; }
        .ai-dur {
          font-size: 12px; font-weight: 600; color: #6d28d9;
          font-family: ui-monospace, 'JetBrains Mono', monospace;
          font-variant-numeric: tabular-nums;
        }
        .ai-focus { font-size: 10px; font-weight: 600; white-space: nowrap; }
      `}</style>
    </div>
  );
}
