"use client";

import { useState } from "react";
import { getUserData } from "@/lib/auth";
import { getUserProfile } from "@/services/profileService";

interface ArchiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  type: "attendance" | "leave" | "reimburse" | "tasks";
}

const BASE_URL = "https://asia-southeast2-hora-7394b.cloudfunctions.net/api";

export default function ArchiveModal({ isOpen, onClose, title, type }: ArchiveModalProps) {
  const [selectedYear, setSelectedYear] = useState(2025);
  const [showYearSelector, setShowYearSelector] = useState(false);
  const [loadingMonth, setLoadingMonth] = useState<string | null>(null);

  if (!isOpen) return null;

  const months = [
    "Desember", "November", "Oktober", "September", "Agustus", "Juli",
    "Juni", "Mei", "April", "Maret", "Februari", "Januari"
  ];

  const years = Array.from({ length: 12 }, (_, i) => 2025 - i); // 2025 down to 2014

  const handleSendEmail = async (month: string, index: number) => {
    // months array: index 0 (Desember) -> month 12. index 11 (Januari) -> month 1.
    const monthNumber = 12 - index;
    const tglstart = `${selectedYear}-${String(monthNumber).padStart(2, "0")}-01`;
    // Get last day of the selected month
    const lastDay = new Date(selectedYear, monthNumber, 0).getDate();
    const tglend = `${selectedYear}-${String(monthNumber).padStart(2, "0")}-${lastDay}`;

    const user = getUserData();
    if (!user) {
      alert("Harap login kembali untuk melanjutkan.");
      return;
    }

    let idperusahaan = user.companyId || user.idPerusahaan || user.idperusahaan;
    const emailrep = user.email || "doni.smpn1@gmail.com";

    try {
      if (!idperusahaan && user.email) {
        const profile = await getUserProfile(user.email);
        if (profile?.idPerusahaan) {
          idperusahaan = profile.idPerusahaan;
        }
      }
    } catch (e) {
      console.error("Failed to fallback idperusahaan", e);
    }

    idperusahaan = idperusahaan || "CLVREW";

    let endpoint = "";
    if (type === "tasks") endpoint = "/arsip/statlaporan";
    else if (type === "attendance" || type === "leave") endpoint = "/arsip/statkehadiran";
    else if (type === "reimburse") endpoint = "/arsip/statreimburse";

    const url = `${BASE_URL}${endpoint}?idperusahaan=${idperusahaan}&tglstart=${tglstart}&tglend=${tglend}&emailrep=${encodeURIComponent(emailrep)}`;

    try {
      setLoadingMonth(month);
      const res = await fetch(url);
      const text = await res.text();
      let data: any = {};
      try { data = JSON.parse(text); } catch(e) { data = { message: text }; }

      if (res.ok || data.success || (typeof data.message === "string" && data.message.toLowerCase().includes("emailed"))) {
        alert(`Laporan ${title} bulan ${month} ${selectedYear} sukses dikirim ke ${emailrep}.`);
      } else {
        alert(`Gagal mengirim arsip: ${data.message || "Kesalahan pada server"}`);
      }
    } catch (err: any) {
      console.error(err);
      alert(`Terjadi kesalahan jaringan: ${err.message}`);
    } finally {
      setLoadingMonth(null);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="header-left">
            <button className="back-btn" onClick={onClose}>
              <span className="material-icons">arrow_back</span>
            </button>
            <h2>{title}</h2>
          </div>
          <div className="header-actions">
            <span className="material-icons">search</span>
            <span className="material-icons">filter_list</span>
          </div>
        </div>

        {/* Year Selector */}
        <div className="year-selector-container">
          <div className="year-display">
            <span className="year-text">{selectedYear}</span>
            <button className="edit-year-btn" onClick={() => setShowYearSelector(true)}>
              <span className="material-icons">edit</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="modal-content">
          {showYearSelector ? (
            <div className="year-grid">
              {years.map((year) => (
                <button
                  key={year}
                  className={`year-item ${selectedYear === year ? "active" : ""}`}
                  onClick={() => {
                    setSelectedYear(year);
                    setShowYearSelector(false);
                  }}
                >
                  {year}
                </button>
              ))}
            </div>
          ) : (
            <div className="month-list">
              {months.map((month, index) => (
                <div key={month} className="month-item">
                  <div className="month-info">
                    <span className="material-icons item-icon">calendar_today</span>
                    <div className="text-info">
                      <span className="month-name">{month}</span>
                      <span className="file-size" style={{color: "#2563eb"}}>Arsip Siap</span>
                    </div>
                  </div>
                  <button 
                    className="send-email-btn"
                    onClick={() => handleSendEmail(month, index)}
                    disabled={loadingMonth === month}
                  >
                    {loadingMonth === month ? "Mengirim..." : "Kirim Email"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1100;
        }

        .modal-card {
          background: #fafafa;
          width: 100%;
          max-width: 400px;
          height: 80vh;
          border-radius: 24px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          box-shadow: 0 20px 40px rgba(0,0,0,0.2);
          position: relative;
        }

        .modal-header {
          padding: 20px;
          background: white;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #f0f0f0;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .header-left h2 {
          font-size: 18px;
          font-weight: 700;
          color: #1e293b;
          margin: 0;
        }

        .back-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: #1e293b;
          padding: 4px;
          display: flex;
        }

        .header-actions {
          display: flex;
          gap: 16px;
          color: #64748b;
        }

        .header-actions .material-icons {
          font-size: 20px;
          cursor: pointer;
        }

        .year-selector-container {
          padding: 24px 24px 12px;
          background: #fafafa;
        }

        .year-display {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: white;
          padding: 16px 20px;
          border-radius: 16px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.02);
        }

        .year-text {
          font-size: 24px;
          font-weight: 700;
          color: #1e293b;
        }

        .edit-year-btn {
          background: none;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          padding: 4px;
        }

        .modal-content {
          flex: 1;
          overflow-y: auto;
          padding: 12px 24px 24px;
        }

        /* Month List */
        .month-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .month-item {
          background: white;
          padding: 16px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          box-shadow: 0 2px 4px rgba(0,0,0,0.02);
        }

        .month-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .item-icon {
          color: #1e293b;
          font-size: 20px;
        }

        .text-info {
          display: flex;
          flex-direction: column;
        }

        .month-name {
          font-size: 14px;
          font-weight: 600;
          color: #1e293b;
        }

        .file-size {
          font-size: 11px;
          color: #94a3b8;
        }

        .send-email-btn {
          background: #7c3aed; /* Purple from reference */
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          font-family: 'Montserrat', sans-serif;
          white-space: nowrap;
        }

        .send-email-btn:hover {
          background: #6d28d9;
        }

        /* Year Grid */
        .year-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          padding-top: 12px;
        }

        .year-item {
          background: white;
          border: none;
          padding: 16px;
          border-radius: 12px;
          font-size: 14px;
          color: #64748b;
          font-weight: 500;
          cursor: pointer;
          font-family: 'Montserrat', sans-serif;
          transition: all 0.2s;
        }

        .year-item:hover {
          background: #f1f5f9;
          color: #1e293b;
        }

        .year-item.active {
          background: #7c3aed;
          color: white;
          box-shadow: 0 4px 12px rgba(124, 58, 237, 0.2);
        }
      `}</style>
    </div>
  );
}
