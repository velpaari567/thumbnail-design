import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import TemplatesPage from './pages/TemplatesPage';
import RequirementsPage from './pages/RequirementsPage';
import TimingPage from './pages/TimingPage';
import PaymentPage from './pages/PaymentPage';
import GenerationPage from './pages/GenerationPage';
import CreditStorePage from './pages/CreditStorePage';
import AdminPage from './pages/AdminPage';
import QRPaymentPage from './pages/QRPaymentPage';
import PaymentNotification from './components/PaymentNotification';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        color: 'var(--text-secondary)'
      }}>
        <div className="spinner" style={{ width: 32, height: 32 }}></div>
      </div>
    );
  }

  if (!user) return <Navigate to="/" replace />;
  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/home" element={
        <ProtectedRoute><Navbar /><HomePage /></ProtectedRoute>
      } />
      <Route path="/templates" element={
        <ProtectedRoute><Navbar /><TemplatesPage /></ProtectedRoute>
      } />
      <Route path="/requirements" element={
        <ProtectedRoute><Navbar /><RequirementsPage /></ProtectedRoute>
      } />
      <Route path="/timing" element={
        <ProtectedRoute><Navbar /><TimingPage /></ProtectedRoute>
      } />
      <Route path="/payment" element={
        <ProtectedRoute><Navbar /><PaymentPage /></ProtectedRoute>
      } />
      <Route path="/generating" element={
        <ProtectedRoute><Navbar /><GenerationPage /></ProtectedRoute>
      } />
      <Route path="/credits" element={
        <ProtectedRoute><Navbar /><CreditStorePage /></ProtectedRoute>
      } />
      <Route path="/admin" element={
        <ProtectedRoute><Navbar /><AdminPage /></ProtectedRoute>
      } />
      <Route path="/pay" element={
        <ProtectedRoute><Navbar /><QRPaymentPage /></ProtectedRoute>
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <PaymentNotification />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
