import React from 'react';
import { ShieldCheck, Smartphone, Activity, ExternalLink, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 pb-6 border-b border-white/5">
        <div>
          <h2 className="text-3xl font-bold text-white">Security Control</h2>
          <p className="text-slate-400 font-mono text-sm mt-1 flex items-center gap-2">
            Status: <span className="text-green-400">System Nominal</span>
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
          </p>
        </div>
        <div className="flex gap-3">
          <Link to="/alert" className="px-4 py-2 rounded-md border border-brand-alert/50 text-brand-alert font-mono text-xs hover:bg-brand-alert/10 transition">
            SIMULATE_THREAT
          </Link>
          <button className="px-4 py-2 rounded-md bg-white text-brand-dark font-bold font-mono text-xs hover:bg-slate-200 transition">
            REVOKE_ACCESS
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          icon={<ShieldCheck className="text-brand-cyan" />}
          label="Trust Score"
          value="98%"
          sub="Encryption Standard: ECDSA"
        />
        <StatCard 
          icon={<Smartphone className="text-blue-400" />}
          label="Active Devices"
          value="03"
          sub="Primary: MacBook Pro M3"
        />
        <StatCard 
          icon={<Activity className="text-purple-400" />}
          label="Last Audit Block"
          value="#19,204"
          sub="Synced: 12s ago"
        />
      </div>

      {/* Audit Log */}
      <div className="bg-brand-surface rounded-xl border border-white/5 overflow-hidden">
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/2">
          <h3 className="font-bold text-white flex items-center gap-2">
            Immutable Audit Trail
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-brand-cyan-dim text-brand-cyan border border-brand-cyan/20">
              BLOCKCHAIN_VERIFIED
            </span>
          </h3>
          <button className="text-slate-400 hover:text-white transition">
            <RefreshCw size={16} />
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 text-xs font-mono uppercase text-slate-500 bg-black/20">
                <th className="p-4">Timestamp</th>
                <th className="p-4">Event Type</th>
                <th className="p-4">Hash (SHA-256)</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Explorer</th>
              </tr>
            </thead>
            <tbody className="text-sm font-mono text-slate-300 divide-y divide-white/5">
              {[1,2,3,4].map((_, i) => (
                <tr key={i} className="hover:bg-white/5 transition-colors group">
                  <td className="p-4">2026-02-07 14:30:{20 + i}</td>
                  <td className="p-4">
                    <span className="px-2 py-1 rounded bg-white/5 text-xs">AUTH_CHALLENGE</span>
                  </td>
                  <td className="p-4 text-slate-500 group-hover:text-brand-cyan transition-colors">
                    0x7f3...a9b2
                  </td>
                  <td className="p-4 text-green-400">VERIFIED</td>
                  <td className="p-4 text-right">
                    <button className="text-slate-500 hover:text-white">
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
  );
}

const StatCard = ({ icon, label, value, sub }) => (
  <div className="bg-brand-surface p-6 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
    <div className="flex justify-between items-start mb-4">
      <div className="p-2 bg-white/5 rounded-lg">{icon}</div>
      <span className="font-mono text-xs text-slate-500 uppercase">{label}</span>
    </div>
    <div className="text-3xl font-bold text-white mb-1">{value}</div>
    <div className="text-xs text-slate-400 font-mono">{sub}</div>
  </div>
);