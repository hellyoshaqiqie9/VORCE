"use client";

import { Toast } from "@/components/Toast";
import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { sendMessage, getGroups } from "@/services/chatService";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import ArchiveModal from "@/components/Admin/ArchiveModal";
import {
  getLeaveList, approveLeave, rejectLeave, updateLeave, deleteLeave,
  LeaveRequest,
} from "@/services/izinService";

export default function IzinPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { data: requestsRaw, isLoading: isQueryLoading, error } = useQuery({
    queryKey: ["izin-list"],
    queryFn: getLeaveList,
  });
  
  const requests = requestsRaw || [];
  const isLoading = isQueryLoading;

  const [activeTab, setActiveTab] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Toast
  const [toast, setToast] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);
  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  // Edit form state
  const [editForm, setEditForm] = useState({
    tipeIzin: "",
    startDate: "",
    endDate: "",
    keterangan: "",
  });

  // ─── FETCH DATA (Handled by useQuery) ─────────

  // Normalize status to English key for filtering
  const normalizeStatus = (status: string): string => {
    const s = (status || "").toLowerCase().trim();
    if (s === "approved" || s === "disetujui" || s === "diterima") return "approved";
    if (s === "rejected" || s === "ditolak") return "rejected";
    if (s === "pending" || s === "menunggu" || s === "diajukan") return "pending";
    return s;
  };

  // ─── FILTER ────────────────────────────────
  const filteredRequests = requests.filter((req) => {
    const norm = normalizeStatus(req.status);
    const matchesTab = activeTab === "all" || norm === activeTab;
    const matchesSearch = (req.displayName || req.email || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const stats = {
    total: requests.length,
    pending: requests.filter((r) => normalizeStatus(r.status) === "pending").length,
    approved: requests.filter((r) => normalizeStatus(r.status) === "approved").length,
    rejected: requests.filter((r) => normalizeStatus(r.status) === "rejected").length,
  };

  // ─── ACTIONS ───────────────────────────────

  const handleApprove = async (leaveId: string) => {
    try {
      setActionLoading(`approve-${leaveId}`);
      await approveLeave(leaveId);
      setToast({ type: "success", message: "Izin berhasil disetujui" });
      queryClient.invalidateQueries({ queryKey: ["izin-list"] });
      if (selectedRequest?.leaveId === leaveId) {
        setSelectedRequest({ ...selectedRequest, status: "approved" });
      }
    } catch (err: any) {
      showToast("error", err.message || "Gagal menyetujui izin");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (leaveId: string) => {
    try {
      setActionLoading(`reject-${leaveId}`);
      await rejectLeave(leaveId);
      setToast({ type: "success", message: "Izin berhasil ditolak" });
      queryClient.invalidateQueries({ queryKey: ["izin-list"] });
      if (selectedRequest?.leaveId === leaveId) {
        setSelectedRequest({ ...selectedRequest, status: "rejected" });
      }
    } catch (err: any) {
      showToast("error", err.message || "Gagal menolak izin");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!selectedRequest) return;
    try {
      setActionLoading("delete");
      await deleteLeave(selectedRequest.leaveId);
      setToast({ type: "success", message: "Izin berhasil dihapus" });
      setShowDeleteConfirm(false);
      setSelectedRequest(null);
      queryClient.invalidateQueries({ queryKey: ["izin-list"] });
    } catch (err: any) {
      showToast("error", err.message || "Gagal menghapus izin");
    } finally {
      setActionLoading(null);
    }
  };

  const openEditModal = (req: LeaveRequest) => {
    setEditForm({
      tipeIzin: req.jenisIzin,
      startDate: req.tanggalMulai ? req.tanggalMulai.split("T")[0] : "",
      endDate: req.tanggalSelesai ? req.tanggalSelesai.split("T")[0] : "",
      keterangan: req.alasan,
    });
    setSelectedRequest(req);
    setShowEditModal(true);
  };

  const handleEditSave = async () => {
    if (!selectedRequest) return;
    try {
      setActionLoading("edit");
      await updateLeave(selectedRequest.leaveId, {
        tipeIzin: editForm.tipeIzin,
        startDate: editForm.startDate,
        endDate: editForm.endDate,
        keterangan: editForm.keterangan,
      });
      setToast({ type: "success", message: "Izin berhasil diperbarui" });
      setShowEditModal(false);
      queryClient.invalidateQueries({ queryKey: ["izin-list"] });
    } catch (err: any) {
      showToast("error", err.message || "Gagal memperbarui izin");
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    const options: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" };
    return new Date(dateString).toLocaleDateString("id-ID", options);
  };

  const getStatusLabel = (status: string) => {
    const s = normalizeStatus(status);
    if (s === "pending") return "Menunggu";
    if (s === "approved") return "Disetujui";
    if (s === "rejected") return "Ditolak";
    return status;
  };

  const getInitials = (name: string) => {
    if (!name) return "?";
    return name.split(" ").map(w => w[0]).join("").substring(0, 2).toUpperCase();
  };


  const handleShareToMessage = async (request: LeaveRequest) => {
    try {
      const groups = await getGroups();
      const companyId = groups[0]?.id;
      if (!companyId) throw new Error("ID Perusahaan tidak ditemukan.");

      const shareText = `🗓️ *MEMBAGIKAN IZIN*\n\n*Nama:* ${request.displayName || 'Karyawan'}\n*Jenis:* ${request.jenisIzin}\n*Mulai:* ${formatDate(request.tanggalMulai)}\n*Selesai:* ${formatDate(request.tanggalSelesai)}\n*Status:* ${getStatusLabel(request.status)}\n\n_Lihat detail izin di Dashboard Admin._`;

      await sendMessage(companyId, shareText, "custom", {
        subtype: "leave",
        leaveId: request.leaveId,
      });
      setToast({ type: "success", message: "Izin berhasil dibagikan ke pesan." });
      router.push("/admin/chat");
    } catch (error: any) {
      showToast("error", "Gagal membagikan izin: " + error.message);
    }
  };

  return (
    <div className="izin-container">
      {/* Toast */}
      {toast && (
        <div className={`izin-toast ${toast.type}`}>
          <span className="material-icons">{toast.type === "success" ? "check_circle" : "error"}</span>
          {toast.message}
        </div>
      )}

      {/* Header & Stats */}
      <div className="page-header">
        <div className="header-title">
          <h1>Permintaan Izin</h1>
          <p>Kelola cuti, sakit, dan izin karyawan</p>
        </div>
        <div className="header-actions">
          <button className="archive-btn" onClick={() => setShowArchiveModal(true)}>
            <span className="material-icons">inventory_2</span>
            Arsip
          </button>
          <button className="primary-btn" onClick={() => queryClient.invalidateQueries({ queryKey: ["izin-list"] })}>
            <span className="material-icons">refresh</span>
            Refresh
          </button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue"><span className="material-icons">assignment</span></div>
          <div className="stat-info">
            <h3>Total</h3>
            <span>{stats.total} Pengajuan</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange"><span className="material-icons">pending</span></div>
          <div className="stat-info">
            <h3>Menunggu</h3>
            <span>{stats.pending} Pending</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><span className="material-icons">check_circle</span></div>
          <div className="stat-info">
            <h3>Disetujui</h3>
            <span>{stats.approved} Diterima</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red"><span className="material-icons">cancel</span></div>
          <div className="stat-info">
            <h3>Ditolak</h3>
            <span>{stats.rejected} Ditolak</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="content-grid">
        {/* Left Column: List */}
        <div className="list-column">
          <div className="list-header">
            <div className="tabs">
              <button className={`tab ${activeTab === "all" ? "active" : ""}`} onClick={() => setActiveTab("all")}>
                Semua
              </button>
              <button className={`tab ${activeTab === "pending" ? "active" : ""}`} onClick={() => setActiveTab("pending")}>
                Diajukan
              </button>
              <button className={`tab ${activeTab === "approved" ? "active" : ""}`} onClick={() => setActiveTab("approved")}>
                Diterima
              </button>
              <button className={`tab ${activeTab === "rejected" ? "active" : ""}`} onClick={() => setActiveTab("rejected")}>
                Ditolak
              </button>
            </div>
            <div className="search-box">
              <span className="material-icons">search</span>
              <input
                type="text"
                placeholder="Cari karyawan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="request-list">
            {isLoading ? (
              <div className="loading-list">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="skel-item">
                    <div className="skel-circle" />
                    <div className="skel-lines">
                      <div className="skel-line w70" />
                      <div className="skel-line w40" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="empty-state">
                <span className="material-icons">inbox</span>
                <p>Tidak ada data</p>
              </div>
            ) : (
              filteredRequests.map((req) => (
                <div
                  key={req.leaveId}
                  className={`request-item ${selectedRequest?.leaveId === req.leaveId ? "active" : ""}`}
                  onClick={() => setSelectedRequest(req)}
                >
                  <div className="item-avatar-circle" style={{ background: `hsl(${(req.displayName || "").charCodeAt(0) * 7 % 360}, 60%, 65%)` }}>
                    {getInitials(req.displayName)}
                  </div>
                  <div className="item-info">
                    <h4>{req.displayName || req.email}</h4>
                    <span className="item-role">{req.email}</span>
                  </div>
                  <div className="item-meta">
                    <span className={`type-badge ${req.jenisIzin.toLowerCase()}`}>{req.jenisIzin}</span>
                    <span className={`status-dot ${normalizeStatus(req.status)}`}>{getStatusLabel(req.status)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Details */}
        <div className="detail-column">
          {selectedRequest ? (
            <div className="detail-card">
              <div className="detail-header">
                <div className="user-profile">
                  <div className="profile-avatar" style={{ background: `hsl(${(selectedRequest.displayName || "").charCodeAt(0) * 7 % 360}, 60%, 65%)` }}>
                    {getInitials(selectedRequest.displayName)}
                  </div>
                  <div>
                    <h2>{selectedRequest.displayName || selectedRequest.email}</h2>
                    <span>{selectedRequest.email}</span>
                  </div>
                </div>
                <div className={`status-badge ${normalizeStatus(selectedRequest.status)}`}>
                  {getStatusLabel(selectedRequest.status)}
                </div>
              </div>

              <div className="detail-body">
                <div className="info-list">
                  <div className="info-item">
                    <div className="info-label">
                      <span className="material-icons">badge</span>
                      <span>Jenis Izin</span>
                    </div>
                    <span className="info-value">{selectedRequest.jenisIzin}</span>
                  </div>
                  <div className="info-item">
                    <div className="info-label">
                      <span className="material-icons">event</span>
                      <span>Mulai</span>
                    </div>
                    <span className="info-value">{formatDate(selectedRequest.tanggalMulai)}</span>
                  </div>
                  <div className="info-item">
                    <div className="info-label">
                      <span className="material-icons">event_busy</span>
                      <span>Selesai</span>
                    </div>
                    <span className="info-value">{formatDate(selectedRequest.tanggalSelesai)}</span>
                  </div>
                  {selectedRequest.alasan && (
                    <div className="info-item reason-item">
                      <div className="info-label">
                        <span className="material-icons">notes</span>
                        <span>Alasan</span>
                      </div>
                      <p className="info-reason">{selectedRequest.alasan}</p>
                    </div>
                  )}
                  {selectedRequest.approvedBy && (
                    <div className="info-item">
                      <div className="info-label">
                        <span className="material-icons">verified_user</span>
                        <span>Disetujui Oleh</span>
                      </div>
                      <span className="info-value">{selectedRequest.approvedBy}</span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="action-section">
                  {normalizeStatus(selectedRequest.status) === "pending" && (
                    <div className="action-row">
                      <button
                        className="approve-btn"
                        onClick={() => handleApprove(selectedRequest.leaveId)}
                        disabled={actionLoading === `approve-${selectedRequest.leaveId}`}
                      >
                        <span className="material-icons">check</span>
                        {actionLoading === `approve-${selectedRequest.leaveId}` ? "Memproses..." : "Terima"}
                      </button>
                      <button
                        className="reject-btn"
                        onClick={() => handleReject(selectedRequest.leaveId)}
                        disabled={actionLoading === `reject-${selectedRequest.leaveId}`}
                      >
                        <span className="material-icons">close</span>
                        {actionLoading === `reject-${selectedRequest.leaveId}` ? "Memproses..." : "Tolak"}
                      </button>
                    </div>
                  )}
                  <div className="action-row">
                    <button className="share-btn" onClick={() => openEditModal(selectedRequest)}>
                      <span className="material-icons">edit</span>
                      Edit
                    </button>
                    <button className="delete-btn" onClick={() => setShowDeleteConfirm(true)}>
                      <span className="material-icons">delete</span>
                      Hapus
                    </button>
                    <button className="share-btn" onClick={() => handleShareToMessage(selectedRequest)}>
                      <span className="material-icons">send</span>
                      Bagikan ke pesan
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="empty-selection">
              <span className="material-icons">touch_app</span>
              <p>Pilih permintaan izin untuk melihat detail</p>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && selectedRequest && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Izin</h2>
              <button className="close-btn" onClick={() => setShowEditModal(false)}>
                <span className="material-icons">close</span>
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Jenis Izin</label>
                <select value={editForm.tipeIzin} onChange={(e) => setEditForm({ ...editForm, tipeIzin: e.target.value })}>
                  <option value="Cuti">Cuti</option>
                  <option value="Sakit">Sakit</option>
                  <option value="Izin">Izin</option>
                </select>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Mulai</label>
                  <input type="date" value={editForm.startDate} onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Selesai</label>
                  <input type="date" value={editForm.endDate} onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label>Alasan / Keterangan</label>
                <textarea
                  rows={3}
                  value={editForm.keterangan}
                  onChange={(e) => setEditForm({ ...editForm, keterangan: e.target.value })}
                  placeholder="Keterangan..."
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="secondary-btn" onClick={() => setShowEditModal(false)}>Batal</button>
              <button className="primary-btn" onClick={handleEditSave} disabled={actionLoading === "edit"}>
                {actionLoading === "edit" ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && selectedRequest && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal-card small-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Konfirmasi Hapus</h2>
              <button className="close-btn" onClick={() => setShowDeleteConfirm(false)}>
                <span className="material-icons">close</span>
              </button>
            </div>
            <div className="modal-body">
              <div className="confirm-content">
                <span className="material-icons confirm-icon">warning_amber</span>
                <p>Apakah Anda yakin ingin menghapus izin dari <strong>{selectedRequest.displayName}</strong>?</p>
                <span className="confirm-sub">Tindakan ini tidak dapat dibatalkan.</span>
              </div>
            </div>
            <div className="modal-footer">
              <button className="secondary-btn" onClick={() => setShowDeleteConfirm(false)}>Batal</button>
              <button className="delete-btn-modal" onClick={handleDelete} disabled={actionLoading === "delete"}>
                <span className="material-icons">delete</span>
                {actionLoading === "delete" ? "Menghapus..." : "Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ArchiveModal
        isOpen={showArchiveModal}
        onClose={() => setShowArchiveModal(false)}
        title="Arsip Izin"
        type="leave"
      />

      <style jsx>{`
        .header-actions {
          display: flex;
          gap: 12px;
        }

        .archive-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          background: #f3e8ff;
          color: #7c3aed;
          border: none;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          font-family: 'Montserrat', sans-serif;
          transition: background 0.2s;
        }

        .archive-btn:hover {
          background: #e9d5ff;
        }

        .izin-container {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        /* Toast */
        .izin-toast { position: fixed; top: 20px; right: 20px; display: flex; align-items: center; gap: 8px; padding: 12px 20px; border-radius: 10px; font-size: 14px; font-weight: 500; z-index: 1100; animation: toastSlideIn 0.3s ease; }
        .izin-toast.success { background: #dcfce7; color: #16a34a; }
        .izin-toast.error { background: #fee2e2; color: #dc2626; }
        @keyframes toastSlideIn { from { transform: translateY(-20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

        .stats-grid {
          flex-shrink: 0;
        }

        .content-grid {
          display: grid;
          grid-template-columns: 380px 1fr;
          gap: 24px;
          height: calc(100vh - 280px);
          min-height: 500px;
        }

        .list-column {
          background: white;
          border-radius: 16px;
          display: flex;
          flex-direction: column;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
          overflow: hidden;
        }

        .detail-column {
          background: white;
          border-radius: 16px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .detail-card {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-height: 0;
        }

        .detail-header {
          padding: 20px 24px;
          border-bottom: 1px solid #f1f5f9;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-shrink: 0;
        }

        .detail-body {
          flex: 1;
          padding: 20px 24px;
          overflow-y: auto;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-shrink: 0;
        }

        .header-title h1 {
          font-size: 24px;
          font-weight: 700;
          color: #1e293b;
          margin: 0 0 4px 0;
        }

        .header-title p {
          color: #64748b;
          font-size: 14px;
          margin: 0;
        }

        .primary-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          background: #7c3aed;
          color: white;
          border: none;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          font-family: 'Montserrat', sans-serif;
          transition: background 0.2s;
        }

        .primary-btn:hover {
          background: #6d28d9;
        }

        .primary-btn:disabled {
          background: #cbd5e1;
          cursor: not-allowed;
        }

        /* Stats Grid */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
        }

        .stat-card {
          background: white;
          padding: 20px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          gap: 16px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }

        .stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .stat-icon .material-icons {
          font-size: 24px;
          color: white;
        }

        .stat-icon.blue { background: #3b82f6; }
        .stat-icon.orange { background: #f59e0b; }
        .stat-icon.green { background: #22c55e; }
        .stat-icon.red { background: #ef4444; }

        .stat-info h3 {
          font-size: 13px;
          color: #64748b;
          margin: 0 0 4px 0;
          font-weight: 500;
        }

        .stat-info span {
          font-size: 16px;
          font-weight: 700;
          color: #1e293b;
        }

        /* List Column */
        .list-header {
          padding: 16px;
          border-bottom: 1px solid #f1f5f9;
        }

        .tabs {
          display: flex;
          background: #f1f5f9;
          padding: 4px;
          border-radius: 12px;
          margin-bottom: 16px;
        }

        .tab {
          flex: 1;
          padding: 8px;
          border: none;
          background: none;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          color: #64748b;
          cursor: pointer;
          transition: all 0.2s;
          font-family: 'Montserrat', sans-serif;
        }

        .tab.active {
          background: white;
          color: #7c3aed;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }

        .search-box {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          background: #f8fafc;
          border-radius: 10px;
          border: 1px solid #e2e8f0;
        }

        .search-box input {
          border: none;
          background: none;
          width: 100%;
          font-size: 14px;
          font-family: 'Montserrat', sans-serif;
        }

        .search-box input:focus {
          outline: none;
        }

        .request-list {
          flex: 1;
          overflow-y: auto;
          padding: 8px;
        }

        /* Loading skeleton */
        .loading-list { padding: 8px; }
        .skel-item { display: flex; gap: 12px; padding: 12px; margin-bottom: 4px; }
        .skel-circle { width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; flex-shrink: 0; }
        .skel-lines { flex: 1; display: flex; flex-direction: column; gap: 8px; justify-content: center; }
        .skel-line { height: 12px; border-radius: 6px; background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; }
        .skel-line.w70 { width: 70%; }
        .skel-line.w40 { width: 40%; }
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

        .request-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          border-radius: 12px;
          cursor: pointer;
          transition: background 0.2s;
          margin-bottom: 4px;
        }

        .request-item:hover {
          background: #f8fafc;
        }

        .request-item.active {
          background: #f5f3ff;
          border: 1px solid #ddd6fe;
        }

        .item-avatar-circle {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 700;
          color: white;
          flex-shrink: 0;
        }

        .item-info {
          flex: 1;
          min-width: 0;
        }

        .item-info h4 {
          font-size: 14px;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 2px 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .item-role {
          font-size: 12px;
          color: #64748b;
        }

        .item-meta {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 4px;
        }

        .type-badge {
          font-size: 11px;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 10px;
        }

        .type-badge.cuti { background: #dbeafe; color: #1e40af; }
        .type-badge.sakit { background: #fee2e2; color: #991b1b; }
        .type-badge.izin { background: #fef3c7; color: #92400e; }

        .status-dot {
          font-size: 10px;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 8px;
        }
        .status-dot.pending { background: #fff7ed; color: #c2410c; }
        .status-dot.approved { background: #dcfce7; color: #15803d; }
        .status-dot.rejected { background: #fee2e2; color: #b91c1c; }

        /* Detail Column */
        .user-profile {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .profile-avatar {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          font-weight: 700;
          color: white;
          flex-shrink: 0;
        }

        .user-profile h2 {
          font-size: 20px;
          font-weight: 700;
          color: #1e293b;
          margin: 0 0 4px 0;
        }

        .user-profile span {
          color: #64748b;
          font-size: 14px;
        }

        .status-badge {
          padding: 8px 20px;
          border-radius: 24px;
          font-size: 13px;
          font-weight: 600;
        }

        .status-badge.pending { background: #fff7ed; color: #c2410c; }
        .status-badge.approved { background: #dcfce7; color: #15803d; }
        .status-badge.rejected { background: #fee2e2; color: #b91c1c; }

        /* Info List */
        .info-list {
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        .info-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 0;
          border-bottom: 1px solid #f1f5f9;
        }

        .info-item:last-child {
          border-bottom: none;
        }

        .info-label {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 14px;
          color: #64748b;
          font-weight: 500;
        }

        .info-label .material-icons {
          font-size: 20px;
          color: #94a3b8;
        }

        .info-value {
          font-size: 14px;
          color: #1e293b;
          font-weight: 500;
        }

        .reason-item {
          flex-direction: column;
          align-items: flex-start;
          gap: 8px;
        }

        .info-reason {
          font-size: 14px;
          color: #334155;
          line-height: 1.6;
          margin: 0;
          padding-left: 32px;
        }

        /* Action Section */
        .action-section {
          margin-top: 24px;
          padding-top: 20px;
          border-top: 1px solid #f1f5f9;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .action-row {
          display: flex;
          gap: 10px;
          width: 100%;
        }

        .approve-btn, .reject-btn, .delete-btn {
          flex: 1;
          padding: 10px 14px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          border: none;
          font-family: 'Montserrat', sans-serif;
          font-size: 12px;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }

        .approve-btn .material-icons,
        .reject-btn .material-icons,
        .delete-btn .material-icons,
        .share-btn .material-icons {
          font-size: 16px;
        }

        .approve-btn {
          background: #7c3aed;
          color: white;
        }
        .approve-btn:hover { background: #6d28d9; }
        .approve-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .reject-btn {
          background: #f59e0b;
          color: white;
        }
        .reject-btn:hover { background: #d97706; }
        .reject-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .delete-btn {
          background: #ef4444;
          color: white;
        }
        .delete-btn:hover { background: #dc2626; }

        .share-btn {
          flex: 1;
          padding: 10px 14px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          border: none;
          font-family: 'Montserrat', sans-serif;
          font-size: 12px;
          background: #f3e8ff;
          color: #7c3aed;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          transition: all 0.2s;
        }
        .share-btn:hover { background: #e9d5ff; }

        .empty-state, .empty-selection {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: #94a3b8;
          gap: 12px;
        }

        .empty-state .material-icons, .empty-selection .material-icons {
          font-size: 48px;
          color: #cbd5e1;
        }

        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          padding: 20px;
        }

        .modal-card {
          background: white;
          width: 100%;
          max-width: 500px;
          max-height: 90vh;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 20px 40px rgba(0,0,0,0.2);
          display: flex;
          flex-direction: column;
        }

        .modal-card.small-modal {
          max-width: 420px;
        }

        .modal-header {
          padding: 20px 24px;
          border-bottom: 1px solid #f1f5f9;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-shrink: 0;
        }

        .modal-header h2 {
          font-size: 18px;
          margin: 0;
          color: #1e293b;
        }

        .close-btn {
          background: none;
          border: none;
          color: #94a3b8;
          cursor: pointer;
        }

        .modal-body {
          padding: 24px;
          overflow-y: auto;
          flex: 1;
        }

        .confirm-content {
          text-align: center;
          padding: 12px 0;
        }
        .confirm-icon {
          font-size: 48px;
          color: #f59e0b;
          margin-bottom: 12px;
        }
        .confirm-content p {
          font-size: 15px;
          color: #334155;
          margin: 0 0 8px;
        }
        .confirm-sub {
          font-size: 12px;
          color: #94a3b8;
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-group label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: #475569;
          margin-bottom: 8px;
        }

        .form-group select, .form-group input, .form-group textarea {
          width: 100%;
          padding: 12px;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          font-family: 'Montserrat', sans-serif;
          font-size: 14px;
        }

        .form-group select:focus, .form-group input:focus, .form-group textarea:focus {
          outline: none;
          border-color: #7c3aed;
          box-shadow: 0 0 0 3px rgba(124,58,237,0.1);
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .modal-footer {
          padding: 20px 24px;
          border-top: 1px solid #f1f5f9;
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          flex-shrink: 0;
        }

        .secondary-btn {
          padding: 12px 20px;
          background: #f1f5f9;
          color: #64748b;
          border: none;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          font-family: 'Montserrat', sans-serif;
        }

        .delete-btn-modal {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 12px 20px;
          background: #ef4444;
          color: white;
          border: none;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          font-family: 'Montserrat', sans-serif;
          transition: background 0.2s;
        }
        .delete-btn-modal:hover { background: #dc2626; }
        .delete-btn-modal:disabled { opacity: 0.6; cursor: not-allowed; }
        .delete-btn-modal .material-icons { font-size: 18px; }
      `}</style>
    </div>
  );
}
