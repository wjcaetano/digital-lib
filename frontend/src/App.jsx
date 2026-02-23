import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import BooksPage from './pages/BooksPage';
import UsersPage from './pages/UsersPage';
import LoansPage from './pages/LoansPage';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/books" element={<BooksPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/loans" element={<LoansPage />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
