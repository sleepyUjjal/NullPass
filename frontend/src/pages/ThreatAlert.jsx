import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Lock } from 'lucide-react';

export default function ThreatAlert() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="relative w-full max-w-lg bg-brand-surface rounded-2xl border-2 border-brand-alert/30 overflow-hidden shadow-[0_0_50px_rgba(255,75,75,0.2)]">
        
        {/* Animated Background */}
        <div className="absolute inset-0 bg-brand-alert/5 animate-pulse-slow"></div>
        
        <div className="relative z-10 p-8 text-center">
          <div className="w-20 h-20 bg-brand-alert/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-10 h-10 text-brand-alert" />
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-2">Security Alert</h2>
          <div className="inline-block px-3 py-1 rounded bg-brand-alert/20 text-brand-alert border border-brand-alert/20 text-xs font-bold tracking-wider mb-6">
            CRITICAL FAILURE DETECTED
          </div>

          <div className="bg-black/40 rounded-lg p-4 font-mono text-xs text-left space-y-2 text-red-200 mb-8 border border-red-900/30">
            <p>> ERROR_CODE: INVALID_SIGNATURE</p>
            <p>> SOURCE_IP: 192.168.1.X (Unknown Device)</p>
            <p>> ACTION: SESSION_TERMINATED_IMMEDIATELY</p>
            <p>> TIMESTAMP: {new Date().toISOString()}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button className="col-span-2 py-3 rounded-lg bg-brand-alert text-white font-bold hover:bg-red-600 transition shadow-lg shadow-red-900/50 flex items-center justify-center gap-2">
              <Lock size={16} /> Lock Account
            </button>
            <Link to="/" className="py-3 rounded-lg border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition">
              Safe Mode
            </Link>
            <button className="py-3 rounded-lg border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition">
              View Logs
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}