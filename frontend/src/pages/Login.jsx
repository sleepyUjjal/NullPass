import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ScanLine, CheckCircle2, ArrowRight } from 'lucide-react';

export default function Login() {
  const [step, setStep] = useState(1);
  const navigate = useNavigate();

  // Simulate authentication flow
  useEffect(() => {
    // Step 1: User "scans" (simulated delay)
    const timer1 = setTimeout(() => setStep(2), 2500);
    // Step 2: Verification complete
    const timer2 = setTimeout(() => setStep(3), 5000);
    // Step 3: Redirect
    const timer3 = setTimeout(() => {
        if(step === 3) navigate('/dashboard');
    }, 6500);
    
    return () => { clearTimeout(timer1); clearTimeout(timer2); clearTimeout(timer3); };
  }, [step, navigate]);

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-6">
      <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-16 items-center">
        
        {/* Left: Content */}
        <div className="space-y-6 text-center lg:text-left">
          <h1 className="text-5xl lg:text-7xl font-bold tracking-tight text-white leading-[0.9]">
            Verify <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-cyan to-blue-500">
              Identity.
            </span>
          </h1>
          <p className="text-lg text-slate-400 max-w-md mx-auto lg:mx-0 leading-relaxed">
            Eliminate passwords with cryptographic proof. <br/>
            Your device is your key.
          </p>
          
          <div className="flex gap-4 justify-center lg:justify-start pt-4">
            <button className="px-6 py-3 rounded-lg bg-white text-brand-dark font-semibold hover:bg-brand-cyan transition-colors flex items-center gap-2">
              Enroll Device <ArrowRight size={18} />
            </button>
            <button className="px-6 py-3 rounded-lg border border-white/10 hover:border-white/30 transition-colors text-slate-300">
              Documentation
            </button>
          </div>
        </div>

        {/* Right: Scanner UI */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-brand-cyan to-blue-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
          <div className="relative bg-brand-surface border border-white/5 rounded-xl p-8 shadow-2xl overflow-hidden">
            
            {/* Status Header */}
            <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-4">
              <span className="font-mono text-xs text-slate-400">SESSION_ID: 8F2A...9C</span>
              <div className={`w-2 h-2 rounded-full ${step === 3 ? 'bg-green-500' : 'bg-brand-cyan animate-pulse'}`}></div>
            </div>

            {/* QR Area */}
            <div className="flex flex-col items-center justify-center py-8">
              <div className="relative w-48 h-48 bg-white p-3 rounded-lg shadow-inner">
                {step < 3 ? (
                  <>
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=IdentiKey_Auth`} 
                      alt="QR" 
                      className="w-full h-full opacity-90" 
                    />
                    {/* Scanning Beam */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-brand-cyan shadow-[0_0_20px_#64ffda] animate-scan z-10"></div>
                  </>
                ) : (
                  <motion.div 
                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                    className="w-full h-full flex items-center justify-center bg-green-50/10"
                  >
                    <CheckCircle2 className="w-20 h-20 text-green-500" />
                  </motion.div>
                )}
                
                {/* Tech Corners */}
                <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-brand-dark"></div>
                <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-brand-dark"></div>
                <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-brand-dark"></div>
                <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-brand-dark"></div>
              </div>
            </div>

            {/* Stepper */}
            <div className="space-y-3 mt-6">
              <StepItem status={step >= 1} text="Generating Nonce" />
              <StepItem status={step >= 2} text="Verifying Device Signature" />
              <StepItem status={step >= 3} text="Access Granted" active={step === 3} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const StepItem = ({ status, text, active }) => (
  <div className={`flex items-center gap-3 font-mono text-xs transition-colors duration-300 ${status ? 'text-brand-cyan' : 'text-slate-600'}`}>
    <div className={`w-4 h-4 border rounded-full flex items-center justify-center ${status ? 'border-brand-cyan bg-brand-cyan/10' : 'border-slate-700'}`}>
      {status && <div className="w-1.5 h-1.5 bg-brand-cyan rounded-full"></div>}
    </div>
    <span className={active ? 'text-white font-bold' : ''}>{text}</span>
  </div>
);