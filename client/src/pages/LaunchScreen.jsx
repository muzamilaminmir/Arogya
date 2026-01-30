import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Building2 } from 'lucide-react';
import arogyaLogo from '../assets/arogya_logo.png';

const LaunchScreen = () => {
    const navigate = useNavigate();

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-900 p-4 font-sans text-white" style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' }}>
            <div className="grid w-full max-w-[900px] grid-cols-1 items-center gap-12 md:grid-cols-2">

                {/* Left: Hero Text */}
                <div>
                    <div className="mb-6 flex h-40 w-40 items-center justify-center rounded-2xl bg-white/10 shadow-lg backdrop-blur-sm p-4">
                        <img src={arogyaLogo} alt="Arogya Logo" className="h-full w-full object-contain" />
                    </div>
                    <h1 className="mb-4 text-5xl font-extrabold leading-tight text-white">
                        Arogya <br />
                        <span className="text-blue-400">Hospital System</span>
                    </h1>
                    <p className="max-w-md text-lg leading-relaxed text-slate-400">
                        Advanced healthcare management platform for patients, doctors, and hospital administration.
                    </p>

                    <div className="mt-8 flex gap-4">
                        <div className="flex">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className={`flex h-8 w-8 items-center justify-center rounded-full border-2 border-slate-900 bg-slate-700 ${i > 1 ? '-ml-2' : ''}`}>
                                    <Users size={14} color="white" />
                                </div>
                            ))}
                        </div>
                        <div className="flex items-center text-sm text-slate-400">
                            <span className="mr-1 font-bold text-white">500+</span> Daily Patients
                        </div>
                    </div>
                </div>

                {/* Right: Action Cards */}
                <div className="grid gap-4">
                    <div
                        onClick={() => navigate('/public')}
                        className="group flex cursor-pointer items-center gap-4 rounded-2xl border border-slate-700 bg-slate-800/70 p-6 transition-transform hover:scale-[1.02]"
                    >
                        <div className="rounded-xl bg-blue-500/10 p-4 text-blue-400">
                            <Users size={28} />
                        </div>
                        <div>
                            <h3 className="mb-1 text-xl font-bold text-white">Public Portal</h3>
                            <p className="text-sm text-slate-400">View live queues, doctors availability & reports</p>
                        </div>
                    </div>

                    <div
                        onClick={() => navigate('/login')}
                        className="group flex cursor-pointer items-center gap-4 rounded-2xl border border-slate-700 bg-slate-800/70 p-6 transition-transform hover:scale-[1.02]"
                    >
                        <div className="rounded-xl bg-green-500/10 p-4 text-green-400">
                            <Building2 size={28} />
                        </div>
                        <div>
                            <h3 className="mb-1 text-xl font-bold text-white">Staff Login</h3>
                            <p className="text-sm text-slate-400">Secure access for Doctors, Admin & Reception</p>
                        </div>
                    </div>
                </div>

            </div>

            <div className="absolute bottom-6 w-full text-center text-sm text-slate-600">
                © 2026 Arogya Hospital Management System • Secured & Encrypted
            </div>
        </div>
    );
};

export default LaunchScreen;
