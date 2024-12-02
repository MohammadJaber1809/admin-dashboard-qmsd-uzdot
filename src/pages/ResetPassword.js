import React, { useState } from 'react';
import { auth } from '../config/firebaseConfig'; // Firebase configuration
import { confirmPasswordReset } from 'firebase/auth'; // Firebase auth function
import { useNavigate, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons'; // Import FontAwesome eye icons

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
    maxWidth: '500px',
    padding: '30px',
    boxShadow: '0 0 15px rgba(0, 0, 0, 0.1)',
    borderRadius: '10px',
    backgroundColor: 'white',
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: '25px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
  },
  label: {
    width: '30%',
    textAlign: 'left',
    fontSize: '1rem',
  },
  input: {
    width: '65%',
    padding: '12px',
    borderRadius: '10px',
    border: '1px solid #ccc',
    fontSize: '1rem',
  },
  toggleButton: {
    position: 'absolute',
    right: '10px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    fontSize: '1.5rem',
    cursor: 'pointer',
    color: '#6c757d', // Set to grey color (you can adjust this if needed)
    filter: 'grayscale(100%)', // Apply grayscale filter to the icon
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

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  const urlParams = new URLSearchParams(location.search);
  const oobCode = urlParams.get('oobCode');

  const handleResetPassword = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please try again.');
      return;
    }

    const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#])(?=.*\d).{8,15}$/;
    if (!passwordRegex.test(newPassword)) {
      setError(
        'Password must be 8-15 characters long, contain at least one uppercase character, one numerical digit, and one allowed special character (!, @, or #)'
      );
      return;
    }

    try {
      await confirmPasswordReset(auth, oobCode, newPassword);

      setMessage('Your password has been successfully reset.');
      setTimeout(() => navigate('/login'), 2000);
    } catch (error) {
      setError('Error resetting password: ' + error.message);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.formContainer}>
        <h2>Reset Password</h2>
        <form onSubmit={handleResetPassword}>
          <div style={styles.inputGroup}>
            <label htmlFor="newPassword" style={styles.label}>New Password:</label>
            <input
              type={showPassword ? 'text' : 'password'}
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              style={styles.input}
            />
            <button
              type="button"
              style={styles.toggleButton}
              onClick={() => setShowPassword(!showPassword)}
            >
              <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
            </button>
          </div>
          <div style={styles.inputGroup}>
            <label htmlFor="confirmPassword" style={styles.label}>Confirm New Password:</label>
            <input
              type={showPassword ? 'text' : 'password'}
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              style={styles.input}
            />
            <button
              type="button"
              style={styles.toggleButton}
              onClick={() => setShowPassword(!showPassword)}
            >
              <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
            </button>
          </div>
          <button type="submit" style={styles.button}>
            Reset Password
          </button>
        </form>

        {message && <p style={styles.message}>{message}</p>}
        {error && <p style={{ ...styles.message, color: 'red' }}>{error}</p>}
      </div>
    </div>
  );
};

export default ResetPassword;

