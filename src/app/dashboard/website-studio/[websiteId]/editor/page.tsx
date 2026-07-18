'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Monitor, Tablet, Smartphone, Save, Settings2, Palette, Type, Image as ImageIcon, LayoutTemplate, Undo, Redo, GripVertical, Bot, Send } from 'lucide-react';

export default function AppearanceEditor() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [activeTab, setActiveTab] = useState<'sections' | 'theme'>('sections');
  const [aiInput, setAiInput] = useState('');
  const [chatHistory, setChatHistory] = useState([
    { role: 'assistant', content: 'Hi! I\'m your AI Web Assistant. How can I help you design this page? Try asking me to: \n- Change all buttons to black \n- Add a hero section \n- Switch to a dark theme' }
  ]);
  const [websiteTheme, setWebsiteTheme] = useState<any>(null);

  const params = useParams();
  const websiteId = params.websiteId as string;
  const [loading, setLoading] = useState(true);
  const [sections, setSections] = useState<any[]>([]);

  useEffect(() => {
    fetch(`/api/os/websites/editor?websiteId=${websiteId}`)
      .then(res => res.json())
      .then(data => {
        if (data.website?.theme) {
          setWebsiteTheme(data.website.theme);
        }
        if (data.sections) {
          setSections(data.sections);
        }
        setLoading(false);
      });
  }, [websiteId]);

  const moveSection = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index > 0) {
      const newSections = [...sections];
      const temp = newSections[index];
      newSections[index] = newSections[index - 1];
      newSections[index - 1] = temp;
      setSections(newSections);
    } else if (direction === 'down' && index < sections.length - 1) {
      const newSections = [...sections];
      const temp = newSections[index];
      newSections[index] = newSections[index + 1];
      newSections[index + 1] = temp;
      setSections(newSections);
    }
  };

  const handleSave = async () => {
    try {
      await fetch('/api/os/websites/editor', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ websiteId, sections })
      });
      alert('Saved successfully!');
    } catch (error) {
      console.error(error);
      alert('Failed to save.');
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-100 overflow-hidden">
      {/* Top Bar */}
      <div className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 shrink-0 z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-1.5 hover:bg-gray-100 rounded-md text-gray-500 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-900">Home Page</span>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Draft</span>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
          <button onClick={() => setViewMode('desktop')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'desktop' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            <Monitor className="w-4 h-4" />
          </button>
          <button onClick={() => setViewMode('tablet')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'tablet' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            <Tablet className="w-4 h-4" />
          </button>
          <button onClick={() => setViewMode('mobile')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'mobile' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            <Smartphone className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 border-r border-gray-200 pr-3">
            <button className="p-1.5 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"><Undo className="w-4 h-4" /></button>
            <button className="p-1.5 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"><Redo className="w-4 h-4" /></button>
          </div>
          <button className="text-sm font-semibold text-gray-600 hover:text-gray-900 px-3 py-1.5">Preview</button>
          <button onClick={handleSave} className="flex items-center gap-2 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors">
            <Save className="w-4 h-4" /> Save
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Editor Tools */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full shrink-0 z-10 shadow-lg">
          <div className="flex p-2 gap-2 border-b border-gray-100 bg-gray-50/50">
            <button 
              onClick={() => setActiveTab('sections')}
              className={`flex-1 py-1.5 text-xs font-bold uppercase tracking-widest rounded-md transition-colors ${activeTab === 'sections' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Sections
            </button>
            <button 
              onClick={() => setActiveTab('theme')}
              className={`flex-1 py-1.5 text-xs font-bold uppercase tracking-widest rounded-md transition-colors ${activeTab === 'theme' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Theme Settings
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
            {activeTab === 'sections' ? (
              <div className="space-y-2">
                {sections.map((section, idx) => (
                  <div key={section.id} className="group flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:border-indigo-300 transition-colors cursor-pointer shadow-sm">
                    <div className="flex items-center gap-3">
                      <GripVertical className="w-4 h-4 text-gray-300 group-hover:text-gray-500 cursor-grab" />
                      <span className="text-sm font-semibold text-gray-700">{section.name}</span>
                    </div>
                    <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => moveSection(idx, 'up')} className="p-0.5 hover:bg-gray-100 rounded text-gray-400">↑</button>
                      <button onClick={() => moveSection(idx, 'down')} className="p-0.5 hover:bg-gray-100 rounded text-gray-400">↓</button>
                    </div>
                  </div>
                ))}
                
                <button className="w-full mt-4 py-3 border-2 border-dashed border-gray-200 rounded-lg text-sm font-semibold text-gray-500 flex items-center justify-center gap-2 hover:border-indigo-300 hover:text-indigo-600 transition-colors">
                  <LayoutTemplate className="w-4 h-4" /> Add Section
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <h4 className="text-xs font-bold uppercase text-gray-400 mb-3 flex items-center gap-2"><Palette className="w-4 h-4" /> Colors</h4>
                  <div className="grid grid-cols-5 gap-2">
                    <div className="w-8 h-8 rounded-full bg-indigo-600 border-2 border-white shadow-sm cursor-pointer"></div>
                    <div className="w-8 h-8 rounded-full bg-gray-900 border-2 border-white shadow-sm cursor-pointer"></div>
                    <div className="w-8 h-8 rounded-full bg-emerald-500 border-2 border-white shadow-sm cursor-pointer"></div>
                    <div className="w-8 h-8 rounded-full bg-rose-500 border-2 border-white shadow-sm cursor-pointer"></div>
                    <div className="w-8 h-8 rounded-full bg-sky-500 border-2 border-white shadow-sm cursor-pointer"></div>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase text-gray-400 mb-3 flex items-center gap-2"><Type className="w-4 h-4" /> Typography</h4>
                  <select className="w-full p-2 border border-gray-200 rounded-lg text-sm bg-white mb-2">
                    <option>Inter</option>
                    <option>Roboto</option>
                    <option>Playfair Display</option>
                  </select>
                  <select className="w-full p-2 border border-gray-200 rounded-lg text-sm bg-white">
                    <option>System UI</option>
                    <option>Georgia</option>
                  </select>
                </div>
                
                <div>
                  <h4 className="text-xs font-bold uppercase text-gray-400 mb-3 flex items-center gap-2"><ImageIcon className="w-4 h-4" /> Branding</h4>
                  <button className="w-full py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50">
                    Upload Logo
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Center Canvas */}
        <div className="flex-1 flex justify-center overflow-y-auto custom-scrollbar p-8 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-gray-100">
          <div 
            className={`bg-white shadow-2xl transition-all duration-300 origin-top
              ${viewMode === 'desktop' ? 'w-full max-w-[1200px]' : ''}
              ${viewMode === 'tablet' ? 'w-[768px]' : ''}
              ${viewMode === 'mobile' ? 'w-[375px]' : ''}
            `}
            style={{ minHeight: '1000px' }}
          >
            {/* Visual representation of the sections */}
            <div className="flex flex-col h-full border border-gray-100" style={{ backgroundColor: websiteTheme?.colors?.secondary || '#ffffff', fontFamily: websiteTheme?.typography?.body || 'inherit' }}>
              {sections.map((section, i) => (
                <div 
                  key={section.id} 
                  className="relative flex items-center justify-center group hover:border-indigo-400 cursor-pointer transition-all border-b border-gray-100/10" 
                  style={{ 
                    height: section.type === 'hero' ? '400px' : '200px',
                    backgroundColor: i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.02)'
                  }}
                >
                  <div className="absolute inset-0 border-2 border-transparent group-hover:border-indigo-500 z-10 pointer-events-none transition-colors"></div>
                  <span 
                    className="text-2xl font-bold transition-colors uppercase tracking-widest"
                    style={{ color: websiteTheme?.colors?.primary || '#4f46e5', fontFamily: websiteTheme?.typography?.heading || 'inherit' }}
                  >
                    {section.name} Placeholder
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Sidebar - AI Assistant */}
        <div className="w-80 bg-white border-l border-gray-200 flex flex-col h-full shrink-0 z-10 shadow-lg">
          <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-indigo-600 to-purple-600">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Bot className="w-4 h-4" /> Roxten AI Assistant
            </h3>
            <p className="text-xs text-indigo-100 mt-1">Chat to modify your website.</p>
          </div>
          
          <div className="flex-1 p-4 overflow-y-auto custom-scrollbar flex flex-col gap-4">
            {chatHistory.map((msg, i) => (
              <div key={i} className={`p-3 rounded-lg text-sm w-5/6 ${msg.role === 'assistant' ? 'bg-gray-100 rounded-tl-none text-gray-700' : 'bg-indigo-600 text-white rounded-tr-none ml-auto'}`}>
                {msg.content}
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-gray-100 bg-gray-50">
            <form 
              onSubmit={async (e) => {
                e.preventDefault();
                if (!aiInput.trim()) return;
                
                const userMsg = aiInput;
                setAiInput('');
                setChatHistory(prev => [...prev, { role: 'user', content: userMsg }]);

                const res = await fetch('/api/os/websites/editor/chat', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ 
                    websiteId, 
                    message: userMsg,
                    currentSections: sections,
                    currentTheme: websiteTheme
                  })
                });

                if (res.ok) {
                  const data = await res.json();
                  setChatHistory(prev => [...prev, { role: 'assistant', content: data.aiResponse }]);
                  if (data.updatedSections) setSections(data.updatedSections);
                  if (data.updatedTheme) setWebsiteTheme(data.updatedTheme);
                }
              }}
              className="relative"
            >
              <input 
                type="text" 
                placeholder="Ask AI to make changes..." 
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                className="w-full pl-3 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-sm"
              />
              <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors">
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
