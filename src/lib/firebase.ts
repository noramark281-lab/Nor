import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// 1. تعريف أنواع العمليات لدعم المكونات الأخرى
export type OperationType = 'read' | 'write' | 'delete' | 'update' | 'create';

// 2. دالة التعامل مع أخطاء Firestore والمطلوبة في FirebaseAuthBadge
export function handleFirestoreError(error: unknown, operation: OperationType): void {
  console.error(`[Firestore Error during ${operation}]:`, error);
}

// 3. إعدادات Firebase مع التوفير الافتراضي لحالات التطوير
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDummyKeyForFallbackPurposeOnly",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "mexc-ai-trading.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "mexc-ai-trading",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "mexc-ai-trading.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1234567890",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1234567890:web:abcdef123456"
};

// تهيئة Firebase بأمان لمنع التهيئة المزدوجة
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
