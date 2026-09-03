'use client';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, getDoc, setDoc } from 'firebase/firestore';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  // CMS State
  const [cmsData, setCmsData] = useState({
    heroTitle: '',
    heroSubtitle: '',
    starterPrice: '',
    starterDesc: '',
    proPrice: '',
    proDesc: ''
  });

  useEffect(() => {
    async function fetchData() {
      // Fetch Users
      try {
        const querySnapshot = await getDocs(collection(db, 'users'));
        const usersList = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        setUsers(usersList);
      } catch (error) {
        console.error("Error fetching users", error);
      }

      // Fetch CMS
      try {
        const docRef = doc(db, 'cms', 'landing');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setCmsData(docSnap.data() as any);
        }
      } catch (error) {
        console.error("Error fetching CMS", error);
      }
    }
    fetchData();
  }, []);

  const handleSaveCMS = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await setDoc(doc(db, 'cms', 'landing'), cmsData);
      alert('Landing Page updated successfully!');
    } catch (error: any) {
      alert('Error updating CMS: ' + error.message);
    }
    setSaving(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans text-gray-900">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 flex items-center gap-3">
          <img src="/logo.png" alt="Kalvix Nexus Logo" className="w-8 h-8" />
          Super Admin Panel
        </h1>

        <div className="flex gap-4 border-b border-gray-200 mb-8">
          <button 
            className={`pb-4 px-4 font-semibold ${activeTab === 'users' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
            onClick={() => setActiveTab('users')}
          >
            Registered Restaurants
          </button>
          <button 
            className={`pb-4 px-4 font-semibold ${activeTab === 'cms' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-500'}`}
            onClick={() => setActiveTab('cms')}
          >
            Landing Page CMS
          </button>
        </div>

        {activeTab === 'users' && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b text-sm">
                  <th className="px-6 py-3">Restaurant Name</th>
                  <th className="px-6 py-3">Email</th>
                  <th className="px-6 py-3">Role</th>
                  <th className="px-6 py-3">Created At</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-b">
                    <td className="px-6 py-4 font-medium">{u.restaurantName || 'N/A'}</td>
                    <td className="px-6 py-4">{u.email}</td>
                    <td className="px-6 py-4"><span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">{u.role}</span></td>
                    <td className="px-6 py-4 text-sm text-gray-500">{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'Unknown'}</td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">No restaurants registered yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'cms' && (
          <div className="bg-white rounded-lg shadow-sm border p-8 max-w-3xl">
            <h2 className="text-xl font-bold mb-6">Edit Landing Page Content</h2>
            <form onSubmit={handleSaveCMS} className="space-y-6">
              
              <div className="space-y-4">
                <h3 className="font-semibold text-lg text-gray-700 border-b pb-2">Hero Section</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hero Title</label>
                  <input type="text" value={cmsData.heroTitle} onChange={e => setCmsData({...cmsData, heroTitle: e.target.value})} className="w-full border border-gray-300 rounded p-2 focus:ring-purple-500 focus:border-purple-500" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hero Subtitle</label>
                  <textarea value={cmsData.heroSubtitle} onChange={e => setCmsData({...cmsData, heroSubtitle: e.target.value})} className="w-full border border-gray-300 rounded p-2 h-24 focus:ring-purple-500 focus:border-purple-500" required />
                </div>
              </div>

              <div className="space-y-4 pt-6">
                <h3 className="font-semibold text-lg text-gray-700 border-b pb-2">Pricing: Starter Plan</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
                    <input type="text" value={cmsData.starterPrice} onChange={e => setCmsData({...cmsData, starterPrice: e.target.value})} className="w-full border border-gray-300 rounded p-2" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <input type="text" value={cmsData.starterDesc} onChange={e => setCmsData({...cmsData, starterDesc: e.target.value})} className="w-full border border-gray-300 rounded p-2" required />
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-6">
                <h3 className="font-semibold text-lg text-gray-700 border-b pb-2">Pricing: Pro Plan</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
                    <input type="text" value={cmsData.proPrice} onChange={e => setCmsData({...cmsData, proPrice: e.target.value})} className="w-full border border-gray-300 rounded p-2" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <input type="text" value={cmsData.proDesc} onChange={e => setCmsData({...cmsData, proDesc: e.target.value})} className="w-full border border-gray-300 rounded p-2" required />
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <button type="submit" disabled={saving} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-8 rounded shadow-lg transition-colors">
                  {saving ? 'Saving...' : 'Save Changes to Live Website'}
                </button>
              </div>

            </form>
          </div>
        )}
      </div>
    </div>
  );
}
