import { useState, useEffect } from 'react';
import { auth, googleProvider, db } from './firebase';
import { signInWithPopup, signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged } from 'firebase/auth';
import Game from './Game';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Check for redirect result on initial load
  useEffect(() => {
    const checkRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result?.user) {
          console.log("Successfully signed in after redirect:", result.user.displayName);
        }
      } catch (error) {
        console.error("Error getting redirect result:", error);
        setAuthError(`Authentication error: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    checkRedirectResult();
  }, []);

  // Listener for authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      if (currentUser) {
        console.log("User logged in:", currentUser.uid, currentUser.displayName);
        setAuthError(null); // Clear any previous errors on successful login
      } else {
        console.log("User logged out or not logged in");
      }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const handleGoogleLogin = async () => {
    setAuthError(null); // Clear previous errors
    try {
      // Try popup first (works on most browsers/devices)
      await signInWithPopup(auth, googleProvider);
    } catch (popupError) {
      console.warn("Popup sign-in failed, trying redirect method:", popupError);
      try {
        // Fallback to redirect method if popup fails
        await signInWithRedirect(auth, googleProvider);
      } catch (redirectError) {
        console.error("Redirect sign-in also failed:", redirectError);
        setAuthError(`Login failed: ${redirectError.message}`);
      }
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error during sign-out:", error);
      setAuthError(`Logout failed: ${error.message}`);
    }
  };

  // Show loading indicator while checking auth state
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading authentication status...</p>
      </div>
    );
  }

  return (
    <div className="App">
      <h1>Multiplayer Chess</h1>
      
      {authError && (
        <div className="error-message">
          {authError}
          <button onClick={() => setAuthError(null)}>Dismiss</button>
        </div>
      )}
      
      {user ? (
        <div className="authenticated-container">
          <div className="user-container">
            <div className="user-info">
              {user.photoURL && <img src={user.photoURL} alt="Profile" className="profile-image" />}
              <p>Welcome, {user.displayName || user.email || "Player"}!</p>
            </div>
            <button onClick={handleLogout} className="logout-button">Logout</button>
          </div>
          
          {/* Chess Game Component */}
          <Game user={user} />
        </div>
      ) : (
        <div className="login-container">
          <p>Please log in with your Google account to play</p>
          <button onClick={handleGoogleLogin} className="google-login-button">
            Login with Google
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
