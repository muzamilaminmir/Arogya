import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Printer, UserPlus, Search, LogOut, Save, User, FileText, Activity, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import QRScanner from '../components/QRScanner';
import PrescriptionSlip from '../components/PrescriptionSlip';
import toast, { Toaster } from 'react-hot-toast';
import { socket } from '../socket';
import arogyaLogo from '../assets/arogya_logo.png';
import Loading from '../components/Loading';

const ReceptionDashboard = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '', dob: '', age: '', phone: '', address: '', abha_id: '', doctorId: '', isEmergency: false, isProtected: true
    });
    const [doctors, setDoctors] = useState([]);

    // Loading State
    const [loading, setLoading] = useState(false);

    // Search State
    const [view, setView] = useState('REGISTRATION'); // REGISTRATION, SEARCH
    const [searchResults, setSearchResults] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [showScanner, setShowScanner] = useState(false);

    useEffect(() => {
        fetchDoctors();
        const interval = setInterval(fetchDoctors, 30000);

        socket.on('doctorStatusUpdate', fetchDoctors);
        socket.on('queueUpdate', fetchDoctors);

        return () => {
            clearInterval(interval);
            socket.off('doctorStatusUpdate');
            socket.off('queueUpdate');
        };
    }, []);

    const fetchDoctors = async () => {
        try {
            const res = await axios.get('/api/public/dashboard');
            setDoctors(res.data.opd);
        } catch (error) {
            console.error('Error fetching doctors', error);
        } finally {
            // We can safely set false even if already false
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'phone') {
            const numericValue = value.replace(/\D/g, '').slice(0, 10);
            setFormData({ ...formData, [name]: numericValue });
            return;
        }
        if (name === 'dob') {
            const dobDate = new Date(value);
            const today = new Date();
            let age = today.getFullYear() - dobDate.getFullYear();
            const m = today.getMonth() - dobDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < dobDate.getDate())) {
                age--;
            }
            setFormData({ ...formData, dob: value, age: age.toString() });
            return;
        }
        if (name === 'age') {
            const numericValue = value.replace(/\D/g, '');
            setFormData({ ...formData, [name]: numericValue });
            return;
        }
        setFormData({ ...formData, [name]: value });
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.get('/api/patients/search', { params: { query: searchQuery } });
            setSearchResults(res.data);
            if (res.data.length === 0) toast.error('No patients found');
        } catch (error) {
            toast.error('Search failed');
        }
    };

    const handleRevisit = (patient) => {
        setFormData({
            ...formData,
            name: patient.name,
            age: patient.age,
            phone: patient.phone,
            address: patient.address,
            abha_id: patient.abha_id || '',
            patientId: patient.id,
            isEmergency: false
        });
        setVisit(null);
        setView('REGISTRATION');
        toast.success(`Selected patient: ${patient.name}`);
    };

    // State for visit (missing in previous view? Ah, lines 119 setVisit... where is visit defined?)
    // In Step 901, visit usage: `setVisit(null)` line 119. `!visit` line 320.
    // BUT `visit` state declaration was REMOVED in Step 885!
    // Step 885 output showed:
    // -    const [visit, setVisit] = useState(null);
    // +    const [visit, setVisit] = useState(null); (wait it was kept?)
    // No, Step 885 output:
    // -    const [visit, setVisit] = useState(null);
    // -    const [loading, setLoading] = useState(false);
    // -
    // -    if (loading) return <Loading />;
    // +    const [visit, setVisit] = useState(null);
    // +    const [loading, setLoading] = useState(false);
    // +    const fetchQueue = ...

    // So visit IS THERE?
    // Let's check Step 901 content again.
    // Line 16: formData
    // Line 19: doctors
    // Line 20: fetchQueue...
    // Line 46: view...
    // I DO NOT SEE `visit` state in Step 901 lines 1-46.
    // Line 119: `setVisit(null);`
    // Line 320: `{!visit ? ...`
    // `visit` is MISSING. `setVisit` is MISSING.
    // This file is definitely broken. I need to add `visit` state back.

    const [visit, setVisit] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name || !formData.dob || !formData.phone || !formData.address || !formData.doctorId) {
            toast.error('Please fill all required fields');
            return;
        }
        if (formData.phone.length !== 10) {
            toast.error('Phone number must be exactly 10 digits');
            return;
        }

        setLoading(true);
        try {
            let patientId = formData.patientId;
            if (!patientId) {
                const patientRes = await axios.post('/api/patients', {
                    name: formData.name,
                    dob: formData.dob,
                    age: formData.age,
                    phone: formData.phone,
                    address: formData.address,
                    abha_id: formData.abha_id
                });
                patientId = patientRes.data.id;
            }

            const visitRes = await axios.post('/api/visits', {
                patientId: patientId,
                doctorId: formData.doctorId,
                priority: formData.isEmergency,
                isProtected: formData.isProtected
            });

            setVisit(visitRes.data);
            toast.success('Patient Registered Successfully!');
            setFormData({ name: '', dob: '', age: '', phone: '', address: '', abha_id: '', doctorId: formData.doctorId, isEmergency: false, isProtected: true });
            fetchDoctors();
        } catch (error) {
            toast.error('Error registering patient/visit');
        } finally {
            setLoading(false);
        }
    };

    const printSlip = () => {
        window.print();
    };

    const handlePrintAndNext = () => {
        window.print();
        setTimeout(() => {
            setVisit(null);
            toast.success('Ready for next patient');
        }, 1000);
    };

    // Render Loading
    // if (loading) return <Loading />;

    return (
        <div className="flex min-h-screen bg-slate-900 text-white">
            <Toaster position="top-right" />
            <div className="flex w-64 flex-col gap-4 border-r border-slate-700 bg-slate-800 p-6 print:hidden">
                <div className="mb-6 flex items-center justify-center rounded-xl bg-slate-900 p-4">
                    <img src={arogyaLogo} alt="Arogya Logo" className="h-16 object-contain" />
                </div>
                <h2 className="mb-2 flex items-center gap-2 text-xl font-bold text-white"><UserPlus size={24} /> Reception</h2>
                <button
                    className={`flex items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors ${view === 'REGISTRATION' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-700 hover:text-white'}`}
                    onClick={() => setView('REGISTRATION')}
                >
                    <UserPlus size={18} /> New Registration
                </button>
                <button
                    className={`flex items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors ${view === 'SEARCH' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-700 hover:text-white'}`}
                    onClick={() => setView('SEARCH')}
                >
                    <Search size={18} /> Search Patient
                </button>
                <button onClick={() => navigate('/')} className="mt-auto flex items-center gap-3 rounded-lg px-4 py-3 text-left text-slate-400 transition-colors hover:bg-slate-700 hover:text-white">
                    <ArrowLeft size={18} /> Back to Home
                </button>
                <button onClick={logout} className="flex items-center gap-3 rounded-lg px-4 py-3 text-left text-red-400 transition-colors hover:bg-red-900/20">
                    <LogOut size={18} /> Logout
                </button>
            </div>

            <div className="flex-1 p-8">
                {view === 'SEARCH' && (
                    <div className="rounded-xl border border-slate-700 bg-slate-800 p-6">
                        <h3 className="mb-4 text-xl font-bold text-white">🔍 Search Patient</h3>
                        <div className="grid grid-cols-[3fr_1fr] gap-4">
                            <form onSubmit={handleSearch} style={{ display: 'contents' }}>
                                <input
                                    placeholder="Search by Name, Phone, Token, or QR Hash"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full rounded-lg border border-slate-600 bg-slate-700 p-3 text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none"
                                />
                                <button type="submit" className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700">Search</button>
                            </form>
                        </div>
                        <button className="mt-4 rounded-lg bg-slate-700 px-6 py-2 font-semibold text-white hover:bg-slate-600" onClick={() => setShowScanner(true)}>
                            📷 Scan QR Code
                        </button>

                        <div className="mt-6">
                            {searchResults.length > 0 ? (
                                <table className="w-full border-collapse text-left">
                                    <thead>
                                        <tr className="border-b border-slate-700 text-slate-400">
                                            <th className="p-3">Name</th>
                                            <th className="p-3">Age</th>
                                            <th className="p-3">Phone</th>
                                            <th className="p-3">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-white">
                                        {searchResults.map(p => (
                                            <tr key={p.id} className="border-b border-slate-700 hover:bg-slate-700/50">
                                                <td className="p-3">{p.name}</td>
                                                <td className="p-3">{p.age}</td>
                                                <td className="p-3">{p.phone}</td>
                                                <td className="p-3">
                                                    <button className="rounded bg-slate-600 px-3 py-1 text-sm text-white hover:bg-slate-500" onClick={() => handleRevisit(p)}>
                                                        🔄 New Visit
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <p className="text-slate-400">No patients found.</p>
                            )}
                        </div>
                    </div>
                )}

                {showScanner && (
                    <QRScanner
                        onScan={(scannedText) => {
                            let hash = scannedText;
                            try {
                                if (scannedText.startsWith('http')) {
                                    const url = new URL(scannedText);
                                    const pathParts = url.pathname.split('/');
                                    const visitIndex = pathParts.indexOf('visit');
                                    if (visitIndex !== -1 && pathParts[visitIndex + 1]) {
                                        hash = pathParts[visitIndex + 1];
                                    }
                                } else if (scannedText.includes('/visit/')) {
                                    hash = scannedText.split('/visit/')[1];
                                }
                            } catch (e) { }
                            hash = hash.trim();
                            setSearchQuery(hash);
                            setShowScanner(false);
                            axios.get('/api/patients/search', { params: { query: hash } })
                                .then(res => {
                                    setSearchResults(res.data);
                                    if (res.data.length === 0) toast.error(`No patient found`);
                                    else toast.success('Patient found!');
                                })
                                .catch(err => toast.error('Search failed'));
                        }}
                        onClose={() => setShowScanner(false)}
                    />
                )}

                {view === 'REGISTRATION' && (
                    <>
                        <div className="mb-6 rounded-xl border border-red-900/50 bg-red-950/30 p-6">
                            <h3 className="mb-4 text-xl font-bold text-red-400">🚨 Quick Emergency</h3>
                            <div className="grid grid-cols-[1fr_auto] gap-4">
                                <input
                                    placeholder="Enter Visit ID or Token Number"
                                    id="search-input"
                                    className="rounded-lg border border-slate-600 bg-slate-700 p-3 text-white placeholder-slate-400 focus:border-red-500 focus:outline-none"
                                />
                                <button className="rounded-lg bg-red-600 px-6 py-3 font-bold text-white hover:bg-red-700" onClick={async () => {
                                    const val = document.getElementById('search-input').value;
                                    if (!val) return toast.error("Enter Visit ID");
                                    try {
                                        const reason = prompt("Enter Emergency Reason:");
                                        if (!reason) return;
                                        await axios.put(`/api/opd/visit/${val}/emergency`, { reason });
                                        toast.success("Marked as Emergency!");
                                    } catch (e) {
                                        toast.error("Error: " + (e.response?.data?.error || e.message));
                                    }
                                }}>
                                    Mark Emergency
                                </button>
                            </div>
                        </div>

                        {!visit ? (
                            <div className="rounded-xl border border-slate-700 bg-slate-800 p-8">
                                <h3 className="mb-6 text-2xl font-bold text-white">{formData.patientId ? `Re-Visit: ${formData.name}` : 'New Patient Registration'}</h3>
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-slate-400">Patient Name</label>
                                            <input name="name" placeholder="John Doe" value={formData.name} onChange={handleChange} required disabled={!!formData.patientId}
                                                className="w-full rounded-lg border border-slate-600 bg-slate-700 p-3 text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none" />
                                        </div>
                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-slate-400">Date of Birth (Password)</label>
                                            <input name="dob" type="date" value={formData.dob} onChange={handleChange} required disabled={!!formData.patientId}
                                                className="w-full rounded-lg border border-slate-600 bg-slate-700 p-3 text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none" />
                                            {formData.age && <p className="mt-1 text-xs text-slate-400">Age: {formData.age} years</p>}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-slate-400">Phone Number</label>
                                            <input name="phone" placeholder="9876543210" value={formData.phone} onChange={handleChange} required disabled={!!formData.patientId}
                                                className="w-full rounded-lg border border-slate-600 bg-slate-700 p-3 text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none" />
                                        </div>
                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-slate-400">ABHA ID (Optional)</label>
                                            <input name="abha_id" placeholder="1234-5678-9012" value={formData.abha_id} onChange={handleChange} disabled={!!formData.patientId}
                                                className="w-full rounded-lg border border-slate-600 bg-slate-700 p-3 text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-slate-400">Address</label>
                                        <textarea name="address" placeholder="Full Address" value={formData.address} onChange={handleChange} required disabled={!!formData.patientId} rows="2"
                                            className="w-full rounded-lg border border-slate-600 bg-slate-700 p-3 text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none" />
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-slate-400">Assign Doctor</label>
                                        <select name="doctorId" onChange={handleChange} value={formData.doctorId} required
                                            className="w-full rounded-lg border border-slate-600 bg-slate-700 p-3 text-white focus:border-blue-500 focus:outline-none">
                                            <option value="">Select Doctor</option>
                                            {doctors.map((doc, i) => {
                                                const statusIcon = doc.status === 'AVAILABLE' ? '🟢' : doc.status === 'IN_OPD' ? '🟡' : '🔴';
                                                return (
                                                    <option key={i} value={doc.id || i + 1}>
                                                        {statusIcon} {doc.name} ({doc.department}) - Queue: {doc.queueLength}
                                                    </option>
                                                );
                                            })}
                                        </select>
                                    </div>

                                    <div className="flex items-center gap-3 rounded-lg border border-red-900/50 bg-red-950/20 p-4">
                                        <input
                                            type="checkbox"
                                            id="isEmergency"
                                            name="isEmergency"
                                            checked={formData.isEmergency || false}
                                            onChange={(e) => setFormData({ ...formData, isEmergency: e.target.checked })}
                                            className="h-5 w-5 rounded border-slate-600 bg-slate-700 text-red-600 focus:ring-red-500"
                                        />
                                        <label htmlFor="isEmergency" className="cursor-pointer font-bold text-red-400">🚨 Mark as Emergency Case</label>
                                    </div>

                                    <div className="flex items-center gap-3 rounded-lg border border-blue-900/50 bg-blue-950/20 p-4">
                                        <input
                                            type="checkbox"
                                            id="isProtected"
                                            name="isProtected"
                                            checked={formData.isProtected}
                                            onChange={(e) => setFormData({ ...formData, isProtected: e.target.checked })}
                                            className="h-5 w-5 rounded border-slate-600 bg-slate-700 text-blue-600 focus:ring-blue-500"
                                        />
                                        <div>
                                            <label htmlFor="isProtected" className="cursor-pointer font-bold text-blue-400">🔒 Enable Password Protection</label>
                                            <p className="text-xs text-slate-400">Patient will need DOB to access dashboard</p>
                                        </div>
                                    </div>

                                    <div className="mt-8 flex gap-4">
                                        <button type="submit" className="flex-1 rounded-lg bg-blue-600 px-6 py-3 font-bold text-white hover:bg-blue-700" disabled={loading}>
                                            {loading ? 'Processing...' : 'Generate Token'}
                                        </button>
                                        {formData.patientId && (
                                            <button type="button" className="rounded-lg bg-slate-700 px-6 py-3 font-bold text-white hover:bg-slate-600" onClick={() => setFormData({ name: '', dob: '', age: '', phone: '', address: '', abha_id: '', doctorId: '', isEmergency: false, isProtected: true })}>
                                                Cancel Re-Visit
                                            </button>
                                        )}
                                    </div>
                                </form>
                            </div>
                        ) : (
                            <div className="flex h-full flex-col items-center justify-center p-8">
                                <PrescriptionSlip visit={visit} />
                                <div className="mt-6 flex gap-4 print:hidden">
                                    <button onClick={printSlip} className="flex items-center gap-2 rounded-lg bg-slate-700 px-6 py-3 font-semibold text-white hover:bg-slate-600"><Printer size={18} /> Print Only</button>
                                    <button onClick={handlePrintAndNext} className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"><Save size={18} /> Print & Next Patient</button>
                                    <button onClick={() => setVisit(null)} className="rounded-lg px-6 py-3 font-semibold text-slate-400 hover:text-white">New Registration</button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default ReceptionDashboard;
