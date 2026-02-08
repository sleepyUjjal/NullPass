import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Lock, ShieldAlert, ArrowLeft } from 'lucide-react';

export default function ThreatAlert() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      
      {/* Background Pulse Effect */}
      <div className="absolute inset-0 bg-red-900/10 animate-pulse pointer-events-none"></div>
      
      <div className="relative z-10 w-full max-w-lg">
        <div className="bg-deep-twilight border-2 border-red-500/50 rounded-2xl shadow-[0_0_100px_-20px_rgba(239,68,68,0.3)] overflow-hidden">
          
          {/* Header */}
          <div className="bg-red-500/10 p-8 text-center border-b border-red-500/20">
            <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(239,68,68,0.4)]">
              <ShieldAlert className="w-10 h-10 text-red-500" />
            </div>
            <h2 className="text-3xl font-bold text-platinum mb-2">Security Alert</h2>
            <div className="inline-block px-4 py-1.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold tracking-widest uppercase">
              Critical Failure Detected
            </div>
          </div>

          {/* Terminal Logs */}
          <div className="p-8 space-y-6">
            <div className="bg-onyx/80 rounded-lg p-5 font-mono text-xs space-y-3 border border-red-500/20 text-red-300 shadow-inner">
              <p className="flex gap-2">
                <span className="text-red-500">{'>>'}</span> 
                <span>ERROR_CODE: <span className="text-white font-bold">INVALID_SIGNATURE_ECDSA</span></span>
              </p>
              <p className="flex gap-2">
                <span className="text-red-500">{'>>'}</span> 
                <span>SOURCE_IP: <span className="text-white">192.168.1.XX</span> (Unknown Device)</span>
              </p>
              <p className="flex gap-2">
                <span className="text-red-500">{'>>'}</span> 
                <span>ACTION: <span className="text-white font-bold decoration-wavy underline">SESSION_TERMINATED</span></span>
              </p>
              <p className="flex gap-2 border-t border-red-500/20 pt-2 mt-2 text-platinum/40">
                <span className="text-red-500">{'>>'}</span> 
                <span>TIMESTAMP: {new Date().toISOString()}</span>
              </p>
            </div>

            {/* Actions */}
            <div className="grid gap-4">
              <button className="w-full py-4 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 transition shadow-lg shadow-red-900/50 flex items-center justify-center gap-2 group">
                <Lock size={18} className="group-hover:scale-110 transition-transform"/> 
                LOCK ACCOUNT IMMEDIATELY
              </button>
              
              <div className="grid grid-cols-2 gap-4">
                 <button className="py-3 rounded-xl border border-platinum/10 text-platinum/60 hover:text-platinum hover:bg-white/5 transition font-mono text-xs">
                  VIEW_LOGS
                </button>
                <Link to="/" className="py-3 rounded-xl border border-platinum/10 text-platinum/60 hover:text-platinum hover:bg-white/5 transition font-mono text-xs flex items-center justify-center gap-2">
                  <ArrowLeft size={14} /> SAFE_MODE
                </Link>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}