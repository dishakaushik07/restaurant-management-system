import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDgDMKL-MAjuCk1sw58y1iUL-JtXai1tks",
  authDomain: "knos-89c01.firebaseapp.com",
  projectId: "knos-89c01",
  storageBucket: "knos-89c01.firebasestorage.app",
  messagingSenderId: "690101228602",
  appId: "1:690101228602:web:a24780b0ee5dad971e5103"
};

// Initialize Firebase only if it hasn't been initialized already
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
