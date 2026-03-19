"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getUserData } from "@/lib/auth";
import {
  fetchStatLaporan,
  fetchStatTugas,
  fetchStatKehadiran,
  fetchStatReimburse,
  fetchKinerja,
} from "@/services/arsipService";

export default function ArsipAnalyticsPage() {
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
  });
  
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });
  const [emailFilter, setEmailFilter] = useState("");

  const userData = getUserData();
  const idperusahaan = userData?.idPerusahaan || userData?.idperusahaan || "CLVREW";

  const { data: analyticsData, isLoading, error, refetch } = useQuery({
    queryKey: ["arsip-analytics", idperusahaan, startDate, endDate, emailFilter],
    queryFn: async () => {
      const monthFormat = startDate.substring(0, 7); // Format YYYY-MM
      // Use Promise.all to fetch everything in parallel
      const [izinStats, tugasStats, kehadiranStats, reimburseStats, kinerjaStats] = await Promise.all([
        fetchStatLaporan(idperusahaan, startDate + "T00:00:00Z", endDate + "T23:59:59Z", emailFilter),
        fetchStatTugas(idperusahaan, startDate + "T00:00:00Z", endDate + "T23:59:59Z", emailFilter),
        fetchStatKehadiran(idperusahaan, startDate + "T00:00:00Z", endDate + "T23:59:59Z", emailFilter),
        fetchStatReimburse(idperusahaan, startDate + "T00:00:00Z", endDate + "T23:59:59Z", emailFilter),
        fetchKinerja(idperusahaan, monthFormat),
      ]);

      return {
        izinStats,
        tugasStats,
        kehadiranStats,
        reimburseStats,
        kinerjaStats,
      };
    },
    refetchOnWindowFocus: false,
  });

  const izinStats = analyticsData?.izinStats;
  const tugasStats = analyticsData?.tugasStats;
  const kehadiranStats = analyticsData?.kehadiranStats;
  const reimburseStats = analyticsData?.reimburseStats;
  const kinerjaStats = analyticsData?.kinerjaStats;

  return (
    <div className="analytics-container">
      <div className="page-header">
        <div className="header-titles">
          <h1>Analytics & Reporting</h1>
          <p>Statistik performa dan pengajuan arsip perusahaan</p>
        </div>
        <div className="filters">
          <input
            type="email"
            placeholder="Cari Email Pegawai (Opsional)"
            value={emailFilter}
            onChange={(e) => setEmailFilter(e.target.value)}
            className="filter-input"
          />
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="filter-date"
          />
          <span className="separator">-</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="filter-date"
          />
          <button className="primary-btn" onClick={() => refetch()} disabled={isLoading}>
            <span className="material-icons">{isLoading ? "hourglass_empty" : "refresh"}</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="loading-state">
          Memuat data analytics...
        </div>
      ) : error ? (
        <div className="error-state">
          Gagal mengambil data: {(error as Error).message}
        </div>
      ) : (
        <div className="dashboard-grid">
          {/* Kehadiran KPI Cards */}
          <div className="card full-width">
            <h2 className="card-title">Statistik Kehadiran</h2>
            <div className="kpi-grid">
              <div className="kpi-card">
                <h3>Total Kehadiran</h3>
                <div className="value">{kehadiranStats?.totalHadir || 0}</div>
                <div className="sub-value">Dari {kehadiranStats?.totalHariKerja || 0} Hari Kerja</div>
              </div>
              <div className="kpi-card warning">
                <h3>Terlambat</h3>
                <div className="value">{kehadiranStats?.totalTerlambat || 0}</div>
                <div className="sub-value">Insiden Terlambat</div>
              </div>
              <div className="kpi-card danger">
                <h3>Tidak Hadir</h3>
                <div className="value">{kehadiranStats?.totalTidakHadir || 0}</div>
                <div className="sub-value">Alpha / Mangkir</div>
              </div>
              <div className="kpi-card success">
                <h3>Persentase</h3>
                <div className="value">{(kehadiranStats?.persentaseKehadiran || 0).toFixed(1)}%</div>
                <div className="sub-value">Tingkat Kehadiran</div>
              </div>
            </div>
          </div>

          {/* Izin Pie Chart Data Summary */}
          <div className="card">
            <h2 className="card-title">Status Izin & Cuti</h2>
            <div className="flex-summary">
              <div className="summary-item">
                <span className="label">Total Pengajuan</span>
                <span className="value">{izinStats?.totalIzin || 0}</span>
              </div>
              <div className="summary-item text-green">
                <span className="label">Disetujui</span>
                <span className="value">{izinStats?.disetujui || 0}</span>
              </div>
              <div className="summary-item text-red">
                <span className="label">Ditolak</span>
                <span className="value">{izinStats?.ditolak || 0}</span>
              </div>
              <div className="summary-item text-orange">
                <span className="label">Pending</span>
                <span className="value">{izinStats?.pending || 0}</span>
              </div>
            </div>
            <div className="breakdown">
              <h3>Berdasarkan Jenis:</h3>
              <p>Cuti Tahunan: {izinStats?.byJenis.cutiTahunan || 0}</p>
              <p>Sakit: {izinStats?.byJenis.sakit || 0}</p>
              <p>Lainnya: {izinStats?.byJenis.lainnya || 0}</p>
            </div>
          </div>

          {/* Tugas Progress */}
          <div className="card">
            <h2 className="card-title">Penyelesaian Tugas</h2>
            <div className="progress-container">
              <div className="progress-bar-bg">
                <div 
                  className="progress-bar-fill" 
                  style={{ width: `${tugasStats?.persentaseSelesai || 0}%` }}
                />
              </div>
              <p className="progress-text">{(tugasStats?.persentaseSelesai || 0).toFixed(1)}% Selesai</p>
            </div>
            <div className="flex-summary mt-16">
              <div className="summary-item">
                <span className="label">Total Tugas</span>
                <span className="value">{tugasStats?.totalTugas || 0}</span>
              </div>
              <div className="summary-item text-green">
                <span className="label">Selesai</span>
                <span className="value">{tugasStats?.selesai || 0}</span>
              </div>
              <div className="summary-item text-blue">
                <span className="label">Proses</span>
                <span className="value">{tugasStats?.proses || 0}</span>
              </div>
              <div className="summary-item text-orange">
                <span className="label">Tertunda</span>
                <span className="value">{tugasStats?.tunda || 0}</span>
              </div>
            </div>
          </div>

          {/* Reimburse Financial */}
          <div className="card">
            <h2 className="card-title">Reimbursement Transaksi</h2>
            <div className="flex-summary">
              <div className="summary-item full text-blue">
                <span className="label">Total Nominal Pengajuan</span>
                <span className="value-huge">Rp {(reimburseStats?.totalNominal || 0).toLocaleString('id-ID')}</span>
              </div>
              <div className="summary-item full text-green mt-8">
                <span className="label">Nominal Disetujui</span>
                <span className="value-huge">Rp {(reimburseStats?.nominalDisetujui || 0).toLocaleString('id-ID')}</span>
              </div>
            </div>
            <div className="flex-summary mt-16 metrics-small">
              <div className="summary-item">
                <span className="label">Total Klaim</span>
                <span className="value">{reimburseStats?.totalPengajuan || 0}</span>
              </div>
              <div className="summary-item text-green">
                <span className="label">ACC</span>
                <span className="value">{reimburseStats?.disetujui || 0}</span>
              </div>
              <div className="summary-item text-red">
                <span className="label">Reject</span>
                <span className="value">{reimburseStats?.ditolak || 0}</span>
              </div>
              <div className="summary-item text-orange">
                <span className="label">Hold</span>
                <span className="value">{reimburseStats?.pending || 0}</span>
              </div>
            </div>
          </div>

          {/* Kinerja Bulanan */}
          <div className="card">
            <h2 className="card-title">Rangkuman Kinerja ({startDate.substring(0, 7)})</h2>
            <div className="kpi-list">
              <div className="kpi-row">
                <span className="material-icons text-green">how_to_reg</span>
                <div>
                  <div className="kpi-label">Hadir</div>
                  <div className="kpi-val">{kinerjaStats?.totalHadir || 0} x</div>
                </div>
              </div>
              <div className="kpi-row">
                <span className="material-icons text-blue">event_note</span>
                <div>
                  <div className="kpi-label">Izin / Cuti</div>
                  <div className="kpi-val">{kinerjaStats?.totalIzin || 0} x</div>
                </div>
              </div>
              <div className="kpi-row">
                <span className="material-icons text-red">timer_off</span>
                <div>
                  <div className="kpi-label">Terlambat</div>
                  <div className="kpi-val">{kinerjaStats?.totalTerlambat || 0} x</div>
                </div>
              </div>
              <div className="kpi-row block-bottom">
                <span className="material-icons text-purple">insert_chart_outlined</span>
                <div>
                  <div className="kpi-label">Overall Rate</div>
                  <div className="kpi-val">{(kinerjaStats?.persentaseKehadiran || 0).toFixed(1)}%</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .analytics-container {
          padding: 24px;
          max-width: 1200px;
          margin: 0 auto;
          font-family: 'Montserrat', sans-serif;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 24px;
          flex-wrap: wrap;
          gap: 16px;
        }

        .header-titles h1 {
          font-size: 24px;
          color: #1e293b;
          margin: 0 0 4px 0;
        }

        .header-titles p {
          color: #64748b;
          margin: 0;
          font-size: 14px;
        }

        .filters {
          display: flex;
          gap: 12px;
          align-items: center;
          flex-wrap: wrap;
        }

        .filter-input, .filter-date {
          padding: 10px 14px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          outline: none;
          font-family: inherit;
        }

        .filter-input {
          min-width: 200px;
        }

        .primary-btn {
          background: #7b68ee;
          color: white;
          border: none;
          padding: 8px 12px;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
        }
        
        .primary-btn:hover:not(:disabled) {
          background: #6d5ce7;
        }

        .primary-btn:disabled {
          background: #cbd5e1;
          cursor: not-allowed;
        }

        .dashboard-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
        }

        .full-width {
          grid-column: 1 / -1;
        }

        .card {
          background: white;
          padding: 24px;
          border-radius: 16px;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
          border: 1px solid #f1f5f9;
        }

        .card-title {
          font-size: 16px;
          margin: 0 0 20px 0;
          color: #334155;
          font-weight: 700;
        }

        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }

        @media (max-width: 768px) {
          .kpi-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        .kpi-card {
          background: #f8fafc;
          padding: 16px;
          border-radius: 12px;
          border-left: 4px solid #3b82f6;
        }

        .kpi-card.warning { border-color: #f59e0b; }
        .kpi-card.danger { border-color: #ef4444; }
        .kpi-card.success { border-color: #10b981; }

        .kpi-card h3 {
          font-size: 12px;
          color: #64748b;
          margin: 0 0 8px 0;
        }

        .kpi-card .value {
          font-size: 28px;
          font-weight: 700;
          color: #1e293b;
        }

        .kpi-card .sub-value {
          font-size: 11px;
          color: #94a3b8;
          margin-top: 4px;
        }

        .flex-summary {
          display: flex;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
        }

        .summary-item {
          display: flex;
          flex-direction: column;
        }

        .summary-item.full {
          width: 100%;
        }

        .summary-item .label {
          font-size: 12px;
          color: #64748b;
          margin-bottom: 4px;
        }

        .summary-item .value {
          font-size: 20px;
          font-weight: 700;
          color: #1e293b;
        }

        .summary-item .value-huge {
          font-size: 24px;
          font-weight: 700;
        }

        .text-green * { color: #10b981 !important; }
        .text-red * { color: #ef4444 !important; }
        .text-orange * { color: #f59e0b !important; }
        .text-blue * { color: #3b82f6 !important; }
        .text-purple * { color: #8b5cf6 !important; }

        .breakdown {
          margin-top: 20px;
          padding-top: 16px;
          border-top: 1px solid #f1f5f9;
        }

        .breakdown h3 {
          font-size: 13px;
          color: #475569;
          margin: 0 0 12px 0;
        }
        
        .breakdown p {
          font-size: 13px;
          color: #64748b;
          margin: 4px 0;
          display: flex;
          justify-content: space-between;
        }

        .progress-container {
          margin-top: 16px;
        }

        .progress-bar-bg {
          width: 100%;
          height: 8px;
          background: #f1f5f9;
          border-radius: 4px;
          overflow: hidden;
        }

        .progress-bar-fill {
          height: 100%;
          background: #7b68ee;
          border-radius: 4px;
          transition: width 0.5s ease;
        }

        .progress-text {
          font-size: 12px;
          color: #64748b;
          margin-top: 8px;
          text-align: right;
          font-weight: 600;
        }

        .mt-16 { margin-top: 16px; }
        .mt-8 { margin-top: 8px; }

        .kpi-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .kpi-row {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .kpi-row .material-icons {
          background: #f8fafc;
          padding: 8px;
          border-radius: 8px;
        }

        .kpi-label {
          font-size: 12px;
          color: #64748b;
        }

        .kpi-val {
          font-size: 16px;
          font-weight: 600;
          color: #1e293b;
        }

        .loading-state, .error-state {
          padding: 40px;
          text-align: center;
          background: white;
          border-radius: 12px;
          font-weight: 500;
          color: #64748b;
        }

        .error-state {
          color: #ef4444;
          background: #fef2f2;
        }
      `}</style>
    </div>
  );
}
