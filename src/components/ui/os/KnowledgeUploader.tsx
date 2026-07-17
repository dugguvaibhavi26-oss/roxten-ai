'use client';

import React, { useState } from 'react';
import { UploadCloud, CheckCircle2, FileText, Loader2 } from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';

export function KnowledgeUploader({ onComplete }: { onComplete?: () => void }) {
  const { user } = useAuth();
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<string>('');
  
  const businessId = typeof document !== 'undefined' 
      ? document.cookie.split('; ').find(row => row.startsWith('businessId='))?.split('=')[1]
      : null;

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    setFiles(prev => [...prev, ...droppedFiles]);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (!businessId || files.length === 0) return;
    
    setIsProcessing(true);
    setStatus('Extracting text from documents...');
    
    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('path', `companies/${businessId}/knowledge/${file.name}`);

        const uploadRes = await fetch('/api/os/storage/upload', {
          method: 'POST',
          body: formData
        });

        if (!uploadRes.ok) throw new Error('File upload failed');
        const { url, text } = await uploadRes.json();
        
        setStatus(`Analyzing ${file.name}...`);
        
        const ingestRes = await fetch('/api/os/knowledge/ingest', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({
              businessId,
              text,
              sourceUrl: url,
              sourceTitle: file.name
           })
        });

        if (!ingestRes.ok) {
           const errText = await ingestRes.text();
           let errMsg = errText;
           try {
             const json = JSON.parse(errText);
             errMsg = json.error || errText;
           } catch(e) {}
           throw new Error(`Failed to ingest ${file.name}: ${errMsg}`);
        }
      }
      
      setStatus('Complete!');
      setTimeout(() => {
         setFiles([]);
         setStatus('');
         setIsProcessing(false);
         if (onComplete) onComplete();
      }, 2000);

    } catch (e: any) {
      console.error(e);
      setStatus(`Error: ${e.message || 'Upload failed. Please try again.'}`);
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
        <UploadCloud className="w-5 h-5 text-indigo-600" /> Upload Knowledge
      </h3>
      
      <div 
        onDragOver={e => e.preventDefault()} 
        onDrop={handleFileDrop}
        className="w-full rounded-2xl border-2 border-dashed border-gray-300 hover:border-indigo-400 hover:bg-indigo-50 transition-all flex flex-col items-center justify-center p-8 bg-gray-50/50 group cursor-pointer relative"
      >
        <input 
          type="file" 
          multiple 
          onChange={(e) => {
            if (e.target.files) {
              setFiles(prev => [...prev, ...Array.from(e.target.files as FileList)]);
            }
          }}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isProcessing}
        />
        <UploadCloud className="w-10 h-10 text-gray-400 group-hover:text-indigo-500 mb-3 transition-colors" />
        <p className="text-gray-900 font-bold mb-1 group-hover:text-indigo-700">Drag & Drop Documents Here</p>
        <p className="text-gray-500 text-xs text-center font-medium">PDF, DOCX, TXT, CSV<br/>(AI will extract and ingest knowledge)</p>
      </div>

      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          {files.map((f, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 text-sm">
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 text-indigo-500" />
                <span className="font-semibold text-gray-700 truncate max-w-[200px]">{f.name}</span>
                <span className="text-gray-400 text-xs">{(f.size / 1024 / 1024).toFixed(1)}MB</span>
              </div>
              {!isProcessing && (
                 <button onClick={() => removeFile(i)} className="text-red-400 hover:text-red-600 font-bold px-2">×</button>
              )}
            </div>
          ))}
          
          <button 
            onClick={handleUpload}
            disabled={isProcessing}
            className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-[0_0_15px_rgba(99,102,241,0.3)] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> {status || 'Processing...'}
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" /> Ingest Knowledge
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
