import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, LockKeyhole, ShieldCheck, Loader2 } from 'lucide-react';
import api from '../services/api';

const Corner = ({ position }) => (
  <div className={`absolute w-4 h-4 border-onyx ${position}`}></div>
);

const StepItem = ({ status, text, active }) => (
  <div className={`flex items-center gap-3 font-mono text-xs transition-colors duration-500 ${status ? 'text-steel-azure' : 'text-platinum/20'}`}>
    <div className={`w-4 h-4 rounded-full flex items-center justify-center border transition-all duration-500 ${status ? 'border-steel-azure bg-steel-azure/10' : 'border-platinum/10'}`}>
      {status && <div className="w-1.5 h-1.5 bg-steel-azure rounded-full shadow-[0_0_5px_#0050A6]"></div>}
    </div>
    <span className={active ? 'text-platinum font-bold tracking-wide' : ''}>{text}</span>
  </div>
);

export default function HeroSection() {
  const [qrImage, setQrImage] = useState(null);
  const [challengeId, setChallengeId] = useState(null);
  const [status, setStatus] = useState('INIT'); 
  const navigate = useNavigate();
  const pollInterval = useRef(null);

  useEffect(() => {
    const startLogin = async () => {
      try {
        const res = await api.initiateLogin();
        if (res.data.success) {
          setQrImage(res.data.qr_code);
          setChallengeId(res.data.challenge_id);
          setStatus('READY');
        }
      } catch (err) {
        console.error("Login init failed:", err);
      }
    };
    startLogin();
    return () => clearInterval(pollInterval.current);
  }, []);

  useEffect(() => {
    if (!challengeId || status === 'SUCCESS') return;

    pollInterval.current = setInterval(async () => {
      try {
        const res = await api.checkChallengeStatus(challengeId);
        if (res.data.authenticated) {
          setStatus('SUCCESS');
          clearInterval(pollInterval.current);
          setTimeout(() => navigate('/dashboard'), 1000);
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 2000);

    return () => clearInterval(pollInterval.current);
  }, [challengeId, status, navigate]);

  return (
    <div className="relative z-10 min-h-[calc(100vh-4rem)] flex items-center justify-center p-6">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-20 items-center">
        {/* Left Side (Static Content) */}
        <div className="space-y-8 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-toffee-brown/40 bg-toffee-brown/10 text-toffee-brown text-xs font-mono tracking-wider font-semibold">
            <LockKeyhole size={12} /> CRYPTOGRAPHIC VERIFICATION
          </div>
          <div className="space-y-4">
            <h1 className="text-6xl lg:text-8xl font-bold tracking-tighter text-platinum leading-[0.9]">
              Verify <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-steel-azure via-blue-400 to-white">Identity.</span>
            </h1>
            <p className="text-lg text-platinum/60 max-w-md mx-auto lg:mx-0 leading-relaxed font-light">
              Eliminate passwords. Authenticate using device-bound keys secured by the blockchain.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4">
            <Link to="/enroll" className="px-8 py-4 rounded-xl bg-steel-azure text-white font-semibold hover:bg-blue-600 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-3 shadow-[0_0_30px_-10px_#0050A6]">
              Enroll Device <ArrowRight size={18} />
            </Link>
            <Link to="/docs" className="px-8 py-4 rounded-xl border border-platinum/10 hover:border-platinum/30 hover:bg-white/5 transition-all text-platinum/70 font-mono text-sm flex items-center justify-center">
              Read Documentation
            </Link>
          </div>
        </div>

        {/* Right Side (Scanner) */}
        <div className="relative group perspective-1000">
          <div className="absolute -inset-1 bg-gradient-to-tr from-steel-azure to-deep-twilight rounded-2xl blur-xl opacity-40 group-hover:opacity-60 transition duration-1000 animate-pulse-slow"></div>
          <div className="relative bg-black/40 backdrop-blur-xl border border-platinum/10 rounded-2xl p-8 shadow-2xl overflow-hidden min-h-[400px] flex flex-col justify-center">
            
            <div className="flex justify-between items-center mb-8 border-b border-platinum/10 pb-4 w-full">
              <span className="font-mono text-xs text-platinum/40">
                SESSION: {challengeId ? `${challengeId.substring(0,8)}...` : 'INIT...'}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-platinum/30 uppercase">
                    {status === 'READY' ? 'WAITING' : status}
                </span>
                <div className={`w-2 h-2 rounded-full transition-colors duration-500 ${status === 'SUCCESS' ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 'bg-steel-azure animate-pulse'}`}></div>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center py-4">
              <div className="relative w-56 h-56 bg-white p-4 rounded-xl shadow-[0_0_50px_-15px_rgba(255,255,255,0.1)]">
                {status === 'SUCCESS' ? (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-full h-full flex items-center justify-center bg-green-50 rounded-lg">
                    <ShieldCheck className="w-24 h-24 text-green-600 drop-shadow-md" />
                  </motion.div>
                ) : qrImage ? (
                  <>
                    <img src={qrImage} alt="Login QR" className="w-full h-full opacity-90 mix-blend-multiply" />
                    <div className="absolute top-0 left-0 w-full h-1 bg-steel-azure shadow-[0_0_25px_#0050A6] animate-scan z-10"></div>
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-black/40">
                    <Loader2 className="animate-spin" />
                  </div>
                )}
                <Corner position="top-2 left-2 border-t-2 border-l-2" />
                <Corner position="top-2 right-2 border-t-2 border-r-2" />
                <Corner position="bottom-2 left-2 border-b-2 border-l-2" />
                <Corner position="bottom-2 right-2 border-b-2 border-r-2" />
              </div>
            </div>

            <div className="space-y-4 mt-8 bg-black/20 p-4 rounded-lg border border-white/5 w-full">
              <StepItem status={status !== 'INIT'} text="Generating Cryptographic Nonce" active={status === 'READY'} />
              <StepItem status={status === 'SUCCESS'} text="Verifying Device Signature" active={false} />
              <StepItem status={status === 'SUCCESS'} text="Access Granted" active={status === 'SUCCESS'} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}