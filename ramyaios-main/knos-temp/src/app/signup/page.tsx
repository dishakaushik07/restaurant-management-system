'use client';

import Link from 'next/link';
import { useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
  const [restaurantName, setRestaurantName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;
      
      // Save restaurant data in Firestore
      await setDoc(doc(db, 'users', uid), {
        email,
        restaurantName,
        role: 'owner',
        createdAt: new Date().toISOString(),
      });
      
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to sign up');
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans text-white">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-2">
          <img src="/logo.png" alt="Kalvix Nexus Logo" className="w-10 h-10 object-contain" />
          <span className="text-2xl font-bold tracking-tight">Kalvix Nexus</span>
        </Link>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-white">Register your Restaurant</h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-gray-900/50 backdrop-blur-md py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-800">
          {error && <div className="mb-4 text-red-500 text-sm text-center">{error}</div>}
          <form className="space-y-6" onSubmit={handleSignup}>
            <div>
              <label className="block text-sm font-medium text-gray-300">Restaurant Name</label>
              <input type="text" required value={restaurantName} onChange={(e) => setRestaurantName(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-700 bg-gray-800 rounded-md text-white focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300">Email address</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-700 bg-gray-800 rounded-md text-white focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300">Password</label>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-700 bg-gray-800 rounded-md text-white focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <button type="submit" className="w-full py-2 px-4 rounded-md shadow-sm text-sm font-bold text-black bg-gradient-to-r from-yellow-600 to-yellow-400 hover:from-yellow-500 hover:to-yellow-300 transition-colors uppercase tracking-wider">Create Account</button>
          </form>
        </div>
      </div>
    </div>
  );
}
