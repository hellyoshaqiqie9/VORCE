import { getAccessToken } from "@/lib/auth";

const BASE_URL = "https://api-y4ntpb3uvq-et.a.run.app";

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

export interface LeaveRequest {
  leaveId: string;
  email: string;
  displayName: string;
  jenisIzin: string;
  tanggalMulai: string;
  tanggalSelesai: string;
  alasan: string;
  status: string;
  approvedBy: string;
  // mapped extras
  attachment?: string;
  fileId?: string;
}

// ─── 1. GET LEAVE LIST ──────────────────────
export async function getLeaveList(): Promise<LeaveRequest[]> {
  const res = await fetch(`${BASE_URL}/api/izin/list`, {
    method: "GET",
    headers: getHeaders(),
  });
  const result = await handleResponse(res);
  
  // Debug: log raw API response to find correct field names
  console.log("=== RAW IZIN API RESPONSE ===", JSON.stringify(result, null, 2));
  
  const raw = result.data || result || [];
  
  if (Array.isArray(raw) && raw.length > 0) {
    console.log("=== FIRST ITEM KEYS ===", Object.keys(raw[0]));
    console.log("=== FIRST ITEM ===", JSON.stringify(raw[0], null, 2));
  }
  
  return (Array.isArray(raw) ? raw : []).map((item: any) => ({
    leaveId: item.leaveId || item.id || item.izinId || item._id || "",
    email: item.email || item.emailKaryawan || item.userEmail || "",
    displayName: item.displayName || item.name || item.nama || item.namaKaryawan || item.userName || item.namaLengkap || item.fullName || item.employee || "",
    jenisIzin: item.jenisIzin || item.tipeIzin || item.type || item.jenis || item.leaveType || "",
    tanggalMulai: item.tanggalMulai || item.startDate || item.mulai || item.start || item.dari || "",
    tanggalSelesai: item.tanggalSelesai || item.endDate || item.selesai || item.end || item.sampai || "",
    alasan: item.alasan || item.keterangan || item.reason || item.description || item.catatan || "",
    status: item.status || "pending",
    approvedBy: item.approvedBy || item.approver || item.disetujuiOleh || "",
    attachment: item.attachment || item.fileName || item.file || item.lampiran || "",
    fileId: item.fileId || item.file_id || "",
  }));
}


// ─── 2. APPROVE LEAVE ───────────────────────
export async function approveLeave(leaveId: string): Promise<any> {
  const res = await fetch(`${BASE_URL}/api/izin/${encodeURIComponent(leaveId)}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify({ status: "approved" }),
  });
  return handleResponse(res);
}

// ─── 3. REJECT LEAVE ────────────────────────
export async function rejectLeave(leaveId: string): Promise<any> {
  const res = await fetch(`${BASE_URL}/api/izin/${encodeURIComponent(leaveId)}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify({ status: "rejected" }),
  });
  return handleResponse(res);
}

// ─── 4. UPDATE LEAVE ────────────────────────
export async function updateLeave(
  leaveId: string,
  data: {
    tipeIzin: string;
    startDate: string;
    endDate: string;
    keterangan: string;
    fileId?: string;
  }
): Promise<any> {
  const res = await fetch(`${BASE_URL}/api/izin/${encodeURIComponent(leaveId)}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

// ─── 5. DELETE LEAVE ────────────────────────
export async function deleteLeave(leaveId: string): Promise<any> {
  const res = await fetch(`${BASE_URL}/api/izin/${encodeURIComponent(leaveId)}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  return handleResponse(res);
}
