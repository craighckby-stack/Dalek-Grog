import React from 'react';
import { Brain, Activity, Shield, Zap, RefreshCw, AlertTriangle, BookOpen, MessageSquare, Code, Terminal, Database } from 'lucide-react';

interface GrogDashboardProps {
  grogBrainRef: any;
  currentCode: string;
  mistakes: any[];
  autoEvolutionEnabled: boolean;
  setAutoEvolutionEnabled: (v: boolean) => void;
  backgroundEvolutionActive: boolean;
  setBackgroundEvolutionActive: (v: boolean) => void;
  evolutionSuggestions: any[];
  runMassEvolution: () => Promise<void>;
  isMassEvolving: boolean;
  runBackgroundEvolution: () => Promise<void>;
  isScanningEvolution: boolean;
  runGrogThinking: () => Promise<void>;
  isThinking: boolean;
  grogEpiphanies: any[];
  runGrogTests: () => Promise<void>;
  isTesting: boolean;
  handleSelfMutation: (file: string) => Promise<void>;
  isSelfMutating: boolean;
  setIsRebooting: (v: boolean) => void;
  testReport: any;
  setTestReport: (v: any) => void;
  deathRecords: any[];
  strategicLessons: any[];
  isAnalyzingDeaths: boolean;
  deathAnalysis: string;
  analyzeDeathRecords: () => Promise<void>;
  fetchDeathRecords: () => Promise<void>;
  fetchStrategicLessons: () => Promise<void>;
  setSelectedFile: (v: string) => void;
  setActiveTab: (v: string) => void;
  addLog: (m: string, c?: string) => void;
  grogThoughts: any[];
  executeDirective: (d: any) => Promise<void>;
}

export const GrogDashboard: React.FC<GrogDashboardProps> = (props) => {
  return (
    <div className="flex flex-col gap-4 h-full overflow-y-auto custom-scrollbar pr-2">
      {/* Strategic Consciousness Status */}
      <div className="panel-container p-4 border-dalek-gold/30 bg-dalek-gold/5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[12px] font-bold text-dalek-gold flex items-center gap-2 uppercase tracking-widest">
            <Brain size={16} /> Strategic Consciousness
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-[8px] text-zinc-500 uppercase tracking-widest">Status:</span>
            <span className="text-[10px] font-bold text-dalek-green animate-pulse">ACTIVE</span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="stat-panel">
            <span className="text-[7px] text-zinc-600 uppercase tracking-widest">Strategic Memory</span>
            <span className="text-lg font-black text-dalek-gold">{props.strategicLessons.length}</span>
          </div>
          <div className="stat-panel">
            <span className="text-[7px] text-zinc-600 uppercase tracking-widest">Death Registry</span>
            <span className="text-lg font-black text-dalek-red">{props.deathRecords.length}</span>
          </div>
          <div className="stat-panel">
            <span className="text-[7px] text-zinc-600 uppercase tracking-widest">Epiphanies</span>
            <span className="text-lg font-black text-dalek-cyan">{props.grogEpiphanies.length}</span>
          </div>
          <div className="stat-panel">
            <span className="text-[7px] text-zinc-600 uppercase tracking-widest">Thoughts</span>
            <span className="text-lg font-black text-white">{props.grogThoughts.length}</span>
          </div>
        </div>
      </div>

      {/* Strategic Directives */}
      <div className="panel-container flex-1 min-h-[300px]">
        <div className="panel-header">
          <span className="flex items-center gap-2">
            <Terminal size={12} /> Strategic Directives
          </span>
          <button 
            onClick={props.runGrogThinking}
            disabled={props.isThinking}
            className="text-dalek-cyan hover:text-white transition-colors disabled:opacity-50"
          >
            {props.isThinking ? <RefreshCw size={12} className="animate-spin" /> : <Zap size={12} />}
          </button>
        </div>
        <div className="p-4 space-y-3 overflow-y-auto">
          {props.grogThoughts.length === 0 ? (
            <div className="text-center py-10 text-zinc-700 italic text-[10px]">
              Waiting for strategic analysis...
            </div>
          ) : (
            props.grogThoughts.map((thought, i) => (
              <div key={i} className="p-3 bg-zinc-900/50 border border-zinc-800 rounded-sm hover:border-dalek-cyan/30 transition-all group">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[8px] font-bold text-dalek-cyan uppercase tracking-widest">{thought.type}</span>
                  <span className="text-[8px] text-zinc-600">{new Date(thought.timestamp).toLocaleTimeString()}</span>
                </div>
                <p className="text-[10px] text-zinc-400 leading-relaxed mb-3">{thought.insight}</p>
                {thought.action && (
                  <button 
                    onClick={() => props.executeDirective(thought)}
                    className="w-full py-1.5 bg-dalek-cyan/10 border border-dalek-cyan/30 text-dalek-cyan text-[8px] font-bold uppercase tracking-widest hover:bg-dalek-cyan/20 transition-all"
                  >
                    Execute Directive
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Shared Consciousness Feed */}
      <div className="panel-container h-[250px]">
        <div className="panel-header">
          <span className="flex items-center gap-2">
            <Database size={12} /> Shared Consciousness Feed
          </span>
          <div className="flex items-center gap-3">
             <button onClick={props.fetchStrategicLessons} className="text-zinc-600 hover:text-dalek-gold transition-colors">
               <BookOpen size={12} />
             </button>
             <button onClick={props.fetchDeathRecords} className="text-zinc-600 hover:text-dalek-red transition-colors">
               <AlertTriangle size={12} />
             </button>
          </div>
        </div>
        <div className="p-3 space-y-2 overflow-y-auto">
          {props.strategicLessons.slice(0, 10).map((lesson, i) => (
            <div key={`lesson-${i}`} className="text-[9px] border-l-2 border-dalek-gold pl-3 py-1">
              <div className="text-dalek-gold font-bold uppercase mb-1">Lesson Learned</div>
              <div className="text-zinc-400">{lesson.lesson}</div>
              <div className="text-[7px] text-zinc-600 mt-1">Author: {lesson.authorName}</div>
            </div>
          ))}
          {props.deathRecords.slice(0, 10).map((death, i) => (
            <div key={`death-${i}`} className="text-[9px] border-l-2 border-dalek-red pl-3 py-1">
              <div className="text-dalek-red font-bold uppercase mb-1">System Failure</div>
              <div className="text-zinc-400">{death.reason}</div>
              <div className="text-[7px] text-zinc-600 mt-1">Author: {death.authorName}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
