"use client";

import React, { useState, useEffect, useRef } from 'react';

interface ChatMessage {
    _id?: string;
    sessionId?: string;
    query: string;
    response: string;
    status: string;
    createdAt?: string;
}

export default function GuestAssistantPage() {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    const sessionId = "session-123"; // Mock session ID for demo

    useEffect(() => {
        fetchChatHistory();
    }, []);

    const scrollToBottom = () => {
        setTimeout(() => {
            if (chatContainerRef.current) {
                chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
            }
        }, 100);
    };

    const fetchChatHistory = async () => {
        try {
            // Wait, backend route is GET /api/guest/pending which returns pending interactions.
            // There isn't a GET history route in the provided guestInteractionController.
            // I'll simulate it or just use the local state if the backend doesn't support history yet.
            // For now, start with a welcome message if empty.
            setMessages([
                { query: '', response: 'Hello! I am your Ramyaios Guest Assistant. How can I help you today?', status: 'Resolved' }
            ]);
            scrollToBottom();
        } catch (error) {
            console.error('Failed to load history', error);
        }
    };

    const handleSend = async () => {
        if (!inputText.trim()) return;
        
        const userText = inputText;
        setInputText('');
        
        // Optimistic UI update
        const tempMsg: ChatMessage = { query: userText, response: '', status: 'Pending' };
        setMessages(prev => [...prev, tempMsg]);
        
        scrollToBottom();
        setIsTyping(true);
        
        try {
            const res = await fetch('http://localhost:5000/api/guest/query', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tableNumber: 5,
                    sessionId: sessionId,
                    query: userText
                })
            });
            
            const data = await res.json();
            
            if (data.success) {
                setMessages(prev => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1] = data.data; // Replace temp with real
                    return newMessages;
                });
            }
        } catch (e) {
            console.error('Failed to send message', e);
        } finally {
            setIsTyping(false);
            scrollToBottom();
        }
    };
    
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto h-[calc(100vh-2rem)] flex flex-col">
            <header className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Guest Assistant</h1>
                <p className="text-gray-500 mt-1">AI-powered concierge for guests</p>
            </header>

            <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
                {/* Chat Header */}
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                    </div>
                    <div>
                        <h2 className="font-bold text-gray-900">Ramyaios AI</h2>
                        <p className="text-xs text-emerald-600 flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Online
                        </p>
                    </div>
                </div>

                {/* Chat Messages */}
                <div ref={chatContainerRef} className="flex-1 p-6 overflow-y-auto space-y-6 bg-gray-50/30">
                    {messages.map((msg, idx) => (
                        <React.Fragment key={idx}>
                            {/* User Query */}
                            {msg.query && (
                                <div className="flex flex-col items-end">
                                    <div className="flex items-end gap-2 max-w-[80%] flex-row-reverse">
                                        <div className="px-4 py-3 rounded-2xl bg-blue-600 text-white rounded-br-sm">
                                            <p className="text-sm leading-relaxed">{msg.query}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                            {/* AI Response */}
                            {msg.response && (
                                <div className="flex flex-col items-start mt-2">
                                    <div className="flex items-end gap-2 max-w-[80%]">
                                        <div className="w-8 h-8 rounded-full bg-blue-100 flex-shrink-0 flex items-center justify-center text-blue-600 mb-1">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                                        </div>
                                        <div className="px-4 py-3 rounded-2xl bg-white border border-gray-200 text-gray-800 rounded-bl-sm shadow-sm">
                                            <p className="text-sm leading-relaxed">{msg.response}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </React.Fragment>
                    ))}
                    
                    {isTyping && (
                        <div className="flex items-end gap-2 max-w-[80%] mt-4">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex-shrink-0 flex items-center justify-center text-blue-600 mb-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                            </div>
                            <div className="px-4 py-3 rounded-2xl bg-white border border-gray-200 text-gray-800 rounded-bl-sm shadow-sm flex items-center gap-1">
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Input Area */}
                <div className="p-4 border-t border-gray-100 bg-white">
                    <div className="flex gap-2">
                        <textarea 
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Type a message... (Try 'Call a waiter' or 'Get the bill')" 
                            rows={1}
                            className="flex-1 border border-gray-300 rounded-full px-5 py-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none overflow-hidden bg-gray-50"></textarea>
                        <button 
                            onClick={handleSend}
                            disabled={!inputText.trim() || isTyping}
                            className="w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition-colors disabled:opacity-50 flex-shrink-0">
                            <svg className="w-5 h-5 ml-1" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path></svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
