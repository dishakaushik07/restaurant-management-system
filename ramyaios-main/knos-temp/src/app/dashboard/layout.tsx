'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { ThemeToggle } from '@/components/ThemeToggle';
import { GuestAssistant } from '@/components/GuestAssistant';
import { Menu, X } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [pendingQrCount, setPendingQrCount] = useState(0);
  const [showPopup, setShowPopup] = useState(false);
  const [latestOrderInfo, setLatestOrderInfo] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
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
    <div className="flex min-h-screen bg-page text-text-main font-sans lg:h-screen lg:overflow-hidden relative">
      
      {/* Toast Notification Popup */}
      {showPopup && (
        <div className="fixed right-4 top-4 z-50 flex cursor-pointer items-center gap-4 rounded-lg border border-yellow-400/30 bg-yellow-400 p-4 text-black shadow-lg sm:right-6 sm:top-6" onClick={() => setShowPopup(false)}>
          <div className="w-12 h-12 bg-page rounded-full flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-500 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
          </div>
          <div>
            <h3 className="font-black uppercase tracking-widest text-lg leading-tight">New Order!</h3>
            <p className="text-sm font-bold opacity-80">{latestOrderInfo}</p>
          </div>
        </div>
      )}

      <button onClick={() => setSidebarOpen(true)} className="fixed left-4 top-4 z-30 grid h-10 w-10 place-items-center rounded-md border border-border-subtle bg-panel text-text-main shadow-sm lg:hidden" aria-label="Open navigation">
        <Menu className="h-5 w-5" />
      </button>
      {sidebarOpen && <button onClick={() => setSidebarOpen(false)} className="fixed inset-0 z-30 bg-black/35 lg:hidden" aria-label="Close navigation overlay" />}

      <aside className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-border-subtle bg-panel shadow-xl transition-transform duration-200 lg:static lg:w-64 lg:translate-x-0 lg:shadow-none ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center gap-3 border-b border-border-subtle px-5 py-5">
          <div className="grid h-8 w-8 place-items-center rounded-md bg-yellow-500 text-sm font-black text-black">R</div>
          <div className="min-w-0 flex-1"><h2 className="text-base font-black tracking-[0.12em] text-text-main">RAMYA</h2><p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.09em] text-text-muted">Restaurant operations</p></div>
          <button onClick={() => setSidebarOpen(false)} className="grid h-8 w-8 place-items-center rounded-md text-text-muted hover:bg-panel-hover lg:hidden" aria-label="Close navigation"><X className="h-4 w-4" /></button>
        </div>
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
          {navLinks.map((link, idx) => {
            if (link.type === 'divider') {
              return <div key={idx} className="border-t border-border-subtle my-2"></div>;
            }
            
            const isActive = pathname === link.href;
            
            return (
              <Link 
                key={link.href} 
                href={link.href!} 
                onClick={() => setSidebarOpen(false)}
                className={`flex min-h-10 items-center justify-between rounded-md px-3 py-2.5 text-sm font-semibold transition-colors ${
                  isActive 
                    ? 'border border-yellow-500/30 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400' 
                    : 'border border-transparent text-text-muted hover:bg-panel-hover hover:text-text-main'
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
                    <span className="inline-flex items-center rounded bg-yellow-500/15 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-yellow-700 dark:text-yellow-400">New</span>
                  )}
                  {link.isPro && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest bg-yellow-500 text-black">Pro</span>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center justify-between border-t border-border-subtle p-4 text-xs text-text-muted">
          <span>Owner workspace</span>
          <ThemeToggle />
        </div>
      </aside>

      {/* Main Content */}
      <main className="min-w-0 flex-1 overflow-auto px-4 pb-8 pt-16 sm:px-6 sm:pt-8 lg:p-8">
        {children}
        
        <GuestAssistant />
      </main>
    </div>
  );
}
