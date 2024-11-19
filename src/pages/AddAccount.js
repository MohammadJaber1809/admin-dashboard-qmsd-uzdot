import React, { useState } from 'react';
import { Box, Typography, Button, TextField, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { auth, db } from '../config/firebaseConfig';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

// Reusable Form Field Component
const FormField = ({ label, type, value, onChange }) => (
  <FormControl fullWidth>
    <InputLabel shrink>{label}</InputLabel>
    <TextField
      type={type}
      value={value}
      onChange={onChange}
      required
      InputLabelProps={{ shrink: true }} // Ensures the label stays above when filled
    />
  </FormControl>
);

// Reusable Select Field Component with Add Department Option
const SelectField = ({ label, options, value, onChange, onAddNew }) => (
  <FormControl fullWidth>
    <InputLabel shrink>{label}</InputLabel>
    <Select value={value} onChange={onChange} required>
      <MenuItem value="">
        <em>Select {label}</em>
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

  // Function to handle account creation
  const handleCreateAccount = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert('Passwords do not match!');
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

      alert('Account created successfully!');
    } catch (error) {
      console.error('Error creating account: ', error.message);
      alert(`Failed to create account: ${error.message}`);
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
          <SelectField label="Role" options={['Admin', 'User', 'Manager', 'Viewer']} value={role} onChange={(e) => setRole(e.target.value)} />

          {/* Submit Button */}
          <Button type="submit" variant="contained" sx={{ backgroundColor: '#4CAF50', color: 'white', borderRadius: '5px' }}>
            Create Account
          </Button>
        </form>
      </Box>
    </Box>
  );
};

export default AddAccount;
