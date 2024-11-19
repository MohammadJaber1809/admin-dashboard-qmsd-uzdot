import React, { useState, useEffect } from 'react';
import bgImage from '../assets/bg3.jpg'; // Adjust path based on your folder structure
import { auth, db } from '../config/firebaseConfig'; // Use db instead of firestore
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore'; // Import Firestore functions
import { useNavigate } from 'react-router-dom';
import CircularProgress from '@mui/material/CircularProgress'; // Import CircularProgress
import { Snackbar } from '@mui/material'; // Import Snackbar for error messages

const styles = {
  container: {
    display: 'flex',
    height: '100vh',
  },
  leftPanel: {
    backgroundImage: `url(${bgImage})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    width: '50%',
    padding: '40px',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    color: 'rgb(255, 255, 255)',
    textAlign: 'center',
  },
  rightPanel: {
    width: '50%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  loginForm: {
    width: '100%',
    maxWidth: '450px',
    padding: '30px',
    boxShadow: '0 0 15px rgba(0, 0, 0, 0.2)',
    borderRadius: '10px',
    textAlign: 'center',
  },
  h1: {
    fontSize: '4rem',
    margin: '0',
  },
  h2: {
    fontSize: '2.5rem',
    marginBottom: '25px',
  },
  inputGroup: {
    marginBottom: '25px',
  },
  input: {
    width: '90%',
    padding: '12px',
    borderRadius: '10px',
    border: '1px solid #ccc',
    fontSize: '1rem',
  },
  button: {
    backgroundColor: '#28a745',
    color: 'white',
    padding: '12px',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    width: '100%',
    textTransform: 'uppercase',
    marginTop: '20px',
    fontSize: '1.1rem',
  },
  forgotLink: {
    marginTop: '15px',
    color: '#007bff',
    textDecoration: 'none',
    fontSize: '0.9rem',
  },
  loader: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
};

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false); // Add loading state
  const [errorMessage, setErrorMessage] = useState(''); // State for error messages
  const [isAuthenticated, setIsAuthenticated] = useState(false); // State to track authentication
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true); // Set loading to true when starting the login process
    setErrorMessage(''); // Reset any previous error messages

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Fetch user role and wait for it to complete
      const userRole = await fetchUserRole(user.uid);

      // Store authentication status to trigger redirection
      setIsAuthenticated(true);

      if (userRole === 'Admin' || userRole === 'SuperAdmin') {
        navigate('/dashboard'); // User redirected to the documents page
      } else {

        navigate('/dashboard/documents'); // Non-admin user redirected to the documents page
      }
    } catch (error) {
      console.error('Login error:', error.message);
      setErrorMessage('Invalid credentials. Please try again.'); // Show error message to user
    } finally {
      setLoading(false); // Hide loading spinner after navigation
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      // Prevent rendering the login form after redirection
      // Adding this check ensures the login form is not displayed for a brief moment
      return;
    }
  }, [isAuthenticated]);

  return (
    <div style={styles.container}>
      <div style={styles.leftPanel}>
        <h1 style={styles.h1}>WELCOME TO UZDOT</h1>
      </div>
      <div style={styles.rightPanel}>
        <div style={styles.loginForm}>
          {loading ? (
            <div style={styles.loader}>
              <CircularProgress />
            </div>
          ) : (
            <>
              <h2 style={styles.h2}>Login</h2>
              <form onSubmit={handleSubmit}>
                <div style={styles.inputGroup}>
                  <label htmlFor="email">Email:</label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={styles.input}
                  />
                </div>
                <div style={styles.inputGroup}>
                  <label htmlFor="password">Password:</label>
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={styles.input}
                  />
                </div>
                <button type="submit" style={styles.button}>
                  LOGIN
                </button>
                <a href="/forgot-password" style={styles.forgotLink}>
                  Forgot Username/Password?
                </a>
              </form>
              {errorMessage && <Snackbar open={true} message={errorMessage} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Function to fetch user role from Firestore
const fetchUserRole = async (uid) => {
  const userRef = doc(db, 'users', uid); // Use db to get the document reference
  const docSnapshot = await getDoc(userRef); // Fetch the document

  return docSnapshot.exists() ? docSnapshot.data().role : null; // Return role or null if not found
};

export default Login;
