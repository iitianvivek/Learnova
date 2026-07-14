import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Search from './pages/Search';
import Compare from './pages/Compare';
import InstituteProfile from './pages/InstituteProfile';
import TutorProfile from './pages/TutorProfile';
import StudentDashboard from './pages/dashboard/StudentDashboard';
import InstituteDashboard from './pages/dashboard/InstituteDashboard';
import TutorDashboard from './pages/dashboard/TutorDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import NotFound from './pages/NotFound';
import Terms from './pages/Terms';

function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { user, isAuthenticated, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles && user && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function AppContent() {
  const { loading } = useAuth();
  const location = useLocation();
  const hideNavbar = ['/login', '/register'].includes(location.pathname);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading...</div>;

  return (
    <>
      {!hideNavbar && <Navbar />}
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<Search />} />
        <Route path="/compare" element={<Compare />} />
        <Route path="/institute/:id" element={<InstituteProfile />} />
        <Route path="/tutor/:id" element={<TutorProfile />} />
        <Route path="/dashboard/student" element={<ProtectedRoute roles={['student']}><StudentDashboard /></ProtectedRoute>} />
        <Route path="/dashboard/institute" element={<ProtectedRoute roles={['institute']}><InstituteDashboard /></ProtectedRoute>} />
        <Route path="/dashboard/tutor" element={<ProtectedRoute roles={['tutor']}><TutorDashboard /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/terms" element={<Terms />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}
