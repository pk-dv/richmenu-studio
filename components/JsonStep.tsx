
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";

interface JsonStepProps {
  json: string;
  onJsonChange: (val: string) => void;
  onNext: () => void;
  onBack: () => void;
  isValid: boolean;
}

const JsonStep: React.FC<JsonStepProps> = ({ json, onJsonChange, onNext, onBack, isValid }) => {
  const [isFixing, setIsFixing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  // Sync scroll between line numbers and textarea
  const handleScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  // Local validation to get precise error message and line number extraction
  const validation = useMemo(() => {
    try {
      JSON.parse(json);
      return { valid: true, error: null, line: null };
    } catch (e: any) {
      // Attempt to extract line number from "at line X column Y" format
      const lineMatch = e.message.match(/line (\d+)/i);
      const lineNumber = lineMatch ? parseInt(lineMatch[1], 10) : null;
      return { valid: false, error: e.message, line: lineNumber };
    }
  }, [json]);

  const lineCount = useMemo(() => json.split('\n').length, [json]);

  const fixWithAI = async () => {
    if (!process.env.API_KEY) {
      alert("API Key not found.");
      return;
    }
    setIsFixing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `You are a LINE Messaging API expert. The user provided a broken JSON for a Rich Menu. 
        Fix the JSON structure while maintaining the values. Return ONLY the raw fixed JSON string, no markdown.
        
        Broken JSON:
        ${json}`,
        config: {
          responseMimeType: "application/json"
        }
      });
      if (response.text) {
        onJsonChange(response.text.trim());
      }
    } catch (error) {
      console.error("AI Error:", error);
    } finally {
      setIsFixing(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Rich Menu Layout</h2>
          <p className="text-slate-500 text-sm">Design your tap areas with standard JSON.</p>
        </div>
        <button 
          onClick={fixWithAI}
          disabled={isFixing}
          className="group relative flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#06C755] to-[#05b14c] text-white rounded-xl font-bold text-xs shadow-lg shadow-[#06C755]/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
        >
          {isFixing ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          )}
          <span>Auto-Fix JSON</span>
        </button>
      </div> */}

      <div className="relative group">
        <div className={`absolute -inset-1 bg-gradient-to-r ${!validation.valid ? 'from-red-500 to-orange-500' : 'from-slate-200 to-slate-300'} rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200`}></div>
        
        <div className="relative flex bg-slate-900 rounded-2xl overflow-hidden border-2 border-slate-800 shadow-2xl h-[450px]">
          {/* Line Numbers Column */}
          <div 
            ref={lineNumbersRef}
            className="w-12 bg-slate-950/50 text-slate-600 font-mono text-[13px] text-right pr-3 py-6 select-none overflow-hidden"
            style={{ lineHeight: '1.5rem' }}
          >
            {Array.from({ length: Math.max(lineCount, 1) }).map((_, i) => (
              <div key={i} className={validation.line === i + 1 ? 'text-red-500 font-bold bg-red-500/10' : ''}>
                {i + 1}
              </div>
            ))}
          </div>

          {/* Code Area */}
          <textarea 
            ref={textareaRef}
            onScroll={handleScroll}
            value={json}
            onChange={(e) => onJsonChange(e.target.value)}
            className={`flex-1 p-6 font-mono text-[13px] bg-transparent text-slate-100 outline-none transition-all resize-none ${
              validation.valid ? 'text-green-400/90' : 'text-slate-100'
            }`}
            style={{ lineHeight: '1.5rem', whiteSpace: 'pre', overflowWrap: 'unset' }}
            spellCheck={false}
            placeholder='{ "size": { "width": 2500, "height": 1686 }, ... }'
          />
          
          {/* Error Message Tooltip */}
          {!validation.valid && (
            <div className="absolute bottom-6 left-16 right-6 bg-red-500/95 text-white p-3 rounded-xl shadow-2xl animate-scaleUp flex items-center gap-3 border border-red-400/50 backdrop-blur-sm">
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] uppercase font-black tracking-widest opacity-80 mb-0.5">
                  Error {validation.line ? `at Line ${validation.line}` : ''}
                </p>
                <p className="text-xs font-medium truncate">{validation.error}</p>
              </div>
              {/* <button 
                onClick={fixWithAI}
                className="shrink-0 bg-white/20 hover:bg-white/30 px-2 py-1 rounded text-[10px] font-bold transition-colors"
              >
                Fix
              </button> */}
            </div>
          )}
          
          {validation.valid && (
            <div className="absolute bottom-6 right-6 bg-[#06C755] text-white px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center gap-2">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
              </svg>
              JSON Verified
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-4 pt-4">
        <button 
          onClick={onBack}
          className="flex-1 py-5 bg-white border-2 border-slate-100 text-slate-500 rounded-2xl font-bold hover:bg-slate-50 hover:border-slate-200 transition-all active:scale-95"
        >
          Back
        </button>
        <button 
          onClick={onNext}
          disabled={!validation.valid}
          className={`flex-[2] py-5 rounded-2xl font-black text-lg transition-all shadow-2xl flex items-center justify-center gap-3 active:scale-95 ${
            validation.valid 
              ? 'bg-[#06C755] text-white hover:bg-[#05b14c] hover:-translate-y-1 shadow-[#06C755]/30' 
              : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
          }`}
        >
          <span>Continue to Asset</span>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default JsonStep;
