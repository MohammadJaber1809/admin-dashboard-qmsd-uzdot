import React from 'react';
import { Box } from '@mui/material';
import Sidenav from './Sidenav';
import RightPanel from './RightPanel';
import { Outlet } from 'react-router-dom'; // Outlet for nested routes

const AdminDashboard = () => {
  return (
    <Box display="flex" height="100vh">
      <Sidenav />
      <RightPanel>
        <Outlet /> {/* Render the child route components here */}
      </RightPanel>
    </Box>
  );
};

export default AdminDashboard;
