import { signInWithPopup, signOut } from "firebase/auth";
import { auth, googleProvider } from "./firebase";

const BASE_URL = "https://asia-southeast2-hora-7394b.cloudfunctions.net/api";

// Token storage keys
const TOKEN_KEY = "vorce_access_token";
const USER_KEY = "vorce_user_data";
const TOKEN_EXPIRY_KEY = "vorce_token_expiry";

/**
 * Detect device info for the backend
 */
function getDeviceInfo(): string {
  if (typeof window === "undefined") return "Web Browser";

  const ua = navigator.userAgent;
  let browser = "Unknown Browser";
  let os = "Unknown OS";

  // Detect browser
  if (ua.includes("Chrome") && !ua.includes("Edg")) browser = "Chrome";
  else if (ua.includes("Firefox")) browser = "Firefox";
  else if (ua.includes("Safari") && !ua.includes("Chrome")) browser = "Safari";
  else if (ua.includes("Edg")) browser = "Edge";
  else if (ua.includes("Opera") || ua.includes("OPR")) browser = "Opera";

  // Detect OS
  if (ua.includes("Windows")) os = "Windows";
  else if (ua.includes("Mac OS")) os = "macOS";
  else if (ua.includes("Linux")) os = "Linux";
  else if (ua.includes("Android")) os = "Android";
  else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";

  return `Web Browser - ${browser} (${os})`;
}

/**
 * Sign in with Google via Firebase popup, then authenticate with backend
 */
export async function loginWithGoogle(): Promise<{
  success: boolean;
  data?: any;
  error?: string;
}> {
  try {
    // Step 1: Google Sign-In via Firebase
    const result = await signInWithPopup(auth, googleProvider);
    const idToken = await result.user.getIdToken();

    // Step 2: Send ID Token to backend
    const deviceInfo = getDeviceInfo();
    const response = await fetch(`${BASE_URL}/api/Login/login-google-admin`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        idToken,
        deviceInfo,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      const errorMessage =
        errorData?.message || errorData?.error || `Login gagal (${response.status})`;
      
      // Sign out from Firebase since backend auth failed
      await signOut(auth);
      
      return {
        success: false,
        error: errorMessage,
      };
    }

    const data = await response.json();

    // Step 3: Save tokens securely
    saveAuthData(data);

    // Step 4: Sign out from Firebase (we only needed the ID token)
    await signOut(auth);

    return {
      success: true,
      data,
    };
  } catch (error: any) {
    // Handle specific Firebase errors
    if (error.code === "auth/popup-closed-by-user") {
      return {
        success: false,
        error: "Login dibatalkan. Silakan coba lagi.",
      };
    }

    if (error.code === "auth/popup-blocked") {
      return {
        success: false,
        error: "Popup diblokir oleh browser. Izinkan popup dan coba lagi.",
      };
    }

    if (error.code === "auth/network-request-failed") {
      return {
        success: false,
        error: "Koneksi gagal. Periksa jaringan internet Anda.",
      };
    }

    // Network / timeout error
    if (error.name === "TypeError" && error.message === "Failed to fetch") {
      return {
        success: false,
        error: "Tidak dapat menghubungi server. Periksa koneksi internet Anda.",
      };
    }

    console.error("Login error:", error);
    return {
      success: false,
      error: error.message || "Terjadi kesalahan. Silakan coba lagi.",
    };
  }
}

/**
 * Save authentication data from backend response
 */
function saveAuthData(data: any): void {
  try {
    // Save access token
    const token = data.token || data.accessToken || data.access_token;
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    }

    // Save user data
    const user = data.user || data.data || data;
    localStorage.setItem(USER_KEY, JSON.stringify(user));

    // Save token expiry (default 24 hours if not provided)
    const expiryMs = data.expiresIn
      ? Date.now() + data.expiresIn * 1000
      : Date.now() + 24 * 60 * 60 * 1000;
    localStorage.setItem(TOKEN_EXPIRY_KEY, expiryMs.toString());

    // Keep backward compat with old admin layout
    localStorage.setItem("adminLoggedIn", "true");
  } catch (e) {
    console.error("Failed to save auth data:", e);
  }
}

/**
 * Get stored access token (returns null if expired)
 */
export function getAccessToken(): string | null {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);

    if (!token) return null;

    // Check expiry
    if (expiry && Date.now() > parseInt(expiry, 10)) {
      logout(); // Auto-logout if expired
      return null;
    }

    return token;
  } catch {
    return null;
  }
}

/**
 * Get stored user data
 */
export function getUserData(): any | null {
  try {
    const data = localStorage.getItem(USER_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

/**
 * Check if user is authenticated (token exists and not expired)
 */
export function isAuthenticated(): boolean {
  return getAccessToken() !== null;
}

/**
 * Logout - clear all auth data
 */
export function logout(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
    localStorage.removeItem("adminLoggedIn");
  } catch (e) {
    console.error("Logout error:", e);
  }
}
