import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Server, Database, Lock, Terminal, ArrowLeft, FileText, Cpu, Key } from 'lucide-react';

export default function Documentation() {
  return (
    <div className="min-h-screen pt-20 pb-12 px-6 max-w-7xl mx-auto flex gap-12">
      
      {/* Sidebar Navigation */}
      <aside className="w-64 hidden lg:block shrink-0">
        <div className="sticky top-24 space-y-8">
          <div>
             <Link to="/" className="flex items-center gap-2 text-platinum/50 hover:text-steel-azure mb-6 transition-colors">
                <ArrowLeft size={16} /> Back to Home
             </Link>
            <h3 className="font-bold text-platinum mb-4 px-2">Table of Contents</h3>
            <ul className="space-y-1">
              <NavItem href="#introduction" label="Introduction" active />
              <NavItem href="#architecture" label="System Architecture" />
              <NavItem href="#security" label="Security Model" />
              <NavItem href="#api" label="API Reference" />
            </ul>
          </div>
          
          <div className="p-4 bg-deep-twilight/50 rounded-xl border border-platinum/10">
            <h4 className="text-sm font-bold text-platinum mb-2">Need Help?</h4>
            <p className="text-xs text-platinum/60 mb-3">Contact our security engineering team for integration support.</p>
            <button className="w-full py-2 rounded-lg bg-steel-azure/20 text-steel-azure text-xs font-bold border border-steel-azure/30 hover:bg-steel-azure/30 transition">
              Contact Support
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 space-y-16">
        
        {/* Section: Introduction */}
        <section id="introduction" className="space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-steel-azure/20 rounded-lg text-steel-azure"><ShieldCheck size={24} /></div>
            <h1 className="text-4xl font-bold text-platinum">Introduction</h1>
          </div>
          <p className="text-lg text-platinum/70 leading-relaxed">
            NullPass (formerly IdentiKey) is a Digital Security System (DSS) that replaces traditional password and OTP-based authentication with 
            <span className="text-steel-azure"> cryptographic, device-bound identity verification</span>[cite: 4].
          </p>
          <p className="text-platinum/60 leading-relaxed">
            Conventional authentication suffers from password reuse, phishing, and SIM-swap attacks[cite: 8, 9, 10]. 
            NullPass solves this by using a challenge-response mechanism based on public-private key cryptography, ensuring zero shared secrets 
            and recording all security events on a tamper-proof blockchain audit layer[cite: 5, 6].
          </p>
        </section>

        {/* Section: Architecture */}
        <section id="architecture" className="space-y-8 pt-8 border-t border-platinum/5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-toffee-brown/20 rounded-lg text-toffee-brown"><Server size={24} /></div>
            <h2 className="text-3xl font-bold text-platinum">System Architecture</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <ArchCard 
              icon={<Cpu />} 
              title="Trusted Device (Client)" 
              desc="Generates and stores the private key securely. Signs authentication challenges acting as a possession-based factor[cite: 29, 30, 31]."
            />
            <ArchCard 
              icon={<Server />} 
              title="Authentication Server" 
              desc="Generates challenges, verifies signatures using stored public keys, and issues session tokens[cite: 24, 25, 26]."
            />
            <ArchCard 
              icon={<Database />} 
              title="Blockchain Audit Layer" 
              desc="Stores immutable hashes of authentication events to ensure a tamper-proof security log[cite: 37, 38, 39]."
            />
            <ArchCard 
              icon={<Lock />} 
              title="Security Dashboard" 
              desc="Provides real-time visibility into authentication status, failed attempts, and threat alerts[cite: 33, 34, 35]."
            />
          </div>
        </section>

        {/* Section: Security */}
        <section id="security" className="space-y-6 pt-8 border-t border-platinum/5">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-green-500/20 rounded-lg text-green-500"><Key size={24} /></div>
            <h2 className="text-3xl font-bold text-platinum">Security Features</h2>
          </div>
          <ul className="space-y-4">
            <FeatureItem title="Phishing Resistance" desc="Since the private key never leaves the device, it cannot be phished or intercepted[cite: 110]." />
            <FeatureItem title="No Shared Secrets" desc="The server only stores public keys. A database breach reveals no sensitive authentication data[cite: 112]." />
            <FeatureItem title="Replay Attack Protection" desc="Unique cryptographic nonces prevent attackers from reusing captured signatures[cite: 61]." />
            <FeatureItem title="Immutable Audit Trail" desc="Every login attempt is hashed and stored on-chain, preventing log tampering[cite: 116]." />
          </ul>
        </section>

        {/* Section: API */}
        <section id="api" className="space-y-6 pt-8 border-t border-platinum/5">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-purple-500/20 rounded-lg text-purple-500"><Terminal size={24} /></div>
            <h2 className="text-3xl font-bold text-platinum">API Reference</h2>
          </div>
          <div className="bg-onyx/50 rounded-xl border border-platinum/10 p-6 font-mono text-sm overflow-x-auto">
            <p className="text-platinum/40 mb-4">// Endpoint: Initiate Enrollment</p>
            <p className="text-blue-400">POST <span className="text-platinum">/api/v1/auth/enroll/initiate</span></p>
            <pre className="text-platinum/70 mt-2">
{`{
  "device_id": "uuid-v4",
  "client_metadata": {
    "user_agent": "Mozilla/5.0...",
    "platform": "MacOS"
  }
}`}
            </pre>
            <p className="text-platinum/40 mt-6 mb-4">// Endpoint: Verify Signature</p>
            <p className="text-green-400">POST <span className="text-platinum">/api/v1/auth/verify</span></p>
          </div>
        </section>

      </main>
    </div>
  );
}

const NavItem = ({ href, label, active }) => (
  <li>
    <a href={href} className={`block px-4 py-2 rounded-lg text-sm transition-colors ${active ? 'bg-steel-azure/10 text-steel-azure font-bold' : 'text-platinum/60 hover:text-platinum hover:bg-white/5'}`}>
      {label}
    </a>
  </li>
);

const ArchCard = ({ icon, title, desc }) => (
  <div className="p-6 bg-deep-twilight/30 border border-platinum/10 rounded-xl hover:border-steel-azure/30 transition-colors">
    <div className="text-steel-azure mb-4">{icon}</div>
    <h3 className="text-xl font-bold text-platinum mb-2">{title}</h3>
    <p className="text-sm text-platinum/60 leading-relaxed">{desc}</p>
  </div>
);

const FeatureItem = ({ title, desc }) => (
  <li className="flex gap-4">
    <div className="mt-1 w-1.5 h-1.5 rounded-full bg-steel-azure shrink-0"></div>
    <div>
      <h4 className="text-platinum font-bold">{title}</h4>
      <p className="text-platinum/60 text-sm mt-1">{desc}</p>
    </div>
  </li>
);