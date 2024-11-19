import React, { useState, useEffect } from 'react';
import { Box, Button, Typography, Collapse } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import logo from '../assets/logo.png'; 
import { auth, db } from '../config/firebaseConfig'; 
import { signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const Sidenav = () => {
  const [openDocumentRequest, setOpenDocumentRequest] = useState(false);
  const [openManageAccount, setOpenManageAccount] = useState(false);
  const [role, setRole] = useState(null);  // to store role (Admin or User)
  const [fullName, setFullName] = useState(''); // to store full name
  const navigate = useNavigate(); 

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const userDocRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(userDocRef);

          if (docSnap.exists()) {
            setRole(docSnap.data().role);  // Set role from Firestore (Admin or User)
            setFullName(docSnap.data().fullName); // Set fullName from Firestore
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    if (auth.currentUser) {
      fetchUserData();
    }
  }, []);

  const handleDocumentToggle = () => {
    setOpenDocumentRequest(prev => !prev);
  };

  const handleManageToggle = () => {
    setOpenManageAccount(prev => !prev);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/'); 
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  return (
    <Box
      sx={{
        width: '250px',
        bgcolor: '#4CAF50',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '20px',
        height: '100vh', // Full height of the screen
        position: 'fixed', // Fixes the sidebar in place
        top: 0, 
        left: 0,
        zIndex: 1000, // Keeps the sidebar above the content
      }}
    >
      <img src={logo} alt="Logo" style={{ width: '100%', maxWidth: '200px', marginBottom: '20px' }} />
      
      {/* Display full name */}
      <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold', margin: '10px 0' }}>
        {fullName ? fullName : 'Loading...'}
      </Typography>

      {/* Conditional rendering based on user role */}
      {role === 'Admin' || role === 'SuperAdmin' ? (
        <>
          <Link to="/dashboard" style={{ textDecoration: 'none', width: '100%' }}>
            <Button variant="text" sx={{ color: 'white', margin: '10px 0', width: '100%' }}>
              Dashboard
            </Button>
          </Link>

          <Link to="/dashboard/documents" style={{ textDecoration: 'none', width: '100%' }}>
            <Button variant="text" sx={{ color: 'white', margin: '10px 0', width: '100%' }}>
              Documents
            </Button>
          </Link>

          {/* Document Request Dropdown */}
          <Button 
            variant="text" 
            sx={{ color: 'white', margin: '10px 0', width: '100%', display: 'flex', alignItems: 'center' }} 
            onClick={handleDocumentToggle}
          >
            Document Request
            <ExpandMoreIcon sx={{ marginLeft: '8px' }} />
          </Button>
          <Collapse in={openDocumentRequest} sx={{ width: '100%' }}>
            <Box 
              sx={{ 
                padding: '10px 0',
                boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.5)',
                bgcolor: 'rgba(0, 0, 0, 0.7)', 
                borderRadius: '4px',
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'center',
                width: '100%', 
              }}
            >
              <Link to="/dashboard/drc" style={{ textDecoration: 'none', width: '100%' }}>
                <Button variant="text" sx={{ color: 'white', margin: '5px 0', width: '80%' }}>
                  Document Request Control
                </Button>
              </Link>
              <Link to="/dashboard/document-request-list" style={{ textDecoration: 'none', width: '100%' }}>
                <Button variant="text" sx={{ color: 'white', margin: '5px 0', width: '80%' }}>
                  Document Request List
                </Button>
              </Link>
            </Box>
          </Collapse>

          {/* Manage Account Dropdown */}
          <Button 
            variant="text" 
            sx={{ color: 'white', margin: '10px 0', width: '100%', display: 'flex', alignItems: 'center' }} 
            onClick={handleManageToggle}
          >
            Manage Account
            <ExpandMoreIcon sx={{ marginLeft: '8px' }} />
          </Button>
          <Collapse in={openManageAccount} sx={{ width: '100%' }}>
            <Box 
              sx={{ 
                padding: '10px 0',
                boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.5)',
                bgcolor: 'rgba(0, 0, 0, 0.7)', 
                borderRadius: '4px',
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'center',
                width: '100%', 
              }}
            >
              <Link to="/dashboard/add-account" style={{ textDecoration: 'none', width: '100%' }}>
                <Button variant="text" sx={{ color: 'white', margin: '5px 0', width: '80%' }} >
                  Add Account
                </Button>
              </Link>
              <Link to="/dashboard/view-accounts" style={{ textDecoration: 'none', width: '100%' }}>
                <Button variant="text" sx={{ color: 'white', margin: '5px 0', width: '80%' }} >
                  View Accounts
                </Button>
              </Link>
            </Box>
          </Collapse>

          <Button 
            variant="text" 
            sx={{ color: 'white', margin: '10px 0', width: '100%' }} 
            onClick={handleLogout}
          >
            Logout
          </Button>
        </>
      ) : role === 'User' ? (
        <>
          <Link to="/dashboard/documents" style={{ textDecoration: 'none', width: '100%' }}>
            <Button variant="text" sx={{ color: 'white', margin: '10px 0', width: '100%' }}>
              Documents
            </Button>
          </Link>

          {/* Document Request Dropdown */}
          <Button 
            variant="text" 
            sx={{ color: 'white', margin: '10px 0', width: '100%', display: 'flex', alignItems: 'center' }} 
            onClick={handleDocumentToggle}
          >
            Document Request
            <ExpandMoreIcon sx={{ marginLeft: '8px' }} />
          </Button>
          <Collapse in={openDocumentRequest} sx={{ width: '100%' }}>
            <Box 
              sx={{ 
                padding: '10px 0',
                boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.5)',
                bgcolor: 'rgba(0, 0, 0, 0.7)', 
                borderRadius: '4px',
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'center',
                width: '100%', 
              }}
            >
              <Link to="/dashboard/drc" style={{ textDecoration: 'none', width: '100%' }}>
                <Button variant="text" sx={{ color: 'white', margin: '5px 0', width: '80%' }}>
                  Document Request Control
                </Button>
              </Link>
              <Link to="/dashboard/document-request-list" style={{ textDecoration: 'none', width: '100%' }}>
                <Button variant="text" sx={{ color: 'white', margin: '5px 0', width: '80%' }}>
                  Document Request List
                </Button>
              </Link>
            </Box>
          </Collapse>

          <Button 
            variant="text" 
            sx={{ color: 'white', margin: '10px 0', width: '100%' }} 
            onClick={handleLogout}
          >
            Logout
          </Button>
        </>
      ) : (
        <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
          Loading role...
        </Typography>
      )}
    </Box>
  );
};

export default Sidenav;
