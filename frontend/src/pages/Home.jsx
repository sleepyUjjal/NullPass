import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, ArrowRight, LockKeyhole, ShieldCheck, Smartphone, Database, Code, Building, Globe } from 'lucide-react';

// --- Reused Login Component as Hero Section ---
const HeroSection = () => {
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
    <div className="relative z-10 min-h-[calc(100vh-4rem)] flex items-center justify-center p-6">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-20 items-center">
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
            <button className="px-8 py-4 rounded-xl bg-steel-azure text-white font-semibold hover:bg-blue-600 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-3 shadow-[0_0_30px_-10px_#0050A6]">
              Enroll Device <ArrowRight size={18} />
            </button>
            <button className="px-8 py-4 rounded-xl border border-platinum/10 hover:border-platinum/30 hover:bg-white/5 transition-all text-platinum/70 font-mono text-sm">
              Read Documentation
            </button>
          </div>
        </div>
        <div className="relative group perspective-1000">
          <div className="absolute -inset-1 bg-gradient-to-tr from-steel-azure to-deep-twilight rounded-2xl blur-xl opacity-40 group-hover:opacity-60 transition duration-1000 animate-pulse-slow"></div>
          <div className="relative bg-black/40 backdrop-blur-xl border border-platinum/10 rounded-2xl p-8 shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center mb-8 border-b border-platinum/10 pb-4">
              <span className="font-mono text-xs text-platinum/40">SESSION_ID: 8F2A...9C</span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-platinum/30 uppercase">
                    {step === 1 ? 'Waiting' : step === 2 ? 'Verifying' : 'Secured'}
                </span>
                <div className={`w-2 h-2 rounded-full transition-colors duration-500 ${step === 3 ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 'bg-steel-azure animate-pulse'}`}></div>
              </div>
            </div>
            <div className="flex flex-col items-center justify-center py-10">
              <div className="relative w-56 h-56 bg-white p-4 rounded-xl shadow-[0_0_50px_-15px_rgba(255,255,255,0.1)]">
                {step < 3 ? (
                  <>
                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=NullPass_Auth`} alt="QR" className="w-full h-full opacity-90 mix-blend-multiply" />
                    <div className="absolute top-0 left-0 w-full h-1 bg-steel-azure shadow-[0_0_25px_#0050A6] animate-scan z-10"></div>
                  </>
                ) : (
                  <motion.div initial={{ scale: 0, rotate: -45 }} animate={{ scale: 1, rotate: 0 }} className="w-full h-full flex items-center justify-center bg-green-50 rounded-lg">
                    <ShieldCheck className="w-24 h-24 text-green-600 drop-shadow-md" />
                  </motion.div>
                )}
                <Corner position="top-2 left-2 border-t-2 border-l-2" />
                <Corner position="top-2 right-2 border-t-2 border-r-2" />
                <Corner position="bottom-2 left-2 border-b-2 border-l-2" />
                <Corner position="bottom-2 right-2 border-b-2 border-r-2" />
              </div>
            </div>
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
};

// --- Helper Components ---
const StepItem = ({ status, text, active }) => (
  <div className={`flex items-center gap-3 font-mono text-xs transition-colors duration-500 ${status ? 'text-steel-azure' : 'text-platinum/20'}`}>
    <div className={`w-4 h-4 rounded-full flex items-center justify-center border transition-all duration-500 ${status ? 'border-steel-azure bg-steel-azure/10' : 'border-platinum/10'}`}>
      {status && <div className="w-1.5 h-1.5 bg-steel-azure rounded-full shadow-[0_0_5px_#0050A6]"></div>}
    </div>
    <span className={active ? 'text-platinum font-bold tracking-wide' : ''}>{text}</span>
  </div>
);

const Corner = ({ position }) => (<div className={`absolute w-4 h-4 border-onyx ${position}`}></div>);

const FeatureCard = ({ title, description, icon, align = 'left' }) => (
  <div className={`relative p-8 rounded-2xl border border-platinum/10 bg-deep-twilight/50 backdrop-blur-sm overflow-hidden group ${align === 'right' ? 'md:text-right' : ''}`}>
    <div className={`absolute -inset-1 bg-gradient-to-br from-steel-azure/20 to-transparent rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition duration-500`}></div>
    <div className="relative z-10">
      <div className={`w-12 h-12 bg-steel-azure/20 rounded-xl flex items-center justify-center mb-6 text-steel-azure ${align === 'right' ? 'md:ml-auto' : ''}`}>
        {icon}
      </div>
      <h3 className="text-2xl font-bold text-platinum mb-4">{title}</h3>
      <p className="text-platinum/60 mb-6">{description}</p>
      <button className="text-steel-azure hover:text-platinum transition-colors flex items-center gap-2 font-semibold">
        Learn more <ArrowRight size={16} />
      </button>
    </div>
  </div>
);

const UserTypeCard = ({ title, description, icon }) => (
  <div className="p-6 rounded-xl border border-platinum/5 bg-onyx/50 text-left">
    <div className="w-10 h-10 bg-toffee-brown/20 rounded-lg flex items-center justify-center mb-4 text-toffee-brown">
      {icon}
    </div>
    <h4 className="text-xl font-bold text-platinum mb-2">{title}</h4>
    <p className="text-platinum/50 text-sm">{description}</p>
  </div>
);

// --- Main Homepage Component ---
export default function Home() {
  return (
    <div className="relative z-10">
      {/* Hero Section (Reused Login) */}
      <HeroSection />

      {/* Intro Text Section */}
      <section className="py-24 px-6 text-center relative">
        <div className="max-w-3xl mx-auto space-y-6">
          <h2 className="text-4xl lg:text-5xl font-bold text-platinum">
            Let us handle identity security, so you can <span className="text-transparent bg-clip-text bg-gradient-to-r from-steel-azure to-white">build with confidence.</span>
          </h2>
          <p className="text-platinum/60 text-lg">
            NullPass eliminates passwords and modernizes authentication with cryptographic, device-bound keys and an immutable audit trail.
          </p>
          <button className="px-8 py-3 rounded-full bg-steel-azure/20 text-steel-azure border border-steel-azure/30 font-semibold hover:bg-steel-azure/30 transition-colors">
            Explore Platform
          </button>
        </div>
      </section>

      {/* Feature Cards Section */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto space-y-8">
          <FeatureCard
            title="Cryptographic Login"
            description="Authenticate using private keys stored securely on the user's device. No shared secrets, phishable passwords, or OTPs."
            icon={<ShieldCheck size={24} />}
          />
          <FeatureCard
            title="Security-First Authentication"
            description="Every login handshake is cryptographically verified and recorded on an immutable blockchain ledger for absolute transparency."
            icon={<Database size={24} />}
            align="right"
          />
          <FeatureCard
            title="Device-Based Trust"
            description="Bind user identity to trusted hardware. Leverage platform authenticators like FaceID, TouchID, and Windows Hello."
            icon={<Smartphone size={24} />}
          />
        </div>
      </section>

      {/* Image Section */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto relative h-[500px] rounded-2xl overflow-hidden border border-platinum/10">
          <img 
            src="https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" 
            alt="Person using computer securely" 
            className="w-full h-full object-cover opacity-50 grayscale hover:grayscale-0 transition-all duration-1000"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-onyx via-transparent to-transparent"></div>
          <div className="absolute bottom-0 left-0 p-12">
            <h2 className="text-3xl font-bold text-platinum mb-4">Security for modern digital systems.</h2>
            <p className="text-platinum/70 max-w-xl">
              NullPass is designed to integrate seamlessly into your existing stack, providing robust protection without compromising user experience.
            </p>
          </div>
        </div>
      </section>

      {/* User Types Section */}
      <section className="py-24 px-6 text-center">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-platinum mb-12">Built for every use case</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <UserTypeCard
              title="For Enterprises"
              description="Eliminate credential stuffing attacks, reduce helpdesk costs, and enforce compliance with ease."
              icon={<Building size={20} />}
            />
            <UserTypeCard
              title="For Developers"
              description="Integrate secure, passwordless auth in minutes with our simple API and SDKs."
              icon={<Code size={20} />}
            />
            <UserTypeCard
              title="For High-Risk Platforms"
              description="Protect sensitive data and transactions with the highest level of cryptographic assurance."
              icon={<Globe size={20} />}
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-deep-twilight/30 border-t border-platinum/5 py-12 px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-steel-azure" />
              <span className="text-xl font-bold tracking-tighter text-platinum">
                Null<span className="text-steel-azure">Pass</span>
              </span>
            </div>
            <p className="text-platinum/50 text-sm">
              Making authentication invisible, secure, and uncompromising.
            </p>
          </div>
          <div>
            <h4 className="text-platinum font-bold mb-4">Product</h4>
            <ul className="space-y-2 text-platinum/60 text-sm">
              <li><a href="#" className="hover:text-steel-azure">Features</a></li>
              <li><a href="#" className="hover:text-steel-azure">Security</a></li>
              <li><a href="#" className="hover:text-steel-azure">Roadmap</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-platinum font-bold mb-4">Resources</h4>
            <ul className="space-y-2 text-platinum/60 text-sm">
              <li><a href="#" className="hover:text-steel-azure">Documentation</a></li>
              <li><a href="#" className="hover:text-steel-azure">API Reference</a></li>
              <li><a href="#" className="hover:text-steel-azure">Blog</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-platinum font-bold mb-4">Company</h4>
            <ul className="space-y-2 text-platinum/60 text-sm">
              <li><a href="#" className="hover:text-steel-azure">About Us</a></li>
              <li><a href="#" className="hover:text-steel-azure">Careers</a></li>
              <li><a href="#" className="hover:text-steel-azure">Contact</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-6xl mx-auto mt-12 pt-8 border-t border-platinum/5 flex flex-col md:flex-row justify-between items-center text-platinum/40 text-sm">
          <p>© 2026 NullPass. All rights reserved.</p>
          <div className="flex gap-4 mt-4 md:mt-0">
            <a href="#" className="hover:text-platinum">Privacy Policy</a>
            <a href="#" className="hover:text-platinum">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
}