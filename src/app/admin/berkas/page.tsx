"use client";

import { useState, useCallback, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getFiles,
  uploadFile,
  downloadFile,
  renameFile,
  deleteFile,
  getStorageUsage,
  BerkasFile,
  StorageUsage,
} from "@/services/berkasService";

function formatFileSize(bytes: number): string {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function getFileIcon(name: string): string {
  const ext = (name || "").split(".").pop()?.toLowerCase() || "";
  if (["jpg", "jpeg", "png", "gif", "svg", "webp"].includes(ext)) return "image";
  if (["pdf"].includes(ext)) return "picture_as_pdf";
  if (["doc", "docx"].includes(ext)) return "description";
  if (["xls", "xlsx", "csv"].includes(ext)) return "table_chart";
  if (["ppt", "pptx"].includes(ext)) return "slideshow";
  if (["zip", "rar", "7z"].includes(ext)) return "folder_zip";
  if (["mp4", "mov", "avi"].includes(ext)) return "videocam";
  if (["mp3", "wav"].includes(ext)) return "audiotrack";
  return "insert_drive_file";
}

function getFileIconColor(name: string): string {
  const ext = (name || "").split(".").pop()?.toLowerCase() || "";
  if (["jpg", "jpeg", "png", "gif", "svg", "webp"].includes(ext)) return "#8b5cf6";
  if (["pdf"].includes(ext)) return "#ef4444";
  if (["doc", "docx"].includes(ext)) return "#3b82f6";
  if (["xls", "xlsx", "csv"].includes(ext)) return "#16a34a";
  if (["ppt", "pptx"].includes(ext)) return "#f97316";
  if (["zip", "rar", "7z"].includes(ext)) return "#64748b";
  return "#94a3b8";
}

function isImageFile(file: BerkasFile): boolean {
  const ext = (file.fileName || "").split(".").pop()?.toLowerCase() || "";
  return ["jpg", "jpeg", "png", "gif", "svg", "webp"].includes(ext) || (file.mimeType || "").startsWith("image");
}

function getCategoryLabel(cat: string): string {
  const map: Record<string, string> = {
    checkin: "Check In",
    checkout: "Check Out",
    faceId: "Face ID",
    faceid: "Face ID",
    general: "Umum",
    speech: "Audio",
    LEAVE_ATTACHMENT: "Lampiran Cuti",
    DOKUMEN: "Dokumen",
    FOTO: "Foto",
    OTHER: "Lainnya",
  };
  return map[cat] || cat;
}

export default function BerkasPage() {
  const queryClient = useQueryClient();

  // Data via React Query
  const { data: files = [], isLoading: isLoadingFiles, error: apiErrorObj } = useQuery({
    queryKey: ["berkas"],
    queryFn: getFiles,
  });
  const apiError = apiErrorObj ? (apiErrorObj as any).message : null;

  const { data: storage } = useQuery({
    queryKey: ["storage"],
    queryFn: getStorageUsage,
  });

  const isLoading = isLoadingFiles;

  // Filters
  const [filterCategory, setFilterCategory] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<BerkasFile | null>(null);

  // Form
  const [uploadCategory, setUploadCategory] = useState("general");
  const [renameValue, setRenameValue] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedUploadFile, setSelectedUploadFile] = useState<File | null>(null);

  // Action loading
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Toast
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  // ─── FETCH DATA (now handled by useQuery hooks directly) ───

  // ─── ACTIONS ──────────────────────────────────

  const handleUpload = async () => {
    if (!selectedUploadFile) {
      showToast("error", "Pilih file terlebih dahulu");
      return;
    }
    try {
      setActionLoading("upload");
      await uploadFile(selectedUploadFile, uploadCategory);
      showToast("success", `File "${selectedUploadFile.name}" berhasil diupload`);
      setShowUploadModal(false);
      setSelectedUploadFile(null);
      setUploadCategory("general");
      if (fileInputRef.current) fileInputRef.current.value = "";
      queryClient.invalidateQueries({ queryKey: ["berkas"] });
      queryClient.invalidateQueries({ queryKey: ["storage"] });
    } catch (err: any) {
      showToast("error", err.message || "Gagal mengupload file");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDownload = async (file: BerkasFile) => {
    try {
      setActionLoading(file.fileId);
      await downloadFile(file.fileId);
      showToast("success", `Mengunduh "${file.fileName}"`);
    } catch (err: any) {
      showToast("error", err.message || "Gagal mengunduh file");
    } finally {
      setActionLoading(null);
    }
  };

  const handlePreview = (file: BerkasFile) => {
    if (file.downloadUrl) {
      setSelectedFile(file);
      setShowPreviewModal(true);
    } else {
      showToast("error", "URL file tidak tersedia");
    }
  };

  const handleOpenInNewTab = (file: BerkasFile) => {
    if (file.downloadUrl) {
      window.open(file.downloadUrl, "_blank");
    }
  };

  const handleRename = async () => {
    if (!selectedFile || !renameValue.trim()) return;
    try {
      setActionLoading("rename");
      await renameFile(selectedFile.fileId, renameValue.trim());
      showToast("success", "Nama file berhasil diubah");
      setShowRenameModal(false);
      setSelectedFile(null);
      setRenameValue("");
      queryClient.invalidateQueries({ queryKey: ["berkas"] });
    } catch (err: any) {
      showToast("error", err.message || "Gagal mengubah nama file");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!selectedFile) return;
    try {
      setActionLoading("delete");
      await deleteFile(selectedFile.fileId);
      showToast("success", `File "${selectedFile.fileName}" berhasil dihapus`);
      setShowDeleteModal(false);
      setSelectedFile(null);
      queryClient.invalidateQueries({ queryKey: ["berkas"] });
      queryClient.invalidateQueries({ queryKey: ["storage"] });
    } catch (err: any) {
      showToast("error", err.message || "Gagal menghapus file");
    } finally {
      setActionLoading(null);
    }
  };

  // ─── DYNAMIC CATEGORIES ────────────────────────
  const uniqueCategories = Array.from(new Set(files.map((f) => f.category).filter(Boolean)));

  // ─── FILTER (client-side) ─────────────────────
  const filteredFiles = files.filter((f) => {
    const matchesSearch = (f.fileName || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = filterCategory === "ALL" || f.category === filterCategory;
    return matchesSearch && matchesCat;
  });

  const storagePercent = storage && storage.maxSize > 0 ? Math.min((storage.totalBytes / storage.maxSize) * 100, 100) : 0;

  // ─── RENDER ───────────────────────────────────
  return (
    <div className="berkas-container">
      {/* Toast */}
      {toast && (
        <div className={`toast ${toast.type}`}>
          <span className="material-icons">{toast.type === "success" ? "check_circle" : "error"}</span>
          {toast.message}
        </div>
      )}

      {/* Storage Card */}
      <div className="storage-card">
        <div className="storage-info">
          <div className="storage-icon">
            <span className="material-icons">cloud</span>
          </div>
          <div className="storage-text">
            <h3>Penyimpanan</h3>
            <p>
              {storage ? storage.totalSize : "..."} / {storage ? storage.maxSizeFormatted : "..."}
              {storage?.fileCount ? ` (${storage.fileCount} file)` : ""}
            </p>
          </div>
          <div className="storage-percent">{storagePercent.toFixed(1)}%</div>
        </div>
        <div className="storage-bar-bg">
          <div
            className="storage-bar-fill"
            style={{
              width: `${storagePercent}%`,
              background: storagePercent > 90 ? "#ef4444" : storagePercent > 70 ? "#f59e0b" : "#0066FF",
            }}
          />
        </div>
      </div>

      {/* Header */}
      <div className="page-header">
        <div className="header-left">
          <h1>Berkas</h1>
          <span className="file-count">{filteredFiles.length} file</span>
        </div>
        <div className="header-actions">
          <div className="search-box">
            <span className="material-icons">search</span>
            <input
              type="text"
              placeholder="Cari berkas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="primary-btn" onClick={() => setShowUploadModal(true)}>
            <span className="material-icons">cloud_upload</span>
            Upload File
          </button>
        </div>
      </div>

      {/* Dynamic Category Filter */}
      <div className="filter-section">
        <div className="cat-filters">
          <button
            className={`cat-btn ${filterCategory === "ALL" ? "active" : ""}`}
            onClick={() => setFilterCategory("ALL")}
          >
            <span className="material-icons">folder</span>
            Semua ({files.length})
          </button>
          {uniqueCategories.map((cat) => (
            <button
              key={cat}
              className={`cat-btn ${filterCategory === cat ? "active" : ""}`}
              onClick={() => setFilterCategory(cat)}
            >
              <span className="material-icons">
                {["checkin", "checkout", "faceId", "faceid"].includes(cat) ? "image" : cat === "speech" ? "audiotrack" : cat === "general" ? "folder" : "description"}
              </span>
              {getCategoryLabel(cat)} ({files.filter((f) => f.category === cat).length})
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="loading-table">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="skeleton-row">
              <div className="skeleton-cell icon" />
              <div className="skeleton-cell name" />
              <div className="skeleton-cell small" />
              <div className="skeleton-cell small" />
              <div className="skeleton-cell small" />
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {!isLoading && apiError && (
        <div className="error-state">
          <span className="material-icons">error_outline</span>
          <p>{apiError}</p>
          <button onClick={() => queryClient.invalidateQueries({ queryKey: ["berkas"] })}>
            <span className="material-icons">refresh</span>
            Coba Lagi
          </button>
        </div>
      )}

      {/* Empty */}
      {!isLoading && !apiError && filteredFiles.length === 0 && (
        <div className="empty-state">
          <span className="material-icons">folder_off</span>
          <p>{searchQuery || filterCategory !== "ALL" ? "Tidak ditemukan berkas yang cocok." : "Belum ada berkas. Upload file pertama!"}</p>
        </div>
      )}

      {/* File Table */}
      {!isLoading && !apiError && filteredFiles.length > 0 && (
        <div className="file-table-wrapper">
          <table className="file-table">
            <thead>
              <tr>
                <th>Nama File</th>
                <th>Kategori</th>
                <th>Ukuran</th>
                <th>Diupload Oleh</th>
                <th>Tanggal</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredFiles.map((file) => (
                <tr key={file.fileId} onDoubleClick={() => handlePreview(file)} style={{ cursor: "pointer" }}>
                  <td>
                    <div className="file-name-cell" onClick={() => handlePreview(file)}>
                      {isImageFile(file) && file.downloadUrl ? (
                        <div className="file-thumb">
                          <img src={file.downloadUrl} alt={file.fileName} />
                        </div>
                      ) : (
                        <div className="file-icon" style={{ color: getFileIconColor(file.fileName) }}>
                          <span className="material-icons">{getFileIcon(file.fileName)}</span>
                        </div>
                      )}
                      <span className="file-name">{file.fileName}</span>
                    </div>
                  </td>
                  <td>
                    <span className="cat-badge">{getCategoryLabel(file.category)}</span>
                  </td>
                  <td>{file.size || "-"}</td>
                  <td>{file.uploadedBy || "-"}</td>
                  <td>{file.uploadedAt ? new Date(file.uploadedAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "-"}</td>
                  <td>
                    <div className="action-btns">
                      <button
                        className="icon-btn preview"
                        title="Lihat"
                        onClick={(e) => { e.stopPropagation(); handlePreview(file); }}
                      >
                        <span className="material-icons">visibility</span>
                      </button>
                      <button
                        className="icon-btn download"
                        title="Download"
                        disabled={actionLoading === file.fileId}
                        onClick={(e) => { e.stopPropagation(); handleDownload(file); }}
                      >
                        <span className="material-icons">download</span>
                      </button>
                      <button
                        className="icon-btn rename"
                        title="Rename"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedFile(file);
                          setRenameValue(file.fileName);
                          setShowRenameModal(true);
                        }}
                      >
                        <span className="material-icons">edit</span>
                      </button>
                      <button
                        className="icon-btn delete"
                        title="Hapus"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedFile(file);
                          setShowDeleteModal(true);
                        }}
                      >
                        <span className="material-icons">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ═══ PREVIEW MODAL ═══ */}
      {showPreviewModal && selectedFile && (
        <div className="modal-overlay preview-overlay" onClick={() => setShowPreviewModal(false)}>
          <div className="preview-modal" onClick={(e) => e.stopPropagation()}>
            <div className="preview-header">
              <h3>{selectedFile.fileName}</h3>
              <div className="preview-actions">
                <button className="preview-action-btn" title="Buka di tab baru" onClick={() => handleOpenInNewTab(selectedFile)}>
                  <span className="material-icons">open_in_new</span>
                </button>
                <button className="preview-action-btn" title="Download" onClick={() => handleDownload(selectedFile)}>
                  <span className="material-icons">download</span>
                </button>
                <button className="preview-action-btn close" onClick={() => setShowPreviewModal(false)}>
                  <span className="material-icons">close</span>
                </button>
              </div>
            </div>
            <div className="preview-body">
              {isImageFile(selectedFile) ? (
                <img src={selectedFile.downloadUrl} alt={selectedFile.fileName} className="preview-image" />
              ) : (
                <div className="preview-fallback">
                  <span className="material-icons" style={{ fontSize: 64, color: getFileIconColor(selectedFile.fileName) }}>
                    {getFileIcon(selectedFile.fileName)}
                  </span>
                  <p>{selectedFile.fileName}</p>
                  <p className="preview-size">{selectedFile.size}</p>
                  <button className="primary-btn" onClick={() => handleOpenInNewTab(selectedFile)}>
                    <span className="material-icons">open_in_new</span>
                    Buka File
                  </button>
                </div>
              )}
            </div>
            <div className="preview-info">
              <span><span className="material-icons">category</span>{getCategoryLabel(selectedFile.category)}</span>
              <span><span className="material-icons">straighten</span>{selectedFile.size}</span>
              <span><span className="material-icons">person</span>{selectedFile.uploadedBy}</span>
              <span><span className="material-icons">schedule</span>{selectedFile.uploadedAt ? new Date(selectedFile.uploadedAt).toLocaleString("id-ID") : "-"}</span>
            </div>
          </div>
        </div>
      )}

      {/* ═══ UPLOAD MODAL ═══ */}
      {showUploadModal && (
        <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Upload File</h2>
              <button className="close-btn" onClick={() => setShowUploadModal(false)}>
                <span className="material-icons">close</span>
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Kategori</label>
                <select value={uploadCategory} onChange={(e) => setUploadCategory(e.target.value)}>
                  <option value="general">Umum</option>
                  <option value="DOKUMEN">Dokumen</option>
                  <option value="FOTO">Foto</option>
                  <option value="OTHER">Lainnya</option>
                </select>
              </div>
              <div className="form-group">
                <label>Pilih File</label>
                <div
                  className={`drop-zone ${selectedUploadFile ? "has-file" : ""}`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    style={{ display: "none" }}
                    onChange={(e) => setSelectedUploadFile(e.target.files?.[0] || null)}
                  />
                  {selectedUploadFile ? (
                    <div className="selected-file">
                      <span className="material-icons">{getFileIcon(selectedUploadFile.name)}</span>
                      <div>
                        <p className="sel-name">{selectedUploadFile.name}</p>
                        <p className="sel-size">{formatFileSize(selectedUploadFile.size)}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="drop-placeholder">
                      <span className="material-icons">cloud_upload</span>
                      <p>Klik untuk memilih file</p>
                      <span className="drop-hint">Atau drag & drop file di sini</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="secondary-btn" onClick={() => { setShowUploadModal(false); setSelectedUploadFile(null); }}>Batal</button>
              <button className="primary-btn" onClick={handleUpload} disabled={actionLoading === "upload" || !selectedUploadFile}>
                <span className="material-icons">cloud_upload</span>
                {actionLoading === "upload" ? "Mengupload..." : "Upload"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ RENAME MODAL ═══ */}
      {showRenameModal && selectedFile && (
        <div className="modal-overlay" onClick={() => setShowRenameModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Ubah Nama File</h2>
              <button className="close-btn" onClick={() => setShowRenameModal(false)}>
                <span className="material-icons">close</span>
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Nama Baru</label>
                <input
                  type="text"
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  placeholder="Masukkan nama file baru"
                  autoFocus
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="secondary-btn" onClick={() => setShowRenameModal(false)}>Batal</button>
              <button className="primary-btn" onClick={handleRename} disabled={actionLoading === "rename" || !renameValue.trim()}>
                <span className="material-icons">save</span>
                {actionLoading === "rename" ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ DELETE MODAL ═══ */}
      {showDeleteModal && selectedFile && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-icon">
              <span className="material-icons">delete_forever</span>
            </div>
            <h3>Hapus File?</h3>
            <p>Apakah Anda yakin ingin menghapus <strong>{selectedFile.fileName}</strong>? Tindakan ini tidak dapat dibatalkan.</p>
            <div className="confirm-actions">
              <button className="secondary-btn" onClick={() => setShowDeleteModal(false)}>Batal</button>
              <button className="danger-btn" onClick={handleDelete} disabled={actionLoading === "delete"}>
                <span className="material-icons">delete</span>
                {actionLoading === "delete" ? "Menghapus..." : "Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .berkas-container { max-width: 1400px; margin: 0 auto; }

        .toast { position: fixed; top: 20px; right: 20px; display: flex; align-items: center; gap: 8px; padding: 12px 20px; border-radius: 10px; font-size: 14px; font-weight: 500; z-index: 1100; animation: slideIn 0.3s ease; }
        .toast.success { background: #dcfce7; color: #16a34a; }
        .toast.error { background: #fee2e2; color: #dc2626; }
        @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }

        .storage-card { background: white; border-radius: 16px; border: 1px solid #f1f5f9; padding: 24px; margin-bottom: 24px; }
        .storage-info { display: flex; align-items: center; gap: 16px; margin-bottom: 16px; }
        .storage-icon { width: 48px; height: 48px; border-radius: 12px; background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); display: flex; align-items: center; justify-content: center; }
        .storage-icon .material-icons { font-size: 24px; color: #0066FF; }
        .storage-text { flex: 1; }
        .storage-text h3 { font-size: 14px; font-weight: 600; color: #1e293b; margin: 0 0 4px 0; }
        .storage-text p { font-size: 13px; color: #64748b; margin: 0; }
        .storage-percent { font-size: 20px; font-weight: 700; color: #1e293b; }
        .storage-bar-bg { height: 8px; border-radius: 4px; background: #f1f5f9; overflow: hidden; }
        .storage-bar-fill { height: 100%; border-radius: 4px; transition: width 0.5s ease; }

        .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 16px; }
        .header-left { display: flex; align-items: center; gap: 16px; }
        .page-header h1 { font-size: 24px; font-weight: 700; color: #1e293b; margin: 0; }
        .file-count { background: #f1f5f9; padding: 6px 12px; border-radius: 20px; font-size: 13px; color: #64748b; font-weight: 500; }
        .header-actions { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
        .search-box { display: flex; align-items: center; gap: 8px; background: white; border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px 16px; min-width: 240px; }
        .search-box .material-icons { color: #94a3b8; font-size: 20px; }
        .search-box input { border: none; outline: none; font-size: 14px; flex: 1; font-family: 'Montserrat', sans-serif; }
        .primary-btn { display: flex; align-items: center; gap: 8px; padding: 10px 18px; background: #0066FF; color: white; border: none; border-radius: 10px; font-weight: 600; cursor: pointer; font-family: 'Montserrat', sans-serif; font-size: 13px; transition: all 0.2s; }
        .primary-btn:hover { background: #0052CC; }
        .primary-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .secondary-btn { display: flex; align-items: center; gap: 8px; padding: 10px 18px; background: #f1f5f9; color: #64748b; border: none; border-radius: 10px; font-weight: 600; cursor: pointer; font-family: 'Montserrat', sans-serif; font-size: 13px; }

        .filter-section { margin-bottom: 20px; }
        .cat-filters { display: flex; gap: 8px; flex-wrap: wrap; }
        .cat-btn { display: flex; align-items: center; gap: 6px; padding: 8px 16px; border: 1px solid #e2e8f0; border-radius: 10px; background: white; color: #64748b; font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.2s; font-family: 'Montserrat', sans-serif; }
        .cat-btn .material-icons { font-size: 18px; }
        .cat-btn:hover { border-color: #0066FF; color: #0066FF; }
        .cat-btn.active { background: #0066FF; color: white; border-color: #0066FF; }
        .cat-btn.active .material-icons { color: white; }

        .file-table-wrapper { background: white; border-radius: 16px; border: 1px solid #f1f5f9; overflow: hidden; }
        .file-table { width: 100%; border-collapse: collapse; }
        .file-table th { padding: 14px 20px; text-align: left; font-size: 12px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; background: #fafafa; border-bottom: 1px solid #f1f5f9; }
        .file-table td { padding: 12px 20px; font-size: 14px; color: #475569; border-bottom: 1px solid #f8fafc; }
        .file-table tr:last-child td { border-bottom: none; }
        .file-table tr:hover td { background: #fafafa; }
        .file-name-cell { display: flex; align-items: center; gap: 12px; cursor: pointer; }
        .file-name-cell:hover .file-name { color: #0066FF; }
        .file-icon { width: 40px; height: 40px; border-radius: 10px; background: #f8fafc; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .file-icon .material-icons { font-size: 22px; }
        .file-thumb { width: 40px; height: 40px; border-radius: 8px; overflow: hidden; flex-shrink: 0; border: 1px solid #e2e8f0; }
        .file-thumb img { width: 100%; height: 100%; object-fit: cover; }
        .file-name { font-weight: 600; color: #1e293b; transition: color 0.2s; }
        .cat-badge { padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 600; background: #f1f5f9; color: #64748b; white-space: nowrap; }
        .action-btns { display: flex; gap: 6px; }
        .icon-btn { width: 34px; height: 34px; border-radius: 8px; border: 1px solid #e2e8f0; background: white; color: #64748b; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; }
        .icon-btn .material-icons { font-size: 18px; }
        .icon-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .icon-btn.preview:hover { background: #8b5cf6; color: white; border-color: #8b5cf6; }
        .icon-btn.download:hover { background: #0066FF; color: white; border-color: #0066FF; }
        .icon-btn.rename:hover { background: #f59e0b; color: white; border-color: #f59e0b; }
        .icon-btn.delete:hover { background: #ef4444; color: white; border-color: #ef4444; }

        .loading-table { background: white; border-radius: 16px; border: 1px solid #f1f5f9; padding: 8px 0; }
        .skeleton-row { display: flex; align-items: center; gap: 16px; padding: 16px 24px; }
        .skeleton-cell { border-radius: 8px; background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; }
        .skeleton-cell.icon { width: 40px; height: 40px; border-radius: 10px; flex-shrink: 0; }
        .skeleton-cell.name { height: 14px; flex: 1; }
        .skeleton-cell.small { height: 14px; width: 80px; }
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

        .error-state, .empty-state { text-align: center; padding: 60px 24px; color: #64748b; }
        .error-state .material-icons { font-size: 48px; color: #ef4444; margin-bottom: 12px; }
        .empty-state .material-icons { font-size: 48px; color: #94a3b8; margin-bottom: 12px; }
        .error-state p, .empty-state p { font-size: 14px; margin-bottom: 16px; }
        .error-state button { display: inline-flex; align-items: center; gap: 6px; padding: 10px 20px; background: #0066FF; color: white; border: none; border-radius: 10px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: 'Montserrat', sans-serif; }
        .error-state button .material-icons { font-size: 16px; color: white; margin-bottom: 0; }

        /* Preview Modal */
        .preview-overlay { background: rgba(0,0,0,0.85); }
        .preview-modal { background: white; width: 100%; max-width: 800px; border-radius: 20px; overflow: hidden; box-shadow: 0 25px 50px rgba(0,0,0,0.3); max-height: 90vh; display: flex; flex-direction: column; }
        .preview-header { padding: 16px 24px; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; }
        .preview-header h3 { font-size: 15px; font-weight: 600; color: #1e293b; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1; margin-right: 12px; }
        .preview-actions { display: flex; gap: 8px; }
        .preview-action-btn { width: 36px; height: 36px; border-radius: 8px; border: 1px solid #e2e8f0; background: white; color: #64748b; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; }
        .preview-action-btn:hover { background: #0066FF; color: white; border-color: #0066FF; }
        .preview-action-btn.close:hover { background: #ef4444; border-color: #ef4444; }
        .preview-body { flex: 1; overflow: auto; display: flex; align-items: center; justify-content: center; background: #f8fafc; min-height: 300px; }
        .preview-image { max-width: 100%; max-height: 60vh; object-fit: contain; }
        .preview-fallback { text-align: center; padding: 40px; }
        .preview-fallback p { font-size: 14px; color: #64748b; margin: 12px 0 4px 0; font-weight: 600; }
        .preview-size { font-size: 12px; color: #94a3b8; margin-bottom: 16px !important; }
        .preview-info { padding: 12px 24px; border-top: 1px solid #f1f5f9; display: flex; gap: 24px; flex-wrap: wrap; }
        .preview-info span { display: flex; align-items: center; gap: 4px; font-size: 12px; color: #64748b; }
        .preview-info .material-icons { font-size: 16px; }

        /* Standard Modals */
        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
        .modal-box { background: white; width: 100%; max-width: 480px; border-radius: 20px; overflow: hidden; box-shadow: 0 25px 50px rgba(0,0,0,0.2); }
        .modal-header { padding: 20px 24px; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; }
        .modal-header h2 { font-size: 18px; font-weight: 700; color: #1e293b; margin: 0; }
        .close-btn { width: 36px; height: 36px; border-radius: 8px; border: none; background: #f1f5f9; color: #64748b; display: flex; align-items: center; justify-content: center; cursor: pointer; }
        .modal-body { padding: 24px; }
        .modal-footer { padding: 16px 24px; border-top: 1px solid #f1f5f9; display: flex; gap: 12px; justify-content: flex-end; }
        .form-group { margin-bottom: 20px; }
        .form-group label { display: block; font-size: 13px; font-weight: 600; color: #475569; margin-bottom: 8px; }
        .form-group input, .form-group select { width: 100%; padding: 12px 16px; border: 1px solid #e2e8f0; border-radius: 10px; font-size: 14px; font-family: 'Montserrat', sans-serif; transition: all 0.2s; }
        .form-group input:focus, .form-group select:focus { outline: none; border-color: #0066FF; box-shadow: 0 0 0 3px rgba(0,102,255,0.1); }
        .drop-zone { border: 2px dashed #e2e8f0; border-radius: 12px; padding: 32px 24px; cursor: pointer; transition: all 0.2s; text-align: center; }
        .drop-zone:hover { border-color: #0066FF; background: #eff6ff; }
        .drop-zone.has-file { border-color: #16a34a; background: #f0fdf4; border-style: solid; }
        .drop-placeholder .material-icons { font-size: 40px; color: #94a3b8; margin-bottom: 8px; }
        .drop-placeholder p { font-size: 14px; color: #64748b; margin: 0 0 4px 0; font-weight: 500; }
        .drop-hint { font-size: 12px; color: #94a3b8; }
        .selected-file { display: flex; align-items: center; gap: 12px; text-align: left; }
        .selected-file .material-icons { font-size: 32px; color: #16a34a; }
        .sel-name { font-size: 14px; font-weight: 600; color: #1e293b; margin: 0 0 2px 0; }
        .sel-size { font-size: 12px; color: #64748b; margin: 0; }
        .confirm-modal { background: white; width: 100%; max-width: 400px; border-radius: 20px; padding: 32px; text-align: center; box-shadow: 0 25px 50px rgba(0,0,0,0.2); }
        .confirm-icon { width: 64px; height: 64px; border-radius: 50%; background: #fee2e2; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; }
        .confirm-icon .material-icons { font-size: 32px; color: #dc2626; }
        .confirm-modal h3 { font-size: 18px; font-weight: 700; color: #1e293b; margin: 0 0 8px 0; }
        .confirm-modal p { font-size: 14px; color: #64748b; margin: 0 0 24px 0; line-height: 1.5; }
        .confirm-actions { display: flex; gap: 12px; justify-content: center; }
        .danger-btn { display: flex; align-items: center; gap: 8px; padding: 12px 20px; background: #dc2626; color: white; border: none; border-radius: 10px; font-weight: 600; cursor: pointer; font-family: 'Montserrat', sans-serif; font-size: 13px; }
        .danger-btn:hover { background: #b91c1c; }
        .danger-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        @media (max-width: 768px) {
          .page-header { flex-direction: column; align-items: flex-start; }
          .header-actions { width: 100%; flex-direction: column; }
          .search-box { min-width: 100%; }
          .file-table-wrapper { overflow-x: auto; }
          .preview-modal { max-width: 100%; }
        }
      `}</style>
    </div>
  );
}
