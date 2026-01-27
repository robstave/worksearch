import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './auth';
import { Layout } from './Layout';
import { LoginPage } from './pages/LoginPage';
import { BoardPage } from './pages/BoardPage';
import { ListPage } from './pages/ListPage';
import { CompaniesPage } from './pages/CompaniesPage';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<Layout />}>
            <Route path="/applications/board" element={<BoardPage />} />
            <Route path="/applications/list" element={<ListPage />} />
            <Route path="/companies" element={<CompaniesPage />} />
            <Route path="/" element={<Navigate to="/applications/board" replace />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
