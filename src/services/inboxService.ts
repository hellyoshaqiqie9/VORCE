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

// ─── INTERFACES ──────────────────────────────

export interface EmailAccount {
  emailAddress: string;
  provider: string;
  isActive: boolean;
}

export interface EmailFolder {
  name: string;
  totalMessages: number;
  unreadMessages: number;
}

export interface EmailMessage {
  uid: number;
  from: string;
  subject: string;
  date: string;
  isRead: boolean;
  isStarred?: boolean;
}

export interface EmailDetail {
  uid: number;
  from: string;
  to: string;
  subject: string;
  date: string;
  body: string;
  attachments: any[];
}

// ─── 1. GET CONNECTED ACCOUNTS ──────────────
export async function getAccounts(): Promise<EmailAccount[]> {
  const res = await fetch(`${BASE_URL}/api/inbox/accounts`, {
    method: "GET",
    headers: getHeaders(),
  });
  const result = await handleResponse(res);
  return result.data || result || [];
}

// ─── 2. ADD EMAIL ACCOUNT ───────────────────
export async function addAccount(data: {
  provider: string;
  emailAddress: string;
  password: string;
  authType: string;
}): Promise<any> {
  const res = await fetch(`${BASE_URL}/api/inbox/add-account`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

// ─── 3. GET FOLDERS ─────────────────────────
export async function getFolders(emailAccount: string): Promise<EmailFolder[]> {
  const res = await fetch(
    `${BASE_URL}/api/inbox/folders?emailAccount=${encodeURIComponent(emailAccount)}`,
    { method: "GET", headers: getHeaders() }
  );
  const result = await handleResponse(res);
  return result.data || result || [];
}

// ─── 4. GET MESSAGES ────────────────────────
export async function getMessages(
  emailAccount: string,
  folder: string,
  page: number = 1
): Promise<EmailMessage[]> {
  const res = await fetch(
    `${BASE_URL}/api/inbox/messages?emailAccount=${encodeURIComponent(emailAccount)}&folder=${encodeURIComponent(folder)}&page=${page}`,
    { method: "GET", headers: getHeaders() }
  );
  const result = await handleResponse(res);
  return result.data || result || [];
}

// ─── 5. GET MESSAGE DETAIL ──────────────────
export async function getMessageDetail(
  emailAccount: string,
  folder: string,
  uid: number
): Promise<EmailDetail> {
  const res = await fetch(
    `${BASE_URL}/api/inbox/message-detail?emailAccount=${encodeURIComponent(emailAccount)}&folder=${encodeURIComponent(folder)}&uid=${uid}`,
    { method: "GET", headers: getHeaders() }
  );
  const result = await handleResponse(res);
  return result.data || result;
}

// ─── 6. GET MESSAGE HTML BODY ───────────────
export async function getMessageBody(
  emailAccount: string,
  folder: string,
  uid: number
): Promise<string> {
  const token = getAccessToken();
  const res = await fetch(
    `${BASE_URL}/api/inbox/message-body?emailAccount=${encodeURIComponent(emailAccount)}&folder=${encodeURIComponent(folder)}&uid=${uid}`,
    {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  if (!res.ok) throw new Error("Gagal memuat isi email");
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const json = await res.json();
    return json.data || json.body || json.html || JSON.stringify(json);
  }
  return res.text();
}

// ─── 7. SEND EMAIL ──────────────────────────
export async function sendMail(data: {
  fromAccount: string;
  to: string;
  subject: string;
  message: string;
  attachments?: any[];
  replyToUid?: number;
  replyToFolder?: string;
}): Promise<any> {
  const res = await fetch(`${BASE_URL}/api/inbox/send`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

// ─── 8. FORWARD EMAIL ───────────────────────
export async function forwardMail(data: {
  fromAccount: string;
  to: string;
  originalUid: number;
  addedMessage: string;
  originalFolder: string;
}): Promise<any> {
  const res = await fetch(`${BASE_URL}/api/inbox/forward`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

// ─── 9. STAR EMAIL ──────────────────────────
export async function starMail(data: {
  emailAccount: string;
  uid: number;
  action: "add" | "remove";
  folder: string;
}): Promise<any> {
  const res = await fetch(`${BASE_URL}/api/inbox/star`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

// ─── 10. DELETE EMAIL ───────────────────────
export async function deleteMail(data: {
  emailAccount: string;
  uid: number;
  folder: string;
}): Promise<any> {
  const res = await fetch(`${BASE_URL}/api/inbox/delete`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

// ─── 11. EMPTY TRASH ────────────────────────
export async function emptyTrash(emailAccount: string): Promise<any> {
  const res = await fetch(`${BASE_URL}/api/inbox/empty-trash`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ emailAccount }),
  });
  return handleResponse(res);
}
