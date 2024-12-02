import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { auth } from './config/firebaseConfig'; // Firebase authentication
import { onAuthStateChanged } from 'firebase/auth';
import Login from './pages/Login';
import AdminDashboard from './components/AdminDashboard';
import Dashboard from './pages/Dashboard';
import Account from './pages/Account';
import Documents from './pages/Documents';
import DocumentRC from './pages/AdminDocumentRC';
import DocumentRCL from './pages/AdminDocumentRCL';
import AddAccount from './pages/AddAccount';
import ViewAccount from './pages/ViewAccount';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = React.useState(false); // Track authentication state
  const [isRedirecting, setIsRedirecting] = React.useState(true); // Flag to control when to redirect
  const [loading, setLoading] = React.useState(true); // Loading state for auth check

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user); // Set authentication state based on user presence
      setLoading(false); // Stop loading once the check is complete
      setIsRedirecting(false); // Allow routing once authentication state is determined
    });

    return () => unsubscribe(); // Cleanup listener on unmount
  }, []);

  // Show loading screen until auth state is resolved
  if (loading || isRedirecting) {
    return <div>Loading...</div>;
  }

  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Protected routes: Accessible only if authenticated */}
        {isAuthenticated ? (
          <Route path="/dashboard" element={<AdminDashboard />}>
            <Route index element={<Dashboard />} />
            <Route path="account" element={<Account />} />
            <Route path="documents" element={<Documents />} />
            <Route path="drc" element={<DocumentRC />} />
            <Route path="document-request-list" element={<DocumentRCL />} />
            <Route path="add-account" element={<AddAccount />} />
            <Route path="view-accounts" element={<ViewAccount />} />
          </Route>
        ) : (
          // Redirect to login for any protected routes when not authenticated
          <Route path="*" element={<Navigate to="/" />} />
        )}
      </Routes>
    </Router>
  );
};

export default App;
