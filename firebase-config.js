/**
 * ============================================================
 * MAJESTÉ MARKET — firebase-config.js
 * Configuration Firebase + initialisation des services
 * by MAHOUTO X-PRO | Cotonou, Bénin
 * ============================================================
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, enableIndexedDbPersistence } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getMessaging, isSupported } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

// ────────────────────────────────────────────────────────────
// 🔧 REMPLACEZ CES VALEURS PAR VOS CLÉS FIREBASE RÉELLES
//    Créez un projet sur https://console.firebase.google.com
// ────────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyDEMO-REPLACEZ-PAR-VOTRE-CLE-API",
  authDomain: "majeste-market.firebaseapp.com",
  projectId: "majeste-market",
  storageBucket: "majeste-market.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890abcdef",
  measurementId: "G-XXXXXXXXXX"
};

// Initialisation de l'application Firebase
const app = initializeApp(firebaseConfig);

// Services Firebase exportés
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

// Activation du mode hors-ligne (IndexedDB persistence)
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === "failed-precondition") {
    console.warn("Persistence multi-onglets non supportée");
  } else if (err.code === "unimplemented") {
    console.warn("Persistence non disponible sur ce navigateur");
  }
});

// Firebase Cloud Messaging (conditionnel — nécessite HTTPS)
export let messaging = null;
isSupported().then((supported) => {
  if (supported) {
    messaging = getMessaging(app);
  }
});

export default app;
