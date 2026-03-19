import { getAccessToken, getUserData } from "@/lib/auth";

const BASE_URL = "https://asia-southeast2-hora-7394b.cloudfunctions.net/api";

/**
 * Helper: get Authorization headers
 */
function getHeaders(): Record<string, string> {
  const token = getAccessToken();
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

/**
 * Helper: handle API response
 */
async function handleResponse(response: Response) {
  if (response.status === 401) {
    throw new Error("Token telah kadaluarsa. Silakan login ulang.");
  }
  if (response.status === 403) {
    throw new Error("Anda tidak memiliki akses.");
  }
  if (!response.ok) {
    const err = await response.json().catch(() => null);
    throw new Error(err?.message || `Error ${response.status}`);
  }
  return response.json();
}

// ─────────────────────────────────────────────
// 1. COMPANY PROFILE
// ─────────────────────────────────────────────

export interface CompanyProfile {
  idPerusahaan: string;
  namaPerusahaan: string;
  alamat: string;
  telepon: string;
  email: string;
  logoUrl: string;
}

export async function getCompanyProfile(): Promise<CompanyProfile> {
  const res = await fetch(`${BASE_URL}/api/profile/company-profile`, {
    method: "GET",
    headers: getHeaders(),
  });
  const result = await handleResponse(res);
  return result.data || result;
}

export async function updateCompanyProfile(data: {
  namaPerusahaan: string;
  alamatLoc: { lat: number; long: number; address: string };
}): Promise<any> {
  const res = await fetch(`${BASE_URL}/api/profile/company-profile`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function uploadCompanyLogo(file: File): Promise<any> {
  const token = getAccessToken();
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${BASE_URL}/api/profile/company-logo`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });
  return handleResponse(res);
}

// ─────────────────────────────────────────────
// 2. USER PROFILE
// ─────────────────────────────────────────────

export interface UserProfile {
  username: string;
  email: string;
  role: string;
  photoURL: string;
  jabatan: string;
  noTelp?: string;
  noWA?: string;
  namaPerusahaan?: string;
  idPerusahaan?: string;
  gender?: string;
  joinDate?: string;
  status?: string;
  alamatLoc?: {
    lat: number;
    long: number;
    address: string;
  };
}

export async function getUserProfile(email?: string): Promise<UserProfile> {
  const userEmail = email || getUserData()?.email || "";
  const res = await fetch(
    `${BASE_URL}/api/profile/user-profile/${encodeURIComponent(userEmail)}`,
    { method: "GET", headers: getHeaders() }
  );
  const result = await handleResponse(res);

  // API returns an array like [{...}], get first item
  const raw = Array.isArray(result) ? result[0] : (result.data ? (Array.isArray(result.data) ? result.data[0] : result.data) : result);

  if (!raw) {
    return { username: "", email: userEmail, role: "", photoURL: "", jabatan: "" };
  }

  // Map actual API fields to our interface
  return {
    username: raw.namaKaryawan || raw.displayName || raw.username || "",
    email: raw.alamatEmail || raw.email || userEmail,
    role: raw.role || raw.jabatan || "",
    photoURL: raw.foto || raw.photoURL || "",
    jabatan: raw.jabatan || "",
    noTelp: raw.noHP || raw.noTelp || "",
    noWA: raw.noWA || "",
    namaPerusahaan: raw.namaPerusahaan || "",
    idPerusahaan: raw.idPerusahaan || "",
    gender: raw.gender || "",
    joinDate: raw.joinDate || "",
    status: raw.status || "",
    alamatLoc: {
      lat: parseFloat(raw.alamatLatitude) || 0,
      long: parseFloat(raw.alamatLongtitude) || 0,
      address: raw.alamatLoc || "",
    },
  };
}

export async function updateUserProfile(data: {
  username: string;
  noTelp: string;
  noWA: string;
  alamatLoc: { lat: number; long: number; address: string };
}): Promise<any> {
  const res = await fetch(`${BASE_URL}/api/profile/user-profile`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function uploadAvatar(file: File): Promise<any> {
  const token = getAccessToken();
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${BASE_URL}/api/profile/upload-avatar`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });
  return handleResponse(res);
}

// ─────────────────────────────────────────────
// 3. CHANGE EMAIL
// ─────────────────────────────────────────────

export async function changeEmail(newEmail: string): Promise<any> {
  const res = await fetch(`${BASE_URL}/api/profile/change-email`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify({ newEmail }),
  });
  return handleResponse(res);
}

// ─────────────────────────────────────────────
// 4. DELETE ACCOUNT
// ─────────────────────────────────────────────

export async function deleteAccount(): Promise<any> {
  const res = await fetch(`${BASE_URL}/api/profile/account`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  return handleResponse(res);
}
