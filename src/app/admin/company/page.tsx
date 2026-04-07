"use client";

import { useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface CompanyInfo {
  name: string;
  logo: string;
  idPerusahaan: string;
  phone: string;
  whatsapp: string;
  address: string;
}
import { getCompanyProfile, uploadCompanyLogo, updateCompanyProfile } from "@/services/profileService";

export default function CompanyPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [showLogoModal, setShowLogoModal] = useState(false);
  
  const [editMode, setEditMode] = useState(false);
  const [editedInfo, setEditedInfo] = useState<CompanyInfo | null>(null);

  const { data: companyInfo, isLoading, error } = useQuery({
    queryKey: ["company-profile"],
    queryFn: async () => {
      console.log("DEBUG: queryFn starting fetch...");
      const data = await getCompanyProfile();
      console.log("DEBUG: queryFn data received from service:", data);
      
      const mapped = {
        name: data?.namaPerusahaan || "-",
        logo: data?.logoUrl || "/vorce-logo.svg",
        idPerusahaan: data?.idPerusahaan || "-",
        phone: data?.telepon || "-",
        whatsapp: data?.whatsapp || "-",
        address: data?.alamat || "-",
      };
      
      console.log("DEBUG: queryFn mapped data:", mapped);
      return mapped;
    },
  });

  console.log("DEBUG: Final companyInfo:", companyInfo);
  console.log("DEBUG: Final isLoading:", isLoading);
  console.log("DEBUG: Final query error:", error);

  if (isLoading || !companyInfo) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!["image/jpeg", "image/png", "image/svg+xml"].includes(file.type)) {
      showToast("error", "Format file harus JPG, PNG, atau SVG");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      showToast("error", "Ukuran file maksimal 2MB");
      return;
    }

    try {
      setIsUploading(true);
      await uploadCompanyLogo(file);
      queryClient.invalidateQueries({ queryKey: ["company-profile"] });
      setShowLogoModal(false);
      showToast("success", "Logo berhasil diperbarui!");
    } catch (err: any) {
      showToast("error", err.message || "Gagal mengupload logo");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const startEdit = () => {
    setEditedInfo({ ...companyInfo });
    setEditMode(true);
  };

  const handleCancel = () => {
    setEditMode(false);
    setEditedInfo(null);
  };

  const handleSaveInfo = async () => {
    if (!editedInfo) return;
    try {
      setIsSaving(true);
      
      // 1. Update Profile (Name, Address, WhatsApp, Phone)
      await updateCompanyProfile({
        namaPerusahaan: editedInfo.name,
        alamatLoc: editedInfo.address,
        noTelp: editedInfo.phone,
        noWA: editedInfo.whatsapp,
      });


      queryClient.invalidateQueries({ queryKey: ["company-profile"] });
      setEditMode(false);
      setEditedInfo(null);
      showToast("success", "Informasi perusahaan diperbarui!");
    } catch (err: any) {
      showToast("error", err.message || "Gagal memperbarui informasi");
    } finally {
      setIsSaving(false);
    }
  };


  const menuItems = [
    {
      icon: "archive",
      label: "Arsip",
      description: "Lihat dokumen arsip",
      href: "/admin/archive",
      color: "#f97316",
    },
    {
      icon: "people",
      label: "Karyawan",
      description: "Kelola data karyawan",
      href: "/admin/employees",
      color: "#8b5cf6",
    },
  ];

  const settingsItems = [
    {
      icon: "help",
      label: "Tentang Vorce",
      description: "Pelajari tentang aplikasi",
      external: true,
      href: "https://vorce.id",
    },
    {
      icon: "policy",
      label: "Kebijakan Vorce",
      description: "Syarat dan ketentuan",
      external: true,
      href: "#",
    },
    {
      icon: "security",
      label: "Privasi pengguna",
      description: "Kebijakan privasi",
      external: true,
      href: "#",
    },
  ];

  const handleNavigate = (href: string, external?: boolean) => {
    if (external) {
      window.open(href, "_blank");
    } else {
      router.push(href);
    }
  };

  return (
    <div className="company-container">
      {/* Toast Notification */}
      {toast && (
        <div className={`toast ${toast.type}`}>
          <span className="material-icons">{toast.type === "success" ? "check_circle" : "error"}</span>
          {toast.message}
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/svg+xml"
        style={{ display: "none" }}
        onChange={handleLogoUpload}
      />

      <div className="layout-grid">
        {/* LEFT COLUMN: Main Data */}
        <div className="main-col">
          {/* Company Header / Logo Card */}
          <div className="company-header">
            <div className="logo-section">
              <div className="logo-wrapper" onClick={() => setShowLogoModal(true)}>
                <Image
                  src={companyInfo.logo}
                  alt={companyInfo.name}
                  width={80}
                  height={80}
                  className="company-logo"
                />
                <div className="logo-overlay">
                  <span className="material-icons">photo_camera</span>
                </div>
              </div>
              <h1>{companyInfo.name}</h1>
              <button className="change-logo-btn" onClick={() => setShowLogoModal(true)}>
                <span className="material-icons">edit</span>
                Ubah Logo
              </button>
            </div>
          </div>

          {/* Main Menu */}
          <div className="menu-section">
            <h3 className="section-title">Menu Utama</h3>
            <div className="menu-grid">
              {menuItems.map((item, index) => (
                <div 
                  key={index} 
                  className="menu-card"
                  onClick={() => handleNavigate(item.href)}
                >
                  <div className="menu-icon" style={{ backgroundColor: `${item.color}15`, color: item.color }}>
                    <span className="material-icons">{item.icon}</span>
                  </div>
                  <div className="menu-info">
                    <h4>{item.label}</h4>
                    <p>{item.description}</p>
                  </div>
                  <span className="material-icons arrow">chevron_right</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Info / Main Company Data */}
          <div className="info-section">
            <div className="section-header-row">
              <h3 className="section-title">Informasi Perusahaan</h3>
              {editMode ? (
                <div className="header-edit-actions">
                  <button className="cancel-text-btn" onClick={handleCancel}>Batal</button>
                  <button className="save-mini-btn" onClick={handleSaveInfo} disabled={isSaving}>
                    <span className="material-icons">{isSaving ? "sync" : "save"}</span>
                    {isSaving ? "Proses..." : "Simpan"}
                  </button>
                </div>
              ) : (
                <button className="edit-text-btn" onClick={startEdit}>
                  <span className="material-icons">edit</span>
                  Ubah Data
                </button>
              )}
            </div>

            <div className="info-card">
              <div className="info-row">
                <div className="info-icon">
                  <span className="material-icons">business</span>
                </div>
                <div className="info-content">
                  <label>Nama Perusahaan</label>
                  {editMode ? (
                    <input 
                      type="text" 
                      value={editedInfo?.name} 
                      onChange={(e) => setEditedInfo(prev => prev ? {...prev, name: e.target.value} : null)}
                      className="edit-input"
                    />
                  ) : (
                    <span>{companyInfo.name}</span>
                  )}
                </div>
              </div>

              <div className="info-row">
                <div className="info-icon">
                  <span className="material-icons">badge</span>
                </div>
                <div className="info-content">
                  <label>ID Perusahaan</label>
                  <span>{companyInfo.idPerusahaan}</span>
                </div>
              </div>

              <div className="info-row">
                <div className="info-icon">
                  <span className="material-icons">location_on</span>
                </div>
                <div className="info-content">
                  <label>Alamat</label>
                  {editMode ? (
                    <textarea 
                      value={editedInfo?.address} 
                      onChange={(e) => setEditedInfo(prev => prev ? {...prev, address: e.target.value} : null)}
                      className="edit-textarea"
                      rows={2}
                    />
                  ) : (
                    <span>{companyInfo.address}</span>
                  )}
                </div>
              </div>

              <div className="info-row">
                <div className="info-icon">
                  <span className="material-icons">phone</span>
                </div>
                <div className="info-content">
                  <label>Telepon</label>
                  {editMode ? (
                    <input 
                      type="tel" 
                      value={editedInfo?.phone} 
                      onChange={(e) => setEditedInfo(prev => prev ? {...prev, phone: e.target.value} : null)}
                      className="edit-input"
                    />
                  ) : (
                    <span>{companyInfo.phone}</span>
                  )}
                </div>
              </div>

              <div className="info-row">
                <div className="info-icon" style={{ color: "#25D366" }}>
                  <span className="material-icons">chat</span>
                </div>
                <div className="info-content">
                  <label>WhatsApp</label>
                  {editMode ? (
                    <input 
                      type="tel" 
                      value={editedInfo?.whatsapp} 
                      onChange={(e) => setEditedInfo(prev => prev ? {...prev, whatsapp: e.target.value} : null)}
                      className="edit-input"
                    />
                  ) : (
                    <span>{companyInfo.whatsapp}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Additional info & actions */}
        <div className="side-col">
          <div className="settings-section">
            <h3 className="section-title">Informasi Tambahan</h3>
            <div className="settings-list">
              {settingsItems.map((item, index) => (
                <div 
                  key={index} 
                  className="settings-item"
                  onClick={() => handleNavigate(item.href, item.external)}
                >
                  <div className="settings-icon">
                    <span className="material-icons">{item.icon}</span>
                  </div>
                  <div className="settings-content">
                    <h4>{item.label}</h4>
                    <p>{item.description}</p>
                  </div>
                  <span className="material-icons">
                    {item.external ? "open_in_new" : "chevron_right"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="metadata-card">
             <div className="meta-item">
                <span className="material-icons">verified_user</span>
                <div>
                   <label>Status Akun</label>
                   <p>Terverifikasi</p>
                </div>
             </div>
             <div className="meta-item">
                <span className="material-icons">update</span>
                <div>
                   <label>Terakhir Diubah</label>
                   <p>Baru saja</p>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* Logo Change Modal */}
      {showLogoModal && (
        <div className="modal-overlay" onClick={() => setShowLogoModal(false)}>
          <div className="logo-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Ubah Logo Perusahaan</h2>
              <button className="close-btn" onClick={() => setShowLogoModal(false)}>
                <span className="material-icons">close</span>
              </button>
            </div>
            <div className="modal-body">
              <div className="current-logo">
                <Image
                  src={companyInfo.logo}
                  alt={companyInfo.name}
                  width={120}
                  height={120}
                  className="preview-logo"
                />
              </div>
              <div className="upload-options">
                <button className="upload-btn" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                  <span className="material-icons">photo_library</span>
                  {isUploading ? "Mengupload..." : "Pilih dari Galeri"}
                </button>
              </div>
              <p className="upload-hint">Format yang didukung: JPG, PNG, SVG. Maksimal 2MB</p>
            </div>
            <div className="modal-footer">
              <button className="secondary-btn" onClick={() => setShowLogoModal(false)}>Batal</button>
              <button className="primary-btn" onClick={() => setShowLogoModal(false)}>
                <span className="material-icons">save</span>
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .company-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }

        .layout-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 32px;
          align-items: start;
        }

        @media (min-width: 1024px) {
          .layout-grid {
            grid-template-columns: 2fr 1fr;
          }
        }

        .main-col {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .side-col {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .metadata-card {
           background: #f8fafc;
           border-radius: 16px;
           padding: 24px;
           border: 1px dashed #e2e8f0;
           display: flex;
           flex-direction: column;
           gap: 16px;
        }

        .meta-item {
           display: flex;
           align-items: center;
           gap: 12px;
        }

        .meta-item .material-icons {
           color: #94a3b8;
           font-size: 20px;
        }

        .meta-item label {
           display: block;
           font-size: 11px;
           color: #94a3b8;
           text-transform: uppercase;
           letter-spacing: 0.5px;
        }

        .meta-item p {
           margin: 0;
           font-size: 13px;
           font-weight: 600;
           color: #64748b;
        }

        .toast {
          position: fixed;
          top: 20px;
          right: 20px;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 500;
          z-index: 1000;
          animation: slideIn 0.3s ease;
        }

        .toast.success { background: #dcfce7; color: #16a34a; }
        .toast.error { background: #fee2e2; color: #dc2626; }

        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }

        .company-header {
          background: linear-gradient(135deg, #f8fafc 0%, #fff 100%);
          border-radius: 24px;
          padding: 40px;
          margin-bottom: 24px;
          border: 1px solid #f1f5f9;
        }

        .logo-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 20px;
        }

        @media (min-width: 1024px) {
          .logo-section {
            flex-direction: row;
            text-align: left;
            align-items: center;
          }
        }

        .logo-wrapper {
          position: relative;
          width: 100px;
          height: 100px;
          border-radius: 50%;
          overflow: hidden;
          cursor: pointer;
          background: white;
          border: 3px solid #f1f5f9;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .logo-wrapper:hover .logo-overlay {
          opacity: 1;
        }

        .company-logo {
          object-fit: contain;
        }

        .logo-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.2s;
        }

        .logo-overlay .material-icons {
          color: white;
          font-size: 28px;
        }

        .company-header h1 {
          font-size: 22px;
          font-weight: 700;
          color: #1e293b;
          margin: 0;
          flex: 1;
        }

        @media (max-width: 1024px) {
          .company-header h1 {
             margin-bottom: 12px;
             font-size: 20px;
          }
        }

        .change-logo-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          background: #0066FF;
          color: white;
          border: none;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          font-family: 'Montserrat', sans-serif;
          transition: all 0.2s;
        }

        .change-logo-btn:hover {
          background: #0052CC;
        }

        .change-logo-btn .material-icons {
          font-size: 16px;
        }

        .section-title {
          font-size: 14px;
          font-weight: 600;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin: 0 0 16px 0;
        }

        .menu-section, .info-section, .settings-section {
          margin-bottom: 32px;
        }

        .menu-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
        }

        @media (min-width: 640px) {
          .menu-grid {
            grid-template-columns: 1fr 1fr;
          }
        }

        .menu-card {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 20px;
          background: white;
          border-radius: 16px;
          border: 1px solid #f1f5f9;
          cursor: pointer;
          transition: all 0.2s;
        }

        .menu-card:hover {
          border-color: #e2e8f0;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
          transform: translateX(4px);
        }

        .menu-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .menu-icon .material-icons {
          font-size: 24px;
        }

        .menu-info {
          flex: 1;
        }

        .menu-info h4 {
          font-size: 15px;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 2px 0;
        }

        .menu-info p {
          font-size: 13px;
          color: #94a3b8;
          margin: 0;
        }

        .arrow {
          color: #94a3b8;
        }

        .info-card {
          background: white;
          border-radius: 16px;
          border: 1px solid #f1f5f9;
          overflow: hidden;
        }

        .info-row {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px 20px;
          border-bottom: 1px solid #f1f5f9;
          cursor: pointer;
          transition: background 0.2s;
        }

        .info-row:last-child {
          border-bottom: none;
        }

        .info-row:hover {
          background: #f8fafc;
        }

        .info-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: #f1f5f9;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .info-icon .material-icons {
          font-size: 20px;
          color: #64748b;
        }

        .info-content {
          flex: 1;
        }

        .info-content label {
          display: block;
          font-size: 12px;
          color: #94a3b8;
          margin-bottom: 2px;
        }

        .info-content span {
          font-size: 14px;
          color: #1e293b;
          font-weight: 500;
        }

        .edit-icon {
          color: #0066FF;
          font-size: 18px;
        }

        .settings-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .settings-item {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px 20px;
          background: white;
          border-radius: 12px;
          border: 1px solid #f1f5f9;
          cursor: pointer;
          transition: all 0.2s;
        }

        .settings-item:hover {
          border-color: #e2e8f0;
          background: #fafafa;
        }

        .settings-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: #f1f5f9;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .settings-icon .material-icons {
          font-size: 20px;
          color: #64748b;
        }

        .settings-content {
          flex: 1;
        }

        .settings-content h4 {
          font-size: 14px;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 2px 0;
        }

        .settings-content p {
          font-size: 12px;
          color: #94a3b8;
          margin: 0;
        }

        .settings-item > .material-icons {
          color: #94a3b8;
          font-size: 20px;
        }

        .section-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .section-header-row .section-title {
          margin-bottom: 0;
        }

        .edit-text-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          background: #eff6ff;
          color: #0066FF;
          border: none;
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .edit-text-btn:hover {
          background: #dbeafe;
        }

        .header-edit-actions {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .cancel-text-btn {
          background: none;
          border: none;
          color: #64748b;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
        }

        .save-mini-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          background: #0066FF;
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
        }

        .edit-input, .edit-textarea {
          width: 100%;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 8px 12px;
          font-size: 14px;
          font-family: inherit;
          color: #1e293b;
          margin-top: 4px;
          outline: none;
          transition: border-color 0.2s;
        }

        .edit-input:focus, .edit-textarea:focus {
          border-color: #0066FF;
        }

        .edit-textarea {
          resize: vertical;
        }

        /* Modal */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .logo-modal {
          background: white;
          width: 100%;
          max-width: 400px;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 25px 50px rgba(0,0,0,0.2);
        }

        .modal-header {
          padding: 20px 24px;
          border-bottom: 1px solid #f1f5f9;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .modal-header h2 {
          font-size: 18px;
          font-weight: 700;
          color: #1e293b;
          margin: 0;
        }

        .close-btn {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          border: none;
          background: #f1f5f9;
          color: #64748b;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .modal-body {
          padding: 24px;
          text-align: center;
        }

        .current-logo {
          margin-bottom: 24px;
        }

        .preview-logo {
          border-radius: 20px;
          border: 3px solid #f1f5f9;
        }

        .upload-options {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 16px;
        }

        .upload-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 14px;
          background: #f8fafc;
          border: 1px dashed #e2e8f0;
          border-radius: 12px;
          color: #64748b;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          font-family: 'Montserrat', sans-serif;
          transition: all 0.2s;
        }

        .upload-btn:hover {
          border-color: #0066FF;
          color: #0066FF;
          background: #eff6ff;
        }

        .upload-hint {
          font-size: 12px;
          color: #94a3b8;
          margin: 0;
        }

        .modal-footer {
          padding: 16px 24px;
          border-top: 1px solid #f1f5f9;
          display: flex;
          gap: 12px;
          justify-content: flex-end;
        }

        .primary-btn, .secondary-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          border-radius: 10px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          font-family: 'Montserrat', sans-serif;
          border: none;
          transition: all 0.2s;
        }

        .primary-btn {
          background: #0066FF;
          color: white;
        }

        .primary-btn:hover {
          background: #0052CC;
        }

        .secondary-btn {
          background: #f1f5f9;
          color: #64748b;
        }
      `}</style>
    </div>
  );
}
