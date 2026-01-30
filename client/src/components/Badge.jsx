import React from 'react';

const Badge = ({ status }) => {
    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'completed': return 'bg-green-900 text-green-200';
            case 'in progress': return 'bg-blue-900 text-blue-200';
            case 'waiting': return 'bg-yellow-900 text-yellow-200';
            case 'urgent': return 'bg-red-900 text-red-200';
            default: return 'bg-slate-700 text-slate-300';
        }
    };

    return (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
            {status}
        </span>
    );
};

export default Badge;
