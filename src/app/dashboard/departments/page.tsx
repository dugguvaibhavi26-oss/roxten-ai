'use client';

import React, { useState, useEffect } from 'react';
import { Briefcase, Users, Layout, Plus, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/os/departments')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setDepartments(data.data);
        }
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-[#FAFAFA]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 font-semibold tracking-widest uppercase text-[10px]">Loading Departments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col p-10 bg-[#FAFAFA] text-gray-900 overflow-hidden">
      <div className="flex justify-between items-end mb-10 shrink-0">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-2 flex items-center gap-3">
            <Briefcase className="w-8 h-8 text-indigo-600" />
            Company Departments
          </h1>
          <p className="text-gray-500 text-base font-medium">Organizational units and their deployed AI workforce.</p>
        </div>
        <button className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-gray-900 rounded-xl transition-colors font-bold shadow-sm">
          <Plus className="w-4 h-4" />
          New Department
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-4 grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8 auto-rows-max">
        <AnimatePresence>
          {departments.length === 0 ? (
            <div className="col-span-full p-16 text-center border border-gray-200 border-dashed rounded-3xl bg-gray-50">
              <Layout className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Departments Founded</h3>
              <p className="text-gray-500 font-medium">Hire employees from the marketplace to establish departments.</p>
            </div>
          ) : (
            departments.map((dept, idx) => (
              <motion.div 
                key={dept.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white border border-gray-200 rounded-3xl p-8 hover:shadow-md hover:border-gray-300 transition-all group flex flex-col"
              >
                <div className="flex justify-between items-start mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                      <Layout className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{dept.name}</h3>
                      <p className="text-sm font-semibold text-gray-500 flex items-center gap-2 mt-1">
                        <Users className="w-4 h-4 text-gray-500" />
                        {dept.employees.length} Active Employees
                      </p>
                    </div>
                  </div>
                  <button className="p-2 hover:bg-gray-100 rounded-xl text-gray-500 hover:text-indigo-600 transition-colors">
                    <Activity className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex-1 mb-8">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-4">Workforce Roster</h4>
                  {dept.employees.length === 0 ? (
                    <p className="text-sm text-gray-500 italic p-4 bg-gray-50 rounded-2xl border border-gray-100 border-dashed text-center">No employees assigned to this department yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {dept.employees.slice(0, 5).map((emp: any) => (
                        <div key={emp.id} className="flex justify-between items-center bg-gray-50 px-4 py-3 rounded-2xl border border-gray-100 group/emp hover:border-gray-200 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-700 font-bold text-sm">
                              {emp.name.charAt(0)}
                            </div>
                            <span className="text-sm text-gray-900 font-bold">{emp.name}</span>
                          </div>
                          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider bg-white border border-gray-200 shadow-sm px-2.5 py-1 rounded-md">{emp.role}</span>
                        </div>
                      ))}
                      {dept.employees.length > 5 && (
                        <div className="text-center text-xs font-bold text-indigo-600 pt-2 hover:text-indigo-700 cursor-pointer">
                          + {dept.employees.length - 5} more employees
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex gap-4 pt-4 border-t border-gray-100 mb-4">
                  <div className="flex-1 text-center">
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Active Tasks</p>
                    <p className="text-xl font-bold text-gray-900">{dept.activeTaskCount || 0}</p>
                  </div>
                  <div className="w-px bg-gray-100"></div>
                  <div className="flex-1 text-center">
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Completed</p>
                    <p className="text-xl font-bold text-gray-900">{dept.completedTaskCount || 0}</p>
                  </div>
                </div>

                <div className="mt-auto flex gap-4 pt-4">
                  <Link href={`/dashboard/workforce/marketplace?department=${encodeURIComponent(dept.name)}`} className="flex-1 py-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-sm font-bold rounded-xl transition-colors text-center border border-indigo-100 shadow-sm">
                    Hire Talent
                  </Link>
                  <Link href={`/dashboard/departments/${dept.id}`} className="flex-1 py-3 bg-white hover:bg-gray-50 text-gray-700 text-sm font-bold rounded-xl transition-colors text-center border border-gray-200 shadow-sm inline-block">
                    View Analytics
                  </Link>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
