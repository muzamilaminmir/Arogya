import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { AlertTriangle, Activity, Users, ShieldAlert, LogOut, Plus, Trash2, X, BarChart3, Settings, TrendingUp, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { socket } from '../socket';
import arogyaLogo from '../assets/arogya_logo.png';
import Loading from '../components/Loading';

const AdminDashboard = () => {
    const { logout } = useAuth();
    const [view, setView] = useState('OPERATIONS'); // OPERATIONS, STAFF, LOGS

    const [loading, setLoading] = useState(false);

    // if (loading) return <Loading />;

    // Operations State
    const [stats, setStats] = useState({
        doctors: [],
        queues: { opd: [], diagnostics: [] },
        logs: []
    });
    const [aiStats, setAiStats] = useState({
        load: [],
        diseases: [],
        prescriptions: { doctorPatterns: {}, departmentPatterns: {} },
        activity: []
    });

    // Staff State
    const [staffList, setStaffList] = useState([]);
    const [showAddStaff, setShowAddStaff] = useState(false);
    const [newStaff, setNewStaff] = useState({
        name: '', username: '', password: '', role: 'DOCTOR', department: '', opd_room: ''
    });

    // Feedback State
    const [feedbackList, setFeedbackList] = useState([]);

    const [medStats, setMedStats] = useState({ daily: {}, weekly: {}, monthly: {} });

    // New Analytics State
    const [advancedStats, setAdvancedStats] = useState({ overview: {}, peakData: [], doctorPerf: [] });

    const fetchAdvancedAnalytics = async () => {
        try {
            const [overviewRes, peakRes, docRes] = await Promise.all([
                axios.get('/api/analytics/overview'),
                axios.get('/api/analytics/peak-hours'),
                axios.get('/api/analytics/doctor-performance')
            ]);
            setAdvancedStats({
                overview: overviewRes.data,
                peakData: peakRes.data,
                doctorPerf: docRes.data
            });
        } catch (error) {
            console.error('Error fetching advanced analytics', error);
        }
    };

    const fetchMedStats = async () => {
        try {
            const res = await axios.get('/api/ai/prescription-analytics');
            setMedStats(res.data);
        } catch (error) {
            console.error('Error fetching med stats', error);
        }
    };

    const fetchFeedback = async () => {
        try {
            const res = await axios.get('/api/feedback');
            setFeedbackList(res.data);
        } catch (error) {
            console.error('Error fetching feedback', error);
        }
    };

    useEffect(() => {
        const handleUpdates = () => {
            if (view === 'OPERATIONS') fetchStats();
            if (view === 'ANALYTICS') fetchAdvancedAnalytics();
        };

        socket.on('doctorStatusUpdate', handleUpdates);
        socket.on('queueUpdate', handleUpdates);
        // Also listen for new visits or emergency to update stats immediately
        socket.on('emergencyAlert', handleUpdates);

        if (view === 'OPERATIONS') {
            fetchStats();
            const interval = setInterval(fetchStats, 5000);
            return () => {
                clearInterval(interval);
                socket.off('doctorStatusUpdate', handleUpdates);
                socket.off('queueUpdate', handleUpdates);
                socket.off('emergencyAlert', handleUpdates);
            };
        } else if (view === 'STAFF') {
            fetchStaff();
        } else if (view === 'LOGS') {
            fetchLogs();
        } else if (view === 'FEEDBACK') {
            fetchFeedback();
        } else if (view === 'MEDICINES') {
            fetchMedStats();
        } else if (view === 'ANALYTICS') {
            fetchAdvancedAnalytics();
        }

        return () => {
            socket.off('doctorStatusUpdate', handleUpdates);
            socket.off('queueUpdate', handleUpdates);
            socket.off('emergencyAlert', handleUpdates);
        };
    }, [view]);

    const [fullLogs, setFullLogs] = useState([]);

    const fetchStats = async () => {
        try {
            const [opdRes, loadRes, diseaseRes, presRes, activityRes] = await Promise.all([
                axios.get('/api/opd/admin/stats'),
                axios.get('/api/ai/load-stats'),
                axios.get('/api/ai/disease-trends'),
                axios.get('/api/ai/prescription-patterns'),
                axios.get('/api/ai/doctor-activity')
            ]);

            setStats(opdRes.data);
            setAiStats({
                load: loadRes.data.doctorStats,
                diseases: diseaseRes.data,
                prescriptions: presRes.data,
                activity: activityRes.data
            });
        } catch (error) {
            console.error('Error fetching admin stats', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStaff = async () => {
        try {
            const res = await axios.get('/api/admin/staff');
            setStaffList(res.data);
        } catch (error) {
            console.error('Error fetching staff', error);
        }
    };

    const fetchLogs = async () => {
        try {
            const res = await axios.get('/api/admin/logs');
            setFullLogs(res.data);
        } catch (error) {
            console.error('Error fetching logs', error);
        }
    };

    const handleOverride = async (visitId) => {
        const reason = prompt("Enter reason for Emergency Override:");
        if (!reason) return;

        try {
            await axios.post('/api/opd/admin/override', { visitId, reason });
            alert('Patient prioritized!');
            fetchStats();
        } catch (error) {
            alert('Error overriding queue');
        }
    };

    const handleAddStaff = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/admin/staff', newStaff);
            alert('Staff added successfully');
            setShowAddStaff(false);
            setNewStaff({ name: '', username: '', password: '', role: 'DOCTOR', department: '', opd_room: '' });
            fetchStaff();
        } catch (error) {
            alert('Error adding staff: ' + (error.response?.data?.error || error.message));
        }
    };

    const handleDeleteStaff = async (id) => {
        if (!window.confirm('Are you sure you want to deactivate this staff member?')) return;
        try {
            await axios.delete(`/api/admin/staff/${id}`);
            fetchStaff();
        } catch (error) {
            alert('Error deleting staff');
        }
    };

    const renderMedColumn = (title, data) => (
        <div className="rounded-xl border border-slate-700 bg-slate-800 p-6">
            <h3 className="mb-4 text-lg font-bold text-white border-b border-slate-700 pb-2">{title}</h3>
            {Object.keys(data).length === 0 ? <p className="text-slate-500">No data.</p> : Object.entries(data).map(([docName, meds]) => (
                <div key={docName} className="mb-4">
                    <h4 className="mb-2 font-semibold text-blue-400">{docName}</h4>
                    <ul className="space-y-1">
                        {Object.entries(meds)
                            .sort(([, a], [, b]) => b - a)
                            .slice(0, 5)
                            .map(([med, count]) => (
                                <li key={med} className="flex justify-between rounded bg-slate-700/50 p-2 text-sm text-slate-300">
                                    <span>{med}</span>
                                    <span className="font-bold text-white">{count}</span>
                                </li>
                            ))}
                    </ul>
                </div>
            ))}
        </div>
    );

    return (
        <div className="flex min-h-screen bg-slate-900 text-white">
            <div className="flex w-64 flex-col gap-4 border-r border-slate-700 bg-slate-800 p-6">
                <div className="mb-6 flex items-center justify-center rounded-xl bg-slate-900 p-4">
                    <img src={arogyaLogo} alt="Arogya Logo" className="h-16 object-contain" />
                </div>
                <h2 className="mb-2 flex items-center gap-2 text-xl font-bold text-white"><ShieldAlert size={24} /> Admin Panel</h2>
                <div className="flex flex-col gap-2">
                    <button className={`flex items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors ${view === 'OPERATIONS' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-700 hover:text-white'}`} onClick={() => setView('OPERATIONS')}>
                        <Activity size={18} /> Live Operations
                    </button>
                    <button className={`flex items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors ${view === 'STAFF' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-700 hover:text-white'}`} onClick={() => setView('STAFF')}>
                        <Users size={18} /> Staff Management
                    </button>
                    <button className={`flex items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors ${view === 'MEDICINES' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-700 hover:text-white'}`} onClick={() => setView('MEDICINES')}>
                        <BarChart3 size={18} /> Medicine Analytics
                    </button>
                    <button className={`flex items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors ${view === 'ANALYTICS' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-700 hover:text-white'}`} onClick={() => setView('ANALYTICS')}>
                        <TrendingUp size={18} /> Advanced Analytics
                    </button>
                    <button className={`flex items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors ${view === 'FEEDBACK' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-700 hover:text-white'}`} onClick={() => setView('FEEDBACK')}>
                        <AlertTriangle size={18} /> Patient Feedback
                    </button>
                    <button className={`flex items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors ${view === 'LOGS' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-700 hover:text-white'}`} onClick={() => setView('LOGS')}>
                        <Settings size={18} /> Audit Logs
                    </button>
                    <button onClick={logout} className="mt-auto flex items-center gap-3 rounded-lg px-4 py-3 text-left text-red-400 transition-colors hover:bg-red-900/20">
                        <LogOut size={18} /> Logout
                    </button>
                </div>
            </div>

            <div className="flex-1 p-8">
                {view === 'OPERATIONS' && (
                    <>
                        <h1 className="mb-6 flex items-center gap-2 text-2xl font-bold text-white"><Activity className="text-blue-500" /> Hospital Operations Center</h1>

                        {/* AI ALERTS SECTION */}
                        {aiStats.activity.length > 0 && (
                            <div className="mb-6 rounded-lg border border-red-900/50 bg-red-950/20 p-4">
                                <h3 className="mb-2 flex items-center gap-2 font-bold text-red-400"><AlertTriangle size={18} /> AI Activity Alerts</h3>
                                <div className="space-y-2">
                                    {aiStats.activity.map((alert, idx) => (
                                        <div key={idx} className="flex items-center gap-2 text-sm text-red-300">
                                            <span className="h-2 w-2 rounded-full bg-red-500"></span>
                                            <span>{alert.message}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-4">
                            {/* AI LOAD MONITOR */}
                            <div className="col-span-full rounded-xl border border-slate-700 bg-slate-800 p-6">
                                <h3 className="mb-4 text-lg font-bold text-white">🧠 AI Load Monitor</h3>
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                                    {aiStats.load.map(doc => (
                                        <div key={doc.doctorId} className={`rounded-lg border p-4 ${doc.loadSeverity === 'Critical Load' ? 'border-red-900 bg-red-950/20' : doc.loadSeverity === 'High Load' ? 'border-orange-900 bg-orange-950/20' : 'border-green-900 bg-green-950/20'}`}>
                                            <h4 className="font-bold text-white">{doc.doctorName}</h4>
                                            <p className="mb-2 text-xs text-slate-400">{doc.department}</p>
                                            <div className="flex items-end justify-between">
                                                <div>
                                                    <span className="text-2xl font-bold text-white">{doc.patientsWaiting}</span>
                                                    <span className="ml-1 text-xs text-slate-400">Waiting</span>
                                                </div>
                                                <span className={`rounded-full px-2 py-1 text-xs font-bold ${doc.loadSeverity === 'Critical Load' ? 'bg-red-900 text-red-200' : doc.loadSeverity === 'High Load' ? 'bg-orange-900 text-orange-200' : 'bg-green-900 text-green-200'}`}>
                                                    {doc.loadSeverity}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="rounded-xl border border-slate-700 bg-slate-800 p-6">
                                <h3 className="mb-4 text-lg font-bold text-white">👨‍⚕️ Doctor Status</h3>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead>
                                            <tr className="border-b border-slate-700 text-slate-400">
                                                <th className="pb-2">Doctor</th>
                                                <th className="pb-2">Status</th>
                                                <th className="pb-2">Queue</th>
                                                <th className="pb-2">Delay</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-white">
                                            {stats.doctors.map(doc => (
                                                <tr key={doc.id} className="border-b border-slate-700/50">
                                                    <td className="py-2 font-medium">{doc.name}</td>
                                                    <td className="py-2">
                                                        <span className={`rounded px-2 py-0.5 text-xs font-bold ${doc.status === 'AVAILABLE' ? 'bg-green-900 text-green-200' : doc.status === 'IN_OPD' ? 'bg-yellow-900 text-yellow-200' : 'bg-red-900 text-red-200'}`}>
                                                            {doc.status}
                                                        </span>
                                                    </td>
                                                    <td className="py-2">{doc.queueLength}</td>
                                                    <td className="py-2 text-xs text-red-400">{doc.delay_reason || '-'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="rounded-xl border border-slate-700 bg-slate-800 p-6">
                                <h3 className="mb-4 text-lg font-bold text-white">🏥 Live OPD Queues</h3>
                                <div className="max-h-80 space-y-3 overflow-y-auto pr-2">
                                    {stats.queues.opd.map(q => (
                                        <div key={q.id} className={`flex items-center justify-between rounded-lg border p-3 ${q.priority > 0 ? 'border-red-900 bg-red-950/20' : 'border-slate-700 bg-slate-700/30'}`}>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-lg font-bold text-blue-400">#{q.visit.tokenNumber}</span>
                                                    <span className="text-sm font-medium text-white">{q.visit.patient.name}</span>
                                                </div>
                                                <p className="text-xs text-slate-400">Dr. {q.doctorName}</p>
                                            </div>
                                            <div>
                                                {q.priority === 0 ? (
                                                    <button
                                                        className="rounded border border-red-900 bg-red-950/30 px-2 py-1 text-xs text-red-400 hover:bg-red-900/50"
                                                        onClick={() => handleOverride(q.visitId)}
                                                    >
                                                        ⚡ Prioritize
                                                    </button>
                                                ) : (
                                                    <span className="rounded bg-red-900 px-2 py-1 text-xs font-bold text-red-100">URGENT</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* DISEASE TRENDS */}
                            <div className="rounded-xl border border-slate-700 bg-slate-800 p-6">
                                <h3 className="mb-4 text-lg font-bold text-white">microscope Disease Trends (Today)</h3>
                                <ul className="space-y-2">
                                    {aiStats.diseases.map((d, i) => (
                                        <li key={i} className="flex items-center justify-between rounded bg-slate-700/50 p-2">
                                            <span className="text-sm font-medium text-white">{d.disease}</span>
                                            <span className="rounded-full bg-blue-900 px-2 py-1 text-xs font-bold text-blue-200">{d.count}</span>
                                        </li>
                                    ))}
                                    {aiStats.diseases.length === 0 && <p className="text-sm text-slate-500">No data yet today.</p>}
                                </ul>
                            </div>

                            <div className="rounded-xl border border-slate-700 bg-slate-800 p-6">
                                <h3 className="mb-4 text-lg font-bold text-white">🧪 Diagnostic Queues</h3>
                                <div className="max-h-60 space-y-2 overflow-y-auto pr-2">
                                    {stats.queues.diagnostics.map(q => (
                                        <div key={q.id} className="flex items-center justify-between rounded border border-slate-700 bg-slate-700/30 p-2">
                                            <div>
                                                <span className="block text-sm font-bold text-white">{q.testType}</span>
                                                <span className="text-xs text-slate-400">{q.visit.patient.name}</span>
                                            </div>
                                            <span className={`rounded px-2 py-1 text-xs font-bold ${q.status === 'PENDING' ? 'bg-amber-900 text-amber-200' : 'bg-green-900 text-green-200'}`}>{q.status}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {view === 'STAFF' && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h1 className="text-2xl font-bold text-white">👥 Staff Management</h1>
                            <button className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-bold text-white hover:bg-blue-700" onClick={() => setShowAddStaff(true)}>
                                <Plus size={18} /> Add New Staff
                            </button>
                        </div>

                        <div className="rounded-xl border border-slate-700 bg-slate-800 p-6">
                            <table className="w-full text-left text-sm text-slate-300">
                                <thead>
                                    <tr className="border-b border-slate-700 text-slate-400">
                                        <th className="p-3">Name</th>
                                        <th className="p-3">Username</th>
                                        <th className="p-3">Role</th>
                                        <th className="p-3">Details</th>
                                        <th className="p-3">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {staffList.map(staff => (
                                        <tr key={staff.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                                            <td className="p-3 font-medium text-white">{staff.name}</td>
                                            <td className="p-3">{staff.username}</td>
                                            <td className="p-3"><span className="rounded bg-slate-700 px-2 py-1 text-xs text-white">{staff.role}</span></td>
                                            <td className="p-3 text-slate-400">
                                                {staff.role === 'DOCTOR' && staff.doctorProfile && (
                                                    <>{staff.doctorProfile.department} - {staff.doctorProfile.opd_room}</>
                                                )}
                                            </td>
                                            <td className="p-3">
                                                <button className="rounded p-2 text-red-500 hover:bg-red-900/20" onClick={() => handleDeleteStaff(staff.id)}>
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {showAddStaff && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                                <div className="w-full max-w-md rounded-xl bg-slate-800 p-6 shadow-2xl border border-slate-700">
                                    <div className="mb-4 flex items-center justify-between">
                                        <h3 className="text-xl font-bold text-white">Add New Staff</h3>
                                        <button onClick={() => setShowAddStaff(false)} className="text-slate-400 hover:text-white"><X /></button>
                                    </div>
                                    <form onSubmit={handleAddStaff} className="space-y-4">
                                        <input
                                            placeholder="Full Name"
                                            value={newStaff.name}
                                            onChange={e => setNewStaff({ ...newStaff, name: e.target.value })}
                                            required
                                            className="w-full rounded border border-slate-600 bg-slate-700 p-3 text-white focus:border-blue-500 focus:outline-none"
                                        />
                                        <input
                                            placeholder="Username"
                                            value={newStaff.username}
                                            onChange={e => setNewStaff({ ...newStaff, username: e.target.value })}
                                            required
                                            className="w-full rounded border border-slate-600 bg-slate-700 p-3 text-white focus:border-blue-500 focus:outline-none"
                                        />
                                        <input
                                            type="password"
                                            placeholder="Password"
                                            value={newStaff.password}
                                            onChange={e => setNewStaff({ ...newStaff, password: e.target.value })}
                                            required
                                            className="w-full rounded border border-slate-600 bg-slate-700 p-3 text-white focus:border-blue-500 focus:outline-none"
                                        />
                                        <select
                                            value={newStaff.role}
                                            onChange={e => setNewStaff({ ...newStaff, role: e.target.value })}
                                            className="w-full rounded border border-slate-600 bg-slate-700 p-3 text-white focus:border-blue-500 focus:outline-none"
                                        >
                                            <option value="DOCTOR">Doctor</option>
                                            <option value="RECEPTIONIST">Receptionist</option>
                                            <option value="LAB_TECH">Lab Technician</option>
                                        </select>

                                        {newStaff.role === 'DOCTOR' && (
                                            <div className="grid grid-cols-2 gap-4">
                                                <input
                                                    placeholder="Department"
                                                    value={newStaff.department}
                                                    onChange={e => setNewStaff({ ...newStaff, department: e.target.value })}
                                                    required
                                                    className="w-full rounded border border-slate-600 bg-slate-700 p-3 text-white focus:border-blue-500 focus:outline-none"
                                                />
                                                <input
                                                    placeholder="OPD Room"
                                                    value={newStaff.opd_room}
                                                    onChange={e => setNewStaff({ ...newStaff, opd_room: e.target.value })}
                                                    required
                                                    className="w-full rounded border border-slate-600 bg-slate-700 p-3 text-white focus:border-blue-500 focus:outline-none"
                                                />
                                            </div>
                                        )}

                                        <button type="submit" className="w-full rounded bg-blue-600 py-3 font-bold text-white hover:bg-blue-700">
                                            Create Account
                                        </button>
                                    </form>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {view === 'MEDICINES' && (
                    <div className="medicines-view">
                        <h1 className="mb-6 text-2xl font-bold text-white">💊 Medicine Prescription Analytics</h1>
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                            {renderMedColumn('📅 Daily (Today)', medStats.daily)}
                            {renderMedColumn('📅 Weekly (Last 7 Days)', medStats.weekly)}
                            {renderMedColumn('📅 Monthly (This Month)', medStats.monthly)}
                        </div>
                    </div>
                )}

                {view === 'FEEDBACK' && (
                    <div className="feedback-view">
                        <h1 className="mb-6 text-2xl font-bold text-white">💬 Patient Feedback</h1>
                        <div className="rounded-xl border border-slate-700 bg-slate-800 p-6">
                            <table className="w-full text-left text-sm text-slate-300">
                                <thead>
                                    <tr className="border-b border-slate-700 text-slate-400">
                                        <th className="p-3">Date</th>
                                        <th className="p-3">Patient</th>
                                        <th className="p-3">Doctor</th>
                                        <th className="p-3">Issues/Tags</th>
                                        <th className="p-3">Comment</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {feedbackList.map(item => (
                                        <tr key={item.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                                            <td className="p-3">{new Date(item.createdAt).toLocaleDateString()}</td>
                                            <td className="p-3">
                                                {item.isAnonymous ? (
                                                    <span className="rounded bg-yellow-900 px-2 py-1 text-xs text-yellow-200">Anonymous</span>
                                                ) : (
                                                    item.patient?.name || 'Unknown'
                                                )}
                                            </td>
                                            <td className="p-3">{item.doctor?.user?.name || '-'}</td>
                                            <td className="p-3">
                                                <div className="flex flex-wrap gap-1">
                                                    {JSON.parse(item.options || '[]').map((opt, i) => (
                                                        <span key={i} className="rounded bg-slate-700 px-2 py-1 text-xs">{opt}</span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="p-3 text-slate-400">{item.comment}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {view === 'LOGS' && (
                    <div className="logs-view">
                        <h1 className="mb-6 text-2xl font-bold text-white">🛡️ System Audit Logs</h1>
                        <div className="rounded-xl border border-slate-700 bg-slate-800 p-6">
                            <table className="w-full text-left text-sm text-slate-300">
                                <thead>
                                    <tr className="border-b border-slate-700 text-slate-400">
                                        <th className="p-3">Timestamp</th>
                                        <th className="p-3">User</th>
                                        <th className="p-3">Role</th>
                                        <th className="p-3">Action</th>
                                        <th className="p-3">Details</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {fullLogs.map(log => (
                                        <tr key={log.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                                            <td className="p-3 text-slate-500">{new Date(log.timestamp).toLocaleString()}</td>
                                            <td className="p-3 font-medium text-white">{log.user?.name || 'System'}</td>
                                            <td className="p-3"><span className="rounded bg-slate-700 px-2 py-1 text-xs text-white">{log.user?.role || '-'}</span></td>
                                            <td className="p-3 font-mono text-xs text-blue-400">{log.action}</td>
                                            <td className="p-3 text-slate-400">{log.details}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}


                {view === 'ANALYTICS' && (
                    <div className="analytics-view">
                        <header className="mb-8">
                            <h1 className="text-3xl font-bold flex items-center gap-2"><TrendingUp className="text-blue-500" /> Advanced Analytics</h1>
                            <p className="text-slate-400">Deep dive into hospital performance metrics</p>
                        </header>

                        {/* KPI Cards */}
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-4 mb-8">
                            <div className="rounded-xl border border-slate-700 bg-slate-800 p-6">
                                <div className="mb-2 flex items-center justify-between">
                                    <span className="text-slate-400">Total Visits Today</span>
                                    <Users size={20} className="text-blue-500" />
                                </div>
                                <div className="text-3xl font-bold text-white">{advancedStats.overview.totalVisitsToday || 0}</div>
                            </div>
                            <div className="rounded-xl border border-slate-700 bg-slate-800 p-6">
                                <div className="mb-2 flex items-center justify-between">
                                    <span className="text-slate-400">Avg Wait Time</span>
                                    <Clock size={20} className="text-amber-500" />
                                </div>
                                <div className="text-3xl font-bold text-white">{advancedStats.overview.avgWaitTime || 0} <span className="text-sm font-normal text-slate-500">min</span></div>
                            </div>
                            <div className="rounded-xl border border-slate-700 bg-slate-800 p-6">
                                <div className="mb-2 flex items-center justify-between">
                                    <span className="text-slate-400">Pending Patients</span>
                                    <AlertTriangle size={20} className="text-red-500" />
                                </div>
                                <div className="text-3xl font-bold text-white">{advancedStats.overview.pendingVisits || 0}</div>
                            </div>
                            <div className="rounded-xl border border-slate-700 bg-slate-800 p-6">
                                <div className="mb-2 flex items-center justify-between">
                                    <span className="text-slate-400">Completed</span>
                                    <Activity size={20} className="text-green-500" />
                                </div>
                                <div className="text-3xl font-bold text-white">{advancedStats.overview.completedVisits || 0}</div>
                            </div>
                        </div>

                        {/* Charts Area */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                            {/* Peak Hours Chart */}
                            <div className="rounded-xl border border-slate-700 bg-slate-800 p-6">
                                <h3 className="mb-6 text-xl font-bold flex items-center gap-2">
                                    <TrendingUp size={20} className="text-blue-400" /> Peak Traffic Hours
                                </h3>
                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={advancedStats.peakData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                            <XAxis dataKey="hour" stroke="#94a3b8" />
                                            <YAxis stroke="#94a3b8" />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }}
                                                cursor={{ fill: '#334155', opacity: 0.4 }}
                                            />
                                            <Bar dataKey="patients" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Doctor Performance Table */}
                            <div className="rounded-xl border border-slate-700 bg-slate-800 p-6">
                                <h3 className="mb-6 text-xl font-bold flex items-center gap-2">
                                    <Activity size={20} className="text-green-400" /> Staff Performance
                                </h3>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="border-b border-slate-700 text-sm text-slate-400">
                                                <th className="pb-3">Doctor</th>
                                                <th className="pb-3 text-center">Status</th>
                                                <th className="pb-3 text-right">Patients Seen</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-sm">
                                            {advancedStats.doctorPerf && advancedStats.doctorPerf.map((doc, idx) => (
                                                <tr key={idx} className="border-b border-slate-700/50 last:border-0 hover:bg-slate-700/30">
                                                    <td className="py-3 font-medium text-white">{doc.name}</td>
                                                    <td className="py-3 text-center">
                                                        <span className={`rounded px-2 py-1 text-xs font-bold ${doc.status === 'IN_OPD' ? 'bg-green-900 text-green-300' :
                                                            doc.status === 'AVAILABLE' ? 'bg-blue-900 text-blue-300' :
                                                                'bg-slate-700 text-slate-300'
                                                            }`}>
                                                            {doc.status}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 text-right text-blue-400 font-bold">{doc.patientsSeen}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;
