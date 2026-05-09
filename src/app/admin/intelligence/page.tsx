"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCompanyId } from "@/lib/intelligence/useCompanyId";
import {
  subscribeLivePresence,
  subscribeRecentAnomalies,
} from "@/services/intelligenceService";
import type { LivePresence, AnomalyEvent } from "@/lib/intelligence/types";

const MODULES = [
  {
    href: "/admin/intelligence/live",
    icon: "sensors",
    title: "Pemantauan Realtime",
    desc: "Lihat siapa saja yang online sekarang dan apa yang sedang dikerjakan.",
    color: "#10b981",
  },
  {
    href: "/admin/intelligence/devices",
    icon: "devices",
    title: "Device Intelligence",
    desc: "Status kesehatan, beban CPU/RAM, dan health score per perangkat.",
    color: "#3b82f6",
  },
  {
    href: "/admin/intelligence/workforce",
    icon: "groups",
    title: "Workforce Analytics",
    desc: "Produktivitas tim, distribusi kategori kerja, dan ranking karyawan.",
    color: "#7c3aed",
  },
  {
    href: "/admin/intelligence/timeline",
    icon: "timeline",
    title: "Activity Timeline",
    desc: "Feed aktivitas terbaru dari semua perangkat — drill-down ke sesi.",
    color: "#06b6d4",
  },
  {
    href: "/admin/intelligence/anomalies",
    icon: "warning_amber",
    title: "Anomali",
    desc: "Lonjakan CPU, switching tinggi, idle berkepanjangan & alert lainnya.",
    color: "#f59e0b",
  },
];

export default function IntelligenceHubPage() {
  const { companyId, loading } = useCompanyId();
  const [presence, setPresence] = useState<LivePresence[]>([]);
  const [anomalies, setAnomalies] = useState<AnomalyEvent[]>([]);

  useEffect(() => {
    if (!companyId) return;
    const unsubP = subscribeLivePresence(companyId, setPresence);
    const unsubA = subscribeRecentAnomalies(companyId, 24, setAnomalies);
    return () => {
      unsubP();
      unsubA();
    };
  }, [companyId]);

  const onlineCount = presence.filter((p) => p.state === "active").length;
  const idleCount = presence.filter((p) => p.state === "idle").length;
  const awayCount = presence.filter((p) => p.state === "away").length;
  const criticalAnoms = anomalies.filter(
    (a) => a.severity === "high" || a.severity === "critical"
  ).length;

  return (
    <div className="intel-hub">
      <div className="intel-hero">
        <div className="hero-badge">
          <span className="material-icons">auto_awesome</span>
          Vorce Intelligence
        </div>
        <h1>Workforce Intelligence Platform</h1>
        <p>
          Observabilitas operasional secara realtime untuk perangkat &amp;
          karyawan — ditenagai pipeline analitik on-device VORCE.
        </p>

        <div className="hero-stats">
          <div className="hero-stat">
            <div className="dot dot-active" />
            <div>
              <div className="stat-num">{loading ? "—" : onlineCount}</div>
              <div className="stat-lbl">Aktif sekarang</div>
            </div>
          </div>
          <div className="hero-stat">
            <div className="dot dot-idle" />
            <div>
              <div className="stat-num">{loading ? "—" : idleCount}</div>
              <div className="stat-lbl">Idle</div>
            </div>
          </div>
          <div className="hero-stat">
            <div className="dot dot-away" />
            <div>
              <div className="stat-num">{loading ? "—" : awayCount}</div>
              <div className="stat-lbl">Away</div>
            </div>
          </div>
          <div className="hero-stat critical">
            <span className="material-icons stat-icon">warning_amber</span>
            <div>
              <div className="stat-num">{loading ? "—" : criticalAnoms}</div>
              <div className="stat-lbl">Anomali kritis 24j</div>
            </div>
          </div>
        </div>
      </div>

      <div className="modules-grid">
        {MODULES.map((m) => (
          <Link key={m.href} href={m.href} className="module-card">
            <div className="module-icon" style={{ background: `${m.color}1a`, color: m.color }}>
              <span className="material-icons">{m.icon}</span>
            </div>
            <h3>{m.title}</h3>
            <p>{m.desc}</p>
            <div className="module-cta">
              Buka
              <span className="material-icons">arrow_forward</span>
            </div>
          </Link>
        ))}
      </div>

      <div className="info-banner">
        <span className="material-icons">info</span>
        <div>
          <strong>Read-only intelligence layer.</strong> Semua data diambil dari
          aggregate Firestore yang sudah diproses secara semantik oleh agent
          Electron. Halaman ini tidak menjalankan komputasi analitik dari sesi
          mentah.
        </div>
      </div>

      <style jsx>{`
        .intel-hub {
          display: flex;
          flex-direction: column;
          gap: 32px;
        }

        .intel-hero {
          background: linear-gradient(135deg, #312e81 0%, #1e1b4b 60%, #0f172a 100%);
          color: white;
          border-radius: 24px;
          padding: 40px 36px;
          position: relative;
          overflow: hidden;
        }
        .intel-hero::before {
          content: "";
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at 20% 0%, rgba(124,58,237,0.4), transparent 40%),
            radial-gradient(circle at 90% 100%, rgba(59,130,246,0.3), transparent 40%);
          pointer-events: none;
        }
        .intel-hero > * { position: relative; }

        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(255,255,255,0.12);
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.5px;
          backdrop-filter: blur(8px);
        }
        .hero-badge .material-icons { font-size: 16px; }

        .intel-hero h1 {
          font-size: clamp(28px, 4vw, 40px);
          font-weight: 800;
          margin: 16px 0 8px;
          letter-spacing: -0.5px;
        }
        .intel-hero p {
          font-size: 15px;
          opacity: 0.85;
          max-width: 640px;
          margin: 0 0 32px;
          line-height: 1.6;
        }

        .hero-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 16px;
        }
        .hero-stat {
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.12);
          backdrop-filter: blur(8px);
          padding: 16px 20px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .hero-stat.critical { border-color: rgba(245,158,11,0.5); }
        .hero-stat .dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
        }
        .dot-active { background: #10b981; box-shadow: 0 0 12px #10b981; animation: pulse 2s infinite; }
        .dot-idle { background: #f59e0b; }
        .dot-away { background: #94a3b8; }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        .stat-icon { color: #f59e0b; }
        .stat-num { font-size: 22px; font-weight: 800; }
        .stat-lbl { font-size: 12px; opacity: 0.75; margin-top: 2px; }

        .modules-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 18px;
        }

        .module-card {
          background: white;
          padding: 24px;
          border-radius: 18px;
          text-decoration: none;
          color: inherit;
          border: 1px solid #f1f5f9;
          display: flex;
          flex-direction: column;
          gap: 12px;
          transition: all 0.2s ease;
        }
        .module-card:hover {
          transform: translateY(-3px);
          border-color: #c4b5fd;
          box-shadow: 0 12px 28px rgba(124, 58, 237, 0.1);
        }
        .module-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .module-icon .material-icons { font-size: 26px; }
        .module-card h3 {
          font-size: 17px;
          font-weight: 700;
          color: #0f172a;
          margin: 0;
        }
        .module-card p {
          font-size: 13px;
          color: #64748b;
          margin: 0;
          line-height: 1.6;
          flex: 1;
        }
        .module-cta {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          color: #7c3aed;
          font-weight: 600;
          font-size: 13px;
          margin-top: 6px;
        }
        .module-cta .material-icons { font-size: 16px; transition: transform 0.2s; }
        .module-card:hover .module-cta .material-icons { transform: translateX(3px); }

        .info-banner {
          background: #f5f3ff;
          border: 1px solid #ddd6fe;
          border-radius: 14px;
          padding: 16px 20px;
          display: flex;
          gap: 14px;
          align-items: flex-start;
          color: #4c1d95;
          font-size: 13px;
          line-height: 1.6;
        }
        .info-banner .material-icons {
          flex-shrink: 0;
          color: #7c3aed;
        }
      `}</style>
    </div>
  );
}
