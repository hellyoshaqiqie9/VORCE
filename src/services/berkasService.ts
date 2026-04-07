import { getAccessToken } from "@/lib/auth";

const BASE_URL = "https://asia-southeast2-hora-7394b.cloudfunctions.net/api";
type JsonRecord = Record<string, unknown>;

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

function asRecord(value: unknown): JsonRecord {
  return typeof value === "object" && value !== null ? (value as JsonRecord) : {};
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
  const payload = asRecord(result);
  const raw = payload.data || result || [];

  return (Array.isArray(raw) ? raw : []).map((item) => {
    const source = asRecord(item);
    return {
      fileId: String(source.id || source.fileId || ""),
      fileName: String(source.fileName || source.name || ""),
      category: String(source.category || ""),
      size: String(source.size || "0"),
      uploadedBy: String(source.uploaderName || source.uploadedBy || "-"),
      uploadedAt: String(source.createdAt || source.uploadedAt || ""),
      downloadUrl: String(source.downloadUrl || source.url || ""),
      mimeType: String(source.mimeType || ""),
    };
  });
}

// ─── 2. UPLOAD FILE ─────────────────────────
export async function uploadFile(file: File, category: string): Promise<unknown> {
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
  try {
    const downloadUrl = getDownloadUrl(fileId);
    
    // Create a hidden anchor element
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.setAttribute("download", ""); // Suggest a download
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } catch (error) {
    console.error("Download error:", error);
    throw new Error("Gagal mengunduh file");
  }
}

// ─── 4. RENAME FILE ─────────────────────────
export async function renameFile(fileId: string, newFileName: string): Promise<unknown> {
  const res = await fetch(`${BASE_URL}/api/berkas/${encodeURIComponent(fileId)}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify({ newFileName }),
  });
  return handleResponse(res);
}

// ─── 5. DELETE FILE ─────────────────────────
export async function deleteFile(fileId: string): Promise<unknown> {
  const res = await fetch(`${BASE_URL}/api/berkas/${encodeURIComponent(fileId)}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  return handleResponse(res);
}

// ─── 6. GET STORAGE USAGE ───────────────────
export async function getStorageUsage(): Promise<StorageUsage> {
  const [resTotal, resCompany] = await Promise.all([
    fetch(`${BASE_URL}/api/berkas/total-size`, { method: "GET", headers: getHeaders() }).catch(() => null),
    fetch(`${BASE_URL}/api/profile/company-profile`, { method: "GET", headers: getHeaders() }).catch(() => null)
  ]);

  let data: any = {};
  if (resTotal && resTotal.ok) {
    const raw = await handleResponse(resTotal).catch(() => ({}));
    data = raw.data || raw;
  }

  let companyData: any = {};
  if (resCompany && resCompany.ok) {
    const raw = await handleResponse(resCompany).catch(() => ({}));
    companyData = raw.data || raw;
  }

  // Fallback defaults
  let maxBytes = 500 * 1024 * 1024;
  let maxSizeFormatted = "500 MB";

  const companyCapacity = companyData.limitPenyimpanan ?? companyData.maxStorage ?? companyData.capacity ?? companyData.storageLimit ?? companyData.kuotaPenyimpanan ?? companyData.maxSize;
  
  if (companyCapacity) {
    if (typeof companyCapacity === 'number') maxBytes = companyCapacity;
    else if (typeof companyCapacity === 'string') {
      const parsed = parseInt(companyCapacity.replace(/,/g, ''), 10);
      if (!isNaN(parsed) && parsed > 0) maxBytes = parsed;
    }
  } else if (data.maxSize) {
    maxBytes = data.maxSize;
  }

  if (maxBytes) {
      const k = 1024;
      const sizes = ["B", "KB", "MB", "GB", "TB"];
      const i = Math.floor(Math.log(maxBytes) / Math.log(k));
      maxSizeFormatted = parseFloat((maxBytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[Math.max(0, i)];
  }

  if (data.maxSizeFormatted && !companyCapacity) { 
     maxSizeFormatted = data.maxSizeFormatted; 
  }

  return {
    totalSize: data.totalSize || "0",
    totalBytes: data.totalBytes || 0,
    fileCount: data.fileCount || 0,
    maxSize: maxBytes,
    maxSizeFormatted: maxSizeFormatted,
  };
}
