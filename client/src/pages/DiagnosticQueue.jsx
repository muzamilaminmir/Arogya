import React, { useState } from 'react';
import { Activity, Clock, User } from 'lucide-react';
import Layout from '../components/Layout';
import Card from '../components/Card';
import Badge from '../components/Badge';

const DiagnosticQueue = () => {
    const [activeTab, setActiveTab] = useState('X-Ray');

    const tabs = ['X-Ray', 'MRI', 'CT Scan', 'Lab Tests'];

    // Mock data
    const queueData = {
        'X-Ray': [
            { token: 'X-101', name: 'John Doe', status: 'In Progress', wait: '5 min' },
            { token: 'X-102', name: 'Jane Smith', status: 'Waiting', wait: '15 min' },
            { token: 'X-103', name: 'Bob Johnson', status: 'Waiting', wait: '25 min' },
        ],
        'MRI': [
            { token: 'M-201', name: 'Alice Brown', status: 'In Progress', wait: '20 min' },
            { token: 'M-202', name: 'Charlie Davis', status: 'Waiting', wait: '45 min' },
        ],
        'CT Scan': [],
        'Lab Tests': [
            { token: 'L-301', name: 'Eve Wilson', status: 'Completed', wait: '0 min' },
            { token: 'L-302', name: 'Frank Miller', status: 'In Progress', wait: '10 min' },
        ],
    };

    return (
        <Layout title="Diagnostic Queue" role="public">
            {/* Tabs */}
            <div className="flex overflow-x-auto pb-4 gap-2 no-scrollbar">
                {tabs.map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`
              px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors
              ${activeTab === tab
                                ? 'bg-purple-600 text-white shadow-md'
                                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700'}
            `}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Queue List */}
            <div className="space-y-3">
                {queueData[activeTab]?.length > 0 ? (
                    queueData[activeTab].map((item) => (
                        <Card key={item.token} className="flex items-center justify-between p-4">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-purple-900/50 rounded-full flex items-center justify-center text-purple-300 font-bold text-sm">
                                    {item.token.split('-')[0]}
                                </div>
                                <div>
                                    <h3 className="font-semibold text-white">{item.token}</h3>
                                    <p className="text-sm text-slate-400">{item.name}</p>
                                </div>
                            </div>

                            <div className="flex flex-col items-end gap-2">
                                <Badge status={item.status} />
                                <div className="flex items-center gap-1 text-xs text-slate-500">
                                    <Clock size={12} />
                                    <span>~{item.wait}</span>
                                </div>
                            </div>
                        </Card>
                    ))
                ) : (
                    <div className="text-center py-12 text-slate-500 bg-slate-800 rounded-xl border border-dashed border-slate-700">
                        <Activity className="mx-auto h-8 w-8 text-slate-600 mb-2" />
                        <p>No patients in queue</p>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default DiagnosticQueue;
