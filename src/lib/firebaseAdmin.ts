import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";

let adminApp: App;
let adminDb: Firestore;

function getAdminDb(): Firestore {
  if (!adminDb) {
    if (getApps().length === 0) {
      // Initialize with application default credentials (same project)
      adminApp = initializeApp({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "hora-7394b",
      });
    } else {
      adminApp = getApps()[0];
    }
    adminDb = getFirestore(adminApp);
  }
  return adminDb;
}

export { getAdminDb };
