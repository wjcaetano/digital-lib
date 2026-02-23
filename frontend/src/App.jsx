import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import BooksPage from './pages/BooksPage';
import UsersPage from './pages/UsersPage';
import LoansPage from './pages/LoansPage';
import LoginPage from './pages/LoginPage';

const ProtectedRoute = ({ children }) => {
  const { signed, loading } = useAuth();
  if (loading) return null;
  return signed ? children : <Navigate to="/login" replace />;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route path="/" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
          <Route path="/books" element={<ProtectedRoute><Layout><BooksPage /></Layout></ProtectedRoute>} />
          <Route path="/users" element={<ProtectedRoute><Layout><UsersPage /></Layout></ProtectedRoute>} />
          <Route path="/loans" element={<ProtectedRoute><Layout><LoansPage /></Layout></ProtectedRoute>} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
