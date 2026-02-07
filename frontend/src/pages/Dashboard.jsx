import React from 'react';
import { ShieldCheck, Smartphone, Activity, ExternalLink, RefreshCw, FileText, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  return (
    <div className="min-h-screen pt-20 pb-12 px-6">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 pb-6 border-b border-platinum/10">
          <div>
            <h2 className="text-3xl font-bold text-platinum">Security Control</h2>
            <div className="flex items-center gap-3 mt-2">
              <span className="px-3 py-1 rounded-full text-xs font-mono bg-steel-azure/20 text-steel-azure border border-steel-azure/30 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-steel-azure animate-pulse"></span>
                SYSTEM_NOMINAL
              </span>
              <span className="text-platinum/40 text-sm font-mono">Session ID: 8F2A...9C</span>
            </div>
          </div>
          <div className="flex gap-3">
            <Link to="/alert" className="px-4 py-2 rounded-lg border border-red-500/30 text-red-400 font-mono text-xs hover:bg-red-500/10 transition flex items-center gap-2">
              <Activity size={14} /> SIMULATE_THREAT
            </Link>
            <button className="px-4 py-2 rounded-lg bg-platinum text-onyx font-bold font-mono text-xs hover:bg-white transition shadow-[0_0_15px_-5px_white]">
              REVOKE_ACCESS
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Trust Score - Steel Azure */}
          <StatCard 
            icon={<ShieldCheck className="text-steel-azure" size={24} />}
            label="Trust Score"
            value="98%"
            sub="Encryption: ECDSA P-256"
            borderColor="border-steel-azure/30"
            glowColor="group-hover:shadow-[0_0_30px_-10px_#0050A6]"
          />
          
          {/* Active Devices - Platinum */}
          <StatCard 
            icon={<Smartphone className="text-platinum" size={24} />}
            label="Active Devices"
            value="03"
            sub="Primary: MacBook Pro M3"
            borderColor="border-platinum/10"
            glowColor="group-hover:shadow-[0_0_30px_-10px_rgba(255,255,255,0.2)]"
          />
          
          {/* Audit Ledger - Toffee Brown */}
          <StatCard 
            icon={<FileText className="text-toffee-brown" size={24} />}
            label="Ledger Height"
            value="#19,204"
            sub="Synced: 12s ago"
            borderColor="border-toffee-brown/40"
            glowColor="group-hover:shadow-[0_0_30px_-10px_#955E42]"
          />
        </div>

        {/* Immutable Audit Log Table */}
        <div className="bg-deep-twilight/50 backdrop-blur-md rounded-2xl border border-platinum/10 overflow-hidden shadow-2xl">
          <div className="p-6 border-b border-platinum/10 flex justify-between items-center bg-onyx/30">
            <h3 className="font-bold text-platinum flex items-center gap-3">
              Immutable Audit Trail
              {/* Toffee Brown Badge */}
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-toffee-brown/10 text-toffee-brown border border-toffee-brown/30 flex items-center gap-1">
                <Lock size={10} /> BLOCKCHAIN_VERIFIED
              </span>
            </h3>
            <button className="text-platinum/40 hover:text-platinum transition p-2 hover:bg-white/5 rounded-lg">
              <RefreshCw size={16} />
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-platinum/5 text-xs font-mono uppercase text-platinum/40 bg-onyx/40">
                  <th className="p-4">Timestamp</th>
                  <th className="p-4">Event Type</th>
                  <th className="p-4">Hash (SHA-256)</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Explorer</th>
                </tr>
              </thead>
              <tbody className="text-sm font-mono text-platinum/80 divide-y divide-platinum/5">
                {[1,2,3,4,5].map((_, i) => (
                  <tr key={i} className="hover:bg-steel-azure/5 transition-colors group">
                    <td className="p-4">2026-02-07 14:30:{20 + i}</td>
                    <td className="p-4">
                      <span className="px-2 py-1 rounded bg-platinum/5 text-xs border border-platinum/10 group-hover:border-steel-azure/30 transition-colors">
                        AUTH_CHALLENGE
                      </span>
                    </td>
                    <td className="p-4 text-platinum/40 group-hover:text-steel-azure transition-colors font-mono">
                      0x7f3...a9b2
                    </td>
                    <td className="p-4 text-green-400 flex items-center gap-2">
                      <CheckCircle size={12} /> VERIFIED
                    </td>
                    <td className="p-4 text-right">
                      <button className="text-platinum/40 hover:text-platinum hover:scale-110 transition-transform">
                        <ExternalLink size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper Component for Stats
const StatCard = ({ icon, label, value, sub, borderColor, glowColor }) => (
  <div className={`group bg-deep-twilight/40 backdrop-blur-xl p-6 rounded-2xl border ${borderColor} transition-all duration-300 ${glowColor}`}>
    <div className="flex justify-between items-start mb-4">
      <div className="p-3 bg-onyx/40 rounded-xl border border-white/5">{icon}</div>
      <span className="font-mono text-xs text-platinum/50 uppercase tracking-wider">{label}</span>
    </div>
    <div className="text-4xl font-bold text-platinum mb-2 tracking-tight">{value}</div>
    <div className="text-xs text-platinum/40 font-mono">{sub}</div>
  </div>
);

const CheckCircle = ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
)