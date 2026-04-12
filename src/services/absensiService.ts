import { getAccessTokenAsync, getUserData } from "@/lib/auth";

const BASE_URL = "https://asia-southeast2-hora-7394b.cloudfunctions.net/api";

/**
 * Normalized interface for attendance records.
 * Field mapping from the real API response:
 *   id_absensi       -> id
 *   id_karyawan      -> email (used as user key)
 *   nama_karyawan    -> displayName
 *   waktu_masuk      -> waktuMasuk   (ISO datetime)
 *   waktu_pulang     -> waktuPulang  (ISO datetime, null if not yet checked out)
 *   alamat_lokasi_masuk  -> lokasiMasuk
 *   alamat_lokasi_pulang -> lokasiPulang
 *   status_kehadiran -> status  ("HADIR" | "SELESAI" | "IZIN" | "ALPHA" | ...)
 *   is_terlambat     -> isTerlambat (boolean)
 */
export interface ApiAbsensi {
  id: string;
  email: string;
  displayName: string;
  waktuMasuk: string | null;
  waktuPulang: string | null;
  lokasiMasuk: string;
  lokasiPulang: string;
  latitude: number;
  longitude: number;
  status: string;
  isTerlambat: boolean;
  totalJamKerja: number | null;
  keterangan: string | null;
  fotoMasuk?: string | null;
  fotoPulang?: string | null;
}

/**
 * Normalize a raw attendance record from the real API.
 * The API uses snake_case field names.
 */
function normalizeRecord(raw: Record<string, any>): ApiAbsensi {
  // Handle Firestore Timestamp { _seconds, _nanoseconds } or ISO strings
  const extractTime = (v: any): string | null => {
    if (!v) return null;
    
    // 1. If it's a Firestore-style Timestamp object
    if (typeof v === 'object' && v !== null && '_seconds' in v) {
      return new Date(v._seconds * 1000).toISOString();
    }
    
    // 2. If it's a Date string
    const s = String(v).trim();
    if (!s || s === "-" || s === "null" || s === "undefined" || s === "00:00:00") return null;
    
    // Validate if it's a valid date string
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d.toISOString();
  };

  const waktuMasuk  = raw.waktuCheckIn ?? raw.waktu_masuk ?? raw.waktuMasuk ?? raw.JamMasuk ?? raw.tanggalAbsensi ?? null;
  const waktuPulang = raw.waktuCheckOut ?? raw.waktu_pulang ?? raw.waktuPulang ?? raw.JamPulang ?? null;

  return {
    // Unique ID 
    id: raw.id ?? raw.id_absensi ?? raw.idAbsensi ?? "",
    
    // Identifier for lookup (email or UID). Mobile uses IDKaryawan.
    email: raw.IDKaryawan ?? raw.id_karyawan ?? raw.idKaryawan ?? raw.email ?? "",
    
    displayName: raw.NamaKaryawan ?? raw.nama_karyawan ?? raw.namaKaryawan ?? raw.displayName ?? "",
    
    waktuMasuk:  extractTime(waktuMasuk),
    waktuPulang: extractTime(waktuPulang),
    
    lokasiMasuk:  raw.AlamatLoc ?? raw.alamatLoc ?? raw.alamat_lokasi_masuk ?? raw.lokasiMasuk ?? "",
    lokasiPulang: raw.AlamatLocCheckOut ?? raw.lokasiPulang ?? raw.alamat_lokasi_pulang ?? "",
    
    // Coordinates (notice typo 'Longtitude' in API)
    latitude:  Number(raw.AlamatLatitude ?? raw.alamatLatitude ?? raw.alamat_latitude_masuk ?? 0),
    longitude: Number(raw.AlamatLongtitude ?? raw.alamatLongtitude ?? raw.alamat_longitude_masuk ?? 0),
    
    status: (raw.status_kehadiran ?? raw.status ?? (waktuMasuk ? "HADIR" : "")).toUpperCase(),
    isTerlambat: !!(raw.is_terlambat ?? raw.telat ?? false),
    totalJamKerja: raw.total_jam_kerja ?? raw.durasi ? Number(raw.total_jam_kerja ?? raw.durasi) : null,
    keterangan: raw.keterangan ?? null,
    fotoMasuk: raw.foto_masuk ?? raw.fotoMasuk ?? raw.fotoCheckIn ?? raw.file_masuk ?? raw.foto ?? raw.buktiUrl ?? raw.imageUrl ?? raw.photoUrl ?? null,
    fotoPulang: raw.foto_pulang ?? raw.fotoPulang ?? raw.fotoCheckOut ?? raw.file_pulang ?? raw.buktiUrlCheckOut ?? null,
  };
}

export async function fetchAbsensiData(startDate: string, endDate: string): Promise<ApiAbsensi[]> {
  // Reverting to the double /api as the live 304 response proved it was the correct route.
  // The 404 occurred when we removed the prefix.
  const cleanBase = BASE_URL.replace(/\/api$/, "");
  
  const headers: Record<string, string> = {
    "Accept": "application/json",
    "Cache-Control": "no-cache, no-store, must-revalidate",
    "Pragma": "no-cache",
    "Expires": "0",
  };

  // Mobile approach: take local day [00:00 - 23:59], convert to UTC ISO
  const startDay = new Date(startDate);
  startDay.setHours(0, 0, 0, 0);
  const endDay = new Date(endDate);
  endDay.setHours(23, 59, 59, 999);
  
  const tglstart = startDay.toISOString();
  const tglend   = endDay.toISOString();

  const userData = getUserData();
  
  // Specific fallback priority, including CTD96L if available from user context.
  const idperusahaan = 
    userData?.id_perusahaan || 
    userData?.idPerusahaan || 
    userData?.idperusahaan || 
    userData?.companyId || 
    "CTD96L"; // User confirmed CTD96L is their active ID

  // Final path is .../api/api/absensi/HomeA
  const url = `${BASE_URL}/api/absensi/HomeA?idperusahaan=${encodeURIComponent(idperusahaan)}&tglstart=${encodeURIComponent(tglstart)}&tglend=${encodeURIComponent(tglend)}&_v=${Date.now()}`;

  const response = await fetch(url, {
    method: "GET",
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || `Gagal memuat data (${response.status})`);
  }

  const result = await response.json();
  if (result.success === false) {
    throw new Error(result.message || "Server return error status.");
  }

  const rawData = Array.isArray(result) ? result : (result.data || []);
  
  if (!Array.isArray(rawData)) {
    if (result.data && typeof result.data === 'object') return [normalizeRecord(result.data)];
    return [];
  }

  return rawData.map(normalizeRecord);
}
