'use client';
import { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs, addDoc, deleteDoc } from 'firebase/firestore';

export default function APIBilling() {
  const [userId, setUserId] = useState<string | null>(null);
  const [invoicePrefix, setInvoicePrefix] = useState('INV');
  const [restaurantName, setRestaurantName] = useState('YOUR RESTAURANT');
  const [gstPercentage, setGstPercentage] = useState(0);
  
  const [apiOrders, setApiOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [paymentMode, setPaymentMode] = useState('UPI'); // Online orders usually UPI/Card
  const [invoiceNo, setInvoiceNo] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch settings & pending orders
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        try {
          // Fetch Settings
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            if (data.invoicePrefix) setInvoicePrefix(data.invoicePrefix);
            if (data.restaurantName) setRestaurantName(data.restaurantName);
            if (data.gstPercentage !== undefined) setGstPercentage(data.gstPercentage);
          }
          // Fetch API Orders initially
          fetchApiOrders(user.uid);

          // Auto refresh every 5 seconds
          intervalId = setInterval(() => {
            fetchApiOrders(user.uid);
          }, 5000);
        } catch (error) {
          console.error(error);
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    });
    
    return () => {
      unsubscribe();
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  const fetchApiOrders = async (uid: string) => {
    try {
      const q = query(collection(db, 'api_orders'), where('userId', '==', uid));
      const snapshot = await getDocs(q);
      const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort by timestamp
      orders.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setApiOrders(orders);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateOrder = async () => {
    if (!userId) return;
    const fakeOrder = {
      userId,
      customerName: 'Aman Singh (Online)',
      customerPhone: '9876543210',
      items: [
        { id: 2, name: 'Pizza', price: 300, qty: 2 },
        { id: 4, name: 'Cold Drink', price: 50, qty: 2 }
      ],
      totalAmount: 700,
      timestamp: new Date().toISOString()
    };
    await addDoc(collection(db, 'api_orders'), fakeOrder);
    fetchApiOrders(userId);
  };

  const handleSelectOrder = (order: any) => {
    setSelectedOrder(order);
    if (order.paymentMode) {
      setPaymentMode(order.paymentMode);
    } else {
      setPaymentMode('UPI');
    }
    setInvoiceNo(Math.floor(100000 + Math.random() * 900000).toString());
  };

  const handlePrint = async () => {
    if (!selectedOrder || !userId) return;
    setSaving(true);
    
    try {
      const subTotal = selectedOrder.items.reduce((acc: number, item: any) => acc + (item.price * item.qty), 0);
      const gstAmount = parseFloat(((subTotal * gstPercentage) / 100).toFixed(2));
      const total = Math.round(subTotal + gstAmount);

      // 1. Save to standard bills history
      await addDoc(collection(db, 'bills'), {
        userId,
        invoiceNo: `${invoicePrefix}-${invoiceNo}`,
        customerName: selectedOrder.customerName,
        customerPhone: selectedOrder.customerPhone || '',
        paymentMode,
        items: selectedOrder.items,
        subTotal,
        gstPercentage,
        gstAmount,
        total,
        source: 'API',
        date: new Date().toISOString()
      });
      
      // 2. Remove from pending API orders
      await deleteDoc(doc(db, 'api_orders', selectedOrder.id));
      
      // 3. Print
      window.print();
      
      // 4. Reset
      setSelectedOrder(null);
      fetchApiOrders(userId);
    } catch (error) {
      alert('Error generating API bill');
    }
    setSaving(false);
  };

  if (loading) return <div className="p-8 text-text-main">Loading API Orders...</div>;

  return (
    <div className="max-w-6xl flex gap-8">
      
      {/* Left Column: API Orders List */}
      <div className="flex-1 hide-on-print">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-text-main">Incoming API Orders</h1>
          <button onClick={handleSimulateOrder} className="bg-blue-600 hover:bg-blue-500 text-text-main px-4 py-2 rounded text-sm shadow">
            Simulate Website Order
          </button>
        </div>

        <div className="bg-panel border border-border-subtle rounded-xl shadow-lg p-6 min-h-[400px]">
          {apiOrders.length === 0 ? (
            <div className="text-center text-text-muted mt-20">
              <p>No new orders from your website.</p>
              <p className="text-sm mt-2">Click "Simulate Website Order" to see how it works.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {apiOrders.map(order => (
                <div 
                  key={order.id} 
                  onClick={() => handleSelectOrder(order)}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${selectedOrder?.id === order.id ? 'border-yellow-500 bg-yellow-500/10' : 'border-border-subtle bg-page hover:border-gray-500'}`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-text-main">{order.customerName}</span>
                    <span className="text-green-400 font-bold">₹{order.totalAmount}</span>
                  </div>
                  <div className="text-sm text-text-muted flex justify-between">
                    <span>{order.items.length} items</span>
                    <span>{new Date(order.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Pre-filled Preview & Print */}
      {selectedOrder && (
        <div className="w-96 hide-on-print flex flex-col gap-4">
          <div className="bg-panel border border-yellow-500/30 rounded-xl p-6 shadow-[0_0_20px_rgba(212,175,55,0.1)]">
            <h2 className="text-lg font-bold text-yellow-500 uppercase tracking-widest mb-4">Order Details</h2>
            
            <div className="mb-4 text-sm">
              <div className="flex justify-between mb-1">
                <span className="text-text-muted">Customer:</span>
                <span className="text-text-main font-bold">{selectedOrder.customerName}</span>
              </div>
              {selectedOrder.customerPhone && (
                <div className="flex justify-between mb-1">
                  <span className="text-text-muted">Phone:</span>
                  <span className="text-text-main font-bold">{selectedOrder.customerPhone}</span>
                </div>
              )}
            </div>

            <div className="border-t border-border-subtle pt-4 mb-4">
              <h3 className="text-text-muted text-xs font-bold uppercase tracking-widest mb-3">Items</h3>
              <div className="space-y-2">
                {selectedOrder.items.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className="text-text-main">{item.name} <span className="text-text-muted ml-1">x{item.qty}</span></span>
                    <span className="text-text-main">₹{item.price * item.qty}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-border-subtle pt-4 mb-6">
              <div className="flex justify-between text-sm mb-1 text-text-muted">
                <span>Subtotal:</span>
                <span>₹{selectedOrder.items.reduce((acc: number, item: any) => acc + (item.price * item.qty), 0)}</span>
              </div>
              {gstPercentage > 0 && (
                <div className="flex justify-between text-sm mb-2 text-text-muted">
                  <span>GST ({gstPercentage}%):</span>
                  <span>₹{parseFloat(((selectedOrder.items.reduce((acc: number, item: any) => acc + (item.price * item.qty), 0) * gstPercentage) / 100).toFixed(2))}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg mt-2 pt-2 border-t border-border-subtle">
                <span className="text-yellow-500">TOTAL:</span>
                <span className="text-yellow-500">₹{Math.round(selectedOrder.items.reduce((acc: number, item: any) => acc + (item.price * item.qty), 0) * (1 + gstPercentage / 100))}</span>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-text-muted mb-1">Payment Mode (From Website)</label>
              <select value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)} className="w-full px-3 py-2 border border-border-subtle bg-page rounded-md text-text-main font-bold text-yellow-500">
                <option value="UPI">UPI (Pre-paid)</option>
                <option value="Card">Card (Pre-paid)</option>
                <option value="Cash">Cash on Delivery</option>
                <option value="Online">Online</option>
              </select>
            </div>
            
            <button onClick={handlePrint} disabled={saving} className="w-full bg-gradient-to-r from-yellow-600 to-yellow-400 hover:from-yellow-500 hover:to-yellow-300 text-black px-6 py-4 rounded-md font-bold uppercase tracking-wider transition-colors shadow">
              {saving ? 'Processing...' : 'Approve & Print Bill'}
            </button>
          </div>
        </div>
      )}

      {/* Thermal Receipt Print Area */}
      {selectedOrder && (
        <div className="bg-white printable-receipt font-mono text-black hidden-until-print" style={{ width: '80mm', padding: '5mm', margin: '0 auto' }}>
          
          <div className="text-center font-bold text-2xl mb-1 uppercase tracking-widest">{restaurantName}</div>
          <div className="text-center text-xs mb-3">TAX INVOICE</div>
          
          <div className="border-b-2 border-dashed border-black mb-3"></div>
          
          <div className="text-center mb-3">
            <div className="inline-block border-2 border-black px-4 py-1 font-black text-xl tracking-widest">
              ONLINE ORDER
            </div>
          </div>
          
          <table style={{ width: '100%', fontSize: '12px', marginBottom: '10px' }}>
          <tbody>
            <tr><td style={{ fontWeight: 'bold' }}>Date:</td><td style={{ textAlign: 'right' }} suppressHydrationWarning>{new Date().toLocaleDateString()} {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td></tr>
            <tr><td style={{ fontWeight: 'bold' }}>Invoice:</td><td style={{ textAlign: 'right' }}>{invoicePrefix}-{invoiceNo}</td></tr>
            <tr><td style={{ fontWeight: 'bold' }}>Customer:</td><td style={{ textAlign: 'right', textTransform: 'uppercase' }}>{selectedOrder.customerName}</td></tr>
            {selectedOrder.customerPhone && (
              <tr><td style={{ fontWeight: 'bold' }}>Phone:</td><td style={{ textAlign: 'right' }}>{selectedOrder.customerPhone}</td></tr>
            )}
            <tr><td style={{ fontWeight: 'bold' }}>Payment:</td><td style={{ textAlign: 'right', textTransform: 'uppercase' }}>{paymentMode}</td></tr>
          </tbody>
        </table>
        
        <div className="border-b-2 border-dashed border-black mb-2"></div>
        
        {/* Table Header */}
        <table style={{ width: '100%', fontSize: '12px', marginBottom: '10px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid black' }}>
              <th style={{ textAlign: 'left', paddingBottom: '4px', width: '50%' }}>ITEM</th>
              <th style={{ textAlign: 'center', paddingBottom: '4px', width: '20%' }}>QTY</th>
              <th style={{ textAlign: 'right', paddingBottom: '4px', width: '30%' }}>AMT</th>
            </tr>
          </thead>
          <tbody>
            {selectedOrder.items.map((item: any) => (
              <tr key={item.id}>
                <td style={{ padding: '4px 0', textTransform: 'uppercase' }}>{item.name}</td>
                <td style={{ padding: '4px 0', textAlign: 'center' }}>{item.qty}</td>
                <td style={{ padding: '4px 0', textAlign: 'right' }}>₹{item.price * item.qty}</td>
              </tr>
            ))}
          </tbody>
        </table>
        
        <div className="border-b-2 border-dashed border-black mb-2"></div>
        
        {/* Totals */}
        <table style={{ width: '100%', fontSize: '12px', marginBottom: '8px' }}>
          <tbody>
            <tr>
              <td>Subtotal</td>
              <td style={{ textAlign: 'right' }}>₹{selectedOrder.items.reduce((acc: number, item: any) => acc + (item.price * item.qty), 0)}</td>
            </tr>
            {gstPercentage > 0 && (
              <tr>
                <td>GST ({gstPercentage}%)</td>
                <td style={{ textAlign: 'right' }}>₹{parseFloat(((selectedOrder.items.reduce((acc: number, item: any) => acc + (item.price * item.qty), 0) * gstPercentage) / 100).toFixed(2))}</td>
              </tr>
            )}
          </tbody>
        </table>
        
        <table style={{ width: '100%', fontSize: '16px', fontWeight: '900', borderTop: '2px solid black', paddingTop: '4px', marginBottom: '16px' }}>
          <tbody>
            <tr>
              <td>TOTAL</td>
              <td style={{ textAlign: 'right' }}>₹{Math.round(selectedOrder.items.reduce((acc: number, item: any) => acc + (item.price * item.qty), 0) * (1 + gstPercentage / 100))}</td>
            </tr>
          </tbody>
        </table>
          
          <div className="text-center mt-6 text-xs font-bold uppercase tracking-widest">
            Thank You For Ordering!
          </div>
          <div className="text-center mt-2 text-[9px] text-text-muted uppercase tracking-widest">
            Powered by Kalvix Nexus POS
          </div>
        </div>
      )}

      <style jsx global>{`
        .hidden-until-print {
          display: none;
        }
        @media print {
          body * { visibility: hidden; }
          .hide-on-print { display: none !important; }
          .printable-receipt { visibility: visible; display: block !important; }
          .printable-receipt * { visibility: visible; }
          .printable-receipt { 
            position: absolute; 
            left: 0; 
            top: 0; 
            width: 80mm; 
            padding: 5mm; 
            border: none; 
            box-shadow: none; 
          }
        }
      `}</style>
    </div>
  );
}
