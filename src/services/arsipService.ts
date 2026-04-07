import { getAccessToken } from "@/lib/auth";

const BASE_URL = "https://asia-southeast2-hora-7394b.cloudfunctions.net/api";

const getHeaders = () => {
  const token = getAccessToken();
  if (!token) throw new Error("Unauthorized");
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
};

export interface StatLaporan {
  totalIzin: number;
  disetujui: number;
  ditolak: number;
  pending: number;
  byJenis: {
    cutiTahunan: number;
    sakit: number;
    lainnya: number;
  };
}

export interface StatTugas {
  totalTugas: number;
  selesai: number;
  proses: number;
  tunda: number;
  persentaseSelesai: number;
}

export interface StatKehadiran {
  totalHariKerja: number;
  totalHadir: number;
  totalTidakHadir: number;
  totalTerlambat: number;
  persentaseKehadiran: number;
}

export interface StatReimburse {
  totalPengajuan: number;
  totalNominal: number;
  disetujui: number;
  ditolak: number;
  pending: number;
  nominalDisetujui: number;
}

export interface StatKinerja {
  totalHadir: number;
  totalIzin: number;
  totalTerlambat: number;
  persentaseKehadiran: number;
}

/** Generic silent fetcher - returns null on any failure */
const silentFetch = async (url: string): Promise<any | null> => {
  try {
    const res = await fetch(url, { headers: getHeaders() });
    if (!res.ok) return null; // silently return null for 4xx/5xx
    const text = await res.text();
    const json = JSON.parse(text);
    // Handle nested { data: {...} } pattern common in this backend
    return json?.data ?? json;
  } catch {
    return null;
  }
};

export const fetchStatLaporan = async (
  idperusahaan: string,
  tglstart: string,
  tglend: string,
  emailrep?: string
): Promise<any | null> => {
  const url = new URL(`${BASE_URL}/api/arsip/statlaporan`);
  url.searchParams.append("idperusahaan", idperusahaan);
  url.searchParams.append("tglstart", tglstart);
  url.searchParams.append("tglend", tglend);
  if (emailrep) url.searchParams.append("emailrep", emailrep);
  return silentFetch(url.toString());
};

export const fetchStatTugas = async (
  idperusahaan: string,
  tglstart: string,
  tglend: string,
  emailrep?: string
): Promise<any | null> => {
  const url = new URL(`${BASE_URL}/api/arsip/stattugas`);
  url.searchParams.append("idperusahaan", idperusahaan);
  url.searchParams.append("tglstart", tglstart);
  url.searchParams.append("tglend", tglend);
  if (emailrep) url.searchParams.append("emailrep", emailrep);
  return silentFetch(url.toString());
};

export const fetchStatKehadiran = async (
  idperusahaan: string,
  tglstart: string,
  tglend: string,
  emailrep?: string
): Promise<any | null> => {
  const url = new URL(`${BASE_URL}/api/arsip/statkehadiran`);
  url.searchParams.append("idperusahaan", idperusahaan);
  url.searchParams.append("tglstart", tglstart);
  url.searchParams.append("tglend", tglend);
  if (emailrep) url.searchParams.append("emailrep", emailrep);
  return silentFetch(url.toString());
};

export const fetchStatReimburse = async (
  idperusahaan: string,
  tglstart: string,
  tglend: string,
  emailrep?: string
): Promise<any | null> => {
  const url = new URL(`${BASE_URL}/api/arsip/statreimburse`);
  url.searchParams.append("idperusahaan", idperusahaan);
  url.searchParams.append("tglstart", tglstart);
  url.searchParams.append("tglend", tglend);
  if (emailrep) url.searchParams.append("emailrep", emailrep);
  return silentFetch(url.toString());
};

export const fetchKinerja = async (
  idperusahaan: string,
  month: string
): Promise<any | null> => {
  const url = new URL(`${BASE_URL}/api/arsip/Kinerja`);
  url.searchParams.append("idperusahaan", idperusahaan);
  url.searchParams.append("month", month);
  return silentFetch(url.toString());
};

/**
 * Combined dashboard stats type
 */
export interface ArsipDashboard {
  izinStats: StatLaporan | null;
  tugasStats: StatTugas | null;
  kehadiranStats: StatKehadiran | null;
  reimburseStats: StatReimburse | null;
  kinerjaStats: StatKinerja | null;
}

/**
 * Fetch all arsip stats in parallel.
 * Each fetch is silent - failures return null without errors.
 * Dashboard uses fallback computed data when any stat is null.
 */
export const fetchAllArsipStats = async (
  idperusahaan: string,
  tglstart: string,
  tglend: string,
  emailrep?: string
): Promise<ArsipDashboard> => {
  const month = tglstart.substring(0, 7); // YYYY-MM

  const [izinStats, tugasStats, kehadiranStats, reimburseStats, kinerjaStats] =
    await Promise.all([
      fetchStatLaporan(idperusahaan, tglstart, tglend, emailrep),
      fetchStatTugas(idperusahaan, tglstart, tglend, emailrep),
      fetchStatKehadiran(idperusahaan, tglstart, tglend, emailrep),
      fetchStatReimburse(idperusahaan, tglstart, tglend, emailrep),
      fetchKinerja(idperusahaan, month),
    ]);

  return { izinStats, tugasStats, kehadiranStats, reimburseStats, kinerjaStats };
};
