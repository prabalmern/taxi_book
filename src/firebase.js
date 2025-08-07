/* eslint-disable no-unused-vars */
// firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyC5Dn_-sCmdg_AvfBaV2t3rRNAK2LDqABw",
  authDomain: "taxi-book-c9fe5.firebaseapp.com",
  projectId: "taxi-book-c9fe5",
  storageBucket: "taxi-book-c9fe5.firebasestorage.app",
  messagingSenderId: "108344920268",
  appId: "1:108344920268:web:4d53aca3fb9511b52c1a69",
  measurementId: "G-WRVD2GEV94",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app); // 🔥 This is Firestore
const auth = getAuth(app);

export { db, auth };
