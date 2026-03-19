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

export interface ReimburseItem {
  id: string;
  judul: string;
  deskripsi: string;
  nominal: number;
  tanggal: string; // ISO8601
  status: "pending" | "approved" | "rejected" | "lunas" | "tunggakan" | string;
  email: string;
  displayName: string;
  buktiUrl: string;
  approvedBy?: string;
  approvedAt?: string;
}

export const fetchReimburseList = async (): Promise<ReimburseItem[]> => {
  const res = await fetch(`${BASE_URL}/reimburse/list`, {
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error("Gagal mengambil daftar reimburse");
  return res.json();
};

export interface CreateReimbursePayload {
  amount: number;
  date: string; // ISO8601
  fileId: string;
  title: string;
  description: string;
  address: string;
  category: string;
}

export const createReimburse = async (payload: CreateReimbursePayload) => {
  const res = await fetch(`${BASE_URL}/reimburse/create`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Gagal membuat reimburse");
  return res.json();
};

export const updateReimburseStatus = async (reimburseId: string, status: string, fileId?: string) => {
  const res = await fetch(`${BASE_URL}/reimburse/update-status`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ reimburseId, status, fileId }),
  });
  if (!res.ok) throw new Error("Gagal mengubah status reimburse");
  return res.json();
};

export const deleteReimburse = async (id: string) => {
  const res = await fetch(`${BASE_URL}/reimburse/delete/${id}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error("Gagal menghapus reimburse");
  // Some APIs might return empty 204 or just JSON messaging
  const text = await res.text();
  return text ? JSON.parse(text) : {};
};
