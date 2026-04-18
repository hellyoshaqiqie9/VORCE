import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider, OAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDcc3oP_lGYg9ikBn0mq--wdH27aQ5LFlc",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "hora-7394b.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "hora-7394b",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "hora-7394b.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "544676101248",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:544676101248:web:708c651f6c3d20a5b1ba65",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-F9K8JMYEZN"
};

// Initialize Firebase (prevent re-initialization in dev/hot reload)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();
const appleProvider = new OAuthProvider('apple.com');

// Force account selection on every login
googleProvider.setCustomParameters({
  prompt: "select_account"
});

export { app, auth, db, googleProvider, appleProvider };
