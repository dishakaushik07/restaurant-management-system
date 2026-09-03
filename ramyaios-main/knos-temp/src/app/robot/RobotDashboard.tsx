'use client';

import { useState } from 'react';
import { useRobotRegistry } from './useRobotRegistry';
import { useRobotConnection } from './useRobotConnection';
import { TelemetryCards } from './TelemetryCards';
import { CameraPanel } from './CameraPanel';
import { sendCommand, sendManualCommand } from './api';

export function RobotDashboard() {
  const { robots, activeRobot, setActiveRobotId, addRobot, removeRobot } = useRobotRegistry();
  const { status, telemetry, connectionLost } = useRobotConnection(activeRobot?.ip);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newRobotName, setNewRobotName] = useState('');
  const [newRobotIp, setNewRobotIp] = useState('');

  const [manualMode, setManualMode] = useState(false);
  const [targetMarkerId, setTargetMarkerId] = useState<number | null>(null);

  const handleAddRobot = (e: React.FormEvent) => {
    e.preventDefault();
    if (newRobotName && newRobotIp) {
      addRobot(newRobotName, newRobotIp);
      setNewRobotName('');
      setNewRobotIp('');
      setShowAddForm(false);
    }
  };

  const handleManualAction = (dir: 'forward' | 'backward' | 'left' | 'right' | 'stop') => {
    if (activeRobot?.ip) {
      sendManualCommand(activeRobot.ip, dir);
    }
  };

  // State Visualization String
  let stateMsg = 'Idle';
  let stateColor = 'text-gray-500';
  if (telemetry?.running) {
    if (telemetry.obstacle_detected) {
      stateMsg = 'Obstacle — Paused';
      stateColor = 'text-red-500 animate-pulse';
    } else if (!telemetry.line_left || !telemetry.line_right) {
      stateMsg = 'Line lost — Searching';
      stateColor = 'text-yellow-500 animate-pulse';
    } else {
      stateMsg = 'Following path';
      stateColor = 'text-green-400';
    }
  }

  return (
    <div className="flex flex-col h-full bg-black text-white p-4 lg:p-8 overflow-y-auto">
      
      {/* Header / Switcher */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b border-gray-900 pb-4">
        <div>
          <h1 className="text-2xl font-black text-yellow-500 tracking-widest uppercase">Kalvix Serve</h1>
          <p className="text-gray-400 text-sm">Design. Build. Belong.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <select 
            className="bg-gray-900 border border-gray-700 rounded px-3 py-2 outline-none focus:border-yellow-500"
            value={activeRobot?.id || ''}
            onChange={(e) => setActiveRobotId(e.target.value)}
          >
            {robots.length === 0 && <option value="">No robots saved</option>}
            {robots.map(r => (
              <option key={r.id} value={r.id}>{r.name} ({r.ip})</option>
            ))}
          </select>
          <button 
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-gray-800 hover:bg-gray-700 px-3 py-2 rounded text-sm font-bold"
          >
            {showAddForm ? 'Cancel' : '+ Add'}
          </button>
          {activeRobot && (
            <button 
              onClick={() => {
                if(confirm('Remove this robot?')) removeRobot(activeRobot.id);
              }}
              className="bg-red-500/20 text-red-500 hover:bg-red-500/30 px-3 py-2 rounded text-sm font-bold"
            >
              Remove
            </button>
          )}
        </div>
      </div>

      {showAddForm && (
        <form onSubmit={handleAddRobot} className="bg-gray-900 p-4 rounded-xl mb-6 flex gap-4 items-end border border-gray-800">
          <div className="flex-1">
            <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1 font-bold">Nickname</label>
            <input 
              type="text" 
              required
              className="w-full bg-black border border-gray-800 rounded px-3 py-2 outline-none focus:border-yellow-500"
              value={newRobotName}
              onChange={(e) => setNewRobotName(e.target.value)}
              placeholder="e.g. Server 1"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1 font-bold">IP Address</label>
            <input 
              type="text" 
              required
              className="w-full bg-black border border-gray-800 rounded px-3 py-2 outline-none focus:border-yellow-500"
              value={newRobotIp}
              onChange={(e) => setNewRobotIp(e.target.value)}
              placeholder="192.168.1.100"
            />
          </div>
          <button type="submit" className="bg-yellow-500 hover:bg-yellow-600 text-black px-6 py-2 rounded font-black tracking-wider uppercase">
            Save
          </button>
        </form>
      )}

      {/* Alerts */}
      {connectionLost && (
        <div className="bg-red-500 text-white p-3 rounded-lg mb-6 font-bold flex items-center justify-between shadow-[0_0_20px_rgba(239,68,68,0.4)]">
          <span>⚠️ Connection lost — robot state unknown</span>
        </div>
      )}
      {telemetry && telemetry.battery_percent < 15 && (
        <div className="bg-red-500/20 border border-red-500 text-red-500 p-3 rounded-lg mb-6 font-bold text-center">
          LOW BATTERY WARNING: Return to charging dock.
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
        
        {/* Left Column: Controls & State */}
        <div className="flex flex-col gap-6">
          
          {/* Autonomous Status */}
          <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 flex flex-col items-center justify-center text-center">
            <h2 className="text-sm uppercase tracking-widest text-gray-500 font-bold mb-4">Current Behavior</h2>
            <div className={`text-2xl font-black uppercase tracking-widest ${stateColor}`}>
              {stateMsg}
            </div>
          </div>

          {/* Primary Controls */}
          <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 flex-1 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-sm uppercase tracking-widest text-gray-500 font-bold">Drive Control</h2>
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-xs font-bold uppercase text-gray-400">Manual Mode</span>
                <input 
                  type="checkbox" 
                  checked={manualMode} 
                  onChange={(e) => setManualMode(e.target.checked)}
                  className="accent-yellow-500 w-4 h-4 cursor-pointer"
                />
              </label>
            </div>

            {manualMode ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-2">
                <p className="text-xs text-red-400 text-center mb-4 uppercase font-bold">Autonomous disabled.<br/>Press and hold to move.</p>
                <button 
                  className="w-20 h-20 bg-gray-800 rounded-xl active:bg-yellow-500 active:text-black flex items-center justify-center text-2xl"
                  onPointerDown={() => handleManualAction('forward')}
                  onPointerUp={() => handleManualAction('stop')}
                  onPointerLeave={() => handleManualAction('stop')}
                >
                  ↑
                </button>
                <div className="flex gap-2">
                  <button 
                    className="w-20 h-20 bg-gray-800 rounded-xl active:bg-yellow-500 active:text-black flex items-center justify-center text-2xl"
                    onPointerDown={() => handleManualAction('left')}
                    onPointerUp={() => handleManualAction('stop')}
                    onPointerLeave={() => handleManualAction('stop')}
                  >
                    ←
                  </button>
                  <button 
                    className="w-20 h-20 bg-gray-800 rounded-xl active:bg-yellow-500 active:text-black flex items-center justify-center text-2xl"
                    onPointerDown={() => handleManualAction('backward')}
                    onPointerUp={() => handleManualAction('stop')}
                    onPointerLeave={() => handleManualAction('stop')}
                  >
                    ↓
                  </button>
                  <button 
                    className="w-20 h-20 bg-gray-800 rounded-xl active:bg-yellow-500 active:text-black flex items-center justify-center text-2xl"
                    onPointerDown={() => handleManualAction('right')}
                    onPointerUp={() => handleManualAction('stop')}
                    onPointerLeave={() => handleManualAction('stop')}
                  >
                    →
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col gap-4">
                <button 
                  onClick={() => activeRobot?.ip && sendCommand(activeRobot.ip, 'start')}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-black text-4xl font-black uppercase tracking-widest rounded-xl transition-all shadow-[0_10px_30px_rgba(34,197,94,0.3)] hover:shadow-[0_10px_40px_rgba(34,197,94,0.5)]"
                >
                  Start
                </button>
                {/* Make STOP unmissable */}
                <button 
                  onClick={() => activeRobot?.ip && sendCommand(activeRobot.ip, 'stop')}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white text-5xl font-black uppercase tracking-widest rounded-xl transition-all shadow-[0_10px_30px_rgba(220,38,38,0.4)] hover:shadow-[0_10px_40px_rgba(220,38,38,0.6)]"
                >
                  STOP
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Middle/Right: Telemetry & Camera */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <TelemetryCards telemetry={telemetry} status={status} />
          
          {/* Smart Nav Controls / Target Selection */}
          <div className="bg-gray-900 p-4 rounded-xl border border-gray-800">
             <div className="flex justify-between items-center mb-4">
              <h2 className="text-sm uppercase tracking-widest text-gray-500 font-bold">Smart Destination</h2>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(id => (
                  <button
                    key={id}
                    onClick={() => setTargetMarkerId(targetMarkerId === id ? null : id)}
                    className={`px-3 py-1 rounded font-bold text-xs ${
                      targetMarkerId === id 
                        ? 'bg-yellow-500 text-black' 
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    Table {id}
                  </button>
                ))}
              </div>
             </div>
             
             <div className="h-64">
               <CameraPanel ip={activeRobot?.ip} targetMarkerId={targetMarkerId} />
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}
