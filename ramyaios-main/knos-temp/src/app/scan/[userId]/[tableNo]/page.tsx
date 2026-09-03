'use client';
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, addDoc } from 'firebase/firestore';
import { useParams } from 'next/navigation';

export default function QRMenuPage() {
  const params = useParams();
  const userId = params.userId as string;
  const tableNo = params.tableNo as string;
  
  const [restaurantName, setRestaurantName] = useState('');
  const [menu, setMenu] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [cart, setCart] = useState<any[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMode, setPaymentMode] = useState('Online');
  
  const [submitting, setSubmitting] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Restaurant details
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists() && userDoc.data().restaurantName) {
          setRestaurantName(userDoc.data().restaurantName);
        }

        // Fetch Live Menu
        const menuDoc = await getDoc(doc(db, 'menus', userId));
        if (menuDoc.exists() && menuDoc.data().items) {
          setMenu(menuDoc.data().items);
        }
      } catch (error) {
        console.error("Error fetching menu:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [userId]);

  const addToCart = (item: any) => {
    const existing = cart.find(i => i.id === item.id);
    if (existing) {
      setCart(cart.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i));
    } else {
      setCart([...cart, { ...item, qty: 1 }]);
    }
  };

  const removeFromCart = (id: number) => {
    const existing = cart.find(i => i.id === id);
    if (existing && existing.qty > 1) {
      setCart(cart.map(i => i.id === id ? { ...i, qty: i.qty - 1 } : i));
    } else {
      setCart(cart.filter(i => i.id !== id));
    }
  };

  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

  const placeOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return alert('Your cart is empty');
    if (!customerName.trim()) return alert('Please enter your name');
    
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'qr_orders'), {
        userId,
        tableNo,
        customerName,
        customerPhone,
        items: cart,
        totalAmount,
        paymentMode,
        status: 'pending',
        timestamp: new Date().toISOString()
      });
      setOrderPlaced(true);
      setCart([]);
    } catch (error) {
      console.error(error);
      alert('Failed to place order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-black text-yellow-500 flex items-center justify-center font-bold tracking-widest uppercase">Loading Menu...</div>;
  }

  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
        </div>
        <h1 className="text-3xl font-black uppercase tracking-widest text-yellow-500 mb-2">Order Sent!</h1>
        <p className="text-gray-400 mb-8">Your order has been sent to the kitchen for Table {tableNo}.</p>
        <button onClick={() => setOrderPlaced(false)} className="border border-yellow-500 text-yellow-500 px-6 py-2 rounded-full font-bold uppercase tracking-widest hover:bg-yellow-500 hover:text-black transition-colors">
          Order More Items
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 pb-32 font-sans">
      {/* Header */}
      <div className="bg-black border-b border-gray-900 sticky top-0 z-10">
        <div className="p-4 flex items-center justify-between">
          <div>
            <h1 className="text-white font-black uppercase tracking-widest text-xl">{restaurantName || 'Menu'}</h1>
            <p className="text-yellow-500 text-xs font-bold uppercase tracking-widest mt-1">Table {tableNo}</p>
          </div>
          <div className="bg-gray-900 px-3 py-1.5 rounded-md border border-gray-800 shadow flex items-center gap-2">
            <span className="text-yellow-500 font-bold">₹{totalAmount}</span>
            <span className="text-gray-500 text-xs">({cart.reduce((s,i)=>s+i.qty,0)})</span>
          </div>
        </div>
      </div>

      {/* Menu List */}
      <div className="p-4 space-y-4">
        {menu.length === 0 ? (
          <div className="text-gray-500 text-center mt-10">No items available currently.</div>
        ) : (
          menu.map(item => {
            const cartItem = cart.find(i => i.id === item.id);
            return (
              <div key={item.id} className="bg-black border border-gray-900 rounded-xl p-3 flex gap-4">
                {item.imageUrl ? (
                  <div className="w-20 h-20 shrink-0 bg-gray-900 rounded-lg overflow-hidden border border-gray-800">
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-20 h-20 shrink-0 bg-gray-900 rounded-lg flex items-center justify-center border border-gray-800">
                    <span className="text-gray-700 text-xs uppercase font-bold">No Img</span>
                  </div>
                )}
                
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-white font-bold">{item.name}</h3>
                    <p className="text-yellow-500 font-bold text-sm mt-1">₹{item.price}</p>
                  </div>
                  <div className="flex justify-end">
                    {cartItem ? (
                      <div className="flex items-center gap-3 bg-gray-900 rounded-lg border border-gray-800 p-1">
                        <button onClick={() => removeFromCart(item.id)} className="w-8 h-8 flex items-center justify-center text-white bg-black rounded">-</button>
                        <span className="text-white font-bold w-4 text-center">{cartItem.qty}</span>
                        <button onClick={() => addToCart(item)} className="w-8 h-8 flex items-center justify-center text-white bg-black rounded">+</button>
                      </div>
                    ) : (
                      <button onClick={() => addToCart(item)} className="bg-yellow-500/10 text-yellow-500 border border-yellow-500/50 hover:bg-yellow-500 hover:text-black px-4 py-1.5 rounded-lg text-sm font-bold uppercase tracking-widest transition-colors">
                        Add
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Cart Bottom Sheet */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-yellow-500/30 p-4 rounded-t-2xl shadow-[0_-10px_40px_rgba(0,0,0,0.8)] z-50">
          <form onSubmit={placeOrder} className="max-w-md mx-auto space-y-3">
            <h3 className="text-white font-bold uppercase tracking-widest border-b border-gray-800 pb-2 mb-2 flex justify-between">
              <span>Checkout</span>
              <span className="text-yellow-500">₹{totalAmount}</span>
            </h3>
            
            <div className="grid grid-cols-2 gap-3">
              <input 
                type="text" 
                placeholder="Your Name *"
                required
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                className="w-full bg-black border border-gray-800 rounded px-3 py-2 text-sm text-white focus:border-yellow-500 outline-none"
              />
              <input 
                type="tel" 
                placeholder="Phone (Optional)"
                value={customerPhone}
                onChange={e => setCustomerPhone(e.target.value)}
                className="w-full bg-black border border-gray-800 rounded px-3 py-2 text-sm text-white focus:border-yellow-500 outline-none"
              />
            </div>
            
            <div>
              <select 
                value={paymentMode}
                onChange={e => setPaymentMode(e.target.value)}
                className="w-full bg-black border border-gray-800 rounded px-3 py-2 text-sm text-white focus:border-yellow-500 outline-none"
              >
                <option value="Online">Pay Online / UPI</option>
                <option value="Cash">Pay Cash at Counter</option>
              </select>
            </div>

            <button 
              type="submit"
              disabled={submitting}
              className="w-full bg-gradient-to-r from-yellow-600 to-yellow-400 text-black py-3 rounded-lg font-black uppercase tracking-widest mt-2"
            >
              {submitting ? 'Sending...' : 'Confirm Order'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
