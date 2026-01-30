import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, User, Activity, Clock, CheckCircle, AlertTriangle, FileText, Plus, Trash2, ScanLine, ArrowLeft } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import QRScanner from '../components/QRScanner';
import arogyaLogo from '../assets/arogya_logo.png';
import Loading from '../components/Loading';

const DoctorDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [queue, setQueue] = useState([]);
    const [currentVisit, setCurrentVisit] = useState(null);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('IN_OPD'); // AVAILABLE, IN_OPD, IN_OT, LEAVE
    const [showScanner, setShowScanner] = useState(false);
    const [pendingVisitId, setPendingVisitId] = useState(null); // Track which visit we are trying to start

    // Consultation State
    const [diagnosis, setDiagnosis] = useState('');
    const [medicines, setMedicines] = useState([{ name: '', dosage: '' }]);
    const [diagnostics, setDiagnostics] = useState([]); // [{ type: 'XRAY', isEmergency: false }]
    const [isEmergency, setIsEmergency] = useState(false);
    const [history, setHistory] = useState([]);
    const [showHistory, setShowHistory] = useState(false);

    useEffect(() => {
        if (user?.id) {
            fetchQueue();
            const interval = setInterval(fetchQueue, 10000);
            return () => clearInterval(interval);
        } else {
            setLoading(false);
        }
    }, [user]);

    // if (loading) return <Loading />;

    const fetchQueue = async () => {
        try {
            const doctorId = user.doctorProfile?.id || user.id; // Fallback if direct mapping (unlikely)

            const res = await axios.get(`/api/opd/${doctorId}/queue`);

            setQueue(res.data);

            // Auto-select first in-progress or waiting
            const inProgress = res.data.find(q => q.status === 'IN_PROGRESS');
            if (inProgress && !currentVisit) {
                // If we have an in-progress visit, load it
                // Ideally we should fetch full visit details here if needed
            }
        } catch (error) {
            console.error('Error fetching queue', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchHistory = async (patientId) => {
        try {
            const res = await axios.get(`/api/patients/${patientId}/history`);
            setHistory(res.data);
            setShowHistory(true);
        } catch (error) {
            toast.error('Could not fetch patient history');
        }
    };

    const handleStatusChange = async (newStatus) => {
        try {
            const doctorId = user.doctorProfile?.id || user.id;
            await axios.put(`/api/opd/${doctorId}/status`, { status: newStatus });
            setStatus(newStatus);
            toast.success(`Status updated to ${newStatus}`);
        } catch (error) {
            toast.error('Error updating status');
        }
    };

    const initiateConsultation = (visitId) => {
        setPendingVisitId(visitId);
        setShowScanner(true);
        toast('Please scan Patient QR Code to verify.', { icon: '📷' });
    };

    const startConsultation = async (visitId) => {
        try {
            const res = await axios.put(`/api/opd/visit/${visitId}/start`);
            setCurrentVisit(res.data.visit);
            fetchQueue();
            // Fetch history when starting
            if (res.data.visit.patientId) {
                fetchHistory(res.data.visit.patientId);
            }
        } catch (error) {
            toast.error(error.response?.data?.error || 'Error starting consultation');
        }
    };

    const completeConsultation = async () => {
        if (!diagnosis) return toast.error('Please enter a diagnosis');

        try {
            await axios.put(`/api/opd/visit/${currentVisit.id}`, {
                status: 'COMPLETED',
                diagnosis,
                medicines: medicines.filter(m => m.name),
                diagnostics: diagnostics.map(d => ({ ...d, isEmergency }))
            });
            toast.success('Consultation Completed');
            setCurrentVisit(null);
            setDiagnosis('');
            setMedicines([{ name: '', dosage: '' }]);
            setDiagnostics([]);
            setIsEmergency(false);
            setShowHistory(false);
            fetchQueue();
        } catch (error) {
            toast.error('Error completing consultation');
        }
    };

    const addMedicine = () => setMedicines([...medicines, { name: '', dosage: '' }]);
    const removeMedicine = (index) => {
        const newMeds = [...medicines];
        newMeds.splice(index, 1);
        setMedicines(newMeds);
    };

    const updateMedicine = (index, field, value) => {
        const newMeds = [...medicines];
        newMeds[index][field] = value;
        setMedicines(newMeds);
    };

    return (
        <div className="flex min-h-screen bg-slate-900 text-white">
            <Toaster position="top-right" />
            <div className="flex w-64 flex-col gap-4 border-r border-slate-700 bg-slate-800 p-6">
                <div className="mb-6 flex items-center justify-center rounded-xl bg-slate-900 p-4">
                    <img src={arogyaLogo} alt="Arogya Logo" className="h-16 object-contain" />
                </div>
                <h2 className="mb-2 flex items-center gap-2 text-xl font-bold text-white"><Activity size={24} /> Doctor Panel</h2>
                <div className="mb-4 rounded-lg bg-blue-900/20 p-4">
                    <p className="text-sm text-blue-300">Welcome,</p>
                    <h3 className="font-bold text-blue-400">{user?.name}</h3>
                    <span className="mt-1 inline-block rounded bg-blue-900/50 px-2 py-1 text-xs text-blue-300">{user?.department}</span>
                </div>

                <div className="mb-6">
                    <label className="mb-2 block text-xs font-bold uppercase text-slate-500">Work Status</label>
                    <select
                        value={status}
                        onChange={(e) => handleStatusChange(e.target.value)}
                        className="w-full rounded border border-slate-600 bg-slate-700 p-2 text-white focus:border-blue-500 focus:outline-none"
                    >
                        <option value="AVAILABLE">Available</option>
                        <option value="IN_OPD">In OPD</option>
                        <option value="IN_OT">In OT</option>
                        <option value="LEAVE">On Leave</option>
                    </select>
                </div>

                <button
                    onClick={() => navigate('/')}
                    className="flex items-center gap-3 rounded-lg px-4 py-3 text-left text-slate-400 transition-colors hover:bg-slate-700 hover:text-white"
                >
                    <ArrowLeft size={18} /> Back to Home
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
                    onScan={(scannedText) => {
                        let hash = scannedText;
                        try {
                            if (scannedText.includes('/visit/')) {
                                hash = scannedText.split('/visit/')[1];
                            }
                        } catch (e) { }

                        if (pendingVisitId) {
                            // Verification Mode
                            const visitToStart = queue.find(q => q.visitId === pendingVisitId);
                            if (visitToStart && (visitToStart.visit.qrCodeHash === hash || hash === pendingVisitId.toString())) { // Loose check for now
                                toast.success('Patient Verified!');
                                startConsultation(pendingVisitId);
                                setPendingVisitId(null);
                                setShowScanner(false);
                            } else {
                                toast.error('QR Code Mismatch! Scan the correct patient slip.');
                            }
                        } else {
                            // General Scan Mode
                            toast.success(`Scanned: ${hash}`);
                            setShowScanner(false);
                        }
                    }}
                    onClose={() => {
                        setShowScanner(false);
                        setPendingVisitId(null);
                    }}
                />
            )}

            <div className="grid flex-1 grid-cols-[350px_1fr] gap-8 p-8">

                {/* Left: Queue List */}
                <div className="flex h-full flex-col overflow-hidden">
                    <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-white">
                        <User size={24} /> Patient Queue
                        <span className="rounded-full bg-blue-900 px-2 py-1 text-sm text-blue-300">{queue.length}</span>
                    </h2>

                    <div className="flex-1 space-y-3 overflow-y-auto pr-2">
                        {queue.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-slate-700 bg-slate-800/50 p-8 text-center text-slate-500">
                                <p>No patients waiting</p>
                            </div>
                        ) : (
                            queue.map(item => (
                                <div
                                    key={item.id}
                                    className={`cursor-pointer rounded-xl border border-slate-700 bg-slate-800 p-4 transition-all hover:bg-slate-700 ${currentVisit?.id === item.visitId ? 'ring-2 ring-blue-500' : ''} ${item.priority > 0 ? 'border-l-4 border-l-red-500 bg-red-950/20' : ''}`}
                                    onClick={() => !currentVisit && initiateConsultation(item.visitId)}
                                >
                                    <div className="mb-2 flex items-start justify-between">
                                        <span className="text-lg font-bold text-blue-400">Token #{item.visit.tokenNumber}</span>
                                        {item.priority > 0 && <span className="rounded bg-red-900 px-2 py-1 text-xs font-bold text-red-100">EMERGENCY</span>}
                                    </div>
                                    <h4 className="font-semibold text-white">{item.visit.patient.name}</h4>
                                    <div className="mt-2 flex items-center justify-between text-sm text-slate-400">
                                        <span>{item.visit.patient.age} yrs / {item.visit.patient.gender || 'N/A'}</span>
                                        <span className={`badge ${item.status === 'WAITING' ? 'text-amber-400' : 'text-green-400'}`}>{item.status}</span>
                                    </div>
                                    {item.status === 'WAITING' && !currentVisit && (
                                        <button
                                            className="mt-3 w-full rounded-lg bg-blue-600 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                                            onClick={(e) => { e.stopPropagation(); initiateConsultation(item.visitId); }}
                                        >
                                            Start Consultation
                                        </button>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Right: Consultation Area */}
                <div className="flex h-full flex-col">
                    {currentVisit ? (
                        <div className="flex flex-1 flex-col rounded-xl border border-slate-700 bg-slate-800 p-6 shadow-xl">
                            <div className="mb-6 flex items-center justify-between border-b border-slate-700 pb-4">
                                <div>
                                    <h2 className="text-2xl font-bold text-white">Consultation: {currentVisit.patient?.name}</h2>
                                    <p className="text-slate-400">Token #{currentVisit.tokenNumber} • Age: {currentVisit.patient?.age}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button className="flex items-center gap-2 rounded bg-slate-700 px-4 py-2 text-white hover:bg-slate-600" onClick={() => setShowHistory(!showHistory)}>
                                        <FileText size={18} /> {showHistory ? 'Hide History' : 'View History'}
                                    </button>
                                    <button className="flex items-center gap-2 rounded bg-green-600 px-6 py-2 font-bold text-white hover:bg-green-700" onClick={completeConsultation}>
                                        <CheckCircle size={18} /> Complete Visit
                                    </button>
                                </div>
                            </div>

                            <div className="grid flex-1 gap-6 md:grid-cols-2">
                                <div className="space-y-6">
                                    {/* Diagnosis */}
                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-slate-400">Diagnosis / Symptoms</label>
                                        <textarea
                                            className="h-32 w-full rounded-lg border border-slate-600 bg-slate-900 p-3 text-white focus:border-blue-500 focus:outline-none"
                                            placeholder="Enter diagnosis notes..."
                                            value={diagnosis}
                                            onChange={(e) => setDiagnosis(e.target.value)}
                                        />
                                    </div>

                                    {/* Medicines */}
                                    <div>
                                        <div className="mb-2 flex items-center justify-between">
                                            <label className="block text-sm font-medium text-slate-400">Prescription</label>
                                            <button className="flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300" onClick={addMedicine}><Plus size={16} /> Add Medicine</button>
                                        </div>
                                        <div className="space-y-2">
                                            {medicines.map((med, idx) => (
                                                <div key={idx} className="flex gap-2">
                                                    <input
                                                        placeholder="Medicine Name"
                                                        className="flex-1 rounded border border-slate-600 bg-slate-900 p-2 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                                                        value={med.name}
                                                        onChange={(e) => updateMedicine(idx, 'name', e.target.value)}
                                                    />
                                                    <input
                                                        placeholder="Dosage"
                                                        className="w-32 rounded border border-slate-600 bg-slate-900 p-2 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                                                        value={med.dosage}
                                                        onChange={(e) => updateMedicine(idx, 'dosage', e.target.value)}
                                                    />
                                                    {medicines.length > 1 && (
                                                        <button className="rounded p-2 text-red-500 hover:bg-red-900/20" onClick={() => removeMedicine(idx)}>
                                                            <Trash2 size={16} />
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    {/* Patient History */}
                                    {showHistory && (
                                        <div className="h-64 overflow-y-auto rounded-lg border border-slate-700 bg-slate-900/50 p-4">
                                            <h4 className="mb-3 flex items-center gap-2 font-bold text-slate-300"><Clock size={16} /> Patient History</h4>
                                            {history.length === 0 ? (
                                                <p className="text-sm text-slate-500">No previous history found.</p>
                                            ) : (
                                                <ul className="space-y-3">
                                                    {history.map(h => (
                                                        <li key={h.id} className="border-b border-slate-700 pb-2 text-sm">
                                                            <div className="mb-1 flex justify-between text-xs text-slate-500">
                                                                <span>{new Date(h.createdAt).toLocaleDateString()}</span>
                                                                <span>Dr. {h.doctor?.user?.name}</span>
                                                            </div>
                                                            <p className="font-medium text-slate-300">{h.diagnosis}</p>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    )}

                                    {/* Diagnostics */}
                                    <div>
                                        <div className="mb-2 flex items-center justify-between">
                                            <label className="text-sm font-medium text-slate-400">Lab / Diagnostics</label>
                                            <label className="flex cursor-pointer items-center gap-2 rounded-full border border-red-900/30 bg-red-900/10 px-3 py-1 transition-colors hover:bg-red-900/20">
                                                <input
                                                    type="checkbox"
                                                    checked={isEmergency}
                                                    onChange={(e) => setIsEmergency(e.target.checked)}
                                                    className="accent-red-500"
                                                />
                                                <span className={`text-xs font-bold ${isEmergency ? 'text-red-400' : 'text-slate-500'}`}>MARK EMERGENCY</span>
                                            </label>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {['X-RAY', 'MRI', 'CT-SCAN', 'BLOOD-TEST', 'URINE-TEST'].map(test => (
                                                <button
                                                    key={test}
                                                    className={`rounded-full border px-3 py-1 text-sm transition-colors ${diagnostics.find(d => d.type === test) ? 'border-blue-500 bg-blue-600 text-white' : 'border-slate-600 bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                                                    onClick={() => {
                                                        const exists = diagnostics.find(d => d.type === test);
                                                        if (exists) {
                                                            setDiagnostics(diagnostics.filter(d => d.type !== test));
                                                        } else {
                                                            setDiagnostics([...diagnostics, { type: test, isEmergency: false }]);
                                                        }
                                                    }}
                                                >
                                                    {test}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex h-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-700 bg-slate-800/50 p-12 text-slate-500">
                            <Activity size={48} className="mb-4 opacity-50" />
                            <h3 className="mb-2 text-xl font-semibold">Ready to Consult</h3>
                            <p>Select a patient from the queue to start consultation.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DoctorDashboard;
