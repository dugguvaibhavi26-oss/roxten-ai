'use client';

import React, { useState, useEffect } from 'react';
import { Target, CheckCircle2, Circle, AlertCircle, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function TaskCenterPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/os/tasks');
      const data = await res.json();
      if (data.success) {
        setTasks(data.data);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const updateTaskStatus = async (id: string, status: string) => {
    // Optimistic UI
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t));
    try {
      await fetch('/api/os/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status })
      });
    } catch (e) {
      console.error(e);
    }
  };

  const renderTaskCol = (status: string, title: string) => {
    const colTasks = tasks.filter(t => t.status === status);
    return (
      <div className="flex-1 flex flex-col bg-gray-50/50 rounded-3xl border border-gray-200 overflow-hidden shadow-inner">
        <div className="p-5 border-b border-gray-200 bg-white shadow-sm z-10 flex justify-between items-center">
          <h3 className="font-bold text-gray-900 text-sm tracking-tight flex items-center gap-2 uppercase">
            {title}
          </h3>
          <span className="px-2.5 py-1 rounded-lg bg-gray-100 border border-gray-200 text-gray-600 text-xs font-bold shadow-sm">{colTasks.length}</span>
        </div>
        <div className="flex-1 p-5 overflow-y-auto space-y-4 custom-scrollbar">
          <AnimatePresence>
            {colTasks.map(task => (
              <motion.div 
                key={task.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="p-5 bg-white border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all rounded-2xl flex flex-col group shadow-sm"
              >
                <div className="flex justify-between items-start mb-3">
                  <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold tracking-widest uppercase border shadow-sm ${
                    task.priority === 'HIGH' || task.priority === 'CRITICAL' ? 'bg-rose-50 text-rose-700 border-rose-200' : 
                    task.priority === 'MEDIUM' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}>
                    {task.priority === 'CRITICAL' ? 'High' : task.priority}
                  </span>
                  
                  {/* Status Toggles */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {status === 'PENDING' && (
                      <button onClick={() => updateTaskStatus(task.id, 'IN_PROGRESS')} className="p-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-gray-500 hover:text-indigo-600 shadow-sm transition-colors" title="Start Task">
                        <Clock className="w-4 h-4" />
                      </button>
                    )}
                    {(status === 'PENDING' || status === 'IN_PROGRESS') && (
                      <button onClick={() => updateTaskStatus(task.id, 'COMPLETED')} className="p-1.5 bg-gray-50 hover:bg-emerald-50 border border-gray-200 rounded-lg text-gray-500 hover:text-emerald-600 shadow-sm transition-colors" title="Complete Task">
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                    )}
                    {status !== 'BLOCKED' && status !== 'COMPLETED' && (
                      <button onClick={() => updateTaskStatus(task.id, 'BLOCKED')} className="p-1.5 bg-gray-50 hover:bg-rose-50 border border-gray-200 rounded-lg text-gray-500 hover:text-rose-600 shadow-sm transition-colors" title="Mark Blocked">
                        <AlertCircle className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <h4 className="font-bold text-gray-900 text-sm mb-2 leading-tight">{task.title}</h4>
                {task.description && <p className="text-xs text-gray-500 font-medium line-clamp-3 mb-4 leading-relaxed">{task.description}</p>}
                
                <div className="mt-auto pt-4 border-t border-gray-100 flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-[10px] shadow-sm">
                    {task.employee?.name?.charAt(0) || '?'}
                  </div>
                  <span className="text-xs font-bold text-gray-600">{task.employee?.name || 'Unassigned'}</span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {colTasks.length === 0 && (
            <div className="text-center p-8 text-gray-400 font-medium text-sm italic border border-gray-200 border-dashed rounded-2xl bg-gray-50/50">
              Empty
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-[#FAFAFA]">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-gray-500 font-semibold tracking-widest uppercase text-[10px]">Loading Task Center...</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col p-10 bg-[#FAFAFA] text-gray-900 overflow-hidden">
      <div className="mb-10 pb-6 border-b border-gray-200 shrink-0">
        <h1 className="text-4xl font-bold tracking-tight mb-2 flex items-center gap-3">
          <Target className="w-8 h-8 text-indigo-600" />
          Task Center
        </h1>
        <p className="text-gray-500 text-base font-medium">Centralized mission execution and AI workforce task assignments.</p>
      </div>

      <div className="flex-1 flex gap-8 overflow-hidden max-w-[1600px] w-full">
        {renderTaskCol('PENDING', 'To Do')}
        {renderTaskCol('IN_PROGRESS', 'In Progress')}
        {renderTaskCol('BLOCKED', 'Blocked')}
        {renderTaskCol('COMPLETED', 'Completed')}
      </div>
    </div>
  );
}
