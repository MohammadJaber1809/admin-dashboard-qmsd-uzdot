import React, { useEffect, useState } from 'react';
import { Box, Typography, Card, CardContent, Button, Modal, Select, MenuItem, FormControl, InputLabel, TextField, Snackbar, Alert } from '@mui/material';
import { collection, getDoc, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import { Tooltip, IconButton } from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import StepLabel from '@mui/material/StepLabel';
import ColorlibConnector from '../components/StepIcons/ColorlibConnector';
import ColorlibStepIcon from '../components/StepIcons/ColorlibStepIcon';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';
import Loader from '@mui/material/CircularProgress';
import { getAuth } from 'firebase/auth';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';

const AdminDocumentRCL = () => {
  const [documents, setDocuments] = useState([]);
  const [signatories, setSignatories] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [fileUrl, setFileUrl] = useState('');
  const [fileLoading, setFileLoading] = useState(false);
  const [selectedSignatory, setSelectedSignatory] = useState('');
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [googleDocsLink, setGoogleDocsLink] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success'); // 'success' or 'error'
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [maturityDates, setMaturityDates] = useState({});


  const storage = getStorage();
  const auth = getAuth();
  const currentUserUid = auth.currentUser ? auth.currentUser.uid : null; // Get the current user's UID
  

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'documents'));
        const docsList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setDocuments(docsList);
      } catch (error) {
        console.error("Error fetching documents:", error);
      }
    };

    const fetchSignatories = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'users'));
        const signatoriesList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          fullName: doc.data().fullName || 'Unnamed',
          department: doc.data().department || 'No Department',
        }));
        setSignatories(signatoriesList);
      } catch (error) {
        console.error("Error fetching signatories:", error);
      }
    };

    const fetchUserRole = async () => {
      if (currentUserUid) {
        try {
          const userDocRef = doc(db, 'users', currentUserUid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            if (userData.role === 'SuperAdmin' || userData.role === 'Admin') {
              setIsSuperAdmin(true); // Set to true if the user is a SuperAdmin
            }
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
        }
      }
    };

    fetchDocuments();
    fetchSignatories();
    fetchUserRole();
  }, [currentUserUid]);


  const handleDocumentSelection = (docId) => {
    // Ensure a document is selected before enabling the functionality
    const document = documents.find((doc) => doc.id === docId);
    if (document) {
      setSelectedDocument(document);
    }
  };

  const handleDateChange = (docId, newDate) => {
    if (newDate instanceof Date && !isNaN(newDate)) {
      const currentDate = new Date();
      if (newDate <= currentDate) {
        setSnackbarSeverity('error');
        setSnackbarMessage('Maturity date must be in the future.');
        setSnackbarOpen(true);
  
        // Clear invalid date in the state
        setMaturityDates((prevDates) => ({
          ...prevDates,
          [docId]: null,
        }));
        return; 
      }
  
      // If valid, update the maturityDates state
      setMaturityDates((prevDates) => ({
        ...prevDates,
        [docId]: newDate,
      }));
    } else {
      console.error("Invalid date selected:", newDate);
    }
  };
  
  const handleMaturityDateChange = async (docId) => {
    if (selectedDocument) {
      try {
        const updatedDocuments = documents.map(doc => {
          if (doc.id === docId) {  // Make sure docId is being passed here
            return {
              ...doc,
              maturityDates: maturityDates[docId] ? maturityDates[docId].toISOString() : doc.maturityDates,
            };
          }
          return doc;
        });
  
        setDocuments(updatedDocuments);
  
        const docRef = doc(db, 'documents', docId); // Ensure docId is passed here
        await updateDoc(docRef, { 
          maturityDates: maturityDates[docId] ? maturityDates[docId].toISOString() : selectedDocument.maturityDates 
        });
  
        setSnackbarSeverity('success');
        setSnackbarMessage('Maturity date updated successfully!');
        setSnackbarOpen(true);
      } catch (error) {
        console.error("Error updating maturity date:", error);
        setSnackbarSeverity('error');
        setSnackbarMessage('Unable to update maturity date. Please try again later.');
        setSnackbarOpen(true);
      }
    }
  };
  
  
  
  const handleDocumentPreview = async (doc) => {
    if (doc.googleDocsUrl) {
      setFileLoading(true);
      try {
        setSelectedDocument(doc);
        setFileUrl(doc.googleDocsUrl);
        setModalOpen(true);
      } catch (error) {
        console.error("Error displaying Google Docs URL:", error);
        alert('Unable to retrieve document. Please try again later.');
      } finally {
        setFileLoading(false);
      }
    } else if (doc.filePaths && doc.filePaths.length > 0) {
      setFileLoading(true);
      try {
        const fileRef = ref(storage, doc.filePaths[0]);
        const url = await getDownloadURL(fileRef);
        setSelectedDocument(doc);
  
        if (doc.filePaths[0].endsWith('.docx')) {
          const googleDocsUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
          setFileUrl(googleDocsUrl);
        } else if (doc.filePaths[0].endsWith('.pdf')) {
          setFileUrl(url);
        } else {
          alert("Preview is not supported for this file type. You can download it instead.");
          return;
        }
  
        setModalOpen(true);
      } catch (error) {
        console.error("Error fetching document URL:", error);
        alert('Unable to retrieve document. Please try again later.');
      } finally {
        setFileLoading(false);
      }
    } else {
      alert('No file URL found for this document.');
    }
  };
  
  const handleStatusChange = async () => {
    if (selectedDocument && selectedSignatory) {
      if (selectedDocument.currentSignatory !== currentUserUid) {
        setSnackbarSeverity('error');
        setSnackbarMessage('You are not authorized to change the status of this document.');
        setSnackbarOpen(true);
        return;
      }
  
      if (!selectedDocument.signatories.includes(selectedSignatory)) {
        setSnackbarSeverity('error');
        setSnackbarMessage('Selected signatory is not a valid signatory for this document.');
        setSnackbarOpen(true);
        return;
      }

          // Check if Google Docs URL is valid (basic validation)
    const googleDocsUrlRegex = /^https:\/\/docs\.google\.com\/.*$/;
    if (googleDocsLink && !googleDocsUrlRegex.test(googleDocsLink)) {
      setSnackbarSeverity('error');
      setSnackbarMessage('Invalid Google Docs link. Please enter a valid URL.');
      setSnackbarOpen(true);
      return;
    }
  
      // Find the current signatory index and the next signatory index
      const currentSignatoryIndex = selectedDocument.signatories.indexOf(selectedDocument.currentSignatory);
      const selectedSignatoryIndex = selectedDocument.signatories.indexOf(selectedSignatory);
  
      // Only the current signatory can approve or make changes
      if (selectedStatus === 'Approved') {
        // Ensure the selected signatory is the next signatory in the sequence
        if (selectedSignatoryIndex !== currentSignatoryIndex + 1) {
          setSnackbarSeverity('error');
          setSnackbarMessage('Approval can only be given to the next signatory.');
          setSnackbarOpen(true);
          return;
        }
      }
  
      // For "For Revision" or "Disapproved" statuses, ensure it's a previous signatory
      if (selectedStatus === 'For Revision' || selectedStatus === 'Disapproved') {
        if (selectedSignatoryIndex > currentSignatoryIndex) {
          setSnackbarSeverity('error');
          setSnackbarMessage('For Revision and Disapprove can only be set for previous signatories.');
          setSnackbarOpen(true);
          return;
        }
      }
  
      try {
        const updatedDocuments = documents.map(doc => {
          if (doc.id === selectedDocument.id) {
            return {
              ...doc,
              approval: selectedStatus,
              currentSignatory: selectedSignatory,
              googleDocsUrl: googleDocsLink || doc.googleDocsUrl,  // Update Google Docs URL if provided
              // Removed maturityDates handling from here
            };
          }
          return doc;
        });
  
        setDocuments(updatedDocuments);
  
        const docRef = doc(db, 'documents', selectedDocument.id);
        const updateData = {
          approval: selectedStatus,
          currentSignatory: selectedSignatory,
          googleDocsUrl: googleDocsLink || selectedDocument.googleDocsUrl, // Update Google Docs URL if provided
        };
  
        await updateDoc(docRef, updateData);
  
        setSnackbarSeverity('success');
        setSnackbarMessage('Document status updated successfully!');
        setSnackbarOpen(true);
        setModalOpen(false);
      } catch (error) {
        console.error("Error updating document approval:", error);
        setSnackbarSeverity('error');
        setSnackbarMessage(`Unable to update document approval. Error: ${error.message}`);
        setSnackbarOpen(true);
      }
    } else {
      setSnackbarSeverity('error');
      setSnackbarMessage('Please select a signatory and a status.');
      setSnackbarOpen(true);
    }
  };
  

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Document Request Control
      </Typography>
      <div className="admindocumentrcl-document-list">
  {documents.length === 0 ? (
    <p>No documents available.</p>
  ) : (
    documents.map((doc) => {
      // Check if the user is a signatory or a SuperAdmin
      const userIsSignatory = doc.signatories.includes(currentUserUid);
      const userCanView = userIsSignatory || isSuperAdmin;

      if (!userCanView) return null; // Skip rendering if the user is neither a signatory nor a SuperAdmin

      const userCanEdit = (doc.status === 0 || doc.status === 1);
      const currentStepIndex = doc.signatories.indexOf(doc.currentSignatory);

      return (
        <Card key={doc.id} variant="outlined" sx={{ marginBottom: 2 }}>
          <CardContent>
            <Typography variant="h6">{doc.subject}</Typography>
            <Typography>Description: {doc.description}</Typography>
            <Typography>Type: {doc.type}</Typography>

            <Stepper activeStep={currentStepIndex} alternativeLabel connector={<ColorlibConnector />}>
              {doc.signatories.map((signatoryId, index) => {
                const signatory = signatories.find((s) => s.id === signatoryId);
                return (
                  <Step key={index}>
                    <StepLabel StepIconComponent={ColorlibStepIcon}>
                      {signatory ? `${signatory.fullName} - ${signatory.department}` : 'Unknown Signatory'}
                    </StepLabel>
                  </Step>
                );
              })}
            </Stepper>
            <Button
              variant="contained"
              sx={{
                marginTop: 2,
                width: '100%',
                backgroundColor: userCanEdit ? '#4CAF50' : '#2196F3',
                '&:hover': { backgroundColor: userCanEdit ? '#45a049' : '#1976D2' },
              }}
              onClick={() => handleDocumentPreview(doc)}
              disabled={false} // Always allow view action
            >
              {userCanEdit ? 'Update Status' : 'View Document'}
            </Button>
          </CardContent>
        </Card>
      );
    })
  )}
</div>


      <Modal 
  open={modalOpen} 
  onClose={() => setModalOpen(false)} 
  aria-labelledby="modal-title" 
  aria-describedby="modal-description"
  sx={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }}
>
  <div style={{
    padding: 20, 
    backgroundColor: 'white', 
    borderRadius: 8, 
    maxWidth: '70%',   
    width: '70%',      
    maxHeight: '95vh',  
    overflowY: 'auto',  
  }}>
    <Typography variant="h6" component="h2" id="modal-title">Document Preview</Typography>

    {fileLoading ? (
      <Loader />
    ) : (
      <iframe 
        src={fileUrl} 
        width="100%" 
        height="600px" 
        title="Document Preview"
      ></iframe>
    )}

    <Box position="relative" width="100%">
      <TextField
        label="Google Docs Link"
        variant="outlined"
        fullWidth
        value={googleDocsLink}
        onChange={(e) => setGoogleDocsLink(e.target.value)}
        disabled={selectedDocument && selectedDocument.currentSignatory !== currentUserUid}
        sx={{ marginBottom: 2 }}
      />

      <Tooltip title={
          <div>
            <p>1. Open the document via the pop-out button</p>
            <p>2. Open with Google Docs on the Google Doc Viewer Tab</p>
            <p>3. Click the share button on the top right of Google Docs Tab</p>
            <p>4. Copy the link and paste it here</p>
          </div>
        } arrow sx={{ fontSize: '1.2rem', position: 'absolute', right: 10, top: '40%', transform: 'translateY(-50%)' }}>
        <IconButton>
          <InfoIcon />
        </IconButton>
      </Tooltip>
    </Box>

      <FormControl fullWidth sx={{ marginBottom: 2 }}>
        <InputLabel id="status-select-label">Select Status</InputLabel>
        <Select
          labelId="status-select-label"
          id="status-select"
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
        >
          <MenuItem value="Approved">Approve</MenuItem>
          <MenuItem value="For Revision">For Revision</MenuItem>
          <MenuItem value="Disapproved">Disapprove</MenuItem>
        </Select>
      </FormControl>
      
      <FormControl fullWidth sx={{ marginBottom: 2 }}>
  <InputLabel id="signatory-select-label">Select Signatory</InputLabel>
  <Select
    labelId="signatory-select-label"
    id="signatory-select"
    value={selectedSignatory}
    onChange={(e) => setSelectedSignatory(e.target.value)}
  >
    {selectedDocument &&
      selectedDocument.signatories.map((signatoryId) => {
        const signatory = signatories.find((s) => s.id === signatoryId);
        return (
          <MenuItem key={signatoryId} value={signatoryId}>
            {signatory ? `${signatory.fullName} - ${signatory.department}` : 'Unknown Signatory'}
          </MenuItem>
        );
      })}
  </Select>
</FormControl>


      <Button
        variant="contained"
        onClick={handleStatusChange}
        disabled={!selectedSignatory || !selectedStatus}
      >
        Update Status
      </Button>

{/* DatePicker for the selected document, visible only to SuperAdmin */}
{selectedDocument && isSuperAdmin && (
  <Box sx={{ marginTop: 2 }}>
<LocalizationProvider dateAdapter={AdapterDateFns}>
  <DatePicker
    label="Maturity Date"
    value={maturityDates[selectedDocument?.id] || null}
    minDate={new Date(new Date().setFullYear(new Date().getFullYear() - 25))} // 25 years in the past
    maxDate={new Date(new Date().setFullYear(new Date().getFullYear() + 25))} // 25 years in the future
    onChange={(newDate) => handleDateChange(selectedDocument.id, newDate)}
    renderInput={(params) => (
      <TextField
        {...params}
        error={
          (params.error || // Default error from the picker
          (maturityDates[selectedDocument?.id] &&
            (new Date(maturityDates[selectedDocument?.id]).getFullYear() < new Date().getFullYear() - 25 ||
             new Date(maturityDates[selectedDocument?.id]).getFullYear() > new Date().getFullYear() + 25)))
        }
        helperText={
          (params.helperText || // Default helper text from the picker
          (maturityDates[selectedDocument?.id] &&
            (new Date(maturityDates[selectedDocument?.id]).getFullYear() < new Date().getFullYear() - 25
              ? 'Date cannot be earlier than 25 years ago.'
              : new Date(maturityDates[selectedDocument?.id]).getFullYear() > new Date().getFullYear() + 25
              ? 'Date cannot be later than 25 years in the future.'
              : '')))
        }
      />
    )}
  />
</LocalizationProvider>


    <Button
      variant="contained"
      onClick={() => handleMaturityDateChange(selectedDocument.id)}
      disabled={
        !maturityDates[selectedDocument.id] || // Check if no date is selected
        isNaN(new Date(maturityDates[selectedDocument.id]).getTime()) || // Ensure date is valid
        new Date(maturityDates[selectedDocument.id]).setHours(0, 0, 0, 0) <= // Compare only date (not time)
          new Date().setHours(0, 0, 0, 0) // Today's date
      }
      sx={{ marginTop: 2 }}
    >
      Set Maturity Date
    </Button>
  </Box>
)}

  </div>
</Modal>

      {/* Snackbar for confirmation */}
      <Snackbar 
        open={snackbarOpen} 
        autoHideDuration={6000} 
        onClose={() => setSnackbarOpen(false)}
      >
        <Alert 
          onClose={() => setSnackbarOpen(false)} 
          severity={snackbarSeverity} 
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AdminDocumentRCL;
