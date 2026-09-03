'use client';
import { useState } from 'react';

interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  inStock: boolean;
  image: string;
}

export default function MenuCatalogPage() {
  const [items, setItems] = useState<MenuItem[]>([
    { id: '1', name: 'Truffle Mushroom Burger', category: 'Burgers', price: 350, inStock: true, image: '🍔' },
    { id: '2', name: 'Peri Peri Fries', category: 'Sides', price: 150, inStock: true, image: '🍟' },
    { id: '3', name: 'Margherita Pizza', category: 'Pizza', price: 450, inStock: false, image: '🍕' },
    { id: '4', name: 'Fresh Lime Soda', category: 'Beverages', price: 120, inStock: true, image: '🥤' },
  ]);

  const [activeCategory, setActiveCategory] = useState('All');
  const categories = ['All', 'Burgers', 'Sides', 'Pizza', 'Beverages'];

  const toggleStock = (id: string) => {
    setItems(items.map(item => item.id === id ? { ...item, inStock: !item.inStock } : item));
  };

  const filteredItems = activeCategory === 'All' ? items : items.filter(item => item.category === activeCategory);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-widest text-text-main">Menu Catalog</h1>
          <p className="text-text-muted mt-1 text-sm tracking-widest uppercase">Manage Items & Availability</p>
        </div>
        <button className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-2 px-6 rounded uppercase tracking-wider transition-colors shadow-[0_0_15px_rgba(212,175,55,0.4)]">
          + Add New Item
        </button>
      </div>

      <div className="flex gap-4 border-b border-border-subtle pb-2 overflow-x-auto">
        {categories.map(cat => (
          <button 
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`pb-2 px-1 font-bold uppercase tracking-widest text-sm whitespace-nowrap border-b-2 transition-colors ${
              activeCategory === cat ? 'border-yellow-500 text-yellow-500' : 'border-transparent text-text-muted hover:text-text-main'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredItems.map(item => (
          <div key={item.id} className="bg-panel border border-border-subtle rounded-xl overflow-hidden hover:border-gray-600 transition-colors flex flex-col">
            <div className="h-40 bg-page flex items-center justify-center text-6xl relative group">
              {item.image}
              <div className="absolute inset-0 bg-page/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <button className="bg-white text-black px-4 py-2 rounded text-xs font-bold uppercase tracking-widest">Edit Image</button>
              </div>
            </div>
            
            <div className="p-4 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest bg-page px-2 py-1 rounded">{item.category}</span>
                <span className="font-bold text-yellow-500">₹{item.price}</span>
              </div>
              <h3 className="font-bold text-lg leading-tight mb-4 flex-1">{item.name}</h3>
              
              <div className="flex justify-between items-center mt-auto pt-4 border-t border-border-subtle">
                <span className={`text-xs font-bold uppercase tracking-widest ${item.inStock ? 'text-green-500' : 'text-red-500'}`}>
                  {item.inStock ? 'In Stock' : 'Out of Stock'}
                </span>
                
                <button 
                  onClick={() => toggleStock(item.id)}
                  className={`w-12 h-6 rounded-full p-1 transition-colors ${item.inStock ? 'bg-green-500' : 'bg-gray-700'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full transition-transform ${item.inStock ? 'translate-x-6' : 'translate-x-0'}`}></div>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
