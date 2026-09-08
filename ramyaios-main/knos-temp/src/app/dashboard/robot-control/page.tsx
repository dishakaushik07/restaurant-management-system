'use client';

import { useState, useEffect, useRef } from 'react';

const ESP32_WS_URL = 'ws://10.42.149.253:81';

export default function RobotControlPage() {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [status, setStatus] = useState('Disconnected');
  const [telemetry, setTelemetry] = useState({ state: 'MANUAL', distance_cm: 0, room_temp: 0, obj_temp: 0 });
  const [isListening, setIsListening] = useState(false);
  const [voiceText, setVoiceText] = useState('');

  // Speech Recognition
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript.toLowerCase();
        setVoiceText(transcript);
        
        let cmd = '';
        if (transcript.includes('forward') || transcript.includes('aage') || transcript.includes('go')) cmd = 'FORWARD';
        else if (transcript.includes('back') || transcript.includes('peeche')) cmd = 'REVERSE';
        else if (transcript.includes('left') || transcript.includes('baayein')) cmd = 'LEFT';
        else if (transcript.includes('right') || transcript.includes('daayein')) cmd = 'RIGHT';
        else if (transcript.includes('stop') || transcript.includes('ruk')) cmd = 'STOP';

        if (cmd) {
          sendWSCommand(cmd);
          setTimeout(() => sendWSCommand('STOP'), 2000); // Stop after 2 sec
        }
      };

      recognitionRef.current.onend = () => setIsListening(false);
    }
  }, [ws]);

  const connectWS = () => {
    setStatus('Connecting...');
    const socket = new WebSocket(ESP32_WS_URL);

    socket.onopen = () => {
      setStatus('Connected');
      setWs(socket);
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.telemetry) {
          setTelemetry(data.telemetry);
        }
      } catch (err) {}
    };

    socket.onclose = () => {
      setStatus('Disconnected');
      setWs(null);
    };
  };

  const disconnectWS = () => {
    if (ws) {
      ws.close();
    }
  };

  const sendWSCommand = (cmd: string) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ cmd }));
    }
  };

  const toggleVoice = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setVoiceText('Listening...');
      recognitionRef.current?.start();
      setIsListening(true);
      sendWSCommand('VOICE_MODE');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-panel border border-border-subtle p-6 rounded-xl">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-wider text-yellow-500">Robot Control</h1>
          <p className="text-sm text-text-muted mt-1">Status: <span className={status === 'Connected' ? 'text-green-500' : 'text-red-500'}>{status}</span></p>
        </div>
        <div className="flex gap-4">
          {status === 'Connected' ? (
            <button onClick={disconnectWS} className="px-6 py-2 bg-red-500 text-white font-bold rounded-lg hover:bg-red-600 transition-colors">Disconnect</button>
          ) : (
            <button onClick={connectWS} className="px-6 py-2 bg-green-500 text-white font-bold rounded-lg hover:bg-green-600 transition-colors">Connect</button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Joystick / Controls */}
        <div className="bg-panel border border-border-subtle p-6 rounded-xl flex flex-col items-center justify-center gap-4">
          <h2 className="text-lg font-bold text-text-main mb-4">Manual Control</h2>
          <div className="grid grid-cols-3 gap-2">
            <div />
            <button 
              onPointerDown={() => sendWSCommand('FORWARD')} 
              onPointerUp={() => sendWSCommand('STOP')}
              onPointerLeave={() => sendWSCommand('STOP')}
              className="w-16 h-16 bg-yellow-500 text-black rounded-lg flex items-center justify-center text-2xl font-bold active:scale-95 shadow-lg">↑</button>
            <div />
            <button 
              onPointerDown={() => sendWSCommand('LEFT')} 
              onPointerUp={() => sendWSCommand('STOP')}
              onPointerLeave={() => sendWSCommand('STOP')}
              className="w-16 h-16 bg-yellow-500 text-black rounded-lg flex items-center justify-center text-2xl font-bold active:scale-95 shadow-lg">←</button>
            <button 
              onPointerDown={() => sendWSCommand('STOP')} 
              className="w-16 h-16 bg-red-500 text-white rounded-lg flex items-center justify-center text-xl font-bold active:scale-95 shadow-lg">■</button>
            <button 
              onPointerDown={() => sendWSCommand('RIGHT')} 
              onPointerUp={() => sendWSCommand('STOP')}
              onPointerLeave={() => sendWSCommand('STOP')}
              className="w-16 h-16 bg-yellow-500 text-black rounded-lg flex items-center justify-center text-2xl font-bold active:scale-95 shadow-lg">→</button>
            <div />
            <button 
              onPointerDown={() => sendWSCommand('REVERSE')} 
              onPointerUp={() => sendWSCommand('STOP')}
              onPointerLeave={() => sendWSCommand('STOP')}
              className="w-16 h-16 bg-yellow-500 text-black rounded-lg flex items-center justify-center text-2xl font-bold active:scale-95 shadow-lg">↓</button>
            <div />
          </div>
        </div>

        {/* Telemetry Dashboard */}
        <div className="bg-panel border border-border-subtle p-6 rounded-xl space-y-4">
          <h2 className="text-lg font-bold text-text-main">Live Telemetry</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-page p-4 rounded-lg border border-border-subtle">
              <p className="text-xs text-text-muted uppercase tracking-wider mb-1">State</p>
              <p className="text-xl font-black text-yellow-500">{telemetry.state}</p>
            </div>
            
            <div className={`bg-page p-4 rounded-lg border border-border-subtle ${telemetry.distance_cm && telemetry.distance_cm > 0 && telemetry.distance_cm < 20 ? 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]' : ''}`}>
              <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Distance (Obstacle)</p>
              <p className="text-xl font-black text-text-main">{telemetry.distance_cm != null && telemetry.distance_cm > 0 ? Number(telemetry.distance_cm).toFixed(1) : '--'} cm</p>
            </div>
            
            <div className="bg-page p-4 rounded-lg border border-border-subtle">
              <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Room Temp</p>
              <p className="text-xl font-black text-blue-400">{telemetry.room_temp != null ? Number(telemetry.room_temp).toFixed(1) : '--'} °C</p>
            </div>
            
            <div className="bg-page p-4 rounded-lg border border-border-subtle">
              <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Object / Guest Temp</p>
              <p className="text-xl font-black text-red-400">{telemetry.obj_temp != null ? Number(telemetry.obj_temp).toFixed(1) : '--'} °C</p>
            </div>
          </div>
        </div>
      </div>

      {/* Voice Control */}
      <div className="bg-panel border border-border-subtle p-6 rounded-xl">
        <div className="flex flex-col items-center gap-4">
          <h2 className="text-lg font-bold text-text-main">Voice Command Mode</h2>
          <button 
            onClick={toggleVoice}
            className={`w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-all ${
              isListening ? 'bg-red-500 animate-pulse scale-110' : 'bg-yellow-500 hover:scale-105'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </button>
          <p className="text-sm font-bold text-text-muted min-h-[20px]">{voiceText || 'Click the mic and say "Forward", "Back", "Left", "Right", or "Stop"'}</p>
        </div>
      </div>
    </div>
  );
}
