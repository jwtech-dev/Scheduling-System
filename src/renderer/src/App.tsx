import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Suspense, lazy, useEffect } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { DepartmentProvider } from './contexts/DepartmentContext'
import { ErrorBoundary } from './components/ErrorBoundary'
import { ToastProvider } from './components/ToastProvider'
import { ConfirmDialogProvider } from './components/ConfirmDialog'
import { SignatoriesModalProvider } from './components/SignatoriesModal'
import AppShell from './components/AppShell'

// Lazy-loaded pages for code splitting
const SetupPage = lazy(() => import('./pages/SetupPage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const SchedulePage = lazy(() => import('./pages/SchedulePage'))
const ExamsPage = lazy(() => import('./pages/ExamsPage'))
const RoomsPage = lazy(() => import('./pages/RoomsPage'))
const RoomDetailPage = lazy(() => import('./pages/RoomDetailPage'))
const SectionsPage = lazy(() => import('./pages/SectionsPage'))
const SectionDetailPage = lazy(() => import('./pages/SectionDetailPage'))
const PersonnelPage = lazy(() => import('./pages/PersonnelPage'))
const PersonnelDetailPage = lazy(() => import('./pages/PersonnelDetailPage'))
const SubjectBankPage = lazy(() => import('./pages/SubjectBankPage'))
const AcademicYearsPage = lazy(() => import('./pages/AcademicYearsPage'))
const AcademicYearDetailPage = lazy(() => import('./pages/AcademicYearDetailPage'))
const CalendarPage = lazy(() => import('./pages/CalendarPage'))
const TemplatesPage = lazy(() => import('./pages/TemplatesPage'))

const AuditPage = lazy(() => import('./pages/AuditPage'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))
const TrashPage = lazy(() => import('./pages/TrashPage'))

// Loading skeleton for lazy-loaded pages
function LoadingSkeleton(): JSX.Element {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50">
      <div className="animate-pulse text-surface-400 text-sm">Loading...</div>
    </div>
  )
}

function AppRoutes(): JSX.Element {
  const { isAuthenticated, isLoading, needsSetup, login, checkSetup } = useAuth()

  if (isLoading) {
    return <LoadingSkeleton />
  }

  if (needsSetup) {
    return (
      <Suspense fallback={<LoadingSkeleton />}>
        <Routes>
          <Route path="*" element={<SetupPage />} />
        </Routes>
      </Suspense>
    )
  }

  if (!isAuthenticated) {
    return (
      <Suspense fallback={<LoadingSkeleton />}>
        <Routes>
          <Route path="*" element={<LoginPage onLogin={login} />} />
        </Routes>
      </Suspense>
    )
  }

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      // Escape — dispatch custom event for pages to close forms/panels
      if (e.key === 'Escape') {
        // Don't interfere when a modal/dialog is handling Escape itself
        const target = e.target as HTMLElement
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
          // Blur the input so the form can decide what to do
          target.blur()
          return
        }
        window.dispatchEvent(new CustomEvent('app:escape'))
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <DepartmentProvider>
      <AppShell>
        <Suspense fallback={<LoadingSkeleton />}>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/schedule" element={<SchedulePage />} />
            <Route path="/exams" element={<ExamsPage />} />
            <Route path="/rooms" element={<RoomsPage />} />
            <Route path="/rooms/:roomId" element={<RoomDetailPage />} />
            <Route path="/sections" element={<SectionsPage />} />
            <Route path="/sections/:sectionCode" element={<SectionDetailPage />} />
            <Route path="/personnel" element={<PersonnelPage />} />
            <Route path="/personnel/:employeeId" element={<PersonnelDetailPage />} />
            <Route path="/subject-bank" element={<SubjectBankPage />} />
            <Route path="/academic-years" element={<AcademicYearsPage />} />
            <Route path="/academic-years/:ayId" element={<AcademicYearDetailPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/templates" element={<TemplatesPage />} />

            <Route path="/audit" element={<AuditPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/trash" element={<TrashPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </AppShell>
    </DepartmentProvider>
  )
}

function App(): JSX.Element {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <ConfirmDialogProvider>
          <SignatoriesModalProvider>
            <AuthProvider>
              <HashRouter>
                <AppRoutes />
              </HashRouter>
            </AuthProvider>
          </SignatoriesModalProvider>
        </ConfirmDialogProvider>
      </ToastProvider>
    </ErrorBoundary>
  )
}

export default App
