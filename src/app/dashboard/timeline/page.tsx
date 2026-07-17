'use client';

import React, { useState, useEffect } from 'react';
import { Activity, Clock, Zap, BookOpen, Users, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function TimelinePage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/os/timeline')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setEvents(data.data);
        }
        setLoading(false);
      });
  }, []);

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'EMPLOYEE_EVENT': return <Users className="w-5 h-5 text-indigo-400" />;
      case 'KNOWLEDGE_EVENT': return <BookOpen className="w-5 h-5 text-emerald-400" />;
      case 'TASK_EVENT': return <Zap className="w-5 h-5 text-amber-400" />;
      case 'CHANNEL_EVENT': return <Globe className="w-5 h-5 text-blue-400" />;
      default: return <Activity className="w-5 h-5 text-gray-500" />;
    }
  };

  if (loading) {
    return <div className="h-full flex items-center justify-center">Loading Timeline...</div>;
  }

  return (
    <div className="h-full w-full flex flex-col bg-[#FAFAFA] text-gray-900 overflow-hidden relative">
      {/* Background decoration */}
      <div className="absolute top-0 inset-x-0 h-64 bg-gradient-to-b from-white to-transparent pointer-events-none" />
      
      <div className="px-10 pt-10 pb-6 shrink-0 relative z-10 border-b border-gray-200 bg-white0 backdrop-blur-md">
        <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-3 text-gray-900">
          <Activity className="w-6 h-6 text-indigo-600" />
          Timeline
        </h1>
        <p className="text-gray-500 text-sm font-medium">The chronological record of all autonomous business operations.</p>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar relative px-10 pt-8 pb-32">
        <div className="max-w-3xl">
          <div className="absolute top-0 bottom-0 left-[3.25rem] w-px bg-gray-200" />
          
          <div className="space-y-6 relative">
            <AnimatePresence>
              {events.length === 0 ? (
                <div className="text-center p-12 text-gray-500 font-medium">No events recorded yet.</div>
              ) : (
                events.map((event, idx) => (
                  <motion.div 
                    key={event.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(idx * 0.05, 0.5) }}
                    className="flex gap-5 relative group"
                  >
                    <div className="w-10 h-10 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center relative z-10 shrink-0 mt-0.5 group-hover:border-indigo-200 transition-colors">
                      {getEventIcon(event.type)}
                    </div>
                    
                    <div className="flex-1 bg-white border border-gray-200 rounded-2xl p-5 shadow-sm group-hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-1.5">
                        <h3 className="text-sm font-bold text-gray-900">{event.title}</h3>
                        <span className="text-[11px] font-medium text-gray-500 flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-full border border-gray-100">
                          <Clock className="w-3 h-3" />
                          {new Date(event.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </span>
                      </div>
                      {event.description && <p className="text-sm text-gray-600 leading-relaxed">{event.description}</p>}
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
