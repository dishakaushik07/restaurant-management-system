'use client';

import { useCallback, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';

type ApiResult = { available: boolean; data?: any; error?: string };

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAnalytics = useCallback(async (uid: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/ml/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: uid }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to load ML analytics.');
      setAnalytics(data);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to load ML analytics.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => onAuthStateChanged(auth, (user) => {
    setUserId(user?.uid ?? null);
    if (user) loadAnalytics(user.uid);
    else setLoading(false);
  }), [loadAnalytics]);

  const forecast = (analytics?.demandForecast ?? []).filter((point: any) => point.available) as Array<{ hourOffset: number; data: any }>;
  const maxDemand = Math.max(...forecast.map((point) => Number(point.data?.predicted_orders ?? 0)), 1);
  const kitchen = analytics?.kitchenLoad as ApiResult | undefined;
  const service = analytics?.serviceTime as ApiResult | undefined;
  const anomaly = analytics?.anomaly as ApiResult | undefined;
  const waste = (analytics?.wasteRisk ?? []).filter((result: ApiResult) => result.available) as ApiResult[];
  const topWaste = waste.sort((a, b) => Number(b.data?.risk_score ?? 0) - Number(a.data?.risk_score ?? 0))[0];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-widest text-text-main">AI Analytics</h1>
          <p className="text-text-muted mt-1 text-sm tracking-widest uppercase">Live Firestore data with ML predictions</p>
        </div>
        <button onClick={() => userId && loadAnalytics(userId)} disabled={!userId || loading} className="bg-page border border-yellow-500 text-yellow-500 hover:bg-yellow-500/10 disabled:opacity-50 font-bold py-2 px-4 rounded text-xs uppercase tracking-widest transition-colors">
          {loading ? 'Loading' : 'Refresh'}
        </button>
      </div>

      {error && <div className="border border-red-500/40 bg-red-500/10 text-red-300 px-4 py-3 rounded text-sm">{error}</div>}
      {!userId && !loading && <div className="border border-border-subtle bg-panel px-4 py-3 rounded text-sm text-text-muted">Sign in to load restaurant ML analytics.</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-panel border border-border-subtle rounded-xl p-6 relative overflow-hidden flex flex-col">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-lg font-bold uppercase tracking-widest text-text-main flex items-center gap-2">
                Demand Prediction
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              </h2>
              <p className="text-xs text-text-muted font-bold uppercase tracking-widest">Next 12 hourly model forecasts (Random Forest)</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-400 bg-emerald-950/40 px-2.5 py-1 rounded border border-emerald-800/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                FastAPI ML Connected
              </span>
            </div>
          </div>
          
          {forecast.length ? (
            <div className="h-64 flex items-end justify-between gap-2 pt-6 pb-2">
              {forecast.map((point) => {
                const date = new Date();
                date.setHours(date.getHours() + point.hourOffset);
                const predicted = Number(point.data?.predicted_orders ?? 0);
                const pct = Math.max(12, Math.round((predicted / maxDemand) * 100));
                const reason = point.data?.reasons?.[0] || 'Forecast';
                return (
                  <div key={point.hourOffset} className="flex-1 flex flex-col items-center justify-end h-full min-w-0 group">
                    {/* Value above bar */}
                    <span className="text-[11px] font-mono font-bold text-yellow-500/90 mb-1.5 group-hover:text-yellow-400 transition-colors">
                      {predicted.toFixed(1)}
                    </span>
                    {/* Bar track */}
                    <div className="w-full flex-1 flex items-end justify-center min-h-[50px] relative">
                      <div
                        className="w-full max-w-[26px] rounded-t-md bg-gradient-to-t from-yellow-600 to-yellow-400 group-hover:brightness-125 transition-all shadow-[0_0_12px_rgba(234,179,8,0.2)]"
                        style={{ height: `${pct}%` }}
                      />
                      {/* Tooltip */}
                      <div className="absolute -top-10 bg-page border border-yellow-500/40 text-xs py-1.5 px-2.5 rounded opacity-0 group-hover:opacity-100 transition-opacity z-20 whitespace-nowrap pointer-events-none shadow-xl text-text-main font-sans">
                        <div className="font-bold text-yellow-400">{predicted.toFixed(1)} orders ({date.getHours()}:00)</div>
                        <div className="text-[10px] text-text-muted">{reason}</div>
                      </div>
                    </div>
                    {/* Time label */}
                    <span className="text-[11px] font-mono text-text-muted mt-2">{date.getHours()}h</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-sm text-text-muted">
              {loading ? 'Loading demand model from FastAPI...' : 'Demand prediction is currently unavailable.'}
            </div>
          )}
        </div>

        <div className="bg-panel border border-border-subtle rounded-xl p-6 flex flex-col">
          <h2 className="text-lg font-bold uppercase tracking-widest text-text-main mb-4">AI Insights</h2>
          <div className="space-y-3.5 flex-1">
            <Insight 
              title="Kitchen Load" 
              result={kitchen} 
              fallback="Kitchen load requires a demand prediction." 
              badge="Dynamic"
              render={(data) => `${data.load_level} Load: ${data.recommendation} (Load Ratio: ${(Number(data.load_ratio) * 100).toFixed(0)}%)`} 
            />
            <Insight 
              title="Service Time" 
              result={service} 
              fallback="Add an active order to estimate service time." 
              badge="RandomForest"
              render={(data) => `${Number(data.estimated_minutes).toFixed(1)} mins estimated (${(data.reasons ?? []).join(', ')})`} 
            />
            <Insight 
              title="Perishable Waste Risk" 
              result={topWaste} 
              fallback="Analyzing perishable inventory risk..." 
              badge="Classifier"
              render={(data) => `${data.waste_risk} Risk: ${(data.reasons ?? []).join(' ')}`} 
            />
            <Insight 
              title="Operational Alerts" 
              result={anomaly} 
              fallback="Anomaly checks are unavailable." 
              badge="Z-Score / Rules"
              render={(data) => data.alert_count ? `${data.alert_count} alert(s): ${(data.alerts ?? []).map((alert: any) => alert.type).join(', ')}` : 'All Systems Normal — No stuck orders or idle robot delays detected.'} 
            />
          </div>
        </div>
      </div>
      {analytics?.warnings?.length > 0 && <div className="text-xs text-text-muted">{analytics.warnings.join(' ')}</div>}
    </div>
  );
}

function Insight({ title, result, fallback, badge, render }: { title: string; result?: ApiResult; fallback: string; badge?: string; render: (data: any) => string }) {
  const isAvailable = Boolean(result?.available);
  const text = isAvailable ? render(result?.data) : (result?.error || fallback);
  return (
    <div className="bg-page border border-border-subtle p-3.5 rounded-lg hover:border-yellow-500/30 transition-colors">
      <div className="flex items-center justify-between mb-1.5">
        <h3 className="font-bold text-xs uppercase tracking-wider text-text-main">{title}</h3>
        {badge && (
          <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 font-bold">
            {badge}
          </span>
        )}
      </div>
      <p className="text-xs text-text-muted leading-relaxed">{text}</p>
    </div>
  );
}

