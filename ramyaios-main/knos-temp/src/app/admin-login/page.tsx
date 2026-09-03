'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Hardcoded Super Admin Credentials
    if (username === 'admin' && password === 'ram') {
      localStorage.setItem('isSuperAdmin', 'true');
      router.push('/admin');
    } else {
      setError('Invalid admin credentials');
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans text-white">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-2">
          <img src="/logo.png" alt="Kalvix Nexus Logo" className="w-10 h-10 object-contain" />
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-1">
            <span className="font-black text-2xl tracking-[0.12em] text-white leading-none">KALVIX</span>
            <span className="font-black text-2xl tracking-[0.12em] text-yellow-500 leading-none">NEXUS</span>
          </div>
        </Link>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-yellow-500 uppercase tracking-widest">Super Admin Access</h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-gray-900 border border-yellow-500/30 py-8 px-4 shadow-[0_0_40px_rgba(212,175,55,0.1)] sm:rounded-xl sm:px-10">
          {error && <div className="mb-4 text-red-500 text-sm text-center font-bold bg-red-500/10 py-2 rounded">{error}</div>}
          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label className="block text-sm font-bold text-gray-300 uppercase tracking-wider mb-2">Username</label>
              <input 
                type="text" 
                required 
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
                className="block w-full px-4 py-3 border border-gray-700 bg-black rounded-md text-white focus:ring-yellow-500 focus:border-yellow-500 transition-colors" 
                placeholder="Enter username"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-300 uppercase tracking-wider mb-2">Password</label>
              <input 
                type="password" 
                required 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                className="block w-full px-4 py-3 border border-gray-700 bg-black rounded-md text-white focus:ring-yellow-500 focus:border-yellow-500 transition-colors" 
                placeholder="Enter password"
              />
            </div>
            <button type="submit" className="w-full py-3 px-4 rounded-md shadow-sm text-sm font-black text-black bg-gradient-to-r from-yellow-600 to-yellow-400 hover:from-yellow-500 hover:to-yellow-300 transition-all uppercase tracking-widest shadow-[0_4px_20px_rgba(212,175,55,0.3)] hover:scale-105">
              Access Admin Panel
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
