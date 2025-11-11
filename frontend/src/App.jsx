// App.jsx - Updated imports to fix export issues
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import Auth from './components/Auth';
import StudentDashboard from './components/dashboards/StudentDashboard';
import ParentDashboard from './components/dashboards/ParentDashboard';
import TeacherDashboard from './components/dashboards/TeacherDashboard';
import { AuthProvider } from './context/AuthContext';
import ThemeProvider from './context/ThemeContext.jsx';
import SimpleThemeProvider from './context/SimpleThemeProvider.jsx';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';
import './theme.css';
// import { Button } from "@/components/ui/button"

function App() {
  return (
    <Router>
      <AuthProvider>
        <SimpleThemeProvider>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<Auth />} />
            <Route
              path="/dashboard/student"
              element={
                <ThemeProvider>
                  <ProtectedRoute allowedRoles={['student']}>
                    <StudentDashboard />
                  </ProtectedRoute>
                </ThemeProvider>
              }
            />
            <Route
              path="/dashboard/parent"
              element={
                <ThemeProvider>
                  <ProtectedRoute allowedRoles={['parent']}>
                    <ParentDashboard />
                  </ProtectedRoute>
                </ThemeProvider>
              }
            />
            <Route
              path="/dashboard/teacher"
              element={
                <ThemeProvider>
                  <ProtectedRoute allowedRoles={['teacher']}>
                    <TeacherDashboard />
                  </ProtectedRoute>
                </ThemeProvider>
              }
            />
          </Routes>
        </SimpleThemeProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
