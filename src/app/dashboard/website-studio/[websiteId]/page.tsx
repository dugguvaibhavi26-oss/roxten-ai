'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Monitor, Settings, Layout, Search, Plus, ExternalLink, BarChart3, Database } from 'lucide-react';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { app } from '@/lib/firebase';

export default function WebsiteDashboard() {
  const router = useRouter();
  const params = useParams();
  const [website, setWebsite] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWebsite = async () => {
      try {
        const db = getFirestore(app);
        const docRef = doc(db, 'websites', params.websiteId as string);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setWebsite({ id: docSnap.id, ...docSnap.data() });
        }
        setLoading(false);
      } catch (e) {
        console.error(e);
        setLoading(false);
      }
    };
    fetchWebsite();
  }, [params.websiteId]);

  if (loading) {
    return <div className="p-8 flex items-center justify-center h-full">Loading Dashboard...</div>;
  }

  if (!website) {
    return <div className="p-8 flex items-center justify-center h-full text-red-500">Website not found.</div>;
  }

  const dashboardConfig = website.metadata?.dashboard || [];

  return (
    <div className="flex h-full bg-gray-50 overflow-hidden">
      {/* Sidebar Configuration */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-full shrink-0">
        <div className="p-6 border-b border-gray-100 flex items-center gap-4">
          <button onClick={() => router.push('/dashboard/website-studio/templates')} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-sm font-extrabold text-gray-900 truncate">{website.name}</h1>
            <div className="text-xs font-medium text-green-500 flex items-center gap-1 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              {website.status}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1">
          <div className="px-3 text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 mt-4">Overview</div>
          <button className="w-full flex items-center gap-3 px-3 py-2 bg-indigo-50 text-indigo-600 rounded-lg font-semibold text-sm transition-colors">
            <Layout className="w-4 h-4" /> Dashboard
          </button>
          <button 
            onClick={() => router.push(`/dashboard/website-studio/${website.id}/editor`)}
            className="w-full flex items-center gap-3 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium text-sm transition-colors"
          >
            <Monitor className="w-4 h-4" /> Appearance Editor
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium text-sm transition-colors">
            <BarChart3 className="w-4 h-4" /> Analytics
          </button>

          <div className="px-3 text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 mt-6">CMS Data</div>
          {dashboardConfig.map((item: string) => (
            <button key={item} className="w-full flex items-center gap-3 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium text-sm transition-colors capitalize">
              <Database className="w-4 h-4" /> {item}
            </button>
          ))}

          <div className="px-3 text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 mt-6">System</div>
          <button className="w-full flex items-center gap-3 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium text-sm transition-colors">
            <Settings className="w-4 h-4" /> Settings
          </button>
        </div>
      </div>

      {/* Main Dashboard Area */}
      <div className="flex-1 flex flex-col items-center bg-gray-50 overflow-y-auto custom-scrollbar p-8">
        <div className="w-full max-w-5xl">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Project Overview</h2>
            <div className="flex items-center gap-3">
              <a href={`https://${website.domain}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:border-gray-300 rounded-xl text-sm font-semibold text-gray-700 shadow-sm transition-colors">
                <ExternalLink className="w-4 h-4" /> View Live
              </a>
              <button 
                onClick={() => router.push(`/dashboard/website-studio/${website.id}/editor`)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-sm font-semibold text-white shadow-sm shadow-indigo-200 transition-colors"
              >
                <Monitor className="w-4 h-4" /> Edit Website
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <div className="text-sm font-medium text-gray-500 mb-1">Total Visitors</div>
              <div className="text-3xl font-extrabold text-gray-900">0</div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <div className="text-sm font-medium text-gray-500 mb-1">Live Pages</div>
              <div className="text-3xl font-extrabold text-gray-900">4</div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <div className="text-sm font-medium text-gray-500 mb-1">CMS Records</div>
              <div className="text-3xl font-extrabold text-gray-900">0</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Recent Activity</h3>
            </div>
            <div className="p-8 text-center text-gray-500">
              No recent activity. Your website is freshly created!
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
