import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { KeyRound, CheckCircle2, ArrowLeft } from 'lucide-react';

export default function Enroll() {
  const [step, setStep] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    // 1. Simulate Scanning
    const t1 = setTimeout(() => setStep(2), 2500);
    // 2. Simulate Key Generation
    const t2 = setTimeout(() => setStep(3), 5000);
    // 3. Redirect to Dashboard
    const t3 = setTimeout(() => { if(step === 3) navigate('/dashboard'); }, 6500);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [step, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative bg-onyx">
        <Link to="/" className="absolute top-6 left-6 text-platinum/50 hover:text-steel-azure transition flex items-center gap-2 font-mono text-sm">
            <ArrowLeft size={16} /> CANCEL_REGISTRATION
        </Link>

        <div className="relative w-full max-w-md">
            {/* Gold Glow for "Creation" */}
            <div className="absolute -inset-1 bg-gradient-to-t from-toffee-brown to-steel-azure rounded-3xl blur-2xl opacity-30 animate-pulse"></div>
            
            <div className="relative bg-onyx/90 backdrop-blur-xl border border-platinum/10 rounded-3xl p-8 shadow-2xl text-center">
                <div className="mb-8">
                    <div className="w-12 h-12 bg-steel-azure/20 text-steel-azure rounded-full flex items-center justify-center mx-auto mb-4">
                        <KeyRound size={24} />
                    </div>
                    <h1 className="text-2xl font-bold text-platinum tracking-tight mb-2">Create Digital Identity</h1>
                    <p className="text-platinum/50 text-sm">Scan with your authenticator app to generate keys.</p>
                </div>

                <div className="relative w-64 h-64 bg-white p-4 rounded-2xl mx-auto shadow-inner mb-8">
                    {step < 3 ? (
                        <>
                            {/* Dynamic QR Code for Enrollment */}
                            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=NullPass_New_User_Enroll`} alt="Enrollment QR" className="w-full h-full opacity-90 mix-blend-multiply" />
                            {/* Scanning Animation */}
                            <div className="absolute top-0 left-0 w-full h-1 bg-toffee-brown shadow-[0_0_25px_#955E42] animate-scan z-10"></div>
                        </>
                    ) : (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-full h-full flex items-center justify-center bg-green-50 rounded-xl">
                            <CheckCircle2 className="w-24 h-24 text-green-600 drop-shadow-md" />
                        </motion.div>
                    )}
                </div>

                <div className="space-y-3 font-mono text-xs text-left px-4 border-t border-platinum/5 pt-6">
                    <div className="flex justify-between text-platinum/40">
                        <span>1. Connection</span>
                        <span className={step >= 1 ? "text-steel-azure" : ""}>{step >= 1 ? "Secure" : "Waiting..."}</span>
                    </div>
                    <div className="flex justify-between text-platinum/40">
                        <span>2. Key Gen</span>
                        <span className={step >= 2 ? "text-steel-azure" : ""}>{step >= 2 ? "Public Key Sent" : "Pending..."}</span>
                    </div>
                    <div className="flex justify-between text-platinum/40">
                        <span>3. Identity</span>
                        <span className={step === 3 ? "text-green-400" : ""}>{step === 3 ? "CREATED" : "Processing..."}</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
}