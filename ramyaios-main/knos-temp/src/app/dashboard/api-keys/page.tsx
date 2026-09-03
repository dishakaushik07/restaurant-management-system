'use client';

import { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, addDoc, getDocs, deleteDoc, doc, query, where } from 'firebase/firestore';

export default function Dashboard() {
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        fetchKeys(user.uid);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const fetchKeys = async (uid: string) => {
    try {
      const q = query(collection(db, 'api_keys'), where('userId', '==', uid));
      const snapshot = await getDocs(q);
      const keys = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setApiKeys(keys);
    } catch (error) {
      console.error("Error fetching keys:", error);
    }
  };

  const handleGenerateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    setGenerating(true);
    
    // Generate a secure looking unique key
    const uniquePart = Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    const generatedKey = `knos_live_${uniquePart.toUpperCase()}`;
    
    const keyName = newKeyName.trim() || `API Key ${apiKeys.length + 1}`;

    try {
      const newKeyData = {
        userId,
        name: keyName,
        key: generatedKey,
        createdAt: new Date().toISOString(),
      };
      
      const docRef = await addDoc(collection(db, 'api_keys'), newKeyData);
      setApiKeys([...apiKeys, { id: docRef.id, ...newKeyData }]);
      setNewKeyName('');
    } catch (error) {
      console.error('Error saving key', error);
      alert('Failed to generate key');
    }
    setGenerating(false);
  };

  const deleteKey = async (id: string) => {
    if (!confirm('Are you sure you want to revoke this API Key? Any website using it will lose access immediately.')) return;
    
    try {
      await deleteDoc(doc(db, 'api_keys', id));
      setApiKeys(apiKeys.filter((k) => k.id !== id));
    } catch (error) {
      alert('Error revoking key');
    }
  };

  if (loading) return <div className="p-8 text-text-main">Loading Dashboard...</div>;

  return (
    <div className="max-w-4xl font-sans">
      
      {/* Header */}
      <header className="mb-10">
        <h1 className="text-3xl font-bold text-text-main uppercase tracking-widest">API Dashboard</h1>
        <p className="text-text-muted mt-2 text-sm">Manage your API keys and connect your restaurant website to Kalvix Nexus POS.</p>
      </header>

      {/* Generate Key Section */}
      <div className="bg-panel border border-border-subtle p-6 rounded-xl shadow-lg mb-8">
        <h2 className="text-xl font-bold mb-4 text-text-main uppercase tracking-widest">Generate New API Key</h2>
        <form onSubmit={handleGenerateKey} className="flex gap-4 items-start sm:items-center flex-col sm:flex-row">
          <input
            type="text"
            placeholder="Key Name (e.g. Main Website)"
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            className="flex-1 bg-page border border-border-subtle rounded-md px-4 py-3 text-text-main focus:outline-none focus:border-yellow-500 w-full"
          />
          <button
            type="submit"
            disabled={generating}
            className="bg-gradient-to-r from-yellow-600 to-yellow-400 hover:from-yellow-500 hover:to-yellow-300 text-black px-6 py-3 rounded-md font-bold uppercase tracking-widest shadow-[0_0_15px_rgba(212,175,55,0.2)] transition-all whitespace-nowrap w-full sm:w-auto"
          >
            {generating ? 'Generating...' : 'Generate Auto Key'}
          </button>
        </form>
      </div>

      {/* API Keys List */}
      <div className="bg-panel border border-border-subtle rounded-xl shadow-lg overflow-hidden mb-10">
        <div className="p-6 border-b border-border-subtle bg-page">
          <h2 className="text-xl font-bold text-text-main uppercase tracking-widest">Your API Keys</h2>
          <p className="text-xs text-text-muted mt-1">Do not share your API keys in publicly accessible areas.</p>
        </div>
        
        {apiKeys.length === 0 ? (
          <div className="p-12 text-center text-text-muted">
            No API keys generated yet. Create one above to connect your website.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-text-main">
              <thead className="bg-panel border-b border-border-subtle text-xs uppercase tracking-wider text-text-muted">
                <tr>
                  <th className="px-6 py-4 font-bold">Key Name</th>
                  <th className="px-6 py-4 font-bold">API Key</th>
                  <th className="px-6 py-4 font-bold">Created</th>
                  <th className="px-6 py-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800 bg-page/50">
                {apiKeys.map((keyObj) => (
                  <tr key={keyObj.id} className="hover:bg-panel-hover/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-text-main">{keyObj.name}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="font-mono text-xs text-yellow-500 bg-yellow-500/10 px-3 py-1 rounded inline-block border border-yellow-500/20">
                          {keyObj.key}
                        </div>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(keyObj.key);
                            alert('API Key copied to clipboard!');
                          }}
                          className="text-text-muted hover:text-yellow-500 transition-colors p-1"
                          title="Copy API Key"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-text-muted">
                      {new Date(keyObj.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => deleteKey(keyObj.id)}
                        className="text-red-500 hover:text-red-400 font-bold uppercase text-xs bg-red-500/10 px-3 py-1 rounded transition-colors"
                      >
                        Revoke
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Developer Instructions */}
      <div className="p-6 bg-panel border border-yellow-500/30 rounded-xl shadow-[0_0_20px_rgba(212,175,55,0.05)]">
        <h3 className="font-bold text-lg mb-2 text-yellow-500 uppercase tracking-widest flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
          Developer Instructions
        </h3>
        <p className="text-sm text-text-muted mb-4">
          Send orders from your public website to this POS automatically using your unique API Key.
        </p>
        
        <div className="relative group mt-4">
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
            <button 
              onClick={() => {
                const code = `### Hello Developer,
We have integrated Kalvix Nexus POS for billing. Whenever a successful order is placed on the website, push it to our POS using the function below.

// Replace with the unique API Key from the POS
const API_KEY = "${apiKeys.length > 0 ? apiKeys[apiKeys.length - 1].key : 'YOUR_API_KEY'}"; 
// The actual domain where Kalvix Nexus POS is hosted
const POS_BASE_URL = "https://knospos.vercel.app"; 

async function sendOrderToKalvixPOS(customerInfo, cartItems, totalAmount) {
  try {
    const response = await fetch(\`\${POS_BASE_URL}/api/external/orders\`, {
      method: "POST",
      headers: {
        "Authorization": \`Bearer \${API_KEY}\`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        customerName: customerInfo.name,          // e.g., "Vikram Singh"
        customerPhone: customerInfo.phone || "",  // e.g., "9876543210"
        paymentMode: customerInfo.paymentMethod,  // e.g., "UPI", "Card", "Cash"
        totalAmount: totalAmount,                 // e.g., 1050
        
        items: cartItems.map(item => ({
          id: item.id || Date.now(),
          name: item.name,                        // e.g., "Burger"
          price: Number(item.price),              // e.g., 150
          qty: Number(item.quantity)              // e.g., 2
        }))
      })
    });

    const data = await response.json();
    if (response.ok) console.log("✅ Order sent to POS successfully! Order ID:", data.orderId);
    else console.error("❌ Failed to send order to POS:", data.error);
  } catch (error) {
    console.error("❌ API Connection Error:", error);
  }
}`;
                navigator.clipboard.writeText(code);
                alert('Ready-made code copied! Send this directly to your developer.');
              }}
              className="bg-yellow-500 hover:bg-yellow-400 text-black p-2 rounded-md border border-yellow-600 text-xs font-bold flex items-center gap-1 shadow-lg transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              COPY FULL MESSAGE FOR DEVELOPER
            </button>
          </div>
          <div className="bg-page border border-border-subtle p-5 rounded-md font-mono text-sm text-text-main overflow-x-auto shadow-inner relative">
            <div className="text-text-muted mb-4 whitespace-pre-wrap">
{`### Hello Developer,
We have integrated Kalvix Nexus POS for billing. Whenever a successful order is placed on the website, push it to our POS using the function below.`}
            </div>
            
            <div className="text-green-400 mb-1">// Replace with the unique API Key from the POS</div>
            <div>
              <span className="text-blue-300">const</span> <span className="text-text-main">API_KEY</span> <span className="text-pink-400">=</span> <span className="text-yellow-200">"{apiKeys.length > 0 ? <span className="text-yellow-500 font-bold">{apiKeys[apiKeys.length - 1].key}</span> : 'YOUR_API_KEY'}"</span>;
            </div>
            
            <div className="text-green-400 mt-2 mb-1">// The actual domain where Kalvix Nexus POS is hosted</div>
            <div>
              <span className="text-blue-300">const</span> <span className="text-text-main">POS_BASE_URL</span> <span className="text-pink-400">=</span> <span className="text-yellow-200">"https://knospos.vercel.app"</span>;
            </div>
            <br />
            <div>
              <span className="text-blue-300">async function</span> <span className="text-yellow-100">sendOrderToKalvixPOS</span>(customerInfo, cartItems, totalAmount) {'{'}
            </div>
            <div className="pl-4">
              <span className="text-blue-300">try</span> {'{'}
              <div className="pl-4">
                <span className="text-blue-300">const</span> response <span className="text-pink-400">=</span> <span className="text-blue-300">await</span> <span className="text-yellow-100">fetch</span>(<span className="text-yellow-200">{"`${POS_BASE_URL}/api/external/orders`"}</span>, {'{'}
                <div className="pl-4">
                  method: <span className="text-yellow-200">"POST"</span>,<br/>
                  headers: {'{'}
                  <div className="pl-4">
                    <span className="text-yellow-200">"Authorization"</span>: <span className="text-yellow-200">{"`Bearer ${API_KEY}`"}</span>,<br/>
                    <span className="text-yellow-200">"Content-Type"</span>: <span className="text-yellow-200">"application/json"</span>
                  </div>
                  {'}'},<br/>
                  body: <span className="text-text-main">JSON</span>.<span className="text-yellow-100">stringify</span>({'{'}
                  <div className="pl-4">
                    customerName: customerInfo.name, <span className="text-text-muted">// e.g., "Vikram Singh"</span><br/>
                    customerPhone: customerInfo.phone <span className="text-pink-400">||</span> <span className="text-yellow-200">""</span>, <span className="text-text-muted">// e.g., "9876543210"</span><br/>
                    paymentMode: customerInfo.paymentMethod, <span className="text-text-muted">// e.g., "UPI", "Card", "Cash"</span><br/>
                    totalAmount: totalAmount, <span className="text-text-muted">// e.g., 1050</span><br/><br/>
                    items: cartItems.<span className="text-yellow-100">map</span>(item <span className="text-blue-300">=&gt;</span> ({'{'}
                    <div className="pl-4">
                      id: item.id <span className="text-pink-400">||</span> <span className="text-text-main">Date</span>.<span className="text-yellow-100">now</span>(),<br/>
                      name: item.name, <span className="text-text-muted">// e.g., "Burger"</span><br/>
                      price: <span className="text-text-main">Number</span>(item.price), <span className="text-text-muted">// e.g., 150</span><br/>
                      qty: <span className="text-text-main">Number</span>(item.quantity) <span className="text-text-muted">// e.g., 2</span>
                    </div>
                    {'}))'}
                  </div>
                  {'}'})
                </div>
                {'});'}
              </div>
              {'}'} <span className="text-blue-300">catch</span> (error) {'{'}
              <div className="pl-4 text-text-muted">// Handle Error</div>
              {'}'}
            </div>
            {'}'}
          </div>
        </div>
      </div>

    </div>
  );
}
