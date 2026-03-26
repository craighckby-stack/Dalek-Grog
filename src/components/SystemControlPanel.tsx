import React from 'react';
import { Activity, Shield, RefreshCw, Database, Terminal, Sparkles, Zap } from 'lucide-react';
import { ManualControlPanel } from './ManualControlPanel';
import { Mistake } from '../types';

interface SystemControlPanelProps {
  isRunning: boolean;
  status: string;
  targetRepo: string;
  setTargetRepo: (repo: string) => void;
  originalBranch: string;
  setOriginalBranch: (branch: string) => void;
  targetBranch: string;
  setTargetBranch: (branch: string) => void;
  backupRepo: string;
  setBackupRepo: (repo: string) => void;
  fetchRepoFiles: (repo?: string, branch?: string) => Promise<string[]>;
  isFetchingFiles: boolean;
  showManualControls: boolean;
  setShowManualControls: (show: boolean) => void;
  showMistakeLedger: boolean;
  setShowMistakeLedger: (show: boolean) => void;
  mistakes: Mistake[];
  setMistakes: (mistakes: Mistake[]) => void;
  siphonedRepos: string[];
  isAnalyzingDNA: boolean;
  externalDnaRepo: string;
  setExternalDnaRepo: (repo: string) => void;
  siphonExternalDNA: (repoName?: string, skipLoading?: boolean) => Promise<string | null>;
  handleDNAUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setSiphonedRepos: (repos: string[]) => void;
  pruneRedundantMetadata: () => Promise<void>;
  isPruning: boolean;
  isAuditing: boolean;
  runFullSystemAudit: () => Promise<void>;
  saturationGuidelines: string;
  handleSaturationUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isAnalyzingSaturation: boolean;
  googleDriveFiles: File[];
  handleGoogleDriveUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  selectedFile: string;
  setSelectedFile: (file: string) => void;
  repoFiles: string[];
  processAll: boolean;
  setProcessAll: (all: boolean) => void;
  resumeMode: boolean;
  setResumeMode: (resume: boolean) => void;
  precisionMode: boolean;
  setPrecisionMode: (precision: boolean) => void;
  parallelMode: boolean;
  setParallelMode: (parallel: boolean) => void;
  parallelThreads: number;
  setParallelThreads: (threads: number) => void;
  maxRounds: number;
  setMaxRounds: (rounds: number) => void;
  showSaturation: boolean;
  evolutionStats: { generation: number, bestFitness: number };
  currentStrategy: any;
  initiateEvolution: () => Promise<void>;
  stopEvolution: () => void;
  // Manual Evolution Props
  handleManualUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  runManualEnhancement: (contentOverride?: string, fileNameOverride?: string, autoPush?: boolean) => Promise<void>;
  manualFileName: string;
  manualFileContent: string;
  manualEnhancedCode: string | null;
  isEnhancingManual: boolean;
  pushToRepo: (path: string, content: string, message: string, repoOverride?: string, branchOverride?: string) => Promise<boolean>;
  addLog: (msg: string, color?: string) => void;
  dnaSignature: string;
  strategicLedger: any[];
}

export const SystemControlPanel: React.FC<SystemControlPanelProps> = (props) => {
  return (
    <div className="panel-container animate-in fade-in duration-500">
      <div className="panel-header">
        <span className="flex items-center gap-2">
          <Activity size={12} className={props.isRunning ? "animate-pulse" : ""} />
          SYSTEM CONTROL
        </span>
        <span className="flex items-center gap-1">
          <span className={`w-2 h-2 rounded-full ${props.isRunning ? 'bg-dalek-cyan shadow-[0_0_5px_#00ffcc]' : 'bg-zinc-800'}`}></span>
          {props.isRunning ? 'ACTIVE' : 'STANDBY'}
        </span>
      </div>
      <div className="p-3 sm:p-4 flex flex-col gap-3">
        <div className="space-y-1">
          <label className="text-[10px] uppercase tracking-tighter text-zinc-500 flex items-center gap-1">
            <Shield size={10} /> BACKEND AUTHENTICATION
          </label>
          <div className="dalek-input text-[10px] text-dalek-cyan text-center py-2 border-dalek-cyan/30">
            SYSTEM KEYS AUTOMATED VIA BACKEND
          </div>
        </div>

        <div className="space-y-3 bg-black/20 p-3 border border-zinc-900/50 rounded-sm">
          <label className="text-[10px] uppercase tracking-tighter text-zinc-500 flex items-center justify-between gap-1">
            <span className="flex items-center gap-1"><Shield size={10} /> DESTINATION REPOSITORY</span>
            <button 
              onClick={() => props.fetchRepoFiles().catch(() => {})} 
              className="hover:text-dalek-cyan transition-colors"
              title="Re-scan Repository"
            >
              <RefreshCw size={10} className={props.isFetchingFiles ? 'animate-spin' : ''} />
            </button>
          </label>

          <div className="grid grid-cols-3 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase tracking-tighter text-zinc-600">Target Repo</label>
              <input 
                type="text" 
                className="dalek-input text-[11px]" 
                placeholder="user/repo" 
                value={props.targetRepo}
                onChange={(e) => props.setTargetRepo(e.target.value)}
                disabled={props.isRunning}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase tracking-tighter text-zinc-600">Base Branch</label>
              <input 
                type="text" 
                className="dalek-input text-[11px]" 
                placeholder="main" 
                value={props.originalBranch}
                onChange={(e) => props.setOriginalBranch(e.target.value)}
                disabled={props.isRunning}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase tracking-tighter text-zinc-600">Evo Branch</label>
              <input 
                type="text" 
                className="dalek-input text-[11px]" 
                placeholder="nexus-evolution" 
                value={props.targetBranch}
                onChange={(e) => props.setTargetBranch(e.target.value)}
                disabled={props.isRunning}
              />
            </div>
          </div>
        </div>

        <div className="space-y-3 bg-black/20 p-3 border border-zinc-900/50 rounded-sm">
          <label className="text-[10px] uppercase tracking-tighter text-zinc-500 flex items-center justify-between gap-1">
            <span className="flex items-center gap-1"><Database size={10} /> DNA ARCHITECTURE</span>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => props.setShowManualControls(!props.showManualControls)}
                className={`hover:text-dalek-gold transition-colors ${props.showManualControls ? 'text-dalek-gold' : 'text-zinc-600'}`}
                title="Manual Override"
              >
                <Shield size={10} />
              </button>
            </div>
          </label>
          
          {props.showManualControls ? (
            <ManualControlPanel 
              externalDnaRepo={props.externalDnaRepo}
              setExternalDnaRepo={props.setExternalDnaRepo}
              isRunning={props.isRunning}
              isAnalyzingDNA={props.isAnalyzingDNA}
              siphonExternalDNA={props.siphonExternalDNA}
              handleDNAUpload={props.handleDNAUpload}
              setSiphonedRepos={props.setSiphonedRepos}
              pruneRedundantMetadata={props.pruneRedundantMetadata}
              isPruning={props.isPruning}
              mistakes={props.mistakes}
              setMistakes={props.setMistakes}
              showMistakeLedger={props.showMistakeLedger}
              setShowMistakeLedger={props.setShowMistakeLedger}
              siphonedRepos={props.siphonedRepos}
              handleManualUpload={props.handleManualUpload}
              runManualEnhancement={props.runManualEnhancement}
              manualFileName={props.manualFileName}
              manualFileContent={props.manualFileContent}
              manualEnhancedCode={props.manualEnhancedCode}
              isEnhancingManual={props.isEnhancingManual}
              pushToRepo={props.pushToRepo}
              addLog={props.addLog}
              dnaSignature={props.dnaSignature}
              saturationGuidelines={props.saturationGuidelines}
              strategicLedger={props.strategicLedger}
            />
          ) : (
            <div className="flex flex-wrap gap-1">
              {props.siphonedRepos.length === 0 ? (
                <span className="text-[9px] text-zinc-700 italic">Waiting for autonomous discovery...</span>
              ) : (
                props.siphonedRepos.map(repo => (
                  <div key={repo} className="px-2 py-0.5 bg-dalek-cyan/10 border border-dalek-cyan/30 rounded-full text-[9px] text-dalek-cyan flex items-center gap-1">
                    <Zap size={8} /> {repo}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-tighter text-zinc-500 flex items-center gap-1">
              <Sparkles size={10} /> SATURATION
            </label>
            <input 
              type="file" 
              className="hidden" 
              id="saturation-upload-panel"
              onChange={props.handleSaturationUpload}
              disabled={props.isAnalyzingSaturation || props.isRunning}
            />
            <label 
              htmlFor="saturation-upload-panel"
              className={`dalek-input block text-center cursor-pointer transition-all text-[9px] py-1.5 ${props.isAnalyzingSaturation ? 'animate-pulse border-dalek-gold text-dalek-gold' : 'hover:border-dalek-cyan'}`}
            >
              {props.isAnalyzingSaturation ? '...' : props.saturationGuidelines ? 'GUIDELINES ✓' : 'UPLOAD GUIDELINES'}
            </label>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-tighter text-zinc-500 flex items-center gap-1">
              <Database size={10} /> DRIVE
            </label>
            <input 
              type="file" 
              className="hidden" 
              id="gdrive-upload-panel"
              multiple
              onChange={props.handleGoogleDriveUpload}
              disabled={props.isRunning}
            />
            <label 
              htmlFor="gdrive-upload-panel"
              className="dalek-input block text-center cursor-pointer transition-all text-[9px] py-1.5 hover:border-dalek-cyan"
            >
              {props.googleDriveFiles.length > 0 ? `${props.googleDriveFiles.length} FILES ✓` : 'SIPHON DRIVE'}
            </label>
          </div>
        </div>

        <div className="space-y-1 pt-2 border-t border-zinc-900/50">
          <label className="text-[10px] uppercase tracking-tighter text-zinc-500 flex items-center gap-1">
            <Terminal size={10} /> TARGET FILE
          </label>
          <div className="flex gap-2">
            <select 
              className="dalek-input flex-1 text-[10px] py-1"
              value={props.selectedFile}
              onChange={(e) => props.setSelectedFile(e.target.value)}
              disabled={props.processAll || props.isRunning}
            >
              <option value="nexus_core.js">nexus_core.js (New)</option>
              {props.repoFiles.map(file => (
                <option key={file} value={file}>{file}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2">
            <div className="flex items-center gap-2">
              <input type="checkbox" id="processAll-panel" checked={props.processAll} onChange={(e) => props.setProcessAll(e.target.checked)} disabled={props.isRunning} />
              <label htmlFor="processAll-panel" className="text-[8px] text-zinc-500 uppercase tracking-widest cursor-pointer">Process All</label>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="resumeMode-panel" checked={props.resumeMode} onChange={(e) => props.setResumeMode(e.target.checked)} disabled={props.isRunning} />
              <label htmlFor="resumeMode-panel" className="text-[8px] text-zinc-500 uppercase tracking-widest cursor-pointer">Resume Mode</label>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="precisionMode-panel" checked={props.precisionMode} onChange={(e) => props.setPrecisionMode(e.target.checked)} disabled={props.isRunning} />
              <label htmlFor="precisionMode-panel" className="text-[8px] text-dalek-red uppercase tracking-widest cursor-pointer font-bold">Precision</label>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="parallelMode-panel" checked={props.parallelMode} onChange={(e) => props.setParallelMode(e.target.checked)} disabled={props.isRunning} />
              <label htmlFor="parallelMode-panel" className="text-[8px] text-zinc-500 uppercase tracking-widest cursor-pointer">Parallel</label>
            </div>
            <div className="flex items-center gap-2 col-span-2 mt-1">
              <label className="text-[8px] text-zinc-500 uppercase tracking-widest">Evolution Rounds: {props.maxRounds}</label>
              <input 
                type="range" 
                min="1" 
                max="20" 
                value={props.maxRounds} 
                onChange={(e) => props.setMaxRounds(parseInt(e.target.value))} 
                className="flex-1 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-dalek-red"
                disabled={props.isRunning}
              />
            </div>
          </div>
        </div>

        <div className="mt-2 border-t border-zinc-900 pt-2">
          <label className="text-[10px] uppercase tracking-tighter text-zinc-500 mb-1 block flex items-center justify-between">
            <span className="flex items-center gap-1"><Activity size={10} /> STRATEGY ENGINE</span>
            <span className="text-[9px] text-dalek-cyan">GEN {props.evolutionStats.generation}</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-black/40 border border-zinc-900 p-2 rounded">
              <span className="text-[7px] text-zinc-600 block uppercase">Best Fitness</span>
              <span className="text-[10px] text-dalek-gold font-bold">{props.evolutionStats.bestFitness.toFixed(0)}</span>
            </div>
            <div className="bg-black/40 border border-zinc-900 p-2 rounded">
              <span className="text-[7px] text-zinc-600 block uppercase">Strategy</span>
              <span className="text-[8px] text-zinc-400 truncate">{props.currentStrategy?.id || "N/A"}</span>
            </div>
          </div>
          <button 
            onClick={() => props.runFullSystemAudit()}
            disabled={props.isAuditing || props.isRunning}
            className={`w-full mt-2 py-1.5 border border-dalek-cyan/30 text-[9px] tracking-widest uppercase transition-all flex items-center justify-center gap-2 ${props.isAuditing ? 'animate-pulse text-dalek-cyan border-dalek-cyan' : 'hover:bg-dalek-cyan/10 text-zinc-400 hover:text-dalek-cyan'}`}
          >
            <Shield size={10} className={props.isAuditing ? 'animate-spin' : ''} />
            {props.isAuditing ? 'Auditing System...' : 'Run Full System Audit'}
          </button>
        </div>

        <div className="mt-auto pt-4">
          {!props.isRunning ? (
            <button 
              onClick={() => props.initiateEvolution()}
              className="w-full py-3 bg-dalek-red hover:bg-red-600 text-white font-bold text-xs tracking-[0.2em] rounded-sm shadow-[0_0_15px_rgba(255,0,0,0.3)] transition-all flex items-center justify-center gap-2 group"
            >
              <Zap size={14} className="group-hover:animate-pulse" />
              INITIATE EVOLUTION
            </button>
          ) : (
            <button 
              onClick={() => props.stopEvolution()}
              className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 text-dalek-red font-bold text-xs tracking-[0.2em] rounded-sm border border-dalek-red/50 transition-all flex items-center justify-center gap-2 group"
            >
              <RefreshCw size={14} className="animate-spin" />
              ABORT EVOLUTION
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
