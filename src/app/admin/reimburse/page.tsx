"use client";

import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { uploadFile } from "@/services/berkasService";
import {
  approveReimburse,
  createReimburse,
  deleteReimburse,
  fetchReimburseDetail,
  fetchReimburseList,
} from "@/services/reimburseService";
import { getAllUsers } from "@/services/usersService";

const formatCurrency = (value: number) => `Rp ${value.toLocaleString("id-ID")}`;
const formatDate = (value?: string) => (value ? new Date(value).toLocaleDateString("id-ID") : "-");
const normalizeStatusForUi = (status?: string) => {
  const normalized = (status || "").trim().toLowerCase();
  if (["lunas", "approved", "approve", "disetujui", "accepted", "paid", "settled"].includes(normalized)) return "lunas";
  return "tunggakan";
};
const formatStatus = (status?: string) => (normalizeStatusForUi(status) === "lunas" ? "Lunas" : "Tunggakan");
const isPdfAttachment = (fileName?: string, fileUrl?: string) => `${fileName || ""} ${fileUrl || ""}`.toLowerCase().includes(".pdf");
const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;
const asRecord = (value: unknown): Record<string, unknown> =>
  typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};

export default function ReimbursePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ title: "", amount: "", description: "", date: "", address: "", category: "Konsumsi" });
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadedFileId, setUploadedFileId] = useState<string | null>(null);
  const [transferProofFileId, setTransferProofFileId] = useState<string | null>(null);
  const [uploadingTransferProof, setUploadingTransferProof] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const transferProofInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const { data: users = [] } = useQuery({
    queryKey: ["users-directory"],
    queryFn: () => getAllUsers(),
    staleTime: 10 * 60 * 1000,
  });

  const { data: reimburseList = [], isLoading, refetch } = useQuery({
    queryKey: ["reimburse-list"],
    queryFn: fetchReimburseList,
  });

  const selectedFallback = reimburseList.find((item) => item.id === selectedId) || null;
  const { data: selectedDetail } = useQuery({
    queryKey: ["reimburse-detail", selectedId],
    queryFn: () => fetchReimburseDetail(selectedId || ""),
    enabled: Boolean(selectedId && showDetail),
  });

  const selectedReimburse = selectedDetail || selectedFallback;
  const getUser = (userId: string) => users.find((user) => user.userId === userId || user.email === userId);
  // Use userName from API first, then fallback to users lookup
  const getDisplayName = (item: { userId: string; userName?: string }) => {
    if (item.userName) return item.userName;
    const user = getUser(item.userId);
    return user?.name || "Unknown user";
  };
  const selectedStatus = normalizeStatusForUi(selectedReimburse?.status);
  const resetTransferProof = () => {
    setTransferProofFileId(null);
    if (transferProofInputRef.current) {
      transferProofInputRef.current.value = "";
    }
  };
  const closeDetailModal = () => {
    setShowDetail(false);
    setSelectedId(null);
    resetTransferProof();
  };
  const openDetailModal = (id: string) => {
    setSelectedId(id);
    setShowDetail(true);
    resetTransferProof();
  };

  const invalidateReimburse = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["reimburse-list"] }),
      queryClient.invalidateQueries({ queryKey: ["dashboard-reimburse"] }),
      queryClient.invalidateQueries({ queryKey: ["reimburse-detail"] }),
    ]);
  };

  const createMutation = useMutation({
    mutationFn: createReimburse,
    onSuccess: async () => {
      await invalidateReimburse();
      setCreateForm({ title: "", amount: "", description: "", date: "", address: "", category: "Konsumsi" });
      setUploadedFileId(null);
      setShowCreate(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    onError: (error: unknown) => alert(getErrorMessage(error, "Gagal membuat reimburse.")),
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, fileId }: { id: string; fileId?: string }) => approveReimburse(id, fileId),
    onSuccess: async () => {
      await invalidateReimburse();
      closeDetailModal();
    },
    onError: (error: unknown) => alert(getErrorMessage(error, "Gagal menandai reimburse sebagai lunas.")),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteReimburse,
    onSuccess: invalidateReimburse,
    onError: (error: unknown) => alert(getErrorMessage(error, "Gagal menghapus reimburse.")),
  });

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setUploadingFile(true);
      const result = await uploadFile(file, "REIMBURSE");
      
      console.log("[Upload Evidence] Raw response:", JSON.stringify(result, null, 2));
      
      const payload = asRecord(result);
      const data = asRecord(payload.data);
      const fileObj = asRecord(payload.file);
      
      const fileId = String(
        data.fileId || data.id || data._id ||
        payload.fileId || payload.id || payload._id ||
        fileObj.fileId || fileObj.id ||
        payload.file_id || data.file_id ||
        ""
      );
      
      if (!fileId) {
        console.error("[Upload] Could not find fileId. Full response:", result);
        throw new Error("File ID tidak ditemukan.");
      }
      
      console.log("[Upload Evidence] Extracted fileId:", fileId);
      setUploadedFileId(fileId);
    } catch (error: unknown) {
      alert(getErrorMessage(error, "Gagal upload file."));
    } finally {
      setUploadingFile(false);
    }
  };

  const handleTransferProofUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setUploadingTransferProof(true);
      const result = await uploadFile(file, "REIMBURSE");
      
      // Debug: log full upload response to find the fileId field
      console.log("[Upload Transfer Proof] Raw response:", JSON.stringify(result, null, 2));
      
      const payload = asRecord(result);
      const data = asRecord(payload.data);
      const fileObj = asRecord(payload.file);
      
      // Try every possible field path
      const fileId = String(
        data.fileId || data.id || data._id ||
        payload.fileId || payload.id || payload._id ||
        fileObj.fileId || fileObj.id ||
        // Sometimes the response is just { message: "...", fileId: "..." }
        payload.file_id ||
        data.file_id ||
        ""
      );
      
      if (!fileId) {
        console.error("[Upload] Could not find fileId. Response keys:", Object.keys(payload).join(", "), "| data keys:", Object.keys(data).join(", "));
        throw new Error("File ID bukti transfer tidak ditemukan. Cek console untuk detail.");
      }
      
      console.log("[Upload Transfer Proof] Extracted fileId:", fileId);
      setTransferProofFileId(fileId);
    } catch (error: unknown) {
      alert(getErrorMessage(error, "Gagal upload bukti transfer."));
    } finally {
      setUploadingTransferProof(false);
    }
  };

  const handleCreate = (event: React.FormEvent) => {
    event.preventDefault();
    if (!uploadedFileId) {
      alert("Bukti (foto struk/nota) wajib diupload.");
      return;
    }
    if (!createForm.date) {
      alert("Tanggal wajib diisi.");
      return;
    }
    createMutation.mutate({
      amount: Number(createForm.amount),
      date: createForm.date,
      fileId: uploadedFileId,
      title: createForm.title.trim() || undefined,
      description: createForm.description.trim() || undefined,
      address: createForm.address.trim() || undefined,
      category: createForm.category || undefined,
    });
  };

  const filteredList = reimburseList.filter((item) => {
    const displayName = getDisplayName(item);
    const keyword = searchQuery.trim().toLowerCase();
    const itemDate = item.createdAt ? item.createdAt.slice(0, 10) : "";
    const itemStatus = normalizeStatusForUi(item.status);
    const matchSearch =
      !keyword ||
      displayName.toLowerCase().includes(keyword) ||
      item.userId?.toLowerCase().includes(keyword) ||
      item.title.toLowerCase().includes(keyword);
    const matchStatus = statusFilter === "all" || itemStatus === statusFilter;
    const matchStart = !startDate || (itemDate && itemDate >= startDate);
    const matchEnd = !endDate || (itemDate && itemDate <= endDate);
    return Boolean(matchSearch && matchStatus && matchStart && matchEnd);
  });

  const totalLunas = reimburseList
    .filter((item) => normalizeStatusForUi(item.status) === "lunas")
    .reduce((sum, item) => sum + item.amount, 0);
  const totalTunggakan = reimburseList
    .filter((item) => normalizeStatusForUi(item.status) === "tunggakan")
    .reduce((sum, item) => sum + item.amount, 0);
  const grandTotal = reimburseList.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="page">
      <div className="header">
        <div>
          <h1>Manajemen Reimburse</h1>
          <p>Kelola pengajuan biaya, approval, dan status reimburse tim.</p>
        </div>
        <div className="actions">
          <button className="secondary" onClick={() => refetch()} disabled={isLoading}>Segarkan</button>
          <button className="primary" onClick={() => setShowCreate(true)}>Pengajuan Baru</button>
        </div>
      </div>

      <div className="summary">
        <div className="card"><span>Lunas</span><strong>{formatCurrency(totalLunas)}</strong></div>
        <div className="card"><span>Tunggakan</span><strong>{formatCurrency(totalTunggakan)}</strong></div>
        <div className="card highlight"><span>Total Volume Transaksi</span><strong>{formatCurrency(grandTotal)}</strong></div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h4>Daftar Reimburse Karyawan</h4>
          <div className="filters">
            <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
            <input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="all">Semua Status</option>
              <option value="lunas">Lunas</option>
              <option value="tunggakan">Tunggakan</option>
            </select>
            <input
              type="text"
              placeholder="Cari nama/email/judul"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="empty">Memuat data reimburse...</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Pengaju</th>
                  <th>Judul</th>
                  <th>Nominal</th>
                  <th>Tanggal</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredList.length === 0 ? (
                  <tr><td colSpan={6} className="empty">Tidak ada data reimburse</td></tr>
                ) : (
                  filteredList.map((item) => {
                    const itemStatus = normalizeStatusForUi(item.status);
                    return (
                      <tr key={item.id} onClick={() => openDetailModal(item.id)}>
                        <td><strong>{getDisplayName(item)}</strong><br /><span>{item.userId || "-"}</span></td>
                        <td>{item.title}</td>
                        <td>{formatCurrency(item.amount)}</td>
                        <td>{formatDate(item.createdAt)}</td>
                        <td><span className={`pill ${itemStatus}`}>{formatStatus(item.status)}</span></td>
                        <td>
                          <button
                            className="danger"
                            onClick={(event) => {
                              event.stopPropagation();
                              if (itemStatus === "lunas") return alert("Tidak dapat menghapus reimburse yang sudah lunas.");
                              if (confirm("Yakin ingin menghapus pengajuan reimburse ini?")) deleteMutation.mutate(item.id);
                            }}
                            disabled={itemStatus === "lunas" || deleteMutation.isPending}
                          >
                            Hapus
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showDetail && selectedReimburse && (
        <div className="overlay" onClick={closeDetailModal}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-head">
              <div>
                <h2>Detail Reimburse</h2>
                <small>{selectedReimburse.title}</small>
              </div>
              <button className="secondary" onClick={closeDetailModal}>Tutup</button>
            </div>
            <div className="detail-grid">
              <div><span>Pengaju</span><strong>{selectedReimburse.userName || getUser(selectedReimburse.userId)?.name || "Unknown user"}</strong></div>
              <div><span>Email</span><strong>{selectedReimburse.userId || "-"}</strong></div>
              <div><span>Nominal</span><strong>{formatCurrency(selectedReimburse.amount)}</strong></div>
              <div><span>Tanggal</span><strong>{formatDate(selectedReimburse.date || selectedReimburse.createdAt)}</strong></div>
              <div><span>Status</span><strong>{formatStatus(selectedReimburse.status)}</strong></div>
              {selectedReimburse.category && <div><span>Kategori</span><strong>{selectedReimburse.category}</strong></div>}
              {selectedReimburse.address && <div><span>Alamat/Keterangan</span><strong>{selectedReimburse.address}</strong></div>}
              <div><span>Deskripsi</span><strong>{selectedReimburse.description || "-"}</strong></div>
              {selectedReimburse.rejectReason && <div><span>Alasan Penolakan</span><strong>{selectedReimburse.rejectReason}</strong></div>}
              {selectedReimburse.fileUrl ? (
                <div className="attachment-row">
                  <span>Bukti Pengajuan User</span>
                  {isPdfAttachment(selectedReimburse.fileName, selectedReimburse.fileUrl) ? (
                    <a href={selectedReimburse.fileUrl} target="_blank" rel="noreferrer">Buka bukti</a>
                  ) : (
                    <div className="attachment-preview">
                      <img src={selectedReimburse.fileUrl} alt={selectedReimburse.fileName || "Bukti reimburse"} />
                      <a href={selectedReimburse.fileUrl} target="_blank" rel="noreferrer">Buka gambar penuh</a>
                    </div>
                  )}
                </div>
              ) : (
                <div><span>Bukti Pengajuan User</span><strong>Tidak ada bukti terlampir.</strong></div>
              )}
              {selectedReimburse.paymentFileUrl && (
                <div className="attachment-row">
                  <span>Bukti Transfer (Admin)</span>
                  <div className="attachment-preview">
                    <img src={selectedReimburse.paymentFileUrl} alt={selectedReimburse.paymentFileName || "Bukti transfer"} />
                    <a href={selectedReimburse.paymentFileUrl} target="_blank" rel="noreferrer">Buka gambar penuh</a>
                  </div>
                </div>
              )}
            </div>
            {selectedStatus === "tunggakan" && (
              <div className="actions">
                <div className="transfer-proof-box">
                  <label>Upload Bukti Transfer *</label>
                  <input
                    ref={transferProofInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleTransferProofUpload}
                  />
                  {uploadingTransferProof && <small>Sedang upload bukti transfer...</small>}
                  {transferProofFileId && <small>Bukti transfer berhasil diupload.</small>}
                </div>
                <button
                  className="primary"
                  onClick={() => approveMutation.mutate({ id: selectedReimburse.id, fileId: transferProofFileId || undefined })}
                  disabled={approveMutation.isPending || uploadingTransferProof || !transferProofFileId}
                >
                  Tandai Lunas
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {showCreate && (
        <div className="overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-head">
              <h2>Buat Pengajuan Reimburse</h2>
              <button className="secondary" onClick={() => setShowCreate(false)}>Tutup</button>
            </div>
            <form className="form" onSubmit={handleCreate}>
              <input type="text" placeholder="Judul pengajuan (opsional)" value={createForm.title} onChange={(event) => setCreateForm({ ...createForm, title: event.target.value })} />
              <input type="number" min="1" placeholder="Nominal *" value={createForm.amount} onChange={(event) => setCreateForm({ ...createForm, amount: event.target.value })} required />
              <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:10}}>
                <div>
                  <label style={{fontSize:12, color:"#64748b", fontWeight:600}}>Tanggal *</label>
                  <input type="date" value={createForm.date} onChange={(event) => setCreateForm({ ...createForm, date: event.target.value })} required style={{width:"100%"}} />
                </div>
                <div>
                  <label style={{fontSize:12, color:"#64748b", fontWeight:600}}>Kategori</label>
                  <select value={createForm.category} onChange={(event) => setCreateForm({ ...createForm, category: event.target.value })} style={{width:"100%"}}>
                    <option value="Konsumsi">Konsumsi</option>
                    <option value="Transport">Transport</option>
                    <option value="Operasional">Operasional</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
              </div>
              <input type="text" placeholder="Alamat / keterangan (opsional)" value={createForm.address} onChange={(event) => setCreateForm({ ...createForm, address: event.target.value })} />
              <textarea rows={3} placeholder="Deskripsi (opsional)" value={createForm.description} onChange={(event) => setCreateForm({ ...createForm, description: event.target.value })} />
              <div>
                <label style={{fontSize:12, color:"#64748b", fontWeight:600}}>Bukti / Struk *</label>
                <input ref={fileInputRef} type="file" accept="image/*,.pdf" onChange={handleUpload} />
              </div>
              {uploadingFile && <small>Sedang mengupload file...</small>}
              {uploadedFileId && <small style={{color:"#16a34a"}}>✅ File berhasil diupload (ID: {uploadedFileId})</small>}
              <div className="actions">
                <button type="button" className="secondary" onClick={() => setShowCreate(false)}>Batal</button>
                <button type="submit" className="primary" disabled={createMutation.isPending || uploadingFile || !uploadedFileId || !createForm.date || !createForm.amount}>
                  {createMutation.isPending ? "Menyimpan..." : "Kirim Pengajuan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .page { padding: 24px; display: grid; gap: 24px; }
        .header, .panel-head, .actions, .summary { display: flex; gap: 12px; justify-content: space-between; align-items: center; flex-wrap: wrap; }
        .summary { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); }
        .card, .panel, .modal { background: #fff; border: 1px solid #e5e7eb; border-radius: 18px; padding: 20px; }
        .card { display: grid; gap: 6px; }
        .highlight { background: linear-gradient(135deg, #1d4ed8, #2563eb); color: #fff; }
        .panel { overflow: hidden; }
        .filters { display: flex; gap: 10px; flex-wrap: wrap; }
        input, select, textarea, button { font: inherit; }
        input, select, textarea { border: 1px solid #d1d5db; border-radius: 10px; padding: 10px 12px; background: #fff; }
        button { border: none; border-radius: 10px; padding: 10px 16px; cursor: pointer; font-weight: 600; }
        .primary { background: #6d5dfc; color: #fff; }
        .secondary { background: #fff; color: #111827; border: 1px solid #d1d5db; }
        .danger { background: #fee2e2; color: #b91c1c; }
        button:disabled { opacity: 0.6; cursor: not-allowed; }
        .table-wrap { overflow-x: auto; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 14px 12px; border-bottom: 1px solid #eef2f7; text-align: left; vertical-align: middle; }
        th { color: #64748b; font-size: 13px; }
        tbody tr { cursor: pointer; }
        tbody tr:hover { background: #f8fafc; }
        td span { color: #64748b; font-size: 12px; }
        .pill { display: inline-flex; padding: 6px 10px; border-radius: 999px; font-size: 12px; font-weight: 700; }
        .pill.lunas { background: #dcfce7; color: #15803d; }
        .pill.tunggakan { background: #fff7ed; color: #d97706; }
        .empty { text-align: center; color: #64748b; padding: 24px; }
        .overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.55); display: flex; align-items: center; justify-content: center; padding: 20px; z-index: 1000; }
        .modal { width: min(680px, 100%); max-height: 90vh; overflow: auto; }
        .modal-head { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 16px; }
        .detail-grid, .form { display: grid; gap: 14px; }
        .detail-grid div { display: grid; gap: 4px; padding-bottom: 12px; border-bottom: 1px solid #eef2f7; }
        .detail-grid span { color: #64748b; font-size: 13px; }
        .detail-grid strong, .detail-grid a { color: #111827; }
        .attachment-row { gap: 10px; }
        .attachment-preview { display: grid; gap: 10px; }
        .attachment-preview img { width: min(100%, 420px); border: 1px solid #e5e7eb; border-radius: 12px; }
        .transfer-proof-box { display: grid; gap: 8px; min-width: 260px; }
        .transfer-proof-box label { font-size: 13px; font-weight: 600; color: #64748b; }
        .transfer-proof-box small { color: #64748b; }
        @media (max-width: 900px) { .summary { grid-template-columns: 1fr; } .page { padding: 16px; } }
      `}</style>
    </div>
  );
}
