import React, { useEffect, useState } from 'react';
import { Box, Typography, Grid, Paper, TextField, FormHelperText } from '@mui/material';
import { Doughnut, Bar } from 'react-chartjs-2';
import { Chart, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { db } from '../config/firebaseConfig'; // Adjust path to your Firebase config
import { collection, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom'; // Import useNavigate hook
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { InputAdornment } from '@mui/material';

// Register the required components
Chart.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const Dashboard = () => {
  const [donutData, setDonutData] = useState(null);
  const [barData, setBarData] = useState(null);
  const [departmentData, setDepartmentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [startDateError, setStartDateError] = useState(null); // To manage start date error
  const [endDateError, setEndDateError] = useState(null); // To manage end date error
  const navigate = useNavigate(); // Hook to programmatically navigate

  // Calculate date limits (25 years from today in both directions)
  const today = new Date();
  const minDate = new Date(today.getFullYear() - 25, today.getMonth(), today.getDate());
  const maxDate = new Date(today.getFullYear() + 25, today.getMonth(), today.getDate());

  const handleDateChange = (newDate, setDate, setError) => {
    // Validate the date to ensure it's within the valid range
    if (newDate && (newDate < minDate || newDate > maxDate)) {
      setError('Date must be within the past 25 years and the next 25 years.');
    } else {
      setError(null); // Clear error if the date is valid
    }
    setDate(newDate);
  };

  // Event handler for donut chart click
  const handleDonutClick = (event, chartElement) => {
    if (chartElement && chartElement.length > 0) {
      const segmentIndex = chartElement[0].index;
      const segmentLabel = donutData.labels[segmentIndex]; // Get the label of the clicked segment

      // Navigate to the documents page with the filter
      navigate(`/documents?documentType=${segmentLabel.toLowerCase()}`);
    }
  };

  // Event handler for bar chart click
  const handleBarClick = (event, chartElement) => {
    if (chartElement && chartElement.length > 0) {
      const barIndex = chartElement[0].index;
      const department = barData.labels[barIndex]; // Get the label of the clicked bar

      // Navigate to the documents page with the filter
      navigate(`/documents?department=${department.toLowerCase()}`);
    }
  };

  const fetchData = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'documents')); // Replace 'documents' with your collection name
      const documents = querySnapshot.docs.map((doc) => doc.data());

      // Filter documents by date range
      const filteredDocuments = documents.filter((doc) => {
        const createdAt = doc.createdAt?.toDate(); // Assuming createdAt is a Firestore timestamp
        if (!createdAt) return false;
        return (
          (!startDate || createdAt >= startDate) &&
          (!endDate || createdAt <= endDate)
        );
      });

      // Count documents by type
      const typeCounts = filteredDocuments.reduce((acc, doc) => {
        const type = doc.type || 'Unspecified'; // Handle missing types
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {});

      // Prepare donut data
      const types = Object.keys(typeCounts);
      const counts = Object.values(typeCounts);
      const donutChartData = {
        labels: types,
        datasets: [
          {
            label: 'Document Types',
            data: counts,
            backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'],
            hoverBackgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'],
          },
        ],
      };

      // Calculate monthly and ongoing counts for bar chart
      const uploadedThisMonth = filteredDocuments.filter((doc) => {
        const createdAt = doc.createdAt?.toDate();
        const now = new Date();
        return (
          createdAt &&
          createdAt.getMonth() === now.getMonth() &&
          createdAt.getFullYear() === now.getFullYear()
        );
      }).length;

      const ongoingCount = filteredDocuments.filter((doc) => doc.documentStatus === 'On Process').length;

      const barChartData = {
        labels: ['Uploaded this Month', 'Ongoing'],
        datasets: [
          {
            label: 'Requests/Documents',
            data: [uploadedThisMonth, ongoingCount],
            backgroundColor: ['#36A2EB', '#FFCE56'],
            hoverBackgroundColor: ['#36A2EB', '#FFCE56'],
          },
        ],
      };

      // Count documents by department
      const departmentCounts = filteredDocuments.reduce((acc, doc) => {
        const department = doc.department || 'Unspecified'; // Handle missing department
        acc[department] = (acc[department] || 0) + 1;
        return acc;
      }, {});

      const departments = Object.keys(departmentCounts);
      const departmentCountsData = Object.values(departmentCounts);

      const departmentChartData = {
        labels: departments,
        datasets: [
          {
            label: 'Documents Submitted by Department',
            data: departmentCountsData,
            backgroundColor: '#4BC0C0',
            hoverBackgroundColor: '#36A2EB',
          },
        ],
      };

      // Update state with chart data
      setDonutData(donutChartData);
      setBarData(barChartData);
      setDepartmentData(departmentChartData);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [startDate, endDate]); // Refetch data whenever date range changes

  if (loading) {
    return <Typography>Loading...</Typography>;
  }

  if (!donutData || !barData || !departmentData) {
    return <Typography>No data available.</Typography>;
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ padding: 3, backgroundColor: '#ffffff', minHeight: '100vh' }}>
        <Typography variant="h4" gutterBottom color="primary">
          Dashboard
        </Typography>
        
        {/* Date Pickers */}
        <Grid container spacing={3} sx={{ marginBottom: 3 }}>
          <Grid item xs={12} sm={6}>
            <DatePicker
              label="Start Date"
              value={startDate}
              onChange={(newDate) => handleDateChange(newDate, setStartDate, setStartDateError)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  fullWidth
                  error={Boolean(startDateError)}
                  helperText={startDateError}
                  sx={{
                    '& .MuiInputBase-root': {
                      borderColor: startDateError ? 'red' : 'initial',
                    },
                  }}
                />
              )}
              minDate={minDate}
              maxDate={maxDate}
            />
            {startDateError && (
              <FormHelperText error>{startDateError}</FormHelperText>
            )}
          </Grid>
          <Grid item xs={12} sm={6}>
            <DatePicker
              label="End Date"
              value={endDate}
              onChange={(newDate) => handleDateChange(newDate, setEndDate, setEndDateError)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  fullWidth
                  error={Boolean(endDateError)}
                  helperText={endDateError}
                  sx={{
                    '& .MuiInputBase-root': {
                      borderColor: endDateError ? 'red' : 'initial',
                    },
                  }}
                />
              )}
              minDate={minDate}
              maxDate={maxDate}
            />
            {endDateError && (
              <FormHelperText error>{endDateError}</FormHelperText>
            )}
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          {/* First Chart: Donut Chart */}
          <Grid item xs={12} sm={6}>
            <Paper elevation={3} sx={{ borderRadius: 2, padding: 2, backgroundColor: 'white' }}>
              <Typography variant="h6" gutterBottom>
                Document Types
              </Typography>
              <Doughnut data={donutData} options={{ responsive: true }} onElementsClick={handleDonutClick} />
            </Paper>
          </Grid>

          {/* Second Chart: Bar Chart (Monthly and Ongoing) */}
          <Grid item xs={12} sm={6}>
            <Paper elevation={3} sx={{ borderRadius: 2, padding: 2, backgroundColor: 'white' }}>
              <Typography variant="h6" gutterBottom>
                Monthly and Ongoing Documents
              </Typography>
              <Bar data={barData} options={{ responsive: true }} onElementsClick={handleBarClick} />
            </Paper>
          </Grid>

          {/* Third Chart: Department-wise Bar Chart */}
          <Grid item xs={12}>
            <Paper elevation={3} sx={{ borderRadius: 2, padding: 2, backgroundColor: 'white' }}>
              <Typography variant="h6" gutterBottom>
                Documents by Department
              </Typography>
              <Bar data={departmentData} options={{ responsive: true }} />
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </LocalizationProvider>
  );
};

export default Dashboard;
