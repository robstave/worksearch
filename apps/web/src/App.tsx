import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './auth';
import { Layout } from './Layout';
import { LoginPage } from './pages/LoginPage';
import { BoardPage } from './pages/BoardPage';
import { ListPage } from './pages/ListPage';
import { CompaniesPage } from './pages/CompaniesPage';
import { ApplicationPage } from './pages/ApplicationPage';
import { JobBoardsPage } from './pages/JobBoardsPage';
import { JobBoardPage } from './pages/JobBoardPage';
import { SankeyPage } from './pages/SankeyPage';
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
            <Route path="/applications/:id" element={<ApplicationPage />} />
            <Route path="/analytics/sankey" element={<SankeyPage />} />
            <Route path="/companies" element={<CompaniesPage />} />
            <Route path="/job-boards" element={<JobBoardsPage />} />
            <Route path="/job-boards/:id" element={<JobBoardPage />} />
            <Route path="/" element={<Navigate to="/applications/board" replace />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
