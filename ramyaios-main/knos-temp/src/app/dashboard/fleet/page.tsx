'use client';
import { useState } from 'react';

type RobotStatus = 'idle' | 'delivering' | 'returning' | 'charging' | 'error';

interface Robot {
  id: string;
  name: string;
  status: RobotStatus;
  battery: number;
  currentTask?: string;
  location?: string;
}

export default function FleetManagementPage() {
  const [robots, setRobots] = useState<Robot[]>([
    { id: 'r1', name: 'Nexus-01', status: 'delivering', battery: 85, currentTask: 'Deliver Order #1044', location: 'En route to Table 12' },
    { id: 'r2', name: 'Nexus-02', status: 'idle', battery: 92, location: 'Kitchen Station A' },
    { id: 'r3', name: 'Nexus-03', status: 'returning', battery: 45, location: 'Hallway B' },
    { id: 'r4', name: 'Nexus-04', status: 'charging', battery: 12, location: 'Charging Dock 1' },
    { id: 'r5', name: 'Nexus-05', status: 'error', battery: 60, currentTask: 'Deliver Order #1041', location: 'Stuck at Table 4' },
  ]);

  const getStatusColor = (status: RobotStatus) => {
    switch (status) {
      case 'idle': return 'text-green-500 bg-green-500/10 border-green-900';
      case 'delivering': return 'text-blue-500 bg-blue-500/10 border-blue-900';
      case 'returning': return 'text-purple-500 bg-purple-500/10 border-purple-900';
      case 'charging': return 'text-yellow-500 bg-yellow-500/10 border-yellow-900';
      case 'error': return 'text-red-500 bg-red-500/10 border-red-900 animate-pulse';
      default: return 'text-text-muted bg-gray-500/10 border-border-subtle';
    }
  };

  const getBatteryIcon = (level: number) => {
    if (level > 80) return '🔋';
    if (level > 30) return '🪫';
    return '⚠️';
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-widest text-text-main">Fleet Management</h1>
          <p className="text-text-muted mt-1 text-sm tracking-widest uppercase">Monitor and control robot operations</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-page border border-border-subtle px-4 py-2 rounded-lg flex gap-4 text-xs font-bold uppercase tracking-widest">
            <span className="text-green-500">1 Idle</span>
            <span className="text-blue-500">2 Active</span>
            <span className="text-yellow-500">1 Charging</span>
            <span className="text-red-500">1 Error</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
        
        {/* Robot List */}
        <div className="col-span-2 grid grid-cols-2 gap-4">
          {robots.map(robot => (
            <div key={robot.id} className="bg-panel border border-border-subtle rounded-xl p-5 hover:border-gray-600 transition-colors flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl bg-page border border-border-subtle`}>
                    🤖
                  </div>
                  <div>
                    <h2 className="font-black tracking-widest text-lg">{robot.name}</h2>
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${getStatusColor(robot.status)}`}>
                      {robot.status}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 font-mono font-bold text-sm bg-page px-2 py-1 rounded border border-border-subtle">
                  {getBatteryIcon(robot.battery)} {robot.battery}%
                </div>
              </div>
              
              <div className="bg-page border border-border-subtle p-3 rounded mt-auto">
                <div className="text-xs text-text-muted font-bold uppercase tracking-widest mb-1">Current State</div>
                <div className="font-bold text-sm truncate">{robot.currentTask || 'No active task'}</div>
                <div className="text-xs text-text-muted mt-1 flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  {robot.location}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 mt-4">
                <button className="bg-panel-hover hover:bg-gray-700 text-text-main font-bold py-2 rounded text-xs uppercase tracking-widest transition-colors">
                  Assign Task
                </button>
                <button className="bg-panel-hover hover:bg-gray-700 text-text-main font-bold py-2 rounded text-xs uppercase tracking-widest transition-colors">
                  Return to Base
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Live Map / Camera Feed Mock */}
        <div className="bg-panel border border-border-subtle rounded-xl flex flex-col overflow-hidden">
          <div className="p-4 border-b border-border-subtle bg-page flex justify-between items-center">
            <h2 className="text-sm font-bold uppercase tracking-widest text-yellow-500">Live Spatial Map</h2>
            <span className="flex items-center gap-1 text-[10px] font-bold text-green-500 uppercase tracking-widest">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              Live Sync
            </span>
          </div>
          <div className="flex-1 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-page relative flex items-center justify-center">
             <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(#1f2937 1px, transparent 1px), linear-gradient(90deg, #1f2937 1px, transparent 1px)', backgroundSize: '10% 10%' }}></div>
             
             {/* Mocking robot dots on the map */}
             <div className="absolute top-[20%] left-[30%] w-3 h-3 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.8)] animate-pulse">
               <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[8px] font-bold">R1</span>
             </div>
             <div className="absolute top-[50%] left-[10%] w-3 h-3 bg-green-500 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.8)]">
               <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[8px] font-bold">R2</span>
             </div>
             <div className="absolute top-[80%] left-[60%] w-3 h-3 bg-purple-500 rounded-full shadow-[0_0_10px_rgba(168,85,247,0.8)]">
               <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[8px] font-bold">R3</span>
             </div>
             
             <div className="absolute bottom-4 left-4 right-4 bg-page/80 backdrop-blur border border-border-subtle p-3 rounded text-center">
               <p className="text-xs font-bold uppercase tracking-widest text-text-muted mb-2">Select a robot to view camera feed</p>
               <button className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-2 rounded text-xs uppercase tracking-widest transition-colors">
                 Open Camera View
               </button>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}
