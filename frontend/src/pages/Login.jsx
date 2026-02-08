import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, ArrowLeft, Loader2, RefreshCw, AlertCircle, ScanLine } from 'lucide-react';
import api from '../services/api';

export default function Login() {
  const [qrImage, setQrImage] = useState(null);
  const [challengeId, setChallengeId] = useState(null);
  const [scanUrl, setScanUrl] = useState(null);
  const [status, setStatus] = useState('LOADING'); // LOADING, READY, SUCCESS, EXPIRED, ERROR
  const [errorMsg, setErrorMsg] = useState('');
  
  const navigate = useNavigate();
  const pollInterval = useRef(null);

  // 1. Initialize Login Session
  const startLogin = async () => {
    setStatus('LOADING');
    setErrorMsg('');
    try {
      const res = await api.initiateLogin();
      if (res.data.success) {
        setQrImage(res.data.qr_code);
        setChallengeId(res.data.challenge_id);
        
        // Construct the URL that the "Phone" would open for simulation
        // Note: Your backend MUST include 'nonce' in the response for this link to work perfectly.
        const nonce = res.data.nonce || ''; 
        const authUrl = `${window.location.origin}/authenticate?challenge_id=${res.data.challenge_id}&nonce=${nonce}`;
        setScanUrl(authUrl);
        
        setStatus('READY'); 
      } else {
        setErrorMsg('Failed to create session');
        setStatus('ERROR');
      }
    } catch (err) {
      console.error("Login init error:", err);
      setErrorMsg('Could not connect to server');
      setStatus('ERROR');
    }
  };

  useEffect(() => {
    startLogin();
    return () => clearInterval(pollInterval.current);
  }, []);

  // 2. Poll for Authentication Status
  useEffect(() => {
    if (!challengeId || status === 'SUCCESS' || status === 'ERROR') return;

    pollInterval.current = setInterval(async () => {
      try {
        const res = await api.checkChallengeStatus(challengeId);
        
        if (res.data.authenticated === true) {
          setStatus('SUCCESS');
          clearInterval(pollInterval.current);
          
          // --- NOTIFY NAVBAR IMMEDIATELY ---
          window.dispatchEvent(new Event('auth-change'));
          // ---------------------------------
          
          setTimeout(() => navigate('/dashboard'), 1500);
        } 
        else if (res.data.is_expired === true) {
          setStatus('EXPIRED');
          clearInterval(pollInterval.current);
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 2000);

    return () => clearInterval(pollInterval.current);
  }, [challengeId, status, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative bg-onyx">
        <Link to="/" className="absolute top-6 left-6 text-platinum/50 hover:text-steel-azure transition flex items-center gap-2 font-mono text-sm">
            <ArrowLeft size={16} /> BACK_TO_HOME
        </Link>

        <div className="relative group w-full max-w-md">
            <div className="absolute -inset-1 bg-gradient-to-t from-steel-azure to-deep-twilight rounded-3xl blur-2xl opacity-40 group-hover:opacity-60 transition duration-1000"></div>
            
            <div className="relative bg-onyx/90 backdrop-blur-xl border border-platinum/10 rounded-3xl p-8 shadow-2xl text-center">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-platinum tracking-tight mb-2">NullPass Login</h1>
                    <p className="text-platinum/50 text-sm">Scan with your trusted device</p>
                </div>

                {/* QR Container */}
                <div className="relative w-64 h-64 bg-white p-4 rounded-2xl mx-auto shadow-inner mb-8 flex items-center justify-center overflow-hidden">
                    {status === 'LOADING' ? (
                       <Loader2 className="animate-spin text-black/40" size={32} />
                    ) : status === 'ERROR' ? (
                       <div className="text-red-500 flex flex-col items-center gap-2">
                         <AlertCircle />
                         <span className="text-xs">{errorMsg}</span>
                         <button onClick={startLogin} className="underline text-xs mt-2">Retry</button>
                       </div>
                    ) : status === 'EXPIRED' ? (
                       <div className="flex flex-col items-center gap-2 text-toffee-brown">
                          <AlertCircle size={32} />
                          <span className="font-bold text-sm">QR EXPIRED</span>
                          <button onClick={startLogin} className="px-3 py-1 bg-onyx text-white rounded text-xs flex items-center gap-1 mt-2">
                            <RefreshCw size={10}/> Refresh
                          </button>
                       </div>
                    ) : status === 'SUCCESS' ? (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-full h-full flex items-center justify-center bg-green-50 rounded-xl">
                            <ShieldCheck className="w-24 h-24 text-green-600 drop-shadow-md" />
                        </motion.div>
                    ) : (
                        // CLICKABLE QR CODE (Simulates Scanning)
                        <a 
                          href={scanUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="relative w-full h-full block cursor-pointer group/qr"
                          title="Click to simulate scanning on this device"
                        >
                           <img src={qrImage} alt="Login QR" className="w-full h-full opacity-90 mix-blend-multiply" />
                           <div className="absolute top-0 left-0 w-full h-1 bg-steel-azure shadow-[0_0_25px_#0050A6] animate-scan z-10"></div>
                           
                           {/* Hover Hint */}
                           <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover/qr:opacity-100 transition-opacity">
                              <span className="text-white text-xs font-bold flex items-center gap-2">
                                <ScanLine size={16}/> CLICK TO SCAN
                              </span>
                           </div>
                        </a>
                    )}
                </div>

                <div className="space-y-3 font-mono text-xs text-left px-4">
                    <StatusRow label="Connection" status="Secure (TLS 1.3)" active={true} />
                    <StatusRow label="Challenge" status={status === 'LOADING' ? 'Requesting...' : 'Generated'} active={status !== 'LOADING' && status !== 'ERROR'} />
                    <StatusRow label="Signature" status={status === 'SUCCESS' ? 'Verified' : 'Waiting...'} active={status === 'SUCCESS'} />
                    <StatusRow label="Access" status={status === 'SUCCESS' ? 'GRANTED' : 'Locked'} active={status === 'SUCCESS'} color="text-green-400" />
                </div>
            </div>
        </div>
    </div>
  );
}

const StatusRow = ({ label, status, active, color = "text-steel-azure" }) => (
    <div className="flex justify-between items-center border-b border-platinum/5 pb-2">
        <span className="text-platinum/40">{label}</span>
        <span className={`${active ? color : 'text-platinum/20'} transition-colors duration-300`}>{status}</span>
    </div>
);