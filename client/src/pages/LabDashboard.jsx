import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { LogOut, Activity, CheckCircle, Clock, ScanLine } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import QRScanner from '../components/QRScanner';
import arogyaLogo from '../assets/arogya_logo.png';
import Loading from '../components/Loading';

const LabDashboard = () => {
    const { logout } = useAuth();
    const [queue, setQueue] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showScanner, setShowScanner] = useState(false);
    const [filter, setFilter] = useState('ALL');

    const [verifyingTest, setVerifyingTest] = useState(null);

    const fetchQueue = async () => {
        try {
            const res = await axios.get('/api/diagnostics/queue');
            setQueue(res.data);
        } catch (error) {
            console.error('Error fetching lab queue', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQueue();
        const interval = setInterval(fetchQueue, 10000);
        return () => clearInterval(interval);
    }, []);

    const initiateVerification = (test) => {
        setVerifyingTest(test);
        setShowScanner(true);
        toast('Scan Patient QR to verify identity', { icon: '📷' });
    };

    const handleScan = async (scannedData) => {
        // Extract Hash if URL
        let hash = scannedData;
        if (scannedData.includes('/visit/')) {
            hash = scannedData.split('/visit/')[1];
        }

        if (verifyingTest) {
            // Check if QR matches the patient visit QR
            // verifyTest.visit.qrCodeHash comes from the include in backend
            // But we need to make sure we are asking for it.
            // In diagnosticController > getDiagnosticQueue > include visit: true. 
            // Visit entity covers qrCodeHash.

            // Allow override if Emergency? No, even emergency needs correct patient scan.
            // Queue Order is handled by backend.

            // Loose verification (if hash matches visit hash)
            if (verifyingTest.visit.qrCodeHash === hash || hash.includes(verifyingTest.visitId.toString())) {
                try {
                    await axios.put(`/api/diagnostics/${verifyingTest.id}`, { status: 'COMPLETED' });
                    toast.success('Verified! Test Marked Completed.');
                    fetchQueue();
                } catch (error) {
                    toast.error(error.response?.data?.error || 'Validation Failed');
                }
            } else {
                toast.error('Wrong Patient! QR Code does not match.');
            }

            // Cleanup
            setShowScanner(false);
            setVerifyingTest(null);
        } else {
            // General Scan (Just info)
            toast.success(`Scanned: ${hash}`);
            setShowScanner(false);
        }
    };

    const filteredQueue = queue.filter(item => {
        if (filter === 'ALL') return true;
        return item.testType === filter;
    });

    return (
        <div className="flex min-h-screen bg-slate-900 text-white">
            <Toaster position="top-right" />
            <div className="flex w-64 flex-col gap-4 border-r border-slate-700 bg-slate-800 p-6">
                <div className="mb-6 flex items-center justify-center rounded-xl bg-slate-900 p-4">
                    <img src={arogyaLogo} alt="Arogya Logo" className="h-16 object-contain" />
                </div>
                <h2 className="mb-2 flex items-center gap-2 text-xl font-bold text-white"><Activity size={24} /> Lab Panel</h2>
                <button className="flex items-center gap-3 rounded-lg bg-blue-600 px-4 py-3 text-left font-semibold text-white">
                    <Clock size={18} /> Pending Tests
                </button>
                <button
                    onClick={() => setShowScanner(true)}
                    className="flex items-center gap-3 rounded-lg px-4 py-3 text-left text-slate-400 transition-colors hover:bg-slate-700 hover:text-white"
                >
                    <ScanLine size={18} /> Scan QR Code
                </button>
                <button onClick={logout} className="mt-auto flex items-center gap-3 rounded-lg px-4 py-3 text-left text-red-400 transition-colors hover:bg-red-900/20">
                    <LogOut size={18} /> Logout
                </button>
            </div>

            {showScanner && (
                <QRScanner
                    onScan={handleScan}
                    onClose={() => setShowScanner(false)}
                />
            )}

            <div className="flex-1 p-8">
                <h1 className="mb-8 flex items-center gap-4 text-3xl font-bold text-white">
                    <Activity className="text-blue-500" size={32} /> Diagnostic Queue
                </h1>

                <div className="mb-6 flex gap-2">
                    {['ALL', 'X-RAY', 'MRI', 'BLOOD-TEST', 'CT-SCAN', 'URINE-TEST'].map(type => (
                        <button
                            key={type}
                            onClick={() => setFilter(type)}
                            className={`rounded-lg px-4 py-2 text-sm font-bold transition-colors ${filter === type ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'}`}
                        >
                            {type === 'ALL' ? 'All Tests' : type}
                        </button>
                    ))}
                </div>

                <div className="overflow-hidden rounded-xl border border-slate-700 bg-slate-800">
                    <table className="w-full border-collapse text-left">
                        <thead>
                            <tr className="border-b border-slate-700 bg-slate-900/50 text-slate-400">
                                <th className="p-4 font-semibold uppercase tracking-wider">Token</th>
                                <th className="p-4 font-semibold uppercase tracking-wider">Patient</th>
                                <th className="p-4 font-semibold uppercase tracking-wider">Test Type</th>
                                <th className="p-4 font-semibold uppercase tracking-wider">Priority</th>
                                <th className="p-4 font-semibold uppercase tracking-wider">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700 text-white">
                            {filteredQueue.length === 0 ? (
                                <tr><td colSpan="5" className="p-8 text-center text-slate-500">No pending tests.</td></tr>
                            ) : (
                                filteredQueue.map(item => (
                                    <tr key={item.id} className={`transition-colors hover:bg-slate-700/50 ${item.priority > 0 ? 'bg-red-950/20' : ''}`}>
                                        <td className="p-4 text-xl font-bold text-blue-400">#{item.visit.tokenNumber}</td>
                                        <td className="p-4">
                                            <div className="font-bold text-white">{item.visit.patient.name}</div>
                                            <div className="text-sm text-slate-400">Age: {item.visit.patient.age}</div>
                                        </td>
                                        <td className="p-4"><span className="rounded bg-slate-700 px-2 py-1 font-mono text-sm font-bold text-blue-200">{item.testType}</span></td>
                                        <td className="p-4">
                                            {item.priority > 0 ? (
                                                <span className="rounded bg-red-900 px-2 py-1 text-xs font-bold text-red-100">URGENT</span>
                                            ) : (
                                                <span className="text-sm text-slate-400">Normal</span>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <button
                                                className="flex items-center gap-2 rounded bg-blue-600 px-4 py-2 font-bold text-white hover:bg-blue-700"
                                                onClick={() => initiateVerification(item)}
                                            >
                                                <ScanLine size={16} /> Process
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default LabDashboard;
