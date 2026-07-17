'use client';

import React, { useEffect, useState } from 'react';
import { Activity, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVoice } from '@/components/providers/VoiceProvider';

export function LivePulseWidget() {
  const [pulse, setPulse] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [hasNewPulse, setHasNewPulse] = useState(false);
  const [lastPulseId, setLastPulseId] = useState<string | null>(null);
  const { voiceState, startCall, simulateAIResponse } = useVoice();

  useEffect(() => {
    const fetchPulse = async () => {
      try {
        const res = await fetch('/api/os/pulse');
        const data = await res.json();
        if (data.success && data.pulse) {
          setPulse(data.pulse);
          if (data.pulse.id !== lastPulseId) {
            if (lastPulseId !== null && !isOpen) {
              setHasNewPulse(true);
            }
            setLastPulseId(data.pulse.id);
          }
          
          // Proactive Call Initiation
          if (data.pulse.urgentCallInitiation && voiceState === 'idle') {
             const { employeeId, employeeName, employeeRole, message } = data.pulse.urgentCallInitiation;
             startCall(employeeId, employeeName, employeeRole);
             setTimeout(() => {
               simulateAIResponse(message);
             }, 1500); // Small delay to simulate connecting
          }
        }
      } catch (e) {
        console.error('Pulse fetch error', e);
      }
    };

    fetchPulse();
    const interval = setInterval(fetchPulse, 10000); // Polling every 10s for the live feel
    return () => clearInterval(interval);
  }, [lastPulseId, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setHasNewPulse(false);
    }
  }, [isOpen]);

  if (!pulse) return null;

  return (
    <>
      {/* Floating Toggle Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 w-12 h-12 rounded-full bg-emerald-600 border border-emerald-400 text-gray-900 shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center justify-center z-40 transition-transform hover:scale-110 ${isOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
      >
        <Activity className="w-5 h-5 animate-pulse" />
        {hasNewPulse && (
          <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 border-2 border-black rounded-full"></span>
        )}
      </motion.button>

      {/* Expanded Widget */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            className="fixed bottom-6 right-6 w-80 bg-white backdrop-blur-xl border border-gray-200 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden"
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white">
              <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                Live Company Pulse
              </h3>
              <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-gray-900">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-4 grid grid-cols-2 gap-2 border-b border-gray-100">
              <div className="bg-white p-3 rounded-xl border border-gray-100">
                <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Active Agents</div>
                <div className="font-bold text-lg text-emerald-400">{pulse.activeEmployees || 0}</div>
              </div>
              <div className="bg-white p-3 rounded-xl border border-gray-100">
                <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Total Tasks</div>
                <div className="font-bold text-lg text-indigo-400">{pulse.tasksCount || 0}</div>
              </div>
            </div>

            <div className="p-4 flex-1 max-h-[300px] overflow-y-auto custom-scrollbar space-y-3 bg-gradient-to-b from-transparent to-black/40">
              <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-2 flex items-center justify-between">
                <span>Autonomous Activity Stream</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              </div>
              
              {pulse.recentActivities?.map((act: any) => (
                <motion.div 
                  key={act.id} 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-xs space-y-1 p-2 bg-white rounded-lg border border-gray-100"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-600">{act.actor}</span>
                    <span className="text-[9px] text-gray-500">{new Date(act.createdAt).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-gray-500 leading-tight">
                    {act.content}
                  </p>
                </motion.div>
              ))}
              
              {!pulse.recentActivities?.length && (
                <p className="text-xs text-gray-500 italic text-center py-4">No recent autonomous activity...</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
