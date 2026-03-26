import React, { useState, useEffect } from 'react';
import { Activity, AlertTriangle, Brain, RefreshCw, ShieldAlert } from 'lucide-react';

interface DeathRecord {
  timestamp: string;
  error: string;
  context: string;
  dnaSignature?: string;
}

interface DeathRegistryPanelProps {
  onAnalyze: () => Promise<string | null>;
  isAnalyzing: boolean;
  analysisResult: string | null;
  records: DeathRecord[];
  onRefresh: () => Promise<void>;
}

export const DeathRegistryPanel: React.FC<DeathRegistryPanelProps> = ({
  onAnalyze,
  isAnalyzing,
  analysisResult,
  records,
  onRefresh
}) => {
  return (
    <div className="space-y-3 bg-black/20 p-3 border border-zinc-900/50 rounded-sm">
      <label className="text-[10px] uppercase tracking-tighter text-zinc-500 flex items-center justify-between gap-1">
        <span className="flex items-center gap-1"><ShieldAlert size={10} /> DEATH REGISTRY (CRITICAL FAILURES)</span>
        <button 
          onClick={onRefresh} 
          className="hover:text-dalek-red transition-colors"
          title="Refresh Registry"
        >
          <RefreshCw size={10} className={isAnalyzing ? 'animate-spin' : ''} />
        </button>
      </label>

      <div className="max-h-40 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
        {records.length === 0 ? (
          <div className="text-[9px] text-zinc-700 italic text-center py-2">No system deaths recorded. The Dalek-Grog is resilient.</div>
        ) : (
          records.map((r, i) => (
            <div key={i} className="border-l-2 border-dalek-red pl-2 py-1 space-y-1 bg-dalek-red/5">
              <div className="flex items-center justify-between">
                <span className="text-[8px] text-zinc-500">{new Date(r.timestamp).toLocaleString()}</span>
                <span className="text-[7px] px-1 rounded-full bg-dalek-red/20 text-dalek-red font-bold uppercase">
                  CRITICAL_FAILURE
                </span>
              </div>
              <div className="text-[9px] text-dalek-red font-mono leading-tight">{r.error}</div>
              <div className="text-[8px] text-zinc-500 italic">Context: {r.context}</div>
            </div>
          ))
        )}
      </div>

      {records.length > 0 && (
        <button 
          onClick={onAnalyze}
          disabled={isAnalyzing}
          className="w-full py-2 bg-dalek-red/10 text-dalek-red border border-dalek-red/30 text-[9px] font-bold hover:bg-dalek-red/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isAnalyzing ? <RefreshCw size={10} className="animate-spin" /> : <Brain size={10} />}
          {isAnalyzing ? 'ANALYZING FAILURES...' : 'ANALYZE DEATH PATTERNS'}
        </button>
      )}

      {analysisResult && (
        <div className="mt-2 p-2 bg-dalek-purple/5 border border-dalek-purple/20 rounded-sm">
          <span className="text-[8px] text-dalek-purple uppercase tracking-widest block mb-1">Failure Analysis Report</span>
          <p className="text-[9px] text-zinc-300 leading-tight whitespace-pre-wrap">{analysisResult}</p>
        </div>
      )}
    </div>
  );
};
