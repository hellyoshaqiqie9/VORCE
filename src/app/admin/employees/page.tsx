"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  getCompanyUsers,
  verifyEmployee,
  updateRole,
  sendInvite,
  getPublicInviteLink,
  fireEmployee,
  getCompanyLogs,
  addCompanyLog,
  deleteCompany,
  CompanyUser,
  ActivityLog,
} from "@/services/companyService";
import { getUserProfile } from "@/services/profileService";

type TabType = "employees" | "activity";

export default function EmployeesPage() {
  const router = useRouter();

  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>("employees");

  // Employee list
  const [employees, setEmployees] = useState<CompanyUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState("All");

  // Activity logs
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  // Modals
  const [selectedEmployee, setSelectedEmployee] = useState<CompanyUser | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showFireModal, setShowFireModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showDeleteCompanyModal, setShowDeleteCompanyModal] = useState(false);

  // Form values
  const [inviteEmail, setInviteEmail] = useState("");
  const [fireReason, setFireReason] = useState("");
  const [publicLink, setPublicLink] = useState("");
  const [linkCopied, setLinkCopied] = useState(false);

  // Loading states for actions
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Toast
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  // ─── FETCH EMPLOYEES + ENRICH WITH PROFILES ───
  const fetchEmployees = useCallback(async () => {
    try {
      setIsLoading(true);
      setApiError(null);
      const data = await getCompanyUsers();

      // Enrich each employee with profile data (photo, name)
      const enriched = await Promise.all(
        data.map(async (emp) => {
          try {
            const profile = await getUserProfile(emp.email);
            return {
              ...emp,
              displayName: profile.username || emp.displayName || emp.email.split("@")[0],
              photoURL: profile.photoURL || undefined,
              jabatan: profile.jabatan || undefined,
            };
          } catch {
            // If profile fetch fails, fallback to existing data
            return {
              ...emp,
              displayName: emp.displayName || emp.email.split("@")[0],
            };
          }
        })
      );

      setEmployees(enriched);
    } catch (err: any) {
      setApiError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ─── FETCH ACTIVITY LOGS ──────────────────────
  const fetchLogs = useCallback(async () => {
    try {
      setIsLoadingLogs(true);
      const data = await getCompanyLogs();
      setLogs(data);
    } catch (err: any) {
      showToast("error", err.message || "Gagal memuat log aktivitas");
    } finally {
      setIsLoadingLogs(false);
    }
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  useEffect(() => {
    if (activeTab === "activity") {
      fetchLogs();
    }
  }, [activeTab, fetchLogs]);

  // ─── ACTIONS ──────────────────────────────────

  const handleVerify = async (emp: CompanyUser, approved: boolean) => {
    try {
      setActionLoading(emp.email);
      await verifyEmployee(emp.email, approved);
      await addCompanyLog({
        action: approved ? "verify_employee" : "reject_employee",
        description: `${approved ? "Menyetujui" : "Menolak"} karyawan ${emp.displayName}`,
        target: emp.email,
      }).catch(() => {});
      showToast("success", `Karyawan ${emp.displayName} berhasil ${approved ? "diverifikasi" : "ditolak"}`);
      fetchEmployees();
    } catch (err: any) {
      showToast("error", err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateRole = async (emp: CompanyUser, action: "promote" | "demote") => {
    try {
      setActionLoading(emp.email);
      await updateRole(emp.email, action);
      await addCompanyLog({
        action: `${action}_role`,
        description: `${action === "promote" ? "Menaikkan" : "Menurunkan"} peran ${emp.displayName}`,
        target: emp.email,
      }).catch(() => {});
      showToast("success", `Peran ${emp.displayName} berhasil ${action === "promote" ? "dinaikkan" : "diturunkan"}`);
      fetchEmployees();
    } catch (err: any) {
      showToast("error", err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSendInvite = async () => {
    if (!inviteEmail || !inviteEmail.includes("@")) {
      showToast("error", "Masukkan email yang valid");
      return;
    }
    try {
      setActionLoading("invite");
      await sendInvite(inviteEmail);
      await addCompanyLog({
        action: "send_invite",
        description: `Mengirim undangan ke ${inviteEmail}`,
        target: inviteEmail,
      }).catch(() => {});
      showToast("success", `Undangan berhasil dikirim ke ${inviteEmail}`);
      setInviteEmail("");
      setShowInviteModal(false);
      fetchEmployees();
    } catch (err: any) {
      showToast("error", err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleGetPublicLink = async () => {
    try {
      setActionLoading("link");
      const data = await getPublicInviteLink();
      setPublicLink(data.publicLink || "");
      setShowLinkModal(true);
    } catch (err: any) {
      showToast("error", err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicLink);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const handleFireEmployee = async () => {
    if (!selectedEmployee) return;
    try {
      setActionLoading("fire");
      await fireEmployee(selectedEmployee.email, fireReason);
      await addCompanyLog({
        action: "fire_employee",
        description: `PHK karyawan ${selectedEmployee.displayName}: ${fireReason}`,
        target: selectedEmployee.email,
      }).catch(() => {});
      showToast("success", `Karyawan ${selectedEmployee.displayName} berhasil di-PHK`);
      setShowFireModal(false);
      setFireReason("");
      setSelectedEmployee(null);
      fetchEmployees();
    } catch (err: any) {
      showToast("error", err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteCompany = async () => {
    try {
      setActionLoading("delete-company");
      await deleteCompany();
      showToast("success", "Perusahaan berhasil dihapus");
      setTimeout(() => router.push("/admin"), 1500);
    } catch (err: any) {
      showToast("error", err.message);
    } finally {
      setActionLoading(null);
    }
  };

  // ─── FILTER ───────────────────────────────────
  const roles = ["All", ...Array.from(new Set(employees.map((e) => e.role).filter(Boolean)))];

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      (emp.displayName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (emp.email || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = filterRole === "All" || emp.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const getStatusColor = (status: string) => {
    const s = (status || "").toLowerCase();
    if (s === "verified" || s === "active" || s === "approved") return { bg: "#dcfce7", color: "#16a34a" };
    if (s === "pending") return { bg: "#fef3c7", color: "#d97706" };
    if (s === "rejected" || s === "fired") return { bg: "#fee2e2", color: "#dc2626" };
    return { bg: "#f1f5f9", color: "#64748b" };
  };

  const getStatusLabel = (status: string) => {
    const s = (status || "").toLowerCase();
    if (s === "verified" || s === "active" || s === "approved") return "Aktif";
    if (s === "pending") return "Menunggu";
    if (s === "rejected") return "Ditolak";
    if (s === "fired") return "PHK";
    return status || "-";
  };

  const getInitials = (name: string) =>
    name ? name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) : "?";

  // ─── RENDER ───────────────────────────────────
  return (
    <div className="employees-container">
      {/* Toast */}
      {toast && (
        <div className={`toast ${toast.type}`}>
          <span className="material-icons">{toast.type === "success" ? "check_circle" : "error"}</span>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="page-header">
        <div className="header-left">
          <h1>Karyawan</h1>
          <span className="emp-count">{employees.length} karyawan</span>
        </div>
        <div className="header-actions">
          <div className="search-box">
            <span className="material-icons">search</span>
            <input
              type="text"
              placeholder="Cari karyawan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="secondary-btn" onClick={handleGetPublicLink} disabled={actionLoading === "link"}>
            <span className="material-icons">link</span>
            {actionLoading === "link" ? "..." : "Link Undangan"}
          </button>
          <button className="primary-btn" onClick={() => setShowInviteModal(true)}>
            <span className="material-icons">person_add</span>
            Undang Karyawan
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tab-bar">
        <button className={`tab-btn ${activeTab === "employees" ? "active" : ""}`} onClick={() => setActiveTab("employees")}>
          <span className="material-icons">people</span>
          Daftar Karyawan
        </button>
        <button className={`tab-btn ${activeTab === "activity" ? "active" : ""}`} onClick={() => setActiveTab("activity")}>
          <span className="material-icons">history</span>
          Log Aktivitas
        </button>
        <div className="tab-spacer" />
        <button className="danger-text-btn" onClick={() => setShowDeleteCompanyModal(true)}>
          <span className="material-icons">delete_forever</span>
          Hapus Perusahaan
        </button>
      </div>

      {/* ═══ EMPLOYEES TAB ═══ */}
      {activeTab === "employees" && (
        <>
          {/* Role Filter */}
          <div className="filter-section">
            <div className="dept-filters">
              {roles.map((r) => (
                <button
                  key={r}
                  className={`dept-btn ${filterRole === r ? "active" : ""}`}
                  onClick={() => setFilterRole(r)}
                >
                  {r === "All" ? "Semua" : r}
                </button>
              ))}
            </div>
          </div>

          {/* Loading */}
          {isLoading && (
            <div className="loading-grid">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="skeleton-card">
                  <div className="skeleton-avatar" />
                  <div className="skeleton-line w-60" />
                  <div className="skeleton-line w-40" />
                </div>
              ))}
            </div>
          )}

          {/* Error */}
          {!isLoading && apiError && (
            <div className="error-state">
              <span className="material-icons">error_outline</span>
              <p>{apiError}</p>
              <button onClick={fetchEmployees}>
                <span className="material-icons">refresh</span>
                Coba Lagi
              </button>
            </div>
          )}

          {/* Empty */}
          {!isLoading && !apiError && employees.length === 0 && (
            <div className="empty-state">
              <span className="material-icons">group_off</span>
              <p>Belum ada karyawan. Undang karyawan pertama!</p>
            </div>
          )}

          {/* Employee Grid */}
          {!isLoading && !apiError && (
            <div className="employee-grid">
              {filteredEmployees.map((emp) => (
                <div key={emp.email} className="employee-card">
                  <div className="card-header">
                    <img 
                      src={emp.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.displayName || emp.email || "U")}&background=0066FF&color=fff&size=100`} 
                      alt={emp.displayName} 
                      className="avatar-img" 
                      onError={(e) => {
                        e.currentTarget.onerror = null; // prevent infinite loop
                        e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.displayName || emp.email || "U")}&background=0066FF&color=fff&size=100`;
                      }}
                    />
                    <span
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(emp.status).bg, color: getStatusColor(emp.status).color }}
                    >
                      {getStatusLabel(emp.status)}
                    </span>
                  </div>
                  <div className="card-body">
                    <h3>{emp.displayName || "-"}</h3>
                    <p className="position">{emp.jabatan || emp.role || "-"}</p>
                    <p className="department">{emp.email}</p>
                  </div>
                  <div className="card-actions">
                    {/* Verify for pending */}
                    {(emp.status || "").toLowerCase() === "pending" && (
                      <>
                        <button
                          className="action-icon verify"
                          title="Setujui"
                          disabled={actionLoading === emp.email}
                          onClick={() => handleVerify(emp, true)}
                        >
                          <span className="material-icons">check</span>
                        </button>
                        <button
                          className="action-icon reject"
                          title="Tolak"
                          disabled={actionLoading === emp.email}
                          onClick={() => handleVerify(emp, false)}
                        >
                          <span className="material-icons">close</span>
                        </button>
                      </>
                    )}

                    {/* Promote / Demote for verified */}
                    {(emp.status || "").toLowerCase() !== "pending" && (
                      <>
                        <button
                          className="action-icon"
                          title="Naikkan Peran"
                          disabled={actionLoading === emp.email}
                          onClick={() => handleUpdateRole(emp, "promote")}
                        >
                          <span className="material-icons">arrow_upward</span>
                        </button>
                        <button
                          className="action-icon"
                          title="Turunkan Peran"
                          disabled={actionLoading === emp.email}
                          onClick={() => handleUpdateRole(emp, "demote")}
                        >
                          <span className="material-icons">arrow_downward</span>
                        </button>
                      </>
                    )}

                    {/* Fire */}
                    <button
                      className="action-icon fire"
                      title="PHK"
                      onClick={() => {
                        setSelectedEmployee(emp);
                        setFireReason("");
                        setShowFireModal(true);
                      }}
                    >
                      <span className="material-icons">person_remove</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ═══ ACTIVITY LOG TAB ═══ */}
      {activeTab === "activity" && (
        <div className="log-section">
          {isLoadingLogs && (
            <div className="loading-state">
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton-item">
                  <div className="skeleton-avatar small" />
                  <div className="skeleton-info">
                    <div className="skeleton-line w-70" />
                    <div className="skeleton-line w-50" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isLoadingLogs && logs.length === 0 && (
            <div className="empty-state">
              <span className="material-icons">history</span>
              <p>Belum ada log aktivitas.</p>
            </div>
          )}

          {!isLoadingLogs && logs.length > 0 && (
            <div className="log-list">
              {logs.map((log, idx) => (
                <div key={idx} className="log-item">
                  <div className="log-icon">
                    <span className="material-icons">
                      {log.action.includes("verify") ? "verified" :
                       log.action.includes("fire") ? "person_remove" :
                       log.action.includes("promote") ? "arrow_upward" :
                       log.action.includes("demote") ? "arrow_downward" :
                       log.action.includes("invite") ? "mail" : "history"}
                    </span>
                  </div>
                  <div className="log-content">
                    <p className="log-desc">{log.description}</p>
                    <div className="log-meta">
                      <span><span className="material-icons">person</span>{log.performedBy || "-"}</span>
                      <span><span className="material-icons">schedule</span>{log.timestamp ? new Date(log.timestamp).toLocaleString("id-ID") : "-"}</span>
                      <span><span className="material-icons">alternate_email</span>{log.target || "-"}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══ MODALS ═══ */}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="modal-overlay" onClick={() => setShowInviteModal(false)}>
          <div className="add-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Undang Karyawan</h2>
              <button className="close-btn" onClick={() => setShowInviteModal(false)}>
                <span className="material-icons">close</span>
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Email Karyawan *</label>
                <input
                  type="email"
                  placeholder="contoh@email.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="secondary-btn" onClick={() => setShowInviteModal(false)}>Batal</button>
              <button className="primary-btn" onClick={handleSendInvite} disabled={actionLoading === "invite"}>
                <span className="material-icons">send</span>
                {actionLoading === "invite" ? "Mengirim..." : "Kirim Undangan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Public Link Modal */}
      {showLinkModal && (
        <div className="modal-overlay" onClick={() => setShowLinkModal(false)}>
          <div className="add-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Link Undangan Publik</h2>
              <button className="close-btn" onClick={() => setShowLinkModal(false)}>
                <span className="material-icons">close</span>
              </button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 13, color: "#64748b", marginBottom: 16 }}>
                Bagikan link ini agar karyawan bisa bergabung ke perusahaan Anda.
              </p>
              <div className="link-box">
                <input type="text" value={publicLink} readOnly />
                <button className="copy-btn" onClick={handleCopyLink}>
                  <span className="material-icons">{linkCopied ? "check" : "content_copy"}</span>
                  {linkCopied ? "Tersalin!" : "Salin"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fire Employee Modal */}
      {showFireModal && selectedEmployee && (
        <div className="modal-overlay" onClick={() => setShowFireModal(false)}>
          <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-icon danger">
              <span className="material-icons">person_remove</span>
            </div>
            <h3>PHK Karyawan?</h3>
            <p>
              Apakah Anda yakin ingin melakukan PHK terhadap{" "}
              <strong>{selectedEmployee.displayName}</strong> ({selectedEmployee.email})?
            </p>
            <div className="form-group" style={{ textAlign: "left" }}>
              <label>Alasan PHK *</label>
              <textarea
                placeholder="Masukkan alasan PHK..."
                value={fireReason}
                onChange={(e) => setFireReason(e.target.value)}
                rows={3}
                style={{ width: "100%", padding: "12px 16px", border: "1px solid #e2e8f0", borderRadius: 10, fontFamily: "'Montserrat', sans-serif", fontSize: 14, resize: "none" }}
              />
            </div>
            <div className="confirm-actions">
              <button className="secondary-btn" onClick={() => setShowFireModal(false)}>Batal</button>
              <button className="danger-btn" onClick={handleFireEmployee} disabled={actionLoading === "fire" || !fireReason.trim()}>
                <span className="material-icons">person_remove</span>
                {actionLoading === "fire" ? "Memproses..." : "Konfirmasi PHK"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Company Modal */}
      {showDeleteCompanyModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteCompanyModal(false)}>
          <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-icon danger">
              <span className="material-icons">warning</span>
            </div>
            <h3>Hapus Perusahaan?</h3>
            <p style={{ color: "#dc2626", fontWeight: 600 }}>
              Tindakan ini TIDAK DAPAT dibatalkan. Seluruh data perusahaan akan dihapus secara permanen.
            </p>
            <div className="confirm-actions">
              <button className="secondary-btn" onClick={() => setShowDeleteCompanyModal(false)}>Batal</button>
              <button className="danger-btn" onClick={handleDeleteCompany} disabled={actionLoading === "delete-company"}>
                <span className="material-icons">delete_forever</span>
                {actionLoading === "delete-company" ? "Menghapus..." : "Hapus Perusahaan"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .employees-container { max-width: 1400px; margin: 0 auto; }

        /* Toast */
        .toast {
          position: fixed; top: 20px; right: 20px;
          display: flex; align-items: center; gap: 8px;
          padding: 12px 20px; border-radius: 10px;
          font-size: 14px; font-weight: 500; z-index: 1100;
          animation: slideIn 0.3s ease;
        }
        .toast.success { background: #dcfce7; color: #16a34a; }
        .toast.error { background: #fee2e2; color: #dc2626; }
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }

        /* Header */
        .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 16px; }
        .header-left { display: flex; align-items: center; gap: 16px; }
        .page-header h1 { font-size: 24px; font-weight: 700; color: #1e293b; margin: 0; }
        .emp-count { background: #f1f5f9; padding: 6px 12px; border-radius: 20px; font-size: 13px; color: #64748b; font-weight: 500; }
        .header-actions { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }

        .search-box { display: flex; align-items: center; gap: 8px; background: white; border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px 16px; min-width: 240px; }
        .search-box .material-icons { color: #94a3b8; font-size: 20px; }
        .search-box input { border: none; outline: none; font-size: 14px; flex: 1; font-family: 'Montserrat', sans-serif; }

        .primary-btn { display: flex; align-items: center; gap: 8px; padding: 10px 18px; background: #0066FF; color: white; border: none; border-radius: 10px; font-weight: 600; cursor: pointer; font-family: 'Montserrat', sans-serif; font-size: 13px; transition: all 0.2s; }
        .primary-btn:hover { background: #0052CC; }
        .primary-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .secondary-btn { display: flex; align-items: center; gap: 8px; padding: 10px 18px; background: #f1f5f9; color: #64748b; border: none; border-radius: 10px; font-weight: 600; cursor: pointer; font-family: 'Montserrat', sans-serif; font-size: 13px; transition: all 0.2s; }
        .secondary-btn:hover { background: #e2e8f0; }
        .secondary-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        /* Tabs */
        .tab-bar { display: flex; align-items: center; gap: 4px; margin-bottom: 20px; border-bottom: 1px solid #f1f5f9; padding-bottom: 0; }
        .tab-btn { display: flex; align-items: center; gap: 8px; padding: 12px 20px; background: none; border: none; border-bottom: 2px solid transparent; color: #64748b; font-size: 14px; font-weight: 600; cursor: pointer; font-family: 'Montserrat', sans-serif; transition: all 0.2s; }
        .tab-btn:hover { color: #1e293b; }
        .tab-btn.active { color: #0066FF; border-bottom-color: #0066FF; }
        .tab-btn .material-icons { font-size: 20px; }
        .tab-spacer { flex: 1; }
        .danger-text-btn { display: flex; align-items: center; gap: 6px; padding: 8px 14px; background: none; border: 1px solid #fee2e2; color: #dc2626; font-size: 12px; font-weight: 600; cursor: pointer; font-family: 'Montserrat', sans-serif; border-radius: 8px; transition: all 0.2s; }
        .danger-text-btn:hover { background: #fee2e2; }
        .danger-text-btn .material-icons { font-size: 16px; }

        /* Filter */
        .filter-section { margin-bottom: 20px; }
        .dept-filters { display: flex; gap: 8px; flex-wrap: wrap; }
        .dept-btn { padding: 8px 16px; border: 1px solid #e2e8f0; border-radius: 20px; background: white; color: #64748b; font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.2s; font-family: 'Montserrat', sans-serif; }
        .dept-btn:hover { border-color: #0066FF; color: #0066FF; }
        .dept-btn.active { background: #0066FF; color: white; border-color: #0066FF; }

        /* Grid */
        .employee-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }
        .employee-card { background: white; border-radius: 16px; border: 1px solid #f1f5f9; overflow: hidden; transition: all 0.2s; }
        .employee-card:hover { border-color: #e2e8f0; box-shadow: 0 8px 24px rgba(0,0,0,0.08); transform: translateY(-2px); }

        .card-header { padding: 24px 24px 0; display: flex; flex-direction: column; align-items: center; position: relative; }
        .avatar-placeholder { width: 72px; height: 72px; border-radius: 50%; background: linear-gradient(135deg, #0066FF 0%, #0052CC 100%); color: white; display: flex; align-items: center; justify-content: center; font-size: 22px; font-weight: 700; border: 3px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .avatar-img { width: 72px; height: 72px; border-radius: 50%; object-fit: cover; border: 3px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .status-badge { position: absolute; top: 16px; right: 16px; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }

        .card-body { padding: 16px 24px; text-align: center; }
        .card-body h3 { font-size: 15px; font-weight: 700; color: #1e293b; margin: 0 0 4px 0; }
        .card-body .position { font-size: 13px; color: #0066FF; margin: 0 0 2px 0; font-weight: 600; }
        .card-body .department { font-size: 12px; color: #94a3b8; margin: 0; word-break: break-all; }

        .card-actions { padding: 12px 20px; border-top: 1px solid #f1f5f9; display: flex; justify-content: center; gap: 8px; }
        .action-icon { width: 36px; height: 36px; border-radius: 8px; border: 1px solid #e2e8f0; background: white; color: #64748b; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; }
        .action-icon:hover { background: #0066FF; color: white; border-color: #0066FF; }
        .action-icon:disabled { opacity: 0.5; cursor: not-allowed; }
        .action-icon .material-icons { font-size: 18px; }
        .action-icon.verify:hover { background: #16a34a; border-color: #16a34a; }
        .action-icon.reject:hover { background: #dc2626; border-color: #dc2626; }
        .action-icon.fire:hover { background: #dc2626; border-color: #dc2626; }

        /* Loading */
        .loading-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }
        .skeleton-card { background: white; border-radius: 16px; border: 1px solid #f1f5f9; padding: 32px; display: flex; flex-direction: column; align-items: center; gap: 12px; }
        .skeleton-avatar { width: 72px; height: 72px; border-radius: 50%; background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; }
        .skeleton-line { height: 12px; border-radius: 6px; background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; }
        .w-60 { width: 60%; } .w-40 { width: 40%; } .w-70 { width: 70%; } .w-50 { width: 50%; }
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

        .loading-state { padding: 12px; }
        .skeleton-item { display: flex; align-items: center; gap: 12px; padding: 14px 12px; }
        .skeleton-avatar.small { width: 36px; height: 36px; min-width: 36px; }
        .skeleton-info { flex: 1; display: flex; flex-direction: column; gap: 8px; }

        /* Error / Empty */
        .error-state, .empty-state { text-align: center; padding: 60px 24px; color: #64748b; }
        .error-state .material-icons { font-size: 48px; color: #ef4444; margin-bottom: 12px; }
        .empty-state .material-icons { font-size: 48px; color: #94a3b8; margin-bottom: 12px; }
        .error-state p, .empty-state p { font-size: 14px; margin-bottom: 16px; line-height: 1.5; }
        .error-state button { display: inline-flex; align-items: center; gap: 6px; padding: 10px 20px; background: #0066FF; color: white; border: none; border-radius: 10px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: 'Montserrat', sans-serif; }
        .error-state button .material-icons { font-size: 16px; color: white; margin-bottom: 0; }

        /* Activity Log */
        .log-section { background: white; border-radius: 16px; border: 1px solid #f1f5f9; overflow: hidden; }
        .log-list { }
        .log-item { display: flex; gap: 16px; padding: 20px 24px; border-bottom: 1px solid #f8fafc; transition: background 0.2s; }
        .log-item:last-child { border-bottom: none; }
        .log-item:hover { background: #fafafa; }
        .log-icon { width: 40px; height: 40px; min-width: 40px; border-radius: 10px; background: #f1f5f9; display: flex; align-items: center; justify-content: center; }
        .log-icon .material-icons { font-size: 20px; color: #64748b; }
        .log-content { flex: 1; }
        .log-desc { font-size: 14px; color: #1e293b; font-weight: 500; margin: 0 0 8px 0; }
        .log-meta { display: flex; gap: 20px; flex-wrap: wrap; }
        .log-meta span { display: flex; align-items: center; gap: 4px; font-size: 12px; color: #94a3b8; }
        .log-meta .material-icons { font-size: 14px; }

        /* Modals */
        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
        .add-modal { background: white; width: 100%; max-width: 480px; border-radius: 20px; overflow: hidden; box-shadow: 0 25px 50px rgba(0,0,0,0.2); }
        .modal-header { padding: 20px 24px; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; }
        .modal-header h2 { font-size: 18px; font-weight: 700; color: #1e293b; margin: 0; }
        .close-btn { width: 36px; height: 36px; border-radius: 8px; border: none; background: #f1f5f9; color: #64748b; display: flex; align-items: center; justify-content: center; cursor: pointer; }
        .modal-body { padding: 24px; }
        .modal-footer { padding: 16px 24px; border-top: 1px solid #f1f5f9; display: flex; gap: 12px; justify-content: flex-end; }

        .form-group { margin-bottom: 20px; }
        .form-group label { display: block; font-size: 13px; font-weight: 600; color: #475569; margin-bottom: 8px; }
        .form-group input, .form-group select, .form-group textarea { width: 100%; padding: 12px 16px; border: 1px solid #e2e8f0; border-radius: 10px; font-size: 14px; font-family: 'Montserrat', sans-serif; transition: all 0.2s; }
        .form-group input:focus, .form-group select:focus, .form-group textarea:focus { outline: none; border-color: #0066FF; box-shadow: 0 0 0 3px rgba(0, 102, 255, 0.1); }

        /* Link Box */
        .link-box { display: flex; gap: 8px; align-items: center; }
        .link-box input { flex: 1; padding: 12px 16px; border: 1px solid #e2e8f0; border-radius: 10px; font-size: 13px; font-family: 'Montserrat', sans-serif; background: #f8fafc; color: #1e293b; }
        .copy-btn { display: flex; align-items: center; gap: 6px; padding: 12px 16px; background: #0066FF; color: white; border: none; border-radius: 10px; font-weight: 600; font-size: 13px; cursor: pointer; font-family: 'Montserrat', sans-serif; white-space: nowrap; }
        .copy-btn .material-icons { font-size: 16px; }

        /* Confirm Modal */
        .confirm-modal { background: white; width: 100%; max-width: 420px; border-radius: 20px; padding: 32px; text-align: center; box-shadow: 0 25px 50px rgba(0,0,0,0.2); }
        .confirm-icon { width: 64px; height: 64px; border-radius: 50%; background: #fef3c7; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; }
        .confirm-icon.danger { background: #fee2e2; }
        .confirm-icon .material-icons { font-size: 32px; color: #d97706; }
        .confirm-icon.danger .material-icons { color: #dc2626; }
        .confirm-modal h3 { font-size: 18px; font-weight: 700; color: #1e293b; margin: 0 0 8px 0; }
        .confirm-modal p { font-size: 14px; color: #64748b; margin: 0 0 20px 0; line-height: 1.5; }
        .confirm-actions { display: flex; gap: 12px; justify-content: center; }
        .danger-btn { display: flex; align-items: center; gap: 8px; padding: 12px 20px; background: #dc2626; color: white; border: none; border-radius: 10px; font-weight: 600; cursor: pointer; font-family: 'Montserrat', sans-serif; font-size: 13px; }
        .danger-btn:hover { background: #b91c1c; }
        .danger-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        @media (max-width: 768px) {
          .page-header { flex-direction: column; align-items: flex-start; }
          .header-actions { width: 100%; flex-direction: column; }
          .search-box { min-width: 100%; }
          .primary-btn, .secondary-btn { width: 100%; justify-content: center; }
          .tab-bar { flex-wrap: wrap; }
        }
      `}</style>
    </div>
  );
}
