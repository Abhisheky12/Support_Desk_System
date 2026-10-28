import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCurrentUser } from './store/slices/authSlice';
import Navbar from './components/common/Navbar';
import Sidebar from './components/common/Sidebar';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import TicketsPage from './pages/TicketsPage';
import TicketDetailPage from './pages/TicketDetailPage';
import AgentManagementPage from './pages/AgentManagementPage';
import CustomerSubmitPage from './pages/CustomerSubmitPage';
import CustomerTrackPage from './pages/CustomerTrackPage';
import { Toaster } from 'react-hot-toast';

// Staff Route Guard
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useSelector((state) => state.auth);
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export const App = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    if (localStorage.getItem('token')) {
      dispatch(fetchCurrentUser());
    }
  }, [dispatch]);

  const isCustomerRoute = location.pathname.startsWith('/customer');
  const isLoginRoute = location.pathname === '/login';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            background: '#0f172a',
            color: '#f8fafc',
            fontSize: '13px',
            borderRadius: '12px',
            padding: '12px 16px'
          }
        }}
      />

      <Navbar />

      <div className="flex-1 flex">
        {/* Render sidebar only for authenticated staff routes */}
        {isAuthenticated && !isCustomerRoute && !isLoginRoute && <Sidebar />}

        <main className={`flex-1 ${!isCustomerRoute && !isLoginRoute ? 'p-4 sm:p-6 lg:p-8' : ''} max-w-7xl mx-auto w-full`}>
          <Routes>
            {/* Root Route */}
            <Route
              path="/"
              element={
                isAuthenticated ? (
                  <Navigate to="/dashboard" replace />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />

            {/* Auth */}
            <Route path="/login" element={<LoginPage />} />

            {/* Customer Facing Portal */}
            <Route path="/customer/submit" element={<CustomerSubmitPage />} />
            <Route path="/customer/track" element={<CustomerTrackPage />} />

            {/* Staff Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tickets"
              element={
                <ProtectedRoute>
                  <TicketsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tickets/:id"
              element={
                <ProtectedRoute>
                  <TicketDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/agents"
              element={
                <ProtectedRoute>
                  <AgentManagementPage />
                </ProtectedRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default App;

