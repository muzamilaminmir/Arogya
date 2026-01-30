import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { X, Camera, RefreshCw } from 'lucide-react';

const QRScanner = ({ onScan, onClose }) => {
    const [error, setError] = useState(null);
    const [hasPermission, setHasPermission] = useState(null);
    const scannerRef = useRef(null);
    const html5QrCodeRef = useRef(null);

    useEffect(() => {
        const startScanner = async () => {
            try {
                // Check for camera permissions first
                try {
                    await navigator.mediaDevices.getUserMedia({ video: true });
                    setHasPermission(true);
                } catch (err) {
                    setHasPermission(false);
                    setError("Camera permission denied");
                    return;
                }

                if (html5QrCodeRef.current) return;

                const html5QrCode = new Html5Qrcode("reader");
                html5QrCodeRef.current = html5QrCode;

                const config = {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: 1.0
                };

                await html5QrCode.start(
                    { facingMode: "environment" },
                    config,
                    (decodedText) => {
                        if (onScan) {
                            // Stop scanning on success
                            html5QrCode.stop().then(() => {
                                html5QrCode.clear();
                                onScan(decodedText);
                            }).catch(err => console.error(err));
                        }
                    },
                    (errorMessage) => {
                        // ignore parsing errors
                    }
                );
            } catch (err) {
                console.error("Error starting scanner:", err);
                setError("Failed to start camera");
            }
        };

        // Small timeout to ensure DOM is ready
        const timer = setTimeout(() => {
            startScanner();
        }, 100);

        return () => {
            clearTimeout(timer);
            if (html5QrCodeRef.current) {
                if (html5QrCodeRef.current.isScanning) {
                    html5QrCodeRef.current.stop().then(() => {
                        html5QrCodeRef.current.clear();
                    }).catch(console.error);
                } else {
                    html5QrCodeRef.current.clear();
                }
            }
        };
    }, [onScan]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-100 p-4">
                    <h3 className="flex items-center gap-2 text-lg font-bold text-slate-800">
                        <Camera className="text-blue-600" size={20} />
                        Scan QR Code
                    </h3>
                    <button
                        onClick={onClose}
                        className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="relative bg-black p-4">
                    {!hasPermission && hasPermission !== null && (
                        <div className="flex h-64 flex-col items-center justify-center text-center text-white">
                            <p className="mb-2 text-red-400">Camera Permission Required</p>
                            <button onClick={() => window.location.reload()} className="rounded bg-slate-700 px-4 py-2 text-sm hover:bg-slate-600">
                                Retry
                            </button>
                        </div>
                    )}

                    {error && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-white">
                            <p>{error}</p>
                        </div>
                    )}

                    <div id="reader" className="overflow-hidden rounded-lg bg-black"></div>

                    {/* Overlay Frame Guide */}
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                        <div className="h-64 w-64 rounded-xl border-2 border-blue-500/50 shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]"></div>
                    </div>
                </div>

                <div className="bg-slate-50 p-4 text-center">
                    <p className="text-sm text-slate-500">
                        Align the QR code within the frame to scan
                    </p>
                </div>
            </div>
        </div>
    );
};

export default QRScanner;
