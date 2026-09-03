'use client';
import { useState } from 'react';

type OrderStatus = 'placed' | 'accepted' | 'preparing' | 'ready' | 'assigned' | 'delivered';

interface Order {
  id: string;
  source: string;
  items: { name: string; qty: number }[];
  total: number;
  status: OrderStatus;
  time: string;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([
    { id: '#1046', source: 'Takeaway', items: [{ name: 'Veg Hakka Noodles', qty: 2 }], total: 300, status: 'placed', time: '12:45 PM' },
    { id: '#1045', source: 'Table 2', items: [{ name: 'Caesar Salad', qty: 1 }, { name: 'Fresh Lime Soda', qty: 2 }], total: 490, status: 'preparing', time: '12:41 PM' },
    { id: '#1044', source: 'Table 12', items: [{ name: 'Pasta', qty: 3 }, { name: 'Mojito', qty: 3 }], total: 1200, status: 'assigned', time: '12:30 PM' },
    { id: '#1043', source: 'Zomato', items: [{ name: 'Margherita Pizza', qty: 1 }], total: 450, status: 'delivered', time: '12:15 PM' },
  ]);

  const [activeTab, setActiveTab] = useState<'tracker' | 'manual'>('tracker');

  const statusFlow: OrderStatus[] = ['placed', 'accepted', 'preparing', 'ready', 'assigned', 'delivered'];

  const getStatusIndex = (status: OrderStatus) => statusFlow.indexOf(status);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-widest text-text-main">Order Engine</h1>
          <p className="text-text-muted mt-1 text-sm tracking-widest uppercase">Track and create orders</p>
        </div>
        <div className="flex gap-2 p-1 bg-page rounded border border-border-subtle">
          <button 
            onClick={() => setActiveTab('tracker')}
            className={`px-4 py-2 font-bold text-xs uppercase tracking-widest rounded transition-colors ${activeTab === 'tracker' ? 'bg-panel-hover text-text-main' : 'text-text-muted hover:text-text-main'}`}
          >
            Tracker
          </button>
          <button 
            onClick={() => setActiveTab('manual')}
            className={`px-4 py-2 font-bold text-xs uppercase tracking-widest rounded transition-colors ${activeTab === 'manual' ? 'bg-panel-hover text-text-main' : 'text-text-muted hover:text-text-main'}`}
          >
            Manual Entry
          </button>
        </div>
      </div>

      {activeTab === 'tracker' && (
        <div className="space-y-4">
          {orders.map(order => {
            const currentIndex = getStatusIndex(order.status);
            
            return (
              <div key={order.id} className="bg-panel border border-border-subtle rounded-xl p-6 flex flex-col gap-6 hover:border-border-subtle transition-colors">
                
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-black tracking-widest">{order.id}</h2>
                    <p className="text-xs font-bold uppercase tracking-widest text-yellow-500">{order.source} • {order.time}</p>
                    <div className="mt-2 text-sm text-text-muted">
                      {order.items.map(i => `${i.qty}x ${i.name}`).join(', ')}
                    </div>
                  </div>
                  <div className="text-xl font-bold bg-page px-4 py-2 rounded-lg border border-border-subtle">
                    ₹{order.total}
                  </div>
                </div>

                {/* Progress Bar UI */}
                <div className="relative pt-8 pb-2">
                  <div className="absolute top-10 left-0 right-0 h-1 bg-panel-hover rounded -z-10"></div>
                  <div 
                    className="absolute top-10 left-0 h-1 bg-yellow-500 rounded -z-10 transition-all duration-500" 
                    style={{ width: `${(currentIndex / (statusFlow.length - 1)) * 100}%` }}
                  ></div>
                  
                  <div className="flex justify-between relative z-10">
                    {statusFlow.map((status, i) => {
                      const isCompleted = i <= currentIndex;
                      const isCurrent = i === currentIndex;
                      
                      return (
                        <div key={status} className="flex flex-col items-center gap-2 -mt-4 w-16">
                          <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors ${
                            isCurrent ? 'bg-yellow-500 border-yellow-500 text-black shadow-[0_0_15px_rgba(212,175,55,0.5)]' :
                            isCompleted ? 'bg-gray-700 border-yellow-500 text-yellow-500' : 'bg-page border-border-subtle text-gray-700'
                          }`}>
                            {isCompleted && !isCurrent ? (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            ) : (
                              <span className="text-xs font-black">{i + 1}</span>
                            )}
                          </div>
                          <span className={`text-[10px] font-bold uppercase tracking-widest text-center ${isCurrent ? 'text-yellow-500' : isCompleted ? 'text-text-muted' : 'text-gray-700'}`}>
                            {status}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>

              </div>
            )
          })}
        </div>
      )}

      {activeTab === 'manual' && (
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 bg-panel border border-border-subtle rounded-xl p-6">
            <h2 className="text-lg font-bold uppercase tracking-widest text-yellow-500 mb-6">Quick Add Items</h2>
            <div className="grid grid-cols-3 gap-4">
               {[
                 { name: 'Burger', price: 350 },
                 { name: 'Pizza', price: 450 },
                 { name: 'Fries', price: 150 },
                 { name: 'Pasta', price: 320 },
                 { name: 'Soda', price: 120 },
                 { name: 'Salad', price: 250 },
               ].map(item => (
                 <button key={item.name} className="bg-page border border-border-subtle p-4 rounded-lg hover:border-yellow-500 hover:text-yellow-500 transition-colors text-left flex flex-col justify-between h-24">
                   <span className="font-bold">{item.name}</span>
                   <span className="text-xs font-mono text-text-muted">₹{item.price}</span>
                 </button>
               ))}
            </div>
            
            <div className="mt-6 border-t border-border-subtle pt-6">
              <input type="text" placeholder="Search menu items..." className="w-full bg-page border border-border-subtle rounded p-3 text-sm focus:outline-none focus:border-yellow-500 transition-colors" />
            </div>
          </div>

          <div className="bg-panel border border-border-subtle rounded-xl p-6 flex flex-col">
             <h2 className="text-lg font-bold uppercase tracking-widest text-text-main mb-6">Current Ticket</h2>
             <div className="flex-1 overflow-y-auto mb-4 border-b border-border-subtle pb-4">
                <div className="flex justify-between items-center text-sm mb-3">
                  <span className="font-bold">1x Burger</span>
                  <span className="text-text-muted">₹350</span>
                </div>
                <div className="flex justify-between items-center text-sm mb-3">
                  <span className="font-bold">2x Soda</span>
                  <span className="text-text-muted">₹240</span>
                </div>
             </div>
             <div>
                <div className="flex justify-between text-text-muted text-sm mb-2"><span>Subtotal</span><span>₹590</span></div>
                <div className="flex justify-between text-text-muted text-sm mb-4"><span>Tax (5%)</span><span>₹29.5</span></div>
                <div className="flex justify-between text-xl font-black text-yellow-500 mb-6"><span>Total</span><span>₹619.5</span></div>
                
                <div className="space-y-3">
                  <button className="w-full bg-yellow-500 text-black font-bold py-3 rounded uppercase tracking-wider hover:bg-yellow-400 transition-colors">
                    Place Order
                  </button>
                  <button className="w-full bg-panel-hover text-text-main font-bold py-3 rounded uppercase tracking-wider hover:bg-gray-700 transition-colors">
                    Save Draft
                  </button>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
