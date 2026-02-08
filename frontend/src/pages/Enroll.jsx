import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { KeyRound, ArrowLeft, Loader2, AlertCircle, ScanLine } from 'lucide-react';
import api from '../services/api';

export default function Enroll() {
  const [qrImage, setQrImage] = useState(null);
  const [scanUrl, setScanUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchQR = async () => {
      try {
        const res = await api.getEnrollmentQR();
        if (res.data.success) {
          setQrImage(res.data.qr_code);
          // Simulation Link
          setScanUrl(`${window.location.origin}/authenticate?action=enroll`);
        } else {
          setError('Failed to generate QR');
        }
      } catch (err) {
        console.error(err);
        setError('Connection failed');
      } finally {
        setLoading(false);
      }
    };
    fetchQR();
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative bg-onyx">
        <Link to="/" className="absolute top-6 left-6 text-platinum/50 hover:text-steel-azure transition flex items-center gap-2 font-mono text-sm">
            <ArrowLeft size={16} /> BACK_TO_HOME
        </Link>

        <div className="relative w-full max-w-md">
            <div className="absolute -inset-1 bg-gradient-to-t from-toffee-brown to-steel-azure rounded-3xl blur-2xl opacity-30 animate-pulse"></div>
            
            <div className="relative bg-onyx/90 backdrop-blur-xl border border-platinum/10 rounded-3xl p-8 shadow-2xl text-center">
                <div className="mb-8">
                    <div className="w-12 h-12 bg-steel-azure/20 text-steel-azure rounded-full flex items-center justify-center mx-auto mb-4">
                        <KeyRound size={24} />
                    </div>
                    <h1 className="text-2xl font-bold text-platinum tracking-tight mb-2">Register Device</h1>
                    <p className="text-platinum/50 text-sm">Scan to generate your identity keys.</p>
                </div>

                <div className="relative w-64 h-64 bg-white p-4 rounded-2xl mx-auto shadow-inner mb-8 flex items-center justify-center">
                    {loading ? (
                       <Loader2 className="animate-spin text-black/50" size={32} />
                    ) : error ? (
                       <div className="text-red-500 flex flex-col items-center gap-2"><AlertCircle size={20}/><span className="text-xs">{error}</span></div>
                    ) : (
                        <a 
                          href={scanUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="relative w-full h-full block cursor-pointer group/qr"
                          title="Click to simulate scanning"
                        >
                            <img src={qrImage} alt="Enroll QR" className="w-full h-full opacity-90 mix-blend-multiply" />
                            <div className="absolute top-0 left-0 w-full h-1 bg-toffee-brown shadow-[0_0_25px_#955E42] animate-scan z-10"></div>
                            
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover/qr:opacity-100 transition-opacity">
                                <span className="text-white text-xs font-bold flex items-center gap-2">
                                    <ScanLine size={16}/> CLICK TO ENROLL
                                </span>
                            </div>
                        </a>
                    )}
                </div>

                <div className="text-platinum/40 text-xs font-mono">
                    <p>1. Scan the QR code</p>
                    <p className="mt-2">2. Wait for confirmation on your device</p>
                    <p className="mt-2 text-steel-azure">3. Click the button below to proceed.</p>
                </div>
                
                <div className="mt-8 pt-6 border-t border-platinum/10">
                    <button 
                        onClick={() => navigate('/login')} 
                        className="block w-full py-3 rounded-xl bg-steel-azure text-white text-sm font-bold hover:bg-blue-600 transition-colors shadow-lg shadow-blue-900/20"
                    >
                        I've Finished Scanning
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
}