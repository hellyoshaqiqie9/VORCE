"use client";

import { useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getUserProfile,
  updateUserProfile,
  uploadAvatar,
  changeEmail,
  deleteAccount,
  getSubscriptionStatus,
  UserProfile,
  SubscriptionStatus
} from "@/services/profileService";
import { getUserData } from "@/lib/auth";
import Image from "next/image";

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    noTelp: "",
    noWA: "",
    address: "",
  });

  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const { data: subscription, isLoading: subLoading } = useQuery<SubscriptionStatus>({
    queryKey: ["subscription-status"],
    queryFn: getSubscriptionStatus,
    retry: false,
  });

  const { data: profile, isLoading } = useQuery<UserProfile>({
    queryKey: ["user-profile"],
    queryFn: async () => {
      const data = await getUserProfile();
      setFormData({
        username: data.username || "",
        noTelp: data.noTelp || "",
        noWA: data.noWA || "",
        address: data.alamatLoc?.address || "",
      });
      return data;
    },
  });

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png"].includes(file.type)) {
      showToast("error", "Format file harus JPG atau PNG");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      showToast("error", "Ukuran maksimal 2MB");
      return;
    }

    try {
      await uploadAvatar(file);
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
      showToast("success", "Foto profil berhasil diperbarui!");
    } catch (err: any) {
      showToast("error", err.message || "Gagal mengupload foto");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateUserProfile({
        username: formData.username,
        noTelp: formData.noTelp,
        noWA: formData.noWA,
        alamatLoc: {
          lat: profile?.alamatLoc?.lat || 0,
          long: profile?.alamatLoc?.long || 0,
          address: formData.address,
        },
      });
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
      setIsEditing(false);
      showToast("success", "Profil berhasil disimpan!");
    } catch (err: any) {
      showToast("error", err.message || "Gagal menyimpan profil");
    }
  };

  if (isLoading) {
    return (
      <div className="profile-container loading">
        <p>Memuat profil...</p>
      </div>
    );
  }

  return (
    <div className="profile-container">
      {toast && (
        <div className={`toast ${toast.type}`}>
          {toast.message}
        </div>
      )}

      <div className="profile-header">
        <div className="profile-cover">
          <div className="user-cover-text">
            <h1>{profile?.username || "Pengguna"}</h1>
          </div>
        </div>
        <div className="profile-info-wrapper">
          <div className="avatar-section">
            <div className="avatar-wrapper" onClick={() => fileInputRef.current?.click()}>
              {profile?.photoURL ? (
                <Image src={profile.photoURL} alt="Avatar" width={100} height={100} className="avatar-img" />
              ) : (
                <div className="avatar-placeholder">
                  {profile?.username?.charAt(0).toUpperCase() || "A"}
                </div>
              )}
              <div className="avatar-overlay">
                <span className="material-icons">camera_alt</span>
              </div>
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: "none" }} 
              accept="image/jpeg,image/png"
              onChange={handleAvatarUpload}
            />
          </div>
          
          <div className="user-info-text">
            <p className="user-role">{profile?.role || profile?.jabatan || "Karyawan"}</p>
            <p className="user-company">{profile?.namaPerusahaan || "Perusahaan"}</p>
          </div>
        </div>
      </div>

      <div className="profile-cards">
        <div className="card form-card">
          <div className="card-header">
            <h3>Detail Profil</h3>
            {!isEditing && (
              <button 
                className="btn-edit" 
                onClick={() => setIsEditing(true)}>
                <span className="material-icons">edit</span> Edit
              </button>
            )}
          </div>
          
          <div className="card-body">
            <form onSubmit={handleSaveProfile} className="profile-form">
              <div className="form-group">
                <label>Nama Lengkap</label>
                <input 
                  type="text" 
                  value={isEditing ? formData.username : profile?.username || "-"} 
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  disabled={!isEditing}
                />
              </div>
              
              <div className="form-group">
                <label>Email</label>
                <input 
                  type="email" 
                  value={profile?.email || "-"} 
                  disabled={true} 
                  title="Gunakan fitur ganti email untuk merubah"
                />
              </div>

              <div className="form-group">
                <label>Nomor Telepon</label>
                <input 
                  type="text" 
                  value={isEditing ? formData.noTelp : profile?.noTelp || "-"} 
                  onChange={(e) => setFormData({...formData, noTelp: e.target.value})}
                  disabled={!isEditing}
                />
              </div>

              <div className="form-group">
                <label>Nomor WhatsApp</label>
                <input 
                  type="text" 
                  value={isEditing ? formData.noWA : profile?.noWA || "-"} 
                  onChange={(e) => setFormData({...formData, noWA: e.target.value})}
                  disabled={!isEditing}
                />
              </div>

              {isEditing && (
                <div className="form-actions full-width">
                  <button type="button" className="btn-cancel" onClick={() => setIsEditing(false)}>Batal</button>
                  <button type="submit" className="btn-save">Simpan Perubahan</button>
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Subscription Card */}
        <div className="card subscription-card">
          <div className="card-header">
            <h3>Status Langganan</h3>
            {subscription && (
              <span className={`sub-badge ${subscription.isActive ? "active" : "inactive"}`}>
                <span className="badge-dot" />
                {subscription.isActive ? "Aktif" : "Tidak Aktif"}
              </span>
            )}
          </div>
          <div className="card-body sub-body">
            {subLoading ? (
              <div className="sub-loading">
                <div className="sub-skeleton" />
                <div className="sub-skeleton short" />
              </div>
            ) : subscription ? (
              <>
                {/* Plan name banner */}
                <div className="sub-plan-banner">
                  <div className="sub-plan-icon">
                    <span className="material-icons">workspace_premium</span>
                  </div>
                  <div className="sub-plan-info">
                    <p className="sub-plan-label">Paket Langganan</p>
                    <h4 className="sub-plan-name">{subscription.planName || "—"}</h4>
                  </div>
                </div>

                {/* Stats row */}
                <div className="sub-stats">
                  <div className="sub-stat">
                    <span className="material-icons sub-stat-icon">calendar_today</span>
                    <div>
                      <p className="sub-stat-label">Berakhir</p>
                      <p className="sub-stat-value">
                        {subscription.expiredAt
                          ? new Date(subscription.expiredAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
                          : "—"}
                      </p>
                    </div>
                  </div>
                  {subscription.daysLeft !== undefined && (
                    <div className="sub-stat">
                      <span className="material-icons sub-stat-icon">timer</span>
                      <div>
                        <p className="sub-stat-label">Sisa Hari</p>
                        <p className={`sub-stat-value ${subscription.daysLeft <= 7 ? "warn" : ""}`}>
                          {subscription.daysLeft} hari
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Employee usage bar */}
                {(subscription.maxEmployees ?? 0) > 0 && (
                  <div className="sub-usage">
                    <div className="sub-usage-header">
                      <span className="sub-stat-label">Karyawan</span>
                      <span className="sub-usage-count">
                        {subscription.usedEmployees} / {subscription.maxEmployees}
                      </span>
                    </div>
                    <div className="sub-usage-bar">
                      <div
                        className="sub-usage-fill"
                        style={{ width: `${Math.min(100, ((subscription.usedEmployees ?? 0) / (subscription.maxEmployees ?? 1)) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Features */}
                {subscription.features && subscription.features.length > 0 && (
                  <div className="sub-features">
                    <p className="sub-stat-label" style={{ marginBottom: 8 }}>Fitur Tersedia</p>
                    <div className="sub-features-list">
                      {subscription.features.map((f, i) => (
                        <span key={i} className="sub-feature-chip">
                          <span className="material-icons" style={{ fontSize: 12 }}>check_circle</span>
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="sub-empty">
                <span className="material-icons sub-empty-icon">error_outline</span>
                <p>Gagal memuat data langganan</p>
              </div>
            )}
          </div>
        </div>

        <div className="card settings-card">
          <div className="card-header">
            <h3>Pengaturan Akun</h3>
          </div>
          <div className="card-body">
            <div className="setting-item">
              <div className="setting-info">
                <h4>Ganti Password / Email</h4>
                <p>Ubah kredensial masuk Anda</p>
              </div>
              <button className="btn-outline">Ubah</button>
            </div>
            <div className="setting-item danger">
              <div className="setting-info">
                <h4>Hapus Akun</h4>
                <p>Penghapusan akun bersifat permanen</p>
              </div>
              <button 
                className="btn-danger" 
                onClick={() => confirm("Anda yakin ingin menghapus akun permanen?") && deleteAccount()}>
                Hapus
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .profile-container {
          flex: 1; margin: -32px; padding: 32px; background: #f8fafc; display: flex; flex-direction: column;
          
          margin: 0 auto;
          font-family: 'Inter', sans-serif;
        }

        .loading {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 400px;
          color: #64748b;
          font-weight: 500;
        }

        .toast {
          position: fixed;
          top: 80px;
          right: 32px;
          padding: 12px 24px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 14px;
          z-index: 100;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          animation: slideIn 0.3s ease-out;
        }

        .toast.success { background: #dcfce7; color: #16a34a; border: 1px solid #bbf7d0; }
        .toast.error { background: #fee2e2; color: #dc2626; border: 1px solid #fecaca; }

        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }

        .profile-header {
          background: white;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0,0,0,0.02);
          border: 1px solid rgba(226, 232, 240, 0.6);
          margin-bottom: 32px;
        }

        .profile-cover {
          height: 110px;
          background: linear-gradient(135deg, #1c2a40ff 0%, #334155 100%);
          display: flex;
          align-items: flex-end;
          padding-bottom: 2px; /* Control the gap from below name */
          padding-left: 156px; /* Align with info text below */
        }

        .profile-info-wrapper {
          padding: 2px 32px 24px;
          display: flex;
          align-items: flex-start;
          gap: 24px;
        }

        .avatar-section {
          position: relative;
          margin-top: -60px;
        }

        .avatar-wrapper {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          border: 4px solid white;
          background: white;
          position: relative;
          overflow: hidden;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }

        .avatar-img {
          object-fit: cover;
          width: 100%;
          height: 100%;
        }

        .avatar-placeholder {
          width: 100%;
          height: 100%;
          background: #e0e7ff;
          color: #4f46e5;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 36px;
          font-weight: 700;
        }

        .avatar-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          opacity: 0;
          transition: opacity 0.2s;
        }

        .avatar-wrapper:hover .avatar-overlay {
          opacity: 1;
        }

        .user-cover-text h1 {
          margin: 0;
          font-size: 26px;
          font-weight: 700;
          color: white;
          text-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }

        .user-info-text {
          display: flex;
          flex-direction: column;
          gap: 2px;
          padding-top: 4px;
        }

        .user-role {
          font-size: 15px;
          color: #4f46e5;
          font-weight: 600;
          margin: 0;
        }

        .user-company {
          font-size: 14px;
          color: #64748b;
          margin: 0 !important;
        }

        .profile-cards {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 24px;
        }

        /* ── Subscription Card ── */
        .sub-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.3px;
        }
        .sub-badge.active { background: #dcfce7; color: #15803d; }
        .sub-badge.inactive { background: #fee2e2; color: #dc2626; }
        .badge-dot {
          width: 7px; height: 7px;
          border-radius: 50%;
          background: currentColor;
        }
        .sub-body {
          padding: 20px 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .sub-plan-banner {
          display: flex;
          align-items: center;
          gap: 14px;
          background: linear-gradient(135deg, #ede9fe 0%, #f0f4ff 100%);
          border: 1px solid rgba(99,102,241,0.15);
          border-radius: 12px;
          padding: 16px;
        }
        .sub-plan-icon {
          width: 44px;
          height: 44px;
          background: linear-gradient(135deg, #4f46e5, #7c3aed);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .sub-plan-icon .material-icons { color: white; font-size: 22px; }
        .sub-plan-label {
          margin: 0;
          font-size: 11px;
          font-weight: 600;
          color: #6366f1;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .sub-plan-name {
          margin: 2px 0 0;
          font-size: 18px;
          font-weight: 700;
          color: #1e1b4b;
        }
        .sub-stats {
          display: flex;
          gap: 20px;
        }
        .sub-stat {
          display: flex;
          align-items: center;
          gap: 10px;
          flex: 1;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 12px 14px;
        }
        .sub-stat-icon { color: #94a3b8; font-size: 18px !important; }
        .sub-stat-label {
          margin: 0;
          font-size: 11px;
          font-weight: 600;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.4px;
        }
        .sub-stat-value {
          margin: 2px 0 0;
          font-size: 14px;
          font-weight: 700;
          color: #1e293b;
        }
        .sub-stat-value.warn { color: #f59e0b; }
        .sub-usage {}
        .sub-usage-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        .sub-usage-count {
          font-size: 13px;
          font-weight: 700;
          color: #4f46e5;
        }
        .sub-usage-bar {
          height: 8px;
          background: #e2e8f0;
          border-radius: 999px;
          overflow: hidden;
        }
        .sub-usage-fill {
          height: 100%;
          background: linear-gradient(90deg, #4f46e5, #7c3aed);
          border-radius: 999px;
          transition: width 0.6s ease;
        }
        .sub-features-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .sub-feature-chip {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 4px 10px;
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          color: #15803d;
        }
        .sub-loading {
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 4px 0;
        }
        .sub-skeleton {
          height: 52px;
          background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
          background-size: 200% 100%;
          border-radius: 10px;
          animation: shimmer 1.4s infinite;
        }
        .sub-skeleton.short { height: 32px; width: 60%; }
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .sub-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 24px 0;
          color: #94a3b8;
        }
        .sub-empty-icon { font-size: 36px !important; }
        .sub-empty p { margin: 0; font-size: 14px; font-weight: 500; }

        @media (max-width: 1024px) {
          .profile-cards {
            grid-template-columns: 1fr;
          }
        }

        .card {
          background: white;
          border-radius: 16px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.02);
          border: 1px solid rgba(226, 232, 240, 0.6);
          overflow: hidden;
        }

        .card-header {
          padding: 20px 24px;
          border-bottom: 1px solid #f1f5f9;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .card-header h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: #0f172a;
        }

        .btn-edit {
          display: flex;
          align-items: center;
          gap: 6px;
          background: #f1f5f9;
          border: none;
          color: #475569;
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }
        
        .btn-edit .material-icons {
          font-size: 16px;
        }

        .btn-edit:hover {
          background: #e2e8f0;
          color: #1e293b;
        }

        .profile-form {
          padding: 24px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        @media (max-width: 640px) {
          .profile-form {
            grid-template-columns: 1fr;
          }
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .form-group.full-width {
          grid-column: 1 / -1;
        }

        .form-group label {
          font-size: 13px;
          font-weight: 600;
          color: #475569;
        }

        .form-group input, .form-group textarea {
          padding: 12px 16px;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          font-size: 14px;
          color: #0f172a;
          font-family: inherit;
          transition: all 0.2s;
        }

        .form-group input:focus, .form-group textarea:focus {
          outline: none;
          border-color: #4f46e5;
          box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
        }

        .form-group input:disabled, .form-group textarea:disabled {
          background: #f8fafc;
          border-color: #e2e8f0;
          color: #64748b;
          cursor: not-allowed;
        }

        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 12px;
        } 

        .btn-cancel {
          padding: 10px 20px;
          border: 1px solid #cbd5e1;
          background: white;
          border-radius: 8px;
          color: #475569;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
        }

        .btn-save {
          padding: 10px 20px;
          border: none;
          background: #4f46e5;
          border-radius: 8px;
          color: white;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .btn-save:hover {
          background: #4338ca;
        }

        .card-body {
          padding: 0;
        }

        .settings-card .card-body {
          padding: 8px 0;
        }

        .setting-item {
          padding: 16px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid #f1f5f9;
        }

        .setting-item:last-child {
          border-bottom: none;
        }

        .setting-info h4 {
          margin: 0 0 4px 0;
          font-size: 14px;
          color: #1e293b;
          font-weight: 600;
        }

        .setting-info p {
          margin: 0;
          font-size: 13px;
          color: #64748b;
        }

        .btn-outline {
          padding: 8px 16px;
          border: 1px solid #cbd5e1;
          background: white;
          border-radius: 8px;
          color: #0f172a;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
        }

        .btn-danger {
          padding: 8px 16px;
          border: 1px solid #fecaca;
          background: #fef2f2;
          border-radius: 8px;
          color: #dc2626;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
