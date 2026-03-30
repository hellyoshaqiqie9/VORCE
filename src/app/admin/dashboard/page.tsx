"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getAccessToken, getUserData } from "@/lib/auth";
import { fetchAbsensiData } from "@/services/absensiService";
import { uploadFile } from "@/services/berkasService";
import { getLeaveList, approveLeave, rejectLeave } from "@/services/izinService";
import { approveReimburse, fetchReimburseDetail, fetchReimburseList } from "@/services/reimburseService";
import { getAllUsers } from "@/services/usersService";

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
  const resolveUserName = (identifier?: string, fallback?: string) => {
    if (!identifier) return fallback || "Unknown";
    const match = users.find((user) => user.userId === identifier || user.email === identifier);
    return match?.name || fallback || identifier || "Unknown";
  };

  // ─── Fetch users directory (cached) ────────────
  const { data: users = [] } = useQuery({
    queryKey: ["users-directory"],
    queryFn: () => getAllUsers(),
    staleTime: 10 * 60 * 1000,
  });

  // ─── Fetch today's attendance ──────────────────
  const todayStr = new Date().toISOString().split("T")[0];
  const { data: attendanceData = [], isLoading: loadingAttendance } = useQuery({
    queryKey: ["dashboard-attendance", todayStr],
    queryFn: () => fetchAbsensiData(todayStr, todayStr),
    staleTime: 5 * 60 * 1000,
  });

  // ─── Fetch leave/izin list ─────────────────────
  const { data: leaveData = [], isLoading: loadingLeave } = useQuery({
    queryKey: ["dashboard-izin"],
    queryFn: () => getLeaveList(),
    staleTime: 5 * 60 * 1000,
  });

  // ─── Fetch tasks ───────────────────────────────
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

  // ─── Fetch reimburse ───────────────────────────
  const { data: reimburseData = [], isLoading: loadingReimburse } = useQuery({
    queryKey: ["dashboard-reimburse"],
    queryFn: () => fetchReimburseList(),
    staleTime: 5 * 60 * 1000,
  });

  // ─── Computed stats ────────────────────────────
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

  // ─── Build approvals from izin + reimburse ─────
  const [localApprovalStatus, setLocalApprovalStatus] = useState<Record<string, string>>({});
  const [selectedReimburseId, setSelectedReimburseId] = useState<string | null>(null);
  const [transferProofFileId, setTransferProofFileId] = useState<string | null>(null);
  const [uploadingTransferProof, setUploadingTransferProof] = useState(false);
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

  // ─── Build attendance feed from today's data ───
  const attendanceFeed = attendanceData.slice(0, 5).map((item, idx) => {
    const name = item.displayName || item.email?.split("@")[0] || "Unknown";
    // Try to resolve from users directory
    const userMatch = users.find((u) => u.email === item.email);
    const resolvedName = userMatch?.name || name;
    const initials = resolvedName
      .split(" ")
      .map((w: string) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
    
    const time = item.waktuMasuk
      ? new Date(item.waktuMasuk).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
      : "-";

    let statusLabel = "Tepat Waktu";
    let statusClass = "on-time";
    if (item.waktuMasuk) {
      const h = new Date(item.waktuMasuk).getHours();
      const m = new Date(item.waktuMasuk).getMinutes();
      if (h > 9 || (h === 9 && m > 0)) {
        statusLabel = "Terlambat";
        statusClass = "late";
      }
    }

    return { id: item.id || `feed-${idx}`, name: resolvedName, initials, time, location: item.lokasiMasuk || "-", statusLabel, statusClass, type: item.waktuPulang ? "pulang" : "masuk" };
  });

  return (
    <div className="dashboard-container">
      {/* Welcome Section */}
      <div className="welcome-section">
        <h1>Selamat Pagi, {companyName}! 👋</h1>
        <p>Ini yang terjadi dengan tim Anda hari ini.</p>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card" onClick={() => router.push("/admin/attendance")}>
          <div className="card-top">
            <div className="stat-icon attendance">
              <span className="material-icons">people</span>
            </div>
            <span className="stat-info"><span className="label">Hadir Hari Ini</span></span>
            <div className="stat-trend positive">
              <span className="material-icons" style={{fontSize: '14px'}}>trending_up</span>
              <span>{hadirPercent}%</span>
            </div>
          </div>
          <div className="stat-value">{loadingAttendance ? "..." : hadirCount}<span>/{totalUsers}</span></div>
        </div>

        <div className="stat-card" onClick={() => router.push("/admin/izin")}>
          <div className="card-top">
            <div className="stat-icon leave">
              <span className="material-icons">event_busy</span>
            </div>
            <span className="stat-info"><span className="label">Sedang Cuti</span></span>
            <div className="stat-trend neutral">
              <span>Terjadwal</span>
            </div>
          </div>
          <div className="stat-value">{loadingLeave ? "..." : activeCuti}</div>
        </div>

        <div className="stat-card" onClick={() => router.push("/admin/tasks")}>
          <div className="card-top">
            <div className="stat-icon tasks">
              <span className="material-icons">assignment</span>
            </div>
            <span className="stat-info"><span className="label">Tugas Pending</span></span>
            <div className="stat-trend negative">
              <span>{overdueTasks} Terlambat</span>
            </div>
          </div>
          <div className="stat-value">{loadingTasks ? "..." : pendingTasks}</div>
        </div>

        <div className="stat-card" onClick={() => router.push("/admin/reimburse")}>
          <div className="card-top">
            <div className="stat-icon reimburse">
              <span className="material-icons">receipt_long</span>
            </div>
            <span className="stat-info"><span className="label">Reimburse</span></span>
            <div className="stat-trend neutral">
              <span>Tunggakan</span>
            </div>
          </div>
          <div className="stat-value">{loadingReimburse ? "..." : formattedReimburse}</div>
        </div>
      </div>



      <div className="dashboard-grid">
        {/* Attendance Feed - LIVE */}
        <div className="card attendance-feed">
          <div className="card-header">
            <h3>Feed Kehadiran</h3>
            <button className="text-btn" onClick={() => router.push("/admin/attendance")}>Lihat Semua</button>
          </div>
          <div className="feed-list">
            {loadingAttendance ? (
              <div className="empty-approval"><p>Memuat data kehadiran...</p></div>
            ) : attendanceFeed.length === 0 ? (
              <div className="empty-approval">
                <span className="material-icons">event_available</span>
                <p>Belum ada data kehadiran hari ini</p>
              </div>
            ) : (
              attendanceFeed.map((item) => (
                <div key={item.id} className="feed-item">
                  <div className="avatar">{item.initials}</div>
                  <div className="feed-content">
                    <p><strong>{item.name}</strong> {item.type}</p>
                    <span className="time">{item.time} • {item.location}</span>
                  </div>
                  <span className={`status ${item.statusClass}`}>{item.statusLabel}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Pending Approvals - LIVE */}
        <div className="card pending-approvals">
          <div className="card-header">
            <h3>Perlu Persetujuan</h3>
          </div>
          <div className="approval-list">
            {approvals.filter(a => a.status === "pending").length === 0 ? (
              <div className="empty-approval">
                <span className="material-icons">check_circle</span>
                <p>Semua approval sudah selesai!</p>
              </div>
            ) : (
              approvals.filter(a => a.status === "pending").map((approval) => (
                <div key={approval.id} className="approval-item">
                  <div className={`approval-icon ${approval.type}`}>
                    <span className="material-icons">
                      {approval.type === "reimburse" ? "receipt" : "flight_takeoff"}
                    </span>
                  </div>
                  <div className="approval-content">
                    <h4>{approval.title}</h4>
                    <p>Diajukan oleh {approval.user} • {approval.amount || approval.days}</p>
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
              <button className="text-btn" onClick={closeReimburseApprovalModal}>Tutup</button>
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
                    <a href={selectedReimburseApproval.fileUrl} target="_blank" rel="noreferrer">Buka bukti</a>
                  ) : (
                    <div className="proof-preview">
                      <img
                        src={selectedReimburseApproval.fileUrl}
                        alt={selectedReimburseApproval.fileName || "Bukti reimburse"}
                      />
                      <a href={selectedReimburseApproval.fileUrl} target="_blank" rel="noreferrer">Buka gambar penuh</a>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <span>Bukti Pengajuan User</span>
                  <strong>Tidak ada foto dari user pada data reimburse.</strong>
                </div>
              )}
            </div>
            <div className="transfer-proof-panel">
              <label>Upload Bukti Transfer *</label>
              <input type="file" accept="image/*" onChange={handleTransferProofUpload} />
              <small>File wajib berupa foto untuk mengubah status menjadi lunas.</small>
              {uploadingTransferProof && <small>Sedang upload bukti transfer...</small>}
              {transferProofFileId && <small>Bukti transfer berhasil diupload.</small>}
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => router.push("/admin/reimburse")}>
                Buka Halaman Reimburse
              </button>
              <button
                className="btn-primary"
                onClick={() =>
                  approveReimburseMutation.mutate({
                    id: selectedReimburseApproval.id,
                    fileId: transferProofFileId || undefined,
                  })
                }
                disabled={approveReimburseMutation.isPending || uploadingTransferProof || !transferProofFileId}
              >
                Tandai Lunas
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Activity Log - from company logs */}
      <div className="activity-section">
        <div className="card">
          <div className="card-header">
            <h3>Log Aktivitas</h3>
            <button className="text-btn" onClick={() => router.push("/admin/company")}>Lihat Semua</button>
          </div>
          <div className="activity-list">
            {attendanceData.slice(0, 8).map((item, idx) => {
              const uMatch = users.find(u => u.email === item.email);
              const uName = uMatch?.name || item.displayName || item.email?.split("@")[0] || "Unknown";
              const time = item.waktuMasuk
                ? new Date(item.waktuMasuk).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
                : "-";
              return (
                <div key={item.id || `act-${idx}`} className="activity-item">
                  <div className="activity-icon join">
                    <span className="material-icons">login</span>
                  </div>
                  <div className="activity-content">
                    <p><strong>{uName}</strong> check-in</p>
                  </div>
                  <span className="activity-time">{time}</span>
                  <span className="material-icons activity-arrow">chevron_right</span>
                </div>
              );
            })}
            {attendanceData.length === 0 && !loadingAttendance && (
              <div className="empty-approval"><p>Belum ada aktivitas hari ini</p></div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`

        .dashboard-container {
          max-width: 100%;
          margin: 0 auto;
          font-family: 'Inter', 'Montserrat', sans-serif;
          padding: 10px 0 40px;
          overflow-x: hidden;
        }

        .welcome-section {
          margin-bottom: 32px;
          padding: 20px 24px;
          background: linear-gradient(135deg, #ffffff 0%, #f9fafb 100%);
          border-radius: 12px;
          box-shadow: 0 2px 10px rgba(15, 23, 42, 0.02);
          border: 1px solid rgba(241, 245, 249, 1);
        }

        .welcome-section h1 {
          font-size: 20px;
          font-weight: 600;
          color: #0f172a;
          margin-bottom: 4px;
          letter-spacing: -0.2px;
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
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
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

        .stat-icon.attendance { background: #dcfce7; color: #16a34a; }
        .stat-icon.leave { background: #e0e7ff; color: #4f46e5; }
        .stat-icon.tasks { background: #fef3c7; color: #d97706; }
        .stat-icon.reimburse { background: #fce7f3; color: #db2777; }

        .stat-card:nth-child(1):hover::before { background: #16a34a; }
        .stat-card:nth-child(2):hover::before { background: #4f46e5; }
        .stat-card:nth-child(3):hover::before { background: #d97706; }
        .stat-card:nth-child(4):hover::before { background: #db2777; }

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
          border-radius: 12px;
        }

        .stat-trend.positive { background: #f0fdf4; color: #15803d; }
        .stat-trend.neutral { background: #f1f5f9; color: #475569; }
        .stat-trend.negative { background: #fff1f2; color: #be123c; }

        .stat-value {
          font-size: 24px;
          font-weight: 700;
          color: #0f172a;
          letter-spacing: -0.5px;
        }

        .stat-value span {
          font-size: 13px;
          color: #94a3b8;
          font-weight: 500;
          margin-left: 4px;
        }

        .dashboard-grid {
          display: grid;
          grid-template-columns: 2fr 1.2fr;
          gap: 24px;
        }

        @media (max-width: 1024px) {
          .dashboard-grid {
            grid-template-columns: 1fr;
          }
        }

        .card {
          background: #ffffff;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02);
          overflow: hidden;
          border: 1px solid rgba(226, 232, 240, 0.6);
        }

        .card-header {
          padding: 16px 20px;
          border-bottom: 1px solid rgba(241, 245, 249, 0.8);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .card-header h3 {
          font-size: 14px;
          font-weight: 600;
          color: #0f172a;
          margin: 0;
        }

        .text-btn {
          background: none;
          border: none;
          color: #2563eb;
          font-weight: 600;
          font-size: 12px;
          cursor: pointer;
          transition: color 0.2s;
        }
        
        .text-btn:hover {
          color: #1d4ed8;
          text-decoration: underline;
        }

        .feed-list {
          padding: 8px 20px 20px;
        }

        .feed-item {
          padding: 12px;
          border-radius: 8px;
          background: #fafafb;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          gap: 12px;
          transition: all 0.2s;
          border: 1px solid transparent;
        }

        .feed-item:hover {
          background: #ffffff;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
          border-color: #f1f5f9;
        }

        .feed-item .avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%);
          color: #4f46e5;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 13px;
        }

        .feed-content {
            display: flex;
            flex-direction: column;
        }

        .feed-content p {
          margin: 0 0 2px 0;
          font-size: 13px;
          color: #334155;
          font-weight: 500;
        }

        .feed-content p strong {
          color: #0f172a;
          font-weight: 600;
        }

        .feed-content .time {
          font-size: 12px;
          color: #64748b;
          font-weight: 400;
        }

        .status {
          font-size: 11px;
          font-weight: 600;
          padding: 4px 8px;
          border-radius: 12px;
        }

        .status.on-time { background: #f0fdf4; color: #15803d; }
        .status.late { background: #fff1f2; color: #be123c; }

        .approval-list {
          padding: 8px 20px 20px;
        }

        .approval-item {
          padding: 14px;
          border: 1px solid #f1f5f9;
          border-radius: 12px;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 12px;
          transition: all 0.2s;
        }

        .approval-item:hover {
          border-color: #e2e8f0;
          box-shadow: 0 2px 8px rgba(0,0,0,0.02);
        }

        .approval-icon {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .approval-icon .material-icons {
          font-size: 18px;
        }

        .approval-icon.reimburse { background: #fdf4ff; color: #c026d3; }
        .approval-icon.leave { background: #eff6ff; color: #3b82f6; }

        .approval-content {
          flex: 1;
        }

        .approval-content h4 {
          margin: 0 0 2px 0;
          font-size: 13px;
          font-weight: 600;
          color: #0f172a;
        }

        .approval-content p {
          margin: 0;
          font-size: 12px;
          color: #64748b;
          font-weight: 400;
        }

        .approval-actions {
          display: flex;
          gap: 8px;
        }

        .btn-process, .btn-approve {
          background: #4f46e5;
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s;
        }

        .btn-process:hover { background: #4338ca; }

        .btn-approve { background: #16a34a; }
        .btn-approve:hover { background: #15803d; }

        .btn-reject {
          background: transparent;
          color: #ef4444;
          border: 1px solid #fee2e2;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-reject:hover {
          background: #fef2f2;
          border-color: #fecaca;
        }

        .empty-approval {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 24px 16px;
          text-align: center;
          color: #64748b;
        }

        .empty-approval .material-icons {
          font-size: 32px;
          color: #cbd5e1;
          margin-bottom: 8px;
        }

        .empty-approval p {
          margin: 0;
          font-size: 13px;
          font-weight: 400;
        }

        .activity-section {
          margin-top: 24px;
        }

        .activity-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 12px;
          padding: 16px 20px 20px;
        }

        .activity-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          border: 1px solid #f1f5f9;
          border-radius: 12px;
          transition: all 0.2s;
        }
        
        .activity-item:hover {
          border-color: #e2e8f0;
          box-shadow: 0 2px 8px rgba(0,0,0,0.02);
        }

        .activity-icon {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .activity-icon .material-icons { font-size: 16px; }

        .activity-icon.join { background: #f0fdf4; color: #16a34a; }

        .activity-content { flex: 1; display: flex; flex-direction: column; }
        .activity-content p { margin: 0; font-size: 13px; color: #334155; }
        .activity-time { font-size: 11px; color: #64748b; font-weight: 400; margin-right: 8px; }
        .activity-arrow { color: #cbd5e1; font-size: 18px; }

`}</style>
    </div>
  );
}
