import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';

import LaunchScreen from './pages/LaunchScreen';
import PublicDashboard from './pages/PublicDashboard';
import Login from './pages/Login';
import ReceptionDashboard from './pages/ReceptionDashboard';

import DoctorDashboard from './pages/DoctorDashboard';
import LabDashboard from './pages/LabDashboard';
import './index.css';

import { AuthProvider } from './context/AuthContext';

import PatientDashboard from './pages/PatientDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';

import { socket } from './socket';

function App() {
    useEffect(() => {
        // Global Alert Listeners
        socket.on('connect', () => console.log('Connected to global socket'));

        socket.on('emergencyAlert', (data) => {
            toast.error(data.message, {
                duration: 10000,
                icon: '🚨',
                style: {
                    border: '2px solid red',
                    padding: '16px',
                    color: '#D8000C',
                    background: '#FFBABA',
                },
            });
            // Play sound if possible
            const audio = new Audio('/emergency.mp3'); // Try to play warning sound
            audio.play().catch(e => console.log('Audio play failed', e));
        });

        socket.on('inactivityAlert', (data) => {
            // This might target specific doctor, but global listen is fine for now if we filter in component or just show generic
            // ideally we check user ID, but for now show to everyone logged in or rely on doctor panel listener
            // Actually, let's show it as a warning
            toast(data.message, {
                icon: '⚠️',
                duration: 8000,
                style: {
                    border: '1px solid #F59E0B',
                    background: '#FEF3C7',
                    color: '#92400E',
                }
            });
        });

        socket.on('adminAlert', (data) => {
            // Can be filtered by role in real app
            console.log('Admin Alert:', data);
        });

        return () => {
            socket.off('emergencyAlert');
            socket.off('inactivityAlert');
            socket.off('adminAlert');
        };
    }, []);

    return (
        <AuthProvider>
            <BrowserRouter>
                <div className="app-container">
                    <Toaster position="top-right" />
                    <Routes>
                        <Route path="/" element={<LaunchScreen />} />
                        <Route path="/public" element={<PublicDashboard />} />
                        <Route path="/visit/:qrHash" element={<PatientDashboard />} />
                        <Route path="/login" element={<Login />} />

                        {/* Protected Routes */}
                        <Route path="/reception" element={
                            <ProtectedRoute roles={['RECEPTIONIST', 'ADMIN']}>
                                <ReceptionDashboard />
                            </ProtectedRoute>
                        } />
                        <Route path="/doctor" element={
                            <ProtectedRoute roles={['DOCTOR', 'ADMIN']}>
                                <DoctorDashboard />
                            </ProtectedRoute>
                        } />
                        <Route path="/lab" element={
                            <ProtectedRoute roles={['LAB_TECH', 'ADMIN']}>
                                <LabDashboard />
                            </ProtectedRoute>
                        } />
                        <Route path="/admin" element={
                            <ProtectedRoute roles={['ADMIN']}>
                                <AdminDashboard />
                            </ProtectedRoute>
                        } />
                    </Routes>
                </div>
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;
