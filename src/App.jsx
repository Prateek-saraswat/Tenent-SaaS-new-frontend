import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoutes';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
// import './index.css';

// Main App Component
function App() {
    return (
        <Router>
            <AuthProvider>
                <div className="App">
                    <Routes>
                        {/* Public Routes */}
                        <Route path="/login" element={
                            <ProtectedRoute requireAuth={false}>
                                <Login />
                            </ProtectedRoute>
                        } />
                        
                        <Route path="/register" element={
                            <ProtectedRoute requireAuth={false}>
                                <Register />
                            </ProtectedRoute>
                        } />
                        
                        {/* Protected Routes */}
                        <Route path="/dashboard/*" element={
                            <ProtectedRoute>
                                <Dashboard />
                            </ProtectedRoute>
                        } />
                        
                        {/* Default Route */}
                        <Route path="/" element={<Navigate to="/dashboard" replace />} />
                        
                        {/* Catch all - redirect to dashboard if authenticated, else to login */}
                        <Route path="*" element={
                            <ProtectedRoute>
                                <Navigate to="/dashboard" replace />
                            </ProtectedRoute>
                        } />
                    </Routes>
                </div>
            </AuthProvider>
        </Router>
    );
}

export default App;