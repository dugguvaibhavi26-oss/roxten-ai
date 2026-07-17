'use client';

import React, { useState, useEffect } from 'react';
import { Layout, FileText, Download, TrendingUp, BarChart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/os/reports')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setReports(data.data);
        }
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-[#FAFAFA]">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-gray-500 font-semibold tracking-widest uppercase text-[10px]">Loading Executive Reports...</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col p-10 bg-[#FAFAFA] text-gray-900 overflow-hidden">
      <div className="flex justify-between items-end mb-10 shrink-0">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-2 flex items-center gap-3">
            <Layout className="w-8 h-8 text-indigo-600" />
            Executive Reports
          </h1>
          <p className="text-gray-500 text-base font-medium">AI-generated business insights and automated department analytics.</p>
        </div>
        <button className="flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 rounded-xl transition-all font-bold shadow-sm text-sm">
          <TrendingUp className="w-4 h-4 text-indigo-600" />
          Generate New Report
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 auto-rows-max">
        <AnimatePresence>
          {reports.length === 0 ? (
            <div className="col-span-full p-16 text-center border border-gray-200 border-dashed rounded-3xl bg-gray-50">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Reports Generated</h3>
              <p className="text-gray-500 font-medium">Wait for the AI workforce to generate periodic reports, or trigger one manually.</p>
            </div>
          ) : (
            reports.map((report, idx) => (
              <motion.div 
                key={report.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white border border-gray-200 rounded-3xl p-8 hover:shadow-lg hover:border-gray-300 transition-all flex flex-col group cursor-pointer shadow-sm"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                    <BarChart className="w-6 h-6 text-blue-600" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-md shadow-sm">
                    {report.type.replace('_', ' ')}
                  </span>
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-2">{report.type} Report</h3>
                <p className="text-xs text-gray-500 font-semibold mb-6 flex items-center gap-2">
                  {new Date(report.periodStart).toLocaleDateString()} - {new Date(report.periodEnd).toLocaleDateString()}
                </p>
                
                <p className="text-sm text-gray-600 font-medium line-clamp-4 mb-8 flex-1 leading-relaxed">
                  {report.summary}
                </p>

                <div className="mt-auto flex justify-between items-center pt-5 border-t border-gray-100">
                  <span className="text-xs font-bold text-gray-500 bg-gray-50 px-2.5 py-1 rounded-md border border-gray-100">{report.highlights?.length || 0} Highlights</span>
                  <button className="flex items-center gap-2 text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors uppercase tracking-wider">
                    <Download className="w-3.5 h-3.5" />
                    Download
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
