import React from 'react';
import { Brain, Activity, RefreshCw, Zap, ShieldCheck, BookOpen, ShieldAlert } from 'lucide-react';
import { DeathRegistryPanel } from './DeathRegistryPanel';
import { Mistake } from '../types';

interface GrogDashboardProps {
  grogBrainRef: React.MutableRefObject<any>;
  currentCode: string;
  mistakes: Mistake[];
  autoEvolutionEnabled: boolean;
  setAutoEvolutionEnabled: (enabled: boolean) => void;
  backgroundEvolutionActive: boolean;
  setBackgroundEvolutionActive: (active: boolean) => void;
  evolutionSuggestions: { path: string, saturation: number }[];
  runMassEvolution: () => Promise<void>;
  isMassEvolving: boolean;
  runBackgroundEvolution: () => Promise<void>;
  isScanningEvolution: boolean;
  runGrogThinking: () => Promise<void>;
  isThinking: boolean;
  grogEpiphanies: { type: string, insight: string, priority: number }[];
  runGrogTests: () => Promise<void>;
  isTesting: boolean;
  handleSelfMutation: (path: string) => Promise<void>;
  isSelfMutating: boolean;
  setIsRebooting: (rebooting: boolean) => void;
  testReport: string | null;
  deathRecords: any[];
  isAnalyzingDeaths: boolean;
  deathAnalysis: string | null;
  analyzeDeathRecords: () => Promise<string>;
  fetchDeathRecords: () => void;
  setSelectedFile: (file: string) => void;
  setActiveTab: (tab: 'system' | 'manual' | 'grog') => void;
  addLog: (msg: string, color?: string) => void;
  grogThoughts: any[];
}

export const GrogDashboard: React.FC<GrogDashboardProps> = ({
  grogBrainRef,
  currentCode,
  mistakes,
  autoEvolutionEnabled,
  setAutoEvolutionEnabled,
  backgroundEvolutionActive,
  setBackgroundEvolutionActive,
  evolutionSuggestions,
  runMassEvolution,
  isMassEvolving,
  runBackgroundEvolution,
  isScanningEvolution,
  runGrogThinking,
  isThinking,
  grogEpiphanies,
  runGrogTests,
  isTesting,
  handleSelfMutation,
  isSelfMutating,
  setIsRebooting,
  testReport,
  deathRecords,
  isAnalyzingDeaths,
  deathAnalysis,
  analyzeDeathRecords,
  fetchDeathRecords,
  setSelectedFile,
  setActiveTab,
  addLog,
  grogThoughts
}) => {
  return (
    <div className="panel-container space-y-4 p-4 animate-in fade-in duration-500">
      <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
        <h2 className="text-[12px] font-bold text-dalek-purple flex items-center gap-2 uppercase tracking-widest">
          <Brain size={14} /> Grog Strategic Dashboard
        </h2>
        <span className="text-[8px] text-zinc-600 bg-zinc-900 px-2 py-0.5 rounded">v2.1</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-black/40 border border-zinc-900 p-3 rounded-sm space-y-1">
          <span className="text-[8px] text-zinc-500 uppercase tracking-widest">Consciousness Level</span>
          <div className="flex items-end gap-2">
            <span className="text-2xl font-black text-dalek-purple">
              {grogBrainRef.current ? grogBrainRef.current.calculateSaturation(currentCode) : 0}%
            </span>
            <span className="text-[8px] text-zinc-600 mb-1">DNA SATURATION</span>
          </div>
        </div>
        <div className="bg-black/40 border border-zinc-900 p-3 rounded-sm space-y-1">
          <span className="text-[8px] text-zinc-500 uppercase tracking-widest">System Deaths</span>
          <div className="flex items-end gap-2">
            <span className="text-2xl font-black text-dalek-red">{deathRecords.length}</span>
            <span className="text-[8px] text-zinc-600 mb-1">INDEXED FAILURES</span>
          </div>
        </div>
      </div>

      {grogBrainRef.current && (
        <div className="bg-black/40 border border-zinc-900 p-3 rounded-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[8px] text-zinc-500 uppercase tracking-widest">API Gate Diagnostics</span>
            {grogBrainRef.current.getGateStats().isQuotaExhausted && (
              <span className="text-[8px] text-dalek-red animate-pulse uppercase font-bold">Quota Exhausted</span>
            )}
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-zinc-400">{grogBrainRef.current.getGateStats().callCount}</span>
              <span className="text-[7px] text-zinc-600 uppercase">Total Calls</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-dalek-cyan">{(grogBrainRef.current.getGateStats().estimatedTokensUsed || 0).toLocaleString()}</span>
              <span className="text-[7px] text-zinc-600 uppercase">Tokens Used</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-dalek-gold">{grogBrainRef.current.getGateStats().retryCount}</span>
              <span className="text-[7px] text-zinc-600 uppercase">Retries</span>
            </div>
          </div>
          <div className="h-1 bg-zinc-900 rounded-full overflow-hidden">
            <div 
              className="h-full bg-dalek-cyan transition-all duration-500" 
              style={{ width: `${Math.min(100, ((grogBrainRef.current.getGateStats().estimatedTokensUsed || 0) / 1000000) * 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-[7px] text-zinc-600 uppercase">
            <span>Budget Usage</span>
            <span>{(((grogBrainRef.current.getGateStats().estimatedTokensUsed || 0) / 1000000) * 100).toFixed(1)}%</span>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
            <Activity size={12} /> Background Evolution
          </h3>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setAutoEvolutionEnabled(!autoEvolutionEnabled)}
              className={`px-2 py-0.5 rounded text-[7px] font-bold transition-all ${autoEvolutionEnabled ? 'bg-dalek-purple text-white' : 'bg-zinc-900 text-zinc-600 border border-zinc-800'}`}
            >
              {autoEvolutionEnabled ? 'AUTO-AUTH ON' : 'AUTO-AUTH OFF'}
            </button>
            <button 
              onClick={() => setBackgroundEvolutionActive(!backgroundEvolutionActive)}
              className={`px-3 py-1 rounded-full text-[8px] font-bold transition-all ${backgroundEvolutionActive ? 'bg-dalek-green text-black' : 'bg-zinc-800 text-zinc-500'}`}
            >
              {backgroundEvolutionActive ? 'ACTIVE' : 'DISABLED'}
            </button>
          </div>
        </div>

        <div className="bg-black/60 border border-zinc-900 p-3 rounded-sm space-y-2">
          <div className="p-2 bg-black/40 border border-dalek-purple/20 rounded-sm mb-2">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="w-3 h-3 text-dalek-purple" />
              <span className="text-[8px] font-bold text-dalek-purple uppercase tracking-widest">Grog's Live Thoughts</span>
            </div>
            <div className="space-y-1">
              {grogThoughts.length === 0 ? (
                <div className="text-[8px] text-zinc-700 italic">Neural pathways idle...</div>
              ) : (
                grogThoughts.map((t, i) => (
                  <div key={i} className="flex flex-col gap-0.5 animate-in fade-in slide-in-from-left-1">
                    <div className="text-[8px] text-dalek-purple flex items-center gap-2">
                      <span className="opacity-40">[{new Date().toLocaleTimeString()}]</span>
                      <span className="font-bold">{t.type.toUpperCase()}:</span>
                      <span className="truncate opacity-80">{t.file || 'SYSTEM'}</span>
                    </div>
                    {t.violations && t.violations.length > 0 && (
                      <div className="text-[7px] text-dalek-red pl-4 flex items-center gap-1">
                        <ShieldAlert size={8} />
                        <span>{t.violations[0]}</span>
                      </div>
                    )}
                    {t.shadowDivergence !== undefined && (
                      <div className="text-[7px] text-dalek-gold pl-4 flex items-center gap-1">
                        <Activity size={8} />
                        <span>Shadow Divergence: {(t.shadowDivergence * 100).toFixed(1)}%</span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          <span className="text-[8px] text-zinc-600 uppercase tracking-widest block">Evolution Suggestions</span>
          <div className="max-h-[150px] overflow-y-auto space-y-2 custom-scrollbar pr-1">
            {evolutionSuggestions.length === 0 ? (
              <div className="text-[9px] text-zinc-700 italic text-center py-4">No suggestions available. Initiate scan.</div>
            ) : (
              <>
                <button 
                  onClick={runMassEvolution}
                  disabled={isMassEvolving}
                  className="w-full py-1.5 bg-dalek-purple text-white text-[8px] font-bold rounded-sm hover:bg-dalek-purple/80 transition-all mb-2 flex items-center justify-center gap-2"
                >
                  {isMassEvolving ? <RefreshCw size={10} className="animate-spin" /> : <Zap size={10} />}
                  {isMassEvolving ? 'EVOLVING ALL...' : 'EXECUTE MASS EVOLUTION'}
                </button>
                <div className="space-y-2">
                  {evolutionSuggestions.map(s => (
                    <div key={s.path} className="flex items-center justify-between p-2 bg-zinc-900/30 border border-zinc-800 rounded-sm">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-zinc-300 font-mono truncate max-w-[200px]">{s.path}</span>
                        <span className="text-[8px] text-zinc-600">Saturation: {s.saturation}%</span>
                      </div>
                      <button 
                        onClick={() => {
                          setSelectedFile(s.path);
                          setActiveTab('system');
                          addLog(`GROK_TARGET_ACQUIRED: ${s.path}`, "var(--color-dalek-gold)");
                        }}
                        className="text-[8px] text-dalek-purple hover:underline font-bold"
                      >
                        EVOLVE
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <button 
              onClick={runBackgroundEvolution}
              disabled={isScanningEvolution}
              className="py-2 bg-dalek-purple/10 text-dalek-purple border border-dalek-purple/30 text-[9px] font-bold hover:bg-dalek-purple/20 transition-all disabled:opacity-50"
            >
              {isScanningEvolution ? 'SCANNING...' : 'SCAN REPO'}
            </button>
            <button 
              onClick={runGrogThinking}
              disabled={isThinking}
              className="py-2 bg-dalek-purple/10 text-dalek-purple border border-dalek-purple/30 text-[9px] font-bold hover:bg-dalek-purple/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isThinking ? <RefreshCw size={10} className="animate-spin" /> : <Brain size={10} />}
              {isThinking ? 'THINKING...' : 'THINK'}
            </button>
          </div>
        </div>

        {grogEpiphanies.length > 0 && (
          <div className="space-y-2 mt-4">
            <span className="text-[8px] text-dalek-purple uppercase tracking-widest block">Strategic Epiphanies</span>
            <div className="space-y-2">
              {grogEpiphanies.map((e, i) => (
                <div key={i} className="p-2 bg-dalek-purple/5 border border-dalek-purple/20 rounded-sm">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[7px] font-bold text-dalek-purple uppercase">{e.type}</span>
                    <span className="text-[7px] text-zinc-600">PRIORITY: {e.priority}</span>
                  </div>
                  <p className="text-[9px] text-zinc-300 leading-tight">{e.insight}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <button 
            onClick={runGrogTests}
            disabled={isTesting}
            className="py-2 bg-dalek-gold/10 text-dalek-gold border border-dalek-gold/30 text-[9px] font-bold hover:bg-dalek-gold/20 transition-all disabled:opacity-50"
          >
            {isTesting ? 'TESTING...' : 'VALIDATE CORE'}
          </button>
          <button 
            onClick={() => handleSelfMutation('src/evolutors/GrogBrain.ts')}
            disabled={isSelfMutating}
            className="py-2 bg-dalek-red/10 text-dalek-red border border-dalek-red/30 text-[9px] font-bold hover:bg-dalek-red/20 transition-all disabled:opacity-50"
          >
            {isSelfMutating ? 'EVOLVING...' : 'SELF-MUTATE'}
          </button>
        </div>
      </div>

      <DeathRegistryPanel 
        records={deathRecords}
        isAnalyzing={isAnalyzingDeaths}
        analysisResult={deathAnalysis}
        onAnalyze={analyzeDeathRecords}
        onRefresh={fetchDeathRecords}
      />

      <div className="space-y-2">
        <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
          <BookOpen size={12} /> Strategic Lessons
        </h3>
        <div className="bg-[#050505] border border-zinc-900 p-3 rounded-sm max-h-[200px] overflow-y-auto custom-scrollbar">
          {mistakes.length === 0 ? (
            <div className="text-[9px] text-zinc-700 italic text-center py-4">No permanent lessons formulated.</div>
          ) : (
            mistakes.map(m => (
              <div key={m.id} className="mb-4 last:mb-0 border-b border-zinc-900 pb-4 last:border-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-dalek-gold">LESSON_{m.id.slice(0, 8)}</span>
                  <span className="text-[8px] text-zinc-600">{m.timestamp}</span>
                </div>
                <p className="text-[10px] text-zinc-400 leading-relaxed italic mb-2">"{m.correction}"</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
