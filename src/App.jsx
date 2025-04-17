import { useState, useEffect } from 'react';
import { auth, googleProvider, db } from './firebase'; // Import Firebase config
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import './App.css';

function App() {
  const [user, setUser] = useState(null); // State to hold user auth info
  const [loading, setLoading] = useState(true); // State for initial auth check

  // Listener for authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      if (currentUser) {
        console.log("User logged in:", currentUser.uid, currentUser.displayName);
      } else {
        console.log("User logged out");
      }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      // User state will be updated by onAuthStateChanged listener
    } catch (error) {
      console.error("Error during Google sign-in:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // User state will be updated by onAuthStateChanged listener
    } catch (error) {
      console.error("Error during sign-out:", error);
    }
  };

  // Show loading indicator while checking auth state
  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="App">
      <h1>Multiplayer Chess</h1>
      {user ? (
        <div>
          <p>Welcome, {user.displayName}!</p>
          <button onClick={handleLogout}>Logout</button>
          {/* Game components will go here */}
        </div>
      ) : (
        <div>
          <p>Please log in to play.</p>
          <button onClick={handleGoogleLogin}>Login with Google</button>
        </div>
      )}
    </div>
  );
}

export default App;
