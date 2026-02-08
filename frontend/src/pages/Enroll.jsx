import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { KeyRound, CheckCircle2, ArrowLeft, Loader2, AlertCircle, ScanLine } from 'lucide-react';
import api from '../services/api';

export default function Enroll() {
  const [qrImage, setQrImage] = useState(null);
  const [challengeId, setChallengeId] = useState(null);
  const [scanUrl, setScanUrl] = useState(null);
  const [step, setStep] = useState(1); // 1: QR, 2: Success
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const pollInterval = useRef(null);

  // 1. Fetch Enrollment QR
  useEffect(() => {
    const fetchQR = async () => {
      try {
        const res = await api.getEnrollmentQR();
        if (res.data.success) {
          setQrImage(res.data.qr_code);
          setChallengeId(res.data.challenge_id);
          
          // Link for simulation
          setScanUrl(`${window.location.origin}/authenticate?action=enroll&challenge_id=${res.data.challenge_id}`);
        } else {
          setError('Failed to generate QR');
        }
      } catch (err) {
        console.error(err);
        setError('Connection failed');
      }
    };
    fetchQR();
    return () => clearInterval(pollInterval.current);
  }, []);

  // 2. Poll for Completion
  useEffect(() => {
    if (!challengeId || step === 2) return;

    pollInterval.current = setInterval(async () => {
      try {
        // We reuse the login status check because it returns "is_used"
        // If the challenge is marked "used", enrollment is complete.
        const res = await api.checkChallengeStatus(challengeId);
        
        if (res.data.is_used) {
          setStep(2);
          clearInterval(pollInterval.current);
          setTimeout(() => navigate('/dashboard'), 2000);
        }
      } catch (err) {
        console.error("Polling error", err);
      }
    }, 2000);

    return () => clearInterval(pollInterval.current);
  }, [challengeId, step, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative bg-onyx">
        <Link to="/" className="absolute top-6 left-6 text-platinum/50 hover:text-steel-azure transition flex items-center gap-2 font-mono text-sm">
            <ArrowLeft size={16} /> CANCEL
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
                    {step === 1 ? (
                        qrImage ? (
                            <a 
                              href={scanUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="relative w-full h-full block cursor-pointer group/qr"
                            >
                                <img src={qrImage} alt="Enroll QR" className="w-full h-full opacity-90 mix-blend-multiply" />
                                <div className="absolute top-0 left-0 w-full h-1 bg-toffee-brown shadow-[0_0_25px_#955E42] animate-scan z-10"></div>
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover/qr:opacity-100 transition-opacity">
                                  <span className="text-white text-xs font-bold flex items-center gap-2">
                                    <ScanLine size={16}/> CLICK TO ENROLL
                                  </span>
                               </div>
                            </a>
                        ) : error ? (
                             <div className="text-red-500 text-xs flex flex-col items-center gap-2"><AlertCircle/>{error}</div>
                        ) : (
                             <Loader2 className="animate-spin text-black/40"/>
                        )
                    ) : (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-full h-full flex items-center justify-center bg-green-50 rounded-xl">
                            <CheckCircle2 className="w-24 h-24 text-green-600 drop-shadow-md" />
                        </motion.div>
                    )}
                </div>

                <div className="space-y-3 font-mono text-xs text-left px-4 border-t border-platinum/5 pt-6">
                    <div className="flex justify-between text-platinum/40">
                        <span>Status</span>
                        <span className={step === 2 ? "text-green-400" : "text-steel-azure"}>
                            {step === 2 ? "ENROLLED" : "Waiting for Scan..."}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
}