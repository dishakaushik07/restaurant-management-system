'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';
import { Moon, Sun, Monitor } from 'lucide-react';

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-8 h-8 rounded-lg bg-panel border border-border-subtle animate-pulse"></div>;
  }

  return (
    <div className="relative group">
      <button 
        className="w-10 h-10 flex items-center justify-center rounded-lg border border-border-subtle bg-panel hover:bg-panel-hover text-text-main transition-colors shadow-sm"
        aria-label="Toggle theme"
      >
        {resolvedTheme === 'dark' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5 text-yellow-500" />}
      </button>

      {/* Dropdown Menu */}
      <div className="absolute right-0 mt-2 w-36 bg-panel border border-border-subtle rounded-xl shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 overflow-hidden">
        <button 
          onClick={() => setTheme('light')}
          className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-panel-hover ${theme === 'light' ? 'text-yellow-500 font-bold bg-panel-hover' : 'text-text-main'}`}
        >
          <Sun className="h-4 w-4" /> Light
        </button>
        <button 
          onClick={() => setTheme('dark')}
          className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-panel-hover ${theme === 'dark' ? 'text-yellow-500 font-bold bg-panel-hover' : 'text-text-main'}`}
        >
          <Moon className="h-4 w-4" /> Dark
        </button>
        <button 
          onClick={() => setTheme('system')}
          className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-panel-hover border-t border-border-subtle ${theme === 'system' ? 'text-yellow-500 font-bold bg-panel-hover' : 'text-text-main'}`}
        >
          <Monitor className="h-4 w-4" /> System
        </button>
      </div>
    </div>
  );
}
