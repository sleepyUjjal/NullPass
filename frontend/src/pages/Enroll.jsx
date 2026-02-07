import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Smartphone, CheckCircle2, ArrowLeft, KeyRound } from 'lucide-react';

export default function Enroll() {
  const [step, setStep] = useState(1);
  const navigate = useNavigate();

  // Simulation: Enrollment Process
  useEffect(() => {
    // Step 1: User scans QR (Wait 2.5s) -> Step 2: Generating Keys
    const timer1 = setTimeout(() => setStep(2), 2500);
    // Step 2: Keys Generated & Public Key Sent (Wait 2.5s) -> Step 3: Success
    const timer2 = setTimeout(() => setStep(3), 5000);
    // Step 3: Redirect to Dashboard (Wait 1.5s)
    const timer3 = setTimeout(() => { if(step === 3) navigate('/dashboard'); }, 6500);
    return () => { clearTimeout(timer1); clearTimeout(timer2); clearTimeout(timer3); };
  }, [step, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative">
        <Link to="/" className="absolute top-6 left-6 text-platinum/50 hover:text-steel-azure transition flex items-center gap-2 font-mono text-sm">
            <ArrowLeft size={16} /> CANCEL_ENROLLMENT
        </Link>

        <div className="relative w-full max-w-md">
            {/* Background Glow */}
            <div className="absolute -inset-1 bg-gradient-to-t from-toffee-brown to-steel-azure rounded-3xl blur-2xl opacity-30 animate-pulse"></div>
            
            <div className="relative bg-onyx/90 backdrop-blur-xl border border-platinum/10 rounded-3xl p-8 shadow-2xl text-center">
                
                <div className="mb-8">
                    <div className="w-12 h-12 bg-steel-azure/20 text-steel-azure rounded-full flex items-center justify-center mx-auto mb-4">
                        <KeyRound size={24} />
                    </div>
                    <h1 className="text-2xl font-bold text-platinum tracking-tight mb-2">Register New Device</h1>
                    <p className="text-platinum/50 text-sm">Scan to generate your unique identity keys</p>
                </div>

                {/* QR Container */}
                <div className="relative w-64 h-64 bg-white p-4 rounded-2xl mx-auto shadow-inner mb-8">
                    {step < 3 ? (
                        <>
                            <img 
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=NullPass_Enroll_New_User`} 
                                alt="Enrollment QR" 
                                className="w-full h-full opacity-90 mix-blend-multiply" 
                            />
                            {/* Scanning Beam (Gold for Creation) */}
                            <div className="absolute top-0 left-0 w-full h-1 bg-toffee-brown shadow-[0_0_25px_#955E42] animate-scan z-10"></div>
                        </>
                    ) : (
                        <motion.div 
                            initial={{ scale: 0 }} animate={{ scale: 1 }}
                            className="w-full h-full flex items-center justify-center bg-green-50 rounded-xl"
                        >
                            <CheckCircle2 className="w-24 h-24 text-green-600 drop-shadow-md" />
                        </motion.div>
                    )}
                    
                    <Corner position="top-3 left-3 border-t-2 border-l-2" />
                    <Corner position="top-3 right-3 border-t-2 border-r-2" />
                    <Corner position="bottom-3 left-3 border-b-2 border-l-2" />
                    <Corner position="bottom-3 right-3 border-b-2 border-r-2" />
                </div>

                {/* Status Steps */}
                <div className="space-y-3 font-mono text-xs text-left px-4 border-t border-platinum/5 pt-6">
                    <StatusRow label="1. Handshake" status={step >= 1 ? "Connected" : "Waiting..."} active={step >= 1} />
                    <StatusRow label="2. Key Generation" status={step >= 2 ? "Public Key Received" : "Pending..."} active={step >= 2} />
                    <StatusRow label="3. Registration" status={step === 3 ? "IDENTITY_CREATED" : "Processing..."} active={step === 3} color="text-green-400" />
                </div>
            </div>
        </div>
    </div>
  );
}

const StatusRow = ({ label, status, active, color = "text-steel-azure" }) => (
    <div className="flex justify-between items-center pb-1">
        <span className="text-platinum/40">{label}</span>
        <span className={`${active ? color : 'text-platinum/20'} transition-colors duration-300`}>{status}</span>
    </div>
);

const Corner = ({ position }) => (
    <div className={`absolute w-4 h-4 border-onyx ${position}`}></div>
);