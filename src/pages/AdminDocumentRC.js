import React, { useState, useEffect } from 'react';
import { Typography, Button, Snackbar } from '@mui/material';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import styled from 'styled-components';
import { db, storage } from '../config/firebaseConfig';
import { collection, getDocs, addDoc, doc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { ref, uploadBytes } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

// Styled components
const Container = styled.div`
  display: flex;
  height: 100vh;
  overflow: hidden;
`;

const RightPanel = styled.div`
  flex-grow: 1;
  background-color: white;
  padding: 20px;
  display: flex;
  flex-direction: column;
  overflow: auto;
`;

const DocumentForm = styled.form`
  max-width: 1000px;
  width: 100%;
  margin: 0 auto;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
`;

const FormGroup = styled.div`
  margin-bottom: 15px;
`;

const FormInput = styled.input`
  width: 98%;
  padding: 10px;
  border-radius: 5px;
  border: 1px solid #ccc;
`;

const FormTextarea = styled.textarea`
  width: 98%;
  padding: 10px;
  border-radius: 5px;
  border: 1px solid #ccc;
  height: 100px;
`;

const FormSelect = styled.select`
  width: 100%;
  padding: 10px;
  border-radius: 5px;
  border: 1px solid #ccc;
`;

const FormActions = styled.div`
  display: flex;
  justify-content: left;
  width: 100%;
`;

const SubmitButton = styled(Button)`
  width: 100%;
  background-color: #4caf50;
  color: white;
  &:hover {
    background-color: #45a049;
  }
`;

const AddButton = styled(Button)`
  margin-top: 10px;
  background-color: #4caf50;
  color: white;
  &:hover {
    background-color: #45a049;
  }
`;

const Spacer = styled.div`
  margin-top: 20px;
`;

const SignatoryGroup = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 15px; /* Added gap between signatories */
`;


const SignatoryRemoveIcon = styled.span`
  cursor: pointer;
  margin-left: 10px;
  color: #f44336;
`;

const AdminDocumentRC = () => {
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [type, setType] = useState('');
  const [requestType, setRequestType] = useState(''); // New state for Request type (Creation, Deletion, Revision)
  const [signatories, setSignatories] = useState(['']);
  const [availableSignatories, setAvailableSignatories] = useState([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarErrorOpen, setSnackbarErrorOpen] = useState(false);
  const [currentSignatory, setCurrentSignatory] = useState(null);

  const auth = getAuth(); // Get auth instance

  useEffect(() => {
    const fetchSignatories = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'users'));
        const signatoriesList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          fullName: doc.data().fullName || 'Unnamed',
          department: doc.data().department || 'No Department'
        }));
        setAvailableSignatories(signatoriesList);
      } catch (error) {
        console.error("Error fetching signatories:", error);
        setErrorMessage("Error fetching signatories.");
        setSnackbarErrorOpen(true);
      }
    };

    fetchSignatories();
  }, []);

  const handleFileChange = (e) => {
    setAttachments(Array.from(e.target.files));
  };

  const handleSignatoryChange = (index, value) => {
    const updatedSignatories = [...signatories];
    updatedSignatories[index] = value; // Save UID instead of full name
    setSignatories(updatedSignatories);
  };

  const handleAddSignatory = () => {
    setSignatories([...signatories, '']);
  };

  const handleRemoveSignatory = (index) => {
    const updatedSignatories = signatories.filter((_, i) => i !== index);
    setSignatories(updatedSignatories);
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
    setSnackbarErrorOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    // Check if all signatories are selected
    if (signatories.some(s => s === '') || signatories.length === 0) {
      setErrorMessage("All signatories must be selected.");
      setSnackbarErrorOpen(true);
      return;
    }
  
    try {
      const userUid = auth.currentUser.uid;

      // Fetch the user's department
      const userDocRef = doc(db, 'users', userUid);
      const userDocSnapshot = await getDoc(userDocRef);
      const userDepartment = userDocSnapshot.exists() ? userDocSnapshot.data().department : 'No Department';

      const updatedSignatories = [userUid, ...signatories];
  
      // Create the document with signatories and initial state
      const documentRef = await addDoc(collection(db, 'documents'), {
        subject,
        description,
        type,
        requestType, // Save request type
        signatories: updatedSignatories, // Store UIDs
        documentStatus: 'On Process',
        approval: 0,
        currentSignatory: userUid, // Set the currentSignatory to the uploader (the user who submits the document)
        filePaths: [],
        createdBy: userUid,
        createdAt: serverTimestamp(),
        department: userDepartment,  // Add department field here
      });
  
      const documentId = documentRef.id;
  
      // Upload files and get file paths
      const uploadedFilePaths = await Promise.all(
        attachments.map(async (file) => {
          const fileRef = ref(storage, `documents/${documentId}/${file.name}`);
          await uploadBytes(fileRef, file);
          return `documents/${documentId}/${file.name}`;
        })
      );
  
      // Update the document with file paths
      const docRef = doc(db, 'documents', documentId);
      await updateDoc(docRef, {
        filePaths: uploadedFilePaths
      });
  
      setSuccessMessage("Document successfully created and files uploaded.");
      setSnackbarOpen(true);
  
      // Reset form
      setSubject('');
      setDescription('');
      setAttachments([]);
      setType('');
      setRequestType(''); // Reset request type
      setSignatories(['']);
    } catch (error) {
      console.error("Error submitting document:", error);
      setErrorMessage("Error submitting document.");
      setSnackbarErrorOpen(true);
    }
  };

  // Group signatories by department
  const groupedSignatories = availableSignatories.reduce((acc, user) => {
    const department = user.department || 'Unassigned'; // Default if no department
    if (!acc[department]) {
      acc[department] = [];
    }
    acc[department].push(user);
    return acc;
  }, {});

  return (
    <Container>
      <RightPanel>
        <Typography variant="h4" gutterBottom>
          Document Request Control
        </Typography>
        <DocumentForm onSubmit={handleSubmit}>
          {/* Request Type Dropdown */}
          <FormGroup>
            <label htmlFor="requestType">Request Type</label>
            <FormSelect
              id="requestType"
              value={requestType}
              onChange={(e) => setRequestType(e.target.value)}
              required
            >
              <option value="">Select Type</option>
              <option value="Creation">Creation</option>
              <option value="Deletion">Deletion</option>
              <option value="Revision">Revision</option>
            </FormSelect>
          </FormGroup>

          {/* Type Dropdown */}
          <FormGroup>
            <label htmlFor="type">Document Type</label>
            <FormSelect
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              required
            >
              <option value="">Select Type</option>
              <option value="Policy">Policy</option>
              <option value="Procedure">Procedure</option>
              <option value="Manual">Manual</option>
              <option value="Organizational Profile">Organizational Profile</option>
              <option value="Form">Form</option>
            </FormSelect>
          </FormGroup>

          {/* Subject Input */}
          <FormGroup>
            <label htmlFor="subject">Subject</label>
            <FormInput
              type="text"
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            />
          </FormGroup>

          {/* Description Textarea */}
          <FormGroup>
            <label htmlFor="description">Description</label>
            <FormTextarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </FormGroup>

          {/* Signatories Selection */}
          <FormGroup>
            <label htmlFor="signatories">Select Signatories</label>
            {signatories.map((signatory, index) => (
              <SignatoryGroup key={index}>
                <FormSelect
                  value={signatory}
                  onChange={(e) => handleSignatoryChange(index, e.target.value)}
                >
                  <option value="">Select Signatory</option>
                  {Object.keys(groupedSignatories).map(department => (
                    <optgroup label={department} key={department}>
                      {groupedSignatories[department].map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.fullName}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </FormSelect>
                {index > 0 && (
                  <SignatoryRemoveIcon onClick={() => handleRemoveSignatory(index)}>
                    <RemoveCircleOutlineIcon />
                  </SignatoryRemoveIcon>
                )}
              </SignatoryGroup>
            ))}
            <AddButton type="button" onClick={handleAddSignatory}>
              Add Signatory
            </AddButton>
          </FormGroup>

          <FormActions>
            <SubmitButton type="submit">Submit Document</SubmitButton>
          </FormActions>
        </DocumentForm>

        <Snackbar
          open={snackbarOpen}
          autoHideDuration={6000}
          message={successMessage}
          onClose={handleSnackbarClose}
        />
        <Snackbar
          open={snackbarErrorOpen}
          autoHideDuration={6000}
          message={errorMessage}
          onClose={handleSnackbarClose}
        />
      </RightPanel>
    </Container>
  );
};

export default AdminDocumentRC;
