'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, AlertTriangle, ShieldCheck, Activity, CheckCircle, Users } from 'lucide-react';

export function MissionControlPanel() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/os/mission-control');
        const json = await res.json();
        if (json.success) setData(json.data);
      } catch (e) {
        console.error('Mission Control Error', e);
      }
      setLoading(false);
    };

    fetchData();
    const interval = setInterval(fetchData, 15000); // 15s refresh
    return () => clearInterval(interval);
  }, []);

  if (loading || !data) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="h-full w-full flex flex-col gap-8 overflow-y-auto custom-scrollbar p-8"
    >
      <div className="mb-2">
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Today's Focus</h2>
        <p className="text-sm text-gray-500 mt-1">Here is what requires your attention.</p>
      </div>

      {/* Live Mission Status */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
        <h3 className="text-gray-900 font-semibold flex items-center gap-2 mb-4 text-sm">
          <Target className="w-4 h-4 text-indigo-600" />
          Active Missions
        </h3>
        <div className="space-y-3">
          {data.liveMissions.length === 0 ? (
            <p className="text-gray-400 text-sm italic">All missions complete. Ready for new orders.</p>
          ) : (
            data.liveMissions.map((mission: any) => (
              <div key={mission.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex justify-between items-start">
                  <span className="text-gray-900 text-sm font-medium leading-tight">{mission.title}</span>
                  <span className="text-indigo-600 text-[10px] font-bold px-2 py-0.5 bg-indigo-50 rounded-full border border-indigo-100">In Progress</span>
                </div>
                <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                  <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-[8px] font-bold text-gray-600">{mission.employee?.name?.[0] || 'A'}</div>
                  {mission.employee?.name || 'System Agent'}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Blocked Tasks -> Approvals Waiting / Attention Needed */}
      {data.blockedTasks.length > 0 && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-6 shadow-sm">
          <h3 className="text-red-700 font-semibold flex items-center gap-2 mb-4 text-sm">
            <AlertTriangle className="w-4 h-4" />
            Requires Your Attention
          </h3>
          <div className="space-y-3">
            {data.blockedTasks.map((task: any) => (
              <div key={task.id} className="p-3 bg-white rounded-xl border border-red-100 shadow-sm">
                <div className="text-gray-900 text-sm font-medium">{task.title}</div>
                <div className="mt-2 text-xs text-red-600 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Blocked • Review needed
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Recommendations */}
      {data.recommendations.length > 0 && (
        <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-6 shadow-sm">
          <h3 className="text-indigo-900 font-semibold flex items-center gap-2 mb-4 text-sm">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            Strategic Recommendations
          </h3>
          <div className="space-y-3">
            {data.recommendations.slice(0, 3).map((rec: any, idx: number) => {
              const getTypeColor = (type: string) => {
                switch(type) {
                  case 'Risk': return 'bg-rose-100 text-rose-700 border-rose-200';
                  case 'Bottleneck': return 'bg-orange-100 text-orange-700 border-orange-200';
                  case 'Opportunity': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
                  default: return 'bg-indigo-100 text-indigo-700 border-indigo-200';
                }
              };
              return (
                <div key={idx} className="p-3 bg-white rounded-xl border border-indigo-100/50 shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getTypeColor(rec.type)}`}>
                      {rec.type || 'Insight'}
                    </span>
                  </div>
                  <div className="text-gray-900 text-sm font-semibold mb-1">{rec.title}</div>
                  <p className="text-gray-600 text-xs leading-relaxed">{rec.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Advanced Toggle (Progressive Disclosure) */}
      <details className="group mt-4">
        <summary className="text-xs font-semibold text-gray-400 uppercase tracking-widest cursor-pointer hover:text-gray-600 transition-colors flex items-center gap-2 select-none">
          Advanced Diagnostics
          <div className="h-px bg-gray-200 flex-1 ml-2 transition-colors group-hover:bg-gray-300" />
        </summary>
        <div className="mt-4 pt-4 border-t border-gray-100 space-y-6">
          {/* Workload & Department Health (Moved to advanced view to reduce cognitive load on the CEO) */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <h3 className="text-gray-900 font-semibold flex items-center gap-2 mb-4 text-sm">
              <Activity className="w-4 h-4 text-gray-500" />
              Company Health Metrics
            </h3>
            
            <div className="space-y-4">
              <div>
                <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-2">Departments</div>
                {data.departmentHealth.map((dept: any) => (
                  <div key={dept.id} className="flex items-center justify-between mb-2">
                    <span className="text-gray-700 text-xs font-medium">{dept.name}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${dept.healthScore > 70 ? 'bg-emerald-500' : dept.healthScore > 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                          style={{ width: `${dept.healthScore}%` }}
                        />
                      </div>
                      <span className="text-gray-500 text-[10px] w-6 text-right font-medium">{dept.healthScore}%</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-gray-100">
                <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <Users className="w-3 h-3" /> Agent Workload
                </div>
                {data.workload.map((emp: any) => (
                  <div key={emp.id} className="flex justify-between items-center mb-1">
                    <span className="text-gray-700 text-xs font-medium">{emp.name}</span>
                    <span className="text-gray-400 text-[10px] font-medium">{emp.activeTasks} tasks</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </details>

    </motion.div>
  );
}
