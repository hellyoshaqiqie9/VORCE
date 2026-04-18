import { auth, googleProvider, appleProvider } from "./firebase";
import { signInWithPopup, signOut } from "firebase/auth";

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

    // Keep Firebase Auth session alive for Firestore access
    // (previously we signed out, but Firestore security rules require auth)

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
 * Sign in with Apple via Firebase popup, then authenticate with backend
 */
export async function loginWithApple(): Promise<{
  success: boolean;
  data?: any;
  error?: string;
}> {
  try {
    // Step 1: Apple Sign-In via Firebase
    const result = await signInWithPopup(auth, appleProvider);
    const idToken = await result.user.getIdToken();

    // Step 2: Send ID Token to backend
    const deviceInfo = getDeviceInfo();
    const response = await fetch(`${BASE_URL}/api/Login/login-apple-admin`, {
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
        errorData?.message || errorData?.error || `Login Apple gagal (${response.status})`;
      
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

    console.error("Apple Login error:", error);
    return {
      success: false,
      error: error.message || "Terjadi kesalahan saat login Apple. Silakan coba lagi.",
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
 * Get access token. 
 * Priority: Fresh Firebase ID Token, then stored token.
 * Matching mobile logic: user?.getIdToken(true)
 */
export async function getAccessTokenAsync(): Promise<string | null> {
  try {
    // 1. Try Firebase Instance first (Matches mobile logic)
    const user = auth.currentUser;
    if (user) {
      const fbToken = await user.getIdToken(true);
      if (fbToken) return fbToken;
    }

    // 2. Fallback to stored token
    const token = localStorage.getItem(TOKEN_KEY);
    const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
    if (!token) return null;
    if (expiry && Date.now() > parseInt(expiry, 10)) return null;
    return token;
  } catch {
    return null;
  }
}

export function getAccessToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * Safely parse a JWT token payload
 */
export function decodeJwt(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    // Using simple atob (works in browser environment, which this auth.ts mostly is)
    const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

/**
 * Get stored user data, merged with JWT claims
 */
export function getUserData(): any | null {
  try {
    const dataStr = localStorage.getItem(USER_KEY);
    let data = dataStr ? JSON.parse(dataStr) : null;
    
    // Ensure we have a base object
    if (!data) data = {};

    // As requested, always fetch the company ID directly from the JWT Token
    const token = getAccessToken();
    if (token) {
      const decoded = decodeJwt(token);
      if (decoded && typeof decoded === 'object') {
        // Map the payload fields, especially idCompany
        if (decoded.idCompany) {
          data.idCompany = decoded.idCompany;
          data.companyId = decoded.idCompany;
          data.idPerusahaan = decoded.idCompany;
          data.idperusahaan = decoded.idCompany;
        }
        if (decoded.id) data.email = decoded.id; // From the user payload screenshot
        if (decoded.role) data.role = decoded.role;
      }
    }

    // Return null if completely empty
    if (Object.keys(data).length === 0) return null;
    return data;
  } catch (e) {
    console.error("Failed to fetch user data:", e);
    return null;
  }
}

/**
 * Check if user is authenticated (token exists and not expired)
 */
export function isAuthenticated(): boolean {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return false;

    // 1. Check stored expiry time
    const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
    if (expiry && Date.now() > parseInt(expiry, 10)) {
      logout(); // Auto-clean if expired
      return false;
    }

    // 2. Double check JWT 'exp' claim if possible
    const decoded = decodeJwt(token);
    if (decoded && decoded.exp) {
      // Buffer of 10 seconds to avoid race conditions
      if (Date.now() >= (decoded.exp * 1000) - 10000) {
        logout();
        return false;
      }
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Logout - clear all auth data from local storage
 */
export function logout(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
    localStorage.removeItem("adminLoggedIn");
    
    // Also optional: signOut from firebase
    signOut(auth).catch(() => {});
  } catch (e) {
    console.error("Logout error:", e);
  }
}
