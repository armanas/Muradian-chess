import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB55BNHGno71-kPxtxTeh2PARjrhiE4vjo",
  authDomain: "muradian-chess.firebaseapp.com",
  projectId: "muradian-chess",
  storageBucket: "muradian-chess.appspot.com", // Corrected storage bucket domain
  messagingSenderId: "855417097101",
  appId: "1:855417097101:web:e79074865510e108d08bc4",
  measurementId: "G-DZTFM1HJFR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get Firebase services
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export { auth, db, googleProvider };
