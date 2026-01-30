import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const Layout = ({ children, title, role }) => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-slate-900 text-white">
            <header className="sticky top-0 z-10 flex items-center gap-4 border-b border-slate-700 bg-slate-800 px-4 py-3">
                <button
                    onClick={() => navigate(-1)}
                    className="rounded-full p-2 transition-colors hover:bg-slate-700 text-slate-400 hover:text-white"
                >
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-lg font-semibold text-white">{title || 'AROGYA'}</h1>
                    {role && <p className="text-xs text-slate-400 capitalize">{role} View</p>}
                </div>
            </header>
            <main className="mx-auto max-w-3xl p-4">
                {children}
            </main>
        </div>
    );
};

export default Layout;
