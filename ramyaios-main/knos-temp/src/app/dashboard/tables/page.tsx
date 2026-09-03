'use client';
import { useState } from 'react';

type TableStatus = 'free' | 'occupied' | 'reserved' | 'cleaning';

interface Table {
  id: string;
  number: number;
  seats: number;
  status: TableStatus;
  x: number;
  y: number;
  activeOrder?: string;
}

export default function TablesPage() {
  const [tables, setTables] = useState<Table[]>([
    { id: 't1', number: 1, seats: 2, status: 'free', x: 10, y: 10 },
    { id: 't2', number: 2, seats: 4, status: 'occupied', x: 30, y: 10, activeOrder: '#1045' },
    { id: 't3', number: 3, seats: 2, status: 'free', x: 50, y: 10 },
    { id: 't4', number: 4, seats: 6, status: 'cleaning', x: 10, y: 40 },
    { id: 't5', number: 5, seats: 4, status: 'occupied', x: 30, y: 40, activeOrder: '#1042' },
    { id: 't6', number: 6, seats: 4, status: 'reserved', x: 50, y: 40 },
    { id: 't7', number: 7, seats: 8, status: 'free', x: 75, y: 20 },
    { id: 't8', number: 8, seats: 2, status: 'occupied', x: 75, y: 60, activeOrder: '#1048' },
  ]);

  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [isEditingLayout, setIsEditingLayout] = useState(false);

  const getStatusColor = (status: TableStatus) => {
    switch (status) {
      case 'free': return 'bg-panel-hover border-gray-600 text-text-main hover:border-white';
      case 'occupied': return 'bg-yellow-500 border-yellow-400 text-black shadow-[0_0_15px_rgba(212,175,55,0.4)]';
      case 'reserved': return 'bg-blue-900 border-blue-500 text-blue-200';
      case 'cleaning': return 'bg-orange-900 border-orange-500 text-orange-200';
      default: return 'bg-panel-hover border-gray-600 text-text-main';
    }
  };

  const handleTableClick = (t: Table) => {
    if (isEditingLayout) return;
    setSelectedTable(t);
  };

  const updateTableStatus = (status: TableStatus) => {
    if (!selectedTable) return;
    setTables(tables.map(t => t.id === selectedTable.id ? { ...t, status } : t));
    setSelectedTable({ ...selectedTable, status });
  };

  return (
    <div className="flex h-[calc(100vh-100px)] gap-6">
      
      {/* Floor Map Section */}
      <div className="flex-1 flex flex-col bg-panel border border-border-subtle rounded-xl overflow-hidden shadow-lg relative">
        <div className="p-4 border-b border-border-subtle flex justify-between items-center bg-page">
          <div>
            <h1 className="text-xl font-bold uppercase tracking-widest text-text-main">Floor Map</h1>
            <div className="flex gap-4 mt-2 text-xs font-bold uppercase tracking-widest">
              <span className="flex items-center gap-1"><div className="w-3 h-3 bg-panel-hover border border-gray-600 rounded-sm"></div> Free</span>
              <span className="flex items-center gap-1"><div className="w-3 h-3 bg-yellow-500 rounded-sm"></div> Occupied</span>
              <span className="flex items-center gap-1"><div className="w-3 h-3 bg-blue-900 border border-blue-500 rounded-sm"></div> Reserved</span>
              <span className="flex items-center gap-1"><div className="w-3 h-3 bg-orange-900 border border-orange-500 rounded-sm"></div> Cleaning</span>
            </div>
          </div>
          <div>
            <button 
              onClick={() => setIsEditingLayout(!isEditingLayout)}
              className={`px-4 py-2 font-bold text-xs uppercase tracking-widest rounded transition-colors ${
                isEditingLayout ? 'bg-red-500 text-text-main' : 'bg-panel-hover text-text-main hover:bg-gray-700'
              }`}
            >
              {isEditingLayout ? 'Save Layout' : 'Edit Layout'}
            </button>
          </div>
        </div>

        {/* The Grid / Floor area */}
        <div className="flex-1 relative bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-page overflow-auto">
          {/* Grid lines overlay to help visualization */}
          <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(#1f2937 1px, transparent 1px), linear-gradient(90deg, #1f2937 1px, transparent 1px)', backgroundSize: '5% 5%' }}></div>
          
          {tables.map((t) => (
            <div
              key={t.id}
              onClick={() => handleTableClick(t)}
              className={`absolute flex flex-col items-center justify-center rounded-lg border-2 cursor-pointer transition-transform ${getStatusColor(t.status)} ${selectedTable?.id === t.id ? 'scale-110 z-10 ring-4 ring-yellow-500/50' : ''} ${isEditingLayout ? 'cursor-move' : ''}`}
              style={{
                left: `${t.x}%`,
                top: `${t.y}%`,
                width: t.seats > 4 ? '12%' : '8%',
                height: '10%',
              }}
            >
              <span className="font-black text-lg">T{t.number}</span>
              <span className="text-[10px] font-bold opacity-80">{t.seats} Seats</span>
            </div>
          ))}
        </div>
      </div>

      {/* Table Lifecycle Panel */}
      <div className="w-80 flex flex-col bg-panel border border-border-subtle rounded-xl overflow-hidden shadow-lg">
        <div className="p-4 border-b border-border-subtle bg-page">
          <h2 className="text-lg font-bold uppercase tracking-widest text-yellow-500">Table Lifecycle</h2>
        </div>
        
        <div className="p-6 flex-1 overflow-y-auto">
          {selectedTable ? (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-page border border-yellow-500/30 rounded-full mb-3 shadow-[0_0_20px_rgba(212,175,55,0.1)] text-3xl font-black text-yellow-500">
                  T{selectedTable.number}
                </div>
                <h3 className="font-bold uppercase tracking-widest text-text-main">Status: <span className={
                  selectedTable.status === 'free' ? 'text-text-main' : 
                  selectedTable.status === 'occupied' ? 'text-yellow-500' : 
                  selectedTable.status === 'reserved' ? 'text-blue-400' : 'text-orange-400'
                }>{selectedTable.status}</span></h3>
                <p className="text-xs text-text-muted font-bold mt-1 uppercase tracking-widest">{selectedTable.seats} Seater Table</p>
              </div>

              {/* Lifecycle Actions */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-text-muted uppercase tracking-widest mb-2">Actions</div>
                
                {selectedTable.status === 'free' && (
                  <>
                    <button onClick={() => updateTableStatus('occupied')} className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-3 rounded uppercase tracking-wider transition-colors shadow">
                      Seat Guests
                    </button>
                    <button onClick={() => updateTableStatus('reserved')} className="w-full bg-panel-hover hover:bg-gray-700 text-text-main border border-gray-600 font-bold py-3 rounded uppercase tracking-wider transition-colors">
                      Mark Reserved
                    </button>
                  </>
                )}

                {selectedTable.status === 'reserved' && (
                  <>
                    <button onClick={() => updateTableStatus('occupied')} className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-3 rounded uppercase tracking-wider transition-colors shadow">
                      Guests Arrived (Seat)
                    </button>
                    <button onClick={() => updateTableStatus('free')} className="w-full bg-panel-hover hover:bg-gray-700 text-text-main font-bold py-3 rounded uppercase tracking-wider transition-colors">
                      Cancel Reservation
                    </button>
                  </>
                )}

                {selectedTable.status === 'occupied' && (
                  <>
                    <div className="bg-page border border-border-subtle p-4 rounded-lg mb-4 text-center">
                      <span className="text-text-muted text-xs font-bold uppercase tracking-widest block mb-1">Active Order</span>
                      <span className="text-yellow-500 font-mono font-bold text-lg">{selectedTable.activeOrder || 'No Orders Yet'}</span>
                    </div>
                    <button className="w-full bg-blue-600 hover:bg-blue-500 text-text-main font-bold py-3 rounded uppercase tracking-wider transition-colors shadow mb-2">
                      Take Order
                    </button>
                    <button className="w-full bg-green-600 hover:bg-green-500 text-text-main font-bold py-3 rounded uppercase tracking-wider transition-colors shadow mb-2">
                      Generate Bill
                    </button>
                    <button onClick={() => updateTableStatus('cleaning')} className="w-full bg-panel-hover hover:bg-gray-700 text-text-main font-bold py-3 rounded uppercase tracking-wider transition-colors">
                      Clear Table (Cleaning)
                    </button>
                  </>
                )}

                {selectedTable.status === 'cleaning' && (
                  <button onClick={() => updateTableStatus('free')} className="w-full bg-green-600 hover:bg-green-500 text-text-main font-bold py-3 rounded uppercase tracking-wider transition-colors shadow mt-4">
                    Mark as Clean & Free
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center text-text-muted">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
              </svg>
              <p className="font-bold uppercase tracking-widest text-sm">Select a table from the floor map to manage its lifecycle.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
