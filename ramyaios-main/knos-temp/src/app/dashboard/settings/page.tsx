'use client';
import { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

export default function SettingsPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [restaurantName, setRestaurantName] = useState('');
  const [invoicePrefix, setInvoicePrefix] = useState('INV');
  const [gstPercentage, setGstPercentage] = useState(0);
  const [totalTables, setTotalTables] = useState(0);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            if (data.restaurantName) setRestaurantName(data.restaurantName);
            if (data.invoicePrefix) setInvoicePrefix(data.invoicePrefix);
            if (data.gstPercentage !== undefined) setGstPercentage(data.gstPercentage);
            if (data.totalTables !== undefined) setTotalTables(data.totalTables);
          }
        } catch (error) {
          console.error("Error fetching settings:", error);
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', userId), {
        restaurantName,
        invoicePrefix: invoicePrefix.toUpperCase(),
        gstPercentage: Number(gstPercentage),
        totalTables: Number(totalTables)
      });
      alert('Settings saved successfully!');
    } catch (error) {
      console.error(error);
      alert('Failed to save settings');
    }
    setSaving(false);
  };

  if (loading) return <div className="p-8 text-text-main">Loading Settings...</div>;

  return (
    <div className="max-w-2xl font-sans">
      <h1 className="text-3xl font-bold mb-6 text-text-main uppercase tracking-widest">Restaurant Settings</h1>
      
      <div className="bg-panel border border-border-subtle p-8 rounded-xl shadow-lg">
        <form onSubmit={handleSave} className="space-y-6">
          
          <div>
            <label className="block text-sm font-bold text-text-muted uppercase tracking-widest mb-2">Restaurant Name (For Bill Header)</label>
            <input 
              type="text" 
              value={restaurantName}
              onChange={(e) => setRestaurantName(e.target.value)}
              className="w-full bg-page border border-border-subtle rounded-md px-4 py-3 text-text-main focus:outline-none focus:border-yellow-500 transition-colors"
              placeholder="e.g. Kalvix Cafe"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-text-muted uppercase tracking-widest mb-2">Invoice Prefix</label>
            <input 
              type="text" 
              value={invoicePrefix}
              onChange={(e) => setInvoicePrefix(e.target.value.toUpperCase())}
              className="w-full bg-page border border-border-subtle rounded-md px-4 py-3 text-text-main focus:outline-none focus:border-yellow-500 font-mono transition-colors"
              placeholder="e.g. INV"
              required
              maxLength={6}
            />
            <p className="text-xs text-text-muted mt-2">This will appear before the random number, e.g., {invoicePrefix}-102938</p>
          </div>

          <div>
            <label className="block text-sm font-bold text-text-muted uppercase tracking-widest mb-2">GST Percentage (%)</label>
            <input 
              type="number" 
              value={gstPercentage}
              onChange={(e) => setGstPercentage(parseFloat(e.target.value) || 0)}
              className="w-full bg-page border border-border-subtle rounded-md px-4 py-3 text-text-main focus:outline-none focus:border-yellow-500 font-mono transition-colors"
              placeholder="e.g. 5 or 18"
              min="0"
              max="100"
              step="0.1"
            />
            <p className="text-xs text-text-muted mt-2">Enter 0 if GST is not applicable.</p>
          </div>

          <div>
            <label className="block text-sm font-bold text-text-muted uppercase tracking-widest mb-2">Total Tables (For QR Menu)</label>
            <input 
              type="number" 
              value={totalTables}
              onChange={(e) => setTotalTables(parseInt(e.target.value) || 0)}
              className="w-full bg-page border border-border-subtle rounded-md px-4 py-3 text-text-main focus:outline-none focus:border-yellow-500 font-mono transition-colors"
              placeholder="e.g. 10"
              min="0"
              max="100"
            />
            <p className="text-xs text-text-muted mt-2">Enter the total number of dine-in tables in your restaurant.</p>
          </div>

          <div className="pt-4 border-t border-border-subtle">
            <button 
              type="submit"
              disabled={saving}
              className="bg-gradient-to-r from-yellow-600 to-yellow-400 hover:from-yellow-500 hover:to-yellow-300 text-black px-8 py-3 rounded-md font-bold uppercase tracking-widest shadow-[0_0_15px_rgba(212,175,55,0.2)] transition-all w-full sm:w-auto"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
