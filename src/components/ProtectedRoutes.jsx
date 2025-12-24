import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, requireAuth = true }) => {
    const { isAuthenticated, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Loading...</p>
            </div>
        );
    }

    if (requireAuth && !isAuthenticated) {
        // Redirect to login, but save the location they tried to visit
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (!requireAuth && isAuthenticated) {
        // If trying to access login/register while authenticated, redirect to dashboard
        return <Navigate to="/dashboard" replace />;
    }

    return children;
};

export default ProtectedRoute;