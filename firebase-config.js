// Paste your own Firebase web app config here from Firebase Console > Project settings > Your apps > Web app.
// The site will not connect to Firebase until these placeholder values are replaced.
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCpIL1sMq1AJhweLAq3V-89X6y9JsYPwQw",
  authDomain: "budget-site-4f0a0.firebaseapp.com",
  projectId: "budget-site-4f0a0",
  storageBucket: "budget-site-4f0a0.firebasestorage.app",
  messagingSenderId: "1021311027394",
  appId: "1:1021311027394:web:a0fd94c306844e96db535b",
  measurementId: "G-SM66VT6EJF"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
