"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAccounts, addAccount, getFolders, getMessages,
  getMessageDetail, getMessageBody, sendMail, forwardMail,
  starMail, deleteMail, emptyTrash,
  EmailAccount, EmailFolder, EmailMessage, EmailDetail,
} from "@/services/inboxService";

// ─── HELPERS ─────────────────────────────────
function timeAgo(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Baru saja";
  if (mins < 60) return `${mins}m lalu`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}j lalu`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}h lalu`;
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

function getInitials(email: string): string {
  const name = email.split("@")[0] || "";
  return name.substring(0, 2).toUpperCase();
}

function getAvatarColor(email: string): string {
  const colors = ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#ef4444", "#06b6d4", "#6366f1"];
  let hash = 0;
  for (let i = 0; i < email.length; i++) hash = email.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function getFolderIcon(name: string): string {
  const n = name.toUpperCase();
  if (n === "INBOX") return "inbox";
  if (n === "SENT" || n.includes("SENT")) return "send";
  if (n === "DRAFT" || n.includes("DRAFT")) return "drafts";
  if (n === "TRASH" || n.includes("TRASH")) return "delete";
  if (n === "STARRED" || n.includes("STAR")) return "star";
  if (n === "SPAM" || n.includes("SPAM") || n.includes("JUNK")) return "report";
  if (n.includes("IMPORTANT")) return "label_important";
  return "folder";
}

function getSenderName(from: string): string {
  if (!from) return "Unknown";
  const match = from.match(/^"?([^"<]+)"?\s*</) || from.match(/^([^@]+)@/);
  return match ? match[1].trim() : from;
}

// ─── MAIN COMPONENT ─────────────────────────
export default function InboxPage() {
  const queryClient = useQueryClient();

  // Active state variables
  const [activeAccount, setActiveAccount] = useState<string>("");
  const [activeFolder, setActiveFolder] = useState("INBOX");
  const [currentPage, setCurrentPage] = useState(1);

  // Queries
  const { data: accountsRaw, isLoading: loadingAccounts, error: accountsError, refetch: fetchAccounts } = useQuery({
    queryKey: ["email-accounts"],
    queryFn: getAccounts,
  });
  const accounts = accountsRaw || [];
  const apiError = accountsError ? (accountsError as Error).message : null;

  useEffect(() => {
    if (accounts.length > 0 && !activeAccount) {
      setActiveAccount(accounts[0].emailAddress);
    }
  }, [accounts, activeAccount]);

  const { data: foldersRaw, refetch: fetchFolders } = useQuery({
    queryKey: ["email-folders", activeAccount],
    queryFn: () => getFolders(activeAccount),
    enabled: !!activeAccount,
  });
  const folders = foldersRaw || [];

  const { data: messagesRaw, isLoading: loadingMessages, refetch: refetchMessages } = useQuery({
    queryKey: ["email-messages", activeAccount, activeFolder, currentPage],
    queryFn: () => {
      setSelectedEmail(null);
      setSelectedUid(null);
      setEmailHtmlBody("");
      return getMessages(activeAccount, activeFolder, currentPage);
    },
    enabled: !!activeAccount,
  });
  const messages = messagesRaw || [];

  // Selected email
  const [selectedEmail, setSelectedEmail] = useState<EmailDetail | null>(null);
  const [emailHtmlBody, setEmailHtmlBody] = useState("");
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [selectedUid, setSelectedUid] = useState<number | null>(null);

  // Modals
  const [showCompose, setShowCompose] = useState(false);
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [composeMode, setComposeMode] = useState<"new" | "reply" | "forward">("new");

  // Compose form
  const [composeTo, setComposeTo] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeMessage, setComposeMessage] = useState("");
  const [composeSending, setComposeSending] = useState(false);

  // Add account form
  const [accProvider, setAccProvider] = useState("gmail");
  const [accEmail, setAccEmail] = useState("");
  const [accPassword, setAccPassword] = useState("");
  const [accAuthType, setAccAuthType] = useState("oauth2");
  const [addingAccount, setAddingAccount] = useState(false);

  // Action loading
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Toast
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const iframeRef = useRef<HTMLIFrameElement>(null);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  // Helper setter for mutations if queryClient setQueryData isn't used
  const setMessages = (updater: (prev: EmailMessage[]) => EmailMessage[]) => {
    // mock fallback since refetchMessages handles updates generally
  };

  // Sidebar collapsed on mobile
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // ─── FETCH LOGIC (Managed by useQuery) ────────

  // ─── FETCH EMAIL DETAIL ────────────────────
  const openEmail = useCallback(async (uid: number) => {
    if (!activeAccount) return;
    setSelectedUid(uid);
    setLoadingDetail(true);
    setEmailHtmlBody("");
    try {
      const detail = await getMessageDetail(activeAccount, activeFolder, uid);
      setSelectedEmail(detail);
      try {
        const html = await getMessageBody(activeAccount, activeFolder, uid);
        setEmailHtmlBody(html);
      } catch {
        setEmailHtmlBody(detail.body || "");
      }
    } catch (err: any) {
      showToast("error", err.message || "Gagal memuat detail email");
    } finally {
      setLoadingDetail(false);
    }
  }, [activeAccount, activeFolder]);

  // ─── EFFECTS ───────────────────────────────

  // ─── ACTIONS ───────────────────────────────

  const handleSend = async () => {
    if (!composeTo.trim() || !composeSubject.trim()) {
      showToast("error", "Lengkapi penerima dan subjek");
      return;
    }
    try {
      setComposeSending(true);
      if (composeMode === "forward" && selectedEmail) {
        await forwardMail({
          fromAccount: activeAccount,
          to: composeTo,
          originalUid: selectedEmail.uid,
          addedMessage: composeMessage,
          originalFolder: activeFolder,
        });
      } else {
        await sendMail({
          fromAccount: activeAccount,
          to: composeTo,
          subject: composeSubject,
          message: composeMessage,
          ...(composeMode === "reply" && selectedEmail ? {
            replyToUid: selectedEmail.uid,
            replyToFolder: activeFolder,
          } : {}),
        });
      }
      showToast("success", composeMode === "reply" ? "Balasan terkirim" : composeMode === "forward" ? "Email diteruskan" : "Email terkirim");
      setShowCompose(false);
      resetCompose();
      refetchMessages();
    } catch (err: any) {
      showToast("error", err.message || "Gagal mengirim email");
    } finally {
      setComposeSending(false);
    }
  };

  const handleStar = async (msg: EmailMessage) => {
    try {
      setActionLoading(`star-${msg.uid}`);
      await starMail({
        emailAccount: activeAccount,
        uid: msg.uid,
        action: msg.isStarred ? "remove" : "add",
        folder: activeFolder,
      });
      setMessages((prev) =>
        prev.map((m) => m.uid === msg.uid ? { ...m, isStarred: !m.isStarred } : m)
      );
      refetchMessages();
    } catch (err: any) {
      showToast("error", err.message || "Gagal mengubah bintang");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (uid: number) => {
    try {
      setActionLoading(`delete-${uid}`);
      await deleteMail({ emailAccount: activeAccount, uid, folder: activeFolder });
      showToast("success", "Email dipindahkan ke Trash");
      setMessages((prev) => prev.filter((m) => m.uid !== uid));
      if (selectedUid === uid) {
        setSelectedEmail(null);
        setSelectedUid(null);
      }
    } catch (err: any) {
      showToast("error", err.message || "Gagal menghapus email");
    } finally {
      setActionLoading(null);
    }
  };

  const handleEmptyTrash = async () => {
    if (!confirm("Kosongkan seluruh Trash? Tindakan ini tidak dapat dibatalkan.")) return;
    try {
      setActionLoading("empty-trash");
      await emptyTrash(activeAccount);
      showToast("success", "Trash telah dikosongkan");
      if (activeFolder.toUpperCase().includes("TRASH")) refetchMessages();
      fetchFolders();
    } catch (err: any) {
      showToast("error", err.message || "Gagal mengosongkan trash");
    } finally {
      setActionLoading(null);
    }
  };

  const handleAddAccount = async () => {
    if (!accEmail.trim()) {
      showToast("error", "Masukkan email");
      return;
    }
    try {
      setAddingAccount(true);
      await addAccount({
        provider: accProvider,
        emailAddress: accEmail,
        password: accPassword,
        authType: accAuthType,
      });
      showToast("success", "Akun berhasil ditambahkan");
      setShowAddAccount(false);
      setAccEmail("");
      setAccPassword("");
      fetchAccounts();
    } catch (err: any) {
      showToast("error", err.message || "Gagal menambahkan akun");
    } finally {
      setAddingAccount(false);
    }
  };

  const openReply = () => {
    if (!selectedEmail) return;
    setComposeMode("reply");
    setComposeTo(selectedEmail.from.replace(/.*<([^>]+)>.*/, "$1"));
    setComposeSubject(`Re: ${selectedEmail.subject}`);
    setComposeMessage("");
    setShowCompose(true);
  };

  const openForward = () => {
    if (!selectedEmail) return;
    setComposeMode("forward");
    setComposeTo("");
    setComposeSubject(`Fwd: ${selectedEmail.subject}`);
    setComposeMessage("");
    setShowCompose(true);
  };

  const resetCompose = () => {
    setComposeTo("");
    setComposeSubject("");
    setComposeMessage("");
    setComposeMode("new");
  };

  const totalUnread = folders.reduce((sum, f) => sum + (f.unreadMessages || 0), 0);

  // ─── RENDER ────────────────────────────────
  return (
    <div className="inbox-layout">
      {/* Toast */}
      {toast && (
        <div className={`inbox-toast ${toast.type}`}>
          <span className="material-icons">{toast.type === "success" ? "check_circle" : "error"}</span>
          {toast.message}
        </div>
      )}

      {/* ═══ LEFT SIDEBAR ═══ */}
      <aside className={`inbox-sidebar ${sidebarOpen ? "open" : ""}`}>
        <button className="compose-btn" onClick={() => { resetCompose(); setShowCompose(true); }}>
          <span className="material-icons">edit</span>
          Tulis Email
        </button>

        {/* Accounts */}
        <div className="sidebar-section">
          <div className="section-header">
            <label>Akun Email</label>
            <button className="add-btn" onClick={() => setShowAddAccount(true)} title="Tambah akun">
              <span className="material-icons">add</span>
            </button>
          </div>
          {loadingAccounts ? (
            <div className="sidebar-loading"><div className="mini-spinner" /></div>
          ) : accounts.length === 0 ? (
            <p className="sidebar-empty">Belum ada akun terhubung</p>
          ) : (
            <div className="account-list">
              {accounts.map((acc) => (
                <button
                  key={acc.emailAddress}
                  className={`account-item ${activeAccount === acc.emailAddress ? "active" : ""}`}
                  onClick={() => { setActiveAccount(acc.emailAddress); setActiveFolder("INBOX"); setCurrentPage(1); }}
                >
                  <div className="acc-avatar" style={{ background: getAvatarColor(acc.emailAddress) }}>
                    {getInitials(acc.emailAddress)}
                  </div>
                  <div className="acc-info">
                    <span className="acc-email">{acc.emailAddress}</span>
                    <span className="acc-provider">{acc.provider}</span>
                  </div>
                  {acc.isActive && <span className="acc-active" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Folders */}
        {activeAccount && (
          <div className="sidebar-section">
            <div className="section-header"><label>Folder</label></div>
            <div className="folder-list">
              {folders.map((folder) => (
                <button
                  key={folder.name}
                  className={`folder-item ${activeFolder === folder.name ? "active" : ""}`}
                  onClick={() => { setActiveFolder(folder.name); setCurrentPage(1); }}
                >
                  <span className="material-icons">{getFolderIcon(folder.name)}</span>
                  <span className="folder-name">{folder.name}</span>
                  {folder.unreadMessages > 0 && (
                    <span className="unread-count">{folder.unreadMessages}</span>
                  )}
                </button>
              ))}
            </div>
            {/* Empty Trash button */}
            {folders.some((f) => f.name.toUpperCase().includes("TRASH")) && (
              <button
                className="empty-trash-btn"
                onClick={handleEmptyTrash}
                disabled={actionLoading === "empty-trash"}
              >
                <span className="material-icons">delete_sweep</span>
                {actionLoading === "empty-trash" ? "Mengosongkan..." : "Kosongkan Trash"}
              </button>
            )}
          </div>
        )}
      </aside>

      {/* ═══ MIDDLE: EMAIL LIST ═══ */}
      <div className="email-list-panel">
        <div className="list-header">
          <button className="mobile-menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <span className="material-icons">menu</span>
          </button>
          <h2>{activeFolder || "Inbox"}</h2>
          <span className="msg-count">{messages.length} email</span>
          <div className="list-actions">
            <button className="icon-action" onClick={() => refetchMessages()} title="Refresh">
              <span className="material-icons">refresh</span>
            </button>
          </div>
        </div>

        {loadingMessages ? (
          <div className="email-list-loading">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="email-skeleton">
                <div className="skel-avatar" />
                <div className="skel-content">
                  <div className="skel-line w60" />
                  <div className="skel-line w80" />
                  <div className="skel-line w40" />
                </div>
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="email-list-empty">
            <span className="material-icons">mail_outline</span>
            <p>Tidak ada email di folder ini</p>
          </div>
        ) : (
          <div className="email-list">
            {messages.map((msg) => (
              <div
                key={msg.uid}
                className={`email-item ${selectedUid === msg.uid ? "selected" : ""} ${!msg.isRead ? "unread" : ""}`}
                onClick={() => openEmail(msg.uid)}
              >
                <div className="email-avatar" style={{ background: getAvatarColor(msg.from) }}>
                  {getInitials(getSenderName(msg.from))}
                </div>
                <div className="email-content">
                  <div className="email-top">
                    <span className="email-sender">{getSenderName(msg.from)}</span>
                    <span className="email-date">{timeAgo(msg.date)}</span>
                  </div>
                  <div className="email-subject">{msg.subject || "(Tanpa subjek)"}</div>
                </div>
                <div className="email-actions-quick">
                  <button
                    className={`star-btn ${msg.isStarred ? "starred" : ""}`}
                    onClick={(e) => { e.stopPropagation(); handleStar(msg); }}
                    title="Bintang"
                  >
                    <span className="material-icons">{msg.isStarred ? "star" : "star_border"}</span>
                  </button>
                  <button
                    className="del-btn"
                    onClick={(e) => { e.stopPropagation(); handleDelete(msg.uid); }}
                    title="Hapus"
                  >
                    <span className="material-icons">delete_outline</span>
                  </button>
                </div>
                {!msg.isRead && <div className="unread-dot" />}
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {messages.length > 0 && (
          <div className="pagination">
            <button disabled={currentPage <= 1} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}>
              <span className="material-icons">chevron_left</span>
            </button>
            <span>Halaman {currentPage}</span>
            <button onClick={() => setCurrentPage((p) => p + 1)}>
              <span className="material-icons">chevron_right</span>
            </button>
          </div>
        )}
      </div>

      {/* ═══ RIGHT: EMAIL VIEWER ═══ */}
      <div className="email-viewer-panel">
        {loadingDetail ? (
          <div className="viewer-loading">
            <div className="mini-spinner" />
            <p>Memuat email...</p>
          </div>
        ) : selectedEmail ? (
          <>
            <div className="viewer-toolbar">
              <button className="viewer-btn" onClick={openReply} title="Balas">
                <span className="material-icons">reply</span>
                <span>Balas</span>
              </button>
              <button className="viewer-btn" onClick={openForward} title="Teruskan">
                <span className="material-icons">forward</span>
                <span>Teruskan</span>
              </button>
              <div className="toolbar-spacer" />
              <button className="viewer-btn danger" onClick={() => handleDelete(selectedEmail.uid)} title="Hapus">
                <span className="material-icons">delete</span>
              </button>
            </div>
            <div className="viewer-header">
              <h2>{selectedEmail.subject || "(Tanpa subjek)"}</h2>
              <div className="viewer-meta">
                <div className="viewer-avatar" style={{ background: getAvatarColor(selectedEmail.from) }}>
                  {getInitials(getSenderName(selectedEmail.from))}
                </div>
                <div className="viewer-meta-text">
                  <div className="viewer-from">
                    <strong>{getSenderName(selectedEmail.from)}</strong>
                    <span className="viewer-email">&lt;{selectedEmail.from.replace(/.*<([^>]+)>.*/, "$1")}&gt;</span>
                  </div>
                  <div className="viewer-to">
                    Kepada: <span>{selectedEmail.to}</span>
                  </div>
                </div>
                <span className="viewer-date">
                  {selectedEmail.date ? new Date(selectedEmail.date).toLocaleString("id-ID") : ""}
                </span>
              </div>
            </div>
            <div className="viewer-body">
              {emailHtmlBody ? (
                <iframe
                  ref={iframeRef}
                  srcDoc={`<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:14px;color:#1e293b;line-height:1.6;margin:16px;word-break:break-word;}img{max-width:100%;height:auto;}a{color:#0066FF;}</style></head><body>${emailHtmlBody}</body></html>`}
                  className="email-iframe"
                  sandbox="allow-same-origin"
                  title="Email body"
                />
              ) : (
                <pre className="email-plain">{selectedEmail.body || "Tidak ada isi email"}</pre>
              )}
            </div>
            {selectedEmail.attachments && selectedEmail.attachments.length > 0 && (
              <div className="viewer-attachments">
                <h4><span className="material-icons">attach_file</span> Lampiran ({selectedEmail.attachments.length})</h4>
                <div className="attachment-list">
                  {selectedEmail.attachments.map((att: any, idx: number) => (
                    <div key={idx} className="attachment-chip">
                      <span className="material-icons">insert_drive_file</span>
                      <span>{att.filename || att.name || `Lampiran ${idx + 1}`}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="viewer-empty">
            <span className="material-icons">email</span>
            <h3>Pilih email untuk dibaca</h3>
            <p>Klik salah satu email di daftar untuk melihat isinya</p>
          </div>
        )}
      </div>

      {/* ═══ COMPOSE MODAL ═══ */}
      {showCompose && (
        <div className="compose-overlay" onClick={() => setShowCompose(false)}>
          <div className="compose-modal" onClick={(e) => e.stopPropagation()}>
            <div className="compose-header">
              <h3>{composeMode === "reply" ? "Balas Email" : composeMode === "forward" ? "Teruskan Email" : "Email Baru"}</h3>
              <button className="close-btn" onClick={() => setShowCompose(false)}>
                <span className="material-icons">close</span>
              </button>
            </div>
            <div className="compose-body">
              <div className="compose-field">
                <label>Dari</label>
                {accounts.length === 0 ? (
                  <div className="no-account-notice">
                    <span className="material-icons">info</span>
                    <span>Belum ada akun terhubung. Tambahkan akun terlebih dahulu.</span>
                  </div>
                ) : (
                  <select value={activeAccount} onChange={(e) => setActiveAccount(e.target.value)}>
                    {accounts.map((acc) => (
                      <option key={acc.emailAddress} value={acc.emailAddress}>{acc.emailAddress}</option>
                    ))}
                  </select>
                )}
              </div>
              <div className="compose-field">
                <label>Kepada</label>
                <input type="email" value={composeTo} onChange={(e) => setComposeTo(e.target.value)} placeholder="email@contoh.com" />
              </div>
              <div className="compose-field">
                <label>Subjek</label>
                <input type="text" value={composeSubject} onChange={(e) => setComposeSubject(e.target.value)} placeholder="Subjek email" />
              </div>
              <div className="compose-field full">
                <textarea
                  value={composeMessage}
                  onChange={(e) => setComposeMessage(e.target.value)}
                  placeholder="Tulis pesan Anda..."
                  rows={12}
                />
              </div>
            </div>
            <div className="compose-footer">
              <button className="secondary-btn" onClick={() => setShowCompose(false)}>Batal</button>
              <button className="send-btn" onClick={handleSend} disabled={composeSending}>
                <span className="material-icons">send</span>
                {composeSending ? "Mengirim..." : "Kirim"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ ADD ACCOUNT MODAL ═══ */}
      {showAddAccount && (
        <div className="compose-overlay" onClick={() => setShowAddAccount(false)}>
          <div className="compose-modal small" onClick={(e) => e.stopPropagation()}>
            <div className="compose-header">
              <h3>Tambah Akun Email</h3>
              <button className="close-btn" onClick={() => setShowAddAccount(false)}>
                <span className="material-icons">close</span>
              </button>
            </div>
            <div className="compose-body">
              <div className="compose-field">
                <label>Provider</label>
                <select value={accProvider} onChange={(e) => setAccProvider(e.target.value)}>
                  <option value="gmail">Gmail</option>
                  <option value="outlook">Outlook</option>
                  <option value="yahoo">Yahoo</option>
                  <option value="imap">IMAP Lainnya</option>
                </select>
              </div>
              <div className="compose-field">
                <label>Alamat Email</label>
                <input type="email" value={accEmail} onChange={(e) => setAccEmail(e.target.value)} placeholder="email@domain.com" />
              </div>
              <div className="compose-field">
                <label>Password / App Password</label>
                <input type="password" value={accPassword} onChange={(e) => setAccPassword(e.target.value)} placeholder="••••••••" />
              </div>
              <div className="compose-field">
                <label>Auth Type</label>
                <select value={accAuthType} onChange={(e) => setAccAuthType(e.target.value)}>
                  <option value="oauth2">OAuth2</option>
                  <option value="password">Password</option>
                  <option value="app-password">App Password</option>
                </select>
              </div>
            </div>
            <div className="compose-footer">
              <button className="secondary-btn" onClick={() => setShowAddAccount(false)}>Batal</button>
              <button className="send-btn" onClick={handleAddAccount} disabled={addingAccount}>
                <span className="material-icons">add</span>
                {addingAccount ? "Menambahkan..." : "Tambah Akun"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ STYLES ═══ */}
      <style jsx>{`
        /* ─── LAYOUT ─────────────────────── */
        .inbox-layout {
          display: grid;
          grid-template-columns: 260px 360px 1fr;
          height: calc(100vh - 64px);
          gap: 0;
          overflow: hidden;
          background: #f8fafc;
          margin: 0;
          border-radius: 0;
        }

        /* ─── TOAST ──────────────────────── */
        .inbox-toast { position: fixed; top: 20px; right: 20px; display: flex; align-items: center; gap: 8px; padding: 12px 20px; border-radius: 10px; font-size: 14px; font-weight: 500; z-index: 1100; animation: toastIn 0.3s ease; }
        .inbox-toast.success { background: #dcfce7; color: #16a34a; }
        .inbox-toast.error { background: #fee2e2; color: #dc2626; }
        @keyframes toastIn { from { transform: translateY(-20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

        /* ─── SIDEBAR ────────────────────── */
        .inbox-sidebar {
          background: white;
          border-right: 1px solid #f1f5f9;
          display: flex;
          flex-direction: column;
          overflow-y: auto;
          padding: 20px 16px;
        }
        .compose-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          width: 100%;
          padding: 14px;
          background: #0066FF;
          color: white;
          border: none;
          border-radius: 14px;
          font-weight: 700;
          font-size: 14px;
          cursor: pointer;
          font-family: 'Montserrat', sans-serif;
          transition: all 0.2s;
          margin-bottom: 24px;
          box-shadow: 0 4px 12px rgba(0,102,255,0.3);
        }
        .compose-btn:hover { background: #0052CC; transform: translateY(-1px); box-shadow: 0 6px 16px rgba(0,102,255,0.4); }
        .compose-btn .material-icons { font-size: 20px; }

        .sidebar-section { margin-bottom: 24px; }
        .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; padding: 0 4px; }
        .section-header label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; }
        .add-btn { width: 28px; height: 28px; border-radius: 6px; border: none; background: #f1f5f9; color: #64748b; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; }
        .add-btn .material-icons { font-size: 18px; color: inherit; text-transform: none; letter-spacing: 0; font-weight: normal; }
        .add-btn:hover { background: #0066FF; color: white; }

        .sidebar-loading { padding: 20px; text-align: center; }
        .mini-spinner { width: 24px; height: 24px; border: 3px solid #f1f5f9; border-top-color: #0066FF; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .sidebar-empty { font-size: 12px; color: #94a3b8; text-align: center; padding: 12px; }

        .account-list { display: flex; flex-direction: column; gap: 4px; }
        .account-item { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border: none; background: none; border-radius: 10px; cursor: pointer; text-align: left; width: 100%; transition: all 0.15s; position: relative; }
        .account-item:hover { background: #f8fafc; }
        .account-item.active { background: #eff6ff; }
        .acc-avatar { width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; color: white; flex-shrink: 0; }
        .acc-info { display: flex; flex-direction: column; overflow: hidden; flex: 1; }
        .acc-email { font-size: 12px; font-weight: 600; color: #1e293b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .acc-provider { font-size: 10px; color: #94a3b8; text-transform: capitalize; }
        .acc-active { width: 8px; height: 8px; border-radius: 50%; background: #16a34a; flex-shrink: 0; }

        .folder-list { display: flex; flex-direction: column; gap: 2px; }
        .folder-item { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border: none; background: none; border-radius: 10px; cursor: pointer; font-size: 13px; color: #475569; font-weight: 500; transition: all 0.15s; font-family: 'Montserrat', sans-serif; width: 100%; text-align: left; }
        .folder-item .material-icons { font-size: 20px; color: #94a3b8; }
        .folder-item:hover { background: #f8fafc; }
        .folder-item.active { background: #eff6ff; color: #0066FF; font-weight: 600; }
        .folder-item.active .material-icons { color: #0066FF; }
        .folder-name { flex: 1; }
        .unread-count { background: #0066FF; color: white; font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 10px; min-width: 20px; text-align: center; }

        .empty-trash-btn { display: flex; align-items: center; gap: 8px; padding: 10px 12px; margin-top: 8px; border: 1px solid #fee2e2; background: none; border-radius: 10px; color: #dc2626; font-size: 12px; font-weight: 600; cursor: pointer; width: 100%; font-family: 'Montserrat', sans-serif; transition: all 0.2s; }
        .empty-trash-btn:hover { background: #fee2e2; }
        .empty-trash-btn:disabled { opacity: 0.5; }
        .empty-trash-btn .material-icons { font-size: 18px; }

        /* ─── EMAIL LIST ─────────────────── */
        .email-list-panel {
          background: white;
          border-right: 1px solid #f1f5f9;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .list-header { display: flex; align-items: center; gap: 12px; padding: 16px 20px; border-bottom: 1px solid #f1f5f9; }
        .mobile-menu-btn { display: none; width: 36px; height: 36px; border: none; background: none; cursor: pointer; border-radius: 8px; }
        .mobile-menu-btn:hover { background: #f1f5f9; }
        .list-header h2 { font-size: 16px; font-weight: 700; color: #1e293b; margin: 0; }
        .msg-count { font-size: 12px; color: #94a3b8; background: #f1f5f9; padding: 4px 10px; border-radius: 12px; }
        .list-actions { margin-left: auto; display: flex; gap: 4px; }
        .icon-action { width: 36px; height: 36px; border-radius: 8px; border: none; background: none; color: #64748b; cursor: pointer; display: flex; align-items: center; justify-content: center; }
        .icon-action:hover { background: #f1f5f9; }

        .email-list { overflow-y: auto; flex: 1; }
        .email-item { display: flex; align-items: center; gap: 12px; padding: 16px 20px; cursor: pointer; border-bottom: 1px solid #f8fafc; transition: all 0.15s; position: relative; }
        .email-item:hover { background: #fafafa; }
        .email-item.selected { background: #eff6ff; border-left: 3px solid #0066FF; }
        .email-item.unread .email-sender { font-weight: 700; color: #0f172a; }
        .email-item.unread .email-subject { font-weight: 600; color: #1e293b; }
        .email-avatar { width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; color: white; flex-shrink: 0; }
        .email-content { flex: 1; overflow: hidden; }
        .email-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
        .email-sender { font-size: 13px; font-weight: 500; color: #475569; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .email-date { font-size: 11px; color: #94a3b8; flex-shrink: 0; margin-left: 8px; }
        .email-subject { font-size: 13px; color: #64748b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .email-actions-quick { display: flex; gap: 2px; opacity: 0; transition: opacity 0.2s; }
        .email-item:hover .email-actions-quick { opacity: 1; }
        .star-btn, .del-btn { width: 30px; height: 30px; border-radius: 6px; border: none; background: none; color: #94a3b8; cursor: pointer; display: flex; align-items: center; justify-content: center; }
        .star-btn .material-icons, .del-btn .material-icons { font-size: 18px; }
        .star-btn:hover { color: #f59e0b; }
        .star-btn.starred { color: #f59e0b; }
        .del-btn:hover { color: #ef4444; }
        .unread-dot { position: absolute; left: 8px; top: 50%; transform: translateY(-50%); width: 8px; height: 8px; border-radius: 50%; background: #0066FF; }

        .email-list-loading { padding: 8px; }
        .email-skeleton { display: flex; gap: 12px; padding: 16px 20px; }
        .skel-avatar { width: 40px; height: 40px; border-radius: 50%; background: #f1f5f9; flex-shrink: 0; animation: shimmer 1.5s infinite; background-size: 200% 100%; background-image: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%); }
        .skel-content { flex: 1; display: flex; flex-direction: column; gap: 8px; }
        .skel-line { height: 12px; border-radius: 6px; background-image: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; }
        .skel-line.w60 { width: 60%; }
        .skel-line.w80 { width: 80%; }
        .skel-line.w40 { width: 40%; }
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

        .email-list-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; flex: 1; color: #94a3b8; }
        .email-list-empty .material-icons { font-size: 48px; margin-bottom: 12px; }
        .email-list-empty p { font-size: 14px; }

        .pagination { display: flex; align-items: center; justify-content: center; gap: 12px; padding: 12px; border-top: 1px solid #f1f5f9; }
        .pagination button { width: 32px; height: 32px; border-radius: 8px; border: 1px solid #e2e8f0; background: white; color: #64748b; cursor: pointer; display: flex; align-items: center; justify-content: center; }
        .pagination button:hover:not(:disabled) { background: #0066FF; color: white; border-color: #0066FF; }
        .pagination button:disabled { opacity: 0.3; cursor: not-allowed; }
        .pagination span { font-size: 13px; color: #64748b; font-weight: 500; }

        /* ─── EMAIL VIEWER ───────────────── */
        .email-viewer-panel {
          background: white;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .viewer-loading { display: flex; flex-direction: column; align-items: center; justify-content: center; flex: 1; gap: 12px; color: #94a3b8; }
        .viewer-loading p { font-size: 14px; }

        .viewer-toolbar { display: flex; gap: 8px; padding: 12px 24px; border-bottom: 1px solid #f1f5f9; align-items: center; }
        .viewer-btn { display: flex; align-items: center; gap: 6px; padding: 8px 14px; border: 1px solid #e2e8f0; border-radius: 8px; background: white; color: #475569; font-size: 12px; font-weight: 600; cursor: pointer; font-family: 'Montserrat', sans-serif; transition: all 0.2s; }
        .viewer-btn:hover { background: #f8fafc; border-color: #0066FF; color: #0066FF; }
        .viewer-btn.danger:hover { border-color: #ef4444; color: #ef4444; }
        .viewer-btn .material-icons { font-size: 18px; }
        .toolbar-spacer { flex: 1; }

        .viewer-header { padding: 24px 24px 16px; border-bottom: 1px solid #f8fafc; }
        .viewer-header h2 { font-size: 18px; font-weight: 700; color: #0f172a; margin: 0 0 16px 0; line-height: 1.4; }
        .viewer-meta { display: flex; align-items: flex-start; gap: 12px; }
        .viewer-avatar { width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 700; color: white; flex-shrink: 0; }
        .viewer-meta-text { flex: 1; }
        .viewer-from { font-size: 14px; margin-bottom: 2px; }
        .viewer-from strong { color: #1e293b; }
        .viewer-email { font-size: 12px; color: #94a3b8; margin-left: 4px; }
        .viewer-to { font-size: 12px; color: #94a3b8; }
        .viewer-to span { color: #64748b; }
        .viewer-date { font-size: 12px; color: #94a3b8; white-space: nowrap; }

        .viewer-body { flex: 1; overflow: auto; padding: 0; }
        .email-iframe { width: 100%; height: 100%; border: none; min-height: 400px; }
        .email-plain { white-space: pre-wrap; font-family: 'Montserrat', sans-serif; font-size: 14px; color: #475569; line-height: 1.7; padding: 24px; margin: 0; }

        .viewer-attachments { padding: 16px 24px; border-top: 1px solid #f1f5f9; }
        .viewer-attachments h4 { display: flex; align-items: center; gap: 6px; font-size: 13px; color: #475569; margin: 0 0 12px 0; }
        .viewer-attachments h4 .material-icons { font-size: 18px; }
        .attachment-list { display: flex; flex-wrap: wrap; gap: 8px; }
        .attachment-chip { display: flex; align-items: center; gap: 6px; padding: 8px 14px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 12px; color: #475569; background: #fafafa; }
        .attachment-chip .material-icons { font-size: 16px; color: #94a3b8; }

        .viewer-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; flex: 1; color: #94a3b8; text-align: center; padding: 40px; }

        /* No Account Notice */
        .no-account-notice { display: flex; align-items: center; gap: 8px; padding: 12px 16px; background: #fffbeb; border: 1px solid #fde68a; border-radius: 10px; font-size: 13px; color: #92400e; }
        .no-account-notice .material-icons { font-size: 20px; color: #f59e0b; flex-shrink: 0; }
        .viewer-empty .material-icons { font-size: 64px; margin-bottom: 16px; color: #e2e8f0; }
        .viewer-empty h3 { font-size: 18px; color: #64748b; margin: 0 0 8px 0; }
        .viewer-empty p { font-size: 14px; }

        /* ─── COMPOSE MODAL ──────────────── */
        .compose-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
        .compose-modal { background: white; width: 100%; max-width: 640px; border-radius: 20px; overflow: hidden; box-shadow: 0 25px 50px rgba(0,0,0,0.2); display: flex; flex-direction: column; max-height: 85vh; }
        .compose-modal.small { max-width: 460px; }
        .compose-header { padding: 20px 24px; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; }
        .compose-header h3 { font-size: 18px; font-weight: 700; color: #1e293b; margin: 0; }
        .close-btn { width: 36px; height: 36px; border-radius: 8px; border: none; background: #f1f5f9; color: #64748b; display: flex; align-items: center; justify-content: center; cursor: pointer; }
        .compose-body { padding: 24px; overflow-y: auto; flex: 1; }
        .compose-field { margin-bottom: 16px; }
        .compose-field label { display: block; font-size: 12px; font-weight: 600; color: #64748b; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px; }
        .compose-field input, .compose-field select { width: 100%; padding: 12px 16px; border: 1px solid #e2e8f0; border-radius: 10px; font-size: 14px; font-family: 'Montserrat', sans-serif; transition: border-color 0.2s; }
        .compose-field input:focus, .compose-field select:focus { outline: none; border-color: #0066FF; box-shadow: 0 0 0 3px rgba(0,102,255,0.1); }
        .compose-field.full textarea { width: 100%; padding: 16px; border: 1px solid #e2e8f0; border-radius: 10px; font-size: 14px; font-family: 'Montserrat', sans-serif; resize: vertical; line-height: 1.6; }
        .compose-field.full textarea:focus { outline: none; border-color: #0066FF; box-shadow: 0 0 0 3px rgba(0,102,255,0.1); }
        .compose-footer { padding: 16px 24px; border-top: 1px solid #f1f5f9; display: flex; gap: 12px; justify-content: flex-end; }
        .secondary-btn { padding: 10px 18px; background: #f1f5f9; color: #64748b; border: none; border-radius: 10px; font-weight: 600; cursor: pointer; font-family: 'Montserrat', sans-serif; font-size: 13px; }
        .send-btn { display: flex; align-items: center; gap: 8px; padding: 10px 20px; background: #0066FF; color: white; border: none; border-radius: 10px; font-weight: 600; cursor: pointer; font-family: 'Montserrat', sans-serif; font-size: 13px; transition: all 0.2s; }
        .send-btn:hover { background: #0052CC; }
        .send-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .send-btn .material-icons { font-size: 18px; }

        /* ─── RESPONSIVE ─────────────────── */
        @media (max-width: 1024px) {
          .inbox-layout { grid-template-columns: 220px 1fr; }
          .email-viewer-panel { position: fixed; top: 80px; right: 0; bottom: 0; width: 50%; z-index: 50; box-shadow: -4px 0 24px rgba(0,0,0,0.1); display: ${selectedEmail ? "flex" : "none"}; }
        }
        @media (max-width: 768px) {
          .inbox-layout { grid-template-columns: 1fr; }
          .inbox-sidebar { position: fixed; top: 80px; left: 0; bottom: 0; width: 280px; z-index: 60; transform: translateX(-100%); transition: transform 0.3s; box-shadow: 4px 0 24px rgba(0,0,0,0.1); }
          .inbox-sidebar.open { transform: translateX(0); }
          .mobile-menu-btn { display: flex; }
          .email-viewer-panel { width: 100%; }
        }
      `}</style>
    </div>
  );
}
