import React from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ThreatAlert from './pages/ThreatAlert';
import Home from './pages/Home';
import Documentation from './pages/Documentation'; // <--- Import Docs
import Enroll from './pages/Enroll'; // <--- Import Enroll
import { ShieldCheck } from 'lucide-react';

const Navbar = () => {
  const location = useLocation();
  const isAuth = location.pathname === '/dashboard';
  // Hide Navbar on specific standalone pages if desired, or keep it.
  // We will keep it for Docs but maybe hide it for pure Login/Enroll flow if you prefer cleaner look.
  // For now, let's keep it consistent.

  return (
    <nav className="fixed top-0 w-full z-50 border-b border-platinum/10 bg-deep-twilight/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <ShieldCheck className="w-6 h-6 text-steel-azure transition-transform group-hover:rotate-12" />
          <span className="text-xl font-bold tracking-tighter text-platinum">
            Null<span className="text-steel-azure">Pass</span>
          </span>
        </Link>
        
        <div className="flex items-center gap-6">
           {/* Navigation Links */}
           <div className="hidden md:flex gap-6 text-sm font-medium text-platinum/70">
              <Link to="/docs" className="hover:text-white transition-colors">Documentation</Link>
              <Link to="/#features" className="hover:text-white transition-colors">Features</Link>
           </div>

          {isAuth ? (
            <span className="px-3 py-1 rounded-full text-xs font-mono bg-steel-azure/20 text-steel-azure border border-steel-azure/30 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-steel-azure animate-pulse"></span>
              SECURE_CONN
            </span>
          ) : (
            <div className="flex items-center gap-4">
                <Link to="/login" className="text-sm font-mono text-platinum/70 hover:text-steel-azure transition-colors">
                // LOG_IN
                </Link>
                <Link to="/enroll" className="px-4 py-2 rounded-lg bg-steel-azure text-white text-xs font-bold hover:bg-blue-600 transition-colors">
                GET_STARTED
                </Link>
            </div>
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
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/enroll" element={<Enroll />} /> {/* New Route */}
          <Route path="/docs" element={<Documentation />} /> {/* New Route */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/alert" element={<ThreatAlert />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}