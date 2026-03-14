"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Model } from '@/types/database';

export default function Home() {
  const [models, setModels] = useState<Model[]>([]);
  const [message, setMessage] = useState('');
  const [chatLog, setChatLog] = useState<{ role: 'user' | 'assistant', content: string, model?: string }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchModels();

    const channel = supabase
      .channel('models_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'models' },
        () => {
          fetchModels();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchModels() {
    const { data, error } = await supabase
      .from('models')
      .select('*')
      .order('id');
    if (!error && data) {
      setModels(data as Model[]);
    }
  }

  async function switchModel(modelId: number) {
    // Optimistic UI update
    setModels(current => current.map(m => ({ ...m, is_active: m.id === modelId })));

    // Since RLS policies apply, this mutation must match what the client is allowed to do.
    // If not allowed, you'd call a server action. Assuming client has update permissions:
    await supabase.from('models').update({ is_active: false }).neq('id', modelId);
    await supabase.from('models').update({ is_active: true }).eq('id', modelId);
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;

    const userMessage = message;
    setMessage('');
    setChatLog(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage })
      });
      const data = await res.json();
      
      if (data.error) throw new Error(data.error);

      setChatLog(prev => [...prev, { 
        role: 'assistant', 
        content: data.reply,
        model: data.model_used 
      }]);
    } catch (err: any) {
      setChatLog(prev => [...prev, { role: 'assistant', content: `Error: ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        
        <header>
          <h1 className="text-3xl font-semibold tracking-tight text-neutral-900">Model Switcher</h1>
          <p className="text-neutral-500 mt-2">Powered by Supabase Realtime & OpenRouter</p>
        </header>

        <section className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
          <h2 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-4">Active Router State</h2>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {models.map(model => (
              <button
                key={model.id}
                onClick={() => switchModel(model.id)}
                className={`text-left p-4 rounded-lg border transition-all ${
                  model.is_active 
                    ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' 
                    : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-neutral-900">{model.model_name}</span>
                  {model.is_active && (
                    <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                  )}
                </div>
                <div className="text-xs text-neutral-500 mt-1 truncate" title={model.openrouter_id}>
                  {model.openrouter_id}
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="bg-white rounded-xl shadow-sm border border-neutral-200 flex flex-col h-[500px]">
          <div className="flex-1 p-6 overflow-y-auto space-y-6">
            {chatLog.length === 0 ? (
              <div className="text-center text-neutral-400 mt-20">Select a model above and say hello.</div>
            ) : (
              chatLog.map((msg, i) => (
                <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`px-4 py-2 rounded-2xl max-w-[80%] ${
                    msg.role === 'user' 
                      ? 'bg-blue-500 text-white rounded-br-none' 
                      : 'bg-neutral-100 text-neutral-800 rounded-bl-none'
                  }`}>
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  </div>
                  {msg.role === 'assistant' && msg.model && (
                    <span className="text-xs text-neutral-400 mt-1 ml-2">via {msg.model}</span>
                  )}
                </div>
              ))
            )}
            {loading && (
              <div className="flex items-start">
                <div className="bg-neutral-100 px-4 py-2 rounded-2xl rounded-bl-none text-neutral-500 animate-pulse">
                  Routing request...
                </div>
              </div>
            )}
          </div>

          <form onSubmit={sendMessage} className="p-4 border-t border-neutral-100 bg-neutral-50 rounded-b-xl flex gap-3">
            <input
              type="text"
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Test the active model..."
              className="flex-1 rounded-lg border border-neutral-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              disabled={loading}
            />
            <button 
              type="submit" 
              disabled={loading || !message.trim()}
              className="px-6 py-2 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
            >
              Send
            </button>
          </form>
        </section>

      </div>
    </div>
  );
}
