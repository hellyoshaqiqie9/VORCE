"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getUserData, getAccessToken } from "@/lib/auth";

const BASE_URL = "https://asia-southeast2-hora-7394b.cloudfunctions.net/api";

type TabType = "hadir" | "izin" | "reimburse" | "tugas";

const TABS: { key: TabType; label: string }[] = [
  { key: "hadir", label: "Hadir" },
  { key: "izin", label: "Izin" },
  { key: "reimburse", label: "Reimburse" },
  { key: "tugas", label: "Tugas" },
];

const MONTH_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

const API_MAP: Record<TabType, string> = {
  hadir: "statkehadiran",
  izin: "statlaporan",
  reimburse: "statreimburse",
  tugas: "stattugas",
};

async function fetchArsipData(
  tab: TabType,
  idperusahaan: string,
  tglstart: string,
  tglend: string,
  emailrep: string
) {
  const token = getAccessToken();
  const endpoint = API_MAP[tab];
  const url = new URL(`${BASE_URL}/api/arsip/${endpoint}`);
  url.searchParams.append("idperusahaan", idperusahaan);
  url.searchParams.append("tglstart", tglstart);
  url.searchParams.append("tglend", tglend);
  url.searchParams.append("emailrep", emailrep);

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    console.error(`fetchArsip ${tab} error:`, res.status);
    return null;
  }

  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    // API might return a plain string like "Report sent to email"
    return { message: text };
  }
}

function getMonthsForYear(year: number): { month: number; name: string; startDate: string; endDate: string }[] {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed

  const months = [];
  const maxMonth = year === currentYear ? currentMonth : 11;

  for (let m = 0; m <= maxMonth; m++) {
    const mm = String(m + 1).padStart(2, "0");
    const lastDay = new Date(year, m + 1, 0).getDate();
    months.push({
      month: m,
      name: MONTH_NAMES[m],
      startDate: `${year}-${mm}-01T00:00:00Z`,
      endDate: `${year}-${mm}-${String(lastDay).padStart(2, "0")}T23:59:59Z`,
    });
  }

  return months;
}


export default function ArsipPage() {
  const userData = getUserData();
  const idperusahaan = userData?.idPerusahaan || userData?.idperusahaan || "";
  const userEmail = userData?.email || userData?.id || "";

  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as TabType) || "hadir";

  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  
  useEffect(() => {
    const tabFromUrl = searchParams.get("tab");
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl as TabType);
    }
  }, [searchParams]);

  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());
  const [sendingMonth, setSendingMonth] = useState<number | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const months = useMemo(() => getMonthsForYear(selectedYear), [selectedYear]);

  const currentYear = new Date().getFullYear();
  const years = useMemo(() => {
    const arr = [];
    for (let y = currentYear; y >= currentYear - 3; y--) arr.push(y);
    return arr;
  }, [currentYear]);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSendToEmail = async (monthIdx: number) => {
    const m = months[monthIdx];
    if (!m || !idperusahaan || !userEmail) {
      showToast("error", "Data login tidak lengkap");
      return;
    }

    setSendingMonth(monthIdx);
    try {
      const result = await fetchArsipData(activeTab, idperusahaan, m.startDate, m.endDate, userEmail);
      if (result) {
        showToast("success", `Laporan ${TABS.find(t => t.key === activeTab)?.label} ${m.name} ${selectedYear} berhasil diproses`);
      } else {
        showToast("error", "Gagal memproses laporan");
      }
    } catch (e) {
      showToast("error", "Terjadi kesalahan saat memproses");
    } finally {
      setSendingMonth(null);
    }
  };

  return (
    <div className="arsip-container">
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
          <h1>Arsip</h1>
          <p>Laporan bulanan perusahaan</p>
        </div>
        <div className="year-selector">
          <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-container">
        {TABS.map(tab => (
          <button
            key={tab.key}
            className={`tab-btn ${activeTab === tab.key ? "active" : ""}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Year Label */}
      <div className="year-label">{selectedYear}</div>

      {/* Monthly List */}
      <div className="months-list">
        {months.map((m, idx) => (
          <div key={idx} className="month-card">
            <div className="month-info">
              <span className="material-icons month-icon">calendar_month</span>
              <span className="month-name">{m.name}</span>
            </div>
            <button
              className={`send-btn ${sendingMonth === idx ? "loading" : ""}`}
              onClick={() => handleSendToEmail(idx)}
              disabled={sendingMonth === idx}
            >
              {sendingMonth === idx ? (
                <span className="material-icons spin">hourglass_empty</span>
              ) : (
                "Kirim ke email"
              )}
            </button>
          </div>
        ))}
      </div>

      {/* Info Note */}
      <div className="info-note">
        <span className="material-icons">info</span>
        <p>Laporan akan dikirim ke email <strong>{userEmail || "-"}</strong> sesuai data akun login Anda.</p>
      </div>

      <style jsx>{`
        .arsip-container {
          flex: 1; margin: -32px; padding: 32px; background: #fafafa; display: flex; flex-direction: column;
          
          
          font-family: 'Montserrat', sans-serif;
        }

        .toast {
          position: fixed;
          top: 24px;
          right: 24px;
          background: #10b981;
          color: white;
          padding: 12px 20px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          gap: 8px;
          z-index: 1000;
          font-weight: 500;
          font-size: 14px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          animation: slideIn 0.3s ease-out;
        }
        .toast.error {
          background: #ef4444;
        }
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 24px;
        }

        .header-left h1 {
          font-size: 28px;
          font-weight: 700;
          color: #1e293b;
          margin: 0;
        }

        .header-left p {
          color: #64748b;
          margin: 4px 0 0 0;
          font-size: 14px;
        }

        .year-selector select {
          padding: 10px 16px;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          font-family: inherit;
          font-size: 14px;
          font-weight: 600;
          color: #334155;
          background: white;
          cursor: pointer;
          outline: none;
        }
        .year-selector select:focus {
          border-color: #7b68ee;
        }

        .tabs-container {
          display: flex;
          gap: 8px;
          margin-bottom: 24px;
          overflow-x: auto;
          padding-bottom: 4px;
        }

        .tab-btn {
          padding: 10px 24px;
          border: 2px solid #e2e8f0;
          border-radius: 10px;
          background: white;
          font-family: inherit;
          font-size: 14px;
          font-weight: 600;
          color: #64748b;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
        }

        .tab-btn:hover {
          border-color: #7b68ee;
          color: #7b68ee;
        }

        .tab-btn.active {
          background: #7b68ee;
          border-color: #7b68ee;
          color: white;
        }

        .year-label {
          font-size: 16px;
          font-weight: 700;
          color: #94a3b8;
          margin-bottom: 12px;
          padding-left: 4px;
        }

        .months-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .month-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: white;
          padding: 16px 20px;
          border-radius: 14px;
          border: 1px solid #f1f5f9;
          box-shadow: 0 1px 3px rgba(0,0,0,0.04);
          transition: all 0.2s ease;
        }

        .month-card:hover {
          border-color: #e2e8f0;
          box-shadow: 0 4px 12px rgba(0,0,0,0.06);
        }

        .month-info {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .month-icon {
          color: #7b68ee;
          font-size: 24px;
        }

        .month-name {
          font-size: 16px;
          font-weight: 600;
          color: #1e293b;
        }

        .send-btn {
          padding: 8px 20px;
          background: #7b68ee;
          color: white;
          border: none;
          border-radius: 8px;
          font-family: inherit;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .send-btn:hover:not(:disabled) {
          background: #6d5ce7;
          transform: translateY(-1px);
        }

        .send-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .send-btn.loading {
          background: #94a3b8;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin {
          animation: spin 1s linear infinite;
          font-size: 18px;
        }

        .info-note {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          background: #f0f0ff;
          padding: 16px 20px;
          border-radius: 12px;
          margin-top: 24px;
        }

        .info-note .material-icons {
          color: #7b68ee;
          font-size: 20px;
          margin-top: 1px;
        }

        .info-note p {
          margin: 0;
          font-size: 13px;
          color: #475569;
          line-height: 1.5;
        }

        @media (max-width: 640px) {
          .arsip-container {
            padding: 16px;
          }
          .page-header {
            flex-direction: column;
            gap: 12px;
          }
          .tab-btn {
            padding: 8px 18px;
            font-size: 13px;
          }
          .month-card {
            padding: 14px 16px;
          }
          .month-name {
            font-size: 14px;
          }
          .send-btn {
            padding: 6px 14px;
            font-size: 12px;
          }
        }
      `}</style>
    </div>
  );
}
