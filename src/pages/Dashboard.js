import React, { useEffect, useState } from 'react';
import { Box, Typography, Grid, Paper, TextField } from '@mui/material';
import { Doughnut, Bar } from 'react-chartjs-2';
import { Chart, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { db } from '../config/firebaseConfig'; // Adjust path to your Firebase config
import { collection, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom'; // Import useNavigate hook
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';

// Register the required components
Chart.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const Dashboard = () => {
  const [donutData, setDonutData] = useState(null);
  const [barData, setBarData] = useState(null);
  const [departmentData, setDepartmentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const navigate = useNavigate(); // Hook to programmatically navigate

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
              onChange={(newDate) => setStartDate(newDate)}
              renderInput={(params) => <TextField {...params} fullWidth />}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <DatePicker
              label="End Date"
              value={endDate}
              onChange={(newDate) => setEndDate(newDate)}
              renderInput={(params) => <TextField {...params} fullWidth />}
            />
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          {/* First Chart: Donut Chart */}
          <Grid item xs={12} sm={6}>
            <Paper elevation={3} sx={{ borderRadius: 2, padding: 2, backgroundColor: 'white' }}>
              <Typography variant="h6" gutterBottom>
                Document Types
              </Typography>
              <Doughnut data={donutData} onClick={handleDonutClick} />
            </Paper>
          </Grid>

          {/* Second Chart: Bar Chart */}
          <Grid item xs={12} sm={6}>
            <Paper elevation={3} sx={{ borderRadius: 2, padding: 2, backgroundColor: 'white' }}>
              <Typography variant="h6" gutterBottom>
                Monthly Document Activity
              </Typography>
              <Bar data={barData} onClick={handleBarClick} />
            </Paper>
          </Grid>

          {/* Third Chart: Department Chart */}
          <Grid item xs={12}>
            <Paper elevation={3} sx={{ borderRadius: 2, padding: 2, backgroundColor: 'white' }}>
              <Typography variant="h6" gutterBottom>
                Documents Submitted by Department
              </Typography>
              <Bar data={departmentData} />
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </LocalizationProvider>
  );
};

export default Dashboard;
