import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Chart, registerables } from 'chart.js';
import { ShieldCheck, RefreshCw, Lock, AlertTriangle, Loader2 } from 'lucide-react';
import api from '../services/api';

Chart.register(...registerables);

export default function Dashboard() {
  const navigate = useNavigate();

  // 1. GATEKEEPER STATE: Blocks rendering until auth is confirmed
  const [isAuthorized, setIsAuthorized] = useState(false);

  const [data, setData] = useState({
    stats: null,
    threats: null,
    events: [],
    loading: true,
    error: ''
  });
  
  const charts = useRef({});
  const attackChartRef = useRef(null);
  const successChartRef = useRef(null);

  useEffect(() => {
    const initDashboard = async () => {
        try {
            // 2. CHECK SESSION FIRST
            const sessionRes = await api.validateSession();
            
            if (!sessionRes.data.authenticated) {
                // Not logged in? Redirect immediately.
                // 'replace: true' prevents going back to this page
                navigate('/login', { replace: true });
                return;
            }

            // 3. IF VALID, ALLOW RENDERING & FETCH DATA
            setIsAuthorized(true);
            await loadDashboardData();

        } catch (e) {
            navigate('/login', { replace: true });
        }
    };

    initDashboard();

    const interval = setInterval(() => {
        if (isAuthorized) loadDashboardData();
    }, 30000);

    return () => clearInterval(interval);
  }, [navigate]); // Remove isAuthorized from deps to prevent loops

  const loadDashboardData = async () => {
    setData(prev => ({ ...prev, loading: true, error: '' }));
    try {
      const [statsRes, threatsRes, eventsRes] = await Promise.all([
        api.getStatistics(),
        api.getThreatSummary(),
        api.getEvents()
      ]);

      const newData = {
        stats: statsRes.data,
        threats: threatsRes.data,
        events: eventsRes.data.events,
        loading: false,
        error: ''
      };

      setData(newData);
      // Small delay to let DOM render canvas before Chart.js attaches
      setTimeout(() => renderCharts(newData), 0);

    } catch (err) {
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
         navigate('/login', { replace: true });
         return;
      }
      setData(prev => ({ 
        ...prev, 
        loading: false, 
        error: 'System Offline. Retrying...' 
      }));
    }
  };

  const renderCharts = ({ threats, stats }) => {
    // Attack Chart
    if (attackChartRef.current && threats?.attack_summary) {
        if (charts.current.attack) charts.current.attack.destroy();
        
        const labels = Object.keys(threats.attack_summary);
        const values = Object.values(threats.attack_summary);
        
        charts.current.attack = new Chart(attackChartRef.current, {
            type: 'doughnut',
            data: {
                labels: labels.length ? labels : ['No Threats'],
                datasets: [{
                    data: values.length ? values : [1],
                    backgroundColor: ['#EF4444', '#F59E0B', '#8B5CF6', '#EC4899'],
                    borderWidth: 0
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { color: '#ccc'} } } }
        });
    }

    // Success Chart
    if (successChartRef.current && stats) {
        if (charts.current.success) charts.current.success.destroy();

        charts.current.success = new Chart(successChartRef.current, {
            type: 'pie',
            data: {
                labels: ['Success', 'Failed'],
                datasets: [{
                    data: [stats.successful_events, stats.failed_events],
                    backgroundColor: ['#10B981', '#EF4444'],
                    borderWidth: 0
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { color: '#ccc'} } } }
        });
    }
  };

  // 4. THE GATEKEEPER:
  // If we haven't confirmed auth yet, show a blank loading screen.
  // This prevents the "Flash of Content" security issue.
  if (!isAuthorized) {
    return (
        <div className="min-h-screen bg-onyx flex items-center justify-center">
            <Loader2 className="animate-spin text-steel-azure" size={48} />
        </div>
    );
  }

  // 5. ACTUAL DASHBOARD RENDER (Only reached if isAuthorized === true)
  return (
    <div className="min-h-screen pt-20 pb-12 px-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex justify-between items-end border-b border-platinum/10 pb-4">
            <div>
                <h2 className="text-3xl font-bold text-platinum">Security Overview</h2>
                <div className="flex items-center gap-2 mt-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    <span className="text-xs font-mono text-green-400">SYSTEM_ONLINE</span>
                </div>
            </div>
            <button onClick={loadDashboardData} disabled={data.loading} className="flex items-center gap-2 text-xs bg-steel-azure/20 text-steel-azure px-3 py-1.5 rounded-lg border border-steel-azure/30 hover:bg-steel-azure/30 transition disabled:opacity-50">
                <RefreshCw size={14} className={data.loading ? "animate-spin" : ""} /> REFRESH
            </button>
        </div>

        {data.error && (
            <div className="bg-red-900/20 border border-red-500/30 text-red-400 p-4 rounded-xl flex items-center gap-3">
                <AlertTriangle size={20} /> {data.error}
            </div>
        )}

        {/* Top Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard label="Trust Score" value={data.threats?.trust_level || "..."} color="text-green-400" />
            <StatCard label="Active Devices" value={data.stats?.active_devices || 0} />
            <StatCard label="24h Threats" value={data.threats?.failed_attempts_24h || 0} color="text-red-400" />
            <StatCard label="Total Events" value={data.stats?.total_events || 0} color="text-blue-400" />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-onyx/50 border border-platinum/10 p-6 rounded-2xl h-80">
                <h3 className="text-sm font-bold text-platinum/70 mb-4">Threat Distribution (7 Days)</h3>
                <div className="h-64"><canvas ref={attackChartRef}></canvas></div>
            </div>
            <div className="bg-onyx/50 border border-platinum/10 p-6 rounded-2xl h-80">
                <h3 className="text-sm font-bold text-platinum/70 mb-4">Authentication Success Rate</h3>
                <div className="h-64"><canvas ref={successChartRef}></canvas></div>
            </div>
        </div>

        {/* Recent Events Table */}
        <div className="bg-deep-twilight/50 backdrop-blur-md rounded-2xl border border-platinum/10 overflow-hidden shadow-2xl">
          <div className="p-6 border-b border-platinum/10 bg-onyx/30">
            <h3 className="font-bold text-platinum flex items-center gap-3">
              <Lock size={16} className="text-steel-azure"/> Recent Security Events
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-platinum/5 text-xs font-mono uppercase text-platinum/40 bg-onyx/40">
                  <th className="p-4">Time</th>
                  <th className="p-4">Event</th>
                  <th className="p-4">Device</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="text-sm font-mono text-platinum/80 divide-y divide-platinum/5">
                {data.events.length > 0 ? data.events.map((e, i) => (
                  <tr key={i} className="hover:bg-steel-azure/5 transition-colors">
                    <td className="p-4 text-platinum/50">{new Date(e.timestamp).toLocaleTimeString()}</td>
                    <td className="p-4">{e.event_type}</td>
                    <td className="p-4 text-platinum/70">{e.device_name}</td>
                    <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] border ${e.success ? 'bg-green-900/20 text-green-400 border-green-500/30' : 'bg-red-900/20 text-red-400 border-red-500/30'}`}>
                            {e.success ? 'SUCCESS' : 'FAILED'}
                        </span>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan="4" className="p-8 text-center text-platinum/30">No events found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

const StatCard = ({ label, value, color = "text-platinum" }) => (
    <div className="bg-deep-twilight/50 border border-platinum/10 p-4 rounded-xl">
        <div className="text-xs text-platinum/50 uppercase font-mono mb-1">{label}</div>
        <div className={`text-2xl font-bold ${color}`}>{value}</div>
    </div>
);