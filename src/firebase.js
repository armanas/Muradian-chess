import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  setPersistence, 
  browserLocalPersistence, 
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile
} from "firebase/auth";
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

// Helper function to handle Firebase auth errors with user-friendly messages
const getAuthErrorMessage = (error) => {
  const errorCode = error.code;
  switch (errorCode) {
    case 'auth/email-already-in-use':
      return 'This email is already registered. Try logging in instead.';
    case 'auth/invalid-email':
      return 'Please provide a valid email address.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'Invalid email or password. Please try again.';
    case 'auth/too-many-requests':
      return 'Too many unsuccessful login attempts. Try again later or reset your password.';
    case 'auth/popup-closed-by-user':
      return 'Login canceled. Please try again.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your internet connection.';
    case 'auth/operation-not-allowed':
      return 'This authentication method is not enabled. Please contact the administrator.';
    default:
      return `Authentication error: ${error.message}`;
  }
};

const db = getFirestore(app);

export { 
  auth, 
  db, 
  googleProvider, 
  signInAnonymously, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail,
  updateProfile,
  getAuthErrorMessage 
};
