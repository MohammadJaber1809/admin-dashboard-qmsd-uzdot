import React, { useState } from 'react';
import { auth } from '../config/firebaseConfig'; // Firebase configuration
import { sendPasswordResetEmail } from 'firebase/auth'; // Firebase auth function
import { useNavigate } from 'react-router-dom';

const styles = {
  container: {
    display: 'flex',
    height: '100vh',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f1f1f1',
  },
  formContainer: {
    width: '100%',
    maxWidth: '450px',
    padding: '30px',
    boxShadow: '0 0 15px rgba(0, 0, 0, 0.1)',
    borderRadius: '10px',
    backgroundColor: 'white',
    textAlign: 'center',
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
  message: {
    marginTop: '15px',
    fontSize: '1.1rem',
    color: '#007bff',
  },
};

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleResetPassword = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');

    try {
      await sendPasswordResetEmail(auth, email);
      setMessage('Password reset email sent! Please check your inbox.');
    } catch (error) {
      setError('Error sending password reset email: ' + error.message);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.formContainer}>
        <h2>Forgot Password</h2>
        <form onSubmit={handleResetPassword}>
          <div style={styles.inputGroup}>
            <label htmlFor="email">Enter your email:</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={styles.input}
            />
          </div>
          <button type="submit" style={styles.button}>
            Send Reset Email
          </button>
        </form>

        {message && <p style={styles.message}>{message}</p>}
        {error && <p style={{ ...styles.message, color: 'red' }}>{error}</p>}

        <p style={{ marginTop: '15px' }}>
          Remember your password?{' '}
          <a href="/login" style={{ color: '#007bff' }}>
            Back to Login
          </a>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
