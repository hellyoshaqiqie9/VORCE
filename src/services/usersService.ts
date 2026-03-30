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

// ─── INTERFACE ────────────────────────────────────
export interface AppUser {
  userId: string;
  name: string;
  email: string;
  avatar: string | null;
  companyId?: string;
  groupId?: string;
  role: "admin" | "employee" | string;
}

// ─── In-memory cache ──────────────────────────────
let cachedUsers: AppUser[] | null = null;

// ─── 1. GET ALL USERS ─────────────────────────────
export async function getAllUsers(forceRefresh = false): Promise<AppUser[]> {
  if (cachedUsers && !forceRefresh) return cachedUsers;

  const headers = getHeaders();

  // Try /api/users/list first (new endpoint)
  try {
    const res = await fetch(`${BASE_URL}/api/users/list`, {
      method: "GET",
      headers,
    });
    if (res.ok) {
      const result = await res.json();
      const users: AppUser[] = (Array.isArray(result) ? result : (result.data || result.users || [])).map(mapToAppUser);
      cachedUsers = users;
      return users;
    }
  } catch (e) {
    // Network error, try fallback
  }

  // Fallback: /api/company/list (known working endpoint)
  try {
    const res2 = await fetch(`${BASE_URL}/api/company/list`, {
      method: "GET",
      headers,
    });
    if (res2.ok) {
      const result2 = await res2.json();
      const raw = result2.data || result2 || [];
      const users: AppUser[] = (Array.isArray(raw) ? raw : []).map(mapToAppUser);
      cachedUsers = users;
      return users;
    }
  } catch (e) {
    // Both failed
  }

  console.warn("Both /api/users/list and /api/company/list failed. Returning empty.");
  return [];
}

/** Normalize any user-like object from either API into AppUser */
function mapToAppUser(u: any): AppUser {
  return {
    userId: u.userId || u.id || u.uid || "",
    name: u.name || u.displayName || u.username || u.namaLengkap || u.email?.split("@")[0] || "Unknown",
    email: u.email || u.emailAddress || "",
    avatar: u.avatar || u.photoURL || u.photo || null,
    companyId: u.companyId || u.idPerusahaan || "",
    groupId: u.groupId || u.department || "",
    role: u.role || u.status || "employee",
  };
}

// ─── 2. GET USER DETAIL ───────────────────────────
export async function getUserDetail(userId: string): Promise<AppUser> {
  const res = await fetch(`${BASE_URL}/api/users/${encodeURIComponent(userId)}`, {
    method: "GET",
    headers: getHeaders(),
  });
  return handleResponse(res);
}

// ─── 3. SEARCH USERS ──────────────────────────────
export async function searchUsers(query: string): Promise<AppUser[]> {
  const res = await fetch(`${BASE_URL}/api/users/search?q=${encodeURIComponent(query)}`, {
    method: "GET",
    headers: getHeaders(),
  });
  const result = await handleResponse(res);
  return Array.isArray(result) ? result : (result.data || result.users || []);
}

// ─── HELPERS ──────────────────────────────────────

/** Map userId/email to display name. Returns "Unknown" if not found. */
export function resolveUserName(users: AppUser[], identifier: string): string {
  const u = users.find(u => u.userId === identifier || u.email === identifier);
  return u?.name || identifier || "Unknown";
}

/** Get avatar URL with fallback to ui-avatars */
export function resolveUserAvatar(users: AppUser[], identifier: string): string {
  const u = users.find(u => u.userId === identifier || u.email === identifier);
  if (u?.avatar) return u.avatar;
  const name = u?.name || identifier || "U";
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0066FF&color=fff&size=80`;
}

/** Get initials from a user name */
export function getUserInitialsFromName(name: string): string {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase();
  return parts[0].substring(0, 2).toUpperCase();
}

/** Clear in-memory cache (e.g. on logout) */
export function clearUsersCache(): void {
  cachedUsers = null;
}
