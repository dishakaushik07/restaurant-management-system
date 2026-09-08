'use client';

import { useState } from 'react';
import { auth } from '@/lib/firebase';

export function GuestAssistant() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [tableId, setTableId] = useState('');
  const [orderId, setOrderId] = useState('');
  const [response, setResponse] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    const userId = auth.currentUser?.uid;
    if (!userId || !message.trim()) return;
    setSubmitting(true);
    setResponse('');
    try {
      const result = await fetch('/api/ml/guest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, message, tableId, orderId }),
      });
      const data = await result.json();
      setResponse(data.response || data.error || 'No response was returned.');
    } catch {
      setResponse('The assistant service is temporarily unavailable.');
    } finally {
      setSubmitting(false);
    }
  }

  return <>
    {open && <div className="absolute bottom-24 right-6 z-50 w-80 bg-panel border border-border-subtle rounded-lg shadow-xl p-4 space-y-3">
      <div className="flex items-center justify-between"><h2 className="text-sm font-bold uppercase tracking-widest">Guest Assistant</h2><button onClick={() => setOpen(false)} aria-label="Close assistant" className="text-text-muted hover:text-text-main">x</button></div>
      <textarea value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Enter a guest message" className="w-full min-h-20 bg-page border border-border-subtle rounded p-2 text-sm outline-none focus:border-yellow-500" />
      <div className="grid grid-cols-2 gap-2"><input value={tableId} onChange={(event) => setTableId(event.target.value)} placeholder="Table (optional)" className="bg-page border border-border-subtle rounded p-2 text-xs outline-none focus:border-yellow-500" /><input value={orderId} onChange={(event) => setOrderId(event.target.value)} placeholder="Order ID (optional)" className="bg-page border border-border-subtle rounded p-2 text-xs outline-none focus:border-yellow-500" /></div>
      {response && <p className="text-xs text-text-muted border border-border-subtle bg-page rounded p-2">{response}</p>}
      <button onClick={submit} disabled={submitting || !message.trim() || !auth.currentUser} className="w-full bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 text-black font-bold py-2 rounded text-xs uppercase tracking-widest">{submitting ? 'Sending' : 'Send'}</button>
    </div>}
    <button onClick={() => setOpen((value) => !value)} aria-label="Open guest assistant" className="absolute bottom-6 right-6 w-14 h-14 bg-yellow-500 rounded-full shadow-[0_0_20px_rgba(212,175,55,0.4)] flex items-center justify-center hover:scale-110 transition-transform z-50">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
    </button>
  </>;
}
