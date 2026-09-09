"use client";

import React, { useState, useEffect } from 'react';

interface Anomaly {
    _id?: string;
    type: string;
    description: string;
    severity: 'High' | 'Medium' | 'Low';
    timestamp: string;
}

interface AnalyticsData {
    predictedOrders: number;
    actualOrders: number;
    foodWasteKg: number;
    anomalies: Anomaly[];
    date?: string;
}

export default function AnalyticsPage() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/analytics');
            const result = await res.json();
            if (result.success) {
                setData(result.data);
            }
        } catch (error) {
            console.error('Failed to load analytics', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Loading AI Insights...</div>;
    }

    if (!data) {
        return <div className="p-8 text-center text-red-500">Failed to load analytics data.</div>;
    }

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-6">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">AI Analytics</h1>
                <p className="text-gray-500 mt-1">Predictive insights and anomaly detection</p>
            </header>

            {/* Top Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Predicted Orders (Today)</p>
                        <h3 className="text-3xl font-bold text-gray-900 mt-1">{data.predictedOrders}</h3>
                    </div>
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Actual Orders (So far)</p>
                        <h3 className="text-3xl font-bold text-emerald-600 mt-1">{data.actualOrders}</h3>
                    </div>
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Food Waste (Predicted)</p>
                        <h3 className="text-3xl font-bold text-rose-600 mt-1">{data.foodWasteKg} kg</h3>
                    </div>
                    <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </div>
                </div>
            </div>

            {/* Main Content Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Chart Section */}
                <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-900 mb-6">Order Volume Prediction</h3>
                    <div className="h-64 flex items-end justify-between gap-2 pb-6 border-b border-gray-100">
                        {/* Mock Chart Bars */}
                        {[30, 45, 60, 100, 80, 50, 40].map((height, i) => (
                            <div key={i} className="w-full bg-blue-100 rounded-t-sm relative group transition-all hover:bg-blue-200" style={{ height: `${height}%` }}>
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                    {height * 2}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between mt-4 text-xs text-gray-400 font-medium px-2">
                        <span>10 AM</span>
                        <span>12 PM</span>
                        <span>2 PM</span>
                        <span>4 PM</span>
                        <span>6 PM</span>
                        <span>8 PM</span>
                        <span>10 PM</span>
                    </div>
                </div>

                {/* Anomalies List */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col">
                    <div className="p-6 border-b border-gray-100">
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                            AI Anomalies
                        </h3>
                    </div>
                    <div className="flex-1 p-0 overflow-y-auto max-h-80">
                        {data.anomalies.length === 0 ? (
                            <div className="p-6 text-center text-gray-400 text-sm">No anomalies detected</div>
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {data.anomalies.map((anomaly, idx) => (
                                    <div key={idx} className="p-4 hover:bg-gray-50 transition-colors">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="font-semibold text-gray-800 text-sm">{anomaly.type}</span>
                                            <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full 
                                                ${anomaly.severity === 'High' ? 'bg-red-100 text-red-700' : 
                                                  anomaly.severity === 'Medium' ? 'bg-amber-100 text-amber-700' : 
                                                  'bg-blue-100 text-blue-700'}`}>
                                                {anomaly.severity}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500">{anomaly.description}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
