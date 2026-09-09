"use client";

import React, { useState, useEffect } from 'react';

interface Notification {
    _id: string;
    type: 'info' | 'warning' | 'error';
    message: string;
    isRead: boolean;
    createdAt: string;
}

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/notifications');
            const data = await res.json();
            if (data.success) {
                setNotifications(data.data);
            }
        } catch (error) {
            console.error('Failed to load notifications', error);
        } finally {
            setLoading(false);
        }
    };

    const handleClearAll = async () => {
        try {
            await fetch('http://localhost:5000/api/notifications', { method: 'DELETE' });
            setNotifications([]);
        } catch (error) {
            console.error('Failed to clear notifications', error);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'error':
                return (
                    <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                );
            case 'warning':
                return (
                    <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                    </svg>
                );
            case 'info':
            default:
                return (
                    <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                );
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
                    <p className="text-gray-500 mt-1">System alerts and staff updates</p>
                </div>
                <button 
                    onClick={handleClearAll}
                    disabled={notifications.length === 0}
                    className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                    Clear All
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-gray-400">Loading...</div>
                ) : notifications.length === 0 ? (
                    <div className="p-12 text-center text-gray-400">
                        <svg className="w-12 h-12 mx-auto mb-3 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
                        </svg>
                        <p>No new notifications</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {notifications.map((notif) => (
                            <div key={notif._id} className={`p-4 flex gap-4 transition-colors hover:bg-gray-50 ${!notif.isRead ? 'bg-blue-50/30' : ''}`}>
                                <div className="mt-1 flex-shrink-0">
                                    {getIcon(notif.type)}
                                </div>
                                <div className="flex-1">
                                    <p className="text-gray-800 text-sm">{notif.message}</p>
                                    <p className="text-xs text-gray-400 mt-1">
                                        {new Date(notif.createdAt).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
