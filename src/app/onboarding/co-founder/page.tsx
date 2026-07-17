'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Building2, ChevronRight, CheckCircle2, Mic, Square, Send } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function CoFounderOnboarding() {
  const router = useRouter();
  const [stage, setStage] = useState<'intro' | 'interview' | 'generating' | 'complete'>('intro');
  const [messages, setMessages] = useState<{ role: 'ai' | 'user'; content: string }[]>([]);
  const [orgChart, setOrgChart] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    scrollToBottom();
  }, [messages, stage]);

  const startInterview = () => {
    setStage('interview');
    setMessages([
      { role: 'ai', content: "Hello! I'm your AI Co-Founder. I'm excited to help you build your new startup. To get started, tell me a bit about your core idea and what industry you're targeting." }
    ]);
  };

  const sendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage = { role: 'user' as const, content: inputValue };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputValue('');
    setIsTyping(true);

    try {
      const res = await fetch('/api/os/onboarding/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updatedMessages })
      });
      const data = await res.json();
      
      setMessages(prev => [...prev, { role: 'ai', content: data.reply }]);
      
      if (data.isReady) {
        setTimeout(() => {
          setStage('generating');
          generateBusiness([...updatedMessages, { role: 'ai', content: data.reply }]);
        }, 3000);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  const generateBusiness = async (finalMessages: any[]) => {
    try {
      const res = await fetch('/api/os/onboarding/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: finalMessages })
      });
      const data = await res.json();
      
      if (data.success && data.orgChart) {
        setOrgChart(data.orgChart);
        setStage('complete');
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col h-[85vh]">
      <AnimatePresence mode="wait">
        
        {/* INTRO STAGE */}
        {stage === 'intro' && (
          <motion.div 
            key="intro"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex-1 flex flex-col items-center justify-center text-center space-y-8"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-purple-500/20 blur-3xl rounded-full" />
              <div className="h-32 w-32 rounded-full border-2 border-purple-500/50 bg-white flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/10 to-indigo-500/10" />
                <Sparkles className="w-12 h-12 text-purple-400" />
              </div>
            </div>
            
            <div className="space-y-4 max-w-xl">
              <h1 className="text-4xl font-bold text-gray-900 tracking-tight">Meet Your AI Co-Founder</h1>
              <p className="text-gray-900/60 text-lg leading-relaxed">
                I will help you architect your business plan, define your brand, and auto-provision your entire AI workforce based on your vision.
              </p>
            </div>

            <button 
              onClick={startInterview}
              className="px-8 py-4 bg-white text-black font-semibold rounded-full hover:scale-105 transition-transform flex items-center gap-2"
            >
              Start Interview <ChevronRight className="w-5 h-5" />
            </button>
          </motion.div>
        )}

        {/* INTERVIEW STAGE */}
        {stage === 'interview' && (
          <motion.div 
            key="interview"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex flex-col bg-white/[0.02] border border-gray-200 rounded-3xl overflow-hidden backdrop-blur-md"
          >
            <div className="p-6 border-b border-gray-100 flex items-center gap-4 bg-white/[0.01]">
              <div className="h-10 w-10 rounded-full bg-purple-500/20 border border-purple-500/50 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">AI Co-Founder</h3>
                <div className="flex items-center gap-2 text-xs text-purple-400">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                  </span>
                  Listening actively
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {messages.map((msg, idx) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] rounded-2xl p-4 ${
                    msg.role === 'user' 
                      ? 'bg-indigo-600 text-gray-900 rounded-br-sm' 
                      : 'bg-gray-50 text-gray-900/90 rounded-bl-sm border border-gray-100'
                  }`}>
                    {msg.content}
                  </div>
                </motion.div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50">
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isTyping}
                  placeholder="Type your startup idea..."
                  className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-white/40 focus:outline-none focus:border-purple-500/50 transition-colors"
                />
                <button 
                  onClick={sendMessage}
                  disabled={!inputValue.trim() || isTyping}
                  className={`h-12 w-12 rounded-xl flex items-center justify-center transition-all ${
                    !inputValue.trim() || isTyping
                      ? 'bg-white text-gray-900/30 cursor-not-allowed'
                      : 'bg-purple-600 text-gray-900 hover:bg-purple-700'
                  }`}
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* GENERATING STAGE */}
        {stage === 'generating' && (
          <motion.div 
            key="generating"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex flex-col items-center justify-center space-y-8"
          >
            <div className="relative">
              <div className="w-24 h-24 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Building2 className="w-8 h-8 text-purple-400" />
              </div>
            </div>
            
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-semibold text-gray-900">Synthesizing Business Plan...</h2>
              <p className="text-gray-900/50">Drafting company structure, brand voice, and auto-provisioning AI workforce.</p>
            </div>
            
            <div className="w-64 space-y-3 pt-8">
              <div className="flex items-center gap-3 text-sm text-gray-900/70">
                <CheckCircle2 className="w-4 h-4 text-green-400" /> Generating Executive Summary
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-900/70">
                <CheckCircle2 className="w-4 h-4 text-green-400" /> Defining Target Audience
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-900/70">
                <div className="w-4 h-4 border-2 border-purple-500/50 border-t-purple-400 rounded-full animate-spin" /> 
                Provisioning AI Departments
              </div>
            </div>
          </motion.div>
        )}

        {/* COMPLETE STAGE */}
        {stage === 'complete' && (
          <motion.div 
            key="complete"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex flex-col items-center justify-center space-y-8"
          >
            <div className="w-20 h-20 bg-green-500/20 border border-green-500/50 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-green-400" />
            </div>
            
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold text-gray-900">Your AI Company is Ready</h2>
              <p className="text-gray-900/60">We have successfully generated your business plan and hired your initial AI workforce.</p>
            </div>

            <div className="w-full max-w-2xl bg-white/[0.02] border border-gray-200 rounded-2xl p-6">
              <h4 className="text-sm font-semibold text-gray-900/50 mb-6 uppercase tracking-wider text-center">Initial Org Chart</h4>
              <div className="flex flex-wrap justify-center gap-4">
                {orgChart?.map((emp: any) => (
                  <div key={emp.id} className={`px-4 py-3 rounded-xl border flex flex-col items-center gap-2 ${
                    emp.type === 'executive' 
                      ? 'bg-purple-500/10 border-purple-500/30 w-full mb-4' 
                      : 'bg-white border-gray-200 w-[45%]'
                  }`}>
                    <span className="font-medium text-gray-900">{emp.role}</span>
                  </div>
                ))}
              </div>
            </div>

            <button 
              onClick={() => router.push('/dashboard')}
              className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-gray-900 font-semibold rounded-full transition-colors flex items-center gap-2"
            >
              Enter Command Center <ChevronRight className="w-5 h-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
