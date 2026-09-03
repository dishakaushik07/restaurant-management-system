'use client';
import { useState, useEffect } from 'react';

export default function OverviewDashboard() {
  const [currentTime, setCurrentTime] = useState('');
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-widest text-yellow-500">Live Dashboard</h1>
          <p className="text-text-muted mt-1 text-sm tracking-widest uppercase">Kalvix Nexus Control Center</p>
        </div>
        <div className="font-mono text-xl text-text-main bg-panel border border-border-subtle px-4 py-2 rounded-lg">
          {currentTime || '00:00:00'}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Revenue (Today)', value: '₹42,500', trend: '+12%', color: 'text-green-500' },
          { label: 'Orders / Hr', value: '48', trend: '+5%', color: 'text-green-500' },
          { label: 'Avg Delivery Time', value: '14m', trend: '-2m', color: 'text-green-500' },
          { label: 'Active Robots', value: '3 / 4', trend: 'Optimal', color: 'text-yellow-500' },
        ].map((kpi, i) => (
          <div key={i} className="bg-page border border-border-subtle rounded-xl p-5 shadow-lg relative overflow-hidden group hover:border-gray-600 transition-colors">
            <h3 className="text-text-muted text-xs font-bold uppercase tracking-widest mb-2">{kpi.label}</h3>
            <div className="flex justify-between items-end">
              <span className="text-2xl font-black">{kpi.value}</span>
              <span className={`text-xs font-bold ${kpi.color} bg-panel px-2 py-1 rounded`}>{kpi.trend}</span>
            </div>
            <div className="absolute -bottom-2 -right-2 text-yellow-500/10 group-hover:text-yellow-500/20 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 22h20L12 2zm0 3.83L18.17 19H5.83L12 5.83z" />
              </svg>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Live Orders Feed */}
        <div className="bg-panel border border-border-subtle rounded-xl p-5 lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold uppercase tracking-widest">Live Orders Feed</h2>
            <span className="flex items-center gap-2 text-xs font-bold text-green-500 bg-green-500/10 px-2 py-1 rounded">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              LIVE
            </span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border-subtle text-xs uppercase tracking-wider text-text-muted">
                  <th className="p-3">Order ID</th>
                  <th className="p-3">Source / Table</th>
                  <th className="p-3">Items</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {[
                  { id: '#1042', source: 'Table 4', items: '2x Burger, 1x Cola', status: 'Preparing', amt: '₹450', color: 'text-yellow-500' },
                  { id: '#1043', source: 'API / Zomato', items: '1x Pizza, 2x Fries', status: 'Ready', amt: '₹850', color: 'text-green-500' },
                  { id: '#1044', source: 'Table 12', items: '3x Pasta, 3x Mojito', status: 'Delivering', amt: '₹1200', color: 'text-blue-500' },
                  { id: '#1045', source: 'Table 2', items: '1x Salad', status: 'Accepted', amt: '₹250', color: 'text-text-main' },
                ].map((order, i) => (
                  <tr key={i} className="border-b border-border-subtle/50 hover:bg-page transition-colors">
                    <td className="p-3 font-mono font-bold text-text-main">{order.id}</td>
                    <td className="p-3 font-bold">{order.source}</td>
                    <td className="p-3 text-text-muted text-xs">{order.items}</td>
                    <td className="p-3 font-bold">
                      <span className={`${order.color} bg-panel px-2 py-1 rounded text-xs uppercase tracking-wider`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="p-3 text-right font-bold">
                      {order.amt}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          
          {/* Active Tables Overview */}
          <div className="bg-panel border border-border-subtle rounded-xl p-5">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-sm font-bold uppercase tracking-widest text-text-muted">Active Tables</h2>
              <span className="text-xs font-bold bg-yellow-500/20 text-yellow-500 px-2 py-1 rounded">6 / 15</span>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {Array.from({ length: 15 }).map((_, i) => {
                const isActive = [2, 4, 7, 8, 12, 14].includes(i + 1);
                return (
                  <div 
                    key={i} 
                    className={`aspect-square flex items-center justify-center rounded text-xs font-bold transition-all ${
                      isActive ? 'bg-yellow-500 text-black shadow-[0_0_10px_rgba(212,175,55,0.4)]' : 'bg-page border border-border-subtle text-gray-600'
                    }`}
                  >
                    T{i + 1}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Robot Status Widget */}
          <div className="bg-page border border-border-subtle rounded-xl p-5 shadow-lg">
            <h2 className="text-sm font-bold uppercase tracking-widest text-text-muted mb-4">Robot Fleet Status</h2>
            <div className="space-y-3">
              {[
                { name: 'Nexus-01', state: 'Delivering to T12', battery: '82%', statusColor: 'bg-blue-500' },
                { name: 'Nexus-02', state: 'Idle at Station', battery: '100%', statusColor: 'bg-green-500' },
                { name: 'Nexus-03', state: 'Returning', battery: '45%', statusColor: 'bg-yellow-500' },
                { name: 'Nexus-04', state: 'Charging', battery: '12%', statusColor: 'bg-orange-500' },
              ].map((robot, i) => (
                <div key={i} className="flex justify-between items-center bg-panel p-2 rounded border border-border-subtle">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${robot.statusColor} animate-pulse`}></div>
                    <div>
                      <div className="font-bold text-xs uppercase tracking-wider">{robot.name}</div>
                      <div className="text-[10px] text-text-muted uppercase tracking-widest">{robot.state}</div>
                    </div>
                  </div>
                  <div className="text-xs font-mono text-text-muted">
                    🔋 {robot.battery}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
      
    </div>
  );
}
