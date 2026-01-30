import React from 'react';

const Card = ({ children, className = '', onClick }) => {
    return (
        <div
            className={`rounded-xl border border-slate-700 bg-slate-800 shadow-sm ${className}`}
            onClick={onClick}
        >
            {children}
        </div>
    );
};

export default Card;
