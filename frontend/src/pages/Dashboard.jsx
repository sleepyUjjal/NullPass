import React, { useEffect, useState } from 'react';
import { ShieldCheck, Smartphone, Activity, RefreshCw, Lock, FileText, AlertTriangle } from 'lucide-react';
import api from '../services/api';

export default function Dashboard() {
  const [stats, setStats] = useState({
    trust_score: 100,
    active_devices: 0,
    ledger_height: 0,
    logs: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboard = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.getDashboardData();
      // Ensure we handle the structure your backend returns
      setStats(res.data);
    } catch (err) {
      console.error("Dashboard error", err);
      setError('Failed to load live data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  return (
    <div className="min-h-screen pt-20 pb-12 px-6">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 pb-6 border-b border-platinum/10">
          <div>
            <h2 className="text-3xl font-bold text-platinum">Security Control</h2>
            <div className="flex items-center gap-3 mt-2">
              <span className="px-3 py-1 rounded-full text-xs font-mono bg-steel-azure/20 text-steel-azure border border-steel-azure/30 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-steel-azure animate-pulse"></span>
                LIVE_CONNECTION
              </span>
            </div>
          </div>
          <button onClick={fetchDashboard} disabled={loading} className="px-4 py-2 rounded-lg bg-platinum text-onyx font-bold font-mono text-xs hover:bg-white transition flex items-center gap-2 disabled:opacity-50">
             <RefreshCw size={14} className={loading ? "animate-spin" : ""}/> REFRESH
          </button>
        </div>

        {error && (
            <div className="bg-red-900/20 border border-red-500/30 text-red-400 p-4 rounded-xl flex items-center gap-3">
                <AlertTriangle size={20} /> {error}
            </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard 
            icon={<ShieldCheck className="text-steel-azure" size={24} />}
            label="Trust Score"
            value={`${stats.trust_score}%`}
            sub="Device Health Integrity"
            borderColor="border-steel-azure/30"
          />
          <StatCard 
            icon={<Smartphone className="text-platinum" size={24} />}
            label="Active Devices"
            value={stats.active_devices}
            sub="Registered Identities"
            borderColor="border-platinum/10"
          />
          <StatCard 
            icon={<FileText className="text-toffee-brown" size={24} />}
            label="Ledger Height"
            value={`#${stats.ledger_height}`}
            sub="Immutable Events"
            borderColor="border-toffee-brown/40"
          />
        </div>

        {/* Audit Log */}
        <div className="bg-deep-twilight/50 backdrop-blur-md rounded-2xl border border-platinum/10 overflow-hidden shadow-2xl">
          <div className="p-6 border-b border-platinum/10 bg-onyx/30">
            <h3 className="font-bold text-platinum flex items-center gap-3">
              Immutable Audit Trail
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-toffee-brown/10 text-toffee-brown border border-toffee-brown/30 flex items-center gap-1">
                <Lock size={10} /> BLOCKCHAIN_VERIFIED
              </span>
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-platinum/5 text-xs font-mono uppercase text-platinum/40 bg-onyx/40">
                  <th className="p-4">Timestamp</th>
                  <th className="p-4">Event Type</th>
                  <th className="p-4">Hash</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="text-sm font-mono text-platinum/80 divide-y divide-platinum/5">
                {stats.logs && stats.logs.length > 0 ? stats.logs.map((log, i) => (
                  <tr key={i} className="hover:bg-steel-azure/5 transition-colors">
                    <td className="p-4 whitespace-nowrap">{log.timestamp}</td>
                    <td className="p-4"><span className="px-2 py-1 rounded bg-platinum/5 text-xs border border-platinum/10">{log.event_type}</span></td>
                    <td className="p-4 text-platinum/40 font-mono text-xs">{log.hash}</td>
                    <td className="p-4 text-green-400 font-bold text-xs">{log.status}</td>
                  </tr>
                )) : (
                  <tr><td colSpan="4" className="p-8 text-center text-platinum/30">No audit logs available.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

const StatCard = ({ icon, label, value, sub, borderColor }) => (
  <div className={`bg-deep-twilight/40 backdrop-blur-xl p-6 rounded-2xl border ${borderColor}`}>
    <div className="flex justify-between items-start mb-4">
      <div className="p-3 bg-onyx/40 rounded-xl border border-white/5">{icon}</div>
      <span className="font-mono text-xs text-platinum/50 uppercase tracking-wider">{label}</span>
    </div>
    <div className="text-4xl font-bold text-platinum mb-2 tracking-tight">{value}</div>
    <div className="text-xs text-platinum/40 font-mono">{sub}</div>
  </div>
);