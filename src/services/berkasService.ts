import { getAccessToken } from "@/lib/auth";

const BASE_URL = "https://asia-southeast2-hora-7394b.cloudfunctions.net/api";

function getHeaders(): Record<string, string> {
  const token = getAccessToken();
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

async function handleResponse(response: Response) {
  if (response.status === 401) throw new Error("Token telah kadaluarsa. Silakan login ulang.");
  if (response.status === 403) throw new Error("Anda tidak memiliki akses.");
  if (!response.ok) {
    const err = await response.json().catch(() => null);
    throw new Error(err?.message || `Error ${response.status}`);
  }
  return response.json();
}

// ─── INTERFACES ──────────────────────────────
export interface BerkasFile {
  fileId: string;
  fileName: string;
  category: string;
  size: string;
  uploadedBy: string;
  uploadedAt: string;
  downloadUrl: string;
  mimeType: string;
}

export interface StorageUsage {
  totalSize: string;
  totalBytes: number;
  fileCount: number;
  maxSize: number;
  maxSizeFormatted: string;
}

// ─── 1. GET FILE LIST ────────────────────────
export async function getFiles(): Promise<BerkasFile[]> {
  const res = await fetch(`${BASE_URL}/api/berkas/list?category=ALL`, {
    method: "GET",
    headers: getHeaders(),
  });
  const result = await handleResponse(res);
  const raw = result.data || result || [];

  return (Array.isArray(raw) ? raw : []).map((item: any) => ({
    fileId: item.id || item.fileId || "",
    fileName: item.fileName || item.name || "",
    category: item.category || "",
    size: item.size || "0",
    uploadedBy: item.uploaderName || item.uploadedBy || "-",
    uploadedAt: item.createdAt || item.uploadedAt || "",
    downloadUrl: item.downloadUrl || item.url || "",
    mimeType: item.mimeType || "",
  }));
}

// ─── 2. UPLOAD FILE ─────────────────────────
export async function uploadFile(file: File, category: string): Promise<any> {
  const token = getAccessToken();
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${BASE_URL}/api/berkas/upload?category=${encodeURIComponent(category)}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });
  return handleResponse(res);
}

// ─── 3. DOWNLOAD FILE ───────────────────────
export function getDownloadUrl(fileId: string): string {
  const token = getAccessToken();
  return `${BASE_URL}/api/berkas/download/${encodeURIComponent(fileId)}?token=${encodeURIComponent(token || "")}`;
}

export async function downloadFile(fileId: string): Promise<void> {
  const token = getAccessToken();
  const res = await fetch(`${BASE_URL}/api/berkas/download/${encodeURIComponent(fileId)}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) throw new Error("Gagal mengunduh file");

  const blob = await res.blob();
  const contentDisposition = res.headers.get("content-disposition");
  let filename = "download";
  if (contentDisposition) {
    const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
    if (match) filename = match[1].replace(/['"]/g, "");
  }

  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

// ─── 4. RENAME FILE ─────────────────────────
export async function renameFile(fileId: string, newFileName: string): Promise<any> {
  const res = await fetch(`${BASE_URL}/api/berkas/${encodeURIComponent(fileId)}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify({ newFileName }),
  });
  return handleResponse(res);
}

// ─── 5. DELETE FILE ─────────────────────────
export async function deleteFile(fileId: string): Promise<any> {
  const res = await fetch(`${BASE_URL}/api/berkas/${encodeURIComponent(fileId)}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  return handleResponse(res);
}

// ─── 6. GET STORAGE USAGE ───────────────────
export async function getStorageUsage(): Promise<StorageUsage> {
  const res = await fetch(`${BASE_URL}/api/berkas/total-size`, {
    method: "GET",
    headers: getHeaders(),
  });
  const raw = await handleResponse(res);
  const data = raw.data || raw;
  return {
    totalSize: data.totalSize || "0",
    totalBytes: data.totalBytes || 0,
    fileCount: data.fileCount || 0,
    maxSize: data.maxSize || 500 * 1024 * 1024,  // default 500MB
    maxSizeFormatted: data.maxSizeFormatted || "500 MB",
  };
}
