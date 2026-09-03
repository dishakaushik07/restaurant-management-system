'use client';
import { useState, useEffect } from 'react';

type Priority = 'normal' | 'high' | 'urgent';

interface OrderItem {
  id: string;
  name: string;
  qty: number;
  notes?: string;
  completed: boolean;
}

interface KitchenOrder {
  id: string;
  orderNumber: string;
  source: string; // 'Table 4', 'Zomato', 'Takeaway'
  items: OrderItem[];
  priority: Priority;
  timeReceived: Date;
  status: 'preparing' | 'ready';
}

export default function KitchenDisplayPage() {
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Mock Data initialization
    const now = new Date();
    setOrders([
      {
        id: '1',
        orderNumber: '#1042',
        source: 'Table 4',
        priority: 'urgent',
        timeReceived: new Date(now.getTime() - 25 * 60000), // 25 mins ago
        status: 'preparing',
        items: [
          { id: 'i1', name: 'Truffle Mushroom Burger', qty: 2, completed: true },
          { id: 'i2', name: 'Peri Peri Fries', qty: 1, completed: false, notes: 'Extra crispy' },
        ]
      },
      {
        id: '2',
        orderNumber: '#1043',
        source: 'Zomato API',
        priority: 'high',
        timeReceived: new Date(now.getTime() - 15 * 60000), // 15 mins ago
        status: 'preparing',
        items: [
          { id: 'i3', name: 'Margherita Pizza Large', qty: 1, completed: false },
          { id: 'i4', name: 'Garlic Bread', qty: 1, completed: false },
        ]
      },
      {
        id: '3',
        orderNumber: '#1045',
        source: 'Table 2',
        priority: 'normal',
        timeReceived: new Date(now.getTime() - 4 * 60000), // 4 mins ago
        status: 'preparing',
        items: [
          { id: 'i5', name: 'Caesar Salad', qty: 1, completed: false, notes: 'Dressing on side' },
          { id: 'i6', name: 'Fresh Lime Soda', qty: 2, completed: false },
        ]
      },
      {
        id: '4',
        orderNumber: '#1046',
        source: 'Takeaway',
        priority: 'normal',
        timeReceived: new Date(now.getTime() - 2 * 60000), // 2 mins ago
        status: 'preparing',
        items: [
          { id: 'i7', name: 'Veg Hakka Noodles', qty: 2, completed: false },
        ]
      }
    ]);

    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const toggleItemStatus = (orderId: string, itemId: string) => {
    setOrders(orders.map(order => {
      if (order.id === orderId) {
        const updatedItems = order.items.map(item => 
          item.id === itemId ? { ...item, completed: !item.completed } : item
        );
        return { ...order, items: updatedItems };
      }
      return order;
    }));
  };

  const markOrderReady = (orderId: string) => {
    setOrders(orders.map(order => 
      order.id === orderId ? { ...order, status: 'ready' } : order
    ));
    
    // In a real app, this would disappear from KDS after a few seconds or when explicitly cleared
    setTimeout(() => {
      setOrders(current => current.filter(o => o.id !== orderId));
    }, 3000);
  };

  // Helper to format elapsed time
  const getElapsedTimeString = (timeReceived: Date) => {
    const diffMs = currentTime.getTime() - timeReceived.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffSecs = Math.floor((diffMs % 60000) / 1000);
    return `${diffMins}:${diffSecs.toString().padStart(2, '0')}`;
  };

  const getPriorityClasses = (priority: Priority, diffMins: number) => {
    if (priority === 'urgent' || diffMins >= 20) return 'border-red-500 bg-red-950/20 shadow-[0_0_15px_rgba(239,68,68,0.3)]';
    if (priority === 'high' || diffMins >= 10) return 'border-orange-500 bg-orange-950/20';
    return 'border-border-subtle bg-page';
  };

  const getHeaderColor = (priority: Priority, diffMins: number) => {
    if (priority === 'urgent' || diffMins >= 20) return 'bg-red-600 text-text-main';
    if (priority === 'high' || diffMins >= 10) return 'bg-orange-500 text-black';
    return 'bg-panel-hover text-text-main';
  };

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-widest text-text-main">Kitchen Display</h1>
          <p className="text-text-muted mt-1 text-sm tracking-widest uppercase">Live Prep Queue</p>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-red-600 rounded-sm inline-block"></span>
            <span className="text-xs font-bold uppercase tracking-widest text-text-muted">&gt; 20m (Urgent)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-orange-500 rounded-sm inline-block"></span>
            <span className="text-xs font-bold uppercase tracking-widest text-text-muted">&gt; 10m (High)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-panel-hover rounded-sm inline-block"></span>
            <span className="text-xs font-bold uppercase tracking-widest text-text-muted">Normal</span>
          </div>
        </div>
      </div>

      {/* Grid of orders */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
        <div className="flex gap-6 h-full min-w-max">
          
          {orders.map((order) => {
            const diffMins = Math.floor((currentTime.getTime() - order.timeReceived.getTime()) / 60000);
            const allCompleted = order.items.every(i => i.completed);
            
            if (order.status === 'ready') {
              return (
                <div key={order.id} className="w-80 h-full flex flex-col rounded-xl border-2 border-green-500 bg-green-950/30 overflow-hidden shadow-[0_0_30px_rgba(34,197,94,0.3)] shrink-0 animate-pulse">
                   <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 text-green-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                     </svg>
                     <h2 className="text-3xl font-black text-green-500 uppercase tracking-widest">{order.orderNumber}</h2>
                     <p className="font-bold text-text-main mt-2 uppercase tracking-widest">Order Ready</p>
                     <p className="text-sm text-green-400 mt-1">Clearing from KDS...</p>
                   </div>
                </div>
              )
            }

            return (
              <div key={order.id} className={`w-80 h-full flex flex-col rounded-xl border-2 overflow-hidden shrink-0 ${getPriorityClasses(order.priority, diffMins)} transition-colors`}>
                
                {/* Order Header */}
                <div className={`p-4 flex justify-between items-center ${getHeaderColor(order.priority, diffMins)}`}>
                  <div>
                    <h2 className="text-2xl font-black tracking-widest">{order.orderNumber}</h2>
                    <p className="text-xs font-bold uppercase tracking-wider opacity-90">{order.source}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-mono font-bold tracking-tighter">
                      {getElapsedTimeString(order.timeReceived)}
                    </div>
                  </div>
                </div>

                {/* Items List */}
                <div className="flex-1 p-4 overflow-y-auto bg-page/40">
                  <div className="space-y-3">
                    {order.items.map(item => (
                      <div 
                        key={item.id} 
                        onClick={() => toggleItemStatus(order.id, item.id)}
                        className={`p-3 rounded-lg border cursor-pointer transition-all ${
                          item.completed 
                            ? 'bg-green-900/20 border-green-900 text-text-muted line-through' 
                            : 'bg-panel border-border-subtle text-text-main hover:border-gray-500'
                        }`}
                      >
                        <div className="flex gap-3 items-start">
                          <div className={`w-6 h-6 shrink-0 rounded flex items-center justify-center font-bold text-xs ${item.completed ? 'bg-green-600 text-text-main' : 'bg-panel-hover text-text-muted'}`}>
                            {item.qty}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-bold text-sm leading-tight uppercase tracking-wide">{item.name}</h3>
                            {item.notes && !item.completed && (
                              <p className="text-xs text-yellow-500 mt-1 font-bold uppercase tracking-wider bg-yellow-500/10 inline-block px-1 rounded">Note: {item.notes}</p>
                            )}
                          </div>
                          {/* Checkbox circle */}
                          <div className={`w-6 h-6 shrink-0 rounded-full border-2 flex items-center justify-center ${item.completed ? 'border-green-500 bg-green-500' : 'border-gray-600'}`}>
                            {item.completed && (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-black" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer Action */}
                <div className="p-4 bg-page border-t border-border-subtle">
                  <button 
                    onClick={() => markOrderReady(order.id)}
                    className={`w-full py-4 rounded-lg font-black uppercase tracking-widest text-lg transition-all ${
                      allCompleted 
                        ? 'bg-green-500 hover:bg-green-400 text-black shadow-[0_0_20px_rgba(34,197,94,0.4)] animate-bounce' 
                        : 'bg-panel-hover text-text-muted cursor-not-allowed'
                    }`}
                    disabled={!allCompleted}
                  >
                    Mark Ready
                  </button>
                  {!allCompleted && (
                    <p className="text-center text-[10px] text-text-muted font-bold uppercase tracking-widest mt-2">Complete all items first</p>
                  )}
                </div>

              </div>
            );
          })}

          {orders.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center text-text-muted h-full w-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 mb-6 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
              <h2 className="text-2xl font-black uppercase tracking-widest mb-2">Kitchen is clear</h2>
              <p className="text-sm font-bold uppercase tracking-wider">No pending orders in the queue</p>
            </div>
          )}
          
        </div>
      </div>
    </div>
  );
}
