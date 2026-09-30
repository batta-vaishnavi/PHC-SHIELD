import React, { useState } from 'react';
import {
  MessageSquare, Sparkles, Send, ShieldAlert,
  Bot, User, CornerDownLeft, Database, HelpCircle
} from 'lucide-react';
import { apiClient } from '../api/client';
import { useApp } from '../context/AppContext';

export const GeminiAssistant = () => {
  const { showToast, hasData } = useApp();
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: "Hello! I am your PHC-SHIELD Clinical Supply Chain Intelligence Advisor. I analyze live database telemetry to answer questions about stock-outs, hospital capacity, and redistribution logistics.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const presetQuestions = [
    "Summarize the current critical PHCs.",
    "Why is this PHC at risk?",
    "What should be done for high-risk stock-outs?",
    "Explain the redistribution recommendation.",
    "Explain this medicine shortage."
  ];

  const handleSend = async (queryText) => {
    const q = (queryText || inputQuery).trim();
    if (!q) return;

    // Add User Message
    const userMsg = {
      sender: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, userMsg]);
    setInputQuery('');
    setLoading(true);

    try {
      const res = await apiClient.askAssistant({ question: q });
      const botMsg = {
        sender: 'bot',
        text: res.answer,
        disclaimer: res.disclaimer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      const botErrMsg = {
        sender: 'bot',
        text: "Gemini is currently unavailable. Numerical analysis is still available in the respective system tabs.",
        disclaimer: "AI-generated explanation based on available data. Verify before operational use.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botErrMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto flex flex-col h-[calc(100vh-10rem)]">
      {/* Header */}
      <div className="border-b border-slate-200 pb-4 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-600 to-navy-900 flex items-center justify-center text-white shadow-md">
              <Sparkles className="w-5 h-5 text-teal-300" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                Gemini Clinical Supply Chain AI Assistant
              </h1>
              <p className="text-xs text-slate-500">
                Context-aware conversational intelligence grounded strictly on live database values.
              </p>
            </div>
          </div>
        </div>

        {/* Governance Label */}
        <div className="mt-3 p-2.5 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2 text-[11px] text-amber-900 font-medium">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
          <span>AI-generated explanation based on available data. Verify before operational use.</span>
        </div>
      </div>

      {/* Preset Question Chips */}
      <div className="flex flex-wrap gap-2 shrink-0">
        {presetQuestions.map((pq, i) => (
          <button
            key={i}
            onClick={() => handleSend(pq)}
            className="px-3 py-1.5 rounded-full text-xs font-semibold bg-white hover:bg-teal-50 border border-slate-200 hover:border-teal-300 text-slate-700 hover:text-teal-900 transition shadow-2xs flex items-center gap-1.5"
          >
            <HelpCircle className="w-3.5 h-3.5 text-teal-600" />
            <span>{pq}</span>
          </button>
        ))}
      </div>

      {/* Message Chat History */}
      <div className="flex-1 overflow-y-auto space-y-4 p-4 bg-slate-50/70 rounded-2xl border border-slate-200 shadow-inner">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex items-start gap-3 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {m.sender === 'bot' && (
              <div className="w-8 h-8 rounded-full bg-teal-700 text-white flex items-center justify-center shrink-0 shadow-sm mt-1">
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div
              className={`max-w-xl rounded-2xl p-4 text-xs leading-relaxed shadow-xs ${
                m.sender === 'user'
                  ? 'bg-navy-900 text-white rounded-tr-none'
                  : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none font-sans'
              }`}
            >
              <div className="whitespace-pre-line font-normal">{m.text}</div>
              <span className={`block text-[10px] mt-2 ${m.sender === 'user' ? 'text-slate-400' : 'text-slate-400'}`}>
                {m.timestamp}
              </span>
            </div>

            {m.sender === 'user' && (
              <div className="w-8 h-8 rounded-full bg-navy-800 text-white flex items-center justify-center shrink-0 shadow-sm mt-1">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-xs text-slate-500 italic p-3 bg-white/70 rounded-xl max-w-sm border border-slate-200">
            <Sparkles className="w-4 h-4 text-teal-600 animate-spin" />
            <span>Retrieving live clinical context & generating grounded brief...</span>
          </div>
        )}
      </div>

      {/* Input Bar */}
      <div className="shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-300 shadow-md focus-within:border-teal-500"
        >
          <input
            type="text"
            placeholder="Ask about risk factors, stock shortages, transfer allocations, or district telemetry..."
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            disabled={loading}
            className="flex-1 px-3 py-2 text-xs focus:outline-none bg-transparent"
          />
          <button
            type="submit"
            disabled={loading || !inputQuery.trim()}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-200 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5"
          >
            <span>Ask AI</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
