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

// ─── INTERFACES ──────────────────────────────

export interface ChatGroup {
  id: string;
  [key: string]: any;
}

export interface ChatMessage {
  id: string;
  authorId: string;
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

  // To bypass collection-level permission checking, we get the exact document
  // The document ID likely uses sanitized email, e.g., name_domain_com
  const safeEmailDocId = user.email.replace(/\./g, "_").replace(/@/g, "_");

  try {
    const docRef = doc(db, "groups", safeEmailDocId);
    const snap = await getDoc(docRef);
    
    if (snap.exists()) {
      return [{
        id: snap.id,
        ...snap.data(),
      }];
    } else {
      // If the safeEmailDocId fails, maybe it uses a different format, let's try just the email or another fallback
      // Often @ is replaced by _ and . by _ as well
      const fallbackId = user.email.replace("@", "_").replace(/\./g, "_");
      if (fallbackId !== safeEmailDocId) {
         const fallbackSnap = await getDoc(doc(db, "groups", fallbackId));
         if (fallbackSnap.exists()) {
           return [{ id: fallbackSnap.id, ...fallbackSnap.data() }];
         }
      }

      // If neither exists, let's try querying by an explicit field as a final fallback!
      // Sometimes rules allow WHERE queries on your email
      const q = query(collection(db, "groups"), where("email", "==", user.email));
      const qSnap = await getDocs(q);
      
      if (!qSnap.empty) {
        return qSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
      }

      console.warn("No group document found for email:", user.email, "tried:", safeEmailDocId);
      return [];
    }
  } catch (error: any) {
    console.error("Error fetching group document:", error);
    throw error;
  }
}

// ─── 2. SUBSCRIBE TO MESSAGES (REALTIME) ─────
export function subscribeMessages(
  groupId: string,
  callback: (messages: ChatMessage[]) => void
): () => void {
  const q = query(
    collection(db, "groups", groupId, "messages"),
    orderBy("createdAt", "asc")
  );

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const messages: ChatMessage[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          authorId: data.authorId || "",
          createdAt: data.createdAt || null,
          metadata: {
            platform: data.metadata?.platform || "",
            text: data.metadata?.text || "",
            type: data.metadata?.type || "text",
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
