import React from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ThreatAlert from './pages/ThreatAlert';
import Home from './pages/Home'; // <--- Import the new Home page
import { ShieldCheck } from 'lucide-react'; // Changed icon to match new branding

// Updated Navbar to match NullPass branding
const Navbar = () => {
  const location = useLocation();
  const isAuth = location.pathname === '/dashboard';

  return (
    <nav className="fixed top-0 w-full z-50 border-b border-platinum/10 bg-deep-twilight/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          {/* Using ShieldCheck to match the Home logo */}
          <ShieldCheck className="w-6 h-6 text-steel-azure transition-transform group-hover:rotate-12" />
          <span className="text-xl font-bold tracking-tighter text-platinum">
            Null<span className="text-steel-azure">Pass</span>
          </span>
        </Link>
        
        <div className="flex items-center gap-4">
          {isAuth ? (
            <span className="px-3 py-1 rounded-full text-xs font-mono bg-steel-azure/20 text-steel-azure border border-steel-azure/30 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-steel-azure animate-pulse"></span>
              SECURE_CONN
            </span>
          ) : (
            // Only show Login button if we are NOT on the dashboard
            <Link to="/login" className="text-sm font-mono text-platinum/70 hover:text-steel-azure transition-colors">
              // LOG_IN
            </Link>
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
          {/* Set the new Home component as the default "/" path */}
          <Route path="/" element={<Home />} />
          
          {/* You can keep Login as a separate route if needed, or remove it since Home includes a login simulation */}
          <Route path="/login" element={<Login />} /> 
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/alert" element={<ThreatAlert />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}