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

export const fetchStatLaporan = async (idperusahaan: string, tglstart: string, tglend: string, emailrep?: string): Promise<StatLaporan> => {
  const url = new URL(`${BASE_URL}/api/arsip/statlaporan`);
  url.searchParams.append("idperusahaan", idperusahaan);
  url.searchParams.append("tglstart", tglstart);
  url.searchParams.append("tglend", tglend);
  if (emailrep) url.searchParams.append("emailrep", emailrep);

  const res = await fetch(url.toString(), { headers: getHeaders() });
  if (!res.ok) throw new Error("Gagal mengambil stat laporan");
  return res.json();
};

export const fetchStatTugas = async (idperusahaan: string, tglstart: string, tglend: string, emailrep?: string): Promise<StatTugas> => {
  const url = new URL(`${BASE_URL}/api/arsip/stattugas`);
  url.searchParams.append("idperusahaan", idperusahaan);
  url.searchParams.append("tglstart", tglstart);
  url.searchParams.append("tglend", tglend);
  if (emailrep) url.searchParams.append("emailrep", emailrep);

  const res = await fetch(url.toString(), { headers: getHeaders() });
  if (!res.ok) throw new Error("Gagal mengambil stat tugas");
  return res.json();
};

export const fetchStatKehadiran = async (idperusahaan: string, tglstart: string, tglend: string, emailrep?: string): Promise<StatKehadiran> => {
  const url = new URL(`${BASE_URL}/api/arsip/statkehadiran`);
  url.searchParams.append("idperusahaan", idperusahaan);
  url.searchParams.append("tglstart", tglstart);
  url.searchParams.append("tglend", tglend);
  if (emailrep) url.searchParams.append("emailrep", emailrep);

  const res = await fetch(url.toString(), { headers: getHeaders() });
  if (!res.ok) throw new Error("Gagal mengambil stat kehadiran");
  return res.json();
};

export const fetchStatReimburse = async (idperusahaan: string, tglstart: string, tglend: string, emailrep?: string): Promise<StatReimburse> => {
  const url = new URL(`${BASE_URL}/api/arsip/statreimburse`);
  url.searchParams.append("idperusahaan", idperusahaan);
  url.searchParams.append("tglstart", tglstart);
  url.searchParams.append("tglend", tglend);
  if (emailrep) url.searchParams.append("emailrep", emailrep);

  const res = await fetch(url.toString(), { headers: getHeaders() });
  if (!res.ok) throw new Error("Gagal mengambil stat reimburse");
  return res.json();
};

export const fetchKinerja = async (idperusahaan: string, month: string): Promise<StatKinerja> => {
  const url = new URL(`${BASE_URL}/api/arsip/Kinerja`);
  url.searchParams.append("idperusahaan", idperusahaan);
  url.searchParams.append("month", month);

  const res = await fetch(url.toString(), { headers: getHeaders() });
  if (!res.ok) throw new Error("Gagal mengambil stat kinerja");
  return res.json();
};
