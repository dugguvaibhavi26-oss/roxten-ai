'use client';

import React, { useState, useEffect } from 'react';
import { FolderOpen, Search, Filter, BookOpen, Database, BrainCircuit, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { KnowledgeUploader } from '@/components/ui/os/KnowledgeUploader';

export default function KnowledgeBasePage() {
  const [knowledge, setKnowledge] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/os/knowledge')
      .then(r => r.json())
      .then(d => {
        if (d.success) setKnowledge(d.data);
        setLoading(false);
      });
  }, []);

  const filteredKnowledge = knowledge.filter(k => 
    k.title.toLowerCase().includes(search.toLowerCase()) || 
    k.content.toLowerCase().includes(search.toLowerCase()) ||
    k.keywords.some((kw: string) => kw.toLowerCase().includes(search.toLowerCase()))
  );

  const getSourceIcon = (sourceType: string) => {
    switch(sourceType) {
      case 'MEETING_ANALYSIS': return <BrainCircuit className="w-5 h-5 text-indigo-600" />;
      case 'MISSION_REPORT': return <Activity className="w-5 h-5 text-rose-600" />;
      case 'DOCUMENT': return <BookOpen className="w-5 h-5 text-emerald-600" />;
      default: return <Database className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div className="h-full w-full flex flex-col p-10 bg-[#FAFAFA] text-gray-900 overflow-hidden">
      <div className="flex justify-between items-end mb-10 shrink-0">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-2 flex items-center gap-3">
            <FolderOpen className="w-8 h-8 text-indigo-600" />
            Institutional Knowledge
          </h1>
          <p className="text-gray-500 text-base font-medium">The autonomous memory and accumulated intelligence of your organization.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search intelligence..." 
              className="bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-all w-72 text-gray-900 placeholder-gray-400 font-medium shadow-sm"
            />
          </div>
          <button className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm">
            <Filter className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-4 space-y-8">
        {/* Manual Ingestion */}
        <div className="max-w-2xl">
          <KnowledgeUploader onComplete={() => window.location.reload()} />
        </div>

        {/* Knowledge Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 auto-rows-max">
        {loading ? (
          <div className="col-span-full p-16 text-center text-gray-500 flex flex-col items-center justify-center">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
            <span className="font-semibold text-xs uppercase tracking-widest">Loading neural pathways...</span>
          </div>
        ) : filteredKnowledge.length === 0 ? (
          <div className="col-span-full p-16 text-center border border-gray-200 border-dashed rounded-3xl bg-gray-50">
            <Database className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Knowledge Found</h3>
            <p className="text-gray-500 font-medium">Your AI workforce hasn't documented any intelligence yet.</p>
          </div>
        ) : (
          <AnimatePresence>
            {filteredKnowledge.map((item, idx) => (
              <motion.div 
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white border border-gray-200 rounded-3xl p-8 hover:shadow-lg hover:border-gray-300 transition-all flex flex-col group cursor-pointer"
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100 group-hover:bg-indigo-50 transition-colors">
                    {getSourceIcon(item.sourceType)}
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-md shadow-sm">
                    {item.sourceType.replace('_', ' ')}
                  </span>
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 leading-tight">{item.title}</h3>
                <p className="text-sm text-gray-600 font-medium line-clamp-4 mb-8 flex-1 leading-relaxed">
                  {item.content}
                </p>
                
                <div className="flex flex-wrap gap-2 mt-auto">
                  {item.keywords.slice(0, 3).map((kw: string) => (
                    <span key={kw} className="px-2.5 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 text-[10px] font-bold uppercase tracking-wider border border-indigo-100 shadow-sm">
                      {kw}
                    </span>
                  ))}
                  {item.keywords.length > 3 && (
                    <span className="px-2.5 py-1.5 rounded-lg bg-gray-50 text-gray-600 text-[10px] font-bold uppercase tracking-wider border border-gray-200 shadow-sm">
                      +{item.keywords.length - 3}
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
        </div>
      </div>
    </div>
  );
}
