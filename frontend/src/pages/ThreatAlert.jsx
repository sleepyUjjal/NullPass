import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Lock } from 'lucide-react';

export default function ThreatAlert() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="relative w-full max-w-lg bg-deep-twilight rounded-2xl border-2 border-red-500/30 overflow-hidden shadow-[0_0_50px_rgba(220,38,38,0.2)]">
        
        {/* Animated Background */}
        <div className="absolute inset-0 bg-red-500/5 animate-pulse-slow"></div>
        
        <div className="relative z-10 p-8 text-center">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-10 h-10 text-red-500" />
          </div>
          
          <h2 className="text-2xl font-bold text-platinum mb-2">Security Alert</h2>
          <div className="inline-block px-3 py-1 rounded bg-red-500/20 text-red-500 border border-red-500/20 text-xs font-bold tracking-wider mb-6">
            CRITICAL FAILURE DETECTED
          </div>

          <div className="bg-onyx/60 rounded-lg p-4 font-mono text-xs text-left space-y-2 text-red-200 mb-8 border border-red-900/30">
            <p>> ERROR_CODE: INVALID_SIGNATURE</p>
            <p>> SOURCE_IP: 192.168.1.X (Unknown Device)</p>
            <p>> ACTION: SESSION_TERMINATED_IMMEDIATELY</p>
            <p>> TIMESTAMP: {new Date().toISOString()}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button className="col-span-2 py-3 rounded-lg bg-red-600 text-white font-bold hover:bg-red-700 transition shadow-lg shadow-red-900/50 flex items-center justify-center gap-2 cursor-pointer">
              <Lock size={16} /> Lock Account
            </button>
            <Link to="/" className="py-3 rounded-lg border border-platinum/10 text-platinum/60 hover:text-platinum hover:bg-platinum/5 transition text-center">
              Safe Mode
            </Link>
            <button className="py-3 rounded-lg border border-platinum/10 text-platinum/60 hover:text-platinum hover:bg-platinum/5 transition">
              View Logs
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}