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
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getUserData } from "@/lib/auth";
import { getUserProfile } from "@/services/profileService";

// ─── INTERFACES ──────────────────────────────
// ─── INTERFACES ──────────────────────────────

export interface ChatGroup {
  id: string;
  [key: string]: any;
}

export interface ChatMessage {
  id: string;
  authorId: string;
  authorName?: string;
  authorEmail?: string;
  createdAt: Timestamp | null;
  metadata: {
    platform: string;
    text: string;
    type: string;
  };
}

// ─── 1. WAIT FOR AUTH UTILITY ────────────────
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

export function waitForAuth(): Promise<void> {
  return new Promise((resolve, reject) => {
    // If already logged in, resolve immediately
    if (auth.currentUser) return resolve();
    
    // Otherwise wait for the first auth state emission
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        unsubscribe();
        if (user) {
          resolve();
        } else {
          reject(new Error("Firebase Auth user is not signed in."));
        }
      },
      (error) => {
        unsubscribe();
        reject(error);
      }
    );
  });
}

// ─── 2. GET ALL GROUPS ──────────────────────
export async function getGroups(): Promise<ChatGroup[]> {
  const user = getUserData();
  if (!user || !user.email) {
    throw new Error("User email not found. Please login again.");
  }

  // Ensure Firebase Auth indicates we are signed in
  await waitForAuth();

  // Berdasarkan Rules baru, koleksi yang diperbolehkan adalah /companies/{companyId}/messages
  // Tidak ada rules yang membolehkan koleksi "groups"
  // Jadi kita buat 1 Virtual Group menggunakan ID Perusahaan
  let extCompanyId = "";
  let companyTitle = "General Chat Perusahaan";
  try {
    const userInfo = await getUserProfile(user.email);
    if (userInfo && userInfo.idPerusahaan) {
      extCompanyId = userInfo.idPerusahaan;
      if (userInfo.namaPerusahaan) {
        companyTitle = userInfo.namaPerusahaan;
      }
    }
  } catch (e) {
    console.error("Failed to find user profile info:", e);
  }

  const companyId = extCompanyId || user.companyId || user.idPerusahaan || user.idperusahaan || "CLVREW";

  return [{
    id: companyId,
    name: companyTitle,
  }];
}

// ─── 2. SUBSCRIBE TO MESSAGES (REALTIME) ─────
export function subscribeMessages(
  groupId: string,
  callback: (messages: ChatMessage[]) => void
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
        return {
          id: doc.id,
          authorId: data.authorId || data.senderId || "",
          authorName: data.authorName || "",
          authorEmail: data.authorEmail || "",
          createdAt: data.createdAt || data.timestamp || null,
          metadata: {
            platform: data.platform || data.metadata?.platform || "",
            text: data.text || data.message || data.metadata?.text || "",
            type: data.type || data.metadata?.type || "text",
          },
        };
      });
      callback(messages);
    },
    (error) => {
      console.error("Error subscribing to messages:", error);
    }
  );

  return unsubscribe;
}

// ─── 3. SEND MESSAGE ────────────────────────────────
import { addDoc, serverTimestamp, setDoc } from "firebase/firestore";

export async function sendMessage(
  companyId: string,
  text: string
): Promise<void> {
  const user = getUserData();
  if (!user || !user.email) throw new Error("User not found");
  
  // Use UID instead of email to match Mobile App!
  const safeId = user.email.replace(/\./g, "_").replace(/@/g, "_");
  const authorId = user.userId || user.uid || user.id || safeId;

  await addDoc(collection(db, "companies", companyId, "messages"), {
    authorId: authorId,
    authorName: user.name || user.email,
    authorEmail: user.email,
    text: text,
    type: "text",
    createdAt: serverTimestamp(),
    metadata: {
      platform: "web",
    },
  });
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
    // According to Flutter app, when stop typing we delete the document
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
    // Exclude self from the typing indicator
    const user = getUserData();
    const safeId = user?.email?.replace(/\./g, "_").replace(/@/g, "_");
    const authorId = user?.userId || user?.uid || user?.id || safeId;
    
    const typists: string[] = [];
    snap.docs.forEach((doc) => {
      if (doc.id !== authorId) typists.push(doc.data().userName || doc.data().name || doc.id);
    });
    callback(typists);
  });
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
    // Delete document when offline matching Flutter behavior
    const { deleteDoc } = await import("firebase/firestore");
    try {
      await deleteDoc(docRef);
    } catch(e) {}
  }
}

export function subscribeOnlineUsers(
  companyId: string,
  callback: (onlineCount: number) => void
): () => void {
  const q = query(
    collection(db, "companies", companyId, "online_users"),
    where("isOnline", "==", true)
  );
  return onSnapshot(q, (snap) => {
    let count = 0;
    const now = new Date();
    snap.docs.forEach((doc) => {
      const data = doc.data();
      if (data.isOnline) {
        if (data.lastSeen) {
          const lastSeen = data.lastSeen.toDate?.() || new Date(data.lastSeen);
          const diffMinutes = (now.getTime() - lastSeen.getTime()) / 60000;
          if (diffMinutes < 1.5) {
            count++;
          }
        } else {
          // If lastSeen is null/pending on local write, still count as online
          count++;
        }
      }
    });
    callback(count);
  });
}
