import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, User, ArrowRight } from 'lucide-react';
import arogyaLogo from '../assets/arogya_logo.png';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const user = await login(username, password);
            if (user.role === 'RECEPTIONIST') navigate('/reception');
            else if (user.role === 'DOCTOR') navigate('/doctor');
            else if (user.role === 'LAB_TECH') navigate('/lab');
            else if (user.role === 'ADMIN') navigate('/admin');
        } catch (err) {
            setError('Invalid username or password');
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-900 p-4">
            <div className="w-full max-w-md overflow-hidden rounded-2xl bg-slate-800 shadow-xl border border-slate-700">
                <div className="bg-blue-600 p-8 text-center">
                    <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-xl bg-white p-3 shadow-lg">
                        <img src={arogyaLogo} alt="Logo" className="h-full w-full object-contain" />
                    </div>
                    <h2 className="text-2xl font-bold text-white">AROGYA Login</h2>
                    <p className="mt-2 text-sm text-blue-100">Access the Hospital Management System</p>
                </div>

                <div className="p-8">
                    {error && (
                        <div className="mb-6 flex items-center gap-2 rounded-lg border border-red-900/50 bg-red-950/30 p-3 text-sm text-red-400">
                            <span className="font-bold">Error:</span> {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-300">Username</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full rounded-lg border border-slate-600 bg-slate-900 pl-10 p-3 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                                    placeholder="Enter your username"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-300">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full rounded-lg border border-slate-600 bg-slate-900 pl-10 p-3 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        <button type="submit" className="flex w-full justify-center rounded-lg bg-blue-600 py-3 font-bold text-white transition-colors hover:bg-blue-700 disabled:opacity-50" disabled={loading}>
                            {loading ? 'Authenticating...' : (
                                <span className="flex items-center gap-2">Login <ArrowRight size={18} /></span>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <button onClick={() => navigate('/')} className="text-sm text-slate-500 hover:text-blue-400">
                            ← Back to Launch Screen
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
