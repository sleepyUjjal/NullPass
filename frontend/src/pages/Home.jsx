import React from 'react';
import { Link } from 'react-router-dom';
import HeroSection from '../components/HeroSection';
import { 
  ShieldCheck, 
  Database, 
  Smartphone, 
  Code, 
  Building, 
  Globe, 
  ArrowRight, 
  CheckCircle2 
} from 'lucide-react';

// --- Sub-Component: Feature Card ---
const FeatureCard = ({ title, description, icon, align = 'left', linkTarget }) => (
  <div className={`relative p-8 rounded-2xl border border-platinum/10 bg-deep-twilight/50 backdrop-blur-sm overflow-hidden group ${align === 'right' ? 'md:text-right' : ''}`}>
    {/* Hover Glow Effect */}
    <div className={`absolute -inset-1 bg-gradient-to-br from-steel-azure/20 to-transparent rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition duration-500`}></div>
    
    <div className="relative z-10">
      <div className={`w-12 h-12 bg-steel-azure/20 rounded-xl flex items-center justify-center mb-6 text-steel-azure ${align === 'right' ? 'md:ml-auto' : ''}`}>
        {icon}
      </div>
      <h3 className="text-2xl font-bold text-platinum mb-4">{title}</h3>
      <p className="text-platinum/60 mb-6 leading-relaxed">{description}</p>
      
      {/* Functional Link */}
      <Link 
        to={linkTarget} 
        className={`text-steel-azure hover:text-platinum transition-colors flex items-center gap-2 font-semibold ${align === 'right' ? 'md:ml-auto md:flex-row-reverse' : ''}`}
      >
        Read Documentation <ArrowRight size={16} />
      </Link>
    </div>
  </div>
);

// --- Sub-Component: User Type Card ---
const UserTypeCard = ({ title, description, icon }) => (
  <div className="p-8 rounded-xl border border-platinum/5 bg-onyx/50 text-left hover:border-platinum/20 transition-colors">
    <div className="w-12 h-12 bg-toffee-brown/20 rounded-xl flex items-center justify-center mb-6 text-toffee-brown">
      {icon}
    </div>
    <h4 className="text-xl font-bold text-platinum mb-3">{title}</h4>
    <p className="text-platinum/50 text-sm leading-relaxed">{description}</p>
  </div>
);

// --- Main Page Component ---
export default function Home() {
  return (
    <div className="relative z-10 overflow-hidden">
      
      {/* 1. Hero Section (Imported from components) */}
      <HeroSection />

      {/* 2. Value Proposition Section */}
      <section className="py-24 px-6 text-center relative">
        {/* Background Decorative Mesh */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-steel-azure/10 blur-[100px] rounded-full pointer-events-none"></div>

        <div className="relative z-10 max-w-3xl mx-auto space-y-8">
          <h2 className="text-4xl lg:text-5xl font-bold text-platinum tracking-tight">
            Let us handle identity security, so you can <span className="text-transparent bg-clip-text bg-gradient-to-r from-steel-azure to-white">build with confidence.</span>
          </h2>
          <p className="text-platinum/60 text-lg leading-relaxed">
            NullPass eliminates passwords and modernizes authentication with cryptographic, device-bound keys and an immutable audit trail.
          </p>
          
          <div className="flex justify-center gap-4">
             <Link to="/login" className="px-8 py-3 rounded-full bg-steel-azure/20 text-steel-azure border border-steel-azure/30 font-semibold hover:bg-steel-azure/30 transition-colors">
                Try Login Demo
             </Link>
          </div>
        </div>
      </section>

      {/* 3. Features Grid */}
      <section id="features" className="py-16 px-6">
        <div className="max-w-6xl mx-auto space-y-8">
          <FeatureCard
            title="Cryptographic Login"
            description="Authenticate using private keys stored securely on the user's device. No shared secrets, phishable passwords, or OTPs."
            icon={<ShieldCheck size={24} />}
            linkTarget="/docs#introduction"
          />
          <FeatureCard
            title="Immutable Audit Trail"
            description="Every login handshake is cryptographically verified and recorded on an immutable blockchain ledger for absolute transparency."
            icon={<Database size={24} />}
            align="right"
            linkTarget="/docs#security"
          />
          <FeatureCard
            title="Device-Based Trust"
            description="Bind user identity to trusted hardware. Leverage platform authenticators like FaceID, TouchID, and Windows Hello."
            icon={<Smartphone size={24} />}
            linkTarget="/docs#architecture"
          />
        </div>
      </section>

      {/* 4. Visual Image Section */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto relative h-[500px] rounded-3xl overflow-hidden border border-platinum/10 shadow-2xl group">
          <img 
            src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070&auto=format&fit=crop" 
            alt="Secure Digital Environment" 
            className="w-full h-full object-cover opacity-60 grayscale group-hover:grayscale-0 transition-all duration-1000 scale-100 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-onyx via-onyx/50 to-transparent"></div>
          <div className="absolute bottom-0 left-0 p-12 max-w-2xl">
            <h2 className="text-3xl font-bold text-platinum mb-4">Security for modern digital systems.</h2>
            <p className="text-platinum/70 text-lg">
              NullPass is designed to integrate seamlessly into your existing stack, providing robust protection without compromising user experience.
            </p>
            <div className="mt-6 flex items-center gap-4 text-sm font-mono text-steel-azure">
                <span className="flex items-center gap-2"><CheckCircle2 size={16}/> SOC2 Compliant</span>
                <span className="flex items-center gap-2"><CheckCircle2 size={16}/> GDPR Ready</span>
            </div>
          </div>
        </div>
      </section>

      {/* 5. User Types Grid */}
      <section className="py-24 px-6 text-center">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-platinum mb-16">Built for every use case</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <UserTypeCard
              title="For Enterprises"
              description="Eliminate credential stuffing attacks, reduce helpdesk costs, and enforce compliance with ease."
              icon={<Building size={24} />}
            />
            <UserTypeCard
              title="For Developers"
              description="Integrate secure, passwordless auth in minutes with our simple API and SDKs."
              icon={<Code size={24} />}
            />
            <UserTypeCard
              title="For High-Risk Platforms"
              description="Protect sensitive data and transactions with the highest level of cryptographic assurance."
              icon={<Globe size={24} />}
            />
          </div>
        </div>
      </section>

      {/* 6. Footer */}
      <footer className="bg-deep-twilight/30 border-t border-platinum/5 py-16 px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-4 gap-12">
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-8 h-8 text-steel-azure" />
              <span className="text-2xl font-bold tracking-tighter text-platinum">
                Null<span className="text-steel-azure">Pass</span>
              </span>
            </div>
            <p className="text-platinum/50 text-sm leading-relaxed">
              Making authentication invisible, secure, and uncompromising. <br/>
              Powered by Blockchain Technology.
            </p>
          </div>
          
          <div>
            <h4 className="text-platinum font-bold mb-6">Product</h4>
            <ul className="space-y-3 text-platinum/60 text-sm">
              <li><Link to="/#features" className="hover:text-steel-azure transition-colors">Features</Link></li>
              <li><Link to="/docs#security" className="hover:text-steel-azure transition-colors">Security Model</Link></li>
              <li><Link to="/enroll" className="hover:text-steel-azure transition-colors">Device Enrollment</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-platinum font-bold mb-6">Resources</h4>
            <ul className="space-y-3 text-platinum/60 text-sm">
              <li><Link to="/docs" className="hover:text-steel-azure transition-colors">Documentation</Link></li>
              <li><Link to="/docs#api" className="hover:text-steel-azure transition-colors">API Reference</Link></li>
              <li><Link to="/dashboard" className="hover:text-steel-azure transition-colors">Live Dashboard</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-platinum font-bold mb-6">Legal</h4>
            <ul className="space-y-3 text-platinum/60 text-sm">
              <li><a href="#" className="hover:text-steel-azure transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-steel-azure transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-steel-azure transition-colors">Contact Support</a></li>
            </ul>
          </div>
        </div>
        
        <div className="max-w-6xl mx-auto mt-16 pt-8 border-t border-platinum/5 flex flex-col md:flex-row justify-between items-center text-platinum/30 text-xs font-mono">
          <p>© 2026 NullPass Inc. All rights reserved.</p>
          <p>System Status: <span className="text-green-500">OPERATIONAL</span></p>
        </div>
      </footer>
    </div>
  );
}