import { useState, useEffect } from 'react';
import { 
  auth, 
  googleProvider, 
  db, 
  signInAnonymously, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  getAuthErrorMessage 
} from './firebase';
import { signInWithPopup, signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged } from 'firebase/auth';
import Game from './Game';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [authMode, setAuthMode] = useState('login'); // 'login', 'register', 'forgot'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showAuthForm, setShowAuthForm] = useState(false);

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
        setAuthError(getAuthErrorMessage(error));
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
        setShowAuthForm(false); // Hide the form when logged in
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
        setAuthError(getAuthErrorMessage(redirectError));
      }
    }
  };

  const handleAnonymousLogin = async () => {
    setAuthError(null); // Clear previous errors
    setLoading(true); // Show loading indicator
    try {
      const userCredential = await signInAnonymously(auth);
      console.log("Signed in anonymously:", userCredential.user.uid);
      // No need to call setUser here, onAuthStateChanged will handle it
    } catch (error) {
      console.error("Anonymous sign-in failed:", error);
      setAuthError(getAuthErrorMessage(error));
      setLoading(false); // Hide loading indicator on error
    }
    // setLoading(false) will be called by onAuthStateChanged listener upon successful login
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setAuthError(null);
    setLoading(true);
    
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // User is set by onAuthStateChanged listener
    } catch (error) {
      console.error("Email sign-in failed:", error);
      setAuthError(getAuthErrorMessage(error));
      setLoading(false);
    }
  };

  const handleEmailRegister = async (e) => {
    e.preventDefault();
    setAuthError(null);
    setLoading(true);
    
    try {
      // Create the account
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Set display name if provided
      if (displayName) {
        await updateProfile(userCredential.user, { displayName });
      }
      
      // User is set by onAuthStateChanged listener
    } catch (error) {
      console.error("Email registration failed:", error);
      setAuthError(getAuthErrorMessage(error));
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setAuthError(null);
    
    if (!email) {
      setAuthError("Please enter your email address");
      return;
    }
    
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setAuthError("Password reset email sent. Please check your inbox.");
      setLoading(false);
    } catch (error) {
      console.error("Password reset failed:", error);
      setAuthError(getAuthErrorMessage(error));
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // User state is updated by onAuthStateChanged listener
    } catch (error) {
      console.error("Error during sign-out:", error);
      setAuthError(getAuthErrorMessage(error));
    }
  };

  const toggleAuthForm = () => {
    setShowAuthForm(!showAuthForm);
    setAuthError(null); // Clear any previous errors
  };

  const renderAuthForm = () => {
    if (!showAuthForm) return null;

    return (
      <div className="auth-form-container">
        <button className="close-button" onClick={toggleAuthForm}>×</button>
        
        <div className="auth-tabs">
          <button 
            className={authMode === 'login' ? 'active' : ''} 
            onClick={() => setAuthMode('login')}
          >
            Login
          </button>
          <button 
            className={authMode === 'register' ? 'active' : ''} 
            onClick={() => setAuthMode('register')}
          >
            Register
          </button>
          <button 
            className={authMode === 'forgot' ? 'active' : ''} 
            onClick={() => setAuthMode('forgot')}
          >
            Reset Password
          </button>
        </div>
        
        <form onSubmit={
          authMode === 'login' ? handleEmailLogin : 
          authMode === 'register' ? handleEmailRegister : 
          handleForgotPassword
        }>
          {authMode === 'register' && (
            <div className="form-group">
              <label htmlFor="displayName">Display Name</label>
              <input
                type="text"
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your display name"
              />
            </div>
          )}
          
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="your@email.com"
            />
          </div>
          
          {authMode !== 'forgot' && (
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required={authMode !== 'forgot'}
                placeholder="Your password"
                minLength={6}
              />
            </div>
          )}
          
          <button type="submit" className="auth-submit-button">
            {authMode === 'login' ? 'Sign In' : 
             authMode === 'register' ? 'Create Account' : 
             'Send Reset Email'}
          </button>
        </form>
      </div>
    );
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
              {/* Adjust welcome message for different user types */}
              <p>Welcome, {
                user.isAnonymous ? 
                  `Guest (${user.uid.substring(0, 6)}...)` : 
                  (user.displayName || user.email || "Player")
              }!</p>
            </div>
            <button onClick={handleLogout} className="logout-button">Logout</button>
          </div>
          
          {/* Chess Game Component */}
          <Game user={user} />
        </div>
      ) : (
        <div className="login-container">
          <p>Please log in to play</p>
          <div className="auth-buttons">
            <button onClick={handleGoogleLogin} className="google-login-button">
              Login with Google
            </button>
            <button onClick={toggleAuthForm} className="email-login-button">
              Email / Password
            </button>
            <button onClick={handleAnonymousLogin} className="anonymous-login-button">
              Login as Guest
            </button>
          </div>
          
          {renderAuthForm()}
        </div>
      )}
    </div>
  );
}

export default App;
