'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/navigation';

export default function MobileAppSplash() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // If already logged in, redirect directly to dashboard
        router.push('/dashboard');
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center font-sans">
        <div className="w-24 h-24 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white font-sans flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background ambient light */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-yellow-500/10 rounded-full blur-[100px] pointer-events-none"></div>
      
      <div className="z-10 flex flex-col items-center w-full max-w-sm mx-auto">
        
        {/* Logo */}
        <div className="bg-gray-900 border border-gray-800 p-4 rounded-3xl shadow-[0_0_40px_rgba(212,175,55,0.2)] mb-6">
          <img src="/logo.png" alt="Logo" className="w-24 h-24 object-contain animate-pulse" />
        </div>
        
        {/* Title */}
        <h1 className="text-3xl font-black uppercase tracking-widest text-center mb-1">
          <span className="text-white">Kalvix Nexus</span>
        </h1>
        <h2 className="text-yellow-500 text-xl font-bold uppercase tracking-[0.3em] mb-12">
          POS System
        </h2>

        {/* Buttons */}
        <div className="w-full space-y-4">
          <Link href="/login" className="block w-full bg-gradient-to-r from-yellow-600 to-yellow-400 text-black py-4 rounded-xl font-black uppercase tracking-widest text-center shadow-[0_0_20px_rgba(212,175,55,0.3)] transition-transform active:scale-95">
            Sign In
          </Link>
          
          <Link href="/signup" className="block w-full bg-gray-900 border border-gray-800 text-white py-4 rounded-xl font-bold uppercase tracking-widest text-center shadow transition-transform active:scale-95">
            Create Account
          </Link>
          
          <Link href="/admin-login" className="block w-full bg-black border border-red-500/50 text-red-500 py-4 rounded-xl font-bold uppercase tracking-widest text-center shadow transition-transform active:scale-95 mt-4">
            Super Admin
          </Link>
        </div>

        <div className="mt-12 text-gray-600 text-xs font-bold uppercase tracking-widest text-center">
          V1.0 • Secure Cloud POS
        </div>
      </div>
    </div>
  );
}
