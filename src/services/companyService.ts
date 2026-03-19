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

// ─── 1. GET COMPANY USERS ─────────────────────────
export interface CompanyUser {
  email: string;
  displayName: string;
  role: string;
  status: string;
  photoURL?: string;
  username?: string;
  jabatan?: string;
}

export async function getCompanyUsers(): Promise<CompanyUser[]> {
  const res = await fetch(`${BASE_URL}/api/company/list`, {
    method: "GET",
    headers: getHeaders(),
  });
  const result = await handleResponse(res);
  return result.data || result || [];
}

// ─── 2. VERIFY EMPLOYEE ──────────────────────────
export async function verifyEmployee(targetEmail: string, approved: boolean): Promise<any> {
  const res = await fetch(`${BASE_URL}/api/company/verify-employee`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ targetEmail, approved }),
  });
  return handleResponse(res);
}

// ─── 3. PROMOTE / DEMOTE ROLE ────────────────────
export async function updateRole(targetEmail: string, action: "promote" | "demote"): Promise<any> {
  const res = await fetch(`${BASE_URL}/api/company/update-role`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ targetEmail, action }),
  });
  return handleResponse(res);
}

// ─── 4. SEND INVITE ──────────────────────────────
export async function sendInvite(targetEmail: string): Promise<any> {
  const res = await fetch(`${BASE_URL}/api/company/send-invite`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ targetEmail }),
  });
  return handleResponse(res);
}

// ─── 5. GET PUBLIC INVITE LINK ───────────────────
export interface PublicLink {
  publicLink: string;
  idPerusahaan: string;
}

export async function getPublicInviteLink(): Promise<PublicLink> {
  const res = await fetch(`${BASE_URL}/api/company/public-link`, {
    method: "GET",
    headers: getHeaders(),
  });
  return handleResponse(res);
}

// ─── 6. FIRE EMPLOYEE (PHK) ─────────────────────
export async function fireEmployee(targetEmail: string, reason: string): Promise<any> {
  const res = await fetch(`${BASE_URL}/api/company/fire-employee`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ targetEmail, reason }),
  });
  return handleResponse(res);
}

// ─── 7. GET COMPANY ACTIVITY LOG ─────────────────
export interface ActivityLog {
  action: string;
  description: string;
  target: string;
  timestamp: string;
  performedBy: string;
}

export async function getCompanyLogs(): Promise<ActivityLog[]> {
  const res = await fetch(`${BASE_URL}/api/company/log-activity`, {
    method: "GET",
    headers: getHeaders(),
  });
  const result = await handleResponse(res);
  return result.data || result || [];
}

// ─── 8. ADD ACTIVITY LOG ─────────────────────────
export async function addCompanyLog(data: {
  action: string;
  description: string;
  target: string;
}): Promise<any> {
  const res = await fetch(`${BASE_URL}/api/company/log-activity`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

// ─── 9. DELETE COMPANY ───────────────────────────
export async function deleteCompany(): Promise<any> {
  const res = await fetch(`${BASE_URL}/api/company/delete-company`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  return handleResponse(res);
}
