'use client';
import { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export default function QRMenuPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [totalTables, setTotalTables] = useState<number>(0);
  const [restaurantName, setRestaurantName] = useState('');
  const [loading, setLoading] = useState(true);
  const [baseUrl, setBaseUrl] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setBaseUrl(window.location.origin);
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            if (data.totalTables) setTotalTables(data.totalTables);
            if (data.restaurantName) setRestaurantName(data.restaurantName);
          }
        } catch (error) {
          console.error("Error fetching settings:", error);
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return <div className="p-8 text-text-main">Loading QR Menus...</div>;

  if (totalTables === 0) {
    return (
      <div className="max-w-2xl text-center py-20">
        <h1 className="text-3xl font-bold mb-4 text-text-main uppercase tracking-widest">QR Menu System</h1>
        <p className="text-text-muted mb-6">You haven't set up your total tables yet. Please go to the Settings page and enter the number of tables in your restaurant.</p>
        <a href="/dashboard/settings" className="bg-yellow-500 hover:bg-yellow-400 text-black px-6 py-3 rounded font-bold uppercase tracking-widest transition-colors">Go to Settings</a>
      </div>
    );
  }

  const tables = Array.from({ length: totalTables }, (_, i) => i + 1);

  return (
    <div className="max-w-5xl">
      <div className="flex justify-between items-end mb-8 hide-on-print">
        <div>
          <h1 className="text-3xl font-bold text-text-main uppercase tracking-widest">Dine-In QR Codes</h1>
          <p className="text-text-muted mt-2 text-sm">Download or print these permanent QR codes and place them on your tables. Customers can scan them to place dine-in orders.</p>
        </div>
        <button 
          onClick={() => window.print()}
          className="bg-panel-hover hover:bg-gray-700 text-text-main border border-gray-600 px-6 py-2 rounded font-bold uppercase tracking-widest transition-colors flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
          Print QRs
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 printable-grid">
        {tables.map(tableNo => {
          const scanUrl = `${baseUrl}/scan/${userId}/${tableNo}`;
          const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(scanUrl)}&margin=10`;

          return (
            <div key={tableNo} className="bg-white rounded-xl p-4 flex flex-col items-center shadow-lg border-4 border-yellow-500 qr-card">
              <h3 className="text-black font-black uppercase tracking-widest text-lg mb-1">{restaurantName || 'Restaurant'}</h3>
              <div className="bg-yellow-500 text-black font-black px-4 py-1 rounded-full text-xs uppercase tracking-widest mb-4">
                Table {tableNo}
              </div>
              <img src={qrImageUrl} alt={`QR for Table ${tableNo}`} className="w-40 h-40 object-contain mb-4" crossOrigin="anonymous" />
              <p className="text-text-muted text-[10px] font-bold uppercase tracking-widest text-center">Scan to order</p>
            </div>
          );
        })}
      </div>

      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          .hide-on-print { display: none !important; }
          .printable-grid, .printable-grid * { visibility: visible; }
          .printable-grid { 
            position: absolute; 
            left: 0; 
            top: 0; 
            width: 100%;
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
          }
          .qr-card {
            page-break-inside: avoid;
            margin-bottom: 20px;
          }
        }
      `}</style>
    </div>
  );
}
