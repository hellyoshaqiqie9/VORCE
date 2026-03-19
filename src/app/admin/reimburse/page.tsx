"use client";

import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  fetchReimburseList, 
  createReimburse, 
  updateReimburseStatus, 
  deleteReimburse, 
  ReimburseItem 
} from "@/services/reimburseService";
import { uploadFile } from "@/services/berkasService";

export default function ReimbursePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedReimburse, setSelectedReimburse] = useState<ReimburseItem | null>(null);
  
  // Modals
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Filter periods
  const [periodStartDate, setPeriodStartDate] = useState("");
  const [periodEndDate, setPeriodEndDate] = useState("");

  // Create Form State
  const [createForm, setCreateForm] = useState({
    amount: "",
    date: "",
    title: "",
    description: "",
    address: "",
    category: "Transportasi",
  });
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadedFileId, setUploadedFileId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const queryClient = useQueryClient();

  const { data: reimburseListRaw, isLoading, refetch } = useQuery({
    queryKey: ["reimburse-list"],
    queryFn: fetchReimburseList,
  });

  const reimburseList = reimburseListRaw || [];

  // Mutations
  const createMutation = useMutation({
    mutationFn: createReimburse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reimburse-list"] });
      setShowCreateModal(false);
      setCreateForm({ amount: "", date: "", title: "", description: "", address: "", category: "Transportasi" });
      setUploadedFileId(null);
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string, status: string }) => updateReimburseStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reimburse-list"] });
      setShowDetailModal(false);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteReimburse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reimburse-list"] });
    }
  });

  // Handlers
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadedFileId) return alert("Harap upload bukti terlebih dahulu.");
    createMutation.mutate({
      ...createForm,
      amount: Number(createForm.amount),
      fileId: uploadedFileId,
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingFile(true);
      const res = await uploadFile(file, "REIMBURSE");
      // Asumsikan respons dari uploadFile mengembalikan property data/fileId
      const fileId = res?.data?.fileId || res?.fileId || res?.id;
      if (fileId) {
        setUploadedFileId(fileId);
      } else {
        alert("Gagal mendapatkan file ID dari upload");
      }
    } catch (err: any) {
      alert(err.message || "Gagal upload file");
    } finally {
      setUploadingFile(false);
    }
  };

  const handleRowClick = (item: ReimburseItem) => {
    setSelectedReimburse(item);
    setShowDetailModal(true);
  };

  const handleDelete = (e: React.MouseEvent, id: string, status: string) => {
    e.stopPropagation();
    if (status === "approved" || status === "lunas") {
      return alert("Tidak dapat menghapus reimburse yang sudah disetujui / lunas.");
    }
    if (confirm("Yakin ingin menghapus pengajuan reimburse ini?")) {
      deleteMutation.mutate(id);
    }
  };

  // Stats Breakdown
  const grandTotal = reimburseList.reduce((sum, e) => sum + Number(e.nominal), 0);
  const totalApproved = reimburseList.filter((e) => e.status === "approved" || e.status === "lunas").reduce((sum, e) => sum + Number(e.nominal), 0);
  const totalPending = reimburseList.filter((e) => e.status === "pending").reduce((sum, e) => sum + Number(e.nominal), 0);

  // Filter Logic
  const filteredList = reimburseList.filter(e => {
    const matchesSearch = e.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          e.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          e.judul?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || e.status === statusFilter;
    
    let matchesDate = true;
    if (periodStartDate && e.tanggal) {
      matchesDate = matchesDate && e.tanggal >= periodStartDate;
    }
    if (periodEndDate && e.tanggal) {
      matchesDate = matchesDate && e.tanggal <= periodEndDate;
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  return (
    <div className="reimburse-container">
      {/* Header */}
      <div className="page-header">
        <div className="header-left">
          <h1>Manajemen Reimburse</h1>
          <p>Kelola permintaan reimburse, approval pembayaran, dan lacak pengeluaran.</p>
        </div>
        <div className="header-actions">
          <button className="secondary-btn" onClick={() => refetch()} disabled={isLoading}>
            <span className="material-icons">{isLoading ? "hourglass_empty" : "refresh"}</span>
            Segarkan
          </button>
          <button className="primary-btn" onClick={() => setShowCreateModal(true)}>
            <span className="material-icons">add</span>
            Pengajuan Baru
          </button>
        </div>
      </div>

      <div className="stats-chart-grid">
        <div className="stats-card">
          <div className="stats-header">
            <h4>Ringkasan Status Pengajuan</h4>
          </div>
          <div className="pie-chart-section">
            <div className="pie-chart">
              <svg viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#e2e8f0" strokeWidth="20"/>
                <circle cx="50" cy="50" r="40" fill="none" stroke="#0066FF" strokeWidth="20" 
                  strokeDasharray={`${grandTotal > 0 ? (totalApproved/grandTotal)*251.2 : 0} 251.2`} 
                  transform="rotate(-90 50 50)"/>
                <circle cx="50" cy="50" r="40" fill="none" stroke="#f59e0b" strokeWidth="20" 
                  strokeDasharray={`${grandTotal > 0 ? (totalPending/grandTotal)*251.2 : 0} 251.2`} 
                  strokeDashoffset={`-${grandTotal > 0 ? (totalApproved/grandTotal)*251.2 : 0}`}
                  transform="rotate(-90 50 50)"/>
              </svg>
            </div>
            <div className="pie-legend">
              <div className="legend-item">
                <span className="dot approved"></span>
                <span>Disetujui / Lunas</span>
                <strong>Rp {totalApproved.toLocaleString('id-ID')}</strong>
              </div>
              <div className="legend-item">
                <span className="dot pending"></span>
                <span>Diminta (Pending)</span>
                <strong>Rp {totalPending.toLocaleString('id-ID')}</strong>
              </div>
            </div>
            <div className="total-box">
              <div className="total-icon"><span className="material-icons">receipt_long</span></div>
              <div>
                <span className="total-label">Total Volume Transaksi</span>
                <span className="total-value">Rp {grandTotal.toLocaleString('id-ID')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="employee-section">
        <div className="section-header-row">
          <h4>Daftar Reimburse Karyawan</h4>
          <div className="table-controls">
            <div className="date-filter">
              <input type="date" value={periodStartDate} onChange={(e) => setPeriodStartDate(e.target.value)} title="Dari Tanggal" />
              <span>-</span>
              <input type="date" value={periodEndDate} onChange={(e) => setPeriodEndDate(e.target.value)} title="Sampai Tanggal" />
            </div>
            <select className="status-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">Semua Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="lunas">Lunas</option>
              <option value="rejected">Rejected</option>
            </select>
            <div className="search-box">
              <span className="material-icons">search</span>
              <input
                type="text"
                placeholder="Cari Nama/Email/Judul"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="loading-state">Memuat data reimburse...</div>
        ) : (
          <div className="table-responsive">
            <table className="employee-table">
              <thead>
                <tr>
                  <th>Pengaju</th>
                  <th>Judul</th>
                  <th>Nominal</th>
                  <th>Tanggal</th>
                  <th>Status</th>
                  <th className="text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredList.length === 0 ? (
                  <tr><td colSpan={6} className="text-center">Tidak ada data reimburse</td></tr>
                ) : (
                  filteredList.map((item) => (
                    <tr key={item.id} onClick={() => handleRowClick(item)}>
                      <td>
                        <div className="emp-cell">
                          <strong>{item.displayName || "Unknown User"}</strong>
                          <span>{item.email || "-"}</span>
                        </div>
                      </td>
                      <td>
                        <div className="emp-cell">
                          <strong>{item.judul}</strong>
                        </div>
                      </td>
                      <td><strong>Rp {Number(item.nominal).toLocaleString('id-ID')}</strong></td>
                      <td>{item.tanggal ? new Date(item.tanggal).toLocaleDateString("id-ID") : "-"}</td>
                      <td>
                        <span className={`status-pill ${item.status}`}>
                          ● {item.status?.charAt(0).toUpperCase() + item.status?.slice(1)}
                        </span>
                      </td>
                      <td className="actions-cell text-right">
                        <button 
                          className="icon-btn danger" 
                          onClick={(e) => handleDelete(e, item.id, item.status)}
                          disabled={item.status === "approved" || item.status === "lunas" || deleteMutation.isPending}
                          title="Hapus Pengajuan"
                        >
                          <span className="material-icons">delete</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reimburse Detail & Action Modal */}
      {showDetailModal && selectedReimburse && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>Detail Reimburse</h2>
                <span className="emp-id">{selectedReimburse.judul}</span>
              </div>
              <button className="close-btn" onClick={() => setShowDetailModal(false)}>
                <span className="material-icons">close</span>
              </button>
            </div>
            
            <div className="modal-body">
              <div className="merchant-section">
                <div className="info-row">
                  <span className="info-label">Diajukan Oleh</span>
                  <span className="info-value text-bold">{selectedReimburse.displayName} ({selectedReimburse.email})</span>
                </div>
              </div>

              <div className="total-amount-box">
                <span className="total-label">Nominal Pengajuan</span>
                <span className="total-value">Rp {Number(selectedReimburse.nominal).toLocaleString('id-ID')}</span>
              </div>

              <div className="info-section">
                <div className="info-row">
                  <span className="info-label">Tanggal Transaksi</span>
                  <span className="info-value">{selectedReimburse.tanggal ? new Date(selectedReimburse.tanggal).toLocaleDateString('id-ID') : "-"}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Deskripsi</span>
                  <span className="info-value">{selectedReimburse.deskripsi || "-"}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Status Saat Ini</span>
                  <span className={`status-pill ${selectedReimburse.status}`}>
                    ● {selectedReimburse.status.charAt(0).toUpperCase() + selectedReimburse.status.slice(1)}
                  </span>
                </div>
                {selectedReimburse.approvedBy && (
                  <div className="info-row">
                    <span className="info-label">Diproses Oleh</span>
                    <span className="info-value">{selectedReimburse.approvedBy} pada {selectedReimburse.approvedAt ? new Date(selectedReimburse.approvedAt).toLocaleDateString("id-ID") : "-"}</span>
                  </div>
                )}
              </div>

              <div className="documents-section">
                <h4>Bukti Pembayaran / Struk</h4>
                {selectedReimburse.buktiUrl ? (
                  <div className="receipt-preview">
                    <img src={selectedReimburse.buktiUrl} alt="Bukti Reimburse" />
                  </div>
                ) : (
                  <p className="no-receipt">Bukti tidak dilampirkan.</p>
                )}
              </div>
            </div>

            <div className="modal-footer">
              {selectedReimburse.status === "pending" && (
                <>
                  <button className="reject-btn" onClick={() => updateStatusMutation.mutate({ id: selectedReimburse.id, status: "rejected" })} disabled={updateStatusMutation.isPending}>
                    <span className="material-icons">close</span> Tolak
                  </button>
                  <button className="approve-btn" onClick={() => updateStatusMutation.mutate({ id: selectedReimburse.id, status: "approved" })} disabled={updateStatusMutation.isPending}>
                    <span className="material-icons">check</span> Setujui (Approve)
                  </button>
                </>
              )}
              {selectedReimburse.status === "approved" && (
                <>
                  <button className="reject-btn" onClick={() => updateStatusMutation.mutate({ id: selectedReimburse.id, status: "Tunggakan" })} disabled={updateStatusMutation.isPending}>
                    <span className="material-icons">warning</span> Tandai Tunggakan
                  </button>
                  <button className="approve-btn" onClick={() => updateStatusMutation.mutate({ id: selectedReimburse.id, status: "Lunas" })} disabled={updateStatusMutation.isPending}>
                    <span className="material-icons">payments</span> Tandai Lunas Pembayaran
                  </button>
                </>
              )}
              <button className="secondary-btn" onClick={() => setShowDetailModal(false)}>Tutup</button>
            </div>
          </div>
        </div>
      )}

      {/* Create Reimburse Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Buat Pengajuan Reimburse</h2>
              <button className="close-btn" onClick={() => setShowCreateModal(false)}>
                <span className="material-icons">close</span>
              </button>
            </div>
            <form onSubmit={handleCreateSubmit} className="modal-body form-body">
              <div className="form-group">
                <label>Judul Pengajuan *</label>
                <input required type="text" placeholder="Cth: Beli Tinta Printer" value={createForm.title} onChange={e => setCreateForm({...createForm, title: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Nominal (Rp) *</label>
                <input required type="number" placeholder="250000" min="1" value={createForm.amount} onChange={e => setCreateForm({...createForm, amount: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Tanggal Transaksi *</label>
                <input required type="date" value={createForm.date} onChange={e => setCreateForm({...createForm, date: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Kategori</label>
                <select value={createForm.category} onChange={e => setCreateForm({...createForm, category: e.target.value})}>
                  <option value="Transportasi">Transportasi</option>
                  <option value="Perjalanan Dinas">Perjalanan Dinas</option>
                  <option value="Makan Luring">Makan Luring</option>
                  <option value="Kesehatan">Kesehatan</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>
              <div className="form-group">
                <label>Lokasi / Alamat Transaksi</label>
                <input type="text" placeholder="Opsional" value={createForm.address} onChange={e => setCreateForm({...createForm, address: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Deskripsi Tambahan</label>
                <textarea rows={3} placeholder="Catatan tambahan..." value={createForm.description} onChange={e => setCreateForm({...createForm, description: e.target.value})} />
              </div>
              <div className="form-group file-upload-group">
                <label>Upload Bukti Struk / Foto *</label>
                <input type="file" ref={fileInputRef} accept="image/*,.pdf" onChange={handleFileUpload} />
                {uploadingFile && <small className="upload-txt text-blue">Sedang mengupload...</small>}
                {uploadedFileId && <small className="upload-txt text-green">✓ File terupload: {uploadedFileId}</small>}
              </div>

              <div className="modal-footer" style={{ marginTop: '20px', padding: 0 }}>
                <button type="button" className="secondary-btn" onClick={() => setShowCreateModal(false)}>Batal</button>
                <button type="submit" className="primary-btn" disabled={createMutation.isPending || uploadingFile || !uploadedFileId}>
                  {createMutation.isPending ? "Menyimpan..." : "Kirim Pengajuan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .reimburse-container {
          max-width: 1400px;
          padding: 24px;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 24px;
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

        .secondary-btn, .primary-btn {
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
          color: #1e293b;
        }
        
        .secondary-btn:disabled {
          color: #94a3b8;
          cursor: not-allowed;
        }

        .primary-btn {
          background: #7b68ee;
          border: none;
          color: white;
        }

        .primary-btn:disabled {
          background: #cbd5e1;
          cursor: not-allowed;
        }

        /* Stats Cards */
        .stats-chart-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 24px;
          margin-bottom: 32px;
        }

        .stats-card {
          background: white;
          border-radius: 16px;
          padding: 24px;
          border: 1px solid #f1f5f9;
        }

        .stats-header h4 {
          font-size: 16px;
          color: #1e293b;
          margin: 0 0 20px 0;
        }

        .pie-chart-section {
          display: flex;
          align-items: center;
          gap: 40px;
          flex-wrap: wrap;
        }

        .pie-chart {
          width: 140px;
          height: 140px;
        }

        .pie-legend {
          flex: 1;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 12px;
          font-size: 14px;
          color: #64748b;
        }

        .legend-item strong {
          margin-left: auto;
          color: #1e293b;
          font-size: 16px;
        }

        .dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
        }

        .dot.approved { background: #0066FF; }
        .dot.pending { background: #f59e0b; }

        .total-box {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 20px;
          background: linear-gradient(135deg, #0066FF 0%, #0052CC 100%);
          border-radius: 14px;
          color: white;
          min-width: 300px;
        }

        .total-icon {
          width: 48px;
          height: 48px;
          background: rgba(255,255,255,0.2);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .total-label {
          display: block;
          font-size: 12px;
          opacity: 0.9;
        }

        .total-value {
          font-size: 24px;
          font-weight: 700;
        }

        /* Tables */
        .employee-section {
          background: white;
          border-radius: 16px;
          padding: 24px;
          border: 1px solid #f1f5f9;
        }

        .section-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          flex-wrap: wrap;
          gap: 16px;
        }

        .section-header-row h4 {
          font-size: 18px;
          margin: 0;
          color: #1e293b;
        }

        .table-controls {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .date-filter, .status-select, .search-box {
          display: flex;
          align-items: center;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          background: white;
          padding: 0 12px;
          gap: 8px;
          height: 40px;
        }
        
        .date-filter input, .search-box input, .status-select {
          border: none;
          outline: none;
          background: none;
          font-family: inherit;
          font-size: 14px;
        }

        .search-box .material-icons {
          color: #94a3b8;
          font-size: 20px;
        }

        .employee-table {
          width: 100%;
          border-collapse: collapse;
        }

        .employee-table th {
          text-align: left;
          padding: 12px 16px;
          border-bottom: 1px solid #e2e8f0;
          color: #64748b;
          font-weight: 600;
          font-size: 13px;
        }

        .employee-table td {
          padding: 16px;
          border-bottom: 1px solid #f1f5f9;
          font-size: 14px;
          color: #1e293b;
          vertical-align: middle;
        }
        
        .employee-table tr {
          cursor: pointer;
          transition: background 0.2s;
        }

        .employee-table tbody tr:hover {
          background: #f8fafc;
        }

        .text-right { text-align: right !important; }
        .text-center { text-align: center !important; }

        .emp-cell {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .emp-cell span {
          color: #64748b;
          font-size: 12px;
        }

        .status-pill {
          display: inline-block;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
        }

        .status-pill.approved { background: #dcfce7; color: #16a34a; }
        .status-pill.lunas { background: #dbeafe; color: #1d4ed8; }
        .status-pill.pending { background: #fef3c7; color: #d97706; }
        .status-pill.tunggakan { background: #fee2e2; color: #b91c1c; }
        .status-pill.rejected { background: #fee2e2; color: #dc2626; }

        .icon-btn.danger {
          background: #fee2e2;
          color: #ef4444;
          border: none;
          border-radius: 8px;
          width: 36px;
          height: 36px;
          cursor: pointer;
        }

        .icon-btn.danger:disabled {
          background: #f1f5f9;
          color: #cbd5e1;
          cursor: not-allowed;
        }

        /* Modals */
        .modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(15, 23, 42, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .detail-modal {
          background: white;
          width: 100%;
          max-width: 600px;
          border-radius: 20px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          max-height: 90vh;
        }

        .modal-header {
          padding: 24px;
          border-bottom: 1px solid #f1f5f9;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .modal-header h2 {
          margin: 0 0 4px 0;
          font-size: 18px;
          color: #1e293b;
        }

        .emp-id {
          font-size: 13px;
          color: #64748b;
        }

        .close-btn {
          background: none;
          border: none;
          color: #64748b;
          cursor: pointer;
          width: 32px; height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .close-btn:hover { background: #f1f5f9; }

        .modal-body {
          padding: 24px;
          overflow-y: auto;
          flex: 1;
        }

        .form-body .form-group {
          margin-bottom: 16px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .form-body label {
          font-size: 13px;
          font-weight: 600;
          color: #334155;
        }

        .form-body input, .form-body select, .form-body textarea {
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          padding: 10px 12px;
          font-family: inherit;
          font-size: 14px;
          outline: none;
        }

        .form-body input[type="file"] {
          border: none;
          padding: 0;
        }

        .upload-txt { margin-top: 4px; font-weight: 500;}
        .text-green { color: #10b981; }
        .text-blue { color: #3b82f6; }

        .info-row {
          display: flex;
          justify-content: space-between;
          padding: 12px 0;
          border-bottom: 1px solid #f1f5f9;
        }
        
        .info-label { color: #64748b; font-size: 14px; }
        .info-value { color: #1e293b; font-size: 14px; font-weight: 500; text-align: right;}
        .text-bold { font-weight: 700; color: #000; }

        .total-amount-box {
          background: #f8fafc;
          padding: 16px 20px;
          border-radius: 12px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin: 16px 0;
        }

        .total-amount-box .total-label { color: #64748b; font-weight: 600; }
        .total-amount-box .total-value { font-size: 24px; font-weight: 700; color: #1e293b; }

        .documents-section {
          margin-top: 24px;
        }
        
        .documents-section h4 {
          font-size: 14px; margin: 0 0 16px 0; color: #1e293b;
        }

        .receipt-preview img {
          width: 100%;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
        }

        .no-receipt {
          color: #94a3b8;
          font-size: 14px;
          font-style: italic;
        }

        .modal-footer {
          padding: 24px;
          border-top: 1px solid #f1f5f9;
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          background: #f8fafc;
        }

        .approve-btn, .reject-btn {
          display: flex; align-items: center; gap: 8px;
          padding: 10px 20px; border-radius: 10px; border: none; font-weight: 600; cursor: pointer; color: white;
        }

        .approve-btn { background: #16a34a; }
        .approve-btn:disabled { background: #86efac; cursor: not-allowed; }
        .reject-btn { background: #ef4444; }
        .reject-btn:disabled { background: #fca5a5; cursor: not-allowed; }
        
        .loading-state {
          text-align: center;
          padding: 40px;
          color: #64748b;
        }
      `}</style>
    </div>
  );
}
