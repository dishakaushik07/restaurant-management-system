'use client';
import { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, addDoc, collection } from 'firebase/firestore';

export default function ManualBilling() {
  const [userId, setUserId] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [selectedItems, setSelectedItems] = useState<{ id: number; name: string; price: number; qty: number }[]>([]);
  const [menuItems, setMenuItems] = useState<{ id: number; name: string; price: number }[]>([]);
  
  const [invoicePrefix, setInvoicePrefix] = useState('INV');
  const [restaurantName, setRestaurantName] = useState('YOUR RESTAURANT');
  const [gstPercentage, setGstPercentage] = useState(0);
  
  const [qrOrders, setQrOrders] = useState<any[]>([]);
  
  // Auto-generate a random 6-digit invoice number on client side
  const [invoiceNo, setInvoiceNo] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchQrOrders = async (uid: string) => {
    try {
      const { query, collection, where, getDocs } = require('firebase/firestore');
      const q = query(collection(db, 'qr_orders'), where('userId', '==', uid));
      const snapshot = await getDocs(q);
      const orders = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
      orders.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setQrOrders(orders);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    setInvoiceNo(Math.floor(100000 + Math.random() * 900000).toString());
    let intervalId: NodeJS.Timeout;
    
    // Fetch logged in owner's settings and menu
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        try {
          // Fetch user settings
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            if (data.invoicePrefix) setInvoicePrefix(data.invoicePrefix);
            if (data.restaurantName) setRestaurantName(data.restaurantName);
            if (data.gstPercentage !== undefined) setGstPercentage(data.gstPercentage);
          }
          
          // Fetch user menu
          const menuDoc = await getDoc(doc(db, 'menus', user.uid));
          if (menuDoc.exists() && menuDoc.data().items) {
            setMenuItems(menuDoc.data().items);
          }

          fetchQrOrders(user.uid);
          intervalId = setInterval(() => {
            fetchQrOrders(user.uid);
          }, 5000);
        } catch (error) {
          console.error("Error fetching user data", error);
        }
      }
    });
    
    return () => {
      unsubscribe();
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  const handleAddItem = (item: any) => {
    const existing = selectedItems.find(i => i.id === item.id);
    if (existing) {
      setSelectedItems(selectedItems.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i));
    } else {
      setSelectedItems([...selectedItems, { ...item, qty: 1 }]);
    }
  };

  const handleRemoveItem = (id: number) => {
    setSelectedItems(selectedItems.filter(i => i.id !== id));
  };

  const subTotal = selectedItems.reduce((acc, item) => acc + (item.price * item.qty), 0);
  const gstAmount = parseFloat(((subTotal * gstPercentage) / 100).toFixed(2));
  const total = Math.round(subTotal + gstAmount);

  const handlePrint = async () => {
    if (selectedItems.length === 0) return alert('Add items to bill first');
    if (!customerName) return alert('Enter customer name');
    
    setSaving(true);
    try {
      await addDoc(collection(db, 'bills'), {
        userId,
        invoiceNo: `${invoicePrefix}-${invoiceNo}`,
        customerName,
        customerPhone,
        paymentMode,
        items: selectedItems,
        subTotal,
        gstPercentage,
        gstAmount,
        total,
        source: 'Manual',
        date: new Date().toISOString()
      });
      
      window.print();
      
      // Reset after print
      setCustomerName('');
      setCustomerPhone('');
      setSelectedItems([]);
      setInvoiceNo(Math.floor(100000 + Math.random() * 900000).toString());
    } catch (error) {
      alert('Error generating bill');
    }
    setSaving(false);
  };

  const handleApproveQrOrder = async (order: any) => {
    try {
      const { deleteDoc } = require('firebase/firestore');
      
      const orderSubTotal = order.items.reduce((acc: number, item: any) => acc + (item.price * item.qty), 0);
      const orderGstAmount = (orderSubTotal * gstPercentage) / 100;
      const orderTotal = orderSubTotal + orderGstAmount;

      await addDoc(collection(db, 'bills'), {
        userId,
        invoiceNo: `${invoicePrefix}-${invoiceNo}`,
        customerName: order.customerName,
        customerPhone: order.customerPhone || '',
        paymentMode: order.paymentMode,
        items: order.items,
        subTotal: orderSubTotal,
        gstPercentage,
        gstAmount: orderGstAmount,
        total: orderTotal,
        source: 'QR Table ' + order.tableNo,
        date: new Date().toISOString()
      });

      await deleteDoc(doc(db, 'qr_orders', order.id));
      
      // We don't auto print here unless they want to, but we can set the receipt info and print.
      // To do this simply, we could just alert for now, or populate the cart and print.
      alert(`Order from Table ${order.tableNo} Approved and Saved to History!`);
      setInvoiceNo(Math.floor(100000 + Math.random() * 900000).toString());
      if (userId) fetchQrOrders(userId);

    } catch (error) {
      console.error(error);
      alert('Failed to approve QR order');
    }
  };

  return (
    <div className="max-w-6xl flex gap-8">
      <div className="flex-1">
        <h1 className="text-3xl font-bold mb-6 text-text-main hide-on-print">Generate Manual Bill</h1>
        
        <div className="bg-panel p-6 rounded-xl shadow-lg border border-border-subtle hide-on-print mb-6">
          <h2 className="text-lg font-bold text-text-main uppercase tracking-widest mb-4">Customer & Bill Details</h2>
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-bold text-text-muted uppercase tracking-widest mb-1">Customer Name</label>
              <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="block w-full px-3 py-2 border border-border-subtle bg-page rounded-md text-text-main focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 outline-none transition-all" placeholder="e.g. Rahul" />
            </div>
            <div>
              <label className="block text-sm font-bold text-text-muted uppercase tracking-widest mb-1">Phone (Optional)</label>
              <input type="text" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className="block w-full px-3 py-2 border border-border-subtle bg-page rounded-md text-text-main focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 outline-none transition-all" placeholder="9876543210" />
            </div>
            <div>
              <label className="block text-sm font-bold text-text-muted uppercase tracking-widest mb-1">Invoice No.</label>
              <div className="flex shadow-sm">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-border-subtle bg-panel-hover text-yellow-500 text-sm font-bold">
                  {invoicePrefix}-
                </span>
                <input type="text" value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} className="flex-1 block w-full px-3 py-2 border border-border-subtle bg-page rounded-none rounded-r-md text-text-main focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 outline-none transition-all" placeholder="102938" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-text-muted uppercase tracking-widest mb-1">Payment Mode</label>
              <select value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)} className="block w-full px-3 py-2 border border-border-subtle bg-page rounded-md text-text-main focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 outline-none transition-all">
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="Card">Card</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-panel p-6 rounded-xl shadow-lg border border-border-subtle hide-on-print flex gap-6">
          {/* Menu Selection */}
          <div className="flex-1 border-r border-border-subtle pr-6">
            <h2 className="text-lg font-bold text-text-main uppercase tracking-widest mb-4">Select Items</h2>
            <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-2">
              {menuItems.length === 0 ? (
                <div className="col-span-2 text-sm text-text-muted">No items found. Upload a menu first.</div>
              ) : (
                menuItems.map(item => (
                  <button 
                    key={item.id} 
                    onClick={() => handleAddItem(item)}
                    className="p-3 border border-border-subtle rounded text-left hover:bg-yellow-500/10 hover:border-yellow-500 transition-colors bg-page text-text-main group"
                  >
                    <div className="font-bold text-text-main group-hover:text-yellow-500 transition-colors">{item.name}</div>
                    <div className="text-sm text-text-muted">₹{item.price}</div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Cart / Selected Items */}
          <div className="flex-1">
            <h2 className="text-lg font-bold text-text-main uppercase tracking-widest mb-4">Current Bill</h2>
            {selectedItems.length === 0 ? (
              <div className="text-text-muted text-sm">No items selected yet.</div>
            ) : (
              <div className="space-y-3">
                {selectedItems.map(item => (
                  <div key={item.id} className="flex justify-between items-center text-sm border-b border-border-subtle pb-2">
                    <div>
                      <span className="font-bold text-text-main">{item.name}</span> <span className="text-yellow-500 font-bold ml-2">x{item.qty}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-text-main">₹{item.price * item.qty}</span>
                      <button onClick={() => handleRemoveItem(item.id)} className="text-red-500 hover:text-red-400 font-bold bg-red-500/10 w-6 h-6 rounded flex items-center justify-center transition-colors">×</button>
                    </div>
                  </div>
                ))}
                <div className="pt-2 border-t border-border-subtle">
                  <div className="flex justify-between items-center text-sm text-text-muted mb-1">
                    <span>Subtotal</span>
                    <span>₹{subTotal}</span>
                  </div>
                  {gstPercentage > 0 && (
                    <div className="flex justify-between items-center text-sm text-text-muted mb-2">
                      <span>GST ({gstPercentage}%)</span>
                      <span>₹{gstAmount}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center font-black text-lg pt-2 text-text-main border-t border-border-subtle">
                    <span className="uppercase tracking-widest text-sm text-text-muted">Total Amount</span>
                    <span className="text-yellow-500 text-2xl">₹{total}</span>
                  </div>
                </div>
                <button onClick={handlePrint} disabled={saving} className="mt-6 w-full bg-gradient-to-r from-yellow-600 to-yellow-400 hover:from-yellow-500 hover:to-yellow-300 text-black px-6 py-4 rounded-md font-black uppercase tracking-widest shadow-[0_0_20px_rgba(212,175,55,0.3)] hover:scale-105 transition-all">
                  {saving ? 'Processing...' : 'Save & Print Bill'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Thermal Receipt Print Area */}
      <div className="bg-white printable-receipt font-mono text-black hidden-until-print" style={{ width: '80mm', padding: '5mm', margin: '0 auto' }}>
        
        <div className="text-center font-bold text-2xl mb-1 uppercase tracking-widest">{restaurantName}</div>
        <div className="text-center text-xs mb-3">TAX INVOICE</div>
        
        <div className="border-b-2 border-dashed border-black mb-3"></div>
        
        <table style={{ width: '100%', fontSize: '12px', marginBottom: '10px' }}>
          <tbody>
            <tr><td style={{ fontWeight: 'bold' }}>Date:</td><td style={{ textAlign: 'right' }} suppressHydrationWarning>{new Date().toLocaleDateString()} {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td></tr>
            <tr><td style={{ fontWeight: 'bold' }}>Invoice:</td><td style={{ textAlign: 'right' }}>{invoicePrefix}-{invoiceNo}</td></tr>
            <tr><td style={{ fontWeight: 'bold' }}>Customer:</td><td style={{ textAlign: 'right', textTransform: 'uppercase' }}>{customerName || 'Walk-in'}</td></tr>
            {customerPhone && (
              <tr><td style={{ fontWeight: 'bold' }}>Phone:</td><td style={{ textAlign: 'right' }}>{customerPhone}</td></tr>
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
            {selectedItems.map((item: any) => (
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
              <td style={{ textAlign: 'right' }}>₹{subTotal}</td>
            </tr>
            {gstPercentage > 0 && (
              <tr>
                <td>GST ({gstPercentage}%)</td>
                <td style={{ textAlign: 'right' }}>₹{gstAmount}</td>
              </tr>
            )}
          </tbody>
        </table>
        
        <table style={{ width: '100%', fontSize: '16px', fontWeight: '900', borderTop: '2px solid black', paddingTop: '4px', marginBottom: '16px' }}>
          <tbody>
            <tr>
              <td>TOTAL</td>
              <td style={{ textAlign: 'right' }}>₹{total}</td>
            </tr>
          </tbody>
        </table>
        
        <div className="text-center mt-6 text-xs font-bold uppercase tracking-widest">
          Thank You For Visiting!
        </div>
        <div className="text-center mt-2 text-[9px] text-text-muted uppercase tracking-widest">
          Powered by Kalvix Nexus POS
        </div>
      </div>

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
