import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './auth';
import { ThemeProvider } from './theme';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Layout } from './Layout';
import { LoginPage } from './pages/LoginPage';
import { BoardPage } from './pages/BoardPage';
import { ListPage } from './pages/ListPage';
import { CompaniesPage } from './pages/CompaniesPage';
import { CompanyPage } from './pages/CompanyPage';
import { ApplicationPage } from './pages/ApplicationPage';
import { JobBoardsPage } from './pages/JobBoardsPage';
import { JobBoardPage } from './pages/JobBoardPage';
import { SankeyPage } from './pages/SankeyPage';
import { AdminUsersPage } from './pages/AdminUsersPage';
import { SettingsPage } from './pages/SettingsPage';
import { ProfilePage } from './pages/ProfilePage';
import './App.css';

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
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
                <Route path="/companies/:id" element={<CompanyPage />} />
                <Route path="/job-boards" element={<JobBoardsPage />} />
                <Route path="/job-boards/:id" element={<JobBoardPage />} />
                <Route path="/admin/users" element={<AdminUsersPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/" element={<Navigate to="/applications/list" replace />} />
              </Route>
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
