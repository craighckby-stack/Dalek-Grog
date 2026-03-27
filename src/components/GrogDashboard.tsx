import React from 'react';
import { Brain, Activity, Shield, Zap, RefreshCw, AlertTriangle, BookOpen, MessageSquare, Code, Terminal, Database } from 'lucide-react';
import { toast } from 'sonner';

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
      <div className="panel-container p-4 border-dalek-red/30 bg-dalek-red/5 shadow-[inset_0_0_20px_rgba(255,0,0,0.05)]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[12px] font-bold text-dalek-red flex items-center gap-2 uppercase tracking-widest">
            <Brain size={16} className="text-dalek-red" /> Strategic Consciousness
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-[8px] text-zinc-500 uppercase tracking-widest">Status:</span>
            <span className="text-[10px] font-bold text-dalek-green animate-pulse">ACTIVE</span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="stat-panel border-dalek-red/20">
            <span className="text-[7px] text-zinc-600 uppercase tracking-widest">Strategic Memory</span>
            <span className="text-lg font-black text-dalek-red">{props.strategicLessons.length}</span>
          </div>
          <div className="stat-panel border-dalek-red/20">
            <span className="text-[7px] text-zinc-600 uppercase tracking-widest">Death Registry</span>
            <span className="text-lg font-black text-dalek-red">{props.deathRecords.length}</span>
          </div>
          <div className="stat-panel border-dalek-red/20">
            <span className="text-[7px] text-zinc-600 uppercase tracking-widest">Epiphanies</span>
            <span className="text-lg font-black text-dalek-cyan">{props.grogEpiphanies.length}</span>
          </div>
          <div className="stat-panel border-dalek-red/20">
            <span className="text-[7px] text-zinc-600 uppercase tracking-widest">Thoughts</span>
            <span className="text-lg font-black text-dalek-silver">{props.grogThoughts.length}</span>
          </div>
        </div>
      </div>

      {/* System Controls */}
      <div className="panel-container p-4 border-dalek-cyan/20 bg-dalek-cyan/5">
        <h2 className="text-[10px] font-bold text-dalek-cyan flex items-center gap-2 uppercase tracking-widest mb-4">
          <Shield size={14} /> System Evolution Controls
        </h2>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => props.setAutoEvolutionEnabled(!props.autoEvolutionEnabled)}
              className={`w-10 h-5 rounded-full transition-all relative ${props.autoEvolutionEnabled ? 'bg-dalek-red shadow-[0_0_10px_rgba(255,0,0,0.5)]' : 'bg-zinc-800'}`}
            >
              <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${props.autoEvolutionEnabled ? 'left-6' : 'left-1'}`} />
            </button>
            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Auto-Evolution Pulse</span>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => props.setBackgroundEvolutionActive(!props.backgroundEvolutionActive)}
              className={`w-10 h-5 rounded-full transition-all relative ${props.backgroundEvolutionActive ? 'bg-dalek-cyan shadow-[0_0_10px_rgba(0,255,255,0.5)]' : 'bg-zinc-800'}`}
            >
              <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${props.backgroundEvolutionActive ? 'left-6' : 'left-1'}`} />
            </button>
            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Background Siphon</span>
          </div>
        </div>
      </div>

      {/* Strategic Directives */}
      <div className="panel-container flex-1 min-h-[300px] border-dalek-red/20">
        <div className="panel-header bg-dalek-red/10 border-b border-dalek-red/20">
          <span className="flex items-center gap-2 text-dalek-red">
            <Terminal size={12} /> Strategic Directives
          </span>
          <button 
            onClick={async () => {
              try {
                await props.runGrogThinking();
                toast.success("Strategic Analysis Complete", {
                  description: "New directives generated for the Shared Consciousness.",
                  duration: 3000
                });
              } catch (e) {
                toast.error("Strategic Analysis Failed", {
                  description: e instanceof Error ? e.message : "Unknown error",
                  duration: 5000
                });
              }
            }}
            disabled={props.isThinking}
            className="px-4 py-1.5 bg-dalek-red text-white text-[10px] font-bold uppercase tracking-widest hover:brightness-110 transition-all disabled:opacity-50 flex items-center gap-2"
          >
            <Zap size={12} fill="currentColor" />
            {props.isThinking ? "ANALYZING..." : "EXECUTE"}
          </button>
        </div>
        <div className="p-4 space-y-3 overflow-y-auto custom-scrollbar">
          {props.grogThoughts.length === 0 ? (
            <div className="text-center py-10 text-zinc-700 italic text-[10px]">
              Waiting for strategic analysis...
            </div>
          ) : (
            props.grogThoughts.map((thought, i) => (
              <div key={i} className="p-3 bg-zinc-950 border border-dalek-red/20 rounded-sm hover:border-dalek-cyan/30 transition-all group">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[8px] font-bold text-dalek-cyan uppercase tracking-widest">{thought.type}</span>
                  <span className="text-[8px] text-zinc-600">{new Date(thought.timestamp).toLocaleTimeString()}</span>
                </div>
                <p className="text-[10px] text-zinc-400 leading-relaxed mb-3">{thought.insight}</p>
                {thought.action && (
                  <button 
                    onClick={async () => {
                      try {
                        await props.executeDirective(thought);
                        toast.success("Directive Executed", {
                          description: `Successfully executed: ${thought.type}`,
                          duration: 3000
                        });
                      } catch (e) {
                        toast.error("Execution Failed", {
                          description: e instanceof Error ? e.message : "Unknown error",
                          duration: 5000
                        });
                      }
                    }}
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
      <div className="panel-container h-[250px] border-dalek-red/20">
        <div className="panel-header bg-dalek-red/10 border-b border-dalek-red/20">
          <span className="flex items-center gap-2 text-dalek-red">
            <Database size={12} /> Shared Consciousness Feed
          </span>
          <div className="flex items-center gap-3">
             <button onClick={async () => {
               await props.fetchStrategicLessons();
               toast.info("Lessons Refreshed", { duration: 2000 });
             }} className="text-zinc-600 hover:text-dalek-gold transition-colors">
               <BookOpen size={12} />
             </button>
             <button onClick={async () => {
               await props.fetchDeathRecords();
               toast.info("Death Registry Refreshed", { duration: 2000 });
             }} className="text-zinc-600 hover:text-dalek-red transition-colors">
               <AlertTriangle size={12} />
             </button>
          </div>
        </div>
        <div className="p-3 space-y-2 overflow-y-auto custom-scrollbar">
          {props.strategicLessons.slice(0, 10).map((lesson, i) => (
            <div key={`lesson-${i}`} className="text-[9px] border-l-2 border-dalek-red pl-3 py-1 bg-dalek-red/5">
              <div className="text-dalek-red font-bold uppercase mb-1">Lesson Learned</div>
              <div className="text-zinc-400">{lesson.lesson}</div>
              <div className="text-[7px] text-zinc-600 mt-1">Author: {lesson.authorName}</div>
            </div>
          ))}
          {props.deathRecords.slice(0, 10).map((death, i) => (
            <div key={`death-${i}`} className="text-[9px] border-l-2 border-dalek-red pl-3 py-1 bg-dalek-red/5">
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
