import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

export const firebaseConfig = {
  apiKey: "AIzaSyCpIL1sMq1AJhweLAq3V-89X6y9JsYPwQw",
  authDomain: "budget-site-4f0a0.firebaseapp.com",
  projectId: "budget-site-4f0a0",
  storageBucket: "budget-site-4f0a0.firebasestorage.app",
  messagingSenderId: "1021311027394",
  appId: "1:1021311027394:web:a0fd94c306844e96db535b",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const provider = new GoogleAuthProvider();
