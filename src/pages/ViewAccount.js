import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  TextField,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { db } from '../config/firebaseConfig';
import { collection, getDoc, doc, updateDoc, deleteDoc, getDocs } from 'firebase/firestore';
import { auth } from '../config/firebaseConfig'; // Assuming you have Firebase Auth configured

const Account = () => {
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);  // Store all users to reset when search is cleared
  const [searchQuery, setSearchQuery] = useState('');
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [currentUserRole, setCurrentUserRole] = useState('');

  // Fetch users from Firestore and filter based on current user's role
  const fetchUsers = async () => {
    try {
      const usersCollection = collection(db, 'users');
      const usersSnapshot = await getDocs(usersCollection);
      const usersList = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      console.log("Fetched Users:", usersList); // Log the fetched users

      // Store all users for resetting the filtered list
      setAllUsers(usersList);

      // Filter users based on current user's role
      if (currentUserRole === 'Admin') {
        const filtered = usersList.filter(user => user.role !== 'SuperAdmin');
        setFilteredUsers(filtered);
      } else {
        setFilteredUsers(usersList);
      }
    } catch (error) {
      console.error("Error fetching users: ", error);
    }
  };

  useEffect(() => {
    // Fetch current logged-in user role from Firebase Auth (or your custom auth system)
    const user = auth.currentUser; // Assuming Firebase Auth is used
    if (user) {
      const userDocRef = doc(db, 'users', user.uid); // Get user by UID
      getDoc(userDocRef).then((docSnap) => {
        if (docSnap.exists()) {
          setCurrentUserRole(docSnap.data().role); // Set role of the logged-in user
        }
      });
    }
  }, []);

  useEffect(() => {
    if (currentUserRole) {
      fetchUsers(); // Fetch users after role is set
    }
  }, [currentUserRole]);

  const handleStatusChange = async (id, newStatus) => {
    console.log(`Updating user ID: ${id} to status: ${newStatus}`); // Log the ID and status
    try {
      const userDocRef = doc(db, 'users', id); // Use ID to reference the document
      await updateDoc(userDocRef, { status: newStatus }); // Update the 'status' field

      // Update the local state
      const updatedUsers = filteredUsers.map(user =>
        user.id === id ? { ...user, status: newStatus } : user
      );
      setFilteredUsers(updatedUsers);
    } catch (error) {
      console.error("Error updating status: ", error);
    }
  };

  const handleDeleteDialogOpen = (user) => {
    setUserToDelete(user);
    setOpenDeleteDialog(true);
  };

  const handleDelete = async () => {
    if (userToDelete) {
      try {
        const userDocRef = doc(db, 'users', userToDelete.id);
        await deleteDoc(userDocRef);
        // Remove the user from the local state after deletion
        const updatedUsers = filteredUsers.filter(user => user.id !== userToDelete.id);
        setFilteredUsers(updatedUsers);
        console.log(`User ID: ${userToDelete.id} deleted`);
        setOpenDeleteDialog(false); // Close the dialog after deletion
      } catch (error) {
        console.error("Error deleting user: ", error);
      }
    }
  };

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
  };

  // Handle Search Query
  const handleSearch = (event) => {
    const query = event.target.value.toLowerCase();
    setSearchQuery(query);

    if (query === '*' || query === '') {
      // If search query is '*' or empty, show all users
      setFilteredUsers(allUsers);
    } else {
      // Filter users based on query
      const filtered = allUsers.filter(user =>
        user.fullName.toLowerCase().includes(query) ||
        user.department.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query)
      );
      setFilteredUsers(filtered);
    }
  };

  return (
    <Box sx={{ padding: '20px' }}>
      <Typography variant="h4" gutterBottom>
        Account Management
      </Typography>

      {/* Search Text Field */}
      <TextField
        label="Search Users"
        variant="outlined"
        fullWidth
        value={searchQuery}
        onChange={handleSearch}
        sx={{ marginBottom: '20px' }}
        placeholder="Search by name, department, or email"
      />

      <Grid container spacing={3}>
        {filteredUsers.map((user) => (
          <Grid item xs={12} sm={6} md={4} key={user.id}> {/* Use id as the key */}
            <Card variant="outlined" sx={{ padding: '10px', position: 'relative' }}>
              <IconButton
                onClick={() => handleDeleteDialogOpen(user)}
                sx={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  color: 'red',
                }}
              >
                <DeleteIcon />
              </IconButton>
              <CardContent>
                <Typography variant="h6">{user.fullName}</Typography>
                <Typography color="textSecondary">Department: {user.department}</Typography>
                <Typography color="textSecondary">Role: {user.role}</Typography>
                <Box
                  sx={{
                    bgcolor: user.status === 'Active' ? 'green.100' : 'red.100',
                    color: user.status === 'Active' ? 'green.800' : 'red.800',
                    padding: '5px',
                    borderRadius: '4px',
                    textAlign: 'center',
                    fontWeight: 'bold',
                    margin: '10px 0',
                  }}
                >
                  {user.status} {/* Display current status */}
                </Box>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={user.status} // Bind the selected value to the user's status
                    onChange={(e) => handleStatusChange(user.id, e.target.value)} // Update status on change
                    sx={{
                      bgcolor: 'transparent',
                      color: user.status === 'Active' ? 'green.800' : 'red.800',
                    }}
                  >
                    <MenuItem value="Active" sx={{ bgcolor: 'green.100', color: 'green.800' }}>
                      Active
                    </MenuItem>
                    <MenuItem value="Inactive" sx={{ bgcolor: 'red.100', color: 'red.800' }}>
                      Inactive
                    </MenuItem>
                  </Select>
                </FormControl>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={openDeleteDialog}
        onClose={handleCloseDeleteDialog}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">Confirm Deletion</DialogTitle>
        <DialogContent>
          <Typography id="delete-dialog-description">
            Are you sure you want to delete this user? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDelete} color="secondary">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Account;
