'use client';
import { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';

export default function BillHistoryPage() {
  const [bills, setBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBill, setSelectedBill] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const q = query(
            collection(db, 'bills'),
            where('userId', '==', user.uid)
          );
          const querySnapshot = await getDocs(q);
          const fetchedBills = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          // Sort manually since we might not have a composite index set up yet in Firestore
          fetchedBills.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
          setBills(fetchedBills);
        } catch (error) {
          console.error("Error fetching bills:", error);
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return <div className="text-text-main p-8">Loading history...</div>;

  return (
    <>
      <div className="max-w-6xl hide-on-print">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-text-main">Bill History</h1>
        </div>
      
      <div className="bg-panel border border-border-subtle rounded-xl shadow-lg overflow-hidden">
        <table className="w-full text-left text-text-main">
          <thead className="bg-page border-b border-border-subtle text-sm uppercase tracking-wider text-text-muted">
            <tr>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Invoice No</th>
              <th className="px-6 py-4">Customer</th>
              <th className="px-6 py-4">Items</th>
              <th className="px-6 py-4">Amount</th>
              <th className="px-6 py-4">Payment Mode</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {bills.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-text-muted">No bills generated yet.</td>
              </tr>
            ) : (
              bills.map(bill => (
                <tr key={bill.id} className="border-b border-border-subtle hover:bg-panel-hover/30 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {new Date(bill.date).toLocaleDateString()} <br/>
                    <span className="text-xs text-text-muted">{new Date(bill.date).toLocaleTimeString()}</span>
                  </td>
                  <td className="p-4">
                    <button 
                      onClick={() => setSelectedBill(bill)}
                      className="text-yellow-500 hover:text-yellow-400 font-bold flex flex-col sm:flex-row items-start sm:items-center gap-2"
                    >
                      <span>{bill.invoiceNo}</span>
                      
                      {bill.source === 'API' && (
                        <span className="bg-blue-500/20 text-blue-400 text-[10px] px-2 py-0.5 rounded uppercase tracking-widest border border-blue-500/30">API</span>
                      )}
                      {bill.source?.startsWith('QR') && (
                        <span className="bg-orange-500/20 text-orange-400 text-[10px] px-2 py-0.5 rounded uppercase tracking-widest border border-orange-500/30 whitespace-nowrap">{bill.source}</span>
                      )}
                      {(!bill.source || bill.source === 'Manual') && (
                        <span className="bg-gray-700/50 text-text-muted text-[10px] px-2 py-0.5 rounded uppercase tracking-widest border border-gray-600/50">Manual</span>
                      )}
                    </button>
                  </td>
                  <td className="p-4">
                    <div className="font-bold">{bill.customerName}</div>
                    <div className="text-xs text-text-muted">{bill.customerPhone}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs bg-panel-hover px-2 py-1 rounded">
                      {bill.items?.length || 0} items
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-text-main">₹{Math.round(bill.total)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      bill.paymentMode === 'Cash' ? 'bg-green-500/20 text-green-400' :
                      bill.paymentMode === 'UPI' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-purple-500/20 text-purple-400'
                    }`}>
                      {bill.paymentMode || 'Cash'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Bill Details Modal */}
      {selectedBill && (
        <div className="fixed inset-0 bg-page/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-panel border border-yellow-500/30 w-full max-w-lg rounded-xl shadow-[0_0_40px_rgba(212,175,55,0.1)] overflow-hidden">
            <div className="p-6 border-b border-border-subtle flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-text-main uppercase tracking-widest">Bill Details</h3>
                <p className="text-sm text-text-muted font-mono mt-1">{selectedBill.invoiceNo}</p>
              </div>
              <button 
                onClick={() => setSelectedBill(null)}
                className="text-text-muted hover:text-text-main bg-panel-hover hover:bg-gray-700 w-8 h-8 flex items-center justify-center rounded-full transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                <div>
                  <div className="text-text-muted uppercase tracking-wider text-xs mb-1">Customer</div>
                  <div className="font-bold text-text-main uppercase">{selectedBill.customerName}</div>
                  {selectedBill.customerPhone && <div className="text-text-muted">{selectedBill.customerPhone}</div>}
                </div>
                <div>
                  <div className="text-text-muted uppercase tracking-wider text-xs mb-1">Date & Time</div>
                  <div className="font-bold text-text-main">{new Date(selectedBill.date).toLocaleDateString()}</div>
                  <div className="text-text-muted">{new Date(selectedBill.date).toLocaleTimeString()}</div>
                </div>
                <div>
                  <div className="text-text-muted uppercase tracking-wider text-xs mb-1">Payment Mode</div>
                  <span className={`px-2 py-1 rounded text-xs font-bold inline-block mt-1 ${
                      selectedBill.paymentMode === 'Cash' ? 'bg-green-500/20 text-green-400' :
                      selectedBill.paymentMode === 'UPI' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-purple-500/20 text-purple-400'
                    }`}>
                      {selectedBill.paymentMode || 'Cash'}
                  </span>
                </div>
              </div>

              <div className="text-text-muted uppercase tracking-wider text-xs mb-3 border-b border-border-subtle pb-2">Order Items</div>
              <div className="space-y-3 mb-6 max-h-48 overflow-y-auto pr-2">
                {selectedBill.items?.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center text-sm">
                    <div>
                      <span className="text-text-main">{item.name}</span> <span className="text-text-muted ml-2">x{item.qty}</span>
                    </div>
                    <div className="text-text-main">₹{item.price * item.qty}</div>
                  </div>
                ))}
              </div>

              <div className="border-t border-border-subtle pt-4">
                {selectedBill.gstPercentage ? (
                  <>
                    <div className="flex justify-between items-center text-text-muted text-sm mb-1">
                      <span>Subtotal</span>
                      <span>₹{selectedBill.subTotal}</span>
                    </div>
                    <div className="flex justify-between items-center text-text-muted text-sm mb-3">
                      <span>GST ({selectedBill.gstPercentage}%)</span>
                      <span>₹{selectedBill.gstAmount}</span>
                    </div>
                  </>
                ) : null}
                <div className="flex justify-between items-center mt-2 pt-2 border-t border-border-subtle/50">
                  <span className="text-text-muted uppercase tracking-widest text-sm font-bold">Total Amount</span>
                  <span className="text-2xl font-black text-yellow-500">₹{Math.round(selectedBill.total)}</span>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-page border-t border-border-subtle flex justify-between items-center">
              <button 
                onClick={() => {
                  // A simple trick to print just the bill details could be 
                  // using window.print() but we need to create a printable receipt.
                  // For now, we will just open a new window with the receipt format or print current screen.
                  // We can add a hidden receipt structure later, or just print current window.
                  window.print();
                }}
                className="px-6 py-2 bg-yellow-500/10 text-yellow-500 border border-yellow-500/30 hover:bg-yellow-500 hover:text-black rounded font-bold uppercase tracking-widest text-xs transition-colors"
              >
                Print Bill
              </button>
              <button 
                onClick={() => setSelectedBill(null)}
                className="px-6 py-2 bg-panel-hover hover:bg-gray-700 text-text-main rounded font-bold uppercase tracking-widest text-xs transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      </div>

      {/* Hidden Thermal Receipt for History Print */}
      {selectedBill && (
        <div className="bg-white printable-receipt font-mono text-black hidden-until-print" style={{ width: '80mm', padding: '5mm', margin: '0 auto' }}>
          <div className="text-center font-bold text-2xl mb-1 uppercase tracking-widest">KALVIX NEXUS</div>
          <div className="text-center text-xs mb-3">TAX INVOICE</div>
          
          <div className="border-b-2 border-dashed border-black mb-3"></div>
          
          <table style={{ width: '100%', fontSize: '12px', marginBottom: '10px' }}>
            <tbody>
              <tr><td style={{ fontWeight: 'bold' }}>Date:</td><td style={{ textAlign: 'right' }} suppressHydrationWarning>{new Date(selectedBill.date).toLocaleDateString()} {new Date(selectedBill.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td></tr>
              <tr><td style={{ fontWeight: 'bold' }}>Invoice:</td><td style={{ textAlign: 'right' }}>{selectedBill.invoiceNo}</td></tr>
              <tr><td style={{ fontWeight: 'bold' }}>Type:</td><td style={{ textAlign: 'right', textTransform: 'uppercase' }}>{selectedBill.source || 'Manual Entry'}</td></tr>
              <tr><td style={{ fontWeight: 'bold' }}>Customer:</td><td style={{ textAlign: 'right', textTransform: 'uppercase' }}>{selectedBill.customerName}</td></tr>
              {selectedBill.customerPhone && (
                <tr><td style={{ fontWeight: 'bold' }}>Phone:</td><td style={{ textAlign: 'right' }}>{selectedBill.customerPhone}</td></tr>
              )}
              <tr><td style={{ fontWeight: 'bold' }}>Payment:</td><td style={{ textAlign: 'right', textTransform: 'uppercase' }}>{selectedBill.paymentMode}</td></tr>
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
              {selectedBill.items?.map((item: any, idx: number) => (
                <tr key={idx}>
                  <td style={{ padding: '4px 0', textTransform: 'uppercase' }}>{item.name}</td>
                  <td style={{ padding: '4px 0', textAlign: 'center' }}>{item.qty}</td>
                  <td style={{ padding: '4px 0', textAlign: 'right' }}>₹{item.price * item.qty}</td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <div className="border-b-2 border-dashed border-black mb-2"></div>
          
          {/* Totals */}
          {selectedBill.gstPercentage ? (
            <table style={{ width: '100%', fontSize: '12px', marginBottom: '8px' }}>
              <tbody>
                <tr>
                  <td>Subtotal</td>
                  <td style={{ textAlign: 'right' }}>₹{selectedBill.subTotal}</td>
                </tr>
                <tr>
                  <td>GST ({selectedBill.gstPercentage}%)</td>
                  <td style={{ textAlign: 'right' }}>₹{selectedBill.gstAmount}</td>
                </tr>
              </tbody>
            </table>
          ) : null}
          
          <table style={{ width: '100%', fontSize: '16px', fontWeight: '900', borderTop: '2px solid black', paddingTop: '4px', marginBottom: '16px' }}>
            <tbody>
              <tr>
                <td>TOTAL</td>
                <td style={{ textAlign: 'right' }}>₹{Math.round(selectedBill.total)}</td>
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
    </>
  );
}
