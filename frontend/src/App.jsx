import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ThreatAlert from './pages/ThreatAlert';
import Home from './pages/Home';
import Documentation from './pages/Documentation'; 
import Enroll from './pages/Enroll'; 
import Authenticate from './pages/Authenticate';
import { ShieldCheck, LayoutDashboard, LogOut, Loader2 } from 'lucide-react';
import api from './services/api';

const Navbar = () => {
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Function to check session status
  const checkAuth = async () => {
    try {
      const res = await api.validateSession();
      setIsAuthenticated(res.data.authenticated);
    } catch (err) {
      // 401 Unauthorized or Network Error
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  // 1. Check on Route Change (Standard)
  useEffect(() => {
    checkAuth();
  }, [location.pathname]);

  // 2. LISTEN FOR LOGIN/LOGOUT EVENTS (Immediate Update)
  useEffect(() => {
    const handleAuthChange = () => {
        setLoading(true); 
        checkAuth();
    };

    window.addEventListener('auth-change', handleAuthChange);
    return () => window.removeEventListener('auth-change', handleAuthChange);
  }, []);

  // Hide Navbar on the "Scanner" page
  if (location.pathname === '/authenticate') return null;

  const handleLogout = async () => {
    try {
        await api.logout();
    } catch(e) { console.error(e); }
    
    setIsAuthenticated(false);
    window.dispatchEvent(new Event('auth-change')); // Notify other components
    window.location.href = '/';
  };

  return (
    <nav className="fixed top-0 w-full z-50 border-b border-platinum/10 bg-deep-twilight/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <ShieldCheck className="w-6 h-6 text-steel-azure transition-transform group-hover:rotate-12" />
          <span className="text-xl font-bold tracking-tighter text-platinum">
            Null<span className="text-steel-azure">Pass</span>
          </span>
        </Link>

        {/* Navigation Actions */}
        <div className="flex items-center gap-6">
           <div className="hidden md:flex gap-6 text-sm font-medium text-platinum/70">
              <Link to="/docs" className="hover:text-white transition-colors">Documentation</Link>
           </div>

           {loading ? (
             <Loader2 className="animate-spin text-steel-azure" size={18} />
           ) : isAuthenticated ? (
              <div className="flex items-center gap-4">
                <Link to="/dashboard" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-steel-azure/20 text-steel-azure border border-steel-azure/30 hover:bg-steel-azure/30 transition-all text-xs font-bold">
                  <LayoutDashboard size={14} />
                  DASHBOARD
                </Link>
                <button onClick={handleLogout} className="text-platinum/50 hover:text-red-400 transition-colors" title="Logout">
                  <LogOut size={18} />
                </button>
              </div>
           ) : (
              <div className="flex items-center gap-4">
                  <Link to="/login" className="text-sm font-mono text-platinum/70 hover:text-steel-azure transition-colors">
                    // LOGIN
                  </Link>
                  <Link to="/enroll" className="px-4 py-2 rounded-lg bg-steel-azure text-white text-xs font-bold hover:bg-blue-600 transition-colors shadow-lg shadow-blue-900/20">
                    ENROLL
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
      <div className="pt-16 min-h-screen bg-onyx">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/enroll" element={<Enroll />} />
          <Route path="/docs" element={<Documentation />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/alert" element={<ThreatAlert />} />
          <Route path="/authenticate" element={<Authenticate />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}