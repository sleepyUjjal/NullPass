import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, ArrowLeft } from 'lucide-react';

export default function Login() {
  const [step, setStep] = useState(1);
  const navigate = useNavigate();

  // Simulation Logic
  useEffect(() => {
    const timer1 = setTimeout(() => setStep(2), 2000);
    const timer2 = setTimeout(() => setStep(3), 4500);
    const timer3 = setTimeout(() => { if(step === 3) navigate('/dashboard'); }, 5500);
    return () => { clearTimeout(timer1); clearTimeout(timer2); clearTimeout(timer3); };
  }, [step, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative">
        
        {/* Back Button */}
        <Link to="/" className="absolute top-6 left-6 text-platinum/50 hover:text-steel-azure transition flex items-center gap-2 font-mono text-sm">
            <ArrowLeft size={16} /> BACK_TO_HOME
        </Link>

        {/* Scanner Card */}
        <div className="relative group perspective-1000 w-full max-w-md">
            {/* Ambient Glow */}
            <div className="absolute -inset-1 bg-gradient-to-t from-steel-azure to-deep-twilight rounded-3xl blur-2xl opacity-40 group-hover:opacity-60 transition duration-1000 animate-pulse"></div>
            
            <div className="relative bg-onyx/90 backdrop-blur-xl border border-platinum/10 rounded-3xl p-8 shadow-2xl overflow-hidden text-center">
                
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-platinum tracking-tight mb-2">NullPass Login</h1>
                    <p className="text-platinum/50 text-sm">Scan with your trusted device</p>
                </div>

                {/* QR Container */}
                <div className="relative w-64 h-64 bg-white p-4 rounded-2xl mx-auto shadow-inner mb-8">
                    {step < 3 ? (
                        <>
                            <img 
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=NullPass_Login_Token`} 
                                alt="QR" 
                                className="w-full h-full opacity-90 mix-blend-multiply" 
                            />
                            {/* Scanning Beam */}
                            <div className="absolute top-0 left-0 w-full h-1 bg-steel-azure shadow-[0_0_25px_#0050A6] animate-scan z-10"></div>
                        </>
                    ) : (
                        <motion.div 
                            initial={{ scale: 0 }} animate={{ scale: 1 }}
                            className="w-full h-full flex items-center justify-center bg-green-50 rounded-xl"
                        >
                            <ShieldCheck className="w-24 h-24 text-green-600 drop-shadow-md" />
                        </motion.div>
                    )}
                    
                    {/* Tech Corners */}
                    <Corner position="top-3 left-3 border-t-2 border-l-2" />
                    <Corner position="top-3 right-3 border-t-2 border-r-2" />
                    <Corner position="bottom-3 left-3 border-b-2 border-l-2" />
                    <Corner position="bottom-3 right-3 border-b-2 border-r-2" />
                </div>

                {/* Status Indicators */}
                <div className="space-y-3 font-mono text-xs text-left px-4">
                    <StatusRow label="Connection" status="Secure (TLS 1.3)" active={true} />
                    <StatusRow label="Challenge" status={step >= 1 ? "Generated" : "Pending..."} active={step >= 1} />
                    <StatusRow label="Signature" status={step >= 2 ? "Verified" : "Waiting..."} active={step >= 2} />
                    <StatusRow label="Access" status={step === 3 ? "GRANTED" : "Locked"} active={step === 3} color="text-green-400" />
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

const Corner = ({ position }) => (
    <div className={`absolute w-4 h-4 border-onyx ${position}`}></div>
);