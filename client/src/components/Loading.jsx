import React from 'react';
import { Loader2 } from 'lucide-react';
import arogyaLogo from '../assets/arogya_logo.png';

const Loading = () => {
    return (
        <div className="flex h-screen w-full flex-col items-center justify-center bg-slate-900 gap-6">
            <div className="relative flex items-center justify-center">
                <div className="absolute h-32 w-32 animate-ping rounded-full bg-blue-500/10"></div>
                <div className="relative h-24 w-24 rounded-2xl bg-slate-800 p-5 shadow-2xl border border-slate-700/50 backdrop-blur-sm">
                    <img src={arogyaLogo} alt="Logo" className="h-full w-full object-contain" />
                </div>
            </div>
            <div className="flex flex-col items-center gap-3">
                <div className="flex items-center gap-3 text-blue-400">
                    <Loader2 className="animate-spin" size={20} />
                    <span className="text-lg font-semibold tracking-wide">Loading AROGYA...</span>
                </div>
                <p className="text-xs font-medium tracking-widest text-slate-600 uppercase">
                    Built by <span className="text-blue-500 font-bold">Team Unity</span>
                </p>
            </div>
        </div>
    );
};

export default Loading;
