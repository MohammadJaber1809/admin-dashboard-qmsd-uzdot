import React, { useState } from 'react';
import { Box, Typography, Button, TextField, FormControl, InputLabel, Select, MenuItem, Snackbar } from '@mui/material';
import { auth, db } from '../config/firebaseConfig';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

// Reusable Form Field Component
const FormField = ({ label, type, value, onChange }) => (
  <FormControl fullWidth>
    <TextField
      type={type}
      value={value}
      onChange={onChange}
      required
      placeholder={label} // This will set the label as a placeholder inside the text box
      InputProps={{
        style: {
          fontSize: '16px', // Adjust the font size of the input text
        },
      }}
      InputLabelProps={{
        shrink: false, // Disable shrinking label (it won't show above)
      }}
    />
  </FormControl>
);


// Reusable Select Field Component with Add Department Option
const SelectField = ({ label, options, value, onChange, onAddNew }) => (
  <FormControl fullWidth>
    <Select
      value={value}
      onChange={onChange}
      required
      displayEmpty
      renderValue={(selected) => {
        if (!selected) {
          return <em>{`Select ${label}`}</em>; // Placeholder for the Select dropdown
        }
        return selected;
      }}
      sx={{
        fontSize: '16px', // Set the font size to match the textbox
        fontFamily: 'Arial, sans-serif', // Optional: Ensure same font family as textbox
      }}
    >
      <MenuItem value="" disabled>
        <em>{`Select ${label}`}</em> {/* Placeholder item */}
      </MenuItem>
      {options.map((option) => (
        <MenuItem key={option} value={option}>
          {option}
        </MenuItem>
      ))}
      <MenuItem onClick={onAddNew} sx={{ fontWeight: 'bold', color: '#4CAF50' }}>
        + Add New Department
      </MenuItem>
    </Select>
  </FormControl>
);



// Main Component: AddAccount
const AddAccount = () => {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [department, setDepartment] = useState('');
  const [role, setRole] = useState('');
  const [departments, setDepartments] = useState(['HR', 'Finance', 'Engineering', 'Marketing']); // Sample departments
  const [newDepartment, setNewDepartment] = useState('');
  const [isAddingNewDepartment, setIsAddingNewDepartment] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState(''); // Success message state
  const [isSnackbarOpen, setSnackbarOpen] = useState(false); // Snackbar open state

  // Password validation regex
  const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#]{8,15}$/;

  // Full name validation regex (only letters and spaces allowed)
  const fullNameRegex = /^[A-Za-z\s]+$/;

  // Employee ID validation regex (only numbers allowed)
  const employeeIdRegex = /^[0-9]+$/;

  // Function to handle account creation
  const handleCreateAccount = async (e) => {
    e.preventDefault();

    // Check if password contains spaces
    if (/\s/.test(password)) {
      setErrorMessage('Password cannot contain spaces');
      return;
    }

    // Check if full name contains only letters and spaces
    if (!fullNameRegex.test(fullName)) {
      setErrorMessage('Full Name must contain only letters and spaces');
      return;
    }

    // Check if employee ID contains only numbers
    if (!employeeIdRegex.test(employeeId)) {
      setErrorMessage('Employee ID must contain only numbers');
      return;
    }

    // Check if passwords match
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match!');
      return;
    }

    // Check password strength using regex
    if (!passwordRegex.test(password)) {
      setErrorMessage(
        'Password must be 8-15 characters long, contain at least one uppercase character, one numerical digit, and one allowed special character (!, @, or #)'
      );
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, 'users', user.uid), {
        fullName,
        email,
        employeeId,
        department,
        role,
        status: 'inactive',
        uid: user.uid,
      });

      // On success, show a success message
      setSuccessMessage('Account created successfully!');
      setSnackbarOpen(true); // Open the Snackbar

      // Optionally reset form fields after success
      setEmail('');
      setFullName('');
      setEmployeeId('');
      setPassword('');
      setConfirmPassword('');
      setDepartment('');
      setRole('');
    } catch (error) {
      console.error('Error creating account: ', error.message);
      setErrorMessage(`Failed to create account: ${error.message}`);
    }
  };

  // Handle adding a new department
  const handleAddDepartment = () => {
    if (newDepartment && !departments.includes(newDepartment)) {
      setDepartments([...departments, newDepartment]);
      setDepartment(newDepartment);
      setNewDepartment('');
      setIsAddingNewDepartment(false);
    } else {
      alert('Department already exists or is empty!');
    }
  };

  // Close Snackbar
  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  return (
    <Box sx={{ flexGrow: 1, padding: '20px', backgroundColor: 'white' }}>
      <Typography variant="h4" gutterBottom>
        Account Management
      </Typography>
      <Box sx={{ background: '#f9f9f9', borderRadius: '8px', padding: '20px', boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)' }}>
        <form onSubmit={handleCreateAccount} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {/* Form Fields */}
          <FormField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <FormField label="Full Name" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          <FormField label="Employee ID" type="text" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} />
          <FormField label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <FormField label="Confirm Password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />

          {/* Display password error if validation fails */}
          {errorMessage && <Typography color="error">{errorMessage}</Typography>}

          {/* Department Input */}
          {isAddingNewDepartment && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <TextField
                label="New Department"
                value={newDepartment}
                onChange={(e) => setNewDepartment(e.target.value)}
                fullWidth
              />
              <Button variant="contained" onClick={handleAddDepartment} sx={{ backgroundColor: '#4CAF50' }}>
                Add
              </Button>
            </Box>
          )}

          {/* Dropdown Fields */}
          <SelectField
            label="Department"
            options={departments}
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            onAddNew={() => setIsAddingNewDepartment(true)}
          />
          <SelectField label="Role" options={['Admin', 'User']} value={role} onChange={(e) => setRole(e.target.value)} />

          {/* Submit Button */}
          <Button type="submit" variant="contained" sx={{ backgroundColor: '#4CAF50', color: 'white', borderRadius: '5px' }}>
            Create Account
          </Button>
        </form>
      </Box>

      {/* Snackbar for success message */}
      <Snackbar
        open={isSnackbarOpen}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        message={successMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
};

export default AddAccount;
