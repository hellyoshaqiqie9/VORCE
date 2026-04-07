"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getAccessToken, getUserData } from "@/lib/auth";
import { fetchAbsensiData } from "@/services/absensiService";
import { fetchAllArsipStats, ArsipDashboard } from "@/services/arsipService";
import { uploadFile } from "@/services/berkasService";
import { getLeaveList, approveLeave, rejectLeave } from "@/services/izinService";
import { approveReimburse, fetchReimburseDetail, fetchReimburseList } from "@/services/reimburseService";
import { getAllUsers } from "@/services/usersService";
import { getUserProfile } from "@/services/profileService";
import { fetchActivityLogs } from "@/services/activityService";

const API_BASE = "https://asia-southeast2-hora-7394b.cloudfunctions.net/api";

interface Approval {
  id: string;
  type: "reimburse" | "leave";
  title: string;
  user: string;
  amount?: string;
  days?: string;
  fileId?: string;
  status: "pending" | "approved" | "rejected";
}

interface DashboardTask {
  status?: string;
  deadline?: string;
}

function normalizeReimburseStatusForUi(status?: string) {
  const normalized = (status || "").trim().toLowerCase();
  if (["lunas", "approved", "approve", "disetujui", "accepted", "paid", "settled"].includes(normalized)) return "lunas";
  return "tunggakan";
}

const formatCurrency = (value: number) => `Rp ${value.toLocaleString("id-ID")}`;
const formatDate = (value?: string) => (value ? new Date(value).toLocaleDateString("id-ID") : "-");
const isPdfAttachment = (fileName?: string, fileUrl?: string) => `${fileName || ""} ${fileUrl || ""}`.toLowerCase().includes(".pdf");
const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;
const asRecord = (value: unknown): Record<string, unknown> =>
  typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};

export default function AdminDashboard() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const userData = typeof window !== "undefined" ? getUserData() : null;
  const companyName = userData?.companyName || userData?.namaPerusahaan || "Admin";
  const idperusahaan = userData?.idPerusahaan || userData?.idperusahaan || userData?.companyId || "CLVREW";
  
  //           Fetch current user profile for greeting          
  const { data: profile } = useQuery({
    queryKey: ["current-user-profile"],
    queryFn: () => getUserProfile(),
    staleTime: 10 * 60 * 1000,
  });

  const resolveUserName = (identifier?: string, fallback?: string) => {
    if (!identifier) return fallback || "Unknown";
    const match = users.find((user) => user.userId === identifier || user.email === identifier);
    return match?.name || fallback || identifier || "Unknown";
  };

  //           Fetch users directory (cached)                                     
  const { data: users = [] } = useQuery({
    queryKey: ["users-directory"],
    queryFn: () => getAllUsers(),
    staleTime: 10 * 60 * 1000,
  });

  //           Fetch today's attendance                                                       
  const todayStr = new Date().toISOString().split("T")[0];
  const { data: attendanceData = [], isLoading: loadingAttendance } = useQuery({
    queryKey: ["dashboard-attendance", todayStr],
    queryFn: () => fetchAbsensiData(todayStr, todayStr),
    staleTime: 5 * 60 * 1000,
  });

  //           Fetch leave/izin list                                                                
  const { data: leaveData = [], isLoading: loadingLeave } = useQuery({
    queryKey: ["dashboard-izin"],
    queryFn: () => getLeaveList(),
    staleTime: 5 * 60 * 1000,
  });

  //           Fetch tasks                                                                                              
  const { data: tasksData = [], isLoading: loadingTasks } = useQuery<DashboardTask[]>({
    queryKey: ["dashboard-tugas"],
    queryFn: async () => {
      const token = getAccessToken();
      if (!token) return [];
      const res = await fetch(`${API_BASE}/api/tugas/list`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return [];
      const result = await res.json();
      return Array.isArray(result) ? result : (result.data || []);
    },
    staleTime: 5 * 60 * 1000,
  });

  //           Fetch reimburse                                                                                  
  const { data: reimburseData = [], isLoading: loadingReimburse } = useQuery({
    queryKey: ["dashboard-reimburse"],
    queryFn: () => fetchReimburseList(),
    staleTime: 5 * 60 * 1000,
  });

  //           Fetch Activity Logs                                                                      
  const { data: activityLogs = [], isLoading: loadingActivities } = useQuery({
    queryKey: ["dashboard-activities"],
    queryFn: () => fetchActivityLogs(),
    staleTime: 2 * 60 * 1000,
  });

  //           Fetch Arsip Analytics (parallel)                               
  const monthStart = new Date();
  monthStart.setDate(1);
  const arsipStartDate = `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, "0")}-01T00:00:00Z`;
  const arsipEndDate = new Date().toISOString();

  const { data: arsipStats, isLoading: loadingArsip } = useQuery<ArsipDashboard>({
    queryKey: ["dashboard-arsip", idperusahaan, arsipStartDate.substring(0, 7)],
    queryFn: () => fetchAllArsipStats(idperusahaan, arsipStartDate, arsipEndDate),
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  //           Computed stats                                                                                     
  const totalUsers = users.length || 30;
  const hadirCount = attendanceData.length;
  const hadirPercent = totalUsers > 0 ? Math.round((hadirCount / totalUsers) * 100) : 0;

  const activeCuti = leaveData.filter(
    (l) => l.status?.toLowerCase() === "approved" || l.status?.toLowerCase() === "disetujui"
  ).length;

  const pendingTasks = tasksData.filter(
    (task) => (task.status || "").toLowerCase() === "pending"
  ).length;
  const overdueTasks = tasksData.filter((task) => {
    if (!task.deadline) return false;
    return new Date(task.deadline) < new Date() && (task.status || "").toLowerCase() !== "selesai";
  }).length;

  const tunggakanReimburse = reimburseData.filter(
    (reimburse) => normalizeReimburseStatusForUi(reimburse.status) === "tunggakan"
  );
  const totalReimburseAmount = tunggakanReimburse.reduce((sum, r) => sum + (r.amount || 0), 0);
  const formattedReimburse = totalReimburseAmount > 1_000_000
    ? `Rp ${(totalReimburseAmount / 1_000_000).toFixed(1)} Jt`
    : `Rp ${totalReimburseAmount.toLocaleString("id-ID")}`;

  // Fallback mini-card stats from loaded data
  const fbTotalTasks = tasksData.length;
  const fbDoneTasks = tasksData.filter((t: any) => (t.status || "").toLowerCase() === "selesai").length;
  const fbTugasPct: number | null = fbTotalTasks > 0 ? (fbDoneTasks / fbTotalTasks) * 100 : null;
  const fbApprovedLeave = leaveData.filter((l: any) => ["approved", "disetujui", "diterima"].includes((l.status || "").toLowerCase())).length;
  const fbTotalLeave = leaveData.length;
  const fbApprovedAmount = reimburseData.filter((r: any) => ["lunas", "approved", "disetujui"].includes((r.status || "").trim().toLowerCase())).reduce((sum: number, r: any) => sum + (r.amount || 0), 0);
  const miniKehadiranPct: number | null = arsipStats?.kehadiranStats?.persentaseKehadiran ?? (hadirPercent > 0 ? hadirPercent : null);
  const miniTugasPct: number | null = (arsipStats?.tugasStats?.persentaseSelesai != null && arsipStats.tugasStats.persentaseSelesai > 0) ? arsipStats.tugasStats.persentaseSelesai : fbTugasPct;
  const miniIzinApproved: number = arsipStats?.izinStats?.disetujui ?? fbApprovedLeave;
  const miniIzinTotal: number = (arsipStats?.izinStats?.totalIzin != null && arsipStats.izinStats.totalIzin > 0) ? arsipStats.izinStats.totalIzin : fbTotalLeave;
  const miniReimburseAmount: number = (arsipStats?.reimburseStats?.nominalDisetujui != null && arsipStats.reimburseStats.nominalDisetujui > 0) ? arsipStats.reimburseStats.nominalDisetujui : fbApprovedAmount;
  const fmtMiniReimburse = (v: number) => v >= 1_000_000 ? `Rp ${(v / 1_000_000).toFixed(1)} Jt` : v >= 1_000 ? `Rp ${(v / 1_000).toFixed(0)} rb` : `Rp ${v.toLocaleString("id-ID")}`;
  const isLoadingMini = loadingArsip || loadingTasks || loadingLeave || loadingReimburse;

  //           Build approvals from izin + reimburse                
  const [localApprovalStatus, setLocalApprovalStatus] = useState<Record<string, string>>({});
  const [selectedReimburseId, setSelectedReimburseId] = useState<string | null>(null);
  const [transferProofFileId, setTransferProofFileId] = useState<string | null>(null);
  const [uploadingTransferProof, setUploadingTransferProof] = useState(false);

  // Activity Pagination
  const [activityPage, setActivityPage] = useState(1);
  const ACTIVITIES_PER_PAGE = 8;
  const totalActivityPages = Math.ceil(activityLogs.length / ACTIVITIES_PER_PAGE);
  const paginatedActivities = activityLogs.slice(
    (activityPage - 1) * ACTIVITIES_PER_PAGE,
    activityPage * ACTIVITIES_PER_PAGE
  );
  const selectedReimburseFallback = selectedReimburseId
    ? tunggakanReimburse.find((item) => item.id === selectedReimburseId) || null
    : null;
  const { data: selectedReimburseDetail } = useQuery({
    queryKey: ["dashboard-reimburse-detail", selectedReimburseId],
    queryFn: () => fetchReimburseDetail(selectedReimburseId || ""),
    enabled: Boolean(selectedReimburseId),
  });
  const selectedReimburseApproval = selectedReimburseDetail || selectedReimburseFallback;
  const closeReimburseApprovalModal = () => {
    setSelectedReimburseId(null);
    setTransferProofFileId(null);
  };
  const refreshApprovalQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["dashboard-reimburse"] }),
      queryClient.invalidateQueries({ queryKey: ["dashboard-izin"] }),
      queryClient.invalidateQueries({ queryKey: ["reimburse-list"] }),
    ]);
  };

  const approveReimburseMutation = useMutation({
    mutationFn: ({ id, fileId }: { id: string; fileId?: string }) => approveReimburse(id, fileId),
    onSuccess: async () => {
      await refreshApprovalQueries();
      closeReimburseApprovalModal();
    },
    onError: (error: unknown) => alert(getErrorMessage(error, "Gagal menandai reimburse sebagai lunas.")),
  });

  const approvals: Approval[] = [
    ...leaveData
      .filter((l) => (l.status || "").toLowerCase() === "pending")
      .map((l) => ({
        id: `leave-${l.leaveId}`,
        type: "leave" as const,
        title: l.jenisIzin || "Izin",
        user: l.displayName || l.email || "Unknown",
        days: l.tanggalMulai && l.tanggalSelesai
          ? `${Math.ceil((new Date(l.tanggalSelesai).getTime() - new Date(l.tanggalMulai).getTime()) / 86400000) + 1} Hari`
          : "-",
        status: (localApprovalStatus[`leave-${l.leaveId}`] || "pending") as "pending" | "approved" | "rejected",
      })),
    ...tunggakanReimburse.map((r) => ({
      id: `reimburse-${r.id}`,
      type: "reimburse" as const,
      title: r.title || "Reimburse",
      user: resolveUserName(r.userId),
      amount: `Rp ${(r.amount || 0).toLocaleString("id-ID")}`,
      fileId: r.fileId,
      status: (localApprovalStatus[`reimburse-${r.id}`] || "pending") as "pending" | "approved" | "rejected",
    })),
  ];

  const handleTransferProofUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setUploadingTransferProof(true);
      const result = await uploadFile(file, "REIMBURSE");
      const payload = asRecord(result);
      const data = asRecord(payload.data);
      const fileId = String(data.fileId || payload.fileId || payload.id || "");
      if (!fileId) throw new Error("File ID bukti transfer tidak ditemukan.");
      setTransferProofFileId(fileId);
    } catch (error: unknown) {
      alert(getErrorMessage(error, "Gagal upload bukti transfer."));
    } finally {
      setUploadingTransferProof(false);
    }
  };

  const handleApprove = async (compositeId: string) => {
    if (compositeId.startsWith("reimburse-")) {
      const id = compositeId.replace("reimburse-", "");
      router.push(`/admin/reimburse?detail=${id}`);
      return;
    }

    setLocalApprovalStatus((s) => ({ ...s, [compositeId]: "approved" }));
    try {
      await approveLeave(compositeId.replace("leave-", ""));
      await refreshApprovalQueries();
    } catch (e) {
      console.error("Approve failed:", e);
      setLocalApprovalStatus((s) => ({ ...s, [compositeId]: "pending" }));
    }
  };

  const handleReject = async (compositeId: string) => {
    if (!compositeId.startsWith("leave-")) {
      return;
    }
    setLocalApprovalStatus((s) => ({ ...s, [compositeId]: "rejected" }));
    try {
      await rejectLeave(compositeId.replace("leave-", ""));
      await refreshApprovalQueries();
    } catch (e) {
      console.error("Reject failed:", e);
      setLocalApprovalStatus((s) => ({ ...s, [compositeId]: "pending" }));
    }
  };

  //           Build attendance feed from today's data          
  const attendanceFeed = attendanceData.slice(0, 5).map((item, idx) => {
    // displayName is nama_karyawan from API after normalization
    const name = item.displayName || item.email || "Unknown";
    // Try to enrich from users directory using id_karyawan
    const userMatch = users.find((u) => u.userId === item.email || u.email === item.email);
    const resolvedName = userMatch?.name || name;
    const initials = resolvedName
      .split(" ")
      .map((w: string) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "?";
    
    const time = item.waktuMasuk
      ? new Date(item.waktuMasuk).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
      : "-";

    // Use isTerlambat flag from API (most reliable)
    const statusLabel = item.isTerlambat ? "Terlambat" : "Tepat Waktu";
    const statusClass = item.isTerlambat ? "late" : "on-time";
    
    // status_kehadiran "SELESAI" = already checked out
    const type = (item.status || "").toUpperCase() === "SELESAI" || item.waktuPulang ? "pulang" : "masuk";

    return { id: item.id || `feed-${idx}`, name: resolvedName, initials, time, location: item.lokasiMasuk || "-", statusLabel, statusClass, type };
  });

  const getActivityIcon = (action: string) => {
    const act = action.toLowerCase();
    if (act.includes("absen") || act.includes("check")) return { icon: "how_to_reg", color: "#16a34a" };
    if (act.includes("izin") || act.includes("cuti")) return { icon: "event_busy", color: "#f59e0b" };
    if (act.includes("tugas")) return { icon: "assignment", color: "#0066FF" };
    if (act.includes("reimburse")) return { icon: "receipt_long", color: "#db2777" };
    if (act.includes("berkas") || act.includes("file")) return { icon: "folder", color: "#64748b" };
    return { icon: "notifications", color: "#4f46e5" };
  };

  const formatDistanceToNow = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMin = Math.floor(diffMs / 60000);
      if (diffMin < 1) return "Baru saja";
      if (diffMin < 60) return `${diffMin} menit lalu`;
      const diffHrs = Math.floor(diffMin / 60);
      if (diffHrs < 24) return `${diffHrs} jam lalu`;
      return date.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
    } catch { return "-"; }
  };

  return (
    <div className="dashboard-container">
      {/* Welcome Section */}
      <div className="welcome-section">
        <h1>Selamat Pagi, {profile?.username || companyName}!     </h1>
        <p>Ini yang terjadi dengan tim Anda hari ini.</p>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card" onClick={() => router.push("/admin/attendance")}>
          <div className="card-top">
            <div className="stat-icon attendance">
              <span className="material-icons">people</span>
            </div>
            <span className="stat-info">
              <span className="label">Hadir Hari Ini</span>
            </span>
            <div className="stat-trend positive">
              <span className="material-icons" style={{ fontSize: "14px" }}>
                trending_up
              </span>
              <span>{hadirPercent}%</span>
            </div>
          </div>
          <div className="stat-value">
            {hadirCount} <span className="unit">/ {totalUsers}</span>
          </div>
        </div>

        <div className="stat-card" onClick={() => router.push("/admin/izin")}>
          <div className="card-top">
            <div className="stat-icon leave">
              <span className="material-icons">flight_takeoff</span>
            </div>
            <span className="stat-info">
              <span className="label">Izin / Cuti</span>
            </span>
          </div>
          <div className="stat-value">{activeCuti}</div>
        </div>

        <div className="stat-card" onClick={() => router.push("/admin/tugas")}>
          <div className="card-top">
            <div className="stat-icon tasks">
              <span className="material-icons">assignment</span>
            </div>
            <span className="stat-info">
              <span className="label">Tugas Aktif</span>
            </span>
          </div>
          <div className="stat-value">{pendingTasks}</div>
          {overdueTasks > 0 && <div className="stat-subtitle overdue">{overdueTasks} Melewati Deadline</div>}
        </div>

        <div className="stat-card" onClick={() => router.push("/admin/reimburse")}>
          <div className="card-top">
            <div className="stat-icon reimburse">
              <span className="material-icons">receipt_long</span>
            </div>
            <span className="stat-info">
              <span className="label">Total Reimburse</span>
            </span>
          </div>
          <div className="stat-value">{formattedReimburse}</div>
          <div className="stat-subtitle">{tunggakanReimburse.length} Belum Dibayar</div>
        </div>
      </div>

      {/* Analytics Mini-Cards */}
      <div className="analytics-strip">
        <div className="mini-card">
          <div className="mini-icon kehadiran">
            <span className="material-icons">how_to_reg</span>
          </div>
          <div className="mini-body">
            <span className="mini-label">Kehadiran Bulan Ini</span>
            <span className="mini-value">
              {isLoadingMini ? "..." : miniKehadiranPct != null ? `${miniKehadiranPct.toFixed(1)}%` : "n/a"}
            </span>
          </div>
          <div className={`mini-bar ${(miniKehadiranPct || 0) >= 80 ? "good" : "warn"}`}>
            <div className="bar-fill" style={{ width: `${Math.min(miniKehadiranPct || 0, 100)}%` }} />
          </div>
        </div>

        <div className="mini-card">
          <div className="mini-icon tugas">
            <span className="material-icons">task_alt</span>
          </div>
          <div className="mini-body">
            <span className="mini-label">Tugas Selesai</span>
            <span className="mini-value">
              {isLoadingMini ? "..." : miniTugasPct != null ? `${miniTugasPct.toFixed(1)}%` : "n/a"}
            </span>
          </div>
          <div className={`mini-bar ${(miniTugasPct || 0) >= 70 ? "good" : "warn"}`}>
            <div className="bar-fill" style={{ width: `${Math.min(miniTugasPct || 0, 100)}%` }} />
          </div>
        </div>

        <div className="mini-card">
          <div className="mini-icon izin">
            <span className="material-icons">event_available</span>
          </div>
          <div className="mini-body">
            <span className="mini-label">Izin Disetujui</span>
            <span className="mini-value">
              {isLoadingMini ? "..." : miniIzinTotal > 0 ? `${miniIzinApproved} / ${miniIzinTotal}` : miniIzinApproved > 0 ? `${miniIzinApproved} disetujui` : "n/a"}
            </span>
          </div>
        </div>

        <div className="mini-card">
          <div className="mini-icon reimburse-stat">
            <span className="material-icons">account_balance_wallet</span>
          </div>
          <div className="mini-body">
            <span className="mini-label">Reimburse Disetujui</span>
            <span className="mini-value">
              {isLoadingMini ? "..." : miniReimburseAmount > 0 ? fmtMiniReimburse(miniReimburseAmount) : "n/a"}
            </span>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Activity Log - LIVE */}
        <div className="card attendance-feed">
          <div className="card-header">
            <h3>Aktivitas Terbaru</h3>
          </div>
          <div className="feed-list">
            {loadingActivities ? (
              <div className="loading-state">Memuat data...</div>
            ) : activityLogs.length === 0 ? (
              <div className="empty-state">Belum ada aktivitas perusahaan.</div>
            ) : (
              paginatedActivities.map((log) => {
                const { icon, color } = getActivityIcon(log.action);
                return (
                  <div key={log.id} className="feed-item activity">
                    <div className="activity-icon-box" style={{ backgroundColor: color + "15", color: color }}>
                      <span className="material-icons">{icon}</span>
                    </div>
                    <div className="feed-content">
                      <p className="activity-main-text">
                        {log.details}
                      </p>
                      <div className="activity-meta">
                        <span className="user-label">oleh {log.userName}</span>
                        <span className="dot-divider">   </span>
                        <span className="time">{formatDistanceToNow(log.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Activity Pagination Controls */}
          {!loadingActivities && totalActivityPages > 1 && (
            <div className="pagination">
              <button 
                className="page-btn" 
                disabled={activityPage === 1}
                onClick={() => setActivityPage(prev => prev - 1)}
              >
                <span className="material-icons">chevron_left</span>
              </button>
              
              {Array.from({ length: totalActivityPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  className={`page-btn ${activityPage === page ? 'active' : ''}`}
                  onClick={() => setActivityPage(page)}
                >
                  {page}
                </button>
              ))}

              <button 
                className="page-btn" 
                disabled={activityPage === totalActivityPages}
                onClick={() => setActivityPage(prev => prev + 1)}
              >
                <span className="material-icons">chevron_right</span>
              </button>
            </div>
          )}
        </div>

        {/* Pending Approvals - LIVE */}
        <div className="card pending-approvals">
          <div className="card-header">
            <h3>Perlu Persetujuan</h3>
          </div>
          <div className="approval-list">
            {approvals.filter((a) => a.status === "pending").length === 0 ? (
              <div className="empty-approval">
                <span className="material-icons">check_circle</span>
                <p>Semua approval sudah selesai!</p>
              </div>
            ) : (
              approvals
                .filter((a) => a.status === "pending")
                .map((approval) => (
                  <div key={approval.id} className="approval-item">
                    <div className={`approval-icon ${approval.type}`}>
                      <span className="material-icons">
                        {approval.type === "reimburse" ? "receipt" : "flight_takeoff"}
                      </span>
                    </div>
                    <div className="approval-content">
                      <h4>{approval.title}</h4>
                      <p>
                        Diajukan oleh {approval.user}     {approval.amount || approval.days}
                      </p>
                    </div>
                    <div className="approval-actions">
                      {approval.type === "reimburse" ? (
                        <button className="btn-process" onClick={() => handleApprove(approval.id)}>
                          Proses
                        </button>
                      ) : (
                        <>
                          <button className="btn-approve" onClick={() => handleApprove(approval.id)}>
                            <span className="material-icons">check</span>
                          </button>
                          <button className="btn-reject" onClick={() => handleReject(approval.id)}>
                            <span className="material-icons">close</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      </div>

      {selectedReimburseApproval && (
        <div className="modal-overlay" onClick={closeReimburseApprovalModal}>
          <div className="approval-modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-top">
              <div>
                <h3>Persetujuan Reimburse</h3>
                <p>{selectedReimburseApproval.title}</p>
              </div>
              <button className="text-btn" onClick={closeReimburseApprovalModal}>
                Tutup
              </button>
            </div>
            <div className="modal-detail-list">
              <div>
                <span>Pengaju</span>
                <strong>{resolveUserName(selectedReimburseApproval.userId)}</strong>
              </div>
              <div>
                <span>Nominal</span>
                <strong>{formatCurrency(selectedReimburseApproval.amount || 0)}</strong>
              </div>
              <div>
                <span>Tanggal</span>
                <strong>{formatDate(selectedReimburseApproval.createdAt)}</strong>
              </div>
              <div>
                <span>Status</span>
                <strong>Tunggakan</strong>
              </div>
              <div>
                <span>Deskripsi</span>
                <strong>{selectedReimburseApproval.description || "-"}</strong>
              </div>
              {selectedReimburseApproval.fileUrl ? (
                <div className="proof-block">
                  <span>Bukti Pengajuan User</span>
                  {isPdfAttachment(selectedReimburseApproval.fileName, selectedReimburseApproval.fileUrl) ? (
                    <a href={selectedReimburseApproval.fileUrl} target="_blank" rel="noreferrer">
                      Buka bukti
                    </a>
                  ) : (
                    <div className="proof-preview">
                      <img
                        src={selectedReimburseApproval.fileUrl}
                        alt={selectedReimburseApproval.fileName || "Bukti reimburse"}
                      />
                      <a href={selectedReimburseApproval.fileUrl} target="_blank" rel="noreferrer">
                        Buka gambar penuh
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                <div className="no-proof">Tidak ada file lampiran</div>
              )}
            </div>

            <div className="modal-action-section">
              <div className="upload-proof-box">
                <label>Upload Bukti Transfer (Wajib)</label>
                <div className="file-input-wrapper">
                  <input type="file" onChange={handleTransferProofUpload} accept="image/*,application/pdf" />
                  {uploadingTransferProof && <p>Mengunggah...</p>}
                  {transferProofFileId && <p className="success">    Berhasil diunggah</p>}
                </div>
              </div>

              <div className="modal-footer">
                <button className="btn-cancel" onClick={closeReimburseApprovalModal}>
                  Batal
                </button>
                <button
                  className="btn-confirm"
                  disabled={!transferProofFileId || approveReimburseMutation.isPending}
                  onClick={() =>
                    approveReimburseMutation.mutate({
                      id: selectedReimburseApproval.id,
                      fileId: transferProofFileId!,
                    })
                  }
                >
                  {approveReimburseMutation.isPending ? "Memproses..." : "Konfirmasi Lunas"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .dashboard-container {
          padding: 32px;
          flex: 1;
          margin: -32px;
          background: #f8fafc;
        }

        .welcome-section {
          margin-bottom: 32px;
        }

        .welcome-section h1 {
          font-size: 24px;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 4px;
        }

        .welcome-section p {
          color: #64748b;
          font-size: 13px;
          font-weight: 400;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 32px;
        }

        @media (max-width: 1200px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 640px) {
          .stats-grid {
            grid-template-columns: 1fr;
          }
        }

        .stat-card {
          background: #ffffff;
          padding: 20px;
          border-radius: 12px;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02);
          cursor: pointer;
          border: 1px solid #f1f5f9;
          position: relative;
          overflow: hidden;
        }

        .stat-card::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: transparent;
          transition: background 0.3s ease;
        }

        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.04);
          border-color: #e2e8f0;
        }

        .stat-card .card-top {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }

        .stat-icon {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .stat-icon .material-icons {
          font-size: 18px;
        }

        .stat-icon.attendance {
          background: #dcfce7;
          color: #16a34a;
        }
        .stat-icon.leave {
          background: #e0e7ff;
          color: #4f46e5;
        }
        .stat-icon.tasks {
          background: #fef3c7;
          color: #d97706;
        }
        .stat-icon.reimburse {
          background: #fce7f3;
          color: #db2777;
        }

        .stat-card:nth-child(1):hover::before {
          background: #16a34a;
        }
        .stat-card:nth-child(2):hover::before {
          background: #4f46e5;
        }
        .stat-card:nth-child(3):hover::before {
          background: #d97706;
        }
        .stat-card:nth-child(4):hover::before {
          background: #db2777;
        }

        .stat-info {
          display: flex;
          flex-direction: column;
          flex: 1;
        }

        .stat-info .label {
          font-size: 12px;
          color: #64748b;
          font-weight: 600;
          letter-spacing: 0.2px;
          text-transform: uppercase;
        }

        .stat-trend {
          font-size: 11px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 4px 8px;
          border-radius: 20px;
        }

        .stat-trend.positive {
          background: #f0fdf4;
          color: #16a34a;
        }

        .stat-value {
          font-size: 28px;
          font-weight: 700;
          color: #0f172a;
          line-height: 1;
        }

        .stat-value .unit {
          font-size: 14px;
          color: #94a3b8;
          font-weight: 500;
        }

        .stat-subtitle {
          margin-top: 8px;
          font-size: 12px;
          color: #64748b;
        }

        .stat-subtitle.overdue {
          color: #ef4444;
          font-weight: 500;
        }

        .dashboard-grid {
          display: grid;
          grid-template-columns: 3fr 2fr;
          gap: 24px;
          align-items: stretch;
        }

        @media (max-width: 1024px) {
          .dashboard-grid {
            grid-template-columns: 1fr;
          }
        }

        /*           ANALYTICS MINI-CARDS                                */
        .analytics-strip {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 32px;
        }

        @media (max-width: 1200px) {
          .analytics-strip {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 640px) {
          .analytics-strip {
            grid-template-columns: 1fr;
          }
        }

        .mini-card {
          background: white;
          border-radius: 12px;
          padding: 20px;
          border: 1px solid #f1f5f9;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .mini-card .mini-icon {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .mini-icon .material-icons {
          font-size: 18px;
        }

        .mini-icon.kehadiran {
          background: #dcfce7;
          color: #16a34a;
        }
        .mini-icon.tugas {
          background: #e0e7ff;
          color: #4f46e5;
        }
        .mini-icon.izin {
          background: #fef3c7;
          color: #d97706;
        }
        .mini-icon.reimburse-stat {
          background: #fce7f3;
          color: #db2777;
        }

        .mini-body {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
        }

        .mini-label {
          font-size: 11px;
          color: #64748b;
          font-weight: 500;
          flex: 1;
          min-width: 0;
        }

        .mini-value {
          font-size: 16px;
          font-weight: 700;
          color: #0f172a;
          white-space: nowrap;
          flex-shrink: 0;
          margin-left: 8px;
        }

        .mini-bar {
          width: 100%;
          height: 6px;
          background: #f1f5f9;
          border-radius: 3px;
          overflow: hidden;
        }

        .mini-bar .bar-fill {
          height: 100%;
          border-radius: 3px;
          transition: width 0.6s ease;
        }

        .mini-bar.good .bar-fill {
          background: #16a34a;
        }

        .mini-bar.warn .bar-fill {
          background: #f59e0b;
        }

        .card {
          background: #ffffff;
          border-radius: 12px;
          border: 1px solid #f1f5f9;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02);
        }

        .card-header {
          padding: 20px;
          border-bottom: 1px solid #f1f5f9;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .card-header h3 {
          font-size: 16px;
          font-weight: 700;
          color: #1e293b;
        }

        .text-link {
          font-size: 13px;
          color: #4f46e5;
          font-weight: 600;
          text-decoration: none;
        }

        .feed-list {
          padding: 12px;
        }

        .approval-list {
          padding: 12px;
        }

        .pending-approvals {
          display: flex;
          flex-direction: column;
          height: 80%;
          min-height: 0;
        }

        .pending-approvals .approval-list {
          flex: 1;
          min-height: 0;
          overflow-y: auto;
        }

        .pending-approvals .approval-list::-webkit-scrollbar {
          width: 6px;
        }

        .pending-approvals .approval-list::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 999px;
        }

        .feed-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          border-radius: 8px;
          transition: background 0.2s ease;
        }

        .feed-item:hover {
          background: #f8fafc;
        }

        .avatar {
          width: 40px;
          height: 40px;
          background: #f1f5f9;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          color: #64748b;
          font-size: 13px;
        }

        .feed-content {
          flex: 1;
        }

        .feed-content p {
          font-size: 13px;
          color: #334155;
          margin: 0;
        }

        .feed-content span.time {
          font-size: 11px;
          color: #94a3b8;
        }

        .status {
          font-size: 11px;
          padding: 4px 8px;
          border-radius: 4px;
          font-weight: 600;
        }

        .status.on-time {
          background: #f0fdf4;
          color: #16a34a;
        }
        .status.late {
          background: #fff1f2;
          color: #e11d48;
        }

        .activity-icon-box {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .activity-icon-box .material-icons {
          font-size: 18px;
        }

        .activity-main-text {
          font-size: 13px !important;
          color: #1e293b !important;
          font-weight: 700 !important;
          margin: 0 0 2px 0 !important;
          line-height: 1.4;
        }

        .activity-meta {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .user-label {
          font-size: 11px;
          color: #64748b;
          font-weight: 500;
        }

        .dot-divider {
          font-size: 10px;
          color: #cbd5e1;
        }

        .time {
          font-size: 11px;
          color: #94a3b8;
        }

        .feed-item.activity {
          padding: 12px;
          border-bottom: 1px solid #f8fafc;
          border-radius: 0;
        }

        .feed-item.activity:last-child {
          border-bottom: none;
        }

        .approval-item {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px;
          border-bottom: 1px solid #f8fafc;
        }

        .approval-item:last-child {
          border-bottom: none;
        }

        .approval-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .approval-icon.reimburse {
          background: #fdf2f8;
          color: #db2777;
        }
        .approval-icon.leave {
          background: #eff6ff;
          color: #2563eb;
        }

        .approval-content {
          flex: 1;
        }

        .approval-content h4 {
          font-size: 14px;
          font-weight: 600;
          color: #1e293b;
          margin: 0;
        }

        .approval-content p {
          font-size: 12px;
          color: #64748b;
          margin: 4px 0 0;
        }

        .approval-actions {
          display: flex;
          gap: 8px;
        }

        .btn-process {
          padding: 6px 12px;
          background: #4f46e5;
          color: white;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          border: none;
          cursor: pointer;
          transition: background 0.2s;
        }

        .btn-process:hover {
          background: #4338ca;
        }

        .btn-approve,
        .btn-reject {
          width: 32px;
          height: 32px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-approve {
          background: #dcfce7;
          color: #15803d;
        }
        .btn-reject {
          background: #fee2e2;
          color: #b91c1c;
        }

        .btn-approve:hover {
          background: #bbf7d0;
        }
        .btn-reject:hover {
          background: #fecaca;
        }

        .empty-approval {
          padding: 40px 20px;
          text-align: center;
          color: #94a3b8;
        }

        .empty-approval .material-icons {
          font-size: 32px;
          color: #d1d5db;
          margin-bottom: 12px;
        }

        .empty-approval p {
          font-size: 13px;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: fadeIn 0.2s ease-out;
        }

        .approval-modal {
          background: white;
          width: 100%;
          max-width: 500px;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
          animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .modal-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 24px;
        }

        .modal-top h3 {
          font-size: 18px;
          font-weight: 700;
        }

        .modal-top p {
          font-size: 13px;
          color: #64748b;
        }

        .text-btn {
          border: none;
          background: none;
          color: #4f46e5;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
        }

        .modal-detail-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 24px;
          background: #f8fafc;
          padding: 16px;
          border-radius: 12px;
        }

        .modal-detail-list div {
          display: flex;
          justify-content: space-between;
          font-size: 14px;
        }

        .modal-detail-list span {
          color: #64748b;
        }

        .modal-detail-list strong {
          color: #1e293b;
        }

        .proof-block {
          flex-direction: column !important;
          gap: 8px;
        }

        .proof-preview img {
          width: 100%;
          max-height: 200px;
          object-fit: contain;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          margin-bottom: 8px;
        }

        .upload-proof-box {
          margin-bottom: 24px;
        }

        .upload-proof-box label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 8px;
        }

        .file-input-wrapper {
          border: 2px dashed #e2e8f0;
          padding: 16px;
          border-radius: 12px;
          text-align: center;
        }

        .file-input-wrapper input {
          width: 100%;
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
        }

        .btn-cancel {
          padding: 10px 20px;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          background: white;
          font-weight: 600;
          cursor: pointer;
        }

        .btn-confirm {
          padding: 10px 24px;
          border-radius: 8px;
          border: none;
          background: #4f46e5;
          color: white;
          font-weight: 600;
          cursor: pointer;
        }

        .btn-confirm:disabled {
          background: #94a3b8;
          cursor: not-allowed;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes slideUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        /* Pagination Styles */
        .pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 8px;
          padding: 16px;
          border-top: 1px solid #f1f5f9;
        }

        .page-btn {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          background: white;
          color: #64748b;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .page-btn:hover:not(:disabled) {
          border-color: #4f46e5;
          color: #4f46e5;
          background: #f5f3ff;
        }

        .page-btn.active {
          background: #4f46e5;
          color: white;
          border-color: #4f46e5;
        }

        .page-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          background: #f8fafc;
        }

        .page-btn .material-icons {
          font-size: 18px;
        }
      `}</style>
    </div>
  );
}
