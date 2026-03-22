import React from 'react';
import { Shield, Database, Trash2, Zap, Bug, Sparkles, Copy, FileCode, Upload, RefreshCw } from 'lucide-react';
import { Mistake } from '../types';

interface ManualControlPanelProps {
  externalDnaRepo: string;
  setExternalDnaRepo: (repo: string) => void;
  isRunning: boolean;
  isAnalyzingDNA: boolean;
  siphonExternalDNA: () => Promise<void>;
  handleDNAUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setSiphonedRepos: (repos: string[]) => void;
  pruneRedundantMetadata: () => Promise<void>;
  isPruning: boolean;
  mistakes: Mistake[];
  setMistakes: (mistakes: Mistake[]) => void;
  showMistakeLedger: boolean;
  setShowMistakeLedger: (show: boolean) => void;
  siphonedRepos: string[];
  // Manual Evolution Props
  handleManualUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  runManualEnhancement: (contentOverride?: string, fileNameOverride?: string, autoPush?: boolean) => Promise<void>;
  manualFileName: string;
  manualFileContent: string;
  manualEnhancedCode: string | null;
  isEnhancingManual: boolean;
  pushToRepo: (path: string, content: string, message: string) => Promise<void>;
  addLog: (msg: string, color?: string) => void;
  dnaSignature: string;
  saturationGuidelines: string;
  strategicLedger: any[];
}

export const ManualControlPanel: React.FC<ManualControlPanelProps> = ({
  externalDnaRepo,
  setExternalDnaRepo,
  isRunning,
  isAnalyzingDNA,
  siphonExternalDNA,
  handleDNAUpload,
  setSiphonedRepos,
  pruneRedundantMetadata,
  isPruning,
  mistakes,
  setMistakes,
  showMistakeLedger,
  setShowMistakeLedger,
  siphonedRepos,
  handleManualUpload,
  runManualEnhancement,
  manualFileName,
  manualFileContent,
  manualEnhancedCode,
  isEnhancingManual,
  pushToRepo,
  addLog,
  dnaSignature,
  saturationGuidelines,
  strategicLedger
}) => {
  return (
    <div className="space-y-3 bg-black/20 p-3 border border-zinc-900/50 rounded-sm animate-in fade-in slide-in-from-top-2">
      <div className="flex items-center justify-between mb-2">
        <label className="text-[10px] uppercase tracking-tighter text-zinc-500 flex items-center gap-1">
          <Shield size={10} /> MANUAL OVERRIDE & DNA SIPHON
        </label>
        <button 
          onClick={() => setShowMistakeLedger(!showMistakeLedger)}
          className={`hover:text-dalek-red transition-colors ${showMistakeLedger ? 'text-dalek-red' : 'text-zinc-600'} relative`}
          title="Mistake Ledger"
        >
          <Bug size={10} />
          {mistakes.some(m => !m.attemptedFix) && (
            <span className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-dalek-red rounded-full animate-ping" />
          )}
        </button>
      </div>

      {showMistakeLedger && (
        <div className="bg-dalek-red/5 border border-dalek-red/20 p-2 rounded-sm space-y-2 mb-3">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-bold text-dalek-red flex items-center gap-1">
              <Bug size={10} /> MISTAKE LEDGER
            </span>
            <button onClick={() => setMistakes([])} className="text-[8px] text-zinc-600 hover:text-dalek-red">CLEAR ALL</button>
          </div>
          <div className="max-h-40 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {mistakes.length === 0 ? (
              <div className="text-[9px] text-zinc-700 italic text-center py-2">No mistakes recorded.</div>
            ) : (
              mistakes.map(m => (
                <div key={m.id} className="border-l-2 border-dalek-red pl-2 py-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[8px] text-zinc-500">{m.timestamp}</span>
                    <span className={`text-[7px] px-1 rounded-full ${m.attemptedFix ? 'bg-dalek-green/20 text-dalek-green' : 'bg-dalek-gold/20 text-dalek-gold'}`}>
                      {m.attemptedFix ? 'FIXED' : 'PENDING'}
                    </span>
                  </div>
                  <div className="text-[9px] text-dalek-red font-mono leading-tight truncate">{m.error}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <div className="space-y-3 pt-2 border-t border-zinc-900/50">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] uppercase tracking-tighter text-zinc-600">Manual Siphon</label>
          <div className="flex gap-2">
            <input 
              type="text" 
              className="dalek-input flex-1 text-[11px]" 
              placeholder="user/repository" 
              value={externalDnaRepo}
              onChange={(e) => setExternalDnaRepo(e.target.value)}
              disabled={isRunning || isAnalyzingDNA}
            />
            <button 
              onClick={siphonExternalDNA}
              disabled={isRunning || isAnalyzingDNA}
              className={`dalek-btn px-4 text-[10px] ${isAnalyzingDNA ? 'animate-pulse text-dalek-gold' : ''}`}
            >
              {isAnalyzingDNA ? '...' : 'SIPHON'}
            </button>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] uppercase tracking-tighter text-zinc-600 flex items-center justify-between">
            <span>Manual DNA Upload</span>
            <button onClick={() => setSiphonedRepos([])} className="text-dalek-red hover:underline text-[8px]">PURGE ALL</button>
          </label>
          <input 
            type="file" 
            className="hidden" 
            id="dna-upload-manual"
            onChange={handleDNAUpload}
            disabled={isAnalyzingDNA || isRunning}
          />
          <label 
            htmlFor="dna-upload-manual"
            className={`dalek-input block text-center cursor-pointer transition-all text-[10px] py-1.5 ${isAnalyzingDNA ? 'animate-pulse border-dalek-gold text-dalek-gold' : 'hover:border-dalek-cyan'}`}
          >
            {isAnalyzingDNA ? 'ANALYZING...' : 'UPLOAD FILE'}
          </label>
        </div>

        <div className="flex flex-wrap gap-1 mt-2">
          {siphonedRepos.map(repo => (
            <div key={repo} className="px-2 py-0.5 bg-dalek-cyan/10 border border-dalek-cyan/30 rounded-full text-[8px] text-dalek-cyan flex items-center gap-1">
              <Zap size={8} /> {repo}
            </div>
          ))}
        </div>

        <div className="pt-2 border-t border-zinc-900/50 space-y-3">
          <label className="text-[10px] uppercase tracking-tighter text-zinc-600 flex items-center gap-1">
            <Sparkles size={10} /> Manual Evolution
          </label>
          
          <div className="space-y-2">
            <input 
              type="file" 
              className="hidden" 
              id="manual-file-upload"
              onChange={handleManualUpload}
              disabled={isRunning || isEnhancingManual}
            />
            <label 
              htmlFor="manual-file-upload"
              className={`dalek-input block text-center cursor-pointer transition-all text-[10px] py-1.5 ${isEnhancingManual ? 'opacity-50' : 'hover:border-dalek-cyan'}`}
            >
              {manualFileName ? `FILE: ${manualFileName} ✓` : 'UPLOAD FILE FOR EVOLUTION'}
            </label>

            {manualFileName && manualFileContent && (
              <div className="bg-black/40 border border-zinc-900 p-2 rounded-sm space-y-2 animate-in fade-in slide-in-from-top-1">
                <div className="flex items-center justify-between">
                  <span className="text-[8px] text-zinc-500 uppercase tracking-widest">File Statistics</span>
                  <span className="text-[8px] text-dalek-cyan">{manualFileContent.length} chars</span>
                </div>
                <div className="grid grid-cols-2 gap-1">
                  <div className="text-[7px] text-zinc-600">Lines: {manualFileContent.split('\n').length}</div>
                  <div className="text-[7px] text-zinc-600">Words: {manualFileContent.split(/\s+/).length}</div>
                </div>
                
                <div className="pt-1 border-t border-zinc-900/50 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[7px] text-zinc-500 uppercase tracking-tighter">Siphoned DNA</span>
                    <span className={`text-[7px] font-bold ${dnaSignature ? 'text-dalek-cyan' : 'text-zinc-700'}`}>
                      {dnaSignature ? 'ACTIVE' : 'NONE'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[7px] text-zinc-500 uppercase tracking-tighter">Saturation Guidelines</span>
                    <span className={`text-[7px] font-bold ${saturationGuidelines ? 'text-dalek-gold' : 'text-zinc-700'}`}>
                      {saturationGuidelines ? 'LOADED' : 'NONE'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[7px] text-zinc-500 uppercase tracking-tighter">Strategic Ledger</span>
                    <span className={`text-[7px] font-bold ${strategicLedger.length > 0 ? 'text-dalek-red' : 'text-zinc-700'}`}>
                      {strategicLedger.length} INSIGHTS
                    </span>
                  </div>
                </div>
              </div>
            )}

            {manualFileName && (
              <button 
                onClick={() => runManualEnhancement()}
                disabled={isRunning || isEnhancingManual}
                className={`w-full dalek-btn py-2 text-[10px] flex items-center justify-center gap-2 bg-dalek-purple/10 text-dalek-purple border-dalek-purple/30 hover:bg-dalek-purple/20 ${isEnhancingManual ? 'animate-pulse' : ''}`}
              >
                {isEnhancingManual ? <RefreshCw size={12} className="animate-spin" /> : <Zap size={12} />}
                {isEnhancingManual ? 'EVOLVING...' : 'INITIATE ENHANCEMENT'}
              </button>
            )}

            {manualEnhancedCode && (
              <div className="space-y-2 pt-2 border-t border-zinc-900/30 animate-in fade-in slide-in-from-bottom-2">
                <div className="flex items-center justify-between">
                  <span className="text-[8px] text-dalek-green uppercase tracking-widest flex items-center gap-1">
                    <Zap size={8} /> Enhanced Output Ready
                  </span>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(manualEnhancedCode);
                      addLog("ENHANCED CODE COPIED TO CLIPBOARD.", "var(--color-dalek-green)");
                    }}
                    className="text-[8px] text-zinc-600 hover:text-dalek-cyan flex items-center gap-1"
                  >
                    <Copy size={10} /> COPY
                  </button>
                </div>
                <button 
                  onClick={() => pushToRepo(manualFileName, manualEnhancedCode, `NEXUS_CORE: Manual Evolution of ${manualFileName}`)}
                  className="w-full py-2 bg-dalek-green/10 text-dalek-green border border-dalek-green/30 text-[9px] font-bold hover:bg-dalek-green/20 transition-all"
                >
                  COMMIT TO REPOSITORY
                </button>
              </div>
            )}
          </div>

          <button 
            onClick={pruneRedundantMetadata}
            disabled={isRunning || isPruning}
            className={`w-full dalek-btn py-2 text-[10px] flex items-center justify-center gap-2 ${isPruning ? 'animate-pulse text-dalek-gold' : 'hover:bg-dalek-red/10 hover:text-dalek-red border-dalek-red/30'}`}
          >
            <Trash2 size={12} /> {isPruning ? 'PRUNING...' : 'PRUNE REDUNDANT METADATA'}
          </button>
        </div>
      </div>
    </div>
  );
};
