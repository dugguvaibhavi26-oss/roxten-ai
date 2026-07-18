'use client';

import React, { useState, useEffect } from 'react';
import { useMissionEngine } from '@/components/providers/MissionEngineProvider';
import { useVoice } from '@/components/providers/VoiceProvider';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Send } from 'lucide-react';
import dynamic from 'next/dynamic';
import { WelcomeScreen } from '@/components/ui/os/WelcomeScreen';
import { MissionControlPanel } from '@/components/ui/os/MissionControlPanel';

const DynamicOrgChart = dynamic(() => import('@/components/ui/os/DynamicOrgChart').then(mod => mod.DynamicOrgChart), {
  ssr: false,
  loading: () => <div className="absolute inset-0 flex items-center justify-center text-gray-900/50">Loading Core Organization...</div>
});

export default function CEODesk() {
  const { dispatchCommand, events, companyState } = useMissionEngine();
  const { startCall, simulateAIResponse } = useVoice();
  const [input, setInput] = useState('');
  const [isDispatching, setIsDispatching] = useState(false);
  const [processingSteps, setProcessingSteps] = useState<{msg: string, status: 'pending'|'active'|'done'}[]>([]);

  // Hook to check for unplayed executive briefing on load
  useEffect(() => {
    const playBriefing = async () => {
      try {
        const { db } = await import('@/lib/firebase');
        const { doc, getDoc, updateDoc } = await import('firebase/firestore');
        
        const businessId = document.cookie.split('; ').find(row => row.startsWith('businessId='))?.split('=')[1];
        if (!businessId) return;

        const docRef = doc(db, 'companies', businessId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.executiveBriefing && data.briefingPlayed === false) {
            console.log('JARVIS BRIEFING:', data.executiveBriefing);
            
            // Mark as played
            await updateDoc(docRef, { briefingPlayed: true });
            
            // Start a voice call with Jarvis and have him speak the briefing
            startCall('jarvis', 'JARVIS', 'Executive AI');
            setTimeout(() => simulateAIResponse(data.executiveBriefing), 1500);
          }
        }
      } catch (e) {
        console.error('Failed to play briefing', e);
      }
    };
    playBriefing();
  }, []);

  const handleDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isDispatching) return;
    
    setIsDispatching(true);
    
    // Simulate complex OS ingestion
    setProcessingSteps([
      { msg: 'Ingesting CEO directive...', status: 'active' }
    ]);
    
    await new Promise(r => setTimeout(r, 600));
    setProcessingSteps(p => [
      { msg: 'Ingesting CEO directive...', status: 'done' },
      { msg: 'Orchestrator parsing intent...', status: 'active' }
    ]);

    await new Promise(r => setTimeout(r, 800));
    setProcessingSteps(p => [
      p[0],
      { msg: 'Orchestrator parsing intent...', status: 'done' },
      { msg: 'Delegating tasks to workforce...', status: 'active' }
    ]);

    await new Promise(r => setTimeout(r, 1000));
    
    await dispatchCommand(input);
    
    setProcessingSteps(p => [
      p[0], p[1],
      { msg: 'Delegating tasks to workforce...', status: 'done' },
      { msg: 'Execution pipeline initialized.', status: 'done' }
    ]);

    // Fetch dynamic response from JARVIS based on user input
    try {
      const res = await fetch('/api/os/brain/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input })
      });
      const data = await res.json();
      
      startCall('jarvis', 'JARVIS', 'Executive AI');
      setTimeout(() => {
        simulateAIResponse(data.reply);
      }, 800);
    } catch (e) {
      console.error('Dispatch voice error:', e);
      startCall('jarvis', 'JARVIS', 'Executive AI');
      setTimeout(() => {
        simulateAIResponse(`Right away, sir. I have processed your input: ${input}`);
      }, 800);
    }

    await new Promise(r => setTimeout(r, 800));
    
    setInput('');
    setIsDispatching(false);
    setProcessingSteps([]);
  };

  return (
    <div className="h-full w-full flex flex-col items-center justify-start relative bg-[#FAFAFA] overflow-hidden">
      
      {/* CEO Arrival Experience (Loads once on mount per session) */}
      <WelcomeScreen />

      {/* Main Workspace */}
      <div className="flex-1 w-full overflow-hidden flex relative">
        
        {/* Full Screen Mission Control */}
        <div className="flex-1 w-full bg-[#FAFAFA] h-full relative z-20 overflow-y-auto custom-scrollbar">
          <MissionControlPanel />
        </div>

        {/* Processing Overlay */}
        <AnimatePresence>
          {isDispatching && processingSteps.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="fixed bottom-28 right-8 z-50 bg-white border border-gray-200 rounded-2xl p-5 shadow-xl w-80"
            >
              <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-3">
                <div className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
                <span className="text-sm font-bold tracking-widest text-gray-900 uppercase">JARVIS Processing</span>
              </div>
              <div className="space-y-3">
                {processingSteps.map((step, i) => (
                  <motion.div 
                    key={i} 
                    initial={{ opacity: 0, x: -5 }} 
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-3"
                  >
                    {step.status === 'done' ? (
                      <div className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                      </div>
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-indigo-200 border-t-indigo-600 animate-spin" />
                    )}
                    <span className={`text-xs font-medium ${step.status === 'done' ? 'text-gray-500' : 'text-gray-900'}`}>{step.msg}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Global Dispatch Input (Fixed at bottom) */}
        <div className="fixed bottom-0 left-20 right-0 px-12 pb-8 pt-8 bg-gradient-to-t from-[#FAFAFA] via-[#FAFAFA]/90 to-transparent pointer-events-none z-40">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto"
          >
            <form onSubmit={handleDispatch} className="relative group pointer-events-auto">
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-100 via-purple-100 to-indigo-100 rounded-3xl blur-md opacity-40 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />
              <div className="relative flex items-center bg-white border border-gray-200 rounded-2xl p-2.5 shadow-lg">
                <button type="button" className="p-3 text-gray-500 hover:text-indigo-600 transition-colors">
                  <Mic className="w-5 h-5" />
                </button>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="What should we execute next?"
                  className="flex-1 bg-transparent text-lg text-gray-900 placeholder-gray-400 font-medium focus:outline-none px-4 py-3 disabled:opacity-50"
                  disabled={isDispatching}
                />
                <button 
                  type="submit"
                  disabled={!input.trim() || isDispatching}
                  className="p-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl transition-all flex items-center gap-2 shadow-sm"
                >
                  <span className="text-sm font-bold pr-1">{isDispatching ? 'Executing' : 'Dispatch'}</span>
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </motion.div>
        </div>

      </div>
    </div>
  );
}
