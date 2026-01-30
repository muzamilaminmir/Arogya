import React from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Plus } from 'lucide-react';
import arogyaLogo from '../assets/arogya_logo.png';

const PrescriptionSlip = ({ visit }) => {
    if (!visit) return null;

    // Handle nested visit object structure
    const data = visit.visit || visit;
    const { patient, doctor, tokenNumber, qrCodeHash } = data;

    const doctorName = doctor.user.name;
    const department = doctor.department;
    const date = new Date().toLocaleDateString('en-IN');

    // Format Token: DOC001-YYYYMMDD-00X
    const formattedToken = `DOC${doctor.id.toString().padStart(3, '0')}-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${tokenNumber.toString().padStart(3, '0')}`;

    return (
        <div className="flex h-auto w-full max-w-[800px] flex-col bg-white p-8 text-slate-900 shadow-lg print:shadow-none mx-auto print:fixed print:inset-0 print:z-[100] print:h-full print:w-full print:m-0 print:max-w-none">

            {/* Header */}
            <div className="mb-6 text-center">
                <div className="mb-2 flex items-center justify-center gap-3">
                    <img src={arogyaLogo} alt="Logo" className="h-10 w-10 object-contain" />
                    <h1 className="text-3xl font-bold text-blue-700">AROGYA Hospital</h1>
                </div>
                <p className="text-sm font-semibold tracking-wide text-slate-500 uppercase">OPD Prescription Slip</p>
            </div>

            {/* Token Banner */}
            <div className="mb-8 text-center">
                <span className="text-xs font-bold tracking-widest text-slate-400 uppercase">OPD TOKEN</span>
                <h2 className="text-4xl font-extrabold text-slate-800 tracking-tight mt-1">{formattedToken}</h2>
            </div>

            <hr className="mb-8 border-slate-200" />

            {/* Patient Details Grid */}
            <div className="mb-8 grid grid-cols-[120px_1fr] gap-y-3 gap-x-4 text-sm">
                <span className="text-slate-500">Patient Name:</span>
                <span className="font-bold text-slate-900 uppercase">{patient.name}</span>

                <span className="text-slate-500">Age / Gender:</span>
                <span className="font-bold text-slate-900">{patient.age} years / -</span>

                <span className="text-slate-500">Phone:</span>
                <span className="font-medium text-slate-900">{patient.phone}</span>

                <span className="text-slate-500">Doctor:</span>
                <span className="font-bold text-slate-900">{doctorName}</span>

                <span className="text-slate-500">Department:</span>
                <span className="font-medium text-slate-900">{department}</span>
            </div>

            {/* QR Code Box */}
            <div className="mb-8 flex items-center gap-6 rounded-xl border border-slate-200 p-4">
                <div className="bg-white p-1">
                    <QRCodeCanvas value={qrCodeHash} size={84} />
                </div>
                <div>
                    <h3 className="mb-1 text-base font-bold text-blue-700">Scan for Digital Record</h3>
                    <p className="text-xs text-slate-500">Scan the QR code to access the patient's digital medical record.</p>
                </div>
            </div>

            {/* Medicines Section */}
            <div className="mb-8">
                <h4 className="mb-4 text-sm font-bold text-slate-400 uppercase tracking-wide">Medicines Prescribed</h4>
                <div className="space-y-4">
                    {[1, 2, 3, 4].map((num) => (
                        <div key={num} className="flex items-end gap-4">
                            <span className="w-4 text-sm font-medium text-slate-400">{num}.</span>
                            <div className="h-px flex-1 bg-slate-200"></div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Tests Section */}
            <div className="mb-12">
                <h4 className="mb-4 text-sm font-bold text-slate-400 uppercase tracking-wide">Tests / Lab Work</h4>
                <div className="space-y-4">
                    {[1, 2, 3].map((num) => (
                        <div key={num} className="flex items-end gap-4">
                            <span className="w-4 text-sm font-medium text-slate-400">{num}.</span>
                            <div className="h-px flex-1 bg-slate-200"></div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Footer */}
            <div className="mt-auto pt-8 border-t border-slate-100 flex items-end justify-between">
                <div className="flex items-baseline gap-2">
                    <span className="text-sm text-slate-500">Doctor's Signature:</span>
                    <div className="w-48 h-px bg-slate-300"></div>
                </div>
                <div className="text-sm text-slate-500">
                    Date: <span className="text-slate-900 font-medium">{date}</span>
                </div>
            </div>

        </div>
    );
};

export default PrescriptionSlip;
