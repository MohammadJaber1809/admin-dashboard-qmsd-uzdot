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
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setErrorMessage('');
    
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
    
      // Fetch user details
      const userDetails = await fetchUserDetails(user.uid);
      console.log('Fetched user details:', userDetails);
    
      if (!userDetails) {
        setErrorMessage('User not found. Please check your credentials.');
        return;
      }
    
      const { role, status } = userDetails;
      console.log('User role:', role);
      console.log('User status:', status);
    
      // Handle inactive accounts
      if (status === 'Inactive') {
        console.log('Account is inactive. Logging out immediately...');
        setErrorMessage('Your account is inactive. You have been logged out.');
        setTimeout(() => auth.signOut(), 2000); // Delay logout to show the message
        return;
      }
    
      // Set authentication for active accounts
      setIsAuthenticated(true);
    
      // Navigate based on user role
      if (role === 'Admin' || role === 'SuperAdmin') {
        console.log('Navigating to Admin dashboard');
        navigate('/dashboard');
      } else {
        console.log('Navigating to Documents dashboard');
        navigate('/dashboard/documents');
      }
    } catch (error) {
      console.error('Login error:', error.message);
      if (error.code === 'auth/user-not-found') {
        setErrorMessage('User not found. Please check your credentials.');
      } else if (error.code === 'auth/wrong-password') {
        setErrorMessage('Incorrect password. Please try again.');
      } else {
        setErrorMessage('An error occurred. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };
  
  
  
  useEffect(() => {
    console.log('isAuthenticated:', isAuthenticated);
    if (isAuthenticated) {
      console.log('User authenticated, navigating to dashboard...');
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);
  
  
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
                  Forgot Password?
                </a>
              </form>
            </>
          )}
          {errorMessage && <Snackbar open={Boolean(errorMessage)} message={errorMessage} />}
        </div>
      </div>
    </div>
  );
};

// Function to fetch user details from Firestore
const fetchUserDetails = async (uid) => {
  try {
    const userRef = doc(db, 'users', uid);
    const docSnapshot = await getDoc(userRef);

    if (docSnapshot.exists()) {
      const userData = docSnapshot.data();
      console.log('Fetched data from Firestore:', userData);
      return { role: userData.role, status: userData.status }; // Ensure status is correct
    } else {
      console.log('No user document found!');
      return null;
    }
  } catch (error) {
    console.error('Error fetching user details:', error);
    return null;
  }
};

export default Login;
