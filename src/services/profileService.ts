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
  whatsapp: string;
  logoUrl: string;
}

export async function getCompanyProfile(): Promise<CompanyProfile> {
  try {
    const token = getAccessToken();
    // Add cache-busting to prevent 304 Not Modified (which has empty body)
    const res = await fetch(`${BASE_URL}/api/profile/company-profile?t=${Date.now()}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      console.error("getCompanyProfile API error:", res.status);
      return { idPerusahaan: "", namaPerusahaan: "", alamat: "", telepon: "", whatsapp: "", logoUrl: "" };
    }

    const text = await res.text();
    if (!text || text.trim() === "") {
      console.error("getCompanyProfile: empty response body");
      return { idPerusahaan: "", namaPerusahaan: "", alamat: "", telepon: "", whatsapp: "", logoUrl: "" };
    }

    let result: any;
    try { result = JSON.parse(text); } catch { 
      console.error("getCompanyProfile: failed to parse JSON:", text.substring(0, 100)); 
      return { idPerusahaan: "", namaPerusahaan: "", alamat: "", telepon: "", whatsapp: "", logoUrl: "" }; 
    }

    // Handle nested responses: {data: [...]}, "stringified json", etc.
    if (result?.data) result = result.data;
    if (typeof result === "string") {
      try { result = JSON.parse(result); } catch {}
    }
    if (result?.data) result = result.data;
    // API returns array like [{...}]
    if (Array.isArray(result) && result.length > 0) result = result[0];

    console.log("Company profile loaded:", result?.namaPerusahaan, result?.idperusahaan);

    return {
      idPerusahaan: result?.idperusahaan || result?.idPerusahaan || "",
      namaPerusahaan: result?.namaPerusahaan ? result.namaPerusahaan.trim() : "",
      alamat: result?.alamatLoc || "",
      telepon: result?.noTelp || "",
      whatsapp: result?.noWA || "",
      logoUrl: result?.logoPerusahaan || result?.logo || "",
    };
  } catch (e) {
    console.error("getCompanyProfile fetch failed:", e);
    return { idPerusahaan: "", namaPerusahaan: "", alamat: "", telepon: "", whatsapp: "", logoUrl: "" };
  }
}

export async function updateCompanyProfile(data: {
  namaPerusahaan: string;
  alamatLoc: string;
  noTelp: string;
  noWA: string;
}): Promise<any> {
  const token = getAccessToken();
  const userData = getUserData();
  const payload = {
    idperusahaan: userData?.idPerusahaan || "CTD96L",
    namaPerusahaan: data.namaPerusahaan,
    alamatLoc: data.alamatLoc,
    noTelp: data.noTelp,
    noWA: data.noWA,
    alamatLongtitude: "0",
    alamatLatitude: "0"
  };
  
  const res = await fetch(`${BASE_URL}/api/profile/company-profile`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(payload),
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
  const userData = getUserData();
  const res = await fetch(`${BASE_URL}/api/profile/change-email`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify({ 
      idperusahaan: userData?.idPerusahaan || "CTD96L",
      email: newEmail 
    }),
  });
  return handleResponse(res);
}

// ─────────────────────────────────────────────
// 4. SUBSCRIPTION STATUS
// ─────────────────────────────────────────────

export interface SubscriptionStatus {
  status: string;
  planName?: string;
  expiredAt?: string;
  maxEmployees?: number;
  usedEmployees?: number;
  features?: string[];
  isActive?: boolean;
  daysLeft?: number;
}

export async function getSubscriptionStatus(): Promise<SubscriptionStatus> {
  const res = await fetch(`${BASE_URL}/api/subscription/status`, {
    method: "GET",
    headers: getHeaders(),
  });
  const result = await handleResponse(res);
  const raw = result?.data || result;
  return {
    status: raw?.status || "inactive",
    planName: raw?.planName || raw?.plan || raw?.namapaket || "",
    expiredAt: raw?.expiredAt || raw?.expiredDate || raw?.tanggalBerakhir || "",
    maxEmployees: raw?.maxEmployees || raw?.maxKaryawan || 0,
    usedEmployees: raw?.usedEmployees || raw?.totalKaryawan || 0,
    features: raw?.features || [],
    isActive: raw?.isActive ?? raw?.status === "active",
    daysLeft: raw?.daysLeft ?? undefined,
  };
}

// ─────────────────────────────────────────────
// 5. DELETE ACCOUNT
// ─────────────────────────────────────────────

export async function deleteAccount(): Promise<any> {
  const res = await fetch(`${BASE_URL}/api/profile/account`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  return handleResponse(res);
}
