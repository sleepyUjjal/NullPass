import React from 'react';
import { ShieldCheck, Smartphone, Activity, ExternalLink, RefreshCw, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 pb-6 border-b border-platinum/10">
        <div>
          <h2 className="text-3xl font-bold text-platinum">Security Control</h2>
          <p className="text-platinum/50 font-mono text-sm mt-1 flex items-center gap-2">
            Status: <span className="text-steel-azure">System Nominal</span>
            <span className="w-1.5 h-1.5 rounded-full bg-steel-azure animate-pulse"></span>
          </p>
        </div>
        <div className="flex gap-3">
          <Link to="/alert" className="px-4 py-2 rounded-md border border-toffee-brown text-toffee-brown font-mono text-xs hover:bg-toffee-brown/10 transition">
            SIMULATE_THREAT
          </Link>
          <button className="px-4 py-2 rounded-md bg-platinum text-onyx font-bold font-mono text-xs hover:bg-white transition">
            REVOKE_ACCESS
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          icon={<ShieldCheck className="text-steel-azure" />}
          label="Trust Score"
          value="98%"
          sub="Encryption Standard: ECDSA"
          accent="border-steel-azure/30"
        />
        <StatCard 
          icon={<Smartphone className="text-platinum" />}
          label="Active Devices"
          value="03"
          sub="Primary: MacBook Pro M3"
          accent="border-platinum/10"
        />
        {/* Toffee Brown for Audit/Ledger Stats */}
        <StatCard 
          icon={<Activity className="text-toffee-brown" />}
          label="Last Audit Block"
          value="#19,204"
          sub="Synced: 12s ago"
          accent="border-toffee-brown/30"
        />
      </div>

      {/* Audit Log */}
      <div className="bg-deep-twilight rounded-xl border border-platinum/10 overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-platinum/10 flex justify-between items-center bg-onyx/20">
          <h3 className="font-bold text-platinum flex items-center gap-2">
            Immutable Audit Trail
            {/* Toffee Brown Badge for Ledger */}
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-toffee-brown/10 text-toffee-brown border border-toffee-brown/20">
              BLOCKCHAIN_VERIFIED
            </span>
          </h3>
          <button className="text-platinum/40 hover:text-platinum transition">
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
              {[1,2,3,4].map((_, i) => (
                <tr key={i} className="hover:bg-steel-azure/5 transition-colors group">
                  <td className="p-4">2026-02-07 14:30:{20 + i}</td>
                  <td className="p-4">
                    <span className="px-2 py-1 rounded bg-platinum/5 text-xs border border-platinum/10">AUTH_CHALLENGE</span>
                  </td>
                  <td className="p-4 text-platinum/40 group-hover:text-steel-azure transition-colors">
                    0x7f3...a9b2
                  </td>
                  <td className="p-4 text-green-400">VERIFIED</td>
                  <td className="p-4 text-right">
                    <button className="text-platinum/40 hover:text-platinum">
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

const StatCard = ({ icon, label, value, sub, accent }) => (
  <div className={`bg-deep-twilight p-6 rounded-xl border ${accent} hover:bg-deep-twilight/80 transition-colors`}>
    <div className="flex justify-between items-start mb-4">
      <div className="p-2 bg-onyx/40 rounded-lg">{icon}</div>
      <span className="font-mono text-xs text-platinum/50 uppercase">{label}</span>
    </div>
    <div className="text-3xl font-bold text-platinum mb-1">{value}</div>
    <div className="text-xs text-platinum/40 font-mono">{sub}</div>
  </div>
);