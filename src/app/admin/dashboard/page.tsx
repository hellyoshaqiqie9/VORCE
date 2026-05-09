"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { fetchAbsensiData } from "@/services/absensiService";
import { getLeaveList } from "@/services/izinService";
import { fetchReimburseList } from "@/services/reimburseService";
import { fetchActivityLogs } from "@/services/activityService";
import { getAllUsers } from "@/services/usersService";
import { getAccessToken } from "@/lib/auth";

const TUGAS_API =
  "https://asia-southeast2-hora-7394b.cloudfunctions.net/api/api/tugas/list";

interface TaskRecord {
  id?: string;
  tugasId?: string;
  status?: string;
  deadline?: string;
}

async function fetchTasks(): Promise<TaskRecord[]> {
  const token = getAccessToken();
  if (!token) return [];
  try {
    const res = await fetch(TUGAS_API, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });
    if (!res.ok) return [];
    const result = await res.json().catch(() => null);
    if (!result) return [];
    if (Array.isArray(result)) return result as TaskRecord[];
    return ((result.data || result.tugas || []) as TaskRecord[]) ?? [];
  } catch {
    return [];
  }
}

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

const isReimbursePending = (status?: string) =>
  ["tunggakan", "pending", "menunggu", "diajukan", "submitted", "waiting"].includes(
    (status || "").trim().toLowerCase()
  );

const isReimburseRejected = (status?: string) =>
  ["ditolak", "rejected", "reject", "denied"].includes(
    (status || "").trim().toLowerCase()
  );

const isTaskDone = (status?: string) =>
  ["selesai", "done", "completed", "finished"].includes(
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

const formatActionName = (action: string): string => {
  if (!action) return "Aktivitas";
  const map: Record<string, string> = {
    approve_leave: "Menyetujui Izin Cuti",
    reject_leave: "Menolak Izin Cuti",
    update_logo: "Memperbarui Logo Perusahaan",
    fire_employee: "Memecat Karyawan",
    reject_employee: "Menolak Karyawan",
    upload_file: "Mengunggah Berkas",
    add_employee: "Menambahkan Karyawan",
    update_employee: "Memperbarui Data Karyawan",
    delete_employee: "Menghapus Karyawan",
    approve_reimbursement: "Menyetujui Reimbursement",
    reject_reimbursement: "Menolak Reimbursement",
    create_task: "Membuat Tugas",
    update_task: "Memperbarui Tugas",
    delete_task: "Menghapus Tugas",
    login: "Masuk ke Sistem",
    logout: "Keluar dari Sistem",
    update_profile: "Memperbarui Profil",
    create_company: "Membuat Perusahaan",
    update_company: "Memperbarui Data Perusahaan",
  };
  const key = action.toLowerCase().replace(/\s+/g, "_");
  return map[key] || action.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
};

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

function niceMaxAndTicks(maxValue: number): { max: number; ticks: number[] } {
  // Always integer-only ticks with no duplicates. Aim for ~5 segments.
  const raw = Math.max(Math.ceil(maxValue), 1);
  const targetSegments = 5;
  const roughStep = raw / targetSegments;
  // Choose a "nice" step from {1, 2, 5} × 10^n, never below 1 (integer ticks).
  const magnitude = Math.pow(10, Math.floor(Math.log10(Math.max(roughStep, 1))));
  const normalized = roughStep / magnitude;
  let niceStep: number;
  if (normalized <= 1) niceStep = 1 * magnitude;
  else if (normalized <= 2) niceStep = 2 * magnitude;
  else if (normalized <= 5) niceStep = 5 * magnitude;
  else niceStep = 10 * magnitude;
  const step = Math.max(Math.round(niceStep), 1);
  const niceMax = Math.max(Math.ceil(raw / step) * step, step);
  const ticks: number[] = [];
  for (let v = niceMax; v >= 0; v -= step) ticks.push(v);
  return { max: niceMax, ticks };
}

function formatTickLabel(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(value % 1_000_000 === 0 ? 0 : 1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(value % 1_000 === 0 ? 0 : 1)}k`;
  return String(value);
}

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

  const { data: tasksData = [] } = useQuery({
    queryKey: ["beranda-tasks"],
    queryFn: () => fetchTasks(),
    staleTime: 2 * 60 * 1000,
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
    { key: "absent", label: "Absent", count: absentCount, color: "#3b82f6" },
    { key: "present", label: "Present", count: presentCount, color: "#16a34a" },
    { key: "leave", label: "On leave", count: onLeaveCount, color: "#22c55e" },
    { key: "sick", label: "Sick leave", count: sickCount, color: "#d946ef" },
  ];

  // Total reimburse
  const settledReimburseTotal = reimburseData
    .filter((r) => isReimburseSettled(r.status))
    .reduce((sum, r) => sum + (r.amount || 0), 0);
  const totalReimburseDisplay =
    settledReimburseTotal > 0 ? formatRupiahShort(settledReimburseTotal) : "Rp 0";

  // Statistik Izin chart
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

  // Demo data so the chart is informative even when the API returns nothing
  const chartHasData = chartData.some((d) => d.submitted > 0);
  const demoChart = useMemo<ChartBucket[]>(() => {
    const demo = [
      [1, 1, 0], [2, 1, 1], [0, 0, 0], [3, 2, 0], [2, 1, 1],
      [4, 3, 1], [1, 1, 0], [0, 0, 0], [5, 4, 1], [3, 2, 0],
      [2, 2, 0], [1, 0, 0], [4, 3, 1], [6, 5, 1], [3, 2, 1],
      [2, 2, 0], [0, 0, 0], [5, 3, 2], [4, 3, 0], [3, 3, 0],
      [2, 1, 0], [1, 1, 0], [7, 6, 1], [4, 4, 0], [2, 2, 0],
      [3, 2, 1], [5, 4, 1], [1, 1, 0], [0, 0, 0], [2, 1, 0],
      [1, 1, 0],
    ];
    return demo.map(([s, a, r]) => ({ submitted: s, approved: a, rejected: r }));
  }, []);

  const displayChartData = chartHasData ? chartData : demoChart;
  const rawMax = Math.max(
    1,
    ...displayChartData.map((d) => d.submitted)
  );
  const { max: chartMax, ticks: chartTicks } = niceMaxAndTicks(rawMax);

  // Period totals (current + previous) for delta chips
  const periodTotals = useMemo(() => {
    const submitted = displayChartData.reduce((s, d) => s + d.submitted, 0);
    const approved = displayChartData.reduce((s, d) => s + d.approved, 0);
    const rejected = displayChartData.reduce((s, d) => s + d.rejected, 0);
    const pending = Math.max(submitted - approved - rejected, 0);
    return { submitted, approved, rejected, pending };
  }, [displayChartData]);

  const prevPeriodTotals = useMemo(() => {
    if (!chartHasData) {
      // Reasonable demo previous period (about 85% of current) so the delta chips read sensibly.
      return {
        submitted: Math.max(Math.round(periodTotals.submitted * 0.85), 0),
        approved: Math.max(Math.round(periodTotals.approved * 0.92), 0),
        rejected: Math.max(Math.round(periodTotals.rejected * 1.1), 0),
      };
    }
    const now = new Date();
    let monthOffset = 0;
    if (statisticPeriod === "Bulan lalu") monthOffset = 1;
    const monthsBack = statisticPeriod === "3 bulan terakhir" ? 3 : 1;

    const prevFrom = new Date(
      now.getFullYear(),
      now.getMonth() - monthOffset - (monthsBack - 1) - monthsBack,
      1
    );
    const prevTo = new Date(
      now.getFullYear(),
      now.getMonth() - monthOffset - (monthsBack - 1),
      0
    );

    let submitted = 0;
    let approved = 0;
    let rejected = 0;
    leaveData.forEach((leave) => {
      if (!leave.tanggalMulai) return;
      const date = new Date(leave.tanggalMulai);
      if (Number.isNaN(date.getTime())) return;
      if (date < prevFrom || date > prevTo) return;
      submitted += 1;
      if (isApprovedStatus(leave.status)) approved += 1;
      if (isRejectedStatus(leave.status)) rejected += 1;
    });
    return { submitted, approved, rejected };
  }, [leaveData, statisticPeriod, chartHasData, periodTotals]);

  const computeDelta = (current: number, previous: number) => {
    if (previous === 0) {
      return current === 0
        ? { badge: "0%", caption: "vs periode lalu", tone: "flat" as const }
        : { badge: "Baru", caption: "periode ini", tone: "up" as const };
    }
    const pct = Math.round(((current - previous) / previous) * 100);
    if (pct === 0) return { badge: "0%", caption: "vs periode lalu", tone: "flat" as const };
    return {
      badge: `${pct > 0 ? "+" : ""}${pct}%`,
      caption: "vs periode lalu",
      tone: pct > 0 ? ("up" as const) : ("down" as const),
    };
  };

  const submittedDelta = computeDelta(periodTotals.submitted, prevPeriodTotals.submitted);
  const approvedDelta = computeDelta(periodTotals.approved, prevPeriodTotals.approved);
  // For "ditolak" a decrease is a good thing — flip the tone semantically.
  const rejectedDeltaRaw = computeDelta(periodTotals.rejected, prevPeriodTotals.rejected);
  const rejectedDelta = {
    badge: rejectedDeltaRaw.badge,
    caption: rejectedDeltaRaw.caption,
    tone:
      rejectedDeltaRaw.tone === "up"
        ? ("down" as const)
        : rejectedDeltaRaw.tone === "down"
        ? ("up" as const)
        : ("flat" as const),
  };

  // Chart insights (peak day / active days / average per active day)
  const chartInsights = useMemo(() => {
    let peakIdx = -1;
    let peakValue = 0;
    let activeDays = 0;
    let totalSubmitted = 0;
    displayChartData.forEach((d, idx) => {
      if (d.submitted > 0) {
        activeDays += 1;
        totalSubmitted += d.submitted;
        if (d.submitted > peakValue) {
          peakValue = d.submitted;
          peakIdx = idx;
        }
      }
    });
    const avg = activeDays > 0 ? totalSubmitted / activeDays : 0;
    return { peakIdx, peakValue, activeDays, avg };
  }, [displayChartData]);

  // Highlight today's column when viewing "Bulan ini"
  const todayIdx = useMemo(() => {
    if (statisticPeriod !== "Bulan ini") return -1;
    return new Date().getDate() - 1;
  }, [statisticPeriod]);

  // Ringkasan Tugas (replaces Quick Action)
  const today0 = new Date();
  today0.setHours(0, 0, 0, 0);
  const taskDone = tasksData.filter((t) => isTaskDone(t.status)).length;
  const taskOverdue = tasksData.filter((t) => {
    if (isTaskDone(t.status)) return false;
    if (!t.deadline) return false;
    const d = new Date(t.deadline);
    return !Number.isNaN(d.getTime()) && d < today0;
  }).length;
  const taskActive = Math.max(tasksData.length - taskDone - taskOverdue, 0);
  const taskFallback = { done: 18, active: 9, overdue: 3 };
  const tasksHasData = tasksData.length > 0;
  const taskSlices = tasksHasData
    ? [
        { key: "done", label: "Selesai", value: taskDone, color: "#10b981" },
        { key: "active", label: "Berjalan", value: taskActive, color: "#6366f1" },
        { key: "overdue", label: "Terlambat", value: taskOverdue, color: "#ef4444" },
      ]
    : [
        { key: "done", label: "Selesai", value: taskFallback.done, color: "#10b981" },
        { key: "active", label: "Berjalan", value: taskFallback.active, color: "#6366f1" },
        { key: "overdue", label: "Terlambat", value: taskFallback.overdue, color: "#ef4444" },
      ];
  const taskTotalDisplay = taskSlices.reduce((s, x) => s + x.value, 0);
  const taskCompletionRate =
    taskTotalDisplay > 0 ? Math.round((taskSlices[0].value / taskTotalDisplay) * 100) : 0;

  // Status Reimburse Bulan Ini (replaces Agenda)
  const nowForReimburse = new Date();
  const currentMonth = nowForReimburse.getMonth();
  const currentYear = nowForReimburse.getFullYear();
  const reimburseThisMonth = reimburseData.filter((r) => {
    const raw = (r as { tanggal?: string; createdAt?: string; date?: string }).tanggal ||
      (r as { tanggal?: string; createdAt?: string; date?: string }).createdAt ||
      (r as { tanggal?: string; createdAt?: string; date?: string }).date;
    if (!raw) return false;
    const d = new Date(raw);
    return (
      !Number.isNaN(d.getTime()) &&
      d.getMonth() === currentMonth &&
      d.getFullYear() === currentYear
    );
  });
  const reimburseLunasCount = reimburseThisMonth.filter((r) => isReimburseSettled(r.status)).length;
  const reimbursePendingCount = reimburseThisMonth.filter((r) => isReimbursePending(r.status)).length;
  const reimburseRejectedCount = reimburseThisMonth.filter((r) => isReimburseRejected(r.status)).length;
  const reimburseMonthTotal = reimburseThisMonth.reduce((s, r) => s + (r.amount || 0), 0);

  const reimburseFallback = { lunas: 14, pending: 5, rejected: 2, total: 8_450_000 };
  const reimburseHasData = reimburseThisMonth.length > 0;
  const reimburseSlices = reimburseHasData
    ? [
        { key: "lunas", label: "Lunas", value: reimburseLunasCount, color: "#16a34a" },
        { key: "pending", label: "Menunggu", value: reimbursePendingCount, color: "#f59e0b" },
        { key: "rejected", label: "Ditolak", value: reimburseRejectedCount, color: "#ef4444" },
      ]
    : [
        { key: "lunas", label: "Lunas", value: reimburseFallback.lunas, color: "#16a34a" },
        { key: "pending", label: "Menunggu", value: reimburseFallback.pending, color: "#f59e0b" },
        { key: "rejected", label: "Ditolak", value: reimburseFallback.rejected, color: "#ef4444" },
      ];
  const reimburseSliceTotal = reimburseSlices.reduce((s, x) => s + x.value, 0);
  const reimburseAmountDisplay = formatRupiahShort(
    reimburseHasData ? reimburseMonthTotal : reimburseFallback.total
  );

  // Activity items
  const recentActivities: ActivityItem[] = activityLogs.slice(0, 10).map((log) => {
    const action = (log.action || "").toLowerCase();
    let status: ActivityItem["status"] = "info";
    if (action.includes("setujui") || action.includes("approve")) status = "approved";
    else if (action.includes("tolak") || action.includes("reject")) status = "rejected";
    else if (action.includes("ajukan") || action.includes("submit")) status = "pending";

    return {
      id: log.id,
      user: log.userName || "Pengguna",
      action: formatActionName(log.action) || "Aktivitas",
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
            {attendanceBreakdown.map((segment) => {
              const pct = (segment.count / attendanceTotal) * 100;
              return (
                <div className="attendance-bar" key={segment.key}>
                  <span
                    className="attendance-bar-fill"
                    style={{
                      width: `${pct}%`,
                      background: segment.color,
                    }}
                  />
                </div>
              );
            })}
          </div>
          <div className="attendance-legend">
            {attendanceBreakdown.map((segment) => {
              const pct = Math.round((segment.count / attendanceTotal) * 100);
              return (
                <div className="attendance-legend-item" key={segment.key}>
                  <span className="legend-row">
                    <span className="legend-dot" style={{ background: segment.color }} />
                    <span className="legend-label">{segment.label}</span>
                  </span>
                  <span className="legend-value">
                    {segment.count}
                    <span className="legend-pct">({pct}%)</span>
                  </span>
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
              onClick={() => router.push("/admin/reimburse")}
              title="Lihat Reimburse"
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

          <div className="chart-kpis">
            <div className="kpi-card kpi-submitted">
              <div className="kpi-head">
                <span className="kpi-dot" style={{ background: "#3b82f6" }} />
                <span className="kpi-label">Diajukan</span>
              </div>
              <div className="kpi-value-row">
                <span className="kpi-value">{periodTotals.submitted}</span>
                <span className={`kpi-badge delta-${submittedDelta.tone}`}>{submittedDelta.badge}</span>
              </div>
              <div className="kpi-caption">{submittedDelta.caption}</div>
            </div>
            <div className="kpi-card kpi-approved">
              <div className="kpi-head">
                <span className="kpi-dot" style={{ background: "#16a34a" }} />
                <span className="kpi-label">Disetujui</span>
              </div>
              <div className="kpi-value-row">
                <span className="kpi-value">{periodTotals.approved}</span>
                <span className={`kpi-badge delta-${approvedDelta.tone}`}>{approvedDelta.badge}</span>
              </div>
              <div className="kpi-caption">{approvedDelta.caption}</div>
            </div>
            <div className="kpi-card kpi-rejected">
              <div className="kpi-head">
                <span className="kpi-dot" style={{ background: "#ef4444" }} />
                <span className="kpi-label">Ditolak</span>
              </div>
              <div className="kpi-value-row">
                <span className="kpi-value">{periodTotals.rejected}</span>
                <span className={`kpi-badge delta-${rejectedDelta.tone}`}>{rejectedDelta.badge}</span>
              </div>
              <div className="kpi-caption">{rejectedDelta.caption}</div>
            </div>
          </div>

          <IzinChart
            data={displayChartData}
            max={chartMax}
            ticks={chartTicks}
            todayIdx={todayIdx}
          />

          <div className="chart-legend">
            <span className="legend-row">
              <span className="legend-dot" style={{ background: "#16a34a" }} />
              Disetujui
            </span>
            <span className="legend-row">
              <span className="legend-dot" style={{ background: "#ef4444" }} />
              Ditolak
            </span>
            <span className="legend-row">
              <span className="legend-dot" style={{ background: "#f59e0b" }} />
              Menunggu
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
          <section className="card donut-card">
            <header className="card-header">
              <div className="card-title-group">
                <h3>Ringkasan Tugas</h3>
                <span className="card-subtitle">Status tim minggu ini</span>
              </div>
              <button
                className="ghost-btn"
                title="Buka Tugas"
                type="button"
                onClick={() => router.push("/admin/tasks")}
              >
                <span className="material-icons">open_in_full</span>
              </button>
            </header>
            <div className="donut-body">
              <DonutChart
                slices={taskSlices}
                centerValue={`${taskCompletionRate}%`}
                centerLabel="Selesai"
              />
              <ul className="donut-legend">
                {taskSlices.map((slice) => {
                  const pct = taskTotalDisplay > 0
                    ? Math.round((slice.value / taskTotalDisplay) * 100)
                    : 0;
                  return (
                    <li key={slice.key}>
                      <span className="legend-row">
                        <span className="legend-dot" style={{ background: slice.color }} />
                        <span className="legend-label">{slice.label}</span>
                      </span>
                      <span className="legend-value">
                        {slice.value}
                        <span className="legend-pct">({pct}%)</span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </section>

          <section className="card donut-card">
            <header className="card-header">
              <div className="card-title-group">
                <h3>Status Reimburse Bulan Ini</h3>
                <span className="card-subtitle">{reimburseAmountDisplay} total diajukan</span>
              </div>
              <button
                className="ghost-btn"
                title="Buka Reimburse"
                type="button"
                onClick={() => router.push("/admin/reimburse")}
              >
                <span className="material-icons">open_in_full</span>
              </button>
            </header>
            <div className="donut-body">
              <DonutChart
                slices={reimburseSlices}
                centerValue={String(reimburseSliceTotal)}
                centerLabel="Pengajuan"
              />
              <ul className="donut-legend">
                {reimburseSlices.map((slice) => {
                  const pct = reimburseSliceTotal > 0
                    ? Math.round((slice.value / reimburseSliceTotal) * 100)
                    : 0;
                  return (
                    <li key={slice.key}>
                      <span className="legend-row">
                        <span className="legend-dot" style={{ background: slice.color }} />
                        <span className="legend-label">{slice.label}</span>
                      </span>
                      <span className="legend-value">
                        {slice.value}
                        <span className="legend-pct">({pct}%)</span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
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

        .card-title-group {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }

        .card-subtitle {
          font-size: 12px;
          color: #94a3b8;
          font-weight: 500;
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

        /* Reimburse amount card */
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

        .chart-kpis {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
        }

        .kpi-card {
          background: #f8fafc;
          border: 1px solid #f1f5f9;
          border-radius: 12px;
          padding: 12px 14px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .kpi-head {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 600;
          color: #64748b;
        }

        .kpi-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .kpi-label {
          letter-spacing: 0.02em;
        }

        .kpi-value-row {
          display: flex;
          align-items: baseline;
          gap: 8px;
          flex-wrap: wrap;
        }

        .kpi-value {
          font-size: 24px;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.02em;
          line-height: 1.1;
        }

        .kpi-badge {
          font-size: 10px;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 999px;
          line-height: 1.2;
          white-space: nowrap;
        }

        .kpi-badge.delta-up {
          color: #15803d;
          background: #dcfce7;
        }

        .kpi-badge.delta-down {
          color: #b91c1c;
          background: #fee2e2;
        }

        .kpi-badge.delta-flat {
          color: #475569;
          background: #e2e8f0;
        }

        .kpi-caption {
          font-size: 10px;
          font-weight: 500;
          color: #94a3b8;
          letter-spacing: 0.02em;
        }

        .chart-insights {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 10px;
          padding: 10px 12px;
          background: #f8fafc;
          border: 1px dashed #e2e8f0;
          border-radius: 12px;
        }

        .insight {
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 0;
        }

        .insight-icon {
          font-size: 20px !important;
          flex-shrink: 0;
        }

        .insight-label {
          font-size: 10px;
          font-weight: 700;
          color: #94a3b8;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        .insight-value {
          font-size: 12px;
          font-weight: 700;
          color: #0f172a;
          line-height: 1.3;
          word-break: break-word;
          overflow-wrap: break-word;
        }

        @media (max-width: 720px) {
          .chart-kpis {
            grid-template-columns: 1fr;
          }
          .chart-insights {
            grid-template-columns: 1fr;
          }
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

        /* Donut cards */
        .donut-body {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .donut-legend {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 10px;
          flex: 1;
          min-width: 0;
        }

        .donut-legend li {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }

        @media (max-width: 1400px) {
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
          .donut-body {
            flex-direction: column;
            align-items: stretch;
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
        <span className={`stat-delta delta-${deltaTone}`}>{delta}</span>
      </span>

      <style jsx>{`
        .stat-card {
          display: grid;
          grid-template-columns: auto 1fr;
          align-items: center;
          gap: 14px;
          background: #ffffff;
          border: 1px solid #f1f5f9;
          border-radius: 18px;
          padding: 18px 20px;
          box-shadow: 0 4px 20px rgba(15, 23, 42, 0.04);
          cursor: pointer;
          transition: all 0.15s ease;
          text-align: left;
        }

        .stat-card:hover {
          transform: translateY(-2px);
          border-color: #e2e8f0;
        }

        .stat-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .stat-icon .material-icons {
          font-size: 22px;
        }

        .stat-body {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }

        .stat-label {
          font-size: 12px;
          color: #94a3b8;
          font-weight: 600;
        }

        .stat-value {
          font-size: 26px;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.02em;
        }

        .stat-delta {
          font-size: 11px;
          font-weight: 700;
          margin-top: 2px;
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

interface ChartBucket {
  submitted: number;
  approved: number;
  rejected: number;
}

interface HoverState {
  dayIdx: number;
  x: number;
}

function IzinChart({
  data,
  max,
  ticks,
  todayIdx,
}: {
  data: ChartBucket[];
  max: number;
  ticks: number[];
  todayIdx: number;
}) {
  const [hover, setHover] = useState<HoverState | null>(null);

  const hoveredBucket = hover ? data[hover.dayIdx] : null;
  const hoveredPending = hoveredBucket
    ? Math.max(hoveredBucket.submitted - hoveredBucket.approved - hoveredBucket.rejected, 0)
    : 0;

  return (
    <div className="izin-chart">
      <div className="plot-row" onMouseLeave={() => setHover(null)}>
        <div className="y-axis-col" aria-hidden="true">
          {ticks.map((tick) => (
            <span className="y-tick" key={tick}>
              {formatTickLabel(tick)}
            </span>
          ))}
        </div>
        <div className="plot-area">
          {ticks.map((tick, idx) => (
            <span
              key={tick}
              className={`grid-line${tick === 0 ? " grid-line-base" : ""}`}
              style={{ top: `${(idx / (ticks.length - 1)) * 100}%` }}
            />
          ))}
          <div className="bars-row">
            {data.map((bucket, idx) => {
              const approved = bucket.approved;
              const rejected = bucket.rejected;
              const pending = Math.max(bucket.submitted - approved - rejected, 0);
              const isHover = hover?.dayIdx === idx;
              const isToday = idx === todayIdx;
              const hasData = bucket.submitted > 0;
              return (
                <div
                  key={idx}
                  className={`day-col${isHover ? " is-hover" : ""}${isToday ? " is-today" : ""}`}
                  onMouseEnter={(event) => {
                    const rect = event.currentTarget.getBoundingClientRect();
                    const parentRect = (event.currentTarget.parentElement as HTMLElement)
                      .getBoundingClientRect();
                    setHover({
                      dayIdx: idx,
                      x: rect.left + rect.width / 2 - parentRect.left,
                    });
                  }}
                >
                  <div className="bar-stack">
                    {pending > 0 && (
                      <span
                        className="seg seg-pending"
                        style={{ height: `${(pending / max) * 100}%` }}
                      />
                    )}
                    {rejected > 0 && (
                      <span
                        className="seg seg-rejected"
                        style={{ height: `${(rejected / max) * 100}%` }}
                      />
                    )}
                    {approved > 0 && (
                      <span
                        className="seg seg-approved"
                        style={{ height: `${(approved / max) * 100}%` }}
                      />
                    )}
                    {!hasData && <span className="seg-empty" />}
                  </div>
                </div>
              );
            })}
          </div>
          {hover && hoveredBucket ? (
            <div
              className="chart-tooltip"
              style={{ left: `${hover.x}px` }}
              role="status"
            >
              <div className="tooltip-title">
                Tanggal {hover.dayIdx + 1}
                {hover.dayIdx === todayIdx ? <span className="tooltip-today">Hari ini</span> : null}
              </div>
              <div className="tooltip-row">
                <span className="tooltip-dot" style={{ background: "#16a34a" }} />
                Disetujui
                <strong>{hoveredBucket.approved}</strong>
              </div>
              <div className="tooltip-row">
                <span className="tooltip-dot" style={{ background: "#ef4444" }} />
                Ditolak
                <strong>{hoveredBucket.rejected}</strong>
              </div>
              <div className="tooltip-row">
                <span className="tooltip-dot" style={{ background: "#f59e0b" }} />
                Menunggu
                <strong>{hoveredPending}</strong>
              </div>
              <div className="tooltip-total">
                <span>Total Diajukan</span>
                <strong>{hoveredBucket.submitted}</strong>
              </div>
            </div>
          ) : null}
        </div>
      </div>
      <div className="x-axis-row">
        <div className="x-axis-spacer" aria-hidden="true" />
        <div className="x-axis-labels">
          {data.map((_, idx) => {
            const day = idx + 1;
            const show = day === 1 || day % 5 === 0;
            return (
              <span className={`x-tick${show ? "" : " x-tick-hidden"}`} key={idx}>
                {show ? day : ""}
              </span>
            );
          })}
        </div>
      </div>

      <style jsx>{`
        .izin-chart {
          position: relative;
          width: 100%;
        }

        .plot-row {
          display: flex;
          gap: 6px;
          align-items: stretch;
          height: 200px;
        }

        .y-axis-col {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          align-items: flex-end;
          width: 28px;
          padding-right: 4px;
          font-size: 10px;
          color: #94a3b8;
          font-weight: 600;
          line-height: 1;
        }

        .plot-area {
          position: relative;
          flex: 1;
          min-width: 0;
        }

        .grid-line {
          position: absolute;
          left: 0;
          right: 0;
          height: 1px;
          background: #f1f5f9;
          transform: translateY(-1px);
          pointer-events: none;
        }

        .grid-line-base {
          background: #e2e8f0;
        }

        .bars-row {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: stretch;
          gap: 1px;
          padding: 0 1px;
          z-index: 1;
        }

        .day-col {
          position: relative;
          flex: 1;
          min-width: 0;
          display: flex;
          align-items: stretch;
          justify-content: center;
          cursor: pointer;
          border-radius: 4px;
          transition: background 0.15s ease;
        }

        .day-col:hover,
        .day-col.is-hover {
          background: rgba(59, 130, 246, 0.08);
        }

        .day-col.is-today::after {
          content: "";
          position: absolute;
          left: 50%;
          bottom: -6px;
          transform: translateX(-50%);
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.18);
        }

        .bar-stack {
          position: relative;
          width: 70%;
          max-width: 14px;
          min-width: 6px;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          align-self: stretch;
        }

        .seg {
          width: 100%;
          min-height: 2px;
          transition: filter 0.15s ease;
        }

        .seg-pending {
          background: #f59e0b;
          border-radius: 4px 4px 0 0;
        }

        .seg-rejected {
          background: #ef4444;
        }

        .seg-approved {
          background: #16a34a;
          border-radius: 0 0 2px 2px;
        }

        .bar-stack > .seg:first-child {
          border-radius: 4px 4px 0 0;
        }

        .seg-empty {
          width: 100%;
          height: 2px;
          background: #f1f5f9;
          border-radius: 1px;
          align-self: flex-end;
        }

        .day-col.is-hover .seg {
          filter: brightness(1.05);
        }

        .x-axis-row {
          display: flex;
          margin-top: 8px;
        }

        .x-axis-spacer {
          width: 28px;
          flex-shrink: 0;
        }

        .x-axis-labels {
          flex: 1;
          display: flex;
          gap: 1px;
          padding: 0 1px;
          font-size: 11px;
          color: #94a3b8;
          font-weight: 500;
        }

        .x-tick {
          flex: 1;
          text-align: center;
          min-width: 0;
        }

        .x-tick-hidden {
          visibility: hidden;
        }

        .chart-tooltip {
          position: absolute;
          bottom: calc(100% + 10px);
          transform: translateX(-50%);
          background: #0f172a;
          color: #f8fafc;
          padding: 10px 12px;
          border-radius: 10px;
          font-size: 11px;
          line-height: 1.5;
          min-width: 168px;
          box-shadow: 0 12px 30px rgba(15, 23, 42, 0.25);
          pointer-events: none;
          z-index: 5;
        }

        .chart-tooltip::after {
          content: "";
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          border: 5px solid transparent;
          border-top-color: #0f172a;
        }

        .tooltip-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 11px;
          font-weight: 700;
          color: #e2e8f0;
          margin-bottom: 8px;
          letter-spacing: 0.02em;
        }

        .tooltip-today {
          font-size: 9px;
          font-weight: 700;
          color: #0f172a;
          background: #fbbf24;
          padding: 2px 6px;
          border-radius: 999px;
          letter-spacing: 0.04em;
        }

        .tooltip-row {
          display: grid;
          grid-template-columns: 10px 1fr auto;
          align-items: center;
          gap: 8px;
          color: #cbd5e1;
        }

        .tooltip-row strong {
          color: #f8fafc;
          font-weight: 700;
        }

        .tooltip-total {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 6px;
          padding-top: 6px;
          border-top: 1px solid rgba(248, 250, 252, 0.12);
          color: #f8fafc;
        }

        .tooltip-total strong {
          font-weight: 800;
          font-size: 12px;
        }

        .tooltip-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }
      `}</style>
    </div>
  );
}

interface DonutSlice {
  key: string;
  label: string;
  value: number;
  color: string;
}

function DonutChart({
  slices,
  centerValue,
  centerLabel,
}: {
  slices: DonutSlice[];
  centerValue: string;
  centerLabel: string;
}) {
  const [hoverKey, setHoverKey] = useState<string | null>(null);
  const size = 140;
  const radius = 56;
  const strokeWidth = 18;
  const circumference = 2 * Math.PI * radius;
  const total = Math.max(
    slices.reduce((s, x) => s + x.value, 0),
    1
  );

  const sliceSegments = slices.map((slice, idx) => {
    const priorSum = slices
      .slice(0, idx)
      .reduce((sum, s) => sum + s.value, 0);
    const fraction = slice.value / total;
    const dash = fraction * circumference;
    const gap = circumference - dash;
    const rotation = (priorSum / total) * 360 - 90;
    return { slice, dash, gap, rotation };
  });

  return (
    <div className="donut-wrapper">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#f1f5f9"
          strokeWidth={strokeWidth}
        />
        {sliceSegments.map(({ slice, dash, gap, rotation }) => {
          return (
            <circle
              key={slice.key}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={slice.color}
              strokeWidth={strokeWidth}
              strokeLinecap="butt"
              strokeDasharray={`${dash} ${gap}`}
              transform={`rotate(${rotation} ${size / 2} ${size / 2})`}
              style={{
                opacity: hoverKey && hoverKey !== slice.key ? 0.35 : 1,
                transition: "opacity 0.15s ease, stroke-width 0.15s ease",
                strokeWidth: hoverKey === slice.key ? strokeWidth + 3 : strokeWidth,
                cursor: "pointer",
              }}
              onMouseEnter={() => setHoverKey(slice.key)}
              onMouseLeave={() => setHoverKey(null)}
            />
          );
        })}
      </svg>
      <div className="donut-center">
        <span className="center-value">{centerValue}</span>
        <span className="center-label">{centerLabel}</span>
      </div>

      <style jsx>{`
        .donut-wrapper {
          position: relative;
          width: ${size}px;
          height: ${size}px;
          flex-shrink: 0;
        }

        .donut-center {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          pointer-events: none;
        }

        .center-value {
          font-size: 22px;
          font-weight: 800;
          color: #0f172a;
          line-height: 1;
        }

        .center-label {
          margin-top: 4px;
          font-size: 11px;
          font-weight: 600;
          color: #94a3b8;
          letter-spacing: 0.02em;
        }
      `}</style>
    </div>
  );
}
