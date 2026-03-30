import { getAccessToken } from "@/lib/auth";
import { getDownloadUrl } from "@/services/berkasService";

const BASE_URL = "https://asia-southeast2-hora-7394b.cloudfunctions.net/api";
type JsonRecord = Record<string, unknown>;

function getHeaders(): Record<string, string> {
  const token = getAccessToken();
  if (!token) {
    throw new Error("Unauthorized");
  }

  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

async function handleResponse(response: Response) {
  if (response.status === 401) {
    throw new Error("Token telah kadaluarsa. Silakan login ulang.");
  }

  if (response.status === 403) {
    throw new Error("Anda tidak memiliki akses.");
  }

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => null);
    throw new Error(errorPayload?.message || `Error ${response.status}`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json().catch(() => null);
}

function asRecord(value: unknown): JsonRecord {
  return typeof value === "object" && value !== null ? (value as JsonRecord) : {};
}

function unwrapResult<T = unknown>(result: unknown): T {
  const payload = asRecord(result);

  if (payload.data !== undefined) {
    return payload.data as T;
  }

  if (payload.reimburse !== undefined) {
    return payload.reimburse as T;
  }

  if (payload.item !== undefined) {
    return payload.item as T;
  }

  return result as T;
}

function normalizeStatus(value: unknown): string {
  const raw = String(value || "tunggakan").trim().toLowerCase();

  if (["lunas", "approved", "approve", "disetujui", "accepted", "paid", "settled"].includes(raw)) {
    return "lunas";
  }

  if (
    ["tunggakan", "arrears", "unpaid", "outstanding", "rejected", "reject", "ditolak", "declined", "pending", "requested", "menunggu"].includes(raw)
  ) {
    return "tunggakan";
  }

  return raw === "lunas" ? raw : "tunggakan";
}

function toNumber(value: unknown): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function pickString(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
}

function pickFileUrl(item: unknown, fileId: string): string {
  const source = asRecord(item);

  // Primary: check evidence object (actual API structure)
  const evidenceRecord = asRecord(source.evidence);
  const paymentEvidenceRecord = asRecord(source.paymentEvidence);
  const fileRecord = asRecord(source.file);
  const receiptRecord = asRecord(source.receipt);
  const attachmentRecord = asRecord(source.attachment);

  const directUrl = pickString(
    // evidence.fileUrl is the primary source from API
    evidenceRecord.fileUrl,
    evidenceRecord.downloadUrl,
    evidenceRecord.downloadURL,
    evidenceRecord.url,
    // Also check other common field patterns
    source.fileUrl,
    source.downloadUrl,
    source.downloadURL,
    source.buktiUrl,
    source.imageUrl,
    source.photoUrl,
    fileRecord.url,
    fileRecord.downloadUrl,
    fileRecord.downloadURL,
    receiptRecord.url,
    receiptRecord.downloadUrl,
    attachmentRecord.url,
    attachmentRecord.downloadUrl,
    typeof source.file === "string" && /^https?:\/\//i.test(source.file as string) ? (source.file as string) : "",
  );

  if (directUrl) {
    return directUrl;
  }

  return fileId ? getDownloadUrl(fileId) : "";
}

export interface ReimburseItem {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  amount: number;
  title: string;
  description: string;
  address: string;
  category: string;
  status: string;
  createdAt: string;
  date: string;
  fileId?: string;
  fileUrl?: string;
  fileName?: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectReason?: string;
  // Payment evidence (bukti transfer from admin)
  paymentFileId?: string;
  paymentFileUrl?: string;
  paymentFileName?: string;
}

function normalizeReimburseItem(item: unknown): ReimburseItem {
  const source = asRecord(item);
  
  // Evidence = bukti pengajuan dari user (struk/nota)
  const evidence = asRecord(source.evidence);
  // PaymentEvidence = bukti transfer dari admin
  const paymentEvidence = asRecord(source.paymentEvidence);

  // Extract fileId from the evidence object
  const fileId = pickString(
    evidence.fileId,
    evidence.id,
    source.fileId,
    source.evidenceFileId,
  );

  return {
    id: pickString(source.id, source.reimburseId, source._id),
    userId: pickString(source.requestByEmail, source.userId, source.uid, source.createdBy),
    userName: pickString(source.requestByName),
    userRole: pickString(source.requestByRole),
    amount: toNumber(source.amount ?? source.nominal),
    title: pickString(source.title, source.judul, source.name) || "Reimburse",
    description: pickString(source.description, source.deskripsi),
    address: pickString(source.address),
    category: pickString(source.category),
    status: normalizeStatus(source.status),
    date: pickString(source.date),
    createdAt: pickString(source.createdAt, source.date, source.created_at),
    fileId,
    fileUrl: pickString(evidence.fileUrl, evidence.downloadUrl, evidence.url) || (fileId ? getDownloadUrl(fileId) : ""),
    fileName: pickString(evidence.fileName, evidence.name),
    approvedBy: pickString(source.processedBy, source.approvedBy),
    approvedAt: pickString(source.processedAt, source.approvedAt, source.updatedAt),
    rejectReason: pickString(source.rejectReason, source.rejectionReason),
    paymentFileId: pickString(paymentEvidence.fileId),
    paymentFileUrl: pickString(paymentEvidence.fileUrl, paymentEvidence.downloadUrl),
    paymentFileName: pickString(paymentEvidence.fileName, paymentEvidence.name),
  };
}

export async function fetchReimburseList(): Promise<ReimburseItem[]> {
  const response = await fetch(`${BASE_URL}/api/reimburse/list`, {
    method: "GET",
    headers: getHeaders(),
  });

  const result = await handleResponse(response);
  const rawList = unwrapResult<unknown[]>(result);
  const items = Array.isArray(rawList)
    ? rawList
    : Array.isArray(asRecord(result).reimburses)
      ? (asRecord(result).reimburses as unknown[])
      : Array.isArray(asRecord(result).items)
        ? (asRecord(result).items as unknown[])
        : [];

  return items.map(normalizeReimburseItem);
}

export async function fetchReimburseDetail(id: string): Promise<ReimburseItem> {
  const response = await fetch(`${BASE_URL}/api/reimburse/${encodeURIComponent(id)}`, {
    method: "GET",
    headers: getHeaders(),
  });

  const result = await handleResponse(response);
  const unwrapped = unwrapResult(result);
  
  // Debug: log raw API response before normalization
  console.log("[Reimburse Detail] Raw API response:", JSON.stringify(result, null, 2));
  console.log("[Reimburse Detail] Unwrapped:", JSON.stringify(unwrapped, null, 2));
  
  return normalizeReimburseItem(unwrapped);
}

export interface CreateReimbursePayload {
  amount: number;
  date: string;        // Required: YYYY-MM-DD
  fileId: string;      // Required: bukti/evidence file ID
  title?: string;      // Optional
  description?: string;// Optional
  address?: string;    // Optional
  category?: string;   // Optional: e.g. "Konsumsi", "Transport", "Lainnya"
}

export async function createReimburse(payload: CreateReimbursePayload) {
  const requestBody = {
    amount: String(payload.amount),  // API expects string
    date: payload.date,
    fileId: payload.fileId,
    ...(payload.title ? { title: payload.title } : {}),
    ...(payload.description ? { description: payload.description } : {}),
    ...(payload.address ? { address: payload.address } : {}),
    ...(payload.category ? { category: payload.category } : {}),
  };

  const response = await fetch(`${BASE_URL}/api/reimburse/create`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(requestBody),
  });

  return handleResponse(response);
}

export async function approveReimburse(id: string, fileId?: string) {
  const response = await fetch(`${BASE_URL}/api/reimburse/update-status`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      reimburseId: id,
      status: "Lunas",
      ...(fileId ? { fileId } : {}),
    }),
  });

  return handleResponse(response);
}

export async function rejectReimburse(id: string, reason?: string, fileId?: string) {
  const response = await fetch(`${BASE_URL}/api/reimburse/update-status`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      reimburseId: id,
      status: "Tunggakan",
      ...(fileId ? { fileId } : {}),
      ...(reason ? { reason } : {}),
    }),
  });

  return handleResponse(response);
}

export async function updateReimburseStatus(id: string, status: string, reason?: string, fileId?: string) {
  const normalizedStatus = normalizeStatus(status);

  if (normalizedStatus === "lunas") {
    return approveReimburse(id, fileId);
  }

  if (normalizedStatus === "tunggakan") {
    return rejectReimburse(id, reason || "Belum dibayarkan.", fileId);
  }

  throw new Error(`Status reimburse tidak didukung: ${status}`);
}

export async function deleteReimburse(id: string) {
  const response = await fetch(`${BASE_URL}/api/reimburse/delete/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: getHeaders(),
  });

  const result = await handleResponse(response);
  return result ?? {};
}
