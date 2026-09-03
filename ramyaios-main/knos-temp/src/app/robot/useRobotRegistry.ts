'use client';

import { useState, useEffect } from 'react';

export interface Robot {
  id: string;
  name: string;
  ip: string;
}

const STORAGE_KEY = 'kalvix_serve_robots';

export function useRobotRegistry() {
  const [robots, setRobots] = useState<Robot[]>([]);
  const [activeRobotId, setActiveRobotId] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setRobots(parsed);
        if (parsed.length > 0) {
          setActiveRobotId(parsed[0].id);
        }
      } catch (e) {
        console.error('Failed to parse robots from localStorage', e);
      }
    }
  }, []);

  const saveRobots = (newRobots: Robot[]) => {
    setRobots(newRobots);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newRobots));
  };

  const addRobot = (name: string, ip: string) => {
    const newRobot: Robot = {
      id: crypto.randomUUID(),
      name,
      ip,
    };
    const newRobots = [...robots, newRobot];
    saveRobots(newRobots);
    if (!activeRobotId) {
      setActiveRobotId(newRobot.id);
    }
  };

  const removeRobot = (id: string) => {
    const newRobots = robots.filter((r) => r.id !== id);
    saveRobots(newRobots);
    if (activeRobotId === id) {
      setActiveRobotId(newRobots.length > 0 ? newRobots[0].id : null);
    }
  };

  const updateRobot = (id: string, updates: Partial<Omit<Robot, 'id'>>) => {
    const newRobots = robots.map((r) => (r.id === id ? { ...r, ...updates } : r));
    saveRobots(newRobots);
  };

  const activeRobot = robots.find((r) => r.id === activeRobotId) || null;

  return {
    robots,
    activeRobotId,
    activeRobot,
    setActiveRobotId,
    addRobot,
    removeRobot,
    updateRobot,
  };
}
