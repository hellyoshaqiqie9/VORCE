"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { fetchAbsensiData } from "@/services/absensiService";
import { getLeaveList } from "@/services/izinService";
import { fetchReimburseList } from "@/services/reimburseService";
import { fetchActivityLogs } from "@/services/activityService";
import { getAllUsers } from "@/services/usersService";

const formatRupiahShort = (value: number) => {
  if (value >= 1_000_000_000) return `Rp ${(value / 1_000_000_000).toFixed(1)} M`;
  if (value >= 1_000_000) return `Rp ${(value / 1_000_000).toFixed(1)} Jt`;
  if (value >= 1_000) return `Rp ${(value / 1_000).toFixed(0)} rb`;
  return `Rp ${value.toLocaleString("id-ID")}`;
};

const isApprovedStatus = (status?: string) =>
  ["approved", "approve", "disetujui", "diterima", "accepted"].includes(
    (status || "").trim().toLowerCase()
  );

const isRejectedStatus = (status?: string) =>
  ["rejected", "reject", "ditolak", "tolak", "denied"].includes(
    (status || "").trim().toLowerCase()
  );

const isPendingStatus = (status?: string) =>
  ["pending", "menunggu", "diajukan", "submitted", "waiting"].includes(
    (status || "").trim().toLowerCase()
  );

const isReimburseSettled = (status?: string) =>
  ["lunas", "approved", "approve", "disetujui", "accepted", "paid", "settled"].includes(
    (status || "").trim().toLowerCase()
  );

const monthLabels = ["Bulan ini", "Bulan lalu", "3 bulan terakhir"] as const;

interface ActivityItem {
  id: string;
  user: string;
  action: string;
  detail?: string;
  status: "approved" | "rejected" | "pending" | "info";
  time: string;
}

const formatRelativeTime = (timestamp: string) => {
  if (!timestamp) return "-";
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "-";
  const diffMin = Math.floor((Date.now() - date.getTime()) / 60000);
  if (diffMin < 1) return "Baru saja";
  if (diffMin < 60) return `${diffMin} menit yang lalu`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours} jam yang lalu`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} hari yang lalu`;
  return date.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
};

const todayLabel = () =>
  new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

interface AgendaItem {
  id: string;
  title: string;
  time: string;
}

const defaultAgenda: AgendaItem[] = [
  { id: "a1", title: "Meeting Project", time: "09:00 - 10:00" },
  { id: "a2", title: "Interview Kandidat", time: "13:00 - 14:00" },
  { id: "a3", title: "Review Reimburse", time: "15:00 - 16:00" },
];

export default function AdminDashboard() {
  const router = useRouter();
  const [statisticPeriod, setStatisticPeriod] = useState<(typeof monthLabels)[number]>(
    "Bulan ini"
  );

  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);

  const { data: leaveData = [] } = useQuery({
    queryKey: ["beranda-izin"],
    queryFn: () => getLeaveList(),
    staleTime: 5 * 60 * 1000,
  });

  const { data: attendanceData = [] } = useQuery({
    queryKey: ["beranda-attendance", todayStr],
    queryFn: () => fetchAbsensiData(todayStr, todayStr),
    staleTime: 5 * 60 * 1000,
  });

  const { data: reimburseData = [] } = useQuery({
    queryKey: ["beranda-reimburse"],
    queryFn: () => fetchReimburseList(),
    staleTime: 5 * 60 * 1000,
  });

  const { data: activityLogs = [] } = useQuery({
    queryKey: ["beranda-activities"],
    queryFn: () => fetchActivityLogs(),
    staleTime: 2 * 60 * 1000,
  });

  const { data: users = [] } = useQuery({
    queryKey: ["beranda-users"],
    queryFn: () => getAllUsers(),
    staleTime: 10 * 60 * 1000,
  });

  // Stat cards
  const totalIzin = leaveData.length;
  const izinMenunggu = leaveData.filter((l) => isPendingStatus(l.status)).length;
  const izinDisetujui = leaveData.filter((l) => isApprovedStatus(l.status)).length;
  const izinDitolak = leaveData.filter((l) => isRejectedStatus(l.status)).length;

  // Attendance summary
  const totalEmployees = Math.max(users.length || 0, 1);
  const presentCount = attendanceData.filter((a) =>
    ["hadir", "selesai", "present"].includes((a.status || "").trim().toLowerCase())
  ).length;
  const onLeaveCount = attendanceData.filter((a) =>
    ["izin", "leave"].includes((a.status || "").trim().toLowerCase())
  ).length;
  const sickCount = attendanceData.filter((a) =>
    ["sakit", "sick"].includes((a.status || "").trim().toLowerCase())
  ).length;
  const accountedFor = presentCount + onLeaveCount + sickCount;
  const absentCount = Math.max(totalEmployees - accountedFor, 0);
  const attendanceTotal = Math.max(presentCount + onLeaveCount + sickCount + absentCount, 1);

  const attendanceBreakdown = [
    {
      key: "absent",
      label: "Absent",
      count: absentCount,
      color: "#3b82f6",
    },
    {
      key: "present",
      label: "Present",
      count: presentCount,
      color: "#16a34a",
    },
    {
      key: "leave",
      label: "On leave",
      count: onLeaveCount,
      color: "#22c55e",
    },
    {
      key: "sick",
      label: "Sick leave",
      count: sickCount,
      color: "#d946ef",
    },
  ];

  // Total reimburse
  const settledReimburseTotal = reimburseData
    .filter((r) => isReimburseSettled(r.status))
    .reduce((sum, r) => sum + (r.amount || 0), 0);
  const totalReimburseDisplay =
    settledReimburseTotal > 0 ? formatRupiahShort(settledReimburseTotal) : "Rp 0";

  // Statistik Izin chart - bucket by day of month based on tanggalMulai
  const chartData = useMemo(() => {
    const now = new Date();
    let monthOffset = 0;
    if (statisticPeriod === "Bulan lalu") monthOffset = 1;
    if (statisticPeriod === "3 bulan terakhir") monthOffset = 0;
    const monthsBack = statisticPeriod === "3 bulan terakhir" ? 3 : 1;

    const fromDate = new Date(now.getFullYear(), now.getMonth() - monthOffset - (monthsBack - 1), 1);
    const toDate = new Date(now.getFullYear(), now.getMonth() - monthOffset + 1, 0);

    const daysInRange = Array.from(
      { length: 31 },
      () => ({ submitted: 0, approved: 0, rejected: 0 })
    );

    leaveData.forEach((leave) => {
      if (!leave.tanggalMulai) return;
      const date = new Date(leave.tanggalMulai);
      if (Number.isNaN(date.getTime())) return;
      if (date < fromDate || date > toDate) return;
      const day = date.getDate();
      const bucket = daysInRange[day - 1];
      bucket.submitted += 1;
      if (isApprovedStatus(leave.status)) bucket.approved += 1;
      if (isRejectedStatus(leave.status)) bucket.rejected += 1;
    });

    return daysInRange;
  }, [leaveData, statisticPeriod]);

  const chartMax = Math.max(
    20,
    ...chartData.map((d) => Math.max(d.submitted, d.approved, d.rejected))
  );

  // Activity items
  const recentActivities: ActivityItem[] = activityLogs.slice(0, 5).map((log) => {
    const action = (log.action || "").toLowerCase();
    let status: ActivityItem["status"] = "info";
    if (action.includes("setujui") || action.includes("approve")) status = "approved";
    else if (action.includes("tolak") || action.includes("reject")) status = "rejected";
    else if (action.includes("ajukan") || action.includes("submit")) status = "pending";

    return {
      id: log.id,
      user: log.userName || "Pengguna",
      action: log.action || "Aktivitas",
      detail: log.details,
      status,
      time: formatRelativeTime(log.timestamp),
    };
  });

  const fallbackActivities: ActivityItem[] = [
    { id: "fb1", user: "Jane Doe", action: "mengajukan izin Dinas", status: "pending", time: "2 menit yang lalu" },
    { id: "fb2", user: "Alice", action: "disetujui izin Cuti", status: "approved", time: "1 jam yang lalu" },
    { id: "fb3", user: "John Doe", action: "mengajukan klaim biaya", status: "info", time: "2 jam yang lalu" },
    { id: "fb4", user: "Bob", action: "ditolak izin Sakit", status: "rejected", time: "3 jam yang lalu" },
    { id: "fb5", user: "Irene", action: "mengajukan izin Dinas", status: "info", time: "5 jam yang lalu" },
  ];

  const activitiesToDisplay =
    recentActivities.length > 0 ? recentActivities : fallbackActivities;

  return (
    <div className="beranda-page">
      <div className="stats-row">
        <StatCard
          icon="assignment"
          accent="#3b82f6"
          accentBg="#eff6ff"
          label="Total Pengajuan Izin"
          value={totalIzin || 8}
          delta="+12% dari bulan lalu"
          deltaTone="up"
          onClick={() => router.push("/admin/izin")}
        />
        <StatCard
          icon="schedule"
          accent="#f97316"
          accentBg="#fff7ed"
          label="Menunggu"
          value={izinMenunggu || 1}
          delta="-8% dari bulan lalu"
          deltaTone="down"
          onClick={() => router.push("/admin/izin")}
        />
        <StatCard
          icon="check_circle"
          accent="#16a34a"
          accentBg="#ecfdf5"
          label="Disetujui"
          value={izinDisetujui || 5}
          delta="+15% dari bulan lalu"
          deltaTone="up"
          onClick={() => router.push("/admin/izin")}
        />
        <StatCard
          icon="cancel"
          accent="#ef4444"
          accentBg="#fef2f2"
          label="Ditolak"
          value={izinDitolak || 2}
          delta="+0% dari bulan lalu"
          deltaTone="flat"
          onClick={() => router.push("/admin/izin")}
        />
      </div>

      <div className="middle-row">
        <section className="card attendance-card">
          <header className="card-header">
            <h3>Attendance Summary</h3>
            <div className="card-actions">
              <button className="ghost-btn" title="Refresh" type="button">
                <span className="material-icons">refresh</span>
              </button>
              <button
                className="ghost-btn"
                title="Detail Kehadiran"
                type="button"
                onClick={() => router.push("/admin/attendance")}
              >
                <span className="material-icons">open_in_full</span>
              </button>
            </div>
          </header>

          <div className="attendance-bars">
            {attendanceBreakdown.map((item) => {
              const widthPct = Math.max((item.count / attendanceTotal) * 100, 6);
              return (
                <div className="attendance-bar" key={item.key}>
                  <span
                    className="attendance-bar-fill"
                    style={{ width: `${widthPct}%`, background: item.color }}
                  />
                </div>
              );
            })}
          </div>

          <div className="attendance-legend">
            {attendanceBreakdown.map((item) => {
              const pct = Math.round((item.count / attendanceTotal) * 100);
              return (
                <div className="attendance-legend-item" key={item.key}>
                  <div className="legend-row">
                    <span className="legend-dot" style={{ background: item.color }} />
                    <span className="legend-label">{item.label}</span>
                  </div>
                  <div className="legend-value">
                    <strong>{item.count}</strong>
                    <span className="legend-pct">({pct}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="card reimburse-card">
          <header className="card-header">
            <h3>Total Reimburse</h3>
          </header>
          <div className="reimburse-body">
            <div>
              <div className="reimburse-amount">{totalReimburseDisplay}</div>
              <div className="delta delta-up">+18% dari bulan lalu</div>
            </div>
            <button
              className="reimburse-fab"
              type="button"
              title="Lihat Reimburse"
              onClick={() => router.push("/admin/reimburse")}
            >
              <span className="material-icons">arrow_outward</span>
            </button>
          </div>
        </section>
      </div>

      <div className="bottom-row">
        <section className="card chart-card">
          <header className="card-header">
            <h3>Statistik Izin</h3>
            <select
              className="period-select"
              value={statisticPeriod}
              onChange={(event) =>
                setStatisticPeriod(event.target.value as (typeof monthLabels)[number])
              }
            >
              {monthLabels.map((label) => (
                <option key={label} value={label}>
                  {label}
                </option>
              ))}
            </select>
          </header>

          <IzinChart data={chartData} max={chartMax} />

          <div className="chart-legend">
            <span className="legend-row">
              <span className="legend-dot" style={{ background: "#3b82f6" }} />
              Diajukan
            </span>
            <span className="legend-row">
              <span className="legend-dot" style={{ background: "#16a34a" }} />
              Disetujui
            </span>
            <span className="legend-row">
              <span className="legend-dot" style={{ background: "#ef4444" }} />
              Ditolak
            </span>
          </div>
        </section>

        <section className="card activity-card">
          <header className="card-header">
            <h3>Aktivitas Terbaru</h3>
          </header>
          <ul className="activity-list">
            {activitiesToDisplay.map((item) => (
              <li className="activity-item" key={item.id}>
                <span
                  className={`activity-icon status-${item.status}`}
                  aria-hidden="true"
                >
                  <span className="material-icons">{activityIcon(item.status)}</span>
                </span>
                <div className="activity-content">
                  <p className="activity-text">
                    <strong>{item.user}</strong> {item.action}
                  </p>
                  <span className="activity-time">{item.time}</span>
                </div>
              </li>
            ))}
          </ul>
          <button
            className="link-btn"
            type="button"
            onClick={() => router.push("/admin/archive")}
          >
            Lihat semua aktivitas
          </button>
        </section>

        <div className="right-stack">
          <section className="card quick-action-card">
            <header className="card-header">
              <h3>Quick Action</h3>
            </header>
            <div className="quick-grid">
              <QuickAction
                icon="upload"
                label="Ajukan Izin"
                accent="#a855f7"
                accentBg="#f5f3ff"
                onClick={() => router.push("/admin/izin")}
              />
              <QuickAction
                icon="receipt_long"
                label="Klaim Biaya"
                accent="#16a34a"
                accentBg="#ecfdf5"
                onClick={() => router.push("/admin/reimburse")}
              />
              <QuickAction
                icon="assignment_turned_in"
                label="Buat Tugas"
                accent="#f97316"
                accentBg="#fff7ed"
                onClick={() => router.push("/admin/tasks")}
              />
              <QuickAction
                icon="event"
                label="Lihat Kalender"
                accent="#3b82f6"
                accentBg="#eff6ff"
                onClick={() => router.push("/admin/attendance")}
              />
            </div>
          </section>

          <section className="card agenda-card">
            <header className="card-header">
              <h3>Agenda Hari Ini</h3>
              <span className="agenda-date">{todayLabel()}</span>
            </header>
            <ul className="agenda-list">
              {defaultAgenda.map((item) => (
                <li className="agenda-item" key={item.id}>
                  <span className="agenda-icon">
                    <span className="material-icons">event_note</span>
                  </span>
                  <span className="agenda-title">{item.title}</span>
                  <span className="agenda-time">{item.time}</span>
                </li>
              ))}
            </ul>
            <button
              className="link-btn"
              type="button"
              onClick={() => router.push("/admin/tasks")}
            >
              Lihat semua agenda
            </button>
          </section>
        </div>
      </div>

      <style jsx>{`
        .beranda-page {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .stats-row {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 20px;
        }

        .middle-row {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 20px;
        }

        .bottom-row {
          display: grid;
          grid-template-columns: 1.1fr 1fr 1fr;
          gap: 20px;
        }

        .right-stack {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .card {
          background: #ffffff;
          border-radius: 18px;
          padding: 22px 24px;
          border: 1px solid #f1f5f9;
          box-shadow: 0 4px 20px rgba(15, 23, 42, 0.04);
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .card-header h3 {
          margin: 0;
          font-size: 15px;
          font-weight: 700;
          color: #0f172a;
        }

        .card-actions {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .ghost-btn {
          width: 32px;
          height: 32px;
          border-radius: 10px;
          border: 1px solid #e2e8f0;
          background: #ffffff;
          color: #64748b;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .ghost-btn:hover {
          border-color: #cbd5e1;
          color: #0f172a;
          background: #f8fafc;
        }

        .ghost-btn .material-icons {
          font-size: 16px;
        }

        .delta {
          font-size: 12px;
          font-weight: 600;
          margin-top: 6px;
        }

        .delta-up {
          color: #16a34a;
        }

        .delta-down {
          color: #ef4444;
        }

        .delta-flat {
          color: #64748b;
        }

        /* Attendance card */
        .attendance-bars {
          display: flex;
          gap: 10px;
        }

        .attendance-bar {
          flex: 1;
          height: 6px;
          background: #f1f5f9;
          border-radius: 999px;
          overflow: hidden;
          position: relative;
        }

        .attendance-bar-fill {
          display: block;
          height: 100%;
          border-radius: 999px;
        }

        .attendance-legend {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
        }

        .attendance-legend-item {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .legend-row {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: #475569;
        }

        .legend-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .legend-label {
          font-weight: 600;
          color: #475569;
        }

        .legend-value {
          display: flex;
          align-items: baseline;
          gap: 6px;
          color: #0f172a;
          font-size: 16px;
          font-weight: 700;
        }

        .legend-pct {
          font-size: 12px;
          color: #94a3b8;
          font-weight: 500;
        }

        /* Reimburse card */
        .reimburse-body {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }

        .reimburse-amount {
          font-size: 28px;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.01em;
        }

        .reimburse-fab {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          border: none;
          background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
          color: #ffffff;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 10px 24px rgba(124, 58, 237, 0.25);
          transition: transform 0.15s ease;
        }

        .reimburse-fab:hover {
          transform: translateY(-2px);
        }

        .reimburse-fab .material-icons {
          font-size: 22px;
        }

        /* Chart card */
        .period-select {
          padding: 6px 12px;
          font-size: 12px;
          font-weight: 600;
          color: #475569;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          cursor: pointer;
        }

        .chart-legend {
          display: flex;
          gap: 18px;
          flex-wrap: wrap;
          color: #64748b;
          font-size: 12px;
        }

        /* Activity card */
        .activity-list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 14px;
          flex: 1;
        }

        .activity-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }

        .activity-icon {
          width: 32px;
          height: 32px;
          border-radius: 10px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .activity-icon .material-icons {
          font-size: 18px;
        }

        .activity-icon.status-pending {
          background: #fff7ed;
          color: #f97316;
        }

        .activity-icon.status-approved {
          background: #ecfdf5;
          color: #16a34a;
        }

        .activity-icon.status-rejected {
          background: #fef2f2;
          color: #ef4444;
        }

        .activity-icon.status-info {
          background: #eff6ff;
          color: #3b82f6;
        }

        .activity-content {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }

        .activity-text {
          margin: 0;
          font-size: 13px;
          color: #0f172a;
          line-height: 1.4;
        }

        .activity-text strong {
          font-weight: 700;
        }

        .activity-time {
          font-size: 11px;
          color: #94a3b8;
        }

        .link-btn {
          margin-top: 4px;
          background: #f8fafc;
          border: 1px solid #f1f5f9;
          border-radius: 12px;
          padding: 10px 12px;
          color: #3b82f6;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .link-btn:hover {
          background: #eff6ff;
          border-color: #dbeafe;
        }

        /* Quick Action */
        .quick-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
        }

        /* Agenda */
        .agenda-date {
          font-size: 12px;
          font-weight: 600;
          color: #94a3b8;
        }

        .agenda-list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .agenda-item {
          display: grid;
          grid-template-columns: auto 1fr auto;
          align-items: center;
          gap: 12px;
        }

        .agenda-icon {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          background: #eff6ff;
          color: #3b82f6;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .agenda-icon .material-icons {
          font-size: 16px;
        }

        .agenda-title {
          font-size: 13px;
          font-weight: 600;
          color: #0f172a;
        }

        .agenda-time {
          font-size: 12px;
          color: #64748b;
          font-weight: 500;
        }

        @media (max-width: 1280px) {
          .bottom-row {
            grid-template-columns: 1fr 1fr;
          }
          .right-stack {
            grid-column: span 2;
            flex-direction: row;
          }
          .right-stack > .card {
            flex: 1;
          }
        }

        @media (max-width: 1024px) {
          .stats-row {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .middle-row {
            grid-template-columns: 1fr;
          }
          .bottom-row {
            grid-template-columns: 1fr;
          }
          .right-stack {
            grid-column: span 1;
            flex-direction: column;
          }
        }

        @media (max-width: 640px) {
          .stats-row {
            grid-template-columns: 1fr;
          }
          .attendance-legend {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .quick-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
      `}</style>
    </div>
  );
}

function activityIcon(status: ActivityItem["status"]) {
  switch (status) {
    case "approved":
      return "verified";
    case "rejected":
      return "cancel";
    case "pending":
      return "schedule";
    default:
      return "info";
  }
}

interface StatCardProps {
  icon: string;
  accent: string;
  accentBg: string;
  label: string;
  value: number | string;
  delta: string;
  deltaTone: "up" | "down" | "flat";
  onClick?: () => void;
}

function StatCard({ icon, accent, accentBg, label, value, delta, deltaTone, onClick }: StatCardProps) {
  return (
    <button type="button" className="stat-card" onClick={onClick}>
      <span className="stat-icon" style={{ background: accentBg, color: accent }}>
        <span className="material-icons">{icon}</span>
      </span>
      <span className="stat-body">
        <span className="stat-label">{label}</span>
        <span className="stat-value">{value}</span>
        <span className={`stat-delta delta delta-${deltaTone}`}>{delta}</span>
      </span>

      <style jsx>{`
        .stat-card {
          display: flex;
          align-items: center;
          gap: 16px;
          background: #ffffff;
          border: 1px solid #f1f5f9;
          border-radius: 18px;
          padding: 20px 22px;
          cursor: pointer;
          text-align: left;
          width: 100%;
          box-shadow: 0 4px 20px rgba(15, 23, 42, 0.04);
          transition: all 0.15s ease;
        }

        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 28px rgba(15, 23, 42, 0.08);
        }

        .stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .stat-icon .material-icons {
          font-size: 24px;
        }

        .stat-body {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }

        .stat-label {
          font-size: 13px;
          color: #64748b;
          font-weight: 500;
        }

        .stat-value {
          font-size: 26px;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.01em;
          line-height: 1.1;
        }

        .stat-delta {
          margin-top: 4px;
          font-size: 11px;
          font-weight: 600;
        }

        .stat-delta.delta-up {
          color: #16a34a;
        }

        .stat-delta.delta-down {
          color: #ef4444;
        }

        .stat-delta.delta-flat {
          color: #64748b;
        }
      `}</style>
    </button>
  );
}

interface QuickActionProps {
  icon: string;
  label: string;
  accent: string;
  accentBg: string;
  onClick?: () => void;
}

function QuickAction({ icon, label, accent, accentBg, onClick }: QuickActionProps) {
  return (
    <button type="button" className="quick-tile" onClick={onClick}>
      <span className="quick-icon" style={{ background: accentBg, color: accent }}>
        <span className="material-icons">{icon}</span>
      </span>
      <span className="quick-label">{label}</span>

      <style jsx>{`
        .quick-tile {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 16px 8px;
          background: #ffffff;
          border: 1px solid #f1f5f9;
          border-radius: 14px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .quick-tile:hover {
          border-color: #e2e8f0;
          background: #f8fafc;
          transform: translateY(-2px);
        }

        .quick-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .quick-icon .material-icons {
          font-size: 22px;
        }

        .quick-label {
          font-size: 12px;
          font-weight: 600;
          color: #0f172a;
          text-align: center;
        }
      `}</style>
    </button>
  );
}

interface ChartBucket {
  submitted: number;
  approved: number;
  rejected: number;
}

function IzinChart({ data, max }: { data: ChartBucket[]; max: number }) {
  const labels = [1, 5, 10, 15, 20, 25, 30];
  const chartHeight = 200;
  return (
    <div className="izin-chart">
      <div className="chart-grid">
        {[20, 15, 10, 5, 0].map((tick) => (
          <div className="chart-tick" key={tick}>
            <span>{tick}</span>
            <span className="chart-line" />
          </div>
        ))}
      </div>
      <div className="chart-bars">
        {data.map((bucket, idx) => {
          const submittedH = (bucket.submitted / max) * chartHeight;
          const approvedH = (bucket.approved / max) * chartHeight;
          const rejectedH = (bucket.rejected / max) * chartHeight;
          return (
            <div className="chart-day" key={idx}>
              <span
                className="bar bar-submitted"
                style={{ height: `${Math.max(submittedH, 2)}px` }}
              />
              <span
                className="bar bar-approved"
                style={{ height: `${Math.max(approvedH, 2)}px` }}
              />
              <span
                className="bar bar-rejected"
                style={{ height: `${Math.max(rejectedH, 2)}px` }}
              />
            </div>
          );
        })}
      </div>
      <div className="chart-axis">
        {labels.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>

      <style jsx>{`
        .izin-chart {
          position: relative;
          height: 240px;
          padding-left: 24px;
        }

        .chart-grid {
          position: absolute;
          inset: 0 0 24px 0;
          padding-left: 24px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          pointer-events: none;
        }

        .chart-tick {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 10px;
          color: #cbd5e1;
        }

        .chart-tick > span:first-child {
          width: 16px;
          text-align: right;
        }

        .chart-line {
          flex: 1;
          height: 1px;
          background: #f1f5f9;
        }

        .chart-bars {
          position: relative;
          height: 200px;
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          padding: 0 4px;
          z-index: 1;
        }

        .chart-day {
          display: flex;
          align-items: flex-end;
          gap: 2px;
          flex: 1;
          min-width: 0;
        }

        .bar {
          flex: 1;
          border-radius: 4px 4px 0 0;
          max-width: 6px;
        }

        .bar-submitted {
          background: #3b82f6;
        }

        .bar-approved {
          background: #16a34a;
        }

        .bar-rejected {
          background: #ef4444;
        }

        .chart-axis {
          margin-top: 8px;
          display: flex;
          justify-content: space-between;
          padding: 0 4px;
          font-size: 11px;
          color: #94a3b8;
        }
      `}</style>
    </div>
  );
}
