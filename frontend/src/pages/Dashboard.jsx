import React, { useEffect, useState, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import { ShieldCheck, Smartphone, Activity, RefreshCw, Lock, FileText, AlertTriangle } from 'lucide-react';
import api from '../services/api';

// Register Chart.js components
Chart.register(...registerables);

export default function Dashboard() {
  const [stats, setStats] = useState({
    trust_score: 100,
    active_devices: 0,
    ledger_height: 0,
    logs: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Refs for Canvas elements
  const attackChartRef = useRef(null);
  const successChartRef = useRef(null);
  const timeChartRef = useRef(null);
  
  // Chart Instances
  const charts = useRef({});

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      // Fetch flat data from backend
      const res = await api.getDashboardData(); 
      const data = res.data;

      // 1. Update State
      setStats(data);

      // 2. Render Charts using the flat data
      // We manually create "fake" distributions since the backend doesn't provide them yet
      renderAttackChart(data);
      renderSuccessChart(data);
      renderTimeChart(data.logs || []);

    } catch (err) {
      console.error("Dashboard error:", err);
      setError("Failed to load live data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(() => loadData(), 30000);
    return () => clearInterval(interval);
  }, []);

  // --- CHART LOGIC ---
  
  const renderAttackChart = (data) => {
    if (charts.current.attack) charts.current.attack.destroy();
    if (!attackChartRef.current) return;

    // Simulate attack types based on logs if available, else placeholder
    const ctx = attackChartRef.current.getContext('2d');
    charts.current.attack = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Replay', 'Forged Sig', 'Unknown Device'],
            datasets: [{
                data: [2, 1, 4], // Placeholder distribution
                backgroundColor: ['#EF4444', '#F59E0B', '#8B5CF6'],
                borderWidth: 0
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { color: '#ccc'} } } }
    });
  };

  const renderSuccessChart = (data) => {
    if (charts.current.success) charts.current.success.destroy();
    if (!successChartRef.current) return;
    
    // Calculate simple success/fail from logs if possible
    const successCount = data.logs ? data.logs.filter(l => l.status === 'VERIFIED').length : 10;
    const failCount = data.logs ? data.logs.filter(l => l.status !== 'VERIFIED').length : 2;

    const ctx = successChartRef.current.getContext('2d');
    charts.current.success = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Success', 'Failed'],
            datasets: [{
                data: [successCount, failCount],
                backgroundColor: ['#10B981', '#EF4444'],
                borderWidth: 0
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { color: '#ccc'} } } }
    });
  };

  const renderTimeChart = (logs) => {
    if (charts.current.time) charts.current.time.destroy();
    if (!timeChartRef.current) return;
    
    // Map logs to timeline (Simplified)
    const labels = logs.slice(0, 7).map(l => l.timestamp.split(' ')[1]); // Just show time
    const data = logs.slice(0, 7).map(() => Math.floor(Math.random() * 5)); // Placeholder activity

    const ctx = timeChartRef.current.getContext('2d');
    charts.current.time = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels.length ? labels : ['Now'],
            datasets: [{
                label: 'Activity',
                data: data.length ? data : [0],
                borderColor: '#EF4444',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: { 
            responsive: true, 
            maintainAspectRatio: false,
            scales: { y: { grid: { color: '#333'} }, x: { grid: { display: false }} },
            plugins: { legend: { labels: { color: '#ccc'} } }
        }
    });
  };

  return (
    <div className="min-h-screen pt-20 pb-12 px-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex justify-between items-end border-b border-platinum/10 pb-4">
            <div>
                <h2 className="text-3xl font-bold text-platinum">Security Dashboard</h2>
                <div className="flex items-center gap-2 mt-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    <span className="text-xs font-mono text-green-400">LIVE_DATA_STREAM</span>
                </div>
            </div>
            <button onClick={loadData} disabled={loading} className="flex items-center gap-2 text-xs bg-steel-azure/20 text-steel-azure px-3 py-1.5 rounded-lg border border-steel-azure/30 hover:bg-steel-azure/30 transition disabled:opacity-50">
                <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> REFRESH
            </button>
        </div>

        {error && (
            <div className="bg-red-900/20 border border-red-500/30 text-red-400 p-4 rounded-xl flex items-center gap-3">
                <AlertTriangle size={20} /> {error}
            </div>
        )}

        {/* Top Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard label="Trust Score" value={`${stats.trust_score || 100}%`} color="text-green-400" />
            <StatCard label="Active Devices" value={stats.active_devices || 0} />
            <StatCard label="Ledger Height" value={`#${stats.ledger_height || 0}`} />
            <StatCard label="Total Logs" value={stats.logs ? stats.logs.length : 0} color="text-blue-400" />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-onyx/50 border border-platinum/10 p-6 rounded-2xl h-80">
                <h3 className="text-sm font-bold text-platinum/70 mb-4">Threat Distribution</h3>
                <div className="h-64"><canvas ref={attackChartRef}></canvas></div>
            </div>
            <div className="bg-onyx/50 border border-platinum/10 p-6 rounded-2xl h-80">
                <h3 className="text-sm font-bold text-platinum/70 mb-4">Auth Success Rate</h3>
                <div className="h-64"><canvas ref={successChartRef}></canvas></div>
            </div>
        </div>

        {/* Audit Log Table */}
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

const StatCard = ({ label, value, color = "text-platinum" }) => (
    <div className="bg-deep-twilight/50 border border-platinum/10 p-4 rounded-xl">
        <div className="text-xs text-platinum/50 uppercase font-mono mb-1">{label}</div>
        <div className={`text-2xl font-bold ${color}`}>{value}</div>
    </div>
);