import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  getDocs, 
  getDoc,
  doc,
  Timestamp,
  updateDoc,
  deleteField,
  limit,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getUserData } from "@/lib/auth";
import { getUserProfile } from "@/services/profileService";

// ─── INTERFACES ──────────────────────────────

export interface ChatGroup {
  id: string;
  name?: string;
  logoUrl?: string;
  [key: string]: any;
}

export interface ChatMessage {
  id: string;
  authorId: string;
  authorName?: string;
  authorEmail?: string;
  type: string;
  createdAt: Timestamp | null;
  metadata: {
    platform: string;
    text?: string;
    subtype?: string;
    name?: string;
    size?: number;
    uri?: string;
    mimeType?: string;
    [key: string]: any;
  };
}

// ─── 1. WAIT FOR AUTH UTILITY ────────────────
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

export function waitForAuth(timeoutMs = 5000): Promise<void> {
  return new Promise((resolve, reject) => {
    if (auth.currentUser) return resolve();
    
    const timeout = setTimeout(() => {
      unsubscribe();
      reject(new Error("Auth initialization timed out. Firestore rules might deny access."));
    }, timeoutMs);

    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        clearTimeout(timeout);
        unsubscribe();
        if (user) resolve();
        else reject(new Error("Firebase Auth user is not signed in."));
      },
      (error) => {
        clearTimeout(timeout);
        unsubscribe();
        reject(error);
      }
    );
  });
}

// ─── 2. GET ALL GROUPS ──────────────────────
export async function getGroups(): Promise<ChatGroup[]> {
  const user = getUserData();
  
  let extCompanyId = "";
  let companyTitle = "Pesan & Diskusi";
  let companyLogo = "";

  if (user && user.email) {
    try {
      // Import on demand to avoid circular deps if any
      const { getCompanyProfile } = await import("@/services/profileService");
      const profile = await getCompanyProfile();
      
      if (profile && profile.idPerusahaan) {
        extCompanyId = profile.idPerusahaan;
        if (profile.namaPerusahaan) companyTitle = profile.namaPerusahaan;
        if (profile.logoUrl) companyLogo = profile.logoUrl;
      }
    } catch (e) {
      console.error("Chat: Failed to fetch group/company info:", e);
    }
  }

  // Fallback to CTD96L
  const companyId = extCompanyId || user?.companyId || user?.idPerusahaan || "CTD96L";

  // Fetch last message for preview
  let lastMessage = "";
  try {
    const q = query(
      collection(db, "companies", companyId, "messages"),
      orderBy("createdAt", "desc"),
      limit(1)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      const data = snap.docs[0].data();
      lastMessage = data.text || data.metadata?.text || data.message || "...";
    }
  } catch (e) {
    console.error("ChatService: Error fetching last message:", e);
  }

  return [{
    id: companyId,
    name: companyTitle,
    logoUrl: companyLogo,
    lastMessage: lastMessage
  }];
}

// ─── 2. SUBSCRIBE TO MESSAGES (REALTIME) ─────
export function subscribeMessages(
  groupId: string,
  callback: (messages: ChatMessage[], error?: any) => void
): () => void {
  const q = query(
    collection(db, "companies", groupId, "messages"),
    orderBy("createdAt", "asc")
  );

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const messages: ChatMessage[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        const topType = data.type || data.metadata?.type || "text";
        return {
          id: doc.id,
          authorId: data.authorId || data.senderId || "",
          authorName: data.authorName || "",
          authorEmail: data.authorEmail || "",
          type: topType,
          createdAt: data.createdAt || data.timestamp || null,
          metadata: {
            platform: data.platform || data.metadata?.platform || "",
            text: data.text || data.message || data.metadata?.text || "",
            subtype: data.subtype || data.metadata?.subtype || "",
            name: data.name || data.metadata?.name || "",
            size: data.size || data.metadata?.size || 0,
            uri: data.uri || data.imageUrl || data.image_url || data.fileUrl || data.downloadUrl || data.url || data.content?.imageUrl || data.content?.image_url || data.metadata?.uri || data.metadata?.imageUrl || data.metadata?.url || data.metadata?.downloadUrl || "",
            mimeType: data.mimeType || data.metadata?.mimeType || "",
            replyTo: data.replyTo || data.reply_to || data.replyToMessageId || data.parentMessageId || data.reply_to_message || 
                     data.metadata?.replyTo || data.metadata?.reply_to || data.metadata?.parent_id || data.metadata?.reply_id || null,
            isPinned: data.metadata?.isPinned || data.isPinned || false,
          },
        };
      });
      callback(messages);
    },
    (error) => {
      console.error("Error subscribing to messages:", error);
      // Pass error back so UI can stop the loading spinner
      callback([], error);
    }
  );

  return unsubscribe;
}

// ─── 3. SEND MESSAGE ────────────────────────────────
import { addDoc, serverTimestamp, setDoc } from "firebase/firestore";

export async function sendMessage(
  companyId: string,
  text: string,
  type: "text" | "file" | "custom" | "image" | "video" = "text",
  metadata: Record<string, any> = {}
): Promise<void> {
  const user = getUserData();
  if (!user || !user.email) throw new Error("User not found");
  
  const safeId = user.email.replace(/\./g, "_").replace(/@/g, "_");
  const authorId = user.userId || user.uid || user.id || safeId;

  const payload: Record<string, any> = {
    authorId: authorId,
    authorName: user.name || user.email,
    authorEmail: user.email,
    text: text,
    type: type,
    createdAt: serverTimestamp(),
    metadata: {
      ...metadata,
      platform: "web",
    },
  };

  if (type === "file" || type === "image" || type === "video") {
    if (metadata.uri) payload.uri = metadata.uri;
    if (metadata.name) payload.name = metadata.name;
    if (metadata.size) payload.size = metadata.size;
    if (metadata.mimeType) payload.mimeType = metadata.mimeType;
  }

  await addDoc(collection(db, "companies", companyId, "messages"), payload);
}

// ─── 4. TYPING STATUS ───────────────────────────────
export async function updateTypingStatus(
  companyId: string,
  typing: boolean
): Promise<void> {
  const user = getUserData();
  if (!user || !user.email) return;
  const safeId = user.email.replace(/\./g, "_").replace(/@/g, "_");

  const authorId = user.userId || user.uid || user.id || safeId;
  const docRef = doc(db, "companies", companyId, "typing_status", authorId);
  if (typing) {
    await setDoc(docRef, {
      isTyping: true,
      userName: user.name || user.email,
      photoUrl: user.avatarUrl || user.photoUrl || "",
      updatedAt: serverTimestamp(),
    });
  } else {
    const { deleteDoc } = await import("firebase/firestore");
    try {
      await deleteDoc(docRef);
    } catch(e) {}
  }
}

export function subscribeTypingStatus(
  companyId: string,
  callback: (typists: string[]) => void
): () => void {
  const q = query(
    collection(db, "companies", companyId, "typing_status"),
    where("isTyping", "==", true)
  );
  return onSnapshot(q, (snap) => {
    const user = getUserData();
    const safeId = user?.email?.replace(/\./g, "_").replace(/@/g, "_");
    const authorId = user?.userId || user?.uid || user?.id || safeId;
    
    const now = new Date();
    const typists: string[] = [];
    snap.docs.forEach((d) => {
      if (d.id === authorId) return; // skip self
      const data = d.data();
      // Filter stale typing status (older than 10 seconds)
      if (data.updatedAt) {
        const updatedAt = data.updatedAt.toDate?.() || new Date(data.updatedAt);
        const diffSeconds = (now.getTime() - updatedAt.getTime()) / 1000;
        if (diffSeconds > 10) return; // stale, skip
      }
      typists.push(data.userName || data.name || d.id);
    });
    callback(typists);
  }, (e) => console.warn("Typing status rule restriction:", e.message));
}

// ─── 5. ONLINE USERS ────────────────────────────────
export async function updateOnlineStatus(
  companyId: string,
  isOnline: boolean
): Promise<void> {
  const user = getUserData();
  if (!user || !user.email) return;
  const safeId = user.email.replace(/\./g, "_").replace(/@/g, "_");

  const authorId = user.userId || user.uid || user.id || safeId;
  const docRef = doc(db, "companies", companyId, "online_users", authorId);
  if (isOnline) {
    await setDoc(docRef, {
      userId: authorId,
      userName: user.name || user.email,
      lastSeen: serverTimestamp(),
      isOnline: true,
    });
  } else {
    const { deleteDoc } = await import("firebase/firestore");
    try {
      await deleteDoc(docRef);
    } catch(e) {}
  }
}

export function subscribeOnlineUsers(
  companyId: string,
  callback: (onlineCount: number, onlineList: string[]) => void
): () => void {
  const q = query(
    collection(db, "companies", companyId, "online_users"),
    where("isOnline", "==", true)
  );
  return onSnapshot(q, (snap) => {
    let count = 0;
    const onlineList: string[] = [];
    const now = new Date();
    snap.docs.forEach((doc) => {
      const data = doc.data();
      if (data.isOnline) {
        if (data.lastSeen) {
          const lastSeen = data.lastSeen.toDate?.() || new Date(data.lastSeen);
          const diffMinutes = (now.getTime() - lastSeen.getTime()) / 60000;
          if (diffMinutes < 1.5) {
            count++;
            onlineList.push(data.userName || "Unknown");
          }
        } else {
          count++;
          onlineList.push(data.userName || "Unknown");
        }
      }
    });
    callback(count, onlineList);
  }, (e) => console.warn("Online users rule restriction:", e.message));
}

// ─── 6. PINNED MESSAGES ──────────────────────────────
export async function pinMessage(groupId: string, messageId: string, authorName: string): Promise<void> {
  const docRef = doc(db, "companies", groupId, "messages", messageId);
  await updateDoc(docRef, {
    "metadata.isPinned": true,
    "metadata.pinnedBy": authorName,
    "metadata.pinnedAt": serverTimestamp(),
  });
}

export async function unpinMessage(groupId: string, messageId: string): Promise<void> {
  const docRef = doc(db, "companies", groupId, "messages", messageId);
  await updateDoc(docRef, {
    "metadata.isPinned": deleteField(),
    "metadata.pinnedBy": deleteField(),
    "metadata.pinnedAt": deleteField(),
  });
}

export function subscribePinnedMessages(
  groupId: string,
  callback: (messages: ChatMessage[]) => void
): () => void {
  const q = query(
    collection(db, "companies", groupId, "messages"),
    where("metadata.isPinned", "==", true)
  );

  return onSnapshot(q, (snapshot) => {
    const messages: ChatMessage[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      const topType = data.type || data.metadata?.type || "text";
      return {
        id: doc.id,
        authorId: data.authorId || "",
        authorName: data.authorName || "",
        authorEmail: data.authorEmail || "",
        type: topType,
        createdAt: data.createdAt || null,
        metadata: {
          ...data.metadata,
          platform: data.platform || data.metadata?.platform || "",
          text: data.text || data.message || data.metadata?.text || "",
          subtype: data.subtype || data.metadata?.subtype || "",
          name: data.name || data.metadata?.name || "",
          size: data.size || data.metadata?.size || 0,
          uri: data.uri || data.metadata?.uri || "",
          mimeType: data.mimeType || data.metadata?.mimeType || "",
          replyTo: data.replyTo || data.reply_to || data.replyToMessageId || data.parentMessageId || data.reply_to_message || 
                   data.metadata?.replyTo || data.metadata?.reply_to || data.metadata?.parent_id || data.metadata?.reply_id || null,
        },
      };
    });
    messages.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
    callback(messages);
  });
}

// ─── 7. READ STATUS & UNREAD COUNT ──────────
export async function markChatAsRead(groupId: string): Promise<void> {
  const user = getUserData();
  if (!user || !user.email) return;
  const safeId = user.email.replace(/\./g, "_").replace(/@/g, "_");
  const authorId = user.userId || user.uid || user.id || safeId;

  const docRef = doc(db, "companies", groupId, "read_status", authorId);
  await setDoc(docRef, {
    lastReadAt: serverTimestamp(),
    email: user.email,
  });
}

export function subscribeUnreadCount(
  groupId: string,
  callback: (count: number) => void
): () => void {
  const user = getUserData();
  if (!user || !user.email) return () => {};
  const safeId = user.email.replace(/\./g, "_").replace(/@/g, "_");
  const authorId = user.userId || user.uid || user.id || safeId;

  const readStatusRef = doc(db, "companies", groupId, "read_status", authorId);
  let unsubMessages: (() => void) | null = null;

  const unsubReadStatus = onSnapshot(readStatusRef, (readSnap) => {
    const lastReadAt = readSnap.data()?.lastReadAt;
    if (unsubMessages) unsubMessages();

    const q = query(
      collection(db, "companies", groupId, "messages"),
      orderBy("createdAt", "desc")
    );

    unsubMessages = onSnapshot(q, (msgSnap) => {
      if (!lastReadAt) {
        callback(Math.min(msgSnap.docs.length, 99));
        return;
      }

      const lastReadDate = lastReadAt.toDate();
      let count = 0;
      for (const doc of msgSnap.docs) {
        const createdAt = doc.data().createdAt?.toDate();
        if (createdAt && createdAt > lastReadDate) {
          if (doc.data().authorId !== authorId) {
            count++;
          }
        } else {
          break;
        }
      }
      callback(count);
    });
  }, (e) => console.warn("Unread count rule restriction:", e.message));

  return () => {
    unsubReadStatus();
    if (unsubMessages) (unsubMessages as () => void)();
  };
}
