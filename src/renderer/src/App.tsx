import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { DepartmentProvider } from './contexts/DepartmentContext'
import AppShell from './components/AppShell'
import SetupPage from './pages/SetupPage'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import SchedulePage from './pages/SchedulePage'
import ExamsPage from './pages/ExamsPage'
import RoomsPage from './pages/RoomsPage'
import SectionsPage from './pages/SectionsPage'
import PersonnelPage from './pages/PersonnelPage'
import AcademicYearsPage from './pages/AcademicYearsPage'
import CalendarPage from './pages/CalendarPage'
import TemplatesPage from './pages/TemplatesPage'
import ImportPage from './pages/ImportPage'
import AuditPage from './pages/AuditPage'
import SettingsPage from './pages/SettingsPage'

function AppRoutes(): JSX.Element {
  const { isAuthenticated, isLoading, needsSetup, login, checkSetup } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50">
        <div className="animate-pulse text-surface-400 text-sm">Loading...</div>
      </div>
    )
  }

  if (needsSetup) {
    return (
      <Routes>
        <Route
          path="*"
          element={
            <SetupPage />
          }
        />
      </Routes>
    )
  }

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="*" element={<LoginPage onLogin={login} />} />
      </Routes>
    )
  }

  return (
    <DepartmentProvider>
      <AppShell>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/schedule" element={<SchedulePage />} />
          <Route path="/exams" element={<ExamsPage />} />
          <Route path="/rooms" element={<RoomsPage />} />
          <Route path="/sections" element={<SectionsPage />} />
          <Route path="/personnel" element={<PersonnelPage />} />
          <Route path="/academic-years" element={<AcademicYearsPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/templates" element={<TemplatesPage />} />
          <Route path="/import" element={<ImportPage />} />
          <Route path="/audit" element={<AuditPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppShell>
    </DepartmentProvider>
  )
}

function App(): JSX.Element {
  return (
    <AuthProvider>
      <HashRouter>
        <AppRoutes />
      </HashRouter>
    </AuthProvider>
  )
}

export default App
