import React from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ThreatAlert from './pages/ThreatAlert';
import { Shield } from 'lucide-react';

// Navbar Component
const Navbar = () => {
  const location = useLocation();
  const isAuth = location.pathname === '/dashboard';

  return (
    <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-brand-dark/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <Shield className="w-6 h-6 text-brand-cyan transition-transform group-hover:rotate-12" />
          <span className="text-xl font-bold tracking-tighter text-white">
            Identi<span className="text-brand-cyan">Key</span>
          </span>
        </Link>
        
        <div className="flex items-center gap-4">
          {isAuth ? (
            <span className="px-3 py-1 rounded-full text-xs font-mono bg-brand-cyan-dim text-brand-cyan border border-brand-cyan/20">
              SECURE_CONN_ESTABLISHED
            </span>
          ) : (
            <span className="text-xs font-mono text-slate-500">NO_ACTIVE_SESSION</span>
          )}
        </div>
      </div>
    </nav>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <div className="pt-16 min-h-screen">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/alert" element={<ThreatAlert />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}