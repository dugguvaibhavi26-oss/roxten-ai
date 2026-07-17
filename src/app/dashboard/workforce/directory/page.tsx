'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Bot, Briefcase, Activity, Search, Filter } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function WorkforceDirectory() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetch('/api/os/galaxy')
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(e => {
        console.error(e);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#FAFAFA]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 font-semibold tracking-widest uppercase text-[10px]">Loading Directory...</p>
        </div>
      </div>
    );
  }

  const allEmployees = data?.departments?.flatMap((d: any) => d.employees) || [];
  const floaters = data?.employees || [];
  const totalEmployees = [...allEmployees, ...floaters];

  const filteredEmployees = totalEmployees.filter((emp: any) => 
    emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full w-full bg-[#FAFAFA] text-gray-900 overflow-auto pb-24 custom-scrollbar">
      {/* Header */}
      <div className="px-10 pt-10 pb-8 border-b border-gray-200 bg-white shadow-sm">
        <div className="flex items-center gap-3 text-gray-500 text-sm font-bold mb-6">
          <Link href="/dashboard/workforce" className="hover:text-indigo-600 transition-colors">Workforce</Link>
          <span className="text-gray-300">/</span>
          <span className="text-indigo-600">Directory</span>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-4">
          <Users className="w-10 h-10 text-indigo-600" />
          Active Directory
        </h1>
        <p className="text-gray-500 max-w-2xl text-base font-medium">
          Manage your deployed AI workforce, view assignments, and monitor runtime health.
        </p>

        {/* Filters */}
        <div className="flex items-center gap-4 mt-8">
          <div className="relative flex-1 max-w-md">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search by name or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-12 pr-4 py-3 text-gray-900 focus:outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition-all font-medium placeholder-gray-400 shadow-inner"
            />
          </div>
          <button className="flex items-center gap-2 bg-white border border-gray-200 px-6 py-3 rounded-xl hover:bg-gray-50 text-gray-700 font-bold shadow-sm transition-colors">
            <Filter className="w-5 h-5" /> Filter
          </button>
        </div>
      </div>

      <div className="p-10 max-w-[1400px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {filteredEmployees.map((emp: any) => (
            <div 
              key={emp.id} 
              onClick={() => router.push(`/dashboard/workforce/employees/${emp.id}`)}
              className="bg-white border border-gray-200 rounded-3xl p-8 hover:shadow-md hover:border-gray-300 transition-all cursor-pointer group flex flex-col"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center border border-indigo-100 group-hover:bg-indigo-100 transition-colors">
                  <Bot className="w-7 h-7 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-xl">{emp.name}</h3>
                  <p className="text-sm font-semibold text-gray-500 flex items-center gap-2 mt-1">
                    <Briefcase className="w-4 h-4 text-gray-400" /> {emp.role}
                  </p>
                </div>
              </div>
              
              <div className="flex-1 space-y-4 mb-8">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 font-semibold">Department</span>
                  <span className="text-gray-900 font-bold">
                    {data.departments?.find((d: any) => d.id === emp.departmentId)?.name || 'General'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 font-semibold">Workload</span>
                  <span className="text-gray-900 font-bold">
                    {emp.tasks?.filter((t: any) => t.status === 'PENDING' || t.status === 'IN_PROGRESS').length || 0} Active Tasks
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 font-semibold">Permissions</span>
                  <span className="text-gray-900 font-bold">{emp.permissions?.length || 2} Granted</span>
                </div>
              </div>

              <div className="mt-auto pt-6 border-t border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Runtime Active</span>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">v{emp.version}.0</span>
              </div>
            </div>
          ))}

          {filteredEmployees.length === 0 && (
            <div className="col-span-full text-center py-16 bg-gray-50 border border-gray-200 border-dashed rounded-3xl">
              <p className="text-gray-500 font-medium text-lg">No agents found matching your search.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
