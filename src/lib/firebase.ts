import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyAf-rWmeDdTxbotL6hRqE3_ljXMb8rV2EE",
  authDomain: "axis-design-studio.firebaseapp.com",
  projectId: "axis-design-studio",
  storageBucket: "axis-design-studio.firebasestorage.app",
  messagingSenderId: "35214129698",
  appId: "1:35214129698:web:8e99f5b6823a5b8b85e87b",
  measurementId: "G-2S1CFEM1QK",
};

// لو فيه تطبيق متفعل قبل كده، استخدمه بدل ما تعمل واحد جديد
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// الاتصال بقاعدة البيانات
export const db = getFirestore(app);

// تفعيل الإحصائيات (Analytics) بس في المتصفح (مش وقت الـ build)
export const analyticsPromise = typeof window !== "undefined"
  ? isSupported().then((yes) => (yes ? getAnalytics(app) : null))
  : Promise.resolve(null);