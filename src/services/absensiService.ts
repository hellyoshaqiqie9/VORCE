import { getAccessToken, getUserData } from "@/lib/auth";

const BASE_URL = "https://asia-southeast2-hora-7394b.cloudfunctions.net/api";

export interface ApiAbsensi {
  id: string;
  email: string;
  displayName: string;
  waktuMasuk: string | null;
  waktuPulang: string | null;
  lokasiMasuk: string;
  lokasiPulang: string;
  status: string;
}

export async function fetchAbsensiData(startDate: string, endDate: string): Promise<ApiAbsensi[]> {
  const token = getAccessToken();
  if (!token) {
    throw new Error("Sesi login telah berakhir. Silakan login ulang.");
  }

  const userData = getUserData();
  const idperusahaan = userData?.idPerusahaan || userData?.idperusahaan || userData?.companyId || "CLVREW";

  const tglstart = `${startDate}T00:00:00Z`;
  const tglend = `${endDate}T23:59:59Z`;

  const url = `${BASE_URL}/api/absensi/HomeA?idperusahaan=${encodeURIComponent(idperusahaan)}&tglstart=${encodeURIComponent(tglstart)}&tglend=${encodeURIComponent(tglend)}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (response.status === 401) {
    throw new Error("Token telah kadaluarsa. Silakan login ulang.");
  }

  if (response.status === 403) {
    throw new Error("Anda tidak memiliki akses untuk melihat data ini.");
  }

  if (!response.ok) {
    const errData = await response.json().catch(() => null);
    throw new Error(errData?.message || `Error ${response.status}`);
  }

  const result = await response.json();
  const data: ApiAbsensi[] = result.data || result || [];

  return Array.isArray(data) ? data : [];
}
