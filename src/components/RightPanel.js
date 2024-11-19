import React from 'react';
import { Box } from '@mui/material';

const RightPanel = ({ children }) => {
  return (
    <Box
      flexGrow={1}
      bgcolor="white"
      padding="50px"
      display="flex"
      flexDirection="column"
      sx={{
        marginLeft: '250px', // This ensures the right panel doesn't overlap the sidebar
        // Optionally, add padding to the right as well to adjust spacing
      }}
    >
      {children} {/* Render children passed to RightPanel */}
    </Box>
  );
};

export default RightPanel;
