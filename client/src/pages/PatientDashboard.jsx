import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Lock, Clock, Users, Activity, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { socket } from '../socket';
import arogyaLogo from '../assets/arogya_logo.png';
import Loading from '../components/Loading';

const PatientDashboard = () => {
    const { qrHash } = useParams();
    const navigate = useNavigate();
    const [visit, setVisit] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isLocked, setIsLocked] = useState(false);
    const [password, setPassword] = useState('');
    const [unlocking, setUnlocking] = useState(false);

    const fetchVisit = async (pwd = null) => {
        try {
            setLoading(true);
            // Enforce minimum 1.5s loading time for branding visibility
            const minTime = new Promise(resolve => setTimeout(resolve, 1500));

            const headers = pwd ? { 'x-visit-password': pwd } : {};
            const [res] = await Promise.all([
                axios.get(`/api/visits/scan/${qrHash}`, { headers }),
                minTime
            ]);

            setVisit(res.data);
            setIsLocked(false);
            setError('');
        } catch (err) {
            if (err.response && err.response.status === 401) {
                setIsLocked(true);
            } else if (err.response && err.response.status === 403) {
                setError('Incorrect Date of Birth. Please try again.');
                setIsLocked(true);
            } else {
                setError('Invalid QR Code or Visit Not Found');
            }
        } finally {
            setLoading(false);
            setUnlocking(false);
        }
    };

    useEffect(() => {
        fetchVisit(password || undefined); // Pass password if we have it (for updates)

        socket.on('queueUpdate', () => {
            // Only refetch if not locked
            if (!isLocked) fetchVisit(password || undefined);
        });
        socket.on('doctorStatusUpdate', () => {
            if (!isLocked) fetchVisit(password || undefined);
        });

        return () => {
            socket.off('queueUpdate');
            socket.off('doctorStatusUpdate');
        };
    }, [qrHash]);

    const handleUnlock = (e) => {
        e.preventDefault();
        setUnlocking(true);
        fetchVisit(password);
    };



    if (loading && !unlocking) return <Loading />;

    if (isLocked) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-900 p-4">
                <button onClick={() => navigate(-1)} className="absolute top-4 left-4 flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2 text-white hover:bg-slate-700">
                    <ArrowLeft size={20} /> Back
                </button>
                <div className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-800 p-8 shadow-xl text-center">
                    <div className="mb-6 mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-900/50 text-blue-400">
                        <Lock size={32} />
                    </div>
                    <h2 className="mb-2 text-2xl font-bold text-white">Protected Visit</h2>
                    <p className="mb-6 text-slate-400">Enter your Date of Birth to access this dashboard.</p>

                    <form onSubmit={handleUnlock} className="space-y-4">
                        <div>
                            <input
                                type="date"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full rounded-lg border border-slate-600 bg-slate-700 p-3 text-center text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none"
                            />
                        </div>
                        {error && <p className="text-sm text-red-400">{error}</p>}
                        <button
                            type="submit"
                            disabled={unlocking}
                            className="w-full rounded-lg bg-blue-600 px-6 py-3 font-bold text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                            {unlocking ? 'Unlocking...' : 'Unlock Dashboard'}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    if (error) return <div className="flex h-screen items-center justify-center text-xl text-red-400"><h1>❌ {error}</h1></div>;

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-900 p-4">
            <button onClick={() => navigate(-1)} className="absolute top-4 left-4 flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2 text-white hover:bg-slate-700">
                <ArrowLeft size={20} /> Back
            </button>
            <div className="w-full max-w-3xl rounded-xl border border-slate-700 bg-slate-800 p-6 shadow-xl">
                <div className="mb-6 border-b border-slate-700 pb-4 flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <img src={arogyaLogo} alt="Logo" className="h-8 w-8 object-contain" />
                            <h1 className="text-2xl font-bold text-blue-400">AROGYA</h1>
                        </div>
                        <p className="text-slate-400 text-sm">Patient Portal</p>
                    </div>
                    <div className="text-right">
                        <p className="text-slate-400 text-sm">Token</p>
                        <span className="font-mono text-2xl font-bold text-white">#{visit.tokenNumber}</span>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    <div>
                        <label className="mb-1 block text-sm text-slate-400">Patient Name</label>
                        <h3 className="text-xl font-semibold text-white">{visit.patient.name}</h3>
                    </div>
                    <div>
                        <label className="mb-1 block text-sm text-slate-400">Doctor</label>
                        <h3 className="text-lg font-semibold text-white">{visit.doctor.user.name}</h3>
                        <span className="rounded bg-slate-700 px-2 py-1 text-xs text-blue-200">{visit.doctor.department}</span>
                    </div>
                </div>

                <div className="mt-8 rounded-xl bg-slate-900/50 p-6 text-center border border-slate-700">
                    <h2 className="mb-4 text-lg font-bold text-slate-300">Current Status</h2>
                    <div className={`inline-block rounded-full px-6 py-2 text-xl font-bold ${visit.status === 'COMPLETED' ? 'bg-green-900 text-green-200' :
                        visit.status === 'IN_PROGRESS' ? 'bg-yellow-900 text-yellow-200' :
                            'bg-blue-900 text-blue-200'
                        }`}>
                        {visit.status.replace('_', ' ')}
                    </div>
                    {visit.status === 'WAITING' && (
                        <p className="mt-4 text-slate-400">Please wait for your turn. Watch the screen for Token <strong className="text-white">#{visit.tokenNumber}</strong>.</p>
                    )}
                </div>

                {visit.status === 'WAITING' && visit.queue && (
                    <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
                        <div className="rounded-xl border border-slate-700 bg-slate-800 p-4 text-center">
                            <Activity className="mx-auto mb-2 text-blue-400" size={24} />
                            <p className="text-xs text-slate-400">Current Token</p>
                            <p className="text-xl font-bold text-white">{visit.queue.currentToken}</p>
                        </div>
                        <div className="rounded-xl border border-slate-700 bg-slate-800 p-4 text-center">
                            <Users className="mx-auto mb-2 text-amber-400" size={24} />
                            <p className="text-xs text-slate-400">Your Position</p>
                            <p className="text-xl font-bold text-white">#{visit.queue.position}</p>
                        </div>
                        <div className="rounded-xl border border-slate-700 bg-slate-800 p-4 text-center">
                            <Users className="mx-auto mb-2 text-slate-400" size={24} />
                            <p className="text-xs text-slate-400">People Ahead</p>
                            <p className="text-xl font-bold text-white">{visit.queue.tokensAhead}</p>
                        </div>
                        <div className="rounded-xl border border-slate-700 bg-slate-800 p-4 text-center">
                            <Clock className="mx-auto mb-2 text-green-400" size={24} />
                            <p className="text-xs text-slate-400">Est. Wait</p>
                            <p className="text-xl font-bold text-white">{visit.queue.estimatedWaitTime} min</p>
                        </div>
                    </div>
                )}

                {visit.medicines && visit.medicines.length > 0 && (
                    <div className="mt-8 border-t border-slate-700 pt-6">
                        <h3 className="mb-4 text-lg font-bold text-white">💊 Prescribed Medicines</h3>
                        <ul className="space-y-3">
                            {visit.medicines.map((med, i) => (
                                <li key={i} className="flex justify-between rounded bg-slate-700/30 p-3 text-slate-300 border border-slate-700">
                                    <strong className="text-white">{med.medicineName}</strong>
                                    <span>{med.dosage}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PatientDashboard;
