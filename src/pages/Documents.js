import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom'; // Import useLocation hook
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSearch,
  faFileAlt,
  faFileInvoice,
  faClipboardList,
  faFileContract,
  faCheckCircle,
  faHourglassHalf,
  faTimesCircle,
  faEye,
  faDownload,
  faSpinner,
} from '@fortawesome/free-solid-svg-icons';
import styled from 'styled-components';
import { db } from '../config/firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Modal from '@mui/material/Modal';

// Styled Components
const Container = styled.div`
  padding: 20px;
  max-width: 100%;
  background-color: #f9f9f9;
  border-radius: 12px;
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.25);
  display: flex;
  flex-direction: column;
  height: calc(100vh - 40px);
`;

const Heading = styled.h1`
  font-size: 32px;
  margin-bottom: 20px;
  color: #333;
  text-align: center;
`;

const SearchBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
`;

const Input = styled.input`
  flex: 1;
  padding: 12px;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 16px;
  max-width: 400px;
  width: 100%;
  margin-right: 10px;
`;

const SearchIcon = styled(FontAwesomeIcon)`
  color: #888;
  font-size: 24px;
`;

const DropdownContainer = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
`;

const Dropdown = styled.select`
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 16px;
  flex: 1;
  margin-right: 10px;

  &:last-child {
    margin-right: 0;
  }
`;

const DocumentsList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding-top: 20px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 10px;
`;

const NoResultsMessage = styled.p`
  text-align: center;
  color: #888;
  font-size: 18px;
`;

const StyledCard = styled(Card)`
  width: 220px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  }
`;

const IconWrapper = styled.div`
  display: flex;
  align-items: center;
`;

const ActionIcons = styled.div`
  display: flex;
  justify-content: space-around;
  margin-top: auto;
  padding: 10px;
`;

const Loader = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
`;

const ModalContainer = styled.div`
  padding: 20px;
  background-color: white;
  border-radius: 8px;
  max-width: 1400px;  // Increased maximum width
  width: 90%;          // Responsive width
  margin: auto;        // Center the modal
  max-height: 95vh;    // Increased height limit
  overflow-y: auto;    // Allow vertical scrolling if content exceeds height
`;

const Documents = () => {
  const [filters, setFilters] = useState({
    searchTerm: '',
    documentType: '',
    department: '',
    approval: '',
    status: '',
  });
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [fileUrl, setFileUrl] = useState('');
  const [fileLoading, setFileLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const location = useLocation(); // Hook to access query parameters

  // Extract query parameters from URL
  const queryParams = new URLSearchParams(location.search);
  const documentTypeFilter = queryParams.get('documentType');
  const departmentFilter = queryParams.get('department');

  const storage = getStorage();

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const documentsCollection = collection(db, 'documents');
        const documentSnapshot = await getDocs(documentsCollection);
        const docs = documentSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Apply filters based on the query params
        const filteredDocs = docs.filter(doc => {
          const matchesType = documentTypeFilter ? doc.type.toLowerCase() === documentTypeFilter.toLowerCase() : true;
          const matchesDepartment = departmentFilter ? doc.department.toLowerCase() === departmentFilter.toLowerCase() : true;
          return matchesType && matchesDepartment;
        });

        // Extract unique departments
        const uniqueDepartments = [...new Set(docs.map(doc => doc.department?.toLowerCase()).filter(Boolean))];
  
        setDocuments(docs);
        setDepartments(uniqueDepartments); // Save unique departments
      } catch (err) {
        console.error("Error fetching documents:", err);
        setError('Failed to fetch documents. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
  
    fetchDocuments();
  }, []);
  

  const getDocumentIcon = (type) => {
    const icons = {
      report: faFileAlt,
      invoice: faFileInvoice,
      memo: faClipboardList,
      policy: faFileContract,
    };
    return icons[type] ? <FontAwesomeIcon icon={icons[type]} /> : null;
  };

  const getStatusIcon = (status) => {
    const statusIcons = {
      approved: faCheckCircle,
      pending: faHourglassHalf,
      rejected: faTimesCircle,
    };
    return statusIcons[status] ? <FontAwesomeIcon icon={statusIcons[status]} /> : null;
  };

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = doc.subject && doc.subject.toLowerCase().includes(filters.searchTerm.toLowerCase());
    const matchesType = filters.documentType ? doc.type.toLowerCase() === filters.documentType.toLowerCase() : true;
    const matchesDepartment = filters.department ? doc.department.toLowerCase() === filters.department.toLowerCase() : true;
    const matchesApproval = filters.approval ? (doc.approval && doc.approval.toLowerCase() === filters.approval.toLowerCase()) : true;
    const matchesStatus = filters.status ? doc.status.toLowerCase() === filters.status.toLowerCase() : true;
    
  
    return matchesSearch && matchesType && matchesDepartment && matchesApproval && matchesStatus;
    return doc && doc.someProperty && doc.someProperty.toLowerCase().includes(searchQuery.toLowerCase());
  });
  
  
  


  const handleViewFile = async (filePaths) => {
    if (!filePaths || filePaths.length === 0) {
      alert("File path is not available. Please check the document data.");
      return;
    }
  
    setFileLoading(true);
    try {
      const fileRef = ref(storage, filePaths[0]); // Get the first file
      const url = await getDownloadURL(fileRef);
      
      // Check if the file is a .docx
      if (filePaths[0].endsWith('.docx')) {
        // Modify the URL to use Google Docs Viewer for docx files
        setFileUrl(`https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`);
      } else {
        setFileUrl(url);
      }
      setModalOpen(true);
    } catch (err) {
      console.error("Error getting file URL:", err);
      alert("Failed to load the document. Please try again later.");
    } finally {
      setFileLoading(false);
    }
  };
  

  const handleDownloadFile = async (filePaths) => {
    if (!filePaths || filePaths.length === 0) {
      alert("File path is not available. Please check the document data.");
      return;
    }

    try {
      const fileRef = ref(storage, filePaths[0]); // Get the first file
      const url = await getDownloadURL(fileRef);
      const link = document.createElement('a');
      link.href = url;
      link.download = filePaths[0].split('/').pop(); // Use the filename from the path
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Error downloading file:", err);
      alert("Failed to download the document. Please try again later.");
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => {
        console.log("Updated filters:", { ...prev, [name]: value });
        return { ...prev, [name]: value };
    });
};
  

  return (
    <Container>
      <Heading>Documents</Heading>
      <SearchBar>
        <Input
          type="text"
          placeholder="Search documents..."
          name="searchTerm"
          value={filters.searchTerm}
          onChange={handleFilterChange}
        />
        <SearchIcon icon={faSearch} />
      </SearchBar>
      <DropdownContainer>
        <Dropdown name="documentType" value={filters.documentType} onChange={handleFilterChange}>
        <option value="">Type of Document</option>
        <option value="form">Form</option>
        <option value="manual">Manual</option>
        <option value="organizational profile">Organizational Profile</option>
        <option value="policy">Policy</option>
        <option value="procedure">Procedure</option>
      </Dropdown>

        <Dropdown name="department" value={filters.department} onChange={handleFilterChange}>
        <option value="">Department</option>
        {departments.map(dept => (
          <option key={dept} value={dept}>
            {dept.charAt(0).toUpperCase() + dept.slice(1)} {/* Capitalize for display */}
          </option>
        ))}
        </Dropdown>


        <Dropdown name="approval" value={filters.approval} onChange={handleFilterChange}>
          <option value="">Approval</option>
          <option value="approved">Approved</option>
          <option value="pending">Pending</option>
          <option value="rejected">Rejected</option>
        </Dropdown>

        <Dropdown name="status" value={filters.status} onChange={handleFilterChange}>
          <option value="">Status</option>
          <option value="active">Active</option>
          <option value="outdated">Outdated</option>
          <option value="archived">Archived</option>
        </Dropdown>
      </DropdownContainer>
      <DocumentsList>
        {loading ? (
          <Loader>
            <FontAwesomeIcon icon={faSpinner} spin size="2x" />
          </Loader>
        ) : error ? (
          <NoResultsMessage>{error}</NoResultsMessage>
        ) : filteredDocuments.length > 0 ? (
          filteredDocuments.map(doc => (
            <Box key={doc.id}>
              <StyledCard variant="outlined">
                <CardContent>
                  <IconWrapper>
                    {getDocumentIcon(doc.type)}
                    <Typography variant="h5" component="div" sx={{ marginLeft: 1, fontSize: '16px' }}>
                      {doc.subject || 'Untitled Document'}
                    </Typography>
                  </IconWrapper>
                  <Typography gutterBottom sx={{ color: 'text.secondary', fontSize: '14px' }}>
                    Department: {doc.department || 'N/A'}
                  </Typography>
                  <Typography sx={{ color: 'text.secondary', mb: 1.5, fontSize: '14px' }}>
                    Type: {doc.type || 'N/A'}
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: '12px' }}>
                    Description: {doc.description || 'No description available.'}
                    <br />
                    Amount: {doc.amount || 'N/A'}
                    <br />
                    Status: {getStatusIcon(doc.documentStatus)} {doc.documentStatus || 'N/A'}
                    <br />
                    Document Status: {doc.status !== undefined ? doc.status : 'N/A'}
                  </Typography>
                </CardContent>
                <ActionIcons>
                  <IconButton size="small" onClick={() => handleViewFile(doc.filePaths)}>
                    <FontAwesomeIcon icon={faEye} />
                  </IconButton>
                  {doc.type && doc.type.toLowerCase() === 'form' && (
                    <IconButton size="small" onClick={() => handleDownloadFile(doc.filePaths)}>
                      <FontAwesomeIcon icon={faDownload} />
                    </IconButton>
                  )}
                </ActionIcons>

              </StyledCard>
            </Box>
          ))
        ) : (
          <NoResultsMessage>No documents found matching your search.</NoResultsMessage>
        )}
      </DocumentsList>

      {/* Modal for viewing the document */}
      <Modal 
        open={modalOpen} 
        onClose={() => setModalOpen(false)} 
        aria-labelledby="modal-title" 
        aria-describedby="modal-description"
        disableScrollLock
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ModalContainer>
          <Typography variant="h6" component="h2" id="modal-title">Document Preview</Typography>
          {fileLoading ? (
            <Loader>
              <FontAwesomeIcon icon={faSpinner} spin size="2x" />
            </Loader>
          ) : (
<iframe
  src={fileUrl}
  width="100%"
  height="600px"
  title="Document Preview"
  style={{ border: 'none' }}
></iframe>

          )}
        </ModalContainer>
      </Modal>
    </Container>
  );
};

export default Documents