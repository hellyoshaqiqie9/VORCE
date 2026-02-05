"use client";

import { useState } from "react";

interface Employee {
  id: string;
  name: string;
  empId: string;
  transport: number;
  meals: number;
  medical: number;
  travel: number;
  other: number;
  total: number;
  submitDate: string;
  status: "approved" | "pending" | "rejected";
}

const mockEmployees: Employee[] = [
  { id: "1", name: "Michael Smith", empId: "EMP-3728", transport: 150, meals: 200, medical: 500, travel: 800, other: 100, total: 1750, submitDate: "Nov 4, 2025", status: "approved" },
  { id: "2", name: "Sarah Johnson", empId: "EMP-0299", transport: 120, meals: 180, medical: 300, travel: 0, other: 50, total: 650, submitDate: "Nov 4, 2025", status: "approved" },
  { id: "3", name: "David Wilson", empId: "EMP-5293", transport: 200, meals: 250, medical: 800, travel: 1200, other: 200, total: 2650, submitDate: "Nov 4, 2025", status: "pending" },
  { id: "4", name: "Emily Brown", empId: "EMP-1847", transport: 100, meals: 150, medical: 200, travel: 500, other: 0, total: 950, submitDate: "Nov 3, 2025", status: "approved" },
  { id: "5", name: "James Lee", empId: "EMP-4521", transport: 180, meals: 220, medical: 400, travel: 0, other: 150, total: 950, submitDate: "Nov 3, 2025", status: "rejected" },
  { id: "6", name: "Anna Chen", empId: "EMP-7834", transport: 90, meals: 160, medical: 600, travel: 1500, other: 80, total: 2430, submitDate: "Nov 2, 2025", status: "pending" },
];

export default function ReimbursePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showPeriodPicker, setShowPeriodPicker] = useState(false);
  const [periodStartDate, setPeriodStartDate] = useState("2025-10-04");
  const [periodEndDate, setPeriodEndDate] = useState("2025-11-03");

  const totalTransport = mockEmployees.reduce((sum, e) => sum + e.transport, 0);
  const totalMeals = mockEmployees.reduce((sum, e) => sum + e.meals, 0);
  const totalMedical = mockEmployees.reduce((sum, e) => sum + e.medical, 0);
  const totalTravel = mockEmployees.reduce((sum, e) => sum + e.travel, 0);
  const totalOther = mockEmployees.reduce((sum, e) => sum + e.other, 0);
  const grandTotal = mockEmployees.reduce((sum, e) => sum + e.total, 0);
  const totalApproved = mockEmployees.filter(e => e.status === "approved").reduce((sum, e) => sum + e.total, 0);
  const totalPending = mockEmployees.filter(e => e.status === "pending").reduce((sum, e) => sum + e.total, 0);

  const filteredEmployees = mockEmployees.filter(e => {
    const matchesSearch = e.name.toLowerCase().includes(searchQuery.toLowerCase()) || e.empId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || e.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleRowClick = (employee: Employee) => {
    setSelectedEmployee(employee);
    setShowModal(true);
  };

  return (
    <div className="reimburse-container">
      {/* Header */}
      <div className="page-header">
        <div className="header-left">
          <h1>Detail Reimburse</h1>
          <p>Kelola permintaan reimburse, lacak pengeluaran, dan tinjau laporan.</p>
        </div>
        <div className="header-actions">
          <button className="secondary-btn">
            <span className="material-icons">refresh</span>
            Segarkan
          </button>
          <button className="export-btn">
            <span className="material-icons">archive</span>
            Arsip
          </button>
        </div>
      </div>

      {/* Breakdown Cards */}
      <div className="section-header">
        <h3>Rincian Reimburse</h3>
        <div className="period-select">
          <span className="material-icons">calendar_today</span>
          <select defaultValue="nov2025">
            <option value="nov2025">November, 2025</option>
            <option value="oct2025">Oktober, 2025</option>
            <option value="sep2025">September, 2025</option>
          </select>
        </div>
      </div>

      <div className="breakdown-grid">
        <div className="breakdown-card">
          <div className="card-top">
            <div className="card-icon transport">
              <span className="material-icons">directions_car</span>
            </div>
            <span className="card-label">Transportasi</span>
            <button className="more-btn"><span className="material-icons">more_horiz</span></button>
          </div>
          <div className="card-value">${totalTransport.toLocaleString()}</div>
          <div className="card-trend neutral">
            <span>~0%</span> Tidak ada perubahan dari bulan lalu.
          </div>
        </div>

        <div className="breakdown-card">
          <div className="card-top">
            <div className="card-icon meals">
              <span className="material-icons">restaurant</span>
            </div>
            <span className="card-label">Makan</span>
            <button className="more-btn"><span className="material-icons">more_horiz</span></button>
          </div>
          <div className="card-value">${totalMeals.toLocaleString()}</div>
          <div className="card-trend positive">
            <span>↑ 12%</span> naik dari bulan lalu.
          </div>
        </div>

        <div className="breakdown-card">
          <div className="card-top">
            <div className="card-icon medical">
              <span className="material-icons">local_hospital</span>
            </div>
            <span className="card-label">Kesehatan</span>
            <button className="more-btn"><span className="material-icons">more_horiz</span></button>
          </div>
          <div className="card-value">${totalMedical.toLocaleString()}</div>
          <div className="card-trend negative">
            <span>↓ 5%</span> turun dari bulan lalu.
          </div>
        </div>

        <div className="breakdown-card">
          <div className="card-top">
            <div className="card-icon travel">
              <span className="material-icons">more_horiz</span>
            </div>
            <span className="card-label">Lainnya</span>
            <button className="more-btn"><span className="material-icons">more_horiz</span></button>
          </div>
          <div className="card-value">${totalOther.toLocaleString()}</div>
          <div className="card-trend neutral">
            <span>~0%</span> Tidak ada perubahan dari bulan lalu.
          </div>
        </div>
      </div>

      {/* Stats and Chart Section */}
      <div className="stats-chart-grid">
        {/* Reimburse Runs */}
        <div className="stats-card">
          <div className="stats-header">
            <h4>Reimburse Runs</h4>
            <button className="more-btn"><span className="material-icons">more_horiz</span></button>
          </div>
          <div className="stats-info-grid">
            <div className="stat-item clickable" onClick={() => setShowPeriodPicker(true)}>
              <span className="stat-label">Reimburse Period</span>
              <span className="stat-value period-value">
                {new Date(periodStartDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} - {new Date(periodEndDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                <span className="material-icons edit-icon">edit</span>
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Total Reimburse</span>
              <span className="stat-value">${grandTotal.toLocaleString()}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Pay Day</span>
              <span className="stat-value">Nov 3, 2025</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Status</span>
              <span className="stat-value status-badge">● Scheduled</span>
            </div>
          </div>
          <div className="pie-chart-section">
            <div className="pie-chart">
              <svg viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#e2e8f0" strokeWidth="20"/>
                <circle cx="50" cy="50" r="40" fill="none" stroke="#0066FF" strokeWidth="20" 
                  strokeDasharray={`${(totalApproved/grandTotal)*251.2} 251.2`} 
                  transform="rotate(-90 50 50)"/>
                <circle cx="50" cy="50" r="40" fill="none" stroke="#f59e0b" strokeWidth="20" 
                  strokeDasharray={`${(totalPending/grandTotal)*251.2} 251.2`} 
                  strokeDashoffset={`-${(totalApproved/grandTotal)*251.2}`}
                  transform="rotate(-90 50 50)"/>
              </svg>
            </div>
            <div className="pie-legend">
              <div className="legend-item">
                <span className="dot approved"></span>
                <span>Approved</span>
                <strong>${totalApproved.toLocaleString()}</strong>
              </div>
              <div className="legend-item">
                <span className="dot pending"></span>
                <span>Pending</span>
                <strong>${totalPending.toLocaleString()}</strong>
              </div>
            </div>
            <div className="total-box">
              <div className="total-icon"><span className="material-icons">receipt_long</span></div>
              <div>
                <span className="total-label">Total Reimburse</span>
                <span className="total-value">${grandTotal.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* History Chart */}
        <div className="chart-card">
          <div className="chart-header">
            <div>
              <h4>Riwayat Reimburse</h4>
              <div className="chart-total">
                <span className="big-value">${grandTotal.toLocaleString()}</span>
                <span className="trend-badge positive">↑ 5%</span>
              </div>
              <span className="chart-subtitle">Reimburse tahun berjalan</span>
            </div>
            <div className="chart-legend">
              <span><span className="dot transport"></span> Transportasi</span>
              <span><span className="dot meals"></span> Makan</span>
              <span><span className="dot medical"></span> Kesehatan</span>
              <span><span className="dot travel"></span> Lainnya</span>
            </div>
          </div>
          <div className="bar-chart">
            {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct"].map((month, i) => (
              <div key={month} className="bar-group">
                <div className="bars">
                  <div className="bar transport" style={{ height: `${20 + Math.random() * 30}%` }}></div>
                  <div className="bar meals" style={{ height: `${15 + Math.random() * 25}%` }}></div>
                  <div className="bar medical" style={{ height: `${25 + Math.random() * 35}%` }}></div>
                  <div className="bar travel" style={{ height: `${10 + Math.random() * 40}%` }}></div>
                </div>
                <span className="bar-label">{month}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Employee List */}
      <div className="employee-section">
        <div className="section-header-row">
          <h4>Reimburse Karyawan</h4>
          <div className="table-controls">
            <button className="filter-btn">
              <span className="material-icons">filter_list</span>
              Filter
            </button>
            <div className="search-box">
              <span className="material-icons">search</span>
              <input
                type="text"
                placeholder="Cari Karyawan"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button className="add-btn">
              <span className="material-icons">add</span>
              Tambah Permintaan
            </button>
          </div>
        </div>

        <table className="employee-table">
          <thead>
            <tr>
              <th>Nama <span className="material-icons">unfold_more</span></th>
              <th>Transportasi <span className="material-icons">unfold_more</span></th>
              <th>Makan <span className="material-icons">unfold_more</span></th>
              <th>Kesehatan <span className="material-icons">unfold_more</span></th>
              <th>Lainnya <span className="material-icons">unfold_more</span></th>
              <th>Total <span className="material-icons">unfold_more</span></th>
              <th>Tanggal <span className="material-icons">unfold_more</span></th>
              <th>Status <span className="material-icons">unfold_more</span></th>
              <th>Bukti</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filteredEmployees.map((emp) => (
              <tr key={emp.id} onClick={() => handleRowClick(emp)}>
                <td>
                  <div className="emp-cell">
                    <strong>{emp.name}</strong>
                    <span>{emp.empId}</span>
                  </div>
                </td>
                <td>${emp.transport.toLocaleString()}</td>
                <td>${emp.meals.toLocaleString()}</td>
                <td>${emp.medical.toLocaleString()}</td>
                <td>${emp.other.toLocaleString()}</td>
                <td><strong>${emp.total.toLocaleString()}</strong></td>
                <td>{emp.submitDate}</td>
                <td>
                  <span className={`status-pill ${emp.status}`}>
                    ● {emp.status === "approved" ? "Disetujui" : emp.status === "pending" ? "Pending" : "Ditolak"}
                  </span>
                </td>
                <td>
                  <button className="download-btn">Unduh</button>
                </td>
                <td>
                  <button className="action-btn"><span className="material-icons">more_horiz</span></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>


      {/* Employee Detail Modal */}
      {showModal && selectedEmployee && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>{selectedEmployee.name}</h2>
                <span className="emp-id">{selectedEmployee.empId}</span>
              </div>
              <button className="close-btn" onClick={() => setShowModal(false)}>
                <span className="material-icons">close</span>
              </button>
            </div>
            
            <div className="modal-body">
              {/* Merchant Info */}
              <div className="merchant-section">
                <div className="info-row">
                  <span className="info-label">Merchant Name</span>
                  <span className="info-value">{selectedEmployee.name === "Michael Smith" ? "Tokopedia" : selectedEmployee.name === "Sarah Johnson" ? "Grab" : selectedEmployee.name === "David Wilson" ? "Apotek K-24" : "Gojek"}</span>
                </div>
              </div>

              {/* Total Amount Box */}
              <div className="total-amount-box">
                <span className="total-label">Total Amount</span>
                <span className="total-value">${selectedEmployee.total.toLocaleString()}</span>
              </div>

              {/* Info Rows */}
              <div className="info-section">
                <div className="info-row">
                  <span className="info-label">Submit Date</span>
                  <span className="info-value">{selectedEmployee.submitDate}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Status</span>
                  <span className={`status-pill ${selectedEmployee.status}`}>
                    ● {selectedEmployee.status.charAt(0).toUpperCase() + selectedEmployee.status.slice(1)}
                  </span>
                </div>
              </div>

              {/* Receipt & Document */}
              <div className="documents-section">
                <h4>Bukti Pembayaran</h4>
                
                {/* Single Image Preview */}
                <div className="receipt-preview">
                  <img src="https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=500&h=300&fit=crop" alt="Receipt" />
                </div>

                {/* Single File Download */}
                <div className="doc-item">
                  <div className="doc-icon">
                    <span className="material-icons">description</span>
                  </div>
                  <div className="doc-info">
                    <span className="doc-name">receipt_bukti.pdf</span>
                    <span className="doc-size">245 KB</span>
                  </div>
                  <button className="doc-download">
                    <span className="material-icons">download</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Footer buttons based on status */}
            <div className="modal-footer">
              {selectedEmployee.status === "pending" && (
                <>
                  <button className="reject-btn">
                    <span className="material-icons">close</span>
                    Reject
                  </button>
                  <button className="approve-btn">
                    <span className="material-icons">check</span>
                    Approve
                  </button>
                </>
              )}
              {selectedEmployee.status === "approved" && (
                <button className="reject-btn">
                  <span className="material-icons">close</span>
                  Reject
                </button>
              )}
              {selectedEmployee.status === "rejected" && (
                <button className="secondary-btn" onClick={() => setShowModal(false)}>
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Period Picker Modal */}
      {showPeriodPicker && (
        <div className="modal-overlay" onClick={() => setShowPeriodPicker(false)}>
          <div className="period-modal" onClick={(e) => e.stopPropagation()}>
            <div className="period-modal-header">
              <h3>Pilih Periode Reimburse</h3>
              <button className="close-btn" onClick={() => setShowPeriodPicker(false)}>
                <span className="material-icons">close</span>
              </button>
            </div>
            <div className="period-modal-body">
              <div className="date-input-group">
                <label>Tanggal Mulai</label>
                <input 
                  type="date" 
                  value={periodStartDate}
                  onChange={(e) => setPeriodStartDate(e.target.value)}
                />
              </div>
              <div className="date-input-group">
                <label>Tanggal Selesai</label>
                <input 
                  type="date" 
                  value={periodEndDate}
                  onChange={(e) => setPeriodEndDate(e.target.value)}
                />
              </div>
            </div>
            <div className="period-modal-footer">
              <button className="secondary-btn" onClick={() => setShowPeriodPicker(false)}>Batal</button>
              <button className="primary-btn" onClick={() => setShowPeriodPicker(false)}>Terapkan</button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .reimburse-container {
          max-width: 1400px;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 32px;
        }

        .header-left h1 {
          font-size: 24px;
          font-weight: 700;
          color: #1e293b;
          margin: 0 0 8px 0;
        }

        .header-left p {
          color: #64748b;
          font-size: 14px;
          margin: 0;
        }

        .header-actions {
          display: flex;
          gap: 12px;
        }

        .secondary-btn, .export-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          border-radius: 10px;
          font-weight: 600;
          cursor: pointer;
          font-family: 'Montserrat', sans-serif;
          font-size: 14px;
        }

        .secondary-btn {
          background: white;
          border: 1px solid #e2e8f0;
          color: #0066FF;
        }

        .export-btn {
          background: #0066FF;
          border: none;
          color: white;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .section-header h3 {
          font-size: 16px;
          font-weight: 700;
          color: #1e293b;
          margin: 0;
        }

        .period-select {
          display: flex;
          align-items: center;
          gap: 8px;
          background: white;
          padding: 8px 16px;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
        }

        .period-select .material-icons {
          font-size: 18px;
          color: #64748b;
        }

        .period-select select {
          border: none;
          background: none;
          font-size: 14px;
          font-weight: 500;
          color: #1e293b;
          cursor: pointer;
          outline: none;
          font-family: 'Montserrat', sans-serif;
        }

        .breakdown-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          margin-bottom: 32px;
        }

        @media (max-width: 1200px) {
          .breakdown-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        .breakdown-card {
          background: white;
          border-radius: 16px;
          padding: 24px;
          border: 1px solid #f1f5f9;
        }

        .card-top {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }

        .card-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .card-icon .material-icons {
          font-size: 20px;
        }

        .card-icon.transport { background: #eff6ff; color: #3b82f6; }
        .card-icon.meals { background: #fef3c7; color: #d97706; }
        .card-icon.medical { background: #fce7f3; color: #db2777; }
        .card-icon.travel { background: #f0fdf4; color: #22c55e; }

        .card-label {
          font-size: 14px;
          font-weight: 600;
          color: #1e293b;
          flex: 1;
        }

        .more-btn {
          width: 32px;
          height: 32px;
          border: none;
          background: none;
          color: #94a3b8;
          cursor: pointer;
          border-radius: 8px;
        }

        .more-btn:hover {
          background: #f1f5f9;
        }

        .card-value {
          font-size: 28px;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 8px;
        }

        .card-trend {
          font-size: 12px;
          color: #64748b;
        }

        .card-trend span {
          font-weight: 600;
        }

        .card-trend.positive span { color: #22c55e; }
        .card-trend.negative span { color: #ef4444; }

        .stats-chart-grid {
          display: grid;
          grid-template-columns: minmax(360px, 1fr) 2fr;
          gap: 24px;
          margin-bottom: 32px;
        }

        @media (max-width: 1200px) {
          .stats-chart-grid {
            grid-template-columns: 1fr;
          }
        }

        .stats-card, .chart-card {
          background: white;
          border-radius: 16px;
          padding: 24px;
          border: 1px solid #f1f5f9;
        }

        .stats-header, .chart-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 20px;
        }

        .stats-header h4, .chart-header h4 {
          font-size: 14px;
          font-weight: 700;
          color: #1e293b;
          margin: 0;
        }

        .stats-info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 24px;
        }

        .stat-item {
          padding: 16px;
          background: #f8fafc;
          border-radius: 12px;
        }

        .stat-label {
          display: block;
          font-size: 12px;
          color: #64748b;
          margin-bottom: 4px;
        }

        .stat-value {
          font-size: 14px;
          font-weight: 600;
          color: #1e293b;
        }

        .status-badge {
          color: #22c55e;
        }

        .pie-chart-section {
          display: flex;
          align-items: center;
          gap: 20px;
          flex-wrap: wrap;
        }

        .pie-chart {
          width: 120px;
          height: 120px;
        }

        .pie-legend {
          flex: 1;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 12px;
          font-size: 13px;
          color: #64748b;
        }

        .legend-item strong {
          margin-left: auto;
          color: #1e293b;
        }

        .dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
        }

        .dot.approved { background: #0066FF; }
        .dot.pending { background: #f59e0b; }
        .dot.transport { background: #3b82f6; }
        .dot.meals { background: #d97706; }
        .dot.medical { background: #db2777; }
        .dot.travel { background: #22c55e; }

        .total-box {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px 20px;
          background: linear-gradient(135deg, #0066FF 0%, #0052CC 100%);
          border-radius: 14px;
          color: white;
        }

        .total-icon {
          width: 44px;
          height: 44px;
          background: rgba(255,255,255,0.2);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .total-label {
          display: block;
          font-size: 12px;
          opacity: 0.8;
        }

        .total-value {
          font-size: 20px;
          font-weight: 700;
        }

        .chart-total {
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 8px 0 4px;
        }

        .big-value {
          font-size: 28px;
          font-weight: 700;
          color: #1e293b;
        }

        .trend-badge {
          font-size: 12px;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 20px;
        }

        .trend-badge.positive {
          background: #dcfce7;
          color: #22c55e;
        }

        .chart-subtitle {
          font-size: 12px;
          color: #64748b;
        }

        .chart-legend {
          display: flex;
          gap: 16px;
          font-size: 12px;
          color: #64748b;
        }

        .chart-legend span {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .bar-chart {
          display: flex;
          align-items: flex-end;
          gap: 12px;
          height: 200px;
          padding-top: 20px;
        }

        .bar-group {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .bars {
          display: flex;
          gap: 3px;
          align-items: flex-end;
          height: 160px;
        }

        .bar {
          width: 10px;
          border-radius: 4px 4px 0 0;
          transition: height 0.3s;
        }

        .bar.transport { background: #3b82f6; }
        .bar.meals { background: #d97706; }
        .bar.medical { background: #db2777; }
        .bar.travel { background: #22c55e; }

        .bar-label {
          font-size: 11px;
          color: #94a3b8;
          margin-top: 8px;
        }

        .employee-section {
          background: white;
          border-radius: 16px;
          border: 1px solid #f1f5f9;
          overflow: hidden;
        }

        .section-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid #f1f5f9;
        }

        .section-header-row h4 {
          font-size: 16px;
          font-weight: 700;
          color: #1e293b;
          margin: 0;
        }

        .table-controls {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .filter-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 10px 16px;
          background: white;
          border: 1px solid #e2e8f0;
          borderRadius: 10px;
          font-size: 14px;
          color: #64748b;
          cursor: pointer;
          font-family: 'Montserrat', sans-serif;
          border-radius: 10px;
        }

        .search-box {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #f8fafc;
          padding: 10px 16px;
          border-radius: 10px;
          border: 1px solid #e2e8f0;
        }

        .search-box .material-icons {
          font-size: 20px;
          color: #94a3b8;
        }

        .search-box input {
          border: none;
          background: none;
          font-size: 14px;
          width: 160px;
          outline: none;
          font-family: 'Montserrat', sans-serif;
        }

        .add-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          background: #22c55e;
          color: white;
          border: none;
          border-radius: 10px;
          font-weight: 600;
          cursor: pointer;
          font-family: 'Montserrat', sans-serif;
        }

        .employee-table {
          width: 100%;
          border-collapse: collapse;
        }

        .employee-table th {
          background: #f8fafc;
          text-align: left;
          padding: 14px 16px;
          font-size: 12px;
          font-weight: 600;
          color: #64748b;
        }

        .employee-table th .material-icons {
          font-size: 14px;
          vertical-align: middle;
          margin-left: 4px;
          color: #cbd5e1;
        }

        .employee-table td {
          padding: 16px;
          border-top: 1px solid #f1f5f9;
          font-size: 14px;
          color: #1e293b;
        }

        .employee-table tr {
          cursor: pointer;
          transition: background 0.2s;
        }

        .employee-table tbody tr:hover {
          background: #f8fafc;
        }

        .emp-cell {
          display: flex;
          flex-direction: column;
        }

        .emp-cell strong {
          font-weight: 600;
        }

        .emp-cell span {
          font-size: 12px;
          color: #94a3b8;
        }

        .status-pill {
          font-size: 12px;
          font-weight: 600;
          padding: 6px 12px;
          border-radius: 20px;
        }

        .status-pill.approved { background: #dcfce7; color: #22c55e; }
        .status-pill.pending { background: #fef3c7; color: #d97706; }
        .status-pill.rejected { background: #fee2e2; color: #ef4444; }

        .download-btn {
          padding: 6px 14px;
          background: white;
          border: 1px solid #0066FF;
          color: #0066FF;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
        }

        .action-btn {
          width: 32px;
          height: 32px;
          border: none;
          background: none;
          color: #94a3b8;
          cursor: pointer;
          border-radius: 8px;
        }

        /* Modal */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
          overflow-y: auto;
        }

        .detail-modal {
          background: white;
          width: 100%;
          max-width: 520px;
          max-height: 90vh;
          border-radius: 20px;
          display: flex;
          flex-direction: column;
          box-shadow: 0 25px 50px rgba(0,0,0,0.2);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid #f1f5f9;
          flex-shrink: 0;
        }

        .modal-header h2 {
          font-size: 18px;
          font-weight: 700;
          color: #1e293b;
          margin: 0;
        }

        .emp-id {
          font-size: 12px;
          color: #64748b;
        }

        .close-btn {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: none;
          background: #f1f5f9;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .close-btn:hover {
          background: #e2e8f0;
        }

        .modal-body {
          padding: 20px 24px;
          overflow-y: auto;
          flex: 1;
        }

        .merchant-section {
          margin-bottom: 16px;
        }

        .merchant-section .info-row {
          background: #f8fafc;
          padding: 16px;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
        }

        .total-amount-box {
          background: linear-gradient(135deg, #0066FF 0%, #0052CC 100%);
          padding: 24px;
          border-radius: 16px;
          text-align: center;
          margin-bottom: 20px;
        }

        .total-amount-box .total-label {
          display: block;
          font-size: 13px;
          color: rgba(255,255,255,0.8);
          margin-bottom: 6px;
        }

        .total-amount-box .total-value {
          font-size: 36px;
          font-weight: 700;
          color: white;
        }

        .info-section {
          margin-bottom: 20px;
        }

        .info-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 14px 0;
          border-bottom: 1px solid #f1f5f9;
        }

        .info-row:last-child {
          border-bottom: none;
        }

        .info-label {
          font-size: 14px;
          color: #64748b;
        }

        .info-value {
          font-size: 14px;
          font-weight: 600;
          color: #1e293b;
        }

        .documents-section h4 {
          font-size: 14px;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 14px 0;
        }

        .receipt-preview {
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid #e2e8f0;
          margin-bottom: 16px;
        }

        .receipt-preview img {
          width: 100%;
          height: 180px;
          object-fit: cover;
          display: block;
        }

        .doc-item {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 16px;
          background: #f8fafc;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
        }

        .doc-icon {
          width: 40px;
          height: 40px;
          background: #0066FF;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .doc-info {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .doc-name {
          font-size: 14px;
          font-weight: 500;
          color: #1e293b;
        }

        .doc-size {
          font-size: 12px;
          color: #94a3b8;
        }

        .doc-download {
          width: 40px;
          height: 40px;
          border: 1px solid #0066FF;
          background: white;
          border-radius: 10px;
          color: #0066FF;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .doc-download:hover {
          background: #0066FF;
          color: white;
        }

        .doc-download {
          width: 36px;
          height: 36px;
          border: 1px solid #0066FF;
          background: white;
          border-radius: 8px;
          color: #0066FF;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .doc-download:hover {
          background: #0066FF;
          color: white;
        }

        .modal-footer {
          padding: 16px 24px;
          border-top: 1px solid #f1f5f9;
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          flex-shrink: 0;
          background: white;
        }

        .reject-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 14px 28px;
          background: #fef2f2;
          color: #ef4444;
          border: 1px solid #fecaca;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          font-family: 'Montserrat', sans-serif;
          font-size: 14px;
          transition: all 0.2s;
        }

        .reject-btn:hover {
          background: #ef4444;
          color: white;
          border-color: #ef4444;
        }

        .approve-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 14px 28px;
          background: #22c55e;
          color: white;
          border: none;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          font-family: 'Montserrat', sans-serif;
          font-size: 14px;
          transition: all 0.2s;
        }

        .approve-btn:hover {
          background: #16a34a;
          transform: translateY(-2px);
        }

        .secondary-btn {
          padding: 14px 28px;
          background: #f1f5f9;
          color: #64748b;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          font-family: 'Montserrat', sans-serif;
          font-size: 14px;
          transition: all 0.2s;
        }

        .secondary-btn:hover {
          background: #e2e8f0;
        }

        /* Clickable Stat Item */
        .stat-item.clickable {
          cursor: pointer;
          transition: background 0.2s;
        }

        .stat-item.clickable:hover {
          background: #f8fafc;
        }

        .period-value {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .edit-icon {
          font-size: 14px !important;
          color: #7c3aed;
        }

        /* Period Picker Modal */
        .period-modal {
          background: white;
          border-radius: 16px;
          width: 100%;
          max-width: 400px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.2);
          overflow: hidden;
        }

        .period-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid #f1f5f9;
        }

        .period-modal-header h3 {
          font-size: 18px;
          font-weight: 700;
          color: #1e293b;
          margin: 0;
        }

        .period-modal-body {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .date-input-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .date-input-group label {
          font-size: 13px;
          font-weight: 600;
          color: #64748b;
        }

        .date-input-group input {
          padding: 12px 16px;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          font-size: 14px;
          font-family: 'Montserrat', sans-serif;
          color: #1e293b;
          outline: none;
          transition: border-color 0.2s;
        }

        .date-input-group input:focus {
          border-color: #7c3aed;
        }

        .period-modal-footer {
          padding: 16px 24px;
          border-top: 1px solid #f1f5f9;
          display: flex;
          justify-content: flex-end;
          gap: 12px;
        }

        .primary-btn {
          padding: 12px 24px;
          background: #7c3aed;
          color: white;
          border: none;
          border-radius: 10px;
          font-weight: 600;
          cursor: pointer;
          font-family: 'Montserrat', sans-serif;
          font-size: 14px;
          transition: background 0.2s;
        }

        .primary-btn:hover {
          background: #6d28d9;
        }
      `}</style>
    </div>
  );
}
