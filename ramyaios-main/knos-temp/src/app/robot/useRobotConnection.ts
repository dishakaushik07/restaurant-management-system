'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export interface Telemetry {
  running: boolean;
  battery_percent: number;
  distance_front_cm: number;
  line_left: boolean;
  line_right: boolean;
  humidity_percent: number;
  temperature_c: number;
  obstacle_detected: boolean;
  wifi_rssi: number;
  uptime_sec: number;
}

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export function useRobotConnection(ip: string | undefined) {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [telemetry, setTelemetry] = useState<Telemetry | null>(null);
  const [connectionLost, setConnectionLost] = useState<boolean>(false);

  const wsRef = useRef<WebSocket | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const watchdogIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastMessageTimeRef = useRef<number>(0);
  const intendedDisconnectRef = useRef<boolean>(false);

  const cleanup = useCallback(() => {
    intendedDisconnectRef.current = true;
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    if (watchdogIntervalRef.current) {
      clearInterval(watchdogIntervalRef.current);
      watchdogIntervalRef.current = null;
    }
  }, []);

  const handleMessage = useCallback((data: string) => {
    try {
      const parsed: Telemetry = JSON.parse(data);
      setTelemetry(parsed);
      lastMessageTimeRef.current = Date.now();
      setConnectionLost(false);
      setStatus('connected');
    } catch (e) {
      console.error('Failed to parse telemetry', e);
    }
  }, []);

  const startPolling = useCallback(() => {
    if (!ip) return;
    setStatus('connecting');
    console.log(`Starting polling fallback for ${ip}`);
    
    if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
    
    pollingIntervalRef.current = setInterval(async () => {
      try {
        const res = await fetch(`http://${ip}/telemetry`, { signal: AbortSignal.timeout(2000) });
        if (res.ok) {
          const text = await res.text();
          handleMessage(text);
        }
      } catch (err) {
        console.warn('Polling failed', err);
      }
    }, 1000);
  }, [ip, handleMessage]);

  const connect = useCallback(() => {
    if (!ip) return;
    cleanup();
    intendedDisconnectRef.current = false;
    setStatus('connecting');

    const wsUrl = `ws://${ip}/ws`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setStatus('connected');
    };

    ws.onmessage = (event) => {
      handleMessage(event.data);
    };

    ws.onerror = (err) => {
      console.warn('WebSocket error', err);
    };

    ws.onclose = () => {
      if (!intendedDisconnectRef.current) {
        setStatus('error');
        startPolling();
      }
    };

    if (watchdogIntervalRef.current) clearInterval(watchdogIntervalRef.current);
    watchdogIntervalRef.current = setInterval(() => {
      if (lastMessageTimeRef.current > 0 && Date.now() - lastMessageTimeRef.current > 3000) {
        setConnectionLost(true);
        setStatus('error');
      }
    }, 1000);

  }, [ip, cleanup, handleMessage, startPolling]);

  useEffect(() => {
    if (ip) {
      connect();
    } else {
      cleanup();
      setStatus('disconnected');
      setTelemetry(null);
    }
    return cleanup;
  }, [ip, connect, cleanup]);

  useEffect(() => {
    if (status === 'error' && ip) {
      const timer = setInterval(() => {
        console.log('Attempting to reconnect...');
        connect();
      }, 5000);
      return () => clearInterval(timer);
    }
  }, [status, ip, connect]);

  return { status, telemetry, connectionLost };
}
