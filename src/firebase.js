import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB55BNHGno71-kPxtxTeh2PARjrhiE4vjo",
  authDomain: "muradian-chess.firebaseapp.com",
  projectId: "muradian-chess",
  storageBucket: "muradian-chess.appspot.com",
  messagingSenderId: "855417097101",
  appId: "1:855417097101:web:e79074865510e108d08bc4",
  measurementId: "G-DZTFM1HJFR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get Firebase services
const auth = getAuth(app);

// Set auth persistence to LOCAL for better user experience
setPersistence(auth, browserLocalPersistence)
  .catch((error) => {
    console.error("Error setting auth persistence:", error);
  });

// Configure Google provider with additional scopes and parameters
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account' // Forces account selection even when one account is available
});

const db = getFirestore(app);

export { auth, db, googleProvider };
