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
    <div className="dd-page">
      <Link href="/admin/intelligence/devices" className="back">
        <span className="material-icons">arrow_back</span>
        Semua Perangkat
      </Link>

      {error && (
        <div className="error">
          <span className="material-icons">error</span>
          {error}
        </div>
      )}

      {loading ? (
        <div className="placeholder">Memuat detail perangkat...</div>
      ) : !presence ? (
        <div className="placeholder">
          <span className="material-icons">desktop_access_disabled</span>
          <p>Perangkat tidak ditemukan / belum melapor.</p>
        </div>
      ) : (
        <>
          <DeviceHero presence={presence} />

          <div className="metrics-grid">
            <Gauge label="CPU sekarang" value={presence.cpuNow ?? 0} suffix="%" reverse={false} />
            <Gauge label="RAM sekarang" value={presence.ramNow ?? 0} suffix="%" reverse={false} />
            <Gauge label="Health Score" value={presence.healthScore ?? 0} suffix="" reverse={true} />
          </div>

          <Panel title="30 Sesi Terbaru" icon="history">
            {activity.length === 0 ? (
              <div className="empty">
                <span className="material-icons">history_toggle_off</span>
                <p>Belum ada sesi tercatat untuk perangkat ini.</p>
              </div>
            ) : (
              <div className="acts">
                {activity.map((a) => (
                  <ActItem key={a.sessionId} a={a} />
                ))}
              </div>
            )}
          </Panel>
        </>
      )}

      <style jsx>{`
        .dd-page { display: flex; flex-direction: column; gap: 20px; }

        .back {
          display: inline-flex; align-items: center; gap: 6px;
          color: #6d28d9; font-weight: 700; font-size: 13px;
          text-decoration: none;
        }
        .back .material-icons { font-size: 18px; }
        .back:hover { color: #4c1d95; }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 14px;
        }

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
        .empty { padding: 40px; text-align: center; color: #94a3b8; }
        .empty .material-icons { font-size: 40px; color: #cbd5e1; }
        .empty p { margin: 8px 0 0; font-size: 13px; }
      `}</style>
    </div>
  );
}

function DeviceHero({ presence }: { presence: LivePresence }) {
  const stateColor =
    presence.state === "active"
      ? "#10b981"
      : presence.state === "idle"
      ? "#f59e0b"
      : "#94a3b8";
  const initials = (presence.userName || presence.userEmail || "?")
    .trim()
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");

  return (
    <div className="hero">
      <div className="hero-top">
        <div className="who">
          <div className="avatar">
            {initials || "?"}
            <div className="dot" style={{ background: stateColor }} />
          </div>
          <div>
            <h1>{presence.userName || presence.userEmail}</h1>
            <div className="email">{presence.userEmail}</div>
            <div className="device-id">
              <span className="material-icons">computer</span>
              <code>{presence.deviceId}</code>
            </div>
          </div>
        </div>
        <div
          className="state-pill"
          style={{
            color: stateColor,
            borderColor: `${stateColor}55`,
            background: `${stateColor}10`,
          }}
        >
          {presenceLabel(presence.state)}
        </div>
      </div>

      <div className="hero-now">
        <div className="now-icon" style={{ background: `${categoryColor(presence.currentCategory)}20`, color: categoryColor(presence.currentCategory) }}>
          <span className="material-icons">work_history</span>
        </div>
        <div className="now-body">
          <div className="now-cat">{categoryDisplayName(presence.currentCategory)}</div>
          <div className="now-app">{appDisplayName(presence.currentApp)}</div>
          {presence.activeWindow && <div className="now-window">{presence.activeWindow}</div>}
          {presence.executable && <div className="now-exe">exe: {presence.executable}</div>}
        </div>
        <div className="employee-link">
          <Link
            href={`/admin/intelligence/employee/${encodeURIComponent(presence.userId)}`}
            className="emp-btn"
          >
            <span className="material-icons">person_search</span>
            Lihat Analitik Karyawan
          </Link>
        </div>
      </div>

      <style jsx>{`
        .hero {
          background: white;
          border: 1px solid #f1f5f9;
          border-radius: 18px;
          overflow: hidden;
        }
        .hero-top {
          padding: 24px;
          display: flex; justify-content: space-between; align-items: flex-start; gap: 16px;
          border-bottom: 1px solid #f1f5f9;
        }
        .who { display: flex; gap: 16px; align-items: center; }
        .avatar {
          width: 64px; height: 64px;
          border-radius: 50%;
          background: linear-gradient(135deg, #7c3aed, #4f46e5);
          color: white;
          display: flex; align-items: center; justify-content: center;
          font-weight: 700; font-size: 20px;
          position: relative;
        }
        .avatar .dot {
          position: absolute;
          bottom: 0; right: 0;
          width: 16px; height: 16px;
          border-radius: 50%;
          border: 3px solid white;
        }
        h1 { font-size: 22px; font-weight: 700; color: #0f172a; margin: 0 0 4px; }
        .email { font-size: 13px; color: #64748b; }
        .device-id {
          display: flex; align-items: center; gap: 6px;
          font-size: 11px; color: #94a3b8;
          margin-top: 8px;
        }
        .device-id .material-icons { font-size: 14px; }
        .device-id code {
          background: #f1f5f9;
          padding: 2px 8px;
          border-radius: 4px;
          font-family: 'JetBrains Mono', monospace;
        }

        .state-pill {
          padding: 6px 16px;
          border-radius: 99px;
          border: 1px solid;
          font-weight: 700;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          font-size: 11px;
        }

        .hero-now {
          padding: 20px 24px;
          background: #fafbfd;
          display: flex;
          gap: 18px;
          align-items: center;
          flex-wrap: wrap;
        }
        .now-icon {
          width: 52px; height: 52px;
          border-radius: 14px;
          display: flex; align-items: center; justify-content: center;
        }
        .now-icon .material-icons { font-size: 26px; }
        .now-body { flex: 1; min-width: 220px; }
        .now-cat { font-size: 11px; font-weight: 800; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.5px; }
        .now-app { font-size: 16px; font-weight: 700; color: #0f172a; margin-top: 2px; }
        .now-window { font-size: 13px; color: #475569; margin-top: 2px; }
        .now-exe { font-size: 11px; color: #94a3b8; margin-top: 4px; font-family: 'JetBrains Mono', monospace; }

        .emp-btn {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 10px 16px;
          background: #ede9fe;
          color: #5b21b6;
          font-weight: 700; font-size: 13px;
          border-radius: 10px;
          text-decoration: none;
          transition: background 0.15s;
        }
        .emp-btn:hover { background: #ddd6fe; }
        .emp-btn .material-icons { font-size: 18px; }
      `}</style>
    </div>
  );
}

function Gauge({
  label,
  value,
  suffix,
  reverse,
}: {
  label: string;
  value: number;
  suffix: string;
  reverse?: boolean;
}) {
  const v = Math.round(value || 0);
  const color = reverse
    ? v >= 70 ? "#10b981" : v >= 40 ? "#f59e0b" : "#ef4444"
    : v >= 80 ? "#ef4444" : v >= 60 ? "#f59e0b" : "#10b981";
  return (
    <div className="g">
      <div className="g-label">{label}</div>
      <div className="g-row">
        <div className="g-num" style={{ color }}>
          {v}
          <span>{suffix}</span>
        </div>
        <div className="g-bar">
          <div
            className="g-fill"
            style={{ width: `${Math.min(100, v)}%`, background: color }}
          />
        </div>
      </div>
      <style jsx>{`
        .g {
          background: white;
          border: 1px solid #f1f5f9;
          border-radius: 14px;
          padding: 16px;
        }
        .g-label { font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
        .g-row { display: flex; align-items: center; gap: 12px; }
        .g-num { font-size: 28px; font-weight: 800; line-height: 1; }
        .g-num span { font-size: 14px; margin-left: 2px; opacity: 0.6; }
        .g-bar { flex: 1; height: 8px; background: #f1f5f9; border-radius: 99px; overflow: hidden; }
        .g-fill { height: 100%; transition: width 0.3s; }
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
        .body { }
      `}</style>
    </section>
  );
}

function ActItem({ a }: { a: ActivityTimelineEntry }) {
  const start = a.startedAt?.toDate?.() ?? new Date();
  const focus = Math.round(a.focusScore || 0);
  const focusColor = focus >= 70 ? "#10b981" : focus >= 40 ? "#f59e0b" : "#ef4444";
  return (
    <div className="ai">
      <div
        className="ai-dot"
        style={{ background: categoryColor(a.category) }}
      />
      <div className="ai-time">
        {start.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
      </div>
      <div className="ai-content">
        <span
          className="ai-cat"
          style={{
            background: `${categoryColor(a.category)}1a`,
            color: categoryColor(a.category),
          }}
        >
          {categoryDisplayName(a.category)}
        </span>
        <span className="ai-app">{appDisplayName(a.app)}</span>
        <span
          className="ai-prod"
          style={{
            background: `${productivityColor(a.productivityType)}1a`,
            color: productivityColor(a.productivityType),
          }}
        >
          {productivityDisplayName(a.productivityType)}
        </span>
      </div>
      <div className="ai-meta">
        <span className="dur">{formatDuration(a.durationSeconds)}</span>
        <span className="focus" style={{ color: focusColor }}>● {focus}</span>
      </div>
      <style jsx>{`
        .ai {
          display: grid;
          grid-template-columns: 12px 70px 1fr auto;
          gap: 14px;
          padding: 12px 20px;
          align-items: center;
          border-bottom: 1px solid #f1f5f9;
        }
        .ai:last-child { border-bottom: none; }
        .ai-dot { width: 10px; height: 10px; border-radius: 50%; }
        .ai-time { font-family: 'JetBrains Mono', monospace; font-size: 12px; color: #475569; font-weight: 600; }
        .ai-content { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
        .ai-cat, .ai-prod {
          padding: 3px 10px;
          border-radius: 99px;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }
        .ai-app { font-weight: 700; color: #0f172a; font-size: 13px; }
        .ai-meta { display: flex; gap: 12px; font-size: 11px; align-items: center; }
        .dur { color: #6d28d9; font-weight: 700; font-family: 'JetBrains Mono', monospace; }
        .focus { font-weight: 700; }
      `}</style>
    </div>
  );
}
