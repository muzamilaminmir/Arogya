import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Clock, Activity, ScanLine } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import QRScanner from '../components/QRScanner';
import arogyaLogo from '../assets/arogya_logo.png';
import { socket } from '../socket';
import Loading from '../components/Loading';

const PublicDashboard = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showScanner, setShowScanner] = useState(false);

    const navigate = useNavigate();

    const handleBack = () => {
        navigate('/');
    };

    const fetchData = async () => {
        try {
            // Enforce minimum 1.5s loading time for branding visibility
            const minTime = new Promise(resolve => setTimeout(resolve, 1500));
            const [res] = await Promise.all([
                axios.get('/api/public/dashboard'),
                minTime
            ]);

            if (res.data) {
                setData(res.data);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 30000); // 30s Fallback

        // Real-time Listeners
        socket.on('doctorStatusUpdate', fetchData);
        socket.on('queueUpdate', fetchData);

        return () => {
            clearInterval(interval);
            socket.off('doctorStatusUpdate');
            socket.off('queueUpdate');
        };
    }, []);

    const handleScan = (qrHash) => {
        setShowScanner(false);
        // Extract hash if it's a full URL
        let hash = qrHash;
        try {
            if (qrHash.includes('/visit/')) {
                hash = qrHash.split('/visit/')[1];
            }
        } catch (e) { }
        navigate(`/visit/${hash}`);
    };



    if (loading) return <Loading />;

    return (
        <div className="min-h-screen bg-slate-900 text-white">
            <header className="flex items-center justify-between border-b border-slate-700 bg-slate-800 p-6">
                <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center rounded-lg bg-white/10 p-2 h-12 w-12">
                        <img src={arogyaLogo} alt="Arogya Logo" className="h-full w-full object-contain" />
                    </div>
                    <h1 className="m-0 text-3xl font-bold text-white">AROGYA Live Status</h1>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={handleBack}
                        className="rounded-lg bg-slate-700 px-6 py-3 font-semibold text-white transition-colors hover:bg-slate-600"
                    >
                        Back
                    </button>
                    <button
                        onClick={() => setShowScanner(true)}
                        className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
                    >
                        <ScanLine size={20} /> Scan QR to View Visit
                    </button>
                </div>
            </header>

            <div className="p-8">
                <section className="mb-12">
                    <h2 className="mb-6 text-xl tracking-[2px] text-slate-400 uppercase">👨‍⚕️ OPD Doctors & Queues</h2>
                    <div className="grid grid-cols-[repeat(auto-fit,minmax(350px,1fr))] gap-8">
                        {data.opd.map((doc, index) => (
                            <div key={index} className={`relative overflow-hidden rounded-xl border border-slate-700 bg-slate-800 p-6 ${doc.status === 'AVAILABLE' ? 'border-l-4 border-l-green-500' : 'border-l-4 border-l-amber-500'}`}>
                                <div className="mb-4 flex items-start justify-between">
                                    <div>
                                        <h3 className="m-0 text-2xl font-bold text-white">{doc.name}</h3>
                                        <p className="my-1 text-slate-400">{doc.department}</p>
                                    </div>
                                    <div className={`rounded px-2 py-1 text-sm font-bold ${doc.status === 'AVAILABLE' ? 'bg-green-900 text-green-300' : 'bg-amber-900 text-amber-300'}`}>
                                        {doc.status.replace('_', ' ')}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between rounded-lg bg-slate-900 p-4">
                                    <div>
                                        <span className="block text-sm text-slate-400">Current Token</span>
                                        <strong className="text-4xl text-blue-500">{doc.currentToken}</strong>
                                    </div>
                                    <div className="text-right">
                                        <span className="block text-sm text-slate-400">Waiting</span>
                                        <strong className="text-2xl text-white">{doc.queueLength}</strong>
                                    </div>
                                    <div className="text-right">
                                        <span className="block text-sm text-slate-400">Room</span>
                                        <strong className="text-2xl text-white">{doc.room}</strong>
                                    </div>
                                </div>

                                {doc.delay_reason && (
                                    <div className="mt-4 rounded bg-amber-950 p-2 text-sm text-amber-400">
                                        ⚠️ {doc.delay_reason}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </section >

                <section>
                    <h2 className="mb-6 text-xl tracking-[2px] text-slate-400 uppercase">🧪 Diagnostics & Labs</h2>
                    <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-8">
                        {Object.entries(data.diagnostics).map(([type, stats]) => (
                            <div key={type} className="rounded-xl border border-slate-700 bg-slate-800 p-6 text-white">
                                <h3 className="mb-4 text-xl font-bold text-blue-500">{type}</h3>
                                <div className="flex gap-8">
                                    <div>
                                        <span className="block text-sm text-slate-400">Waiting</span>
                                        <strong className="text-3xl text-white">{stats.count}</strong>
                                    </div>
                                    <div>
                                        <span className="block text-sm text-slate-400">Current Token</span>
                                        <strong className="text-3xl text-green-500">{stats.currentToken}</strong>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            {showScanner && (
                <QRScanner
                    onScan={handleScan}
                    onClose={() => setShowScanner(false)}
                />
            )}
        </div >
    );
};

export default PublicDashboard;
