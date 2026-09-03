'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [pendingQrCount, setPendingQrCount] = useState(0);
  const [showPopup, setShowPopup] = useState(false);
  const [latestOrderInfo, setLatestOrderInfo] = useState('');
  
  const prevCountRef = useRef(0);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        const q = query(collection(db, 'qr_orders'), where('userId', '==', user.uid));
        
        const unsubscribeSnapshot = onSnapshot(q, (snapshot) => {
          const currentCount = snapshot.docs.length;
          setPendingQrCount(currentCount);
          
          if (currentCount > prevCountRef.current && prevCountRef.current !== 0) {
            // A new order arrived!
            // Let's get the latest order info to show in popup
            const newDocs = snapshot.docChanges().filter(change => change.type === 'added');
            if (newDocs.length > 0) {
              const orderData = newDocs[0].doc.data();
              setLatestOrderInfo(`Table ${orderData.tableNo} - ${orderData.customerName}`);
              setShowPopup(true);
              
              // Play a sound if possible (browsers might block it without interaction, but worth a try)
              try {
                const audio = new Audio('https://www.soundjay.com/buttons/sounds/bell-ringing-05.mp3');
                audio.play().catch(e => console.log('Audio autoplay blocked'));
              } catch(e) {}
              
              // Hide popup after 5 seconds
              setTimeout(() => {
                setShowPopup(false);
              }, 5000);
            }
          }
          
          prevCountRef.current = currentCount;
        });
        
        return () => unsubscribeSnapshot();
      }
    });

    return () => unsubscribeAuth();
  }, []);

  type NavLink = {
    name?: string;
    href?: string;
    type?: string;
    isNew?: boolean;
    isPro?: boolean;
    count?: number;
  };

  const navLinks: NavLink[] = [
    { name: 'Overview & Dashboard', href: '/dashboard' },
    { name: 'Admin / Org', href: '/dashboard/admin' },
    { name: 'Table Management', href: '/dashboard/tables' },
    { name: 'Kitchen Display', href: '/dashboard/kitchen', isNew: true },
    { name: 'Menu Catalog', href: '/dashboard/menu' },
    { name: 'Order Engine', href: '/dashboard/orders', isNew: true },
    { name: 'AI Analytics', href: '/dashboard/analytics', isNew: true },
    { name: 'Robot Fleet', href: '/dashboard/fleet', isNew: true },
    { name: 'Manual Billing', href: '/dashboard/billing' },
    { name: 'Dine-In Orders', href: '/dashboard/dine-in', count: pendingQrCount },
    { name: 'API Billing', href: '/dashboard/api-billing' },
    { name: 'QR Menu', href: '/dashboard/qr-menu', isPro: true },
    { type: 'divider' },
    { name: 'Bill History', href: '/dashboard/history' },
    { name: 'Payment History', href: '/dashboard/payments' },
    { name: 'Settings', href: '/dashboard/settings' },
  ];

  return (
    <div className="flex h-screen bg-page text-text-main font-sans overflow-hidden relative">
      
      {/* Toast Notification Popup */}
      {showPopup && (
        <div className="absolute top-6 right-6 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black p-4 rounded-xl shadow-[0_10px_40px_rgba(212,175,55,0.4)] z-50 animate-bounce flex items-center gap-4 cursor-pointer" onClick={() => setShowPopup(false)}>
          <div className="w-12 h-12 bg-page rounded-full flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-500 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
          </div>
          <div>
            <h3 className="font-black uppercase tracking-widest text-lg leading-tight">New Order!</h3>
            <p className="text-sm font-bold opacity-80">{latestOrderInfo}</p>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <aside className="w-64 bg-page border-r border-border-subtle flex flex-col">
        <div className="p-6 border-b border-border-subtle flex items-center gap-3">
          <img src="/logo.png" alt="Kalvix Nexus Logo" className="w-8 h-8 object-contain" />
          <h2 className="text-lg font-black tracking-widest uppercase text-text-main">Owner Panel</h2>
        </div>
        <nav className="flex-1 p-4 flex flex-col gap-2 overflow-y-auto">
          {navLinks.map((link, idx) => {
            if (link.type === 'divider') {
              return <div key={idx} className="border-t border-border-subtle my-2"></div>;
            }
            
            const isActive = pathname === link.href;
            
            return (
              <Link 
                key={link.href} 
                href={link.href!} 
                className={`p-3 rounded-lg transition-all font-bold tracking-wide text-sm flex justify-between items-center ${
                  isActive 
                    ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/30 shadow-[0_0_15px_rgba(212,175,55,0.1)]' 
                    : 'text-text-muted hover:text-text-main hover:bg-panel border border-transparent'
                }`}
              >
                {link.name}
                
                {/* Badges */}
                <div className="flex gap-2 items-center">
                  {link.count !== undefined && link.count > 0 && (
                    <span className="inline-flex items-center justify-center min-w-[20px] h-[20px] px-1.5 rounded-full text-[10px] font-black bg-red-500 text-text-main shadow-[0_0_10px_rgba(239,68,68,0.5)] animate-pulse">
                      {link.count}
                    </span>
                  )}
                  {link.isNew && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest bg-red-500 text-text-main">New</span>
                  )}
                  {link.isPro && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest bg-yellow-500 text-black">Pro</span>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-border-subtle flex justify-between items-center text-sm text-text-muted">
          <span>Logged in as Owner</span>
          <ThemeToggle />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-auto relative">
        {children}
        
        {/* Guest Assistant Widget */}
        <button className="absolute bottom-6 right-6 w-14 h-14 bg-yellow-500 rounded-full shadow-[0_0_20px_rgba(212,175,55,0.4)] flex items-center justify-center hover:scale-110 transition-transform group z-50">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          <div className="absolute right-16 bottom-2 bg-page border border-border-subtle text-text-main text-xs font-bold uppercase tracking-widest py-2 px-4 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            AI Assistant
          </div>
        </button>
      </main>
    </div>
  );
}
