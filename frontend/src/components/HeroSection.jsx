import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, LockKeyhole, ShieldCheck } from 'lucide-react';

// Helper Component for the Scanner Corners
const Corner = ({ position }) => (
  <div className={`absolute w-4 h-4 border-onyx ${position}`}></div>
);

// Helper Component for the Status Steps
const StepItem = ({ status, text, active }) => (
  <div className={`flex items-center gap-3 font-mono text-xs transition-colors duration-500 ${status ? 'text-steel-azure' : 'text-platinum/20'}`}>
    <div className={`w-4 h-4 rounded-full flex items-center justify-center border transition-all duration-500 ${status ? 'border-steel-azure bg-steel-azure/10' : 'border-platinum/10'}`}>
      {status && <div className="w-1.5 h-1.5 bg-steel-azure rounded-full shadow-[0_0_5px_#0050A6]"></div>}
    </div>
    <span className={active ? 'text-platinum font-bold tracking-wide' : ''}>{text}</span>
  </div>
);

export default function HeroSection() {
  const [step, setStep] = useState(1);
  const navigate = useNavigate();

  // Simulation Logic: 
  // 1. Wait -> 2. Verify -> 3. Success -> Redirect
  useEffect(() => {
    const timer1 = setTimeout(() => setStep(2), 2500);
    const timer2 = setTimeout(() => setStep(3), 5000);
    const timer3 = setTimeout(() => {
        if(step === 3) navigate('/dashboard');
    }, 6500);
    return () => { clearTimeout(timer1); clearTimeout(timer2); clearTimeout(timer3); };
  }, [step, navigate]);

  return (
    <div className="relative z-10 min-h-[calc(100vh-4rem)] flex items-center justify-center p-6">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-20 items-center">
        
        {/* LEFT SIDE: Text & Buttons */}
        <div className="space-y-8 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-toffee-brown/40 bg-toffee-brown/10 text-toffee-brown text-xs font-mono tracking-wider font-semibold">
            <LockKeyhole size={12} /> CRYPTOGRAPHIC VERIFICATION
          </div>
          
          <div className="space-y-4">
            <h1 className="text-6xl lg:text-8xl font-bold tracking-tighter text-platinum leading-[0.9]">
              Verify <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-steel-azure via-blue-400 to-white">
                Identity.
              </span>
            </h1>
            <p className="text-lg text-platinum/60 max-w-md mx-auto lg:mx-0 leading-relaxed font-light">
              Eliminate passwords. Authenticate using device-bound keys secured by the blockchain.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4">
            {/* LINK 1: Enroll Page */}
            <Link to="/enroll" className="px-8 py-4 rounded-xl bg-steel-azure text-white font-semibold hover:bg-blue-600 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-3 shadow-[0_0_30px_-10px_#0050A6]">
              Enroll Device <ArrowRight size={18} />
            </Link>
            
            {/* LINK 2: Documentation */}
            <Link to="/docs" className="px-8 py-4 rounded-xl border border-platinum/10 hover:border-platinum/30 hover:bg-white/5 transition-all text-platinum/70 font-mono text-sm flex items-center justify-center">
              Read Documentation
            </Link>
          </div>
        </div>

        {/* RIGHT SIDE: The Scanner Visual */}
        <div className="relative group perspective-1000">
          
          {/* Ambient Glow */}
          <div className="absolute -inset-1 bg-gradient-to-tr from-steel-azure to-deep-twilight rounded-2xl blur-xl opacity-40 group-hover:opacity-60 transition duration-1000 animate-pulse-slow"></div>
          
          <div className="relative bg-black/40 backdrop-blur-xl border border-platinum/10 rounded-2xl p-8 shadow-2xl overflow-hidden">
            
            {/* Header: Session Info */}
            <div className="flex justify-between items-center mb-8 border-b border-platinum/10 pb-4">
              <span className="font-mono text-xs text-platinum/40">SESSION_ID: 8F2A...9C</span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-platinum/30 uppercase">
                    {step === 1 ? 'Waiting' : step === 2 ? 'Verifying' : 'Secured'}
                </span>
                <div className={`w-2 h-2 rounded-full transition-colors duration-500 ${step === 3 ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 'bg-steel-azure animate-pulse'}`}></div>
              </div>
            </div>

            {/* QR / Scanner Area */}
            <div className="flex flex-col items-center justify-center py-10">
              <div className="relative w-56 h-56 bg-white p-4 rounded-xl shadow-[0_0_50px_-15px_rgba(255,255,255,0.1)]">
                {step < 3 ? (
                  <>
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=NullPass_Auth`} 
                      alt="QR" 
                      className="w-full h-full opacity-90 mix-blend-multiply" 
                    />
                    {/* Scanning Beam Animation */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-steel-azure shadow-[0_0_25px_#0050A6] animate-scan z-10"></div>
                  </>
                ) : (
                  <motion.div 
                    initial={{ scale: 0, rotate: -45 }} 
                    animate={{ scale: 1, rotate: 0 }}
                    className="w-full h-full flex items-center justify-center bg-green-50 rounded-lg"
                  >
                    <ShieldCheck className="w-24 h-24 text-green-600 drop-shadow-md" />
                  </motion.div>
                )}
                
                {/* Tech Corners */}
                <Corner position="top-2 left-2 border-t-2 border-l-2" />
                <Corner position="top-2 right-2 border-t-2 border-r-2" />
                <Corner position="bottom-2 left-2 border-b-2 border-l-2" />
                <Corner position="bottom-2 right-2 border-b-2 border-r-2" />
              </div>
            </div>

            {/* Status Steps */}
            <div className="space-y-4 mt-8 bg-black/20 p-4 rounded-lg border border-white/5">
              <StepItem status={step >= 1} text="Generating Cryptographic Nonce" />
              <StepItem status={step >= 2} text="Verifying Device Signature (ECDSA)" />
              <StepItem status={step >= 3} text="Access Granted" active={step === 3} />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}