'use client';

import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Pause, Play, Square, RotateCcw, PhoneOff, Settings, Volume2, Send, X, AlertCircle } from 'lucide-react';

export type VoiceState = 'idle' | 'connecting' | 'listening' | 'reviewing' | 'thinking' | 'speaking' | 'paused' | 'interrupted' | 'offline';

interface VoiceContextProps {
  voiceState: VoiceState;
  startCall: (employeeId: string, employeeName: string, employeeRole: string, skipGreeting?: boolean, customEndpoint?: string) => void;
  endCall: () => void;
  isMuted: boolean;
  toggleMute: () => void;
  pauseSpeaking: () => void;
  resumeSpeaking: () => void;
  stopSpeaking: () => void;
  replayLastResponse: () => void;
  volume: number;
  setVolume: (vol: number) => void;
  activeEmployeeId: string | null;
  activeEmployeeName: string | null;
  activeEmployeeRole: string | null;
  handleVoiceInput: (text: string) => Promise<void>;
  simulateAIResponse: (text: string) => void;
  timeElapsed: number;
  history: {role: string, content: string}[];
  transcript: string;
  interimTranscript: string;
  stopListeningAndReview: () => void;
  submitTranscript: (text: string) => void;
  cancelTranscript: () => void;
  speechError: string | null;
}

const VoiceContext = createContext<VoiceContextProps | undefined>(undefined);

export const VoiceProvider = ({ children }: { children: ReactNode }) => {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [handoverTrigger, setHandoverTrigger] = useState(false);
  
  // New States for Transcript Review
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [activeEmployeeId, setActiveEmployeeId] = useState<string | null>(null);
  const [activeEmployeeName, setActiveEmployeeName] = useState<string | null>(null);
  const [activeEmployeeRole, setActiveEmployeeRole] = useState<string | null>(null);
  const [lastResponse, setLastResponse] = useState<string>('');
  const [history, setHistory] = useState<{role: string, content: string}[]>([]);

  const [chatEndpoint, setChatEndpoint] = useState<string | null>(null);
  const [speechError, setSpeechError] = useState<string | null>(null);

  // Refs for stale closures in Web Speech API event listeners
  const voiceStateRef = useRef<VoiceState>('idle');
  const isMutedRef = useRef(false);
  const activeEmployeeIdRef = useRef<string | null>(null);
  const historyRef = useRef<{role: string, content: string}[]>([]);
  const chatEndpointRef = useRef<string | null>(null);

  useEffect(() => {
    voiceStateRef.current = voiceState;
    isMutedRef.current = isMuted;
    activeEmployeeIdRef.current = activeEmployeeId;
    historyRef.current = history;
    chatEndpointRef.current = chatEndpoint;
  }, [voiceState, isMuted, activeEmployeeId, history, chatEndpoint]);

  const synthRef = useRef<SpeechSynthesis | null>(null);
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if ('speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }
    
    // Load persisted volume
    const savedVolume = localStorage.getItem('rox_voice_volume');
    if (savedVolume) setVolume(parseFloat(savedVolume));
    
    // Keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;
      if (e.code === 'Space') {
        e.preventDefault();
        if (voiceState !== 'idle' && !isMuted) {
           startListening();
        }
      }
      if (e.key === 'Escape') stopSpeaking();
      if (e.key === 'm' || e.key === 'M') toggleMute();
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'V' || e.key === 'v')) {
        if (voiceState !== 'idle') endCall();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [voiceState, isMuted]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (voiceState === 'speaking' || voiceState === 'listening') {
      timer = setInterval(() => setTimeElapsed(prev => prev + 1), 1000);
    } else if (voiceState === 'idle') {
      setTimeElapsed(0);
    }
    return () => clearInterval(timer);
  }, [voiceState]);

  const setVolumeAndPersist = (vol: number) => {
    setVolume(vol);
    localStorage.setItem('rox_voice_volume', vol.toString());
  };

  const [handoverQueue, setHandoverQueue] = useState<any>(null);

  useEffect(() => {
    if (handoverTrigger && activeEmployeeId) {
       handleVoiceInput("The CEO just handed you the floor. Go ahead and speak.");
       setHandoverTrigger(false);
    }
  }, [activeEmployeeId, handoverTrigger]);

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.warn("Speech recognition not supported in this browser.");
      return;
    }
    
    // Clear transcripts when starting a fresh listen phase
    if (voiceStateRef.current !== 'reviewing') {
      setTranscript('');
      setInterimTranscript('');
    }

    if (!recognitionRef.current) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';
    }

    recognitionRef.current.onresult = (event: any) => {
      // Don't record while actually reviewing, but allow if it got stuck in thinking/speaking
      if (voiceStateRef.current === 'reviewing') return;
      
      let finalStr = '';
      let interimStr = '';
      
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalStr += event.results[i][0].transcript;
        } else {
          interimStr += event.results[i][0].transcript;
        }
      }
      
      if (finalStr) setTranscript(prev => prev + ' ' + finalStr);
      setInterimTranscript(interimStr);
      
      const currentText = (finalStr || interimStr).trim();
      
      if (currentText) {
        // FULL DUPLEX INTERRUPTION: Instantly cut off AI even on interim results!
        if (activeAudioRef.current && !activeAudioRef.current.paused) {
          activeAudioRef.current.pause();
          activeAudioRef.current.src = "";
          activeAudioRef.current = null;
          setVoiceState('interrupted');
        } else if (synthRef.current && synthRef.current.speaking) {
          synthRef.current.cancel();
          setVoiceState('interrupted');
        }
      }
    };
    
    recognitionRef.current.onerror = (e: any) => {
      console.error('Speech recognition error', e.error);
      
      let errorMsg = e.error;
      if (e.error === 'not-allowed') errorMsg = 'Mic permission denied';
      if (e.error === 'no-speech') errorMsg = 'No speech detected (timeout)';
      if (e.error === 'network') errorMsg = 'Network error';
      if (e.error === 'aborted') errorMsg = null; // intentional abort
      
      if (errorMsg) setSpeechError(errorMsg);

      // Don't auto-restart immediately on error if it's a fatal error like not-allowed
      if (voiceStateRef.current === 'listening' && e.error !== 'not-allowed') {
         setTimeout(() => { if (!isMutedRef.current && voiceStateRef.current === 'listening') startListening(); }, 1500);
      } else if (e.error === 'not-allowed') {
         setVoiceState('idle'); // Stop listening if mic is denied
      }
    };
    
    recognitionRef.current.onstart = () => {
       setSpeechError(null);
    };
    
    recognitionRef.current.onend = () => {
      // If we're in listening state, keep looping. If reviewing, stay stopped.
      if (!isMutedRef.current && voiceStateRef.current === 'listening') {
         try { recognitionRef.current.start(); } catch(e) {}
      }
    };

    if (!isMutedRef.current) {
      try { recognitionRef.current.start(); } catch (e) {}
    }
  };

  const stopListeningAndReview = () => {
    if (recognitionRef.current) recognitionRef.current.stop();
    setVoiceState('reviewing');
  };

  const submitTranscript = () => {
    const finalSentText = (transcript + ' ' + interimTranscript).trim();
    if (!finalSentText) {
       // If empty, just cancel reviewing and go back to listening
       setTranscript('');
       setInterimTranscript('');
       setVoiceState('listening');
       startListening();
       return;
    }
    handleVoiceInput(finalSentText);
  };

  const cancelTranscript = () => {
    setTranscript('');
    setInterimTranscript('');
    setVoiceState('listening');
    startListening();
  };

  const handleVoiceInput = async (text: string) => {
    setVoiceState('thinking');
    
    const currentActiveEmployeeId = activeEmployeeIdRef.current;
    if (!currentActiveEmployeeId) return;

    // Optimistically update history with user input
    setHistory(prev => [...prev, { role: 'user', content: text }]);

    try {
      const endpoint = chatEndpointRef.current || `/api/os/workforce/employee/${currentActiveEmployeeId}/chat`;
      // For the onboarding chat, the payload expects 'messages', whereas the workforce chat expects 'message' and 'history'.
      // We will send both so the endpoint can pick what it needs.
      const payload = {
         message: text,
         history: historyRef.current,
         messages: [...historyRef.current, { role: 'user', content: text }]
      };
      
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        const responseText = data.text || data.reply || '';
        
        setLastResponse(responseText);
        setHistory(prev => [...prev, { role: 'assistant', content: responseText }]);
        setTranscript('');
        setInterimTranscript('');
        
        if (data.handoverEmployee) {
          setHandoverQueue(data.handoverEmployee);
        }

        // Custom event trigger for onboarding flow completion
        if (data.isReady) {
           const event = new CustomEvent('roxten_onboarding_ready');
           window.dispatchEvent(event);
        }
        
        speakText(responseText);
      } else {
        setVoiceState('listening');
      }
    } catch (e) {
      console.error(e);
      setVoiceState('listening');
    }
  };

  const simulateAIResponse = (text: string) => {
      setLastResponse(text);
      setHistory(prev => [...prev, { role: 'assistant', content: text }]);
      speakText(text);
  };

  const speakText = async (text: string) => {
    if (activeAudioRef.current) {
       activeAudioRef.current.pause();
       activeAudioRef.current.src = "";
       activeAudioRef.current = null;
    }
    if (synthRef.current) synthRef.current.cancel();
    
    setVoiceState('speaking');

    // EdgeTTS endpoint is blocked by MS security tokens, use native browser synthesis
    fallbackSpeechSynthesis(text);
  };

  const handleSpeechEnd = () => {
    if (handoverQueue) {
       startCall(handoverQueue.id, handoverQueue.name, handoverQueue.role);
       setHandoverTrigger(true);
       setHandoverQueue(null);
    } else if (voiceStateRef.current !== 'idle' && voiceStateRef.current !== 'paused' && voiceStateRef.current !== 'interrupted') {
      setVoiceState('listening');
      startListening();
    }
  };

  const fallbackSpeechSynthesis = (text: string) => {
    if (!synthRef.current) {
        handleSpeechEnd();
        return;
    }
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.volume = volume;

    const voices = synthRef.current.getVoices();
    if (voices.length > 0) {
      const dbProfile = (window as any)._activeVoiceProfile || {};
      const isFemale = dbProfile.gender === 'Female' || activeEmployeeRole?.toLowerCase().includes('marketing') || activeEmployeeRole?.toLowerCase().includes('hr');
      const isBritish = dbProfile.accent?.includes('British') || activeEmployeeName?.toLowerCase().includes('jarvis');
      const isIndian = dbProfile.accent?.includes('Indian');
      const isAustralian = dbProfile.accent?.includes('Australian');

      const englishVoices = voices.filter(v => v.lang.startsWith('en'));
      const voicePool = englishVoices.length > 0 ? englishVoices : voices;
      
      let selectedVoice = voicePool.find(v => {
        const matchesGender = isFemale ? (v.name.includes('Female') || v.name.includes('Girl')) : (v.name.includes('Male') || v.name.includes('Guy'));
        let matchesAccent = true;
        if (isBritish) matchesAccent = v.lang.includes('GB');
        else if (isIndian) matchesAccent = v.lang.includes('IN');
        else if (isAustralian) matchesAccent = v.lang.includes('AU');
        else matchesAccent = v.lang.includes('US');
        return matchesGender && matchesAccent;
      });

      if (!selectedVoice) {
         selectedVoice = voicePool[0];
      }
      utterance.voice = selectedVoice;
      if (dbProfile.voicePitch) utterance.pitch = parseFloat(dbProfile.voicePitch);
      if (dbProfile.voiceSpeed) utterance.rate = parseFloat(dbProfile.voiceSpeed);
    }
    
    let isHandled = false;
    
    utterance.onstart = () => {
      setVoiceState('speaking');
    };
    
    utterance.onend = () => {
       if (isHandled) return;
       isHandled = true;
       (window as any)._currentUtterance = null;
       handleSpeechEnd();
    };

    utterance.onerror = (e) => {
       console.error("SpeechSynthesis error:", e);
       if (isHandled) return;
       isHandled = true;
       handleSpeechEnd();
    };

    // Safety timeout in case browser speech engine completely fails or blocks without error
    setTimeout(() => {
       if (!isHandled && voiceStateRef.current !== 'paused') {
           console.warn("SpeechSynthesis safety timeout triggered");
           isHandled = true;
           handleSpeechEnd();
       }
    }, Math.max(text.length * 100, 3000)); // Rough estimate based on text length + padding

    (window as any)._currentUtterance = utterance;
    synthRef.current.speak(utterance);
  };

  const startCall = (employeeId: string, employeeName: string, employeeRole: string, skipGreeting: boolean = false, customEndpoint?: string) => {
    setActiveEmployeeId(employeeId);
    setActiveEmployeeName(employeeName);
    setActiveEmployeeRole(employeeRole);
    setChatEndpoint(customEndpoint || null);
    setHistory([]);
    setVoiceState('connecting');

    // Fetch the employee's custom voice profile from DB
    fetch(`/api/os/workforce/employee/${employeeId}`)
      .then(res => res.json())
      .then(data => {
        if (data.employee) {
          // Store voice settings in state or a ref to use in speakText
          (window as any)._activeVoiceProfile = {
            voiceId: data.employee.voiceId,
            gender: data.employee.gender,
            accent: data.employee.accent,
            voiceSpeed: data.employee.voiceSpeed,
            voicePitch: data.employee.voicePitch
          };
        }
      })
      .catch(() => {});

    if (skipGreeting) {
       setVoiceState('thinking');
       return;
    }

    setTimeout(async () => {
      setVoiceState('thinking');
      try {
        const endpoint = customEndpoint || `/api/os/workforce/employee/${employeeId}/chat`;
        const greetingMsg = '[CEO has joined the call. Greet them naturally in 1 short sentence.]';
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: greetingMsg, history: [], messages: [{ role: 'user', content: greetingMsg }] })
        });
        if (res.ok) {
          const data = await res.json();
          const responseText = data.text || data.reply || '';
          setLastResponse(responseText);
          setHistory([{ role: 'assistant', content: responseText }]);
          speakText(responseText);
        } else {
          setVoiceState('listening');
          startListening();
        }
      } catch (e) {
        setVoiceState('listening');
        startListening();
      }
    }, 800);
  };

  const endCall = () => {
    setVoiceState('idle');
    setActiveEmployeeId(null);
    setActiveEmployeeName(null);
    setActiveEmployeeRole(null);
    setHistory([]);
    if (activeAudioRef.current) {
        activeAudioRef.current.pause();
        activeAudioRef.current.src = "";
        activeAudioRef.current = null;
    }
    if (synthRef.current) synthRef.current.cancel();
    if (recognitionRef.current) recognitionRef.current.stop();
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (!isMuted && recognitionRef.current) recognitionRef.current.stop();
    if (isMuted && voiceState !== 'idle') startListening();
  };

  const pauseSpeaking = () => {
    if (activeAudioRef.current && !activeAudioRef.current.paused) {
      activeAudioRef.current.pause();
      setVoiceState('paused');
    } else if (synthRef.current && synthRef.current.speaking) {
      synthRef.current.pause();
      setVoiceState('paused');
    }
  };

  const resumeSpeaking = () => {
    if (activeAudioRef.current && activeAudioRef.current.paused) {
      activeAudioRef.current.play();
      setVoiceState('speaking');
    } else if (synthRef.current && synthRef.current.paused) {
      synthRef.current.resume();
      setVoiceState('speaking');
    }
  };

  const stopSpeaking = () => {
    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
      activeAudioRef.current.src = "";
      activeAudioRef.current = null;
      setVoiceState('interrupted');
      setTimeout(() => setVoiceState('listening'), 500);
    } else if (synthRef.current) {
      synthRef.current.cancel();
      setVoiceState('interrupted');
      setTimeout(() => setVoiceState('listening'), 500);
    }
  };

  const replayLastResponse = () => {
    if (lastResponse) {
      speakText(lastResponse);
    }
  };

  return (
    <VoiceContext.Provider value={{
      voiceState, startCall, endCall, isMuted, toggleMute, 
      pauseSpeaking, resumeSpeaking, stopSpeaking, replayLastResponse,
      volume, setVolume, activeEmployeeId, activeEmployeeName, activeEmployeeRole, handleVoiceInput, simulateAIResponse,
      timeElapsed, history,
      transcript, interimTranscript, stopListeningAndReview, submitTranscript, cancelTranscript, speechError
    }}>
      {children}
      <VoiceControlBar />
    </VoiceContext.Provider>
  );
};

export const useVoice = () => {
  const context = useContext(VoiceContext);
  if (context === undefined) throw new Error('useVoice must be used within a VoiceProvider');
  return context;
};

// Global Floating Control Bar
const VoiceControlBar = () => {
  const { 
    voiceState, endCall, isMuted, toggleMute, pauseSpeaking, 
    resumeSpeaking, stopSpeaking, replayLastResponse, volume, setVolume,
    activeEmployeeName, activeEmployeeRole, timeElapsed,
    transcript, interimTranscript, stopListeningAndReview, submitTranscript, cancelTranscript, speechError
  } = useVoice();

  if (voiceState === 'idle') return null;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[9999] flex flex-col items-center gap-4"
      >
        {/* Status Indicator */}
        <div className="px-6 py-2 rounded-full bg-white backdrop-blur-xl border border-gray-200 flex items-center gap-3 shadow-2xl">
           <div className="flex items-center gap-2">
             {voiceState === 'speaking' ? (
                <div className="flex items-center gap-0.5 h-4 w-6">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <motion.div
                      key={i}
                      animate={{ height: ['20%', '100%', '20%'] }}
                      transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                      className="w-1 bg-emerald-400 rounded-full"
                    />
                  ))}
                </div>
             ) : (
                <span className="relative flex h-2.5 w-2.5">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${voiceState === 'listening' ? 'bg-indigo-400' : voiceState === 'thinking' ? 'bg-purple-400' : 'bg-red-400'}`}></span>
                  <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${voiceState === 'listening' ? 'bg-indigo-500' : voiceState === 'thinking' ? 'bg-purple-500' : 'bg-red-500'}`}></span>
                </span>
             )}
             <span className="text-xs font-bold text-gray-900 uppercase tracking-widest min-w-[100px] flex items-center gap-2">
               {voiceState === 'speaking' && "AI Speaking"}
               {voiceState === 'listening' && "Listening..."}
               {voiceState === 'thinking' && "Thinking..."}
               {voiceState === 'paused' && "Paused"}
               {voiceState === 'interrupted' && "Interrupted"}
               {voiceState === 'connecting' && "Connecting..."}
               <span className="text-[10px] text-gray-500 ml-1 font-mono">{formatTime(timeElapsed)}</span>
             </span>
           </div>
           
           <div className="w-px h-4 bg-gray-50 mx-2" />
           
           <div className="flex flex-col">
             <span className="text-xs font-bold text-gray-900">{activeEmployeeName || 'JARVIS'}</span>
             <span className="text-[10px] text-gray-500">{activeEmployeeRole || 'System Intelligence'}</span>
           </div>
        </div>

        {/* Transcript Review UI */}
        {voiceState === 'reviewing' && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-6 rounded-3xl bg-white backdrop-blur-2xl border border-gray-200 shadow-2xl flex flex-col gap-4 max-w-md w-full"
          >
            <div className="flex justify-between items-center w-full">
              <div className="text-sm font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                <Mic className="w-4 h-4" /> Transcript Preview
              </div>
              <button 
                onClick={endCall}
                className="text-gray-400 hover:text-gray-700 transition-colors p-1 rounded-lg hover:bg-gray-100"
                title="End Call"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl max-h-40 overflow-y-auto text-gray-800 text-lg leading-relaxed">
              {(transcript + ' ' + interimTranscript).trim() || <span className="italic text-gray-400">No speech detected...</span>}
            </div>
            <div className="flex items-center gap-3 w-full">
              <button 
                onClick={cancelTranscript}
                className="flex-1 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold transition-all text-sm"
              >
                Cancel & Retake
              </button>
              <button 
                onClick={() => submitTranscript((transcript + ' ' + interimTranscript).trim())}
                disabled={!(transcript + ' ' + interimTranscript).trim()}
                className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold transition-all shadow-[0_0_15px_rgba(99,102,241,0.4)] text-sm flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" /> Submit
              </button>
            </div>
          </motion.div>
        )}

        {/* Controls */}
        {voiceState !== 'reviewing' && (
          <div className="p-2 rounded-2xl bg-white backdrop-blur-2xl border border-gray-200 flex items-center gap-2 shadow-2xl">
            {speechError && (
               <div className="px-4 py-2 bg-red-50 text-red-600 rounded-xl text-xs font-bold flex items-center gap-2 mr-2">
                 <AlertCircle className="w-4 h-4" /> {speechError}
               </div>
            )}
            
            {voiceState === 'listening' ? (
              <button 
                onClick={stopListeningAndReview}
                className="px-6 py-4 rounded-xl bg-indigo-100 hover:bg-indigo-200 text-indigo-700 transition-all font-bold text-sm flex items-center gap-2"
                title="Stop Recording"
              >
                <Square className="w-4 h-4" /> Stop Recording
              </button>
            ) : (
              <button 
                onClick={toggleMute}
                className={`p-4 rounded-xl transition-all ${isMuted ? 'bg-red-500/20 text-red-500' : 'hover:bg-gray-50 text-gray-900'}`}
                title="Mute / Unmute (M)"
              >
                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
            )}
            
            <div className="w-px h-8 bg-gray-50 mx-1" />

            {voiceState === 'speaking' ? (
              <button onClick={pauseSpeaking} className="p-4 rounded-xl hover:bg-gray-50 text-gray-900 transition-all" title="Pause">
                <Pause className="w-5 h-5" />
              </button>
            ) : voiceState === 'paused' ? (
              <button onClick={resumeSpeaking} className="p-4 rounded-xl hover:bg-gray-50 text-gray-900 transition-all" title="Resume">
                <Play className="w-5 h-5" />
              </button>
            ) : null}

            <button onClick={stopSpeaking} className="p-4 rounded-xl hover:bg-gray-50 text-gray-900 transition-all" title="Stop Speaking Instantly (Esc)">
              <Square className="w-5 h-5" />
            </button>
            
            <button onClick={replayLastResponse} className="p-4 rounded-xl hover:bg-gray-50 text-gray-900 transition-all" title="Replay Last Response">
              <RotateCcw className="w-5 h-5" />
            </button>

            <div className="w-px h-8 bg-gray-50 mx-1" />

            <button onClick={endCall} className="px-6 py-4 rounded-xl bg-red-600 hover:bg-red-700 text-white transition-all shadow-[0_0_15px_rgba(220,38,38,0.4)] flex items-center gap-2 font-bold text-sm">
              <PhoneOff className="w-4 h-4" /> End Call
            </button>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
