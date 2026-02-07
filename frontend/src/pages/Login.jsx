import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, ArrowRight, LockKeyhole } from 'lucide-react';

export default function Login() {
  const [step, setStep] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    const timer1 = setTimeout(() => setStep(2), 2500);
    const timer2 = setTimeout(() => setStep(3), 5000);
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-toffee-brown/30 bg-toffee-brown/10 text-toffee-brown text-xs font-mono mb-2">
            <LockKeyhole size={12} /> CRYPTOGRAPHIC VERIFICATION
          </div>
          
          <h1 className="text-5xl lg:text-7xl font-bold tracking-tight text-platinum leading-[0.9]">
            Verify <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-steel-azure to-white">
              Identity.
            </span>
          </h1>
          <p className="text-lg text-platinum/60 max-w-md mx-auto lg:mx-0 leading-relaxed">
            Eliminate passwords. Authenticate using device-bound keys secured by the blockchain.
          </p>
          
          <div className="flex gap-4 justify-center lg:justify-start pt-4">
            <button className="px-6 py-3 rounded-lg bg-steel-azure text-white font-semibold hover:bg-blue-600 transition-colors flex items-center gap-2 shadow-[0_0_20px_-5px_#0050A6]">
              Enroll Device <ArrowRight size={18} />
            </button>
            <button className="px-6 py-3 rounded-lg border border-platinum/10 hover:border-toffee-brown/50 hover:text-toffee-brown transition-colors text-platinum/60">
              Documentation
            </button>
          </div>
        </div>

        {/* Right: Scanner UI */}
        <div className="relative group">
          {/* Glow Effect using Steel Azure */}
          <div className="absolute -inset-1 bg-gradient-to-r from-steel-azure to-deep-twilight rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-1000"></div>
          
          <div className="relative bg-deep-twilight border border-platinum/10 rounded-xl p-8 shadow-2xl overflow-hidden">
            
            {/* Status Header */}
            <div className="flex justify-between items-center mb-8 border-b border-platinum/10 pb-4">
              <span className="font-mono text-xs text-platinum/40">SESSION_ID: 8F2A...9C</span>
              <div className={`w-2 h-2 rounded-full ${step === 3 ? 'bg-green-500' : 'bg-steel-azure animate-pulse'}`}></div>
            </div>

            {/* QR Area */}
            <div className="flex flex-col items-center justify-center py-8">
              <div className="relative w-48 h-48 bg-white p-3 rounded-lg shadow-inner">
                {step < 3 ? (
                  <>
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=IdentiKey_Auth`} 
                      alt="QR" 
                      className="w-full h-full opacity-90 mix-blend-multiply" 
                    />
                    {/* Scanning Beam - Steel Azure */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-steel-azure shadow-[0_0_20px_#0050A6] animate-scan z-10"></div>
                  </>
                ) : (
                  <motion.div 
                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                    className="w-full h-full flex items-center justify-center bg-green-50"
                  >
                    <CheckCircle2 className="w-20 h-20 text-green-600" />
                  </motion.div>
                )}
                
                {/* Tech Corners - Onyx */}
                <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-onyx"></div>
                <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-onyx"></div>
                <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-onyx"></div>
                <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-onyx"></div>
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
  <div className={`flex items-center gap-3 font-mono text-xs transition-colors duration-300 ${status ? 'text-steel-azure' : 'text-platinum/30'}`}>
    <div className={`w-4 h-4 border rounded-full flex items-center justify-center ${status ? 'border-steel-azure bg-steel-azure/10' : 'border-platinum/20'}`}>
      {status && <div className="w-1.5 h-1.5 bg-steel-azure rounded-full"></div>}
    </div>
    <span className={active ? 'text-platinum font-bold' : ''}>{text}</span>
  </div>
);