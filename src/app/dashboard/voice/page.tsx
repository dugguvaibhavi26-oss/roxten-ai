'use client';

import React, { useState, useEffect } from 'react';
import { Mic, Play, Settings, Save, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function VoiceStudioPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmpId, setSelectedEmpId] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);
  const synthRef = React.useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    fetch('/api/os/workforce/employee')
      .then(res => res.json())
      .then(data => {
        if (data.employees) {
          setEmployees(data.employees);
          if (data.employees.length > 0) {
            handleSelectEmployee(data.employees[0]);
          }
        }
        setLoading(false);
      });
      
    if ('speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }
  }, []);

  const handleSelectEmployee = (emp: any) => {
    setSelectedEmpId(emp.id);
    setFormData({
      voiceId: emp.voiceId || 'kokoro-af_bella',
      gender: emp.gender || 'Female',
      accent: emp.accent || 'American',
      voiceSpeed: emp.voiceSpeed || 1.0,
      voicePitch: emp.voicePitch || 1.0,
      speakingStyle: emp.speakingStyle || emp.personality || 'Professional',
      temperature: emp.temperature || 0.7
    });
  };

  const handlePreview = () => {
    if (!synthRef.current) return;
    synthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(`Hi, I am ${employees.find(e => e.id === selectedEmpId)?.name}. This is my configured voice.`);
    const voices = synthRef.current.getVoices();
    
    const isMale = formData.gender === 'Male';
    const isBritish = formData.accent?.includes('British');
    
    let selectedVoice = voices.find(v => 
      v.lang.includes('en') && 
      (isMale ? (v.name.includes('Male') || v.name.includes('Guy')) : (v.name.includes('Female') || v.name.includes('Girl'))) &&
      (isBritish ? v.lang.includes('GB') : v.lang.includes('US'))
    );
    
    if (!selectedVoice) selectedVoice = voices[0];
    
    utterance.voice = selectedVoice;
    utterance.rate = parseFloat(formData.voiceSpeed) || 1.0;
    utterance.pitch = parseFloat(formData.voicePitch) || 1.0;
    
    synthRef.current.speak(utterance);
  };

  const handleSave = async () => {
    if (!selectedEmpId) return;
    setIsSaving(true);
    
    try {
      await fetch(`/api/os/workforce/employee/${selectedEmpId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      // Update local state
      setEmployees(prev => prev.map(e => e.id === selectedEmpId ? { ...e, ...formData } : e));
    } catch (e) {
      console.error(e);
    }
    setIsSaving(false);
  };

  if (loading) return <div className="h-full flex items-center justify-center bg-[#FAFAFA] text-gray-900">Loading Voice Studio...</div>;

  return (
    <div className="h-full w-full flex bg-[#FAFAFA] text-gray-900 overflow-hidden">
      
      {/* Sidebar: Employees */}
      <div className="w-80 border-r border-gray-100 bg-gray-50 flex flex-col">
        <div className="p-6 border-b border-gray-100 bg-white backdrop-blur-md">
          <h2 className="text-xl font-bold flex items-center gap-2"><Mic className="w-5 h-5 text-fuchsia-500" /> Voice Studio</h2>
          <p className="text-xs text-gray-500 mt-1">Manage employee voice profiles</p>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
          {employees.map(emp => (
            <button
              key={emp.id}
              onClick={() => handleSelectEmployee(emp)}
              className={`w-full text-left p-4 rounded-xl flex items-center gap-3 transition-all border ${
                selectedEmpId === emp.id 
                  ? 'bg-fuchsia-600/20 border-fuchsia-500/50 text-gray-900' 
                  : 'bg-white border-transparent text-gray-500 hover:bg-gray-50'
              }`}
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-xs text-gray-900 shrink-0">
                {emp.name.charAt(0)}
              </div>
              <div className="overflow-hidden">
                <p className="font-bold text-sm truncate">{emp.name}</p>
                <p className="text-[10px] uppercase tracking-wider">{emp.role}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content: Configuration */}
      <div className="flex-1 flex flex-col relative overflow-y-auto custom-scrollbar">
        {selectedEmpId ? (
          <div className="p-10 max-w-3xl mx-auto w-full">
            <div className="flex justify-between items-center mb-10">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-2 flex items-center gap-3">
                  <Settings className="w-7 h-7 text-indigo-400" />
                  Voice Configuration
                </h1>
                <p className="text-gray-500">Configure speech synthesis parameters and AI personality constraints.</p>
              </div>
              <div className="flex gap-4">
                <button onClick={handlePreview} className="px-6 py-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-900 font-medium transition-all flex items-center gap-2">
                  <Play className="w-4 h-4" /> Preview
                </button>
                <button onClick={handleSave} disabled={isSaving} className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-gray-900 font-medium transition-all shadow-[0_0_15px_rgba(99,102,241,0.3)] flex items-center gap-2">
                  <Save className="w-4 h-4" /> {isSaving ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 mb-8">
              {/* Voice Settings */}
              <div className="bg-white border border-gray-200 rounded-3xl p-8 backdrop-blur-md">
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2"><Mic className="w-5 h-5 text-fuchsia-400"/> Synthesis Engine</h3>
                
                <div className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Gender</label>
                    <select 
                      value={formData.gender}
                      onChange={e => setFormData({...formData, gender: e.target.value})}
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="Female">Female</option>
                      <option value="Male">Male</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Accent</label>
                    <select 
                      value={formData.accent}
                      onChange={e => setFormData({...formData, accent: e.target.value})}
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="American">American</option>
                      <option value="British">British</option>
                      <option value="Indian">Indian</option>
                      <option value="Australian">Australian</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 flex justify-between">
                      <span>Speed</span>
                      <span className="text-indigo-400">{formData.voiceSpeed}x</span>
                    </label>
                    <input 
                      type="range" min="0.5" max="2.0" step="0.1" 
                      value={formData.voiceSpeed}
                      onChange={e => setFormData({...formData, voiceSpeed: parseFloat(e.target.value)})}
                      className="w-full accent-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 flex justify-between">
                      <span>Pitch</span>
                      <span className="text-indigo-400">{formData.voicePitch}</span>
                    </label>
                    <input 
                      type="range" min="0.1" max="2.0" step="0.1" 
                      value={formData.voicePitch}
                      onChange={e => setFormData({...formData, voicePitch: parseFloat(e.target.value)})}
                      className="w-full accent-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Personality Settings */}
              <div className="bg-white border border-gray-200 rounded-3xl p-8 backdrop-blur-md">
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2"><Users className="w-5 h-5 text-emerald-400"/> Personality Constraints</h3>
                
                <div className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Speaking Style</label>
                    <textarea 
                      value={formData.speakingStyle}
                      onChange={e => setFormData({...formData, speakingStyle: e.target.value})}
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-emerald-500 min-h-[100px] resize-none"
                      placeholder="e.g. Short, direct, data-driven."
                    />
                    <p className="text-[10px] text-gray-500 mt-1">This directly influences the LLM's prompt response style.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 flex justify-between">
                      <span>LLM Temperature</span>
                      <span className="text-emerald-400">{formData.temperature}</span>
                    </label>
                    <input 
                      type="range" min="0.0" max="1.0" step="0.1" 
                      value={formData.temperature}
                      onChange={e => setFormData({...formData, temperature: parseFloat(e.target.value)})}
                      className="w-full accent-emerald-500"
                    />
                    <p className="text-[10px] text-gray-500 mt-1 flex justify-between">
                      <span>0.0 (Strict / Data)</span>
                      <span>1.0 (Creative / Loose)</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-gray-500">Select an employee to configure their voice.</p>
          </div>
        )}
      </div>
    </div>
  );
}
