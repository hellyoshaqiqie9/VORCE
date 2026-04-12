"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  getGroups,
  subscribeMessages,
  sendMessage,
  updateTypingStatus,
  subscribeTypingStatus,
  updateOnlineStatus,
  subscribeOnlineUsers,
  subscribePinnedMessages,
  pinMessage,
  unpinMessage,
  ChatGroup,
  ChatMessage,
} from "@/services/chatService";
import { Timestamp } from "firebase/firestore";
import { getAllUsers, AppUser } from "@/services/usersService";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { uploadFile } from "@/services/berkasService";
import { Toast } from "@/components/Toast";

// ─── HELPERS ─────────────────────────────────

function authorIdToEmail(authorId: string): string {
  if (!authorId) return "";
  return authorId
    .replace(/_/g, ".")
    .replace(/\.gmail\.com/, "@gmail.com")
    .replace(/\.yahoo\.com/, "@yahoo.com");
}

function formatTimestamp(ts: any): string {
  if (!ts) return "";
  try {
    const date = typeof ts.toDate === "function" ? ts.toDate() : new Date(ts);
    return date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (e) {
    return "";
  }
}

function formatDateSeparator(ts: any): string {
  if (!ts) return "";
  try {
    const date = typeof ts.toDate === "function" ? ts.toDate() : new Date(ts);
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch (e) {
    return "";
  }
}

function getAvatarColor(str: string): string {
  if (!str) return "#94a3b8";
  let hash = 0;
  for (let i = 0; i < str.length; i++)
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return `hsl(${Math.abs(hash) % 360}, 55%, 55%)`;
}

// Parse text for @{mentions} and PING!!!
function renderMessageText(text: string): React.ReactNode[] {
  if (!text) return [];
  const parts: React.ReactNode[] = [];
  // Split by @{name} mentions and PING!!!
  const regex = /(@\{([^}]+)\}|@(\S+)|PING!!!)/g;
  let lastIndex = 0;
  let match;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    // Add text before match
    if (match.index > lastIndex) {
      parts.push(
        <span key={key++}>{text.substring(lastIndex, match.index)}</span>
      );
    }
    if (match[0] === "PING!!!") {
      parts.push(
        <span key={key++} className="ping-text">
          PING!!!
        </span>
      );
    } else {
      const name = match[2] || match[3] || match[0];
      parts.push(
        <span key={key++} className="hl-mention">
          @{name}
        </span>
      );
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push(<span key={key++}>{text.substring(lastIndex)}</span>);
  }
  return parts;
}

// ─── WA-STYLE WAVEFORM COMPONENT ────────────
const WAVEFORM_HEIGHTS = [
  6, 10, 14, 20, 14, 10, 18, 24, 14, 10, 6, 12, 18, 22, 18, 14, 10, 16, 24, 20,
  12, 8, 14, 20, 24, 18, 12, 8, 12, 18, 22, 16, 10, 6, 12, 16, 20, 14, 8,
];

function CustomVoiceMessage({
  audioUrl,
  durationText,
  isMe,
}: {
  audioUrl: string;
  durationText: string;
  isMe?: boolean;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  const togglePlay = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (audioRef.current) {
      try {
        if (isPlaying) {
          audioRef.current.pause();
        } else {
          await audioRef.current.play();
        }
      } catch (err) {
        console.error("Audio playback error:", err);
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const val = Number(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = val;
      setProgress(val);
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time) || !isFinite(time)) return "00:00";
    const m = Math.floor(time / 60)
      .toString()
      .padStart(2, "0");
    const s = Math.floor(time % 60)
      .toString()
      .padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <>
      <style jsx>{`
        .vn-player {
          display: flex;
          align-items: center;
          gap: 14px;
          min-width: 200px;
          padding: 4px 6px;
        }
        .vn-play-btn {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: #f8fafc;
          color: #7669fe;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
          position: relative;
          z-index: 10;
          transition: transform 0.1s;
        }
        .vn-play-btn:active {
          transform: scale(0.95);
        }
        .is-me .vn-play-btn {
          background: white;
          color: #7669fe;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
        }
        .vn-play-btn .material-icons {
          font-size: 24px;
          margin-left: ${isPlaying ? "0" : "2px"};
        }

        .vn-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .vn-waveform-container {
          position: relative;
          height: 24px;
          display: flex;
          align-items: center;
        }
        .vn-waveform {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
        }
        .vn-bar {
          width: 3px;
          border-radius: 2px;
          background: #cbd5e1;
          transition: background 0.1s;
        }
        .is-me .vn-bar {
          background: rgba(255, 255, 255, 0.4);
        }
        .vn-bar.active {
          background: #7669fe;
        }
        .is-me .vn-bar.active {
          background: white;
        }

        .vn-range-hidden {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          opacity: 0;
          cursor: pointer;
          margin: 0;
          z-index: 2;
        }

        .vn-time {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 600;
          color: #64748b;
          font-variant-numeric: tabular-nums;
        }
        .is-me .vn-time {
          color: rgba(255, 255, 255, 0.9);
        }
        .vn-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #10b981;
        }
      `}</style>
      <div className={`vn-player ${isMe ? "is-me" : ""}`}>
        <audio
          ref={audioRef}
          src={audioUrl}
          preload="metadata"
          onTimeUpdate={() => setProgress(audioRef.current?.currentTime || 0)}
          onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
          onEnded={() => {
            setIsPlaying(false);
            setProgress(0);
          }}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />

        <button className="vn-play-btn" onClick={togglePlay}>
          <span className="material-icons">
            {isPlaying ? "pause" : "play_arrow"}
          </span>
        </button>

        <div className="vn-content">
          <div className="vn-waveform-container">
            <div className="vn-waveform">
              {WAVEFORM_HEIGHTS.map((h, i) => {
                const currentPct = duration > 0 ? progress / duration : 0;
                const barPct = i / WAVEFORM_HEIGHTS.length;
                const isActive = barPct <= currentPct;
                return (
                  <div
                    key={i}
                    className={`vn-bar ${isActive ? "active" : ""}`}
                    style={{ height: `${h}px` }}
                  />
                );
              })}
            </div>
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={progress}
              onChange={handleSeek}
              className="vn-range-hidden"
            />
          </div>
          <div className="vn-time">
            <span className="vn-dot" />
            {progress > 0 ? formatTime(progress) : durationText || "00:00"}
          </div>
        </div>
      </div>
    </>
  );
}

// ─── MAIN COMPONENT ─────────────────────────

export default function ChatPage() {
  const router = useRouter();
  const [groups, setGroups] = useState<ChatGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<ChatGroup | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoadingGroups, setIsLoadingGroups] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [usersMap, setUsersMap] = useState<Map<string, AppUser>>(new Map());
  const [allUsers, setAllUsers] = useState<AppUser[]>([]);

  // Advanced features state
  const [pinnedMessages, setPinnedMessages] = useState<ChatMessage[]>([]);
  const [isPinnedViewMode, setIsPinnedViewMode] = useState(false);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [showAttachMenu, setShowAttachMenu] = useState(false);

  // Search chat
  const [showChatSearch, setShowChatSearch] = useState(false);
  const [chatSearchQuery, setChatSearchQuery] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  // Mention/Tag
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionCursorIndex, setMentionCursorIndex] = useState(-1);

  // Group Info Panel
  const [showGroupInfo, setShowGroupInfo] = useState(false);

  // Chat Input & Status States
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [typists, setTypists] = useState<string[]>([]);
  const [onlineCount, setOnlineCount] = useState<number>(0);
  const [isRecordingWeb, setIsRecordingWeb] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<NodeJS.Timeout | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Resolve authorId to real user name
  const resolveAuthorName = (msg: ChatMessage): string => {
    if (msg.authorName) return msg.authorName;
    const authorId = msg.authorId;
    if (!authorId) return "Unknown";
    const email = authorIdToEmail(authorId);
    const byEmail = usersMap.get(email.toLowerCase());
    if (byEmail?.name) return byEmail.name;
    const byId = usersMap.get(authorId);
    if (byId?.name) return byId.name;
    return email || authorId;
  };

  const getInitials = (msg: ChatMessage): string => {
    const name = resolveAuthorName(msg);
    if (!name) return "?";
    if (name.includes("@")) return name.substring(0, 2).toUpperCase();
    return (
      name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .substring(0, 2)
        .toUpperCase() || "?"
    );
  };

  const handleSpecialCardClick = (msg: any) => {
    const subtype = msg.metadata?.subtype || "";
    const type = msg.type || "";

    if (subtype === "task" || subtype === "tugas") {
      router.push("/admin/tasks");
    } else if (subtype === "izin" || subtype === "leave_request") {
      router.push("/admin/izin");
    } else if (subtype === "reimburse" || subtype === "reimbursement") {
      router.push("/admin/reimburse");
    } else if (type === "file" || subtype === "file") {
      router.push("/admin/berkas");
    }
  };

  // ─── LOAD USERS DIRECTORY (cached) ───
  useEffect(() => {
    getAllUsers()
      .then((users) => {
        const map = new Map<string, AppUser>();
        users.forEach((u) => {
          if (u.email) map.set(u.email.toLowerCase(), u);
          if (u.userId) map.set(u.userId, u);
        });
        setUsersMap(map);
        setAllUsers(users);
      })
      .catch((e) => console.error("Failed to load users for chat:", e));
  }, []);

  useEffect(() => {
    const auth = getAuth();
    const unsub = onAuthStateChanged(auth, (u) => setCurrentUser(u));
    return () => unsub();
  }, []);

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

    const unsubscribe = subscribeMessages(selectedGroup.id, (msgs, err) => {
      if (err) {
        console.error("Chat subscription error:", err);
        setError(err.message || "Gagal berlangganan pesan");
      } else {
        setMessages(msgs);
        setError(null);
        // Realtime update for the last message preview in the sidebar
        if (msgs.length > 0) {
          const lastMsg = msgs[msgs.length - 1];
          const previewText = lastMsg.type === "image" ? "📷 Gambar" : 
                             lastMsg.type === "audio" || lastMsg.metadata?.subtype === "recording" ? "🎤 Pesan Suara" :
                             lastMsg.type === "file" ? "📄 Berkas" :
                             lastMsg.metadata.text || "...";
          
          setGroups(prev => prev.map(g => g.id === selectedGroup.id ? { ...g, lastMessage: previewText } : g));
        }
      }
      setIsLoadingMessages(false);
    });

    // Subscribe Pinned Messages from Firestore
    const unsubPinned = subscribePinnedMessages(selectedGroup.id, (pinned) => {
      setPinnedMessages(pinned);
    });

    updateOnlineStatus(selectedGroup.id, true);
    const unsubOnline = subscribeOnlineUsers(selectedGroup.id, (count) =>
      setOnlineCount(count)
    );
    const unsubTyping = subscribeTypingStatus(selectedGroup.id, (list) =>
      setTypists(list)
    );

    return () => {
      unsubscribe();
      unsubPinned();
      unsubOnline();
      unsubTyping();
      updateOnlineStatus(selectedGroup.id, false);
    };
  }, [selectedGroup]);

  // ─── HANDLE TYPING & SEND ────────────
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleTyping = (text: string) => {
    setNewMessage(text);
    if (!selectedGroup) return;

    // Mention detection (matches mobile: allows spaces in query, only rejects newlines)
    const atIndex = text.lastIndexOf("@");
    if (atIndex !== -1) {
      const validStart =
        atIndex === 0 ||
        text.charAt(atIndex - 1) === " " ||
        text.charAt(atIndex - 1) === "\n";
      if (validStart) {
        const query = text.substring(atIndex + 1);
        if (!query.includes("\n")) {
          setShowMentions(true);
          setMentionQuery(query);
          setMentionCursorIndex(atIndex);
        } else {
          setShowMentions(false);
        }
      } else {
        setShowMentions(false);
      }
    } else {
      setShowMentions(false);
    }

    // Auto-send on PING pattern: @name p! (matches mobile's onChanged auto-send)
    const autoPingRegex = /@[^@\n]+\s+[pP]!\s*$/;
    if (autoPingRegex.test(text) && !isSending) {
      // Pass text directly to avoid stale React state (setNewMessage is async)
      handleSend(text);
      return;
    }

    updateTypingStatus(selectedGroup.id, true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      updateTypingStatus(selectedGroup.id, false);
    }, 2000);
  };

  const onMentionSelected = (cleanName: string) => {
    const text = newMessage;
    const idx = mentionCursorIndex;
    if (idx >= 0 && idx < text.length) {
      const beforeAt = text.substring(0, idx);
      const afterQuery = text.substring(idx + 1 + mentionQuery.length);
      const newText = `${beforeAt}@${cleanName} ${afterQuery}`;
      setNewMessage(newText);
    }
    setShowMentions(false);
    setMentionQuery("");
    inputRef.current?.focus();
  };

  const handleSend = async (overrideText?: string) => {
    // overrideText bypasses stale React state for auto-send (PING)
    const textToUse = overrideText || newMessage;
    if (!selectedGroup || (!textToUse.trim() && !isSending)) return;
    try {
      setIsSending(true);
      let finalText = textToUse.trim();

      // Step 1: Wrap @mentions into @{name} format (matching mobile's sendMessage logic)
      // Sort by name length descending to avoid partial replacements
      const sortedUsers = [...allUsers].sort(
        (a, b) => (b.name || "").length - (a.name || "").length
      );

      function escapeRegExp(string: string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
      }

      for (const u of sortedUsers) {
        const uName = u.name || "";
        const uEmailPrefix = u.email ? u.email.split("@")[0] : "";

        if (uName) {
          const regex = new RegExp(
            `@${escapeRegExp(uName)}(?=[^a-zA-Z0-9_]|$)`,
            "gi"
          );
          finalText = finalText.replace(regex, `@{${uName}}`);
        }
        if (uEmailPrefix) {
          const regex = new RegExp(
            `@${escapeRegExp(uEmailPrefix)}(?=[^a-zA-Z0-9_]|$)`,
            "gi"
          );
          finalText = finalText.replace(regex, `@{${uName || uEmailPrefix}}`);
        }
      }

      // Step 2: PING detection (matches mobile regex: @name p! → @name PING!!!)
      // Mobile regex: (@[^@\n]+?)\s+[pP]!\s*$
      const pingRegex = /(@\{[^}]+\}|@[^@\n]+?)\s+[pP]!\s*$/;
      if (pingRegex.test(finalText)) {
        finalText = finalText.replace(pingRegex, "$1 PING!!!");
      }

      const metadata: any = {};
      if (replyingTo) metadata.replyTo = replyingTo.id;

      await sendMessage(selectedGroup.id, finalText, "text", metadata);
      setNewMessage("");
      setReplyingTo(null);
      setShowAttachMenu(false);
      setShowMentions(false);
      updateTypingStatus(selectedGroup.id, false);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    } catch (e) {
      console.error("Failed to send message", e);
      setToast({ message: "Gagal mengirim pesan.", type: "error" });
    } finally {
      setIsSending(false);
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedGroup || isSending) return;
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsSending(true);

      // Determine message type
      const type = file.type.startsWith("image/")
        ? "image"
        : file.type.startsWith("video/")
        ? "video"
        : "file";

      const uploadResult: any = await uploadFile(file, "berkas");
      let downloadUrl = "";
      if (uploadResult?.data?.downloadUrl)
        downloadUrl = uploadResult.data.downloadUrl;
      else if (typeof uploadResult?.data === "string")
        downloadUrl = uploadResult.data;
      else downloadUrl = uploadResult?.downloadUrl;

      if (!downloadUrl) throw new Error("Gagal mendapatkan URL dari server");

      const msgText = type === "image" ? "Gambar terkirim" : "Berkas terkirim";
      const metadata: any = {
        uri: downloadUrl,
        name: file.name,
        size: file.size,
        mimeType: file.type,
      };

      if (replyingTo) metadata.replyTo = replyingTo.id;

      await sendMessage(selectedGroup.id, msgText, type, metadata);
      setReplyingTo(null);
    } catch (error) {
      setToast({ message: "Gagal mengunggah file", type: "error" });
      console.error(error);
    } finally {
      setIsSending(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const toggleRecording = async () => {
    if (isRecordingWeb) {
      // Stop recording
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== "inactive"
      ) {
        mediaRecorderRef.current.stop();
      }
    } else {
      // Start recording
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        const recorder = new MediaRecorder(stream);
        mediaRecorderRef.current = recorder;
        audioChunksRef.current = [];
        setRecordingTime(0);

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };

        recorder.onstop = async () => {
          if (recordTimerRef.current) clearInterval(recordTimerRef.current);
          const audioBlob = new Blob(audioChunksRef.current, {
            type: "audio/webm",
          });
          stream.getTracks().forEach((track) => track.stop());

          try {
            setIsSending(true);
            const file = new File([audioBlob], `VN_${Date.now()}.webm`, {
              type: "audio/webm",
            });
            const uploadResult: any = await uploadFile(file, "speech");

            let downloadUrl = "";
            if (uploadResult?.data?.downloadUrl)
              downloadUrl = uploadResult.data.downloadUrl;
            else if (typeof uploadResult?.data === "string")
              downloadUrl = uploadResult.data;
            else downloadUrl = uploadResult?.downloadUrl;

            if (!downloadUrl) throw new Error("Gagal mendapatkan URL audio");

            const mm = Math.floor(recordingTime / 60)
              .toString()
              .padStart(2, "0");
            const ss = (recordingTime % 60).toString().padStart(2, "0");

            const metadata: any = {
              audioUrl: downloadUrl, // Must explicitly be audioUrl for mobile compatibility
              subtype: "recording",
              duration: `${mm}:${ss}`,
              amplitudes: "0.1,0.2,0.3,0.4", // Mock amplitudes for mobile renderer
              platform: "web",
            };
            if (replyingTo) metadata.replyTo = replyingTo.id;

            // Voice messages MUST be sent as custom type
            await sendMessage(
              selectedGroup!.id,
              "Mengirim Voice Note",
              "custom",
              metadata
            );
          } catch (e) {
            console.error("Audio upload error:", e);
            setToast({ message: "Gagal mengirim pesan suara", type: "error" });
          } finally {
            setIsSending(false);
            setIsRecordingWeb(false);
            setRecordingTime(0);
          }
        };

        recorder.start();
        setIsRecordingWeb(true);
        recordTimerRef.current = setInterval(() => {
          setRecordingTime((prev) => prev + 1);
        }, 1000);
      } catch (e) {
        console.error("Mic error:", e);
        setToast({ message: "Tidak ada akses microphone, pastikan izin diberikan.", type: "error" });
      }
    }
  };

  // Pin/Unpin actions (Firestore-backed)
  const handlePin = async (msg: ChatMessage) => {
    if (!selectedGroup) return;
    const userName = currentUser?.displayName || currentUser?.email || "Admin";
    await pinMessage(selectedGroup.id, msg.id, userName);
  };

  const handleUnpin = async (msg: ChatMessage) => {
    if (!selectedGroup) return;
    await unpinMessage(selectedGroup.id, msg.id);
  };

  // ─── AUTO SCROLL ─────────────────────
  useEffect(() => {
    if (messages.length > 0 && !isPinnedViewMode) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isPinnedViewMode]);

  const scrollToMessage = (msgId: string) => {
    setIsPinnedViewMode(false);
    setTimeout(() => {
      const el = document.getElementById(`msg-${msgId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.classList.add("highlight-flash");
        setTimeout(() => el.classList.remove("highlight-flash"), 2000);
      }
    }, 100);
  };

  // ─── FILTER GROUPS & SEARCH ──────────
  const filteredGroups = groups.filter((g) =>
    (g.name || g.id).toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getDateKey = (ts: Timestamp | null): string => {
    if (!ts) return "";
    try {
      return ts.toDate().toDateString();
    } catch {
      return "";
    }
  };

  // Messages to show (pinned view or search filtered)
  const displayMessages = useMemo(() => {
    if (isPinnedViewMode) return pinnedMessages;
    if (chatSearchQuery.trim()) {
      return messages.filter(
        (m) =>
          m.metadata.text
            ?.toLowerCase()
            .includes(chatSearchQuery.toLowerCase()) ||
          resolveAuthorName(m)
            .toLowerCase()
            .includes(chatSearchQuery.toLowerCase())
      );
    }
    return messages;
  }, [isPinnedViewMode, pinnedMessages, messages, chatSearchQuery, usersMap]);

  // Filtered mention users
  const filteredMentionUsers = useMemo(() => {
    if (!showMentions) return [];
    return allUsers
      .filter((u) =>
        (u.name || u.email || "")
          .toLowerCase()
          .includes(mentionQuery.toLowerCase())
      )
      .slice(0, 8);
  }, [showMentions, mentionQuery, allUsers]);

  return (
    <div className="chat-content-wrapper">
      <div className="chat-card-container">
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
                <span className="material-icons" style={{ color: "#ef4444" }}>
                  error_outline
                </span>
                <p
                  style={{
                    color: "#ef4444",
                    fontSize: 12,
                    textAlign: "center",
                    padding: "0 16px",
                  }}
                >
                  {error}
                </p>
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
                  className={`chat-item ${
                    selectedGroup?.id === group.id ? "active" : ""
                  }`}
                  onClick={() => setSelectedGroup(group)}
                >
                  <div className="avatar-box" style={{ background: "#45a5d1", overflow: "hidden" }}>
                    {group.logoUrl ? (
                      <img src={group.logoUrl} alt={group.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <span className="material-icons">groups</span>
                    )}
                  </div>
                  <div className="chat-info">
                    <div className="chat-name">{group.name || group.id}</div>
                    <div className="chat-preview">{group.lastMessage || "Belum ada pesan"}</div>
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
                  <div
                    className="avatar-circle-main"
                    style={{ background: "#45a5d1", overflow: "hidden" }}
                  >
                    {selectedGroup.logoUrl ? (
                      <img src={selectedGroup.logoUrl} alt={selectedGroup.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <span className="material-icons">groups</span>
                    )}
                  </div>
                  <div className="header-info">
                    <h3>{selectedGroup.name || selectedGroup.id}</h3>
                    <div className="status-indicators">
                      <span className="online-dot"></span>
                      <span className="online-text">{onlineCount} Online</span>
                    </div>
                  </div>
                </div>
                <div className="header-actions">
                  <button
                    className="icon-btn-ghost"
                    onClick={() => {
                      setShowChatSearch(!showChatSearch);
                      if (showChatSearch) setChatSearchQuery("");
                    }}
                    title="Cari Pesan"
                  >
                    <span className="material-icons">search</span>
                  </button>
                  <button
                    className="icon-btn-ghost"
                    onClick={() => setShowGroupInfo(!showGroupInfo)}
                    title="Info Grup"
                  >
                    <span className="material-icons">info_outline</span>
                  </button>
                </div>
              </div>

              {/* Search Bar */}
              {showChatSearch && (
                <div className="chat-search-bar">
                  <span className="material-icons">search</span>
                  <input
                    type="text"
                    placeholder="Cari pesan di chat ini..."
                    value={chatSearchQuery}
                    onChange={(e) => setChatSearchQuery(e.target.value)}
                    autoFocus
                  />
                  {chatSearchQuery && (
                    <span className="search-count">
                      {displayMessages.length} hasil
                    </span>
                  )}
                  <button
                    onClick={() => {
                      setShowChatSearch(false);
                      setChatSearchQuery("");
                    }}
                  >
                    <span className="material-icons">close</span>
                  </button>
                </div>
              )}

              {/* Pin Header Bar (like mobile) */}
              {pinnedMessages.length > 0 &&
                (() => {
                  const latestPin = pinnedMessages[0];
                  const previewText = latestPin
                    ? latestPin.type === "image"
                      ? "📷 Gambar"
                      : latestPin.type === "audio" ||
                        latestPin.metadata?.subtype === "recording"
                      ? "🎤 Rekaman Suara"
                      : latestPin.type === "file"
                      ? "📄 Berkas"
                      : latestPin.metadata?.subtype === "task" ||
                        latestPin.metadata?.subtype === "tugas"
                      ? "📋 Membagikan Tugas"
                      : latestPin.metadata?.subtype === "leave_request" ||
                        latestPin.metadata?.subtype === "izin"
                      ? "🗓️ Membagikan Izin"
                      : latestPin.metadata?.subtype === "reimbursement" ||
                        latestPin.metadata?.subtype === "reimburse"
                      ? "💰 Membagikan Reimbursement"
                      : latestPin.metadata?.subtype === "contact_share"
                      ? "👤 Membagikan Kontak"
                      : latestPin.metadata?.subtype === "profile_share"
                      ? "👤 Membagikan Profil"
                      : latestPin.metadata?.subtype
                      ? `📌 ${latestPin.metadata.subtype}`
                      : latestPin.metadata?.text ||
                        "Pesan Sematan"
                    : "";

                  return (
                    <div
                      className={`pin-header-bar ${
                        isPinnedViewMode ? "active" : ""
                      }`}
                      onClick={() => setIsPinnedViewMode(!isPinnedViewMode)}
                    >
                      <span className="material-icons pin-icon">push_pin</span>
                      <div className="pin-infos">
                        <span className="pin-label">Pin</span>
                        <span className="pin-preview">{previewText}</span>
                      </div>
                      <span className="pin-spacer"></span>
                      <span className="pin-count">{pinnedMessages.length}</span>
                      <span className="material-icons pin-arrow">
                        {isPinnedViewMode ? "close" : "keyboard_arrow_right"}
                      </span>
                    </div>
                  );
                })()}

              {/* Messages Area */}
              <div className="chat-messages">
                {isLoadingMessages ? (
                  <div className="loading-messages">
                    <span className="material-icons spin">sync</span>
                    <p>Memuat pesan...</p>
                  </div>
                ) : error ? (
                  <div className="empty-messages">
                    <span className="material-icons" style={{ color: "#ef4444" }}>error_outline</span>
                    <p style={{ color: "#ef4444" }}>{error}</p>
                    <button className="retry-btn" onClick={() => setSelectedGroup({...selectedGroup!})}>Coba Lagi</button>
                  </div>
                ) : displayMessages.length === 0 ? (
                  <div className="empty-messages">
                    <span className="material-icons">
                      {isPinnedViewMode ? "push_pin" : "chat_bubble_outline"}
                    </span>
                    <p>
                      {isPinnedViewMode
                        ? "Belum ada pesan yang di-pin"
                        : chatSearchQuery
                        ? "Tidak ada hasil pencarian"
                        : "Belum ada pesan"}
                    </p>
                  </div>
                ) : (
                  <>
                    {displayMessages.map((msg, idx) => {
                      const isMe =
                        msg.authorId === currentUser?.uid ||
                        msg.authorEmail === currentUser?.email;
                      const prevDate =
                        idx > 0
                          ? getDateKey(displayMessages[idx - 1].createdAt)
                          : "";
                      const currDate = getDateKey(msg.createdAt);
                      const showDateSep = idx === 0 || currDate !== prevDate;
                      const isPinned = msg.metadata?.isPinned === true;
                      const isRecording = msg.metadata?.subtype === "recording";
                      const audioUrl =
                        msg.metadata?.audioUrl || msg.metadata?.uri || "";
                      const audioDuration = msg.metadata?.duration || "00:00";

                      return (
                        <div
                          key={msg.id}
                          id={`msg-${msg.id}`}
                          className={`message-wrapper ${isMe ? "is-me" : ""}`}
                        >
                          {showDateSep && !isPinnedViewMode && (
                            <div className="date-separator">
                              <span>{formatDateSeparator(msg.createdAt)}</span>
                            </div>
                          )}
                          <div className="message-container">
                            <div
                              className="msg-avatar-round"
                              style={{
                                background: isMe
                                  ? "#7669fe"
                                  : getAvatarColor(msg.authorId),
                              }}
                            >
                              {getInitials(msg)}
                            </div>
                            <div className="msg-body">
                              <div className="msg-meta">
                                <span className="sender">
                                  {resolveAuthorName(msg)}
                                </span>
                                <span className="platform">
                                  {msg.metadata?.platform || "android"}
                                </span>
                                {isPinned && (
                                  <span className="material-icons pin-badge">
                                    push_pin
                                  </span>
                                )}
                              </div>

                              {/* Reply Preview */}
                              {msg.metadata?.replyTo &&
                                (() => {
                                  const replyData = msg.metadata.replyTo;
                                  let r: ChatMessage | undefined;
                                  let embeddedText: string | null = null;
                                  let embeddedAuthor: string | null = null;
                                  if (typeof replyData === "string") {
                                    r = messages.find(
                                      (m) => m.id === replyData
                                    );
                                  } else if (
                                    replyData &&
                                    typeof replyData === "object"
                                  ) {
                                    r = messages.find(
                                      (m) =>
                                        m.id === (replyData.id || replyData.uid)
                                    );
                                    embeddedText =
                                      replyData.text ||
                                      replyData.message ||
                                      null;
                                    embeddedAuthor =
                                      replyData.authorName ||
                                      replyData.author ||
                                      null;
                                  }
                                  const displayName = r
                                    ? resolveAuthorName(r)
                                    : embeddedAuthor || "Pesan Asli";
                                  const displayText = r
                                    ? r.metadata.text || ""
                                    : embeddedText || "...";
                                  return (
                                    <div
                                      className="reply-preview"
                                      onClick={() => r && scrollToMessage(r.id)}
                                    >
                                      <div className="reply-indicator">
                                        <span className="material-icons">
                                          reply
                                        </span>
                                        <strong>{displayName}</strong>
                                      </div>
                                      <p>{displayText}</p>
                                    </div>
                                  );
                                })()}

                              {/* Bubble Content */}
                              <div className="bubble">
                                {msg.type === "image" ? (
                                  <img
                                    src={msg.metadata.uri || "/berkas-bg.png"}
                                    alt="attachment"
                                    className="msg-img"
                                    onClick={() => handleSpecialCardClick(msg)}
                                    style={{ cursor: "pointer" }}
                                  />
                                ) : isRecording || msg.type === "audio" ? (
                                  /* Waveform custom styled HTML player */
                                  <CustomVoiceMessage
                                    audioUrl={audioUrl}
                                    durationText={audioDuration}
                                    isMe={isMe}
                                  />
                                ) : msg.metadata?.subtype === "task" ||
                                  msg.metadata?.subtype === "tugas" ||
                                  msg.metadata?.subtype === "leave_request" ||
                                  msg.metadata?.subtype === "izin" ||
                                  msg.metadata?.subtype === "reimbursement" ||
                                  msg.metadata?.subtype === "reimburse" ||
                                  msg.metadata?.subtype === "contact_share" ||
                                  msg.metadata?.subtype === "profile_share" ? (
                                  /* Special card - matches mobile _ChatBubbleSpecial layout exactly */
                                  <div className="special-card" onClick={() => handleSpecialCardClick(msg)} style={{ cursor: "pointer" }}>
                                    <div className="special-card-inner">
                                      <span className="material-icons special-icon-sm">
                                        {msg.metadata.subtype === "task" ||
                                        msg.metadata.subtype === "tugas"
                                          ? "check_circle_outline"
                                          : msg.metadata.subtype ===
                                              "leave_request" ||
                                            msg.metadata.subtype === "izin"
                                          ? "work_history"
                                          : msg.metadata.subtype ===
                                              "reimbursement" ||
                                            msg.metadata.subtype === "reimburse"
                                          ? "receipt_long"
                                          : msg.metadata.subtype ===
                                            "contact_share"
                                          ? "person_pin_circle"
                                          : msg.metadata.subtype ===
                                            "profile_share"
                                          ? "person"
                                          : "description"}
                                      </span>
                                      <div className="special-text">
                                        {msg.metadata.subtype === "task" ||
                                        msg.metadata.subtype === "tugas"
                                          ? "Membagikan tugas"
                                          : msg.metadata.subtype ===
                                              "leave_request" ||
                                            msg.metadata.subtype === "izin"
                                          ? "Membagikan izin"
                                          : msg.metadata.subtype ===
                                              "reimbursement" ||
                                            msg.metadata.subtype === "reimburse"
                                          ? "Membagikan Reimbursement"
                                          : msg.metadata.subtype ===
                                            "contact_share"
                                          ? "Membagikan kontak"
                                          : msg.metadata.subtype ===
                                            "profile_share"
                                          ? "Membagikan Profil"
                                          : `Membagikan ${msg.metadata.subtype}`}
                                      </div>
                                      <span className="material-icons special-arrow">
                                        keyboard_arrow_right
                                      </span>
                                    </div>
                                  </div>
                                ) : msg.type === "file" ||
                                  msg.type === "custom" ? (
                                  /* Generic file card */
                                  <div className="special-card" onClick={() => handleSpecialCardClick(msg)} style={{ cursor: "pointer" }}>
                                    <div className="special-card-inner">
                                      <div className="special-icon-file">
                                        <span className="material-icons">
                                          description
                                        </span>
                                      </div>
                                      <div className="special-text">
                                        {msg.metadata.name || "Berkas"}
                                      </div>
                                      <span className="material-icons special-arrow">
                                        keyboard_arrow_right
                                      </span>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-content">
                                    {renderMessageText(msg.metadata.text || "")}
                                  </div>
                                )}
                              </div>
                              <span className="under-time">
                                {formatTimestamp(msg.createdAt)}
                              </span>
                            </div>
                          </div>

                          {/* Hover Actions */}
                          <div className="msg-hover-actions">
                            <button
                              onClick={() => setReplyingTo(msg)}
                              title="Balas"
                            >
                              <span className="material-icons">reply</span>
                            </button>
                            <button
                              onClick={() =>
                                isPinned ? handleUnpin(msg) : handlePin(msg)
                              }
                              title={isPinned ? "Lepas Pin" : "Pin"}
                              style={{ position: "relative" }}
                            >
                              <span
                                className="material-icons"
                                style={isPinned ? { color: "#cf2121" } : {}}
                              >
                                push_pin
                              </span>
                              {isPinned && (
                                <span
                                  style={{
                                    position: "absolute",
                                    top: "50%",
                                    left: "50%",
                                    width: "20px",
                                    height: "2.5px",
                                    background: "#cf2121",
                                    transform:
                                      "translate(-50%, -50%) rotate(-45deg)",
                                    borderRadius: "2px",
                                    border: "1px solid #fff",
                                    pointerEvents: "none",
                                  }}
                                ></span>
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* BANNERS area */}
              <div className="actions-banners">
                {typists.length > 0 && (
                  <div className="typing-info">
                    {typists.join(", ")} sedang mengetik...
                  </div>
                )}
                {replyingTo && (
                  <div className="reply-context-banner">
                    <div className="context-text">
                      <strong>
                        Membalas ke {resolveAuthorName(replyingTo)}
                      </strong>
                      <p>{replyingTo.metadata.text}</p>
                    </div>
                    <button
                      onClick={() => setReplyingTo(null)}
                      className="close-context"
                    >
                      <span className="material-icons">close</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Mention Suggestion */}
              {showMentions && filteredMentionUsers.length > 0 && (
                <div className="mention-popup">
                  {filteredMentionUsers.map((u) => (
                    <div
                      key={u.userId || u.email}
                      className="mention-item"
                      onClick={() => onMentionSelected(u.name || u.email || "")}
                    >
                      <div
                        className="mention-avatar"
                        style={{
                          background: getAvatarColor(u.name || u.email || ""),
                        }}
                      >
                        {(u.name || u.email || "?")
                          .substring(0, 1)
                          .toUpperCase()}
                      </div>
                      <div className="mention-info">
                        <span className="mention-name">
                          {u.name || "Unknown"}
                        </span>
                        {u.email && (
                          <span className="mention-email">{u.email}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* CHAT FOOTER */}
              <div className="chat-footer">
                <button
                  className="attach-trigger"
                  onClick={() => fileInputRef.current?.click()}
                  title="Tambah Berkas"
                >
                  <span className="material-icons">attach_file</span>
                </button>
                <button
                  className={`attach-trigger ${
                    isRecordingWeb ? "recording" : ""
                  }`}
                  onClick={toggleRecording}
                  title={isRecordingWeb ? "Stop Rekaman" : "Mulai Rekaman"}
                >
                  <span
                    className="material-icons"
                    style={{ color: isRecordingWeb ? "#ef4444" : "" }}
                  >
                    mic
                  </span>
                </button>
                <button
                  className="attach-trigger ping-btn"
                  onClick={() => handleSend("PING!!!")}
                  title="Kirim PING"
                >
                  <span
                    className="material-icons"
                    style={{ color: "#ef4444" }}
                  >
                    campaign
                  </span>
                </button>

                {/* Hidden file input matched to button */}
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: "none" }}
                  onChange={handleFileUpload}
                />
                <div className="input-box">
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="Ketik pesan disini... (@ untuk tag)"
                    value={newMessage}
                    onChange={(e) => handleTyping(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        // Always allow send if PING pattern detected, even with mentions open
                        const isPingPattern = /@[^@\n]+\s+[pP]!\s*$/.test(
                          newMessage
                        );
                        if (!showMentions || isPingPattern) {
                          e.preventDefault();
                          handleSend();
                        }
                      }
                    }}
                  />
                </div>
                <button
                  className="send-trigger"
                  onClick={() => handleSend()}
                  disabled={!newMessage.trim() && !isSending}
                >
                  <span className="material-icons">
                    {isSending ? "sync" : "send"}
                  </span>
                </button>
              </div>
            </>
          ) : (
            <div className="no-chat">
              <span className="material-icons">forum</span>
              <p>Pilih chat untuk memulai</p>
            </div>
          )}
        </div>

        {/* Group Info Sidebar */}
        {showGroupInfo && selectedGroup && (
          <div className="group-info-panel">
            <div className="gip-header">
              <h3>Info Grup</h3>
              <button onClick={() => setShowGroupInfo(false)}>
                <span className="material-icons">close</span>
              </button>
            </div>
            <div className="gip-body">
              <div className="gip-avatar" style={{ background: "#45a5d1", overflow: "hidden" }}>
                {selectedGroup.logoUrl ? (
                  <img src={selectedGroup.logoUrl} alt={selectedGroup.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <span className="material-icons">groups</span>
                )}
              </div>
              <h4>{selectedGroup.name || selectedGroup.id}</h4>
              <p className="gip-id">ID: {selectedGroup.id}</p>

              <div className="gip-section">
                <h5>
                  <span className="material-icons">people</span> Anggota (
                  {allUsers.length})
                </h5>
                <div className="gip-members">
                  {allUsers.slice(0, 20).map((u) => (
                    <div key={u.userId || u.email} className="gip-member">
                      <div
                        className="gip-member-avatar"
                        style={{
                          background: getAvatarColor(u.name || u.email || ""),
                        }}
                      >
                        {(u.name || u.email || "?")
                          .substring(0, 1)
                          .toUpperCase()}
                      </div>
                      <div>
                        <span className="gip-member-name">
                          {u.name || "Unknown"}
                        </span>
                        {u.email && (
                          <span className="gip-member-email">{u.email}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="gip-section">
                <h5>
                  <span className="material-icons">push_pin</span> Pinned (
                  {pinnedMessages.length})
                </h5>
                {pinnedMessages.map((pm) => (
                  <div
                    key={pm.id}
                    className="gip-pin-card"
                    onClick={() => {
                      scrollToMessage(pm.id);
                      setShowGroupInfo(false);
                    }}
                  >
                    <strong>{resolveAuthorName(pm)}</strong>
                    <p>{pm.metadata.text?.substring(0, 60)}...</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .chat-content-wrapper {
          display: flex;
          flex-direction: column;
          height: calc(100vh - 64px);
        }
        .chat-card-container {
          flex: 1;
          display: flex;
          background: white;
          overflow: hidden;
          border-top: 1px solid #f1f5f9;
        }

        /* Sidebar */
        .chat-sidebar {
          width: 300px;
          border-right: 1px solid #f1f5f9;
          display: flex;
          flex-direction: column;
          background: #fff;
          flex-shrink: 0;
        }
        .sidebar-header {
          padding: 20px;
          border-bottom: 1px solid #f1f5f9;
        }
        .search-box {
          background: #f8fafc;
          border: 1px solid #eef2f6;
          border-radius: 10px;
          padding: 8px 12px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .search-box input {
          border: none;
          background: none;
          outline: none;
          flex: 1;
          font-size: 13px;
        }
        .search-box .material-icons {
          font-size: 18px;
          color: #94a3b8;
        }
        .chat-list {
          flex: 1;
          overflow-y: auto;
        }
        .chat-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px 20px;
          cursor: pointer;
          transition: all 0.2s;
          border-left: 3px solid transparent;
        }
        .chat-item:hover {
          background: #f8fafc;
        }
        .chat-item.active {
          background: #f0f9ff;
          border-left-color: #3b82f6;
        }
        .avatar-box {
          width: 40px;
          height: 40px;
          border-radius: 8px;
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
          font-weight: 700;
          color: #1e293b;
          font-size: 14px;
          margin-bottom: 2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .chat-preview {
          font-size: 12px;
          color: #94a3b8;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .empty-groups,
        .loading-groups {
          padding: 40px 20px;
          text-align: center;
          color: #94a3b8;
        }

        /* Main */
        .chat-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          background: #fff;
          min-width: 0;
        }
        .chat-header {
          padding: 14px 24px;
          border-bottom: 1px solid #f1f5f9;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-shrink: 0;
        }
        .header-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .avatar-circle-main {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          flex-shrink: 0;
        }
        .header-info h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 800;
          color: #1e293b;
        }
        .status-indicators {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
        }
        .online-dot {
          width: 8px;
          height: 8px;
          background: #10b981;
          border-radius: 50%;
        }
        .online-text {
          color: #64748b;
        }
        .header-actions {
          display: flex;
          gap: 8px;
        }
        .icon-btn-ghost {
          background: #f8fafc;
          border: none;
          width: 36px;
          height: 36px;
          border-radius: 8px;
          color: #64748b;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: 0.2s;
        }
        .icon-btn-ghost:hover {
          background: #e2e8f0;
          color: #1e293b;
        }

        /* Chat Search Bar */
        .chat-search-bar {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 24px;
          background: #f8fafc;
          border-bottom: 1px solid #f1f5f9;
          animation: slideDown 0.2s ease-out;
          flex-shrink: 0;
        }
        .chat-search-bar input {
          flex: 1;
          border: none;
          background: none;
          outline: none;
          font-size: 14px;
        }
        .chat-search-bar .material-icons {
          font-size: 20px;
          color: #94a3b8;
        }
        .chat-search-bar button {
          background: none;
          border: none;
          cursor: pointer;
          color: #94a3b8;
          padding: 4px;
          border-radius: 4px;
        }
        .chat-search-bar button:hover {
          color: #ef4444;
        }
        .search-count {
          font-size: 12px;
          color: #3b82f6;
          font-weight: 600;
          white-space: nowrap;
        }
        @keyframes slideDown {
          from {
            transform: translateY(-10px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        /* PIN HEADER BAR (matches mobile exactly) */
        .pin-header-bar {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 20px;
          background: #fff;
          border-bottom: 1px solid #f1f5f9;
          cursor: pointer;
          transition: all 0.2s;
          flex-shrink: 0;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
        }
        .pin-header-bar:hover {
          background: #f8fafc;
        }
        .pin-header-bar.active {
          background: #f2f2f7;
        }
        .pin-icon {
          font-size: 18px;
          color: #1e293b;
          transform: rotate(30deg);
          flex-shrink: 0;
        }
        .pin-infos {
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .pin-label {
          font-size: 14px;
          font-weight: 700;
          color: #1e293b;
          line-height: 1.2;
        }
        .pin-preview {
          font-size: 13px;
          color: #64748b;
          margin-top: 2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 400px;
        }
        .pin-spacer {
          flex: 1;
        }
        .pin-count {
          font-size: 14px;
          font-weight: 700;
          color: #94a3b8;
        }
        .pin-arrow {
          font-size: 22px;
          color: #1e293b;
        }

        /* Messages */
        .chat-messages {
          flex: 1;
          padding: 24px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 20px;
          background: #fafafa;
        }
        .message-wrapper {
          display: flex;
          flex-direction: column;
          position: relative;
        }
        .message-container {
          display: flex;
          gap: 12px;
          align-items: flex-start;
        }
        .msg-avatar-round {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 11px;
          font-weight: 700;
          flex-shrink: 0;
          margin-top: 22px;
        }
        .msg-body {
          max-width: 70%;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .msg-meta {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .sender {
          font-size: 13px;
          font-weight: 700;
          color: #1e293b;
        }
        .platform {
          font-size: 10px;
          background: #e2e8f0;
          color: #475569;
          padding: 1px 6px;
          border-radius: 4px;
          font-weight: 600;
        }
        .pin-badge {
          font-size: 14px;
          color: #f59e0b;
          transform: rotate(30deg);
        }

        .bubble {
          padding: 10px 16px;
          border-radius: 12px;
          border-bottom-left-radius: 2px;
          background: #fff;
          border: 1px solid #f1f5f9;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
          color: #334155;
          line-height: 1.6;
          font-size: 14px;
        }
        .is-me .bubble {
          background: #7669fe;
          color: white;
          border: none;
          border-bottom-left-radius: 12px;
          border-bottom-right-radius: 2px;
        }
        .is-me .bubble .text-content {
          color: white;
        }
        .is-me .sender {
          color: #1e293b;
        }
        .is-me .msg-avatar-round {
          background: #7669fe !important;
        }
        .under-time {
          font-size: 11px;
          color: #94a3b8;
          margin-top: 2px;
        }

        /* PING!!! Styling */
        .ping-text {
          color: #ef4444;
          font-weight: 900;
          font-size: 16px;
          letter-spacing: 0.5px;
          animation: pingPulse 0.5s ease-out;
        }
        .hl-mention {
          color: #7c3aed;
          font-weight: 700;
        }
        .is-me .ping-text {
          color: #fca5a5;
        }
        @keyframes pingPulse {
          0% {
            transform: scale(1.3);
          }
          100% {
            transform: scale(1);
          }
        }

        /* Special Card (matches mobile _ChatBubbleSpecial: purple inner card inside bubble) */
        .special-card {
          min-width: 260px;
        }
        .special-card-inner {
          display: flex;
          align-items: center;
          gap: 12px;
          background: linear-gradient(135deg, #7c3aed, #6366f1);
          border-radius: 12px;
          padding: 14px 16px;
          color: white;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 2px 8px rgba(99, 102, 241, 0.25);
        }
        .special-card-inner:hover {
          box-shadow: 0 4px 16px rgba(99, 102, 241, 0.4);
          transform: translateY(-1px);
        }
        .special-icon-circle {
          width: 32px;
          height: 32px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .special-icon-circle .material-icons {
          color: white;
          font-size: 18px;
        }
        .special-icon-sm {
          color: white;
          font-size: 20px;
          flex-shrink: 0;
        }
        .special-icon-file {
          width: 36px;
          height: 36px;
          background: white;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .special-icon-file .material-icons {
          color: #7c3aed;
          font-size: 20px;
        }
        .special-text {
          flex: 1;
          font-size: 14px;
          font-weight: 600;
          color: white;
        }
        .special-arrow {
          color: white;
          font-size: 24px;
          flex-shrink: 0;
        }
        .special-play {
          color: white;
          font-size: 28px;
          flex-shrink: 0;
        }

        /* Highlight Animation */
        .highlight-flash {
          animation: flashBg 2s ease-out;
          border-radius: 12px;
        }
        @keyframes flashBg {
          0% {
            background-color: transparent;
          }
          20% {
            background-color: rgba(59, 130, 246, 0.15);
            box-shadow: 0 0 15px rgba(59, 130, 246, 0.2);
          }
          100% {
            background-color: transparent;
          }
        }

        .date-separator {
          text-align: center;
          margin: 10px 0;
        }
        .date-separator span {
          background: #f1f5f9;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 11px;
          color: #64748b;
          font-weight: 600;
        }

        /* Reply Preview */
        .reply-preview {
          background: rgba(241, 245, 249, 0.8);
          border-left: 4px solid #3b82f6;
          padding: 8px 12px;
          border-radius: 8px;
          margin-bottom: 4px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .reply-preview:hover {
          background: #f1f5f9;
        }
        .reply-indicator {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 2px;
        }
        .reply-indicator .material-icons {
          font-size: 14px;
          color: #3b82f6;
          transform: scaleX(-1);
        }
        .reply-indicator strong {
          font-size: 11px;
          color: #1e293b;
          font-weight: 800;
        }
        .reply-preview p {
          margin: 0;
          font-size: 12px;
          color: #64748b;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .msg-img {
          max-width: 280px;
          border-radius: 8px;
        }

        /* Banners */
        .actions-banners {
          background: #fff;
          flex-shrink: 0;
        }
        .typing-info {
          padding: 6px 24px;
          font-size: 11px;
          color: #94a3b8;
          font-style: italic;
        }
        .reply-context-banner {
          padding: 10px 24px;
          background: #f8fafc;
          border-top: 1px solid #f1f5f9;
          display: flex;
          justify-content: space-between;
          align-items: center;
          animation: slideUp 0.3s ease-out;
        }
        @keyframes slideUp {
          from {
            transform: translateY(10px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .context-text strong {
          display: block;
          font-size: 12px;
          color: #1e293b;
        }
        .context-text p {
          margin: 0;
          font-size: 12px;
          color: #64748b;
        }
        .close-context {
          background: none;
          border: none;
          cursor: pointer;
          color: #94a3b8;
          padding: 4px;
          border-radius: 50%;
        }
        .close-context:hover {
          background: #fee2e2;
          color: #ef4444;
        }

        /* Mention Popup */
        .mention-popup {
          position: relative;
          background: white;
          border-top: 1px solid #f1f5f9;
          padding: 8px 16px;
          display: flex;
          gap: 10px;
          overflow-x: auto;
          animation: slideUp 0.2s ease-out;
          flex-shrink: 0;
        }
        .mention-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 14px;
          border-radius: 10px;
          cursor: pointer;
          transition: 0.2s;
          white-space: nowrap;
          border: 1px solid #f1f5f9;
        }
        .mention-item:hover {
          background: #f0f9ff;
          border-color: #3b82f6;
        }
        .mention-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 13px;
          font-weight: 700;
          flex-shrink: 0;
        }
        .mention-info {
          display: flex;
          flex-direction: column;
        }
        .mention-name {
          font-size: 13px;
          font-weight: 700;
          color: #1e293b;
        }
        .mention-email {
          font-size: 11px;
          color: #94a3b8;
        }

        /* Footer */
        .chat-footer {
          padding: 14px 24px;
          display: flex;
          align-items: center;
          gap: 16px;
          background: #fff;
          border-top: 1px solid #f1f5f9;
          position: relative;
          flex-shrink: 0;
        }
        .input-box {
          flex: 1;
        }
        .input-box input {
          width: 100%;
          padding: 14px 20px;
          border: 1px solid #f1f5f9;
          border-radius: 20px;
          outline: none;
          background: #f9fafb;
          font-size: 14px;
          transition: border-color 0.2s;
        }
        .input-box input:focus {
          border-color: #3b82f6;
          background: white;
        }
        .attach-trigger {
          color: #94a3b8;
          background: none;
          border: none;
          cursor: pointer;
          transition: color 0.2s;
        }
        .attach-trigger:hover {
          color: #3b82f6;
        }
        .send-trigger {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          border: none;
          background: #10b981;
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          flex-shrink: 0;
        }
        .send-trigger:not(:disabled):hover {
          background: #059669;
          transform: scale(1.05);
        }
        .send-trigger:disabled {
          background: #f1f5f9;
          color: #94a3b8;
          cursor: not-allowed;
        }
        .attach-trigger.recording {
          animation: pulseRed 1.5s infinite;
          background: #fee2e2;
          border-radius: 50%;
        }
        @keyframes pulseRed {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
          }
        }

        .attach-popover {
          position: absolute;
          bottom: 70px;
          left: 24px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.12);
          padding: 8px;
          display: flex;
          flex-direction: column;
          z-index: 50;
          border: 1px solid #f1f5f9;
        }
        .attach-popover button {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 16px;
          background: none;
          border: none;
          cursor: pointer;
          border-radius: 8px;
          font-size: 13px;
          color: #475569;
          text-align: left;
        }
        .attach-popover button:hover {
          background: #f0f9ff;
          color: #3b82f6;
        }

        .msg-hover-actions {
          display: none;
          position: absolute;
          top: 0;
          right: 0;
          background: white;
          border: 1px solid #f1f5f9;
          border-radius: 8px;
          padding: 4px;
          gap: 4px;
          z-index: 10;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }
        .message-wrapper:hover .msg-hover-actions {
          display: flex;
        }
        .msg-hover-actions button {
          background: none;
          border: none;
          cursor: pointer;
          color: #94a3b8;
          padding: 4px;
          border-radius: 4px;
        }
        .msg-hover-actions button:hover {
          background: #f1f5f9;
          color: #3b82f6;
        }

        .no-chat {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: #94a3b8;
          gap: 8px;
        }
        .no-chat .material-icons {
          font-size: 48px;
        }
        .loading-messages,
        .empty-messages {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: #94a3b8;
          gap: 8px;
        }
        .loading-messages .material-icons,
        .empty-messages .material-icons {
          font-size: 40px;
        }

        /* Group Info Panel */
        .group-info-panel {
          width: 320px;
          border-left: 1px solid #f1f5f9;
          background: #fff;
          display: flex;
          flex-direction: column;
          flex-shrink: 0;
          animation: slideRight 0.3s ease-out;
          overflow-y: auto;
        }
        @keyframes slideRight {
          from {
            transform: translateX(20px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .gip-header {
          padding: 16px 20px;
          border-bottom: 1px solid #f1f5f9;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .gip-header h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 800;
        }
        .gip-header button {
          background: none;
          border: none;
          cursor: pointer;
          color: #94a3b8;
        }
        .gip-body {
          padding: 20px;
        }
        .gip-avatar {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          margin: 0 auto 12px;
        }
        .gip-avatar .material-icons {
          font-size: 32px;
        }
        .gip-body h4 {
          text-align: center;
          margin: 0 0 4px;
          font-size: 18px;
          font-weight: 800;
        }
        .gip-id {
          text-align: center;
          font-size: 12px;
          color: #94a3b8;
          margin: 0 0 20px;
        }
        .gip-section {
          margin-bottom: 20px;
        }
        .gip-section h5 {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 700;
          color: #64748b;
          margin: 0 0 12px;
        }
        .gip-section h5 .material-icons {
          font-size: 18px;
        }
        .gip-members {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .gip-member {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 6px 0;
        }
        .gip-member-avatar {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 11px;
          font-weight: 700;
          flex-shrink: 0;
        }
        .gip-member-name {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: #1e293b;
        }
        .gip-member-email {
          display: block;
          font-size: 11px;
          color: #94a3b8;
        }
        .gip-pin-card {
          padding: 10px;
          border: 1px solid #f1f5f9;
          border-radius: 8px;
          margin-bottom: 8px;
          cursor: pointer;
          transition: 0.2s;
        }
        .gip-pin-card:hover {
          background: #f0f9ff;
          border-color: #3b82f6;
        }
        .gip-pin-card strong {
          font-size: 12px;
          color: #1e293b;
        }
        .gip-pin-card p {
          margin: 2px 0 0;
          font-size: 11px;
          color: #64748b;
        }

        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          0% {
        {toast && (<Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />)}
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
