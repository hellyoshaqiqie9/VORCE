"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCompanyProfile, updateCompanyProfile, changeEmail } from "@/services/profileService";

interface CompanyInfo {
  name: string;
  email: string;
  address: string;
  phone: string;
  whatsapp: string;
}

export default function InfoPage() {
  const router = useRouter();
  const [editMode, setEditMode] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({
    name: "-",
    email: "-",
    address: "-",
    phone: "-",
    whatsapp: "-",
  });

  const [editedInfo, setEditedInfo] = useState<CompanyInfo>({...companyInfo});

  // Fetch company profile on mount
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      const data = await getCompanyProfile();
      
      // Email isn't in company profile API, get it from our auth session
      const user = await import("@/lib/auth").then(m => m.getUserData());
      
      const info: CompanyInfo = {
        name: data.namaPerusahaan || "-",
        email: user?.email || "-",
        address: data.alamat || "-",
        phone: data.telepon || "-",
        whatsapp: data.telepon || "-",
      };
      setCompanyInfo(info);
      setEditedInfo(info);
    } catch (err: any) {
      console.error("Failed to load profile:", err);
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      // 1. Update Profile (Name, Address, WhatsApp, Phone)
      await updateCompanyProfile({
        namaPerusahaan: editedInfo.name,
        alamatLoc: editedInfo.address,
        noTelp: editedInfo.phone,
        noWA: editedInfo.whatsapp,
      });

      // 2. Change Email API (jika ada perubahan)
      if (editedInfo.email !== companyInfo.email) {
        await changeEmail(editedInfo.email);
      }
      setCompanyInfo(editedInfo);
      setEditMode(false);
      setShowSaveSuccess(true);
      setTimeout(() => setShowSaveSuccess(false), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal menyimpan");
      setTimeout(() => setErrorMsg(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedInfo({...companyInfo});
    setEditMode(false);
  };

  return (
    <div className="info-container">
      {/* Header */}
      <div className="page-header">
        <button className="back-btn" onClick={() => router.push("/admin/company")}>
          <span className="material-icons">arrow_back</span>
        </button>
        <h1>Info</h1>
        <div className="header-actions">
          {!editMode ? (
            <button className="edit-btn" onClick={() => setEditMode(true)}>
              <span className="material-icons">edit</span>
              Edit
            </button>
          ) : (
            <>
              <button className="cancel-btn" onClick={handleCancel}>Batal</button>
              <button className="save-btn" onClick={handleSave} disabled={isSaving}>
                <span className="material-icons">save</span>
                {isSaving ? "Menyimpan..." : "Simpan"}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Success Toast */}
      {showSaveSuccess && (
        <div className="toast success">
          <span className="material-icons">check_circle</span>
          Informasi berhasil disimpan!
        </div>
      )}

      {/* Error Toast */}
      {errorMsg && (
        <div className="toast error">
          <span className="material-icons">error</span>
          {errorMsg}
        </div>
      )}

      {/* Info Form */}
      <div className="info-card">
        <div className="info-item">
          <div className="item-icon">
            <span className="material-icons">business</span>
          </div>
          <div className="item-content">
            <label>Nama Perusahaan</label>
            {editMode ? (
              <input
                type="text"
                value={editedInfo.name}
                onChange={(e) => setEditedInfo({...editedInfo, name: e.target.value})}
                placeholder="Nama perusahaan"
              />
            ) : (
              <span className="value">{companyInfo.name}</span>
            )}
          </div>
          {editMode && <span className="material-icons edit-indicator">edit</span>}
        </div>

        <div className="info-item">
          <div className="item-icon">
            <span className="material-icons">email</span>
          </div>
          <div className="item-content">
            <label>Email</label>
            {editMode ? (
              <input
                type="email"
                value={editedInfo.email}
                onChange={(e) => setEditedInfo({...editedInfo, email: e.target.value})}
                placeholder="Email perusahaan"
              />
            ) : (
              <span className="value">{companyInfo.email}</span>
            )}
          </div>
          {editMode && <span className="material-icons edit-indicator">edit</span>}
        </div>

        <div className="info-item">
          <div className="item-icon">
            <span className="material-icons">location_on</span>
          </div>
          <div className="item-content">
            <label>Alamat</label>
            {editMode ? (
              <textarea
                value={editedInfo.address}
                onChange={(e) => setEditedInfo({...editedInfo, address: e.target.value})}
                placeholder="Alamat lengkap"
                rows={3}
              />
            ) : (
              <span className="value">{companyInfo.address}</span>
            )}
          </div>
          {editMode && <span className="material-icons edit-indicator">edit</span>}
        </div>

        <div className="info-item">
          <div className="item-icon">
            <span className="material-icons">phone</span>
          </div>
          <div className="item-content">
            <label>Telepon</label>
            {editMode ? (
              <input
                type="tel"
                value={editedInfo.phone}
                onChange={(e) => setEditedInfo({...editedInfo, phone: e.target.value})}
                placeholder="Nomor telepon"
              />
            ) : (
              <span className="value">{companyInfo.phone}</span>
            )}
          </div>
          {editMode && <span className="material-icons edit-indicator">edit</span>}
        </div>

        <div className="info-item">
          <div className="item-icon whatsapp">
            <span className="material-icons">chat</span>
          </div>
          <div className="item-content">
            <label>WhatsApp</label>
            {editMode ? (
              <input
                type="tel"
                value={editedInfo.whatsapp}
                onChange={(e) => setEditedInfo({...editedInfo, whatsapp: e.target.value})}
                placeholder="Nomor WhatsApp"
              />
            ) : (
              <span className="value">{companyInfo.whatsapp}</span>
            )}
          </div>
          {editMode && <span className="material-icons edit-indicator">edit</span>}
        </div>
      </div>

      {/* Quick Actions (view mode only) */}
      {!editMode && (
        <div className="actions-section">
          <h3>Aksi Cepat</h3>
          <div className="action-grid">
            <a href={`mailto:${companyInfo.email}`} className="action-card">
              <span className="material-icons">send</span>
              <span>Kirim Email</span>
            </a>
            <a href={`tel:${companyInfo.phone}`} className="action-card">
              <span className="material-icons">call</span>
              <span>Telepon</span>
            </a>
            <a href={`https://wa.me/${companyInfo.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" className="action-card whatsapp">
              <span className="material-icons">chat</span>
              <span>WhatsApp</span>
            </a>
            <a href={`https://maps.google.com/?q=${encodeURIComponent(companyInfo.address)}`} target="_blank" className="action-card">
              <span className="material-icons">directions</span>
              <span>Petunjuk Arah</span>
            </a>
          </div>
        </div>
      )}

      <style jsx>{`
        .info-container {
          max-width: 600px;
          margin: 0 auto;
        }

        .page-header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 24px;
        }

        .back-btn {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          border: 1px solid #e2e8f0;
          background: white;
          color: #64748b;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }

        .back-btn:hover {
          border-color: #0066FF;
          color: #0066FF;
        }

        .page-header h1 {
          font-size: 24px;
          font-weight: 700;
          color: #1e293b;
          margin: 0;
          flex: 1;
        }

        .header-actions {
          display: flex;
          gap: 12px;
        }

        .edit-btn, .save-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 10px 16px;
          background: #0066FF;
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          font-family: 'Montserrat', sans-serif;
          transition: all 0.2s;
        }

        .edit-btn:hover, .save-btn:hover {
          background: #0052CC;
        }

        .cancel-btn {
          padding: 10px 16px;
          background: #f1f5f9;
          color: #64748b;
          border: none;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          font-family: 'Montserrat', sans-serif;
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

        .toast.success {
          background: #dcfce7;
          color: #16a34a;
        }

        .toast.error {
          background: #fee2e2;
          color: #dc2626;
        }

        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        .info-card {
          background: white;
          border-radius: 20px;
          border: 1px solid #f1f5f9;
          overflow: hidden;
        }

        .info-item {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          padding: 20px;
          border-bottom: 1px solid #f1f5f9;
        }

        .info-item:last-child {
          border-bottom: none;
        }

        .item-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: #f1f5f9;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .item-icon .material-icons {
          font-size: 22px;
          color: #64748b;
        }

        .item-icon.whatsapp {
          background: #dcfce7;
        }

        .item-icon.whatsapp .material-icons {
          color: #25D366;
        }

        .item-content {
          flex: 1;
        }

        .item-content label {
          display: block;
          font-size: 12px;
          color: #94a3b8;
          margin-bottom: 6px;
          font-weight: 500;
        }

        .item-content .value {
          font-size: 15px;
          color: #1e293b;
          font-weight: 500;
          line-height: 1.5;
        }

        .item-content input, .item-content textarea {
          width: 100%;
          padding: 12px 16px;
          border: 2px solid #e2e8f0;
          border-radius: 10px;
          font-size: 14px;
          font-family: 'Montserrat', sans-serif;
          transition: all 0.2s;
          resize: none;
        }

        .item-content input:focus, .item-content textarea:focus {
          outline: none;
          border-color: #0066FF;
          box-shadow: 0 0 0 3px rgba(0, 102, 255, 0.1);
        }

        .edit-indicator {
          color: #0066FF;
          font-size: 18px;
          margin-top: 12px;
        }

        .actions-section {
          margin-top: 32px;
        }

        .actions-section h3 {
          font-size: 14px;
          font-weight: 600;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin: 0 0 16px 0;
        }

        .action-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }

        .action-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 20px;
          background: white;
          border-radius: 16px;
          border: 1px solid #f1f5f9;
          text-decoration: none;
          transition: all 0.2s;
        }

        .action-card:hover {
          border-color: #0066FF;
          box-shadow: 0 4px 12px rgba(0, 102, 255, 0.1);
          transform: translateY(-2px);
        }

        .action-card .material-icons {
          font-size: 24px;
          color: #0066FF;
        }

        .action-card span:last-child {
          font-size: 13px;
          font-weight: 600;
          color: #475569;
        }

        .action-card.whatsapp .material-icons {
          color: #25D366;
        }

        .action-card.whatsapp:hover {
          border-color: #25D366;
          box-shadow: 0 4px 12px rgba(37, 211, 102, 0.1);
        }

        @media (max-width: 500px) {
          .page-header {
            flex-wrap: wrap;
          }

          .action-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
