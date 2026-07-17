'use client';

import React, { useState } from 'react';
import { useMissionEngine } from '@/components/providers/MissionEngineProvider';
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
  const [input, setInput] = useState('');
  const [isDispatching, setIsDispatching] = useState(false);
  const [processingSteps, setProcessingSteps] = useState<{msg: string, status: 'pending'|'active'|'done'}[]>([]);

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
        
        {/* Mission Control Widgets (Left Sidebar) */}
        <div className="w-[420px] shrink-0 border-r border-gray-200 bg-white h-full relative z-20 shadow-sm">
          <MissionControlPanel />
        </div>

        {/* Dynamic Organization Chart */}
        <div className="flex-1 relative overflow-hidden bg-[#FAFAFA]">
          <div className="absolute inset-0">
            <DynamicOrgChart />
          </div>

          {/* Processing Overlay */}
          <AnimatePresence>
            {isDispatching && processingSteps.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-8 right-8 z-40 bg-white border border-gray-200 rounded-2xl p-5 shadow-xl w-80"
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

          {/* Global Dispatch Input */}
          <div className="w-full px-12 pb-10 pt-8 bg-gradient-to-t from-[#FAFAFA] via-[#FAFAFA]/90 to-transparent absolute bottom-0 left-0 pointer-events-none z-30">
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
    </div>
  );
}
