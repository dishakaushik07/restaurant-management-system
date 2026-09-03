'use client';

import { Telemetry, ConnectionStatus } from './useRobotConnection';

interface TelemetryCardsProps {
  telemetry: Telemetry | null;
  status: ConnectionStatus;
}

export function TelemetryCards({ telemetry, status }: TelemetryCardsProps) {
  if (status === 'disconnected') {
    return <div className="p-4 bg-gray-900 rounded-lg text-gray-500">Not connected</div>;
  }

  if (status === 'connecting') {
    return <div className="p-4 bg-gray-900 rounded-lg text-yellow-500 animate-pulse">Connecting...</div>;
  }

  if (!telemetry) {
    return <div className="p-4 bg-gray-900 rounded-lg text-gray-500">Waiting for data...</div>;
  }

  // Battery color logic
  let batteryColor = 'bg-green-500';
  if (telemetry.battery_percent <= 50) batteryColor = 'bg-yellow-500';
  if (telemetry.battery_percent <= 20) batteryColor = 'bg-red-500';

  // Format uptime
  const mins = Math.floor(telemetry.uptime_sec / 60);
  const secs = telemetry.uptime_sec % 60;
  const uptimeStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {/* Battery */}
      <div className="bg-gray-900 p-4 rounded-xl border border-gray-800">
        <h3 className="text-sm text-gray-400 mb-2 font-bold uppercase tracking-wider">Battery</h3>
        <div className="flex items-center gap-3">
          <span className="text-2xl font-black">{telemetry.battery_percent}%</span>
          <div className="flex-1 h-3 bg-gray-800 rounded-full overflow-hidden">
            <div className={`h-full ${batteryColor} transition-all`} style={{ width: `${Math.max(0, Math.min(100, telemetry.battery_percent))}%` }} />
          </div>
        </div>
      </div>

      {/* Front Distance */}
      <div className={`bg-gray-900 p-4 rounded-xl border ${telemetry.obstacle_detected ? 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]' : 'border-gray-800'}`}>
        <h3 className="text-sm text-gray-400 mb-2 font-bold uppercase tracking-wider">Distance</h3>
        <div className="flex items-center justify-between">
          <span className="text-2xl font-black">{telemetry.distance_front_cm} <span className="text-sm text-gray-500 font-normal">cm</span></span>
          {telemetry.obstacle_detected && (
            <span className="px-2 py-1 bg-red-500/20 text-red-500 text-xs font-black uppercase rounded animate-pulse">Obstacle</span>
          )}
        </div>
      </div>

      {/* Line Sensors */}
      <div className="bg-gray-900 p-4 rounded-xl border border-gray-800">
        <h3 className="text-sm text-gray-400 mb-2 font-bold uppercase tracking-wider">Line Sensors</h3>
        <div className="flex gap-4 items-center h-8">
          <div className="flex flex-col items-center gap-1">
            <div className={`w-4 h-4 rounded-full ${telemetry.line_left ? 'bg-yellow-500 shadow-[0_0_8px_rgba(212,175,55,0.6)]' : 'bg-gray-700'}`} />
            <span className="text-[10px] text-gray-500 uppercase font-bold">L</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className={`w-4 h-4 rounded-full ${telemetry.line_right ? 'bg-yellow-500 shadow-[0_0_8px_rgba(212,175,55,0.6)]' : 'bg-gray-700'}`} />
            <span className="text-[10px] text-gray-500 uppercase font-bold">R</span>
          </div>
        </div>
      </div>

      {/* Environment */}
      <div className="bg-gray-900 p-4 rounded-xl border border-gray-800">
        <h3 className="text-sm text-gray-400 mb-2 font-bold uppercase tracking-wider">Environment</h3>
        <div className="flex gap-4">
          <div>
            <span className="text-lg font-black">{telemetry.temperature_c}°C</span>
          </div>
          <div>
            <span className="text-lg font-black text-blue-400">{telemetry.humidity_percent}%</span>
          </div>
        </div>
      </div>

      {/* Network */}
      <div className="bg-gray-900 p-4 rounded-xl border border-gray-800">
        <h3 className="text-sm text-gray-400 mb-2 font-bold uppercase tracking-wider">WiFi RSSI</h3>
        <div className="text-lg font-black flex items-center gap-2">
          {telemetry.wifi_rssi} dBm
        </div>
      </div>

      {/* Uptime */}
      <div className="bg-gray-900 p-4 rounded-xl border border-gray-800">
        <h3 className="text-sm text-gray-400 mb-2 font-bold uppercase tracking-wider">Uptime</h3>
        <div className="text-lg font-black font-mono">
          {uptimeStr}
        </div>
      </div>
    </div>
  );
}
