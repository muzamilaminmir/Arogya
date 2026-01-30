import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, roles }) => {
    const { user } = useAuth();

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (roles && !roles.includes(user.role)) {
        // Redirect to appropriate dashboard based on actual role
        if (user.role === 'DOCTOR') return <Navigate to="/doctor" replace />;
        if (user.role === 'RECEPTIONIST') return <Navigate to="/reception" replace />;
        if (user.role === 'LAB_TECH') return <Navigate to="/lab" replace />;
        if (user.role === 'ADMIN') return <Navigate to="/admin" replace />;
        return <Navigate to="/" replace />;
    }

    return children;
};

export default ProtectedRoute;
