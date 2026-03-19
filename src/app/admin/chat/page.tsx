"use client";

import { useState, useEffect, useRef } from "react";
import {
  getGroups,
  subscribeMessages,
  ChatGroup,
  ChatMessage,
} from "@/services/chatService";
import { Timestamp } from "firebase/firestore";

// ─── HELPERS ─────────────────────────────────

function formatAuthor(authorId: string): string {
  if (!authorId) return "Unknown";
  // Convert "samamikrosolusi_gmail_com" → "samamikrosolusi@gmail.com"
  return authorId.replace(/_/g, ".").replace(/\.gmail\.com/, "@gmail.com").replace(/\.yahoo\.com/, "@yahoo.com");
}

function formatTimestamp(ts: Timestamp | null): string {
  if (!ts) return "";
  const date = ts.toDate();
  return date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

function formatDateSeparator(ts: Timestamp | null): string {
  if (!ts) return "";
  const date = ts.toDate();
  return date.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

function getInitials(authorId: string): string {
  if (!authorId) return "?";
  const clean = authorId.replace(/_/g, " ");
  return clean.split(" ").map((w) => w[0]).join("").substring(0, 2).toUpperCase();
}

function getAvatarColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return `hsl(${Math.abs(hash) % 360}, 55%, 55%)`;
}

// ─── MAIN COMPONENT ─────────────────────────

export default function ChatPage() {
  const [groups, setGroups] = useState<ChatGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<ChatGroup | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoadingGroups, setIsLoadingGroups] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ─── LOAD GROUPS ─────────────────────
  useEffect(() => {
    (async () => {
      try {
        setIsLoadingGroups(true);
        setError(null);
        const data = await getGroups();
        setGroups(data);
        if (data.length > 0) setSelectedGroup(data[0]);
      } catch (err: any) {
        console.error("Failed to load groups:", err);
        setError(err.message || "Gagal memuat grup chat");
      } finally {
        setIsLoadingGroups(false);
      }
    })();
  }, []);

  // ─── SUBSCRIBE TO MESSAGES ───────────
  useEffect(() => {
    if (!selectedGroup) return;

    setIsLoadingMessages(true);
    setMessages([]);

    const unsubscribe = subscribeMessages(selectedGroup.id, (msgs) => {
      setMessages(msgs);
      setIsLoadingMessages(false);
    });

    return () => unsubscribe();
  }, [selectedGroup]);

  // ─── AUTO SCROLL ─────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ─── FILTER GROUPS ───────────────────
  const filteredGroups = groups.filter((g) =>
    (g.name || g.id).toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ─── GROUP DATE SEPARATORS ───────────
  const getDateKey = (ts: Timestamp | null): string => {
    if (!ts) return "";
    return ts.toDate().toDateString();
  };

  return (
    <div className="chat-container">
      {/* Left Sidebar - Group List */}
      <div className="chat-sidebar">
        <div className="sidebar-header">
          <div className="search-box">
            <span className="material-icons">search</span>
            <input
              type="text"
              placeholder="Cari grup..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="chat-list">
          {isLoadingGroups ? (
            <div className="loading-groups">
              {[1, 2, 3].map((i) => (
                <div key={i} className="skel-group">
                  <div className="skel-circle" />
                  <div className="skel-lines">
                    <div className="skel-line w70" />
                    <div className="skel-line w40" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="empty-groups">
              <span className="material-icons" style={{color:'#ef4444'}}>error_outline</span>
              <p style={{color:'#ef4444', fontSize:12, textAlign:'center', padding:'0 16px'}}>{error}</p>
            </div>
          ) : filteredGroups.length === 0 ? (
            <div className="empty-groups">
              <span className="material-icons">forum</span>
              <p>Tidak ada grup</p>
            </div>
          ) : (
            filteredGroups.map((group) => (
              <div
                key={group.id}
                className={`chat-item ${selectedGroup?.id === group.id ? "active" : ""}`}
                onClick={() => setSelectedGroup(group)}
              >
                <div className="avatar-placeholder group" style={{ background: getAvatarColor(group.id) }}>
                  <span className="material-icons">groups</span>
                </div>
                <div className="chat-info">
                  <div className="chat-name">{group.name || group.id}</div>
                  <div className="chat-preview">
                    <span>ID: {group.id}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right Panel - Chat Area */}
      <div className="chat-main">
        {selectedGroup ? (
          <>
            <div className="chat-header">
              <div className="header-left">
                <div className="avatar-placeholder group-header" style={{ background: getAvatarColor(selectedGroup.id) }}>
                  <span className="material-icons">groups</span>
                </div>
                <div className="header-info">
                  <h3>{selectedGroup.name || selectedGroup.id}</h3>
                  <span className="phone">Group ID: {selectedGroup.id}</span>
                </div>
              </div>
              <div className="header-actions">
                <button className="icon-btn"><span className="material-icons">search</span></button>
                <button className="icon-btn"><span className="material-icons">more_horiz</span></button>
              </div>
            </div>

            <div className="chat-messages">
              {isLoadingMessages ? (
                <div className="loading-messages">
                  <span className="material-icons spin">sync</span>
                  <p>Memuat pesan...</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="empty-messages">
                  <span className="material-icons">chat_bubble_outline</span>
                  <p>Belum ada pesan</p>
                </div>
              ) : (
                <>
                  {messages.map((msg, idx) => {
                    // Date separator
                    const prevDate = idx > 0 ? getDateKey(messages[idx - 1].createdAt) : "";
                    const currDate = getDateKey(msg.createdAt);
                    const showDateSep = idx === 0 || currDate !== prevDate;

                    return (
                      <div key={msg.id}>
                        {showDateSep && (
                          <div className="date-separator">
                            <span>{formatDateSeparator(msg.createdAt)}</span>
                          </div>
                        )}
                        <div className="message received">
                          <div className="msg-avatar" style={{ background: getAvatarColor(msg.authorId) }}>
                            {getInitials(msg.authorId)}
                          </div>
                          <div className="message-content">
                            <div className="message-header">
                              <span className="sender-name">{formatAuthor(msg.authorId)}</span>
                              <span className="platform-badge">{msg.metadata.platform}</span>
                            </div>
                            <div className="bubble">{msg.metadata.text}</div>
                            <span className="time">{formatTimestamp(msg.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>
          </>
        ) : (
          <div className="empty-selection">
            <span className="material-icons">forum</span>
            <p>Pilih grup untuk melihat pesan</p>
          </div>
        )}
      </div>

      <style jsx>{`
        .chat-container {
          display: flex;
          height: calc(100vh - 100px);
          background: white;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0,0,0,0.05);
        }

        /* Sidebar Styles */
        .chat-sidebar {
          width: 340px;
          border-right: 1px solid #e5e7eb;
          display: flex;
          flex-direction: column;
          background: #fafafa;
        }

        .sidebar-header {
          padding: 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          border-bottom: 1px solid #e5e7eb;
        }

        .search-box {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 8px;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 10px 14px;
        }

        .search-box .material-icons {
          color: #9ca3af;
          font-size: 20px;
        }

        .search-box input {
          flex: 1;
          border: none;
          font-size: 14px;
          font-family: 'Montserrat', sans-serif;
          color: #374151;
        }

        .search-box input:focus {
          outline: none;
        }

        .chat-list {
          flex: 1;
          overflow-y: auto;
        }

        .chat-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 16px;
          cursor: pointer;
          transition: background 0.2s;
          border-left: 3px solid transparent;
        }

        .chat-item:hover {
          background: #f3f4f6;
        }

        .chat-item.active {
          background: #eff6ff;
          border-left-color: #3b82f6;
        }

        .avatar-placeholder {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          flex-shrink: 0;
        }

        .chat-info {
          flex: 1;
          min-width: 0;
        }

        .chat-name {
          font-weight: 600;
          color: #111827;
          font-size: 14px;
          margin-bottom: 4px;
        }

        .chat-preview {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #6b7280;
          font-size: 13px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* Chat Main Styles */
        .chat-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          background: white;
        }

        .chat-header {
          padding: 16px 24px;
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .header-info h3 {
          font-size: 16px;
          font-weight: 600;
          margin: 0 0 2px 0;
          color: #111827;
        }

        .phone {
          font-size: 13px;
          color: #6b7280;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .icon-btn {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          border: none;
          background: #f3f4f6;
          color: #6b7280;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .icon-btn .material-icons {
          font-size: 20px;
        }

        /* Messages Styles */
        .chat-messages {
          flex: 1;
          padding: 20px 24px;
          overflow-y: auto;
          background: #fafafa;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .date-separator {
          text-align: center;
          color: #6b7280;
          font-size: 13px;
          font-weight: 500;
          padding: 10px 0;
        }

        .date-separator span {
          background: #e5e7eb;
          padding: 6px 16px;
          border-radius: 20px;
        }

        .message {
          display: flex;
          gap: 12px;
          max-width: 85%;
          align-self: flex-start;
        }

        .msg-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 700;
          color: white;
          flex-shrink: 0;
        }

        .message-content {
          display: flex;
          flex-direction: column;
        }

        .message-header {
          margin-bottom: 6px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .sender-name {
          font-size: 13px;
          font-weight: 600;
          color: #111827;
        }

        .platform-badge {
          font-size: 10px;
          padding: 1px 6px;
          border-radius: 6px;
          background: #f1f5f9;
          color: #64748b;
          font-weight: 500;
        }

        .bubble {
          padding: 14px 18px;
          border-radius: 16px;
          font-size: 14px;
          line-height: 1.6;
          background: #f3f4f6;
          color: #374151;
          border-top-left-radius: 4px;
        }

        .message .time {
          margin-top: 6px;
          font-size: 11px;
          color: #9ca3af;
        }

        /* Loading & Empty States */
        .loading-groups { padding: 12px; }
        .skel-group { display: flex; gap: 12px; padding: 14px 16px; }
        .skel-circle { width: 44px; height: 44px; border-radius: 50%; background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; flex-shrink: 0; }
        .skel-lines { flex: 1; display: flex; flex-direction: column; gap: 8px; justify-content: center; }
        .skel-line { height: 12px; border-radius: 6px; background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; }
        .skel-line.w70 { width: 70%; }
        .skel-line.w40 { width: 40%; }
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

        .empty-groups, .empty-messages, .empty-selection, .loading-messages {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: #94a3b8;
          gap: 12px;
        }

        .empty-groups .material-icons, .empty-messages .material-icons, .empty-selection .material-icons, .loading-messages .material-icons {
          font-size: 48px;
          color: #cbd5e1;
        }

        @keyframes spin-anim {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin { animation: spin-anim 1s linear infinite; }
      `}</style>
    </div>
  );
}
