'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Mic, Video, X, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

const INTERVIEW_PHASES = [
  'Introduction',
  'Experience',
  'Working Philosophy',
  'Strengths',
  'Weaknesses',
  'Scenario Questions',
  'Ask Anything',
  'Recommendation'
];

export default function Marketplace() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [interviewing, setInterviewing] = useState<string | null>(null);
  const [hiring, setHiring] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const router = useRouter();

  // Interview State
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [chatHistory, setChatHistory] = useState<{role: string, content: string}[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/os/marketplace')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setTemplates(data);
        setLoading(false);
      })
      .catch(e => {
        console.error(e);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, isTyping]);

  const handleHire = async (templateId: string) => {
    setHiring(true);
    setNotification(null);
    try {
      const galaxyRes = await fetch('/api/os/galaxy');
      const galaxy = await galaxyRes.json();
      
      const res = await fetch('/api/os/workforce/hire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId, businessId: galaxy.id })
      });
      
      if (res.ok) {
        const emp = await res.json();
        setNotification({ type: 'success', message: `Successfully hired ${emp.name}!` });
        setInterviewing(null);
        router.push('/dashboard/workforce');
      } else {
        setNotification({ type: 'error', message: 'Failed to hire agent.' });
      }
    } catch (e) {
      console.error(e);
      setNotification({ type: 'error', message: 'Error hiring agent.' });
    } finally {
      setHiring(false);
    }
  };

  const startInterview = (candidateId: string) => {
    setInterviewing(candidateId);
    setCurrentPhaseIndex(0);
    setChatHistory([]);
  };

  const sendMessage = async () => {
    if (!userInput.trim() || !interviewing) return;

    const currentPhase = INTERVIEW_PHASES[currentPhaseIndex];
    const newMessage = { role: 'user', content: userInput };
    const updatedHistory = [...chatHistory, newMessage];
    
    setChatHistory(updatedHistory);
    setUserInput('');
    setIsTyping(true);

    try {
      const res = await fetch('/api/os/marketplace/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: interviewing,
          phase: currentPhase,
          userInput: newMessage.content,
          history: chatHistory
        })
      });

      if (res.ok) {
        const data = await res.json();
        setChatHistory([...updatedHistory, { role: 'assistant', content: data.response }]);
      }
    } catch (e) {
      console.error('Interview chat error', e);
    }
    setIsTyping(false);
  };

  const nextPhase = () => {
    if (currentPhaseIndex < INTERVIEW_PHASES.length - 1) {
      setCurrentPhaseIndex(currentPhaseIndex + 1);
    }
  };

  const activeCandidate = templates.find(c => c.id === interviewing);

  if (loading) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-[#FAFAFA]">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-gray-500 font-semibold tracking-widest uppercase text-[10px]">Loading Talent Pool...</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col p-10 overflow-y-auto custom-scrollbar bg-[#FAFAFA] text-gray-900">
      {/* Header */}
      <div className="flex items-end justify-between mb-10 pb-6 border-b border-gray-200">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-2">Talent Acquisition</h1>
          <p className="text-gray-500 text-base font-medium">Interview and hire top-tier autonomous AI employees backed by the Prisma runtime.</p>
        </div>
      </div>

      {notification && (
        <div className={`mb-8 p-4 rounded-xl flex items-center justify-between font-medium shadow-sm ${notification.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
          <span>{notification.message}</span>
          <button onClick={() => setNotification(null)} className="p-1.5 hover:bg-white/5 rounded-lg transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Featured Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8">
        {templates.map((candidate, idx) => (
          <motion.div 
            key={candidate.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: (idx % 10) * 0.1 }}
            className="group relative rounded-3xl bg-white border border-gray-200 hover:border-indigo-300 hover:shadow-lg transition-all overflow-hidden flex flex-col h-[440px]"
          >
            {/* Top Banner & Avatar */}
            <div className="h-28 bg-indigo-50 relative border-b border-indigo-100">
              <div className="absolute -bottom-10 left-8 w-20 h-20 rounded-2xl bg-white flex items-center justify-center font-bold text-3xl text-indigo-600 shadow-md border border-gray-100">
                {candidate.name.charAt(0)}
              </div>
            </div>

            {/* Info */}
            <div className="pt-14 px-8 pb-8 flex-1 flex flex-col">
              <div className="mb-5">
                <h3 className="text-2xl font-bold text-gray-900 leading-tight mb-1">{candidate.name}</h3>
                <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wide">{candidate.role}</p>
              </div>

              <p className="text-sm text-gray-600 line-clamp-3 mb-6 flex-1 font-medium leading-relaxed">"{candidate.description || candidate.personality}"</p>

              {/* Actions */}
              <div className="flex gap-4 mt-auto">
                <button 
                  onClick={() => startInterview(candidate.id)}
                  className="flex-1 py-3 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 text-sm font-bold transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  <Video className="w-4 h-4 text-indigo-500" />
                  Interview
                </button>
                <button 
                  disabled={hiring}
                  onClick={() => handleHire(candidate.id)}
                  className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-gray-900 text-sm font-bold transition-colors shadow-sm"
                >
                  {hiring ? 'Hiring...' : 'Hire'}
                </button>
              </div>
            </div>
          </motion.div>
        ))}
        {templates.length === 0 && <div className="text-gray-500 font-medium col-span-full p-12 text-center bg-gray-50 border border-gray-200 border-dashed rounded-3xl">No templates found in database.</div>}
      </div>

      {/* Interview Overlay */}
      <AnimatePresence>
        {activeCandidate && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-8"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-6xl h-[85vh] bg-white border border-gray-200 rounded-3xl shadow-2xl flex overflow-hidden relative"
            >
              {/* Left sidebar info */}
              <div className="w-1/3 bg-gray-50 border-r border-gray-200 p-10 flex flex-col relative overflow-hidden">
                <div className="w-24 h-24 rounded-3xl bg-white flex items-center justify-center font-bold text-4xl text-indigo-600 shadow-sm border border-gray-200 mb-6 relative z-10">
                  {activeCandidate.name.charAt(0)}
                </div>
                <h2 className="text-3xl font-bold text-gray-900 relative z-10 mb-1">{activeCandidate.name}</h2>
                <p className="text-indigo-600 font-bold uppercase tracking-wider text-[10px] mb-8 relative z-10">{activeCandidate.role}</p>

                <div className="space-y-8 relative z-10 flex-1 overflow-y-auto custom-scrollbar pr-2">
                  <div>
                    <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">Interview Progress</h4>
                    <div className="space-y-3">
                      {INTERVIEW_PHASES.map((phase, idx) => (
                        <div key={phase} className={`flex items-center gap-3 text-sm font-semibold ${idx === currentPhaseIndex ? 'text-indigo-600' : idx < currentPhaseIndex ? 'text-emerald-600' : 'text-gray-500'}`}>
                          <div className={`w-2.5 h-2.5 rounded-full ${idx === currentPhaseIndex ? 'bg-indigo-500 animate-pulse ring-4 ring-indigo-100' : idx < currentPhaseIndex ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                          {phase}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Personality</h4>
                    <p className="text-sm font-medium text-gray-600 leading-relaxed">{activeCandidate.personality}</p>
                  </div>
                  <div>
                    <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Strengths</h4>
                    <div className="flex flex-wrap gap-2">
                      {activeCandidate.strengths?.map((s: string) => (
                        <span key={s} className="px-3 py-1.5 bg-white border border-gray-200 shadow-sm rounded-lg text-xs font-bold text-gray-700">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-8 relative z-10 pt-6 border-t border-gray-200">
                  <button onClick={() => handleHire(activeCandidate.id)} disabled={hiring} className="w-full py-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-gray-900 font-bold transition-all shadow-sm">
                    {hiring ? 'Deploying to Workforce...' : 'Make Offer & Hire'}
                  </button>
                </div>
              </div>

              {/* Chat / Interview Area */}
              <div className="flex-1 flex flex-col relative bg-white">
                <div className="h-20 border-b border-gray-100 flex items-center justify-between px-8 bg-white shrink-0">
                  <div className="flex items-center gap-3">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                    </span>
                    <span className="text-sm font-bold text-gray-900 tracking-widest uppercase">
                      Live Interview: {INTERVIEW_PHASES[currentPhaseIndex]}
                    </span>
                  </div>
                  <div className="flex items-center gap-6">
                    {currentPhaseIndex < INTERVIEW_PHASES.length - 1 && (
                      <button onClick={nextPhase} className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition-colors">
                        Next Phase <ChevronRight className="w-4 h-4" />
                      </button>
                    )}
                    <div className="w-px h-6 bg-gray-200" />
                    <button onClick={() => setInterviewing(null)} className="p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-600 rounded-xl transition-colors">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="flex-1 p-8 overflow-y-auto space-y-6 custom-scrollbar bg-gray-50/50">
                  {chatHistory.map((msg, idx) => (
                    <div key={idx} className={`flex gap-4 ${msg.role === 'assistant' ? 'flex-row-reverse' : ''}`}>
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 shadow-sm border ${msg.role === 'assistant' ? 'bg-white text-indigo-600 border-gray-200' : 'bg-gray-900 text-gray-900 border-gray-900'}`}>
                        {msg.role === 'assistant' ? activeCandidate.name.charAt(0) : 'CEO'}
                      </div>
                      <div className={`p-4.5 text-sm font-medium leading-relaxed max-w-[80%] shadow-sm ${msg.role === 'assistant' ? 'bg-white text-gray-700 rounded-2xl rounded-tr-sm border border-gray-200' : 'bg-indigo-50 border border-indigo-100 text-indigo-900 rounded-2xl rounded-tl-sm'}`}>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {isTyping && (
                    <div className="flex gap-4 flex-row-reverse">
                      <div className="w-10 h-10 rounded-2xl bg-white border border-gray-200 flex items-center justify-center font-bold text-sm text-indigo-600 shrink-0 shadow-sm">
                        {activeCandidate.name.charAt(0)}
                      </div>
                      <div className="bg-white border border-gray-200 rounded-2xl rounded-tr-sm p-5 text-sm text-gray-500 flex gap-1.5 items-center shadow-sm">
                        <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                        <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                        <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                <div className="p-8 border-t border-gray-100 bg-white">
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                      placeholder={`Ask ${activeCandidate.name} a question...`}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl py-4 pl-5 pr-32 text-gray-900 font-medium placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-all shadow-inner"
                    />
                    <div className="absolute right-2 flex gap-2">
                      <button className="p-2.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                        <Mic className="w-5 h-5" />
                      </button>
                      <button onClick={sendMessage} className="px-5 py-2.5 text-gray-900 bg-indigo-600 rounded-lg hover:bg-indigo-700 font-bold text-sm transition-colors shadow-sm">
                        Send
                      </button>
                    </div>
                  </div>
                </div>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
