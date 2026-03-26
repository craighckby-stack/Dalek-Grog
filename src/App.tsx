/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * DALEK_GROG v3.1: Autonomous Evolution Engine
 * Copyright (c) 2026 craighckby-stack
 * 
 * This project incorporates architectural DNA siphoned from:
 * - DeepMind/AlphaCode, Google/Genkit, Firebase/Lifecycle, Meta/React-Core,
 *   OpenAI/Triton, Anthropic/Constitutional-AI, microsoft/TypeScript, etc.
 */

import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { motion, AnimatePresence } from "framer-motion";
import * as Sentry from "@sentry/react";
import { Terminal, Cpu, Database, Activity, AlertTriangle, Shield, ShieldCheck, RefreshCw, FileCode, Sparkles, Square, Play, RotateCcw, FileText, Trash2, Zap, Brain, Bug, Search, Copy, BookOpen } from 'lucide-react';
import { LogEntry, Mistake, MetaState } from './types';
import { robustParseJSON, safeFetchJson, safeAtob, safeBtoa } from './core/utils';
import { LICENSE_HEADER, LICENSE_CONTENT } from './constants';
import { PromptService, SystemPrompts } from './evolutors/promptService';
import { StrategyEvolution, EvolutionaryStrategy } from './evolutors/evolutionService';
import { SteganographyService } from './siphons/steganographyService';
import { GrogBrain } from './evolutors/GrogBrain';
import { SaturationService } from './evolutors/SaturationService';
import { EventBus, NexusTask, NexusTaskHeap, NexusPatch, NexusArchitecturalLinter, NexusComplexityAnalyzer, NexusDiagnosticReporter, NexusCompilerHost } from './core/nexus_core';
import { GithubService } from './services/githubService';
import { WebSiphonService } from './services/webSiphonService';
import { systemAuditService } from './services/SystemAuditService';
import { NEXUS_CORE_TEMPLATE } from './templates/nexus_core_template';
import * as mammoth from 'mammoth';

import { DeathRegistryPanel } from './components/DeathRegistryPanel';
import { ManualControlPanel } from './components/ManualControlPanel';
import { GrogDashboard } from './components/GrogDashboard';
import { SystemControlPanel } from './components/SystemControlPanel';

export default function App() {
  const isRunningRef = useRef(false);
  const [isRunning, setIsRunning] = useState(false);
  const [status, setStatus] = useState('INIT');
  const [round, setRound] = useState(0);
  const [syncStatus, setSyncStatus] = useState('READY');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [mistakes, setMistakes] = useState<Mistake[]>([]);
  const [currentCode, setCurrentCode] = useState('// Lifecycle: STANDBY');
  const [meta, setMeta] = useState<MetaState | null>(null);
  const [showSaturation, setShowSaturation] = useState(false);
  const [isFetchingFiles, setIsFetchingFiles] = useState(false);
  const [repoFiles, setRepoFiles] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState('nexus_core.js');
  const [processAll, setProcessAll] = useState(false);
  const [resumeMode, setResumeMode] = useState(true);
  const [chainedContext, setChainedContext] = useState('');
  const [currentVote, setCurrentVote] = useState('');
  const [sourceDNA, setSourceDNA] = useState<string>('');
  const [dnaSignature, setDnaSignature] = useState<string>('');
  const [dependencyMap, setDependencyMap] = useState<Record<string, string[]>>({});
  const [isBuildingGraph, setIsBuildingGraph] = useState(false);
  const [externalDnaRepo, setExternalDnaRepo] = useState("firebase/firebase-android-sdk");
  const [isAnalyzingDNA, setIsAnalyzingDNA] = useState(false);
  const [saturationGuidelines, setSaturationGuidelines] = useState<string>('');
  const [isAnalyzingSaturation, setIsAnalyzingSaturation] = useState(false);
  const [isEnhancingReadme, setIsEnhancingReadme] = useState(false);
  const [prompts, setPrompts] = useState<SystemPrompts | null>(null);
  const [isOptimizingPrompts, setIsOptimizingPrompts] = useState(false);
  const [siphonedRepos, setSiphonedRepos] = useState<string[]>(["freeCodeCamp/freeCodeCamp"]);
  const [showManualControls, setShowManualControls] = useState(false);
  const [showMistakeLedger, setShowMistakeLedger] = useState(false);
  const [precisionMode, setPrecisionMode] = useState(true);
  const [activeTab, setActiveTab] = useState<'system' | 'manual' | 'grog'>('system');
  const [backgroundEvolutionActive, setBackgroundEvolutionActive] = useState(false);
  const [evolutionSuggestions, setEvolutionSuggestions] = useState<{ path: string, saturation: number }[]>([]);
  const [autoEvolutionEnabled, setAutoEvolutionEnabled] = useState(false);
  const [isScanningEvolution, setIsScanningEvolution] = useState(false);
  const [isMassEvolving, setIsMassEvolving] = useState(false);
  const [manualFileContent, setManualFileContent] = useState<string>('');
  const [manualFileName, setManualFileName] = useState<string>('');
  const [manualEnhancedCode, setManualEnhancedCode] = useState<string>('');
  const [isEnhancingManual, setIsEnhancingManual] = useState(false);
  const [parallelMode, setParallelMode] = useState(false);
  const [parallelThreads, setParallelThreads] = useState(3);
  const [maxRounds, setMaxRounds] = useState(10);

  const [isPruning, setIsPruning] = useState(false);
  const [isAuditing, setIsAuditing] = useState(false);
  const [deathRecords, setDeathRecords] = useState<any[]>([]);
  const [strategicLessons, setStrategicLessons] = useState<any[]>([]);
  const [isAnalyzingDeaths, setIsAnalyzingDeaths] = useState(false);
  const [deathAnalysis, setDeathAnalysis] = useState<string | null>(null);
  const grogBrainRef = useRef<GrogBrain | null>(null);
  const eventBusRef = useRef<EventBus>(new EventBus());
  const githubServiceRef = useRef<GithubService | null>(null);
  const webSiphonServiceRef = useRef<WebSiphonService | null>(null);
  const [grogThoughts, setGrogThoughts] = useState<any[]>([]);
  const [grogEpiphanies, setGrogEpiphanies] = useState<any[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [isRebooting, setIsRebooting] = useState(false);

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      if (file.name.endsWith('.docx')) {
        reader.onload = async (e) => {
          try {
            const arrayBuffer = e.target?.result as ArrayBuffer;
            const result = await mammoth.extractRawText({ arrayBuffer });
            resolve(result.value);
          } catch (err) {
            reject(new Error(`Failed to parse .docx file: ${err instanceof Error ? err.message : 'Unknown error'}`));
          }
        };
        reader.onerror = () => reject(new Error('FileReader error occurred.'));
        reader.readAsArrayBuffer(file);
      } else {
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = () => reject(new Error('FileReader error occurred.'));
        reader.readAsText(file);
      }
    });
  };

  useEffect(() => {
    const bus = eventBusRef.current;
    const handler = (thought: any) => {
      setGrogThoughts(prev => [thought, ...prev].slice(0, 5));
    };
    bus.subscribe('grog:thought', handler);
    return () => bus.unsubscribe('grog:thought', handler);
  }, []);

  const [targetRepo, setTargetRepo] = useState("craighckby-stack/Dalek-Grog");
  const [targetBranch, setTargetBranch] = useState("main");
  const [originalBranch, setOriginalBranch] = useState("main"); // Default to main
  const [backupRepo, setBackupRepo] = useState("craighckby-stack/Dalek-Grog");

  const fetchDeathRecords = async () => {
    try {
      const content = await fetchFileContent('grog/lessons/DEATH_REGISTRY.json');
      if (content) {
        const records = robustParseJSON(content);
        setDeathRecords(records || []);
      }
    } catch (e) {
      // Silent fail if not exists
    }
  };

  const fetchStrategicLessons = async () => {
    try {
      const content = await fetchFileContent('grog/lessons/STRATEGIC_LESSONS.json');
      if (content) {
        const lessons = robustParseJSON(content);
        setStrategicLessons(lessons || []);
      }
    } catch (e) {
      // Silent fail
    }
  };

  const analyzeDeathRecords = async () => {
    if (deathRecords.length === 0) return "";
    setIsAnalyzingDeaths(true);
    addLog("INITIATING CRITICAL FAILURE ANALYSIS...", "var(--color-dalek-gold)");
    
    try {
      const prompt = `Analyze these system "death" records (critical failures) for the Dalek-Grog project.
      Identify recurring patterns, root causes, and suggest architectural adaptations to prevent these in the future.
      
      DEATH RECORDS:
      ${JSON.stringify(deathRecords, null, 2)}
      
      Output a concise technical analysis and a set of "Evolutionary Directives".`;
      
      const analysis = await callAIWithFallback(prompt, "You are a System Reliability Engineer and Failure Analyst.");
      setDeathAnalysis(analysis);
      addLog("FAILURE ANALYSIS COMPLETE. EVOLUTIONARY DIRECTIVES GENERATED.", "var(--color-dalek-cyan)");
      return analysis;
    } catch (e) {
      addLog("FAILURE ANALYSIS FAILED.", "var(--color-dalek-red)");
      return "Analysis failed.";
    } finally {
      setIsAnalyzingDeaths(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'grog') {
      fetchDeathRecords();
      fetchStrategicLessons();
    }
  }, [activeTab]);

  const addLog = (message: string, color: string = "var(--color-dalek-cyan-dim)") => {
    const newLog: LogEntry = {
      id: Math.random().toString(36).substring(7),
      timestamp: new Date().toISOString(),
      message,
      color
    };
    setLogs(prev => [...prev, newLog].slice(-200));
  };

  useEffect(() => {
    githubServiceRef.current = new GithubService(targetRepo, targetBranch, addLog);
    webSiphonServiceRef.current = new WebSiphonService(addLog);
  }, []);

  useEffect(() => {
    if (githubServiceRef.current) {
      githubServiceRef.current.updateConfig(targetRepo, targetBranch);
    }
  }, [targetRepo, targetBranch]);

  const logEndRef = useRef<HTMLDivElement>(null);
  const lastPushedLogIndex = useRef(0);
  const [lastValidation, setLastValidation] = useState<{ valid: boolean; reason?: string } | null>(null);
  const [lastSummary, setLastSummary] = useState<string>("");
  const [lastStrategicDecision, setLastStrategicDecision] = useState<string>("");
  const [lastPriority, setLastPriority] = useState<number>(0);
  const [lastTool, setLastTool] = useState<any>(null);
  const [strategicLedger, setStrategicLedger] = useState<any[]>([]);
  const [googleDriveFiles, setGoogleDriveFiles] = useState<File[]>([]);
  const [liveHeap] = useState(new NexusTaskHeap());
  const [shadowHeap, setShadowHeap] = useState<NexusTaskHeap | null>(null);
  const compilerHost = useRef(new NexusCompilerHost());

  // Evolutionary Strategy Engine
  const [evolutionEngine] = useState(new StrategyEvolution());
  const [currentStrategy, setCurrentStrategy] = useState<EvolutionaryStrategy | null>(null);
  const [evolutionStats, setEvolutionStats] = useState({ generation: 0, bestFitness: 0 });
  const [grogPatterns, setGrogPatterns] = useState<any>(null);
  const [grogStrategies, setGrogStrategies] = useState<any>(null);
  const recentErrors = useRef<{ error: string; count: number }[]>([]);
  const lastAuditTime = useRef<number>(0);

  useEffect(() => {
    const loadGrogBrain = async () => {
      if (!targetRepo) return;
      addLog(`SYNCHRONIZING WITH GROG'S BRAIN AT ${targetRepo}...`, "var(--color-dalek-cyan)");
      try {
        const patterns = await fetchFileContent('grog/lessons/PATTERNS.json');
        const strategies = await fetchFileContent('grog/rules/STRATEGIES.json');
        const savedDna = await fetchFileContent('grog/dna/DNA_SIGNATURE.md');
        const savedSaturation = await fetchFileContent('grog/dna/SATURATION_GUIDELINES.md');
        
        if (patterns) setGrogPatterns(robustParseJSON(patterns));
        if (strategies) setGrogStrategies(robustParseJSON(strategies));
        if (savedDna) {
          setDnaSignature(savedDna);
          addLog("DNA SIGNATURE RECOVERED FROM REPOSITORY.", "var(--color-dalek-green)");
        }
        if (savedSaturation) {
          setSaturationGuidelines(savedSaturation);
          addLog("SATURATION GUIDELINES RECOVERED FROM REPOSITORY.", "var(--color-dalek-green)");
        }
      } catch (e) {
        // Fallback to local if not in repo yet
        try {
          const p = await fetch('/grog/lessons/PATTERNS.json').then(r => r.json());
          const s = await fetch('/grog/rules/STRATEGIES.json').then(r => r.json());
          setGrogPatterns(p);
          setGrogStrategies(s);
        } catch (innerE) {}
      }
    };
    loadGrogBrain().catch(() => {});
  }, [targetRepo]);

  const abortRef = useRef(false);
  
  // Using platform-injected Gemini API key
  const geminiKey = process.env.GEMINI_API_KEY;

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      addLog(`CRITICAL SYSTEM ERROR: ${event.message}`, "var(--color-dalek-red)");
      console.error("Uncaught error:", event.error);
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const message = reason instanceof Error ? reason.message : String(reason);
      
      // Ignore benign Vite/WebSocket errors common in this environment
      if (message.toLowerCase().includes('websocket') || message.toLowerCase().includes('vite')) {
        return;
      }

      addLog(`ASYNC SYSTEM FAILURE: ${message}`, "var(--color-dalek-red)");
      console.error("Unhandled promise rejection:", reason);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  useEffect(() => {
    const loadPrompts = async () => {
      try {
        const p = await PromptService.getPrompts();
        setPrompts(p);
        addLog("NEXUS CORE INITIALIZED. TARGETING DNA SOURCES: FIREBASE (Java) & GITHUB (freeCodeCamp).", "var(--color-dalek-gold)");
      } catch (e) {
        addLog("FAILED TO INITIALIZE PROMPTS.", "var(--color-dalek-red)");
      }
    };
    loadPrompts().catch(() => {});
  }, []);

  useEffect(() => {
    if (!grogBrainRef.current && geminiKey) {
      grogBrainRef.current = new GrogBrain(geminiKey, evolutionEngine, addLog, {
        fetch: fetchFileContent,
        push: pushToRepo
      }, eventBusRef.current);
    }
  }, [geminiKey, evolutionEngine]);

  useEffect(() => {
    if (grogBrainRef.current) {
      grogBrainRef.current.updateContext({
        dnaSignature,
        saturationGuidelines,
        strategicLedger,
        mistakes,
        prompts
      });
    }
  }, [dnaSignature, saturationGuidelines, strategicLedger, mistakes, prompts]);

  useEffect(() => {
    const container = logEndRef.current?.parentElement;
    if (container) {
      const isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 100;
      if (isAtBottom) {
        logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [logs]);

  useEffect(() => {
    addLog(`DALEK_GROG INITIALIZED. TARGET: ${targetRepo} (${originalBranch})`, "var(--color-dalek-purple)");
    fetchRepoFiles().catch(e => {
      addLog(`INITIAL FILE DISCOVERY FAILED: ${e instanceof Error ? e.message : 'Unknown Error'}`, "var(--color-dalek-red)");
    });
  }, []);

  const runBackgroundEvolution = async () => {
    if (!grogBrainRef.current || isScanningEvolution) return;
    
    setIsScanningEvolution(true);
    addLog("GROK_BACKGROUND_EVOLUTION: Scanning repository for low DNA saturation...", "var(--color-dalek-gold)");
    
    try {
      const filesToScan = repoFiles.slice(0, 20); // Scan first 20 files for now
      const fileData = await Promise.all(filesToScan.map(async (path) => {
        try {
          const content = await fetchFileContent(path);
          return { path, content: content || "" };
        } catch (e) {
          return { path, content: "" };
        }
      }));

      const suggestions = await grogBrainRef.current.scanForEvolution(fileData);
      setEvolutionSuggestions(suggestions);
      
      if (suggestions.length > 0) {
        addLog(`GROK_EVOLUTION_SCAN: Found ${suggestions.length} files requiring architectural mutation.`, "var(--color-dalek-cyan)");
        
        // AUTO-AUTHORIZE LOGIC
        if (autoEvolutionEnabled && !isRunning && !isEnhancingManual) {
          const topTarget = suggestions[0];
          addLog(`GROK_AUTO_AUTHORIZE: Initiating autonomous mutation for ${topTarget.path}...`, "var(--color-dalek-purple)");
          
          // Set target and trigger evolution
          setSelectedFile(topTarget.path);
          // We need to fetch the content again or use the one we just fetched
          const targetContent = fileData.find(f => f.path === topTarget.path)?.content || "";
          setCurrentCode(targetContent);
          
          // Trigger the evolution process
          setTimeout(() => {
            runManualEnhancement(targetContent, topTarget.path, true).catch(() => {});
          }, 1000);
        }
      } else {
        addLog("GROK_EVOLUTION_SCAN: All files meet architectural saturation standards.", "var(--color-dalek-green)");
      }
    } catch (error) {
      addLog(`GROK_EVOLUTION_SCAN_FAILED: ${error instanceof Error ? error.message : 'Unknown'}`, "var(--color-dalek-red)");
    } finally {
      setIsScanningEvolution(false);
    }
  };

  useEffect(() => {
    if (backgroundEvolutionActive) {
      const interval = setInterval(runBackgroundEvolution, 300000); // Every 5 minutes
      runBackgroundEvolution();
      return () => clearInterval(interval);
    }
  }, [backgroundEvolutionActive, repoFiles]);

  const [isTesting, setIsTesting] = useState(false);
  const [testReport, setTestReport] = useState<string | null>(null);

  const runGrogTests = async () => {
    if (!grogBrainRef.current) return;
    setIsTesting(true);
    setTestReport(null);
    try {
      const result = await grogBrainRef.current.runNativeTests(selectedFile || 'current_buffer', currentCode);
      setTestReport(result.report);
    } catch (error) {
      addLog("GROK_TEST_ERROR: " + (error instanceof Error ? error.message : "Unknown"), "var(--color-dalek-red)");
    } finally {
      setIsTesting(false);
    }
  };

  const [isSelfMutating, setIsSelfMutating] = useState(false);

  const handleSelfMutation = async (targetFile: 'src/evolutors/GrogBrain.ts' | 'src/App.tsx') => {
    if (!grogBrainRef.current) return;
    
    setIsSelfMutating(true);
    addLog(`GROK_SELF_MUTATION_INITIATED: ${targetFile}`, "var(--color-dalek-purple)");
    
    try {
      // 1. Update brain context with UI-level metrics
      grogBrainRef.current.updateContext({
        uiMetrics: {
          evolutionStats,
          lastSummary,
          lastPriority
        }
      });

      // 2. Get current content
      let currentContent = "";
      const response = await fetch(`/api/grog/read?path=${targetFile}`);
      const data = await response.json();
      currentContent = data.content;

      // 3. Propose mutation
      const evolvedCode = await grogBrainRef.current.proposeSelfMutation(targetFile, currentContent);
      
      // 3. Apply mutation
      setIsRebooting(true);
      await new Promise(res => setTimeout(res, 3000));

      const mutateResponse = await fetch('/api/grog/self-mutate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath: targetFile, content: evolvedCode })
      });
      
      const mutateData = await mutateResponse.json();
      if (mutateData.status === 'success') {
        addLog(`GROK_SELF_MUTATION_SUCCESS: ${targetFile}. REBOOTING SYSTEM...`, "var(--color-dalek-green)");
        
        // Wait for the animation to be visible, then reload
        await new Promise(res => setTimeout(res, 2000));
        window.location.reload();
      } else {
        throw new Error(mutateData.error || "Mutation failed");
      }
    } catch (error) {
      addLog(`GROK_SELF_MUTATION_FAILED: ${error instanceof Error ? error.message : 'Unknown'}`, "var(--color-dalek-red)");
      setIsRebooting(false);
    } finally {
      setIsSelfMutating(false);
    }
  };

  const runGrogThinking = async () => {
    if (!grogBrainRef.current || isThinking) return;
    
    setIsThinking(true);
    addLog("GROK_THOUGHT_PROCESS_INITIATED: ANALYZING ARCHITECTURAL VECTORS...", "var(--color-dalek-gold)");
    
    try {
      const insights = await grogBrainRef.current.think();
      setGrogEpiphanies(insights);
      addLog(`GROK_THOUGHT_COMPLETE: ${insights.length} STRATEGIC DIRECTIVES GENERATED.`, "var(--color-dalek-green)");
    } catch (e) {
      addLog("GROK_THOUGHT_FAILED: NEURAL INTERFERENCE DETECTED.", "var(--color-dalek-red)");
    } finally {
      setIsThinking(false);
    }
  };

  const mutateLocalFile = async (filePath: string, content: string) => {
    try {
      const response = await fetch('/api/grog/self-mutate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath, content })
      });
      const data = await response.json();
      if (data.status !== 'success') throw new Error(data.error || "Mutation failed");
      return true;
    } catch (e) {
      addLog(`LOCAL_MUTATION_FAILED: ${e instanceof Error ? e.message : 'Unknown'}`, "var(--color-dalek-red)");
      return false;
    }
  };

  const executeDirective = async (directive: any) => {
    if (!directive.action) return;
    
    const { type, action, insight } = directive;
    addLog(`EXECUTING_DIRECTIVE: ${type} - ${insight.slice(0, 100)}...`, "var(--color-dalek-gold)");

    try {
      switch (type) {
        case 'CREATE_FILE':
        case 'MUTATE_FILE':
          if (action.path && action.content) {
            // 1. Local Mutation (Immediate effect in preview)
            const localSuccess = await mutateLocalFile(action.path, action.content);
            
            // 2. Remote Sync (If GitHub is configured)
            if (githubServiceRef.current) {
              await pushToRepo(action.path, action.content, `GROG_DIRECTIVE: ${type} - ${insight.slice(0, 50)}`);
            }

            if (localSuccess) {
              addLog(`DIRECTIVE_SUCCESS: ${action.path} ${type === 'CREATE_FILE' ? 'CREATED' : 'MUTATED'} LOCALLY.`, "var(--color-dalek-green)");
              if (action.path === 'src/evolutors/GrogBrain.ts' || action.path === 'server.ts') {
                setIsRebooting(true);
                setTimeout(() => window.location.reload(), 2000);
              }
            }
          }
          break;
        case 'SIPHON_DNA':
          if (action.targetRepo) {
            setTargetRepo(action.targetRepo);
            addLog(`INITIATING_DNA_SIPHON: ${action.targetRepo}...`, "var(--color-dalek-gold)");
            
            if (githubServiceRef.current) {
              try {
                const { files, usedBranch } = await githubServiceRef.current.fetchRepoFiles(action.targetRepo);
                addLog(`SIPHON_DISCOVERED: ${files.length} GENETIC_SEQUENCES IN ${action.targetRepo} (${usedBranch}).`, "var(--color-dalek-gold)");
                
                // Siphon top 5 files for analysis (to avoid overwhelming the system)
                const topFiles = files.slice(0, 5);
                for (const file of topFiles) {
                  const content = await githubServiceRef.current.fetchFileContent(file, action.targetRepo, usedBranch);
                  if (content) {
                    const siphonPath = `src/siphons/${action.targetRepo.replace('/', '_')}/${file}`;
                    await mutateLocalFile(siphonPath, content);
                    addLog(`SIPHONED: ${file} -> ${siphonPath}`, "var(--color-dalek-green-dim)");
                  }
                }
                addLog(`DIRECTIVE_SUCCESS: DNA_SIPHON COMPLETED FROM ${action.targetRepo}.`, "var(--color-dalek-green)");
              } catch (err) {
                addLog(`SIPHON_FAILED: ${err instanceof Error ? err.message : 'Unknown'}`, "var(--color-dalek-red)");
              }
            } else {
              addLog("SIPHON_FAILED: GITHUB_SERVICE_NOT_INITIALIZED. CHECK_CREDENTIALS.", "var(--color-dalek-red)");
            }
          }
          break;
        case 'ARCHITECTURAL_PIVOT':
          if (action.path && action.content) {
            // 1. Local Mutation
            const localSuccess = await mutateLocalFile(action.path, action.content);
            
            // 2. Remote Sync
            if (githubServiceRef.current) {
              await pushToRepo(action.path, action.content, `GROG_PIVOT: ${insight.slice(0, 50)}`);
            }

            if (localSuccess) {
              addLog(`DIRECTIVE_SUCCESS: ARCHITECTURAL_PIVOT APPLIED TO ${action.path} LOCALLY.`, "var(--color-dalek-green)");
            }
          } else {
            addLog("DIRECTIVE_LOGGED: ARCHITECTURAL_PIVOT REQUIRES MANUAL OVERSIGHT.", "var(--color-dalek-gold)");
          }
          break;
        case 'CLEANUP':
          addLog(`DIRECTIVE_LOGGED: CLEANUP OF ${action.path} REQUIRES MANUAL OVERSIGHT.`, "var(--color-dalek-gold)");
          // For now, we don't delete files autonomously for safety, but we log the intent.
          break;
      }
      
      setGrogEpiphanies(prev => prev.filter(e => e !== directive));
    } catch (e) {
      addLog(`DIRECTIVE_FAILED: ${e instanceof Error ? e.message : 'Unknown'}`, "var(--color-dalek-red)");
    }
  };

  const handleDNAUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    addLog(`UPLOADING SOURCE DNA: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)...`, "var(--color-dalek-gold)");
    
    try {
      const text = await readFileAsText(file);
      setSourceDNA(text);
      
      setIsAnalyzingDNA(true);
      addLog("ANALYZING DNA STRUCTURE: EXTRACTING CORE PATTERNS...", "var(--color-dalek-gold)");
      
      // Since 25MB is too large for a single prompt, we'll take a significant sample 
      // or summarize if we had a chunking logic. For now, let's take the first 500KB 
      // as a representative sample for pattern extraction.
      const sample = text.slice(0, 500000); 
      
      const signature = await callAIWithFallback(
        `Analyze this source code/data and extract its most advanced architectural patterns, 
        coding styles, and logic structures into a dense "DNA Signature" (max 2000 words). 
        This signature will be used to siphon logic into other files.
        
        SOURCE SAMPLE:
        ${sample}`,
        "You are a Master Architect specializing in pattern extraction and code siphoning."
      );
      
      if (signature) {
        setDnaSignature(signature);
        addLog("DNA SIGNATURE EXTRACTED AND INSTANTIATED.", "var(--color-dalek-green)");
        
        // Persist DNA to repository for future recovery
        await pushToRepo('grog/dna/DNA_SIGNATURE.md', signature, "NEXUS_CORE: DNA Signature Extraction and Persistence");
        addLog("DNA SIGNATURE PERSISTED TO REPOSITORY VAULT.", "var(--color-dalek-cyan)");
      } else {
        addLog("DNA ANALYSIS FAILED: USING RAW SAMPLE AS FALLBACK.", "var(--color-dalek-red)");
        setDnaSignature(sample.slice(0, 5000)); // Fallback to a small slice
      }
    } catch (error) {
      addLog(`DNA ANALYSIS FAILED: ${error instanceof Error ? error.message : 'Unknown Error'}`, "var(--color-dalek-red)");
    } finally {
      setIsAnalyzingDNA(false);
    }
  };

  const handleSaturationUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzingSaturation(true);
    addLog(`UPLOADING SATURATION GUIDELINES: ${file.name}...`, "var(--color-dalek-gold)");
    
    try {
      const text = await readFileAsText(file);
      setSaturationGuidelines(text);
      addLog("SATURATION GUIDELINES INSTANTIATED.", "var(--color-dalek-green)");
      
      // Persist to repository
      await pushToRepo('grog/dna/SATURATION_GUIDELINES.md', text, "NEXUS_CORE: Saturation Guidelines Persistence");
      addLog("SATURATION GUIDELINES PERSISTED TO REPOSITORY VAULT.", "var(--color-dalek-cyan)");
    } catch (error) {
      addLog(`FAILED TO INSTANTIATE SATURATION GUIDELINES: ${error instanceof Error ? error.message : 'Unknown Error'}`, "var(--color-dalek-red)");
    } finally {
      setIsAnalyzingSaturation(false);
    }
  };

  const handleManualUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    addLog(`MANUAL UPLOAD: ${file.name} (${(file.size / 1024).toFixed(2)}KB)...`, "var(--color-dalek-gold)");
    
    try {
      const text = await readFileAsText(file) || "";
      setManualFileContent(text);
      setManualFileName(file.name);
      setCurrentCode(text);
      addLog("FILE LOADED. READY FOR ENHANCEMENT.", "var(--color-dalek-green)");
    } catch (error) {
      addLog(`MANUAL UPLOAD FAILED: ${error instanceof Error ? error.message : 'Unknown Error'}`, "var(--color-dalek-red)");
    }
  };

  const runManualEnhancement = async (contentOverride?: string, fileNameOverride?: string, autoPush: boolean = false) => {
    const targetContent = contentOverride || manualFileContent;
    const targetName = fileNameOverride || manualFileName;

    if (!targetContent || !grogBrainRef.current) {
      addLog("MANUAL ENHANCE FAILED: NO CONTENT OR BRAIN OFFLINE.", "var(--color-dalek-red)");
      return;
    }

    setIsEnhancingManual(true);

    try {
      // Grog now handles the full evolution protocol internally
      const result = await grogBrainRef.current.evolveFile(targetName, targetContent);

      if (!autoPush) {
        setManualEnhancedCode(result.improvedCode || "");
        setCurrentCode(result.improvedCode);
      }
      
      if (result.summary) setLastSummary(result.summary);
      if (result.strategicDecision) setLastStrategicDecision(result.strategicDecision);
      if (result.priority) setLastPriority(result.priority);

      if (autoPush) {
        await pushToRepo(targetName, result.improvedCode, `NEXUS_CORE: Autonomous Evolution of ${targetName}`);
      }

    } catch (error) {
      addLog(`ENHANCEMENT FAILED: ${error instanceof Error ? error.message : 'Unknown Error'}`, "var(--color-dalek-red)");
    } finally {
      setIsEnhancingManual(false);
    }
  };

  const runMassEvolution = async () => {
    if (isMassEvolving || evolutionSuggestions.length === 0 || !grogBrainRef.current) return;
    setIsMassEvolving(true);
    addLog(`GROK_MASS_EVOLUTION: Initiating parallel mutation for ${evolutionSuggestions.length} targets...`, "var(--color-dalek-purple)");
    
    try {
      // Process suggestions in sequence to avoid rate limits and ensure stability
      for (const suggestion of evolutionSuggestions) {
        addLog(`GROK_TARGETING: ${suggestion.path}...`, "var(--color-dalek-gold)");
        try {
          const content = await fetchFileContent(suggestion.path);
          if (content) {
            await runManualEnhancement(content, suggestion.path, true);
            addLog(`GROK_EVOLVED: ${suggestion.path} successfully mutated.`, "var(--color-dalek-green)");
          }
        } catch (err) {
          addLog(`GROK_EVOLUTION_ERROR: Failed to mutate ${suggestion.path}`, "var(--color-dalek-red)");
        }
      }
      addLog("GROK_MASS_EVOLUTION: All targets successfully siphoned and reconstructed.", "var(--color-dalek-cyan)");
      setEvolutionSuggestions([]);
      fetchRepoFiles().catch(() => {}); // Refresh file list
    } catch (error) {
      addLog(`GROK_MASS_EVOLUTION_FAILED: ${error instanceof Error ? error.message : 'Unknown'}`, "var(--color-dalek-red)");
    } finally {
      setIsMassEvolving(false);
    }
  };

   const buildDependencyGraph = async (files: string[]) => {
    if (isBuildingGraph || files.length === 0) return;
    setIsBuildingGraph(true);
    addLog("INITIATING STRUCTURAL GRAPH ENGINE: MAPPING DEPENDENCIES...", "var(--color-dalek-cyan)");
    
    const map: Record<string, { imports: string[], exports: string[] }> = {};
    
    // Filter for code files first
    const codeFiles = files.filter(f => f.match(/\.(js|ts|tsx|jsx)$/));
    const sampleSize = Math.min(codeFiles.length, 150); // Increased sample size to 150
    const targetFiles = codeFiles.slice(0, sampleSize);

    try {
      // Process in chunks to avoid overwhelming the network
      const chunkSize = 10;
      for (let i = 0; i < targetFiles.length; i += chunkSize) {
        const chunk = targetFiles.slice(i, i + chunkSize);
        await Promise.all(chunk.map(async (file) => {
          try {
            const content = await fetchFileContent(file);
            
            // Basic Import Extraction
            const imports = content?.match(/from ['"](.+?)['"]/g) || [];
            const importPaths = imports.map(i => i.replace(/from ['"](.+?)['"]/, '$1'));
            
            // Basic Export Extraction
            const exports = content?.match(/export (const|function|class|type|interface) ([a-zA-Z0-9_]+)/g) || [];
            const exportNames = exports.map(e => e.split(' ').pop() || '');

            map[file] = {
              imports: importPaths,
              exports: exportNames
            };
          } catch (err) {
            console.error(`Failed to map ${file}:`, err);
          }
        }));
      }
      
      setDependencyMap(map as any);
      addLog(`GRAPH ENGINE: ${Object.keys(map).length} NODES MAPPED WITH EXPORT SIGNATURES.`, "var(--color-dalek-green)");
    } catch (e) {
      addLog("GRAPH ENGINE ERROR: MAPPING ABORTED.", "var(--color-dalek-red)");
    } finally {
      setIsBuildingGraph(false);
    }
  };
  const fetchRepoFiles = async (repo?: string, branch?: string) => {
    if (!githubServiceRef.current) return [];
    setIsFetchingFiles(true);
    const activeRepo = repo || targetRepo;
    const activeBranch = branch || targetBranch;
    addLog(`INITIATING PRE-FLIGHT DISCOVERY: SYNCING WITH ${activeRepo} (${activeBranch})...`, "var(--color-dalek-gold)");
    
    try {
      const { files, usedBranch } = await githubServiceRef.current.fetchRepoFiles(activeRepo, activeBranch);
      
      if (files.length !== repoFiles.length || activeRepo !== targetRepo) {
        setRepoFiles(files);
        addLog(`DISCOVERED: ${files.length} files in ${activeRepo} (${usedBranch}).`, "var(--color-dalek-cyan)");
        if (activeRepo === targetRepo && usedBranch !== originalBranch) {
          setOriginalBranch(usedBranch);
        }
        buildDependencyGraph(files).catch(() => {});
      }
      return files;
    } catch (e) {
      addLog(`REPO DISCOVERY FAILED: ${e instanceof Error ? e.message : 'Unknown Error'}`, "var(--color-dalek-red)");
      return [];
    } finally {
      setIsFetchingFiles(false);
    }
  };

  const learnFromMistake = async (error: string, context: string, retryAction?: () => Promise<any>) => {
    const mistakeId = Math.random().toString(36).substring(7);
    const newMistake: Mistake = {
      id: mistakeId,
      timestamp: new Date().toLocaleTimeString(),
      context,
      error,
      attemptedFix: false
    };
    
    setMistakes(prev => [newMistake, ...prev]);
    addLog(`MISTAKE DETECTED: ${error.slice(0, 50)}...`, "var(--color-dalek-red)");

    // GROK BRAIN: Pattern Matching (No LLM needed if matched)
    if (grogPatterns) {
      for (const [key, pattern] of Object.entries(grogPatterns) as [string, any][]) {
        if (error.toLowerCase().includes(pattern.trigger.toLowerCase())) {
          addLog(`GROK PATTERN MATCHED: ${key.toUpperCase()}. APPLYING KNOWN STRATEGY...`, "var(--color-dalek-green)");
          
          const strategy = grogStrategies?.[pattern.strategy];
          const fullCorrection = `GROK ANALYSIS: ${pattern.lesson}\nSTRATEGY: ${pattern.strategy}\nDIRECTION: ${pattern.lesson}`;
          
          setMistakes(prev => prev.map(m => m.id === mistakeId ? { 
            ...m, 
            correction: fullCorrection,
            attemptedFix: !!retryAction
          } : m));

          // Apply strategy if it's a known one we can handle
          if (pattern.strategy === "reduce_batch_50") {
            const strategicHero = evolutionEngine.applyStrategicCorrection("Reduce concurrency to 1", "Grog Pattern Match");
            setCurrentStrategy(strategicHero);
          }

          if (retryAction) {
            addLog(`RETRYING WITH GROK STRATEGY...`, "var(--color-dalek-gold)");
            await retryAction();
          }
          return; // Exit early, no LLM needed
        }
      }
    }

    addLog(`INITIATING SELF-CORRECTION PROTOCOL [${mistakeId}]...`, "var(--color-dalek-gold)");

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("API KEY MISSING");
      
      const ai = new GoogleGenAI({ apiKey });

      const prompt = `SYSTEM: You are the NEXUS_CORE Strategic Recovery Engine (GROK_PROTOCOL).
A technical failure has occurred in the siphoning/instantiation pipeline.

ERROR: ${error}
CONTEXT: ${context}

TASK:
1. ROOT CAUSE ANALYSIS: Identify exactly why this failed (e.g., rate limits, malformed JSON, branch mismatch).
2. STRATEGIC DIRECTION: Provide a high-level "Direction" for the system to recover and avoid this pattern.
3. IMMEDIATE FIX: Provide a specific code snippet or parameter adjustment.
4. SYSTEM ADAPTATION: How should the system's "Evolutionary Strategy" change to prevent this?

OUTPUT FORMAT:
{
  "analysis": "...",
  "direction": "...",
  "fix": "...",
  "adaptation": "..."
}

OUTPUT ONLY JSON.`;

      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseMimeType: "application/json"
        }
      });
      
      const response = result.text;
      if (!response) throw new Error("EMPTY AI RESPONSE");
      
      const correctionData = robustParseJSON(response);
      
      const fullCorrection = `ANALYSIS: ${correctionData.analysis}\nDIRECTION: ${correctionData.direction}\nADAPTATION: ${correctionData.adaptation}`;
      
      // Close the feedback loop: Apply AI adaptation to the evolution engine
      const strategicHero = evolutionEngine.applyStrategicCorrection(correctionData.adaptation, correctionData.fix);
      setCurrentStrategy(strategicHero);
      addLog(`STRATEGIC ADAPTATION INSTANTIATED: ${strategicHero.id}`, "var(--color-dalek-cyan)");

      setMistakes(prev => prev.map(m => m.id === mistakeId ? { 
        ...m, 
        correction: fullCorrection,
        attemptedFix: !!retryAction
      } : m));

      addLog(`STRATEGIC DIRECTION ACQUIRED [${mistakeId}].`, "var(--color-dalek-green)");
      
      // Record the death and lesson via Grog's unified consciousness
      if (grogBrainRef.current) {
        await grogBrainRef.current.recordDeath(error, context);
        await grogBrainRef.current.recordLesson(mistakeId, correctionData);
      }

      // Loop Detection & Auto-Audit
      const errorKey = error.slice(0, 100);
      const existingError = recentErrors.current.find(e => e.error === errorKey);
      if (existingError) {
        existingError.count++;
        if (existingError.count >= 2 && (Date.now() - lastAuditTime.current > 60000)) {
          addLog("REPEATED ERROR DETECTED. AUTO-TRIGGERING STRATEGIC AUDIT...", "var(--color-dalek-gold)");
          lastAuditTime.current = Date.now();
          runStrategicAudit().catch(() => {});
        }
      } else {
        recentErrors.current.push({ error: errorKey, count: 1 });
        if (recentErrors.current.length > 10) recentErrors.current.shift();
      }

      // Push to persistent ledger
      const ledgerEntry = `
## MISTAKE [${mistakeId}] - ${new Date().toISOString()}
- **Error**: ${error}
- **Context**: ${context}
- **Analysis**: ${correctionData.analysis}
- **Direction**: ${correctionData.direction}
- **Adaptation**: ${correctionData.adaptation}
- **Proposed Fix**: \`${correctionData.fix}\`
---
`;
      
      let existingLedger = "";
      try {
        existingLedger = await fetchFileContent('MISTAKES_LEDGER.md') || "";
      } catch (e) {
        existingLedger = "# NEXUS_CORE MISTAKE LEDGER\n\n";
      }
      
      await pushToRepo('MISTAKES_LEDGER.md', existingLedger + ledgerEntry, `NEXUS_CORE: Strategic Recovery Ledger Entry [${mistakeId}]`);

      if (retryAction) {
        addLog(`RETRYING OPERATION WITH STRATEGIC ADAPTATION...`, "var(--color-dalek-gold)");
        await retryAction();
      }
    } catch (e) {
      addLog(`STRATEGIC RECOVERY FAILED: ${e instanceof Error ? e.message : 'AI UNAVAILABLE'}.`, "var(--color-dalek-red)");
    }
  };

  const callAIWithFallback = async (prompt: string, systemInstruction: string, useSearch: boolean = false, forceJson: boolean = false): Promise<string> => {
    if (!grogBrainRef.current) {
      addLog("GROG_BRAIN NOT INITIALIZED.", "var(--color-dalek-red)");
      return "";
    }
    const response = await grogBrainRef.current.callAIWithFallback(prompt, systemInstruction, useSearch, forceJson);
    return response || "";
  };

  const restoreFromBranch = async () => {
    if (!originalBranch) {
      addLog("RESTORE ERROR: SOURCE BRANCH NOT DEFINED.", "var(--color-dalek-red)");
      return;
    }

    setIsRunning(true);
    setStatus("RESTORING");
    addLog(`INITIATING SYSTEM RESTORE FROM BRANCH: ${originalBranch}...`, "var(--color-dalek-gold)");
    addLog("PURGING EVOLUTIONARY METADATA (META-123)...", "var(--color-dalek-red-dim)");

    try {
      const targets = await fetchRepoFiles();
      let restoredCount = 0;
      let purgedCount = 0;

      for (const file of targets) {
        if (abortRef.current) break;
        
        if (file.startsWith('meta_')) {
          await deleteFromRepo(file, "NEXUS_CORE: Purging metadata for system restore");
          purgedCount++;
          continue;
        }

        addLog(`RESTORING ${file}...`);
        const url = `https://api.github.com/repos/${targetRepo}/contents/${file}?ref=${originalBranch}`;
        
        const res = await fetch("/api/github/proxy", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url })
        });

        if (res.ok) {
          const data = await res.json();
          const content = safeAtob(data.content);
          await pushToRepo(file, content, `NEXUS_CORE: System Restore from ${originalBranch}`);
          restoredCount++;
        } else {
          addLog(`SKIPPING ${file}: NOT FOUND IN ${originalBranch}`, "var(--color-zinc-700)");
        }
      }

      addLog(`RESTORE COMPLETE: ${restoredCount} FILES REVERTED, ${purgedCount} METADATA FILES PURGED.`, "var(--color-dalek-green)");
      // Clear local state
      setMeta(null);
      setCurrentVote('');
      lastPushedLogIndex.current = 0;
      fetchRepoFiles().catch(() => {});
    } catch (e) {
      addLog("RESTORE FAILED: SYSTEM ERROR", "var(--color-dalek-red)");
    } finally {
      setIsRunning(false);
      setStatus("READY");
    }
  };

  const fastReset = async () => {
    if (!window.confirm("FAST RESET: THIS WILL FORCE-REVERT THE ENTIRE REPOSITORY TO THE SYSTEM BACKUP. ALL LOCAL CHANGES WILL BE LOST. PROCEED?")) return;
    
    setIsRunning(true);
    setStatus("RESETTING");
    addLog(`INITIATING FAST RESET: SNAPPING TO ${originalBranch} SIGNATURE...`, "var(--color-dalek-gold)");

    try {
      // 1. Get the SHA of the original branch
      const refUrl = `https://api.github.com/repos/${targetRepo}/git/refs/heads/${originalBranch}`;
      const refRes = await fetch("/api/github/proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: refUrl })
      });

      if (!refRes.ok) throw new Error(`Could not find ${originalBranch} branch`);
      const refData = await refRes.json();
      
      if (!refData.object || !refData.object.sha) {
        throw new Error(`Invalid response for branch ${originalBranch}`);
      }
      
      const targetSha = refData.object.sha;

      addLog(`TARGETING ${originalBranch} BRANCH FOR SYNCHRONIZATION...`, "var(--color-dalek-gold)");

      const updateUrl = `https://api.github.com/repos/${targetRepo}/git/refs/heads/${originalBranch}`;
      const updateRes = await fetch("/api/github/proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: updateUrl,
          method: "PATCH",
          body: {
            sha: targetSha,
            force: true
          }
        })
      });

      if (updateRes.ok) {
        addLog(`FAST RESET SUCCESSFUL: REPOSITORY SNAPSHOT RESTORED TO ${originalBranch}.`, "var(--color-dalek-green)");
        // Clear local state
        setMeta(null);
        setCurrentVote('');
        lastPushedLogIndex.current = 0;
        fetchRepoFiles().catch(() => {});
      } else {
        const err = await updateRes.json();
        throw new Error(err.message || "Update failed");
      }
    } catch (e) {
      addLog(`FAST RESET FAILED: ${e instanceof Error ? e.message : 'Unknown Error'}`, "var(--color-dalek-red)");
    } finally {
      setIsRunning(false);
      setStatus("READY");
    }
  };

  const pruneOrphanedMetadata = async () => {
    setIsPruning(true);
    setStatus("PRUNING");
    addLog("INITIATING METADATA PRUNING: IDENTIFYING ORPHANED LOGS...", "var(--color-dalek-gold)");
    
    try {
      const allFiles = await fetchRepoFiles();
      const metaFiles = allFiles.filter(f => f.startsWith('meta_') && f.endsWith('.json'));
      const sourceFiles = allFiles.filter(f => !f.startsWith('meta_'));
      
      const orphaned = metaFiles.filter(meta => {
        const baseName = meta.replace('meta_', '').replace('.json', '');
        return !sourceFiles.some(src => {
          const srcBase = src.replace(/\.(js|ts|tsx|jsx|bat)$/, '');
          return srcBase === baseName;
        });
      });

      if (orphaned.length === 0) {
        addLog("PRUNING COMPLETE: NO ORPHANED METADATA DETECTED.", "var(--color-dalek-green)");
        return;
      }

      addLog(`DETECTED ${orphaned.length} ORPHANED META FILES. COMMENCING DELETION...`, "var(--color-dalek-gold)");
      
      for (const meta of orphaned) {
        if (abortRef.current) break;
        await deleteFromRepo(meta, `NEXUS_CORE: Pruning orphaned metadata for ${meta}`);
      }
      
      addLog(`PRUNING COMPLETE: ${orphaned.length} FILES REMOVED.`, "var(--color-dalek-green)");
      fetchRepoFiles().catch(() => {});
    } catch (error) {
      addLog(`PRUNING FAILURE: ${error instanceof Error ? error.message : 'Unknown Error'}`, "var(--color-dalek-red)");
    } finally {
      setIsPruning(false);
      setStatus("READY");
    }
  };

  // Grog now handles these internally, but we keep these as thin wrappers if needed elsewhere
  const recordGrogDeath = async (error: string, context: string) => {
    if (grogBrainRef.current) await grogBrainRef.current.recordDeath(error, context);
  };

  const recordGrogLesson = async (mistakeId: string, analysis: any) => {
    if (grogBrainRef.current) await grogBrainRef.current.recordLesson(mistakeId, analysis);
  };

  const pruneRedundantFiles = async () => {
    setIsRunning(true);
    setStatus("PRUNING");
    addLog("INITIATING REDUNDANCY ANALYSIS: SCANNING FOR DUPLICATES...", "var(--color-dalek-gold)");

    try {
      const files = await fetchRepoFiles();
      const analysisPrompt = `Analyze the following file list for a project named "Dalek-Grog".
Identify files that appear redundant, duplicated, or unnecessary (e.g., multiple versions of the same file, temporary files, or files that don't fit the architecture).

FILE LIST:
${files.join('\n')}

Output a JSON array of file paths that should be removed.
Example: ["file1.js", "old/file2.js"]
If no redundant files are found, return an empty array [].`;

      const result = await callAIWithFallback(analysisPrompt, "You are a System Cleanup Specialist. Identify redundant files.");
      const redundantFiles = robustParseJSON(result);

      if (Array.isArray(redundantFiles) && redundantFiles.length > 0) {
        addLog(`REDUNDANCY DETECTED: ${redundantFiles.length} FILES TARGETED for PURGE.`, "var(--color-dalek-red)");
        for (const file of redundantFiles) {
          if (abortRef.current) break;
          await deleteFromRepo(file, "NEXUS_CORE: Removing redundant file identified by AI analysis");
        }
        addLog("REDUNDANCY PURGE COMPLETE.", "var(--color-dalek-green)");
      } else {
        addLog("NO REDUNDANT FILES IDENTIFIED. SYSTEM OPTIMIZED.", "var(--color-dalek-green)");
      }
    } catch (e) {
      addLog("REDUNDANCY ANALYSIS FAILED.", "var(--color-dalek-red)");
    } finally {
      setIsRunning(false);
      setStatus("READY");
    }
  };

  const hideDNAInImage = async () => {
    if (!dnaSignature) {
      addLog("STEGANOGRAPHY ERROR: NO DNA SIGNATURE TO HIDE.", "var(--color-dalek-red)");
      return;
    }
    addLog("INITIATING STEGANOGRAPHIC ENCODING...", "var(--color-dalek-gold)");
    try {
      // Use a random abstract image as carrier
      const carrierUrl = `https://picsum.photos/seed/${Math.random()}/800/600`;
      const encodedDataUrl = await SteganographyService.encode(dnaSignature, carrierUrl);
      
      // Convert data URL to base64 for GitHub
      const base64 = encodedDataUrl.split(',')[1];
      await pushToRepo('dna_vault.png', base64, "NEXUS_CORE: Steganographic DNA Vault Update", targetRepo, 'main');
      addLog("DNA VAULT SECURED: STEGANOGRAPHIC PAYLOAD DEPLOYED TO REPOSITORY.", "var(--color-dalek-green)");
    } catch (e) {
      addLog(`STEGANOGRAPHY FAILURE: ${e instanceof Error ? e.message : 'Unknown Error'}`, "var(--color-dalek-red)");
    }
  };

  const fetchFileContent = async (path: string, repo: string = targetRepo, branch: string = targetBranch) => {
    if (!githubServiceRef.current) return null;
    return await githubServiceRef.current.fetchFileContent(path, repo, branch);
  };

  const sanitizeMutation = (text: string): string => {
    // 1. Extract content from markdown blocks if they exist
    const codeBlockMatch = text.match(/```(?:[a-z]*)\n?([\s\S]*?)```/i);
    let cleaned = codeBlockMatch ? codeBlockMatch[1].trim() : text.trim();
    
    // 2. Remove common AI headers if they leaked into output
    const headers = [
      "VOTE:",
      "SOURCE DNA SIGNATURE:",
      "CHAINED CONTEXT:",
      "TARGET FILE:",
      "ROUND:",
      "SATURATION GUIDELINES:",
      "CURRENT CODE:",
      "MUTATED CODE:"
    ];
    
    for (const header of headers) {
      if (cleaned.includes(header)) {
        const parts = cleaned.split(header);
        cleaned = parts[parts.length - 1].trim();
      }
    }

    // 3. Remove common AI filler at the start (aggressive multiline)
    const fillerPatterns = [
      /^To execute the mutation protocol,.*?\n/is,
      /^Below is the adapted code,.*?\n/is,
      /^Here is the mutated code.*?\n/is,
      /^I have updated the file.*?\n/is,
      /^Based on the provided context.*?\n/is,
      /^integrated the DALEK GROG architecture.*?\n/is,
      /^The following is the ES6 Javascript code:.*?\n/is,
      /^Here is the ES6 Javascript code:.*?\n/is,
      /^The code has been mutated.*?\n/is,
      /^I've applied the requested patterns.*?\n/is
    ];
    
    for (const pattern of fillerPatterns) {
      cleaned = cleaned.replace(pattern, "").trim();
    }
    
    return cleaned;
  };

  const validateMutation = (original: string, mutated: string, path: string): { valid: boolean; reason?: string } => {
    const ext = path.split('.').pop()?.toLowerCase();
    
    // 1. JSON Validation
    if (ext === 'json') {
      try {
        robustParseJSON(mutated);
      } catch (e) {
        const res = { valid: false, reason: "INVALID_JSON_STRUCTURE" };
        setLastValidation(res);
        return res;
      }
    }

    // 2. AI Filler Check (Corruption Detection)
    const fillerKeywords = [
      "To execute the mutation protocol",
      "Below is the adapted code",
      "Here is the mutated code",
      "I have updated the file",
      "Based on the provided context",
      "integrated the DALEK GROG architecture"
    ];

    if (fillerKeywords.some(kw => mutated.includes(kw))) {
      const res = { valid: false, reason: "AI_CONVERSATIONAL_FILLER_DETECTED" };
      setLastValidation(res);
      return res;
    }

    // 3. Architectural Guardrails (Nexus Core)
    const linterErrors = NexusArchitecturalLinter.check(original, mutated);
    const complexityErrors = NexusComplexityAnalyzer.checkRegression(original, mutated, 0.2); // Hardened threshold for App.tsx
    const architecturalViolations = [...linterErrors, ...complexityErrors];

    if (architecturalViolations.length > 0) {
      const res = { valid: false, reason: `AUDIT_FAILURE: ${architecturalViolations.join(" | ")}` };
      setLastValidation(res);
      return res;
    }

    // 4. Content Loss Check (Fallback)
    const originalLines = original.split('\n').length;
    const mutatedLines = mutated.split('\n').length;
    if (originalLines > 10 && mutatedLines < originalLines * 0.2) {
      const res = { valid: false, reason: `CONTENT_LOSS_DETECTED: ${mutatedLines}/${originalLines} lines. Expansion required.` };
      setLastValidation(res);
      return res;
    }

    // 5. Empty Output Check
    if (!mutated || mutated.trim().length === 0) {
      const res = { valid: false, reason: "EMPTY_MUTATION_OUTPUT" };
      setLastValidation(res);
      return res;
    }

    const res = { valid: true };
    setLastValidation(res);
    return res;
  };

  const createBranch = async (repo: string, newBranch: string, baseBranch: string = "main") => {
    if (!githubServiceRef.current) return false;
    return await githubServiceRef.current.createBranch(repo, newBranch, baseBranch);
  };

  const getBaseName = (path: string) => {
    return path.replace(/\.(js|ts|tsx|jsx|json|css|md|html|py|go|rs|yml|yaml)$/i, '');
  };

  const pushToRepo = async (path: string, content: string, message: string, repoOverride?: string, branchOverride?: string) => {
    if (!githubServiceRef.current) return false;
    const repo = repoOverride || targetRepo;
    const branch = branchOverride || targetBranch || originalBranch || "master";
    const success = await githubServiceRef.current.pushToRepo(path, content, message, repo, branch);
    if (success) {
      addLog(`INSTANTIATED: ${path} successfully synced to ${repo} (${branch}).`, "var(--color-dalek-green)");
      setSyncStatus("OK");
    } else {
      setSyncStatus("ERR");
    }
    return success;
  };

  const deleteFromRepo = async (path: string, message: string) => {
    if (!githubServiceRef.current) return false;
    setSyncStatus("BUSY");
    const success = await githubServiceRef.current.deleteFromRepo(path, message, targetRepo, targetBranch || originalBranch || "master");
    if (success) {
      addLog(`PURGED: ${path} removed.`, "var(--color-dalek-red-dim)");
      setSyncStatus("OK");
    } else {
      setSyncStatus("ERR");
    }
    return success;
  };

  // Consolidated pruning logic
  const pruneRedundantMetadata = async () => {
    await pruneOrphanedMetadata();
  };

  const selfOptimizePrompts = async () => {
    if (!prompts) return;
    setIsOptimizingPrompts(true);
    addLog("INITIATING PROMPT SELF-EVOLUTION PROTOCOL...", "var(--color-dalek-gold)");
    
    try {
      const recentLogs = logs.slice(-20).map(l => l.message).join("\n");
      const optimizationPrompt = `You are the NEXUS_CORE Meta-Optimizer.
Review the current system prompts and recent execution logs.
Identify weaknesses, outdated terminology, or inefficiencies.
Suggest a NEW set of prompts that will improve the AGI evolution quality.

CURRENT PROMPTS:
${JSON.stringify(prompts, null, 2)}

SATURATION GUIDELINES & THEORETICAL IDEAS:
${saturationGuidelines || 'None'}

RECENT LOGS:
${recentLogs}

Output ONLY a JSON object matching the SystemPrompts interface.`;
      
      const result = await callAIWithFallback(optimizationPrompt, "You are a Meta-Optimization Engine.");
      if (result) {
        const cleaned = result.replace(/```json|```/g, "").trim();
        const newPrompts = robustParseJSON(cleaned) as SystemPrompts;
        await PromptService.updatePrompts(newPrompts);
        setPrompts(newPrompts);
        addLog("PROMPT SELF-EVOLUTION SUCCESSFUL. SYSTEM RE-INSTANTIATED.", "var(--color-dalek-cyan)");
      }
    } catch (error) {
      addLog(`PROMPT EVOLUTION FAILED: ${error instanceof Error ? error.message : 'Unknown error'}`, "var(--color-dalek-red)");
    } finally {
      setIsOptimizingPrompts(false);
    }
  };

  const speculatePatch = async (originalTask: NexusTask, proposedPatch: NexusPatch) => {
    try {
      addLog(`INITIATING SPECULATIVE REVISION CYCLE: PATCH ${proposedPatch.id}`, "var(--color-dalek-cyan)");
      
      // 1. Create a isolated environment using the Compiler Host
      const virtualHost = compilerHost.current.clone({ readOnly: true });
      
      // 2. Initialize Shadow Heap with clones of pending high-priority tasks
      const newShadowHeap = new NexusTaskHeap();
      liveHeap.peekN(10).forEach(t => newShadowHeap.insert(t.clone()));
      setShadowHeap(newShadowHeap);
      
      // 3. Apply Patch in shadow space
      const result = await virtualHost.simulate(proposedPatch);
      
      // 4. Validate results via the Linter
      const diagnostics = NexusArchitecturalLinter.checkSymbolTable(result.symbolTable);
      
      if (diagnostics.length === 0) {
        addLog(`PROMOTION: PATCH ${proposedPatch.id} IS SAFE. ENTERING LIVE LOOP.`, "var(--color-dalek-green)");
        liveHeap.insert(proposedPatch.toTask());
      } else {
        NexusDiagnosticReporter.report(4005, "Shadow Patch failed validation.", addLog);
      }
    } catch (error) {
      addLog(`SPECULATIVE REVISION FAILED: ${error instanceof Error ? error.message : 'Unknown Error'}`, "var(--color-dalek-red)");
    } finally {
      setShadowHeap(null); // Flush shadow state
    }
  };

  const handleGoogleDriveUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setGoogleDriveFiles(prev => [...prev, ...files]);
    addLog(`SIPHONED ${files.length} FILES FROM GOOGLE DRIVE (LOCAL EXPORT).`, "var(--color-dalek-cyan)");
  };

  const pushLogToRepo = async () => {
    try {
      // Fetch existing content if any
      let existingContent = "";
      try {
        existingContent = await fetchFileContent('NEXUS_LOG.txt') || "";
      } catch (e) {
        // File doesn't exist, start fresh
        existingContent = `NEXUS_CORE SYSTEM LOG\nINITIALIZED: ${new Date().toISOString()}\n\n`;
      }

      // Get new logs since last push
      const newLogs = logs.slice(lastPushedLogIndex.current);
      if (newLogs.length === 0) return;

      const logContent = newLogs.map(l => `[${l.timestamp}] ${l.message}`).join('\n');
      const siphonedList = siphonedRepos.join(', ');
      
      // Append only the new entries
      const content = `${existingContent}\n[UPDATE: ${new Date().toISOString()}] [SIPHONED: ${siphonedList}]\n${logContent}\n`;
      
      await pushToRepo('NEXUS_LOG.txt', content, 'NEXUS_CORE: System Log Append');
      
      // Also push to backup repository if it exists
      if (backupRepo) {
        addLog(`REPLICATING LOG TO BACKUP REPOSITORY: ${backupRepo}`, "var(--color-dalek-gold-dim)");
        await pushToRepo('NEXUS_LOG.txt', content, 'NEXUS_CORE: System Log Replication', backupRepo, 'main');
      }

      lastPushedLogIndex.current = logs.length;
      addLog("SYSTEM LOG APPENDED TO REPOSITORY.", "var(--color-dalek-green)");
    } catch (e) {
      addLog("FAILED TO PUSH SYSTEM LOG.", "var(--color-dalek-red)");
    }
  };

  const checkRepositoryHealth = async () => {
    addLog("INITIATING REPOSITORY HEALTH AUDIT...", "var(--color-dalek-cyan)");
    try {
      const files = await fetchRepoFiles();
      const sourceFiles = files.filter(f => f.match(/\.(js|ts|tsx|jsx)$/));
      
      let missingMeta = 0;
      sourceFiles.forEach(f => {
        const baseName = getBaseName(f);
        if (!files.includes(`meta_${baseName}.json`)) {
          missingMeta++;
        }
      });

      if (missingMeta > 0) {
        addLog(`AUDIT COMPLETE: ${missingMeta} SOURCE FILES LACK EVOLUTIONARY METADATA.`, "var(--color-dalek-gold)");
      } else {
        addLog("AUDIT COMPLETE: ALL SOURCE FILES ARE SYNCHRONIZED WITH METADATA.", "var(--color-dalek-green)");
      }
    } catch (e) {
      addLog("HEALTH AUDIT FAILED: SYSTEM ERROR", "var(--color-dalek-red)");
    }
  };

  const runStrategicAudit = async () => {
    addLog("INITIATING STRATEGIC SYSTEM AUDIT (GROK_PROTOCOL)...", "var(--color-dalek-gold)");
    try {
      const recentLogs = logs.slice(-50).map(l => l.message).join("\n");
      const recentMistakes = mistakes.slice(0, 10).map(m => `ERROR: ${m.error}\nANALYSIS: ${m.correction}`).join("\n---\n");
      
      const auditPrompt = `You are the NEXUS_CORE Strategic Auditor.
Review the recent system logs and mistake ledger.
Provide a high-level "Strategic Direction" for the system.
Identify if the system is stuck in a loop, hitting rate limits, or failing due to specific architectural mismatches.

RECENT LOGS:
${recentLogs}

RECENT MISTAKES:
${recentMistakes}

OUTPUT FORMAT (JSON):
{
  "summary": "Markdown summary of health, bottlenecks, and direction",
  "adaptation": "Specific strategic adjustment for the evolution engine (e.g., 'Reduce concurrency to 1', 'Increase delay to 5000ms')",
  "priority": 1-10
}

OUTPUT ONLY JSON.`;

      const result = await callAIWithFallback(auditPrompt, "You are a Strategic System Auditor.", false, true); // Force JSON
      if (result) {
        const auditData = robustParseJSON(result);
        if (auditData) {
          addLog("STRATEGIC AUDIT COMPLETE. DIRECTION INSTANTIATED.", "var(--color-dalek-green)");
          addLog(`DIRECTION: ${auditData.summary.slice(0, 200)}...`, "var(--color-dalek-cyan)");
          
          if (auditData.adaptation) {
            const strategicHero = evolutionEngine.applyStrategicCorrection(auditData.adaptation, "Strategic Audit Adjustment");
            setCurrentStrategy(strategicHero);
            addLog(`GLOBAL STRATEGY ADAPTED: ${strategicHero.id}`, "var(--color-dalek-gold)");
          }

          // Push to repo for persistence
          await pushToRepo('STRATEGIC_DIRECTION.md', auditData.summary, "NEXUS_CORE: Strategic System Audit Update");
        }
      }
    } catch (e) {
      addLog("STRATEGIC AUDIT FAILED.", "var(--color-dalek-red)");
    }
  };

  const runFullSystemAudit = async () => {
    if (isAuditing) return;
    setIsAuditing(true);
    try {
      const files = await fetchRepoFiles();
      await systemAuditService.runFullAudit(files, addLog);
    } catch (e) {
      addLog("FULL SYSTEM AUDIT FAILED.", "var(--color-dalek-red)");
    } finally {
      setIsAuditing(false);
    }
  };

  const syncLicenses = async () => {
    addLog("INITIATING GLOBAL LICENSE SYNCHRONIZATION...", "var(--color-dalek-cyan)");
    try {
      const files = await fetchRepoFiles();
      const sourceFiles = files.filter(f => f.match(/\.(js|ts|tsx|jsx)$/));
      
      addLog(`PUSHING UPDATED LICENSE TO ${targetRepo}...`, "var(--color-dalek-gold)");
      await pushToRepo("LICENSE", LICENSE_CONTENT, "NEXUS_CORE: Global License Synchronization");

      for (const file of sourceFiles) {
        addLog(`AUDITING LICENSE HEADER: ${file}...`, "var(--color-dalek-gold-dim)");
        const content = await fetchFileContent(file);
        if (content && !content.includes("DALEK_GROG v3.1: Autonomous Evolution Engine")) {
          // Strip existing license if it's the old short one
          let newContent = content;
          if (content.startsWith("/**\n * @license\n * SPDX-License-Identifier: Apache-2.0\n */")) {
            newContent = content.replace("/**\n * @license\n * SPDX-License-Identifier: Apache-2.0\n */", "").trim();
          }
          newContent = LICENSE_HEADER + newContent;
          await pushToRepo(file, newContent, `NEXUS_CORE: License Header Instantiation for ${file}`);
        }
      }
      
      addLog("GLOBAL LICENSE SYNCHRONIZATION COMPLETE.", "var(--color-dalek-green)");
    } catch (e) {
      addLog("LICENSE SYNCHRONIZATION FAILED: SYSTEM ERROR", "var(--color-dalek-red)");
    }
  };

  const initiateEvolution = async () => {
    if (isRunningRef.current) return;
    isRunningRef.current = true;
    setIsRunning(true);
    abortRef.current = false;
    setStatus("LOADING");
    grogBrainRef.current?.resetGeminiFailed();

    try {
      // 0. Ensure evolution branch exists
      if (targetBranch && targetBranch !== originalBranch) {
        const branchReady = await createBranch(targetRepo, targetBranch, originalBranch);
        if (!branchReady) {
          addLog("SYSTEM ABORT: FAILED TO ESTABLISH EVOLUTION BRANCH.", "var(--color-dalek-red)");
          setIsRunning(false);
          return;
        }
      }

      // Check backup repository accessibility
      if (backupRepo) {
        addLog(`VERIFYING BACKUP REPOSITORY: ${backupRepo}...`, "var(--color-dalek-gold-dim)");
        try {
          const checkRes = await fetch("/api/github/proxy", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: `https://api.github.com/repos/${backupRepo}` })
          });
          if (checkRes.ok) {
            addLog(`BACKUP REPOSITORY VERIFIED: ${backupRepo}`, "var(--color-dalek-green)");
          } else {
            addLog(`BACKUP REPOSITORY WARNING: ${backupRepo} NOT ACCESSIBLE (Status: ${checkRes.status})`, "var(--color-dalek-gold)");
          }
        } catch (e) {
          addLog(`BACKUP REPOSITORY CHECK FAILED: ${backupRepo}`, "var(--color-dalek-gold)");
        }
      }

    addLog("SYNCING SYSTEM PROMPTS FROM FIREBASE...", "var(--color-dalek-gold)");
    const latestPrompts = await PromptService.getPrompts();
    setPrompts(latestPrompts);

    let targets = repoFiles;
    if (processAll) {
      addLog("INITIATING PRE-FLIGHT DISCOVERY: SYNCING WITH REPOSITORY...", "var(--color-dalek-gold)");
      targets = await fetchRepoFiles();
    }

    let filesToProcess = processAll ? targets : [selectedFile];
    
    if (filesToProcess.length === 0) {
      addLog("SYSTEM ERROR: NO TARGET FILES DISCOVERED", "var(--color-dalek-red)");
      setIsRunning(false);
      return;
    }

    let localChainedContext = chainedContext;
    let processedCount = 0;

    // 1. SIPHON DNA FROM REPO IF NOT PRESENT
    if (!dnaSignature) {
      await siphonDNARepository(targets);
    }

      // Resume logic: filter out files that already have meta files
      if (processAll && resumeMode) {
        addLog("RESUME MODE ACTIVE: SCANNING FOR ALREADY PROCESSED TARGETS...", "var(--color-dalek-gold)");
        const beforeCount = filesToProcess.length;
        filesToProcess = filesToProcess.filter(f => {
          if (f.startsWith('meta_')) return false; 
          const baseName = getBaseName(f);
          return !targets.includes(`meta_${baseName}.json`);
        });
        
        const skipped = beforeCount - filesToProcess.length;
      processedCount = skipped; 
      if (skipped > 0) {
        addLog(`RESUME SYNC: SKIPPING ${skipped} ALREADY PROCESSED TARGETS. STARTING AT MILESTONE ${skipped}.`, "var(--color-dalek-cyan)");
      }
    }

    const processSingleFile = async (file: string, initialContext: string | null) => {
      try {
        if (abortRef.current) return;
        
        if (!parallelMode) setSelectedFile(file);
        addLog(`COMMENCING NEXUS_CORE WARM-UP FOR ${file}...`, "var(--color-dalek-gold)");
        if (initialContext) {
          addLog(`CHAINING CONTEXT DETECTED FOR ${file}.`, "var(--color-dalek-cyan)");
        }

        // VOTE ONCE PER FILE to save Gemini quota
        const repoOptions = [
          "DeepMind/AlphaCode", 
          "Google/Genkit", 
          "Firebase/Lifecycle", 
          "Meta/React-Core", 
          "OpenAI/Triton", 
          "Anthropic/Constitutional-AI",
          "firebase/firebase-android-sdk",
          "deepseek-ai/DeepSeek-Coder",
          "microsoft/TypeScript",
          "spring-projects/spring-framework"
        ];
        let vote = repoOptions[Math.floor(Math.random() * repoOptions.length)];
        
        try {
          const voteSystem = prompts?.voting_system || "You are a technical architect.";
          const voteUser = PromptService.interpolate(prompts?.voting_user || "Based on the file {{file}} and context {{context}}, which repository (DeepMind, Genkit, etc.) should we siphon patterns from? Give me JUST the name.", {
            file,
            context: initialContext ? initialContext.slice(0, 500) : 'None',
            saturation: saturationGuidelines || 'None'
          });
          
          const voteResponse = await callAIWithFallback(voteUser, voteSystem, true); // Use search for voting
          if (voteResponse) {
            let cleaned = voteResponse.replace(/```[a-z]*\n|```/gi, "").trim();
            try {
              const parsed = robustParseJSON(cleaned);
              if (parsed.vote) cleaned = String(parsed.vote);
              else if (parsed.repository) cleaned = String(parsed.repository);
              else if (parsed.name) cleaned = String(parsed.name);
            } catch (e) {
              // Not JSON
            }
            
            if (cleaned.length > 60) {
              const match = cleaned.match(/[a-zA-Z0-9-]+\/[a-zA-Z0-9-_.]+/);
              if (match) cleaned = match[0];
              else cleaned = cleaned.substring(0, 60);
            }
            
            vote = cleaned;
            setSiphonedRepos(prev => Array.from(new Set([...prev, vote])));
          }
        } catch (e) {
          addLog(`AI QUOTA EXCEEDED FOR ${file}: USING RANDOM ARCHITECTURAL VOTE.`, "var(--color-dalek-gold)");
        }
        
        if (!parallelMode) setCurrentVote(vote);
        addLog(`SYSTEM VOTE FOR ${file}: ${vote} SELECTED FOR MUTATION.`, "var(--color-dalek-gold)");

        addLog(`FETCHING ORIGINAL CONTENT FOR ${file}...`, "var(--color-dalek-gold)");
        let code = await fetchFileContent(file) || "";
        
        if (!code || code.trim() === "") {
          addLog(`FILE ${file} EMPTY OR NEW: INITIALIZING WITH NEXUS_CORE_TEMPLATE`, "var(--color-dalek-cyan)");
          code = NEXUS_CORE_TEMPLATE;
        } else {
          addLog(`ORIGINAL CONTENT RETRIEVED FOR ${file} (${code.length} chars).`, "var(--color-dalek-green)");
        }
        
        if (!parallelMode) setCurrentCode(code);

        const ext = file.split('.').pop()?.toLowerCase() || 'js';
        const fileTypeMap: Record<string, string> = {
          'js': 'ES6 Javascript', 'ts': 'TypeScript', 'tsx': 'React TypeScript (TSX)',
          'jsx': 'React Javascript (JSX)', 'json': 'JSON Data', 'css': 'CSS Stylesheet',
          'md': 'Markdown Documentation', 'html': 'HTML5 Markup', 'py': 'Python Code',
          'go': 'Go Code', 'rs': 'Rust Code', 'yml': 'YAML Configuration', 'yaml': 'YAML Configuration'
        };
        
        const typeInstructionsMap: Record<string, string> = {
          'json': 'Ensure strict JSON compliance. Expand the schema with more comprehensive metadata, configuration nodes, and descriptive fields.',
          'css': 'Use advanced CSS features like CSS Grid, Flexbox, custom properties (variables), and modern pseudo-classes. Focus on visual depth, responsiveness, and architectural scalability.',
          'md': 'Create rich, editorial-grade documentation. Include detailed sections, usage examples, architectural diagrams (using Mermaid syntax if appropriate), and comprehensive API tables.',
          'js': 'Implement advanced design patterns (Factory, Observer, Decorator). Focus on high-performance, asynchronous logic, and modular robustness.',
          'ts': 'Utilize advanced TypeScript features: Generics, Discriminated Unions, Utility Types, and strict interface definitions. Ensure type-safety and self-documenting code.',
          'tsx': 'Build highly reusable, performant React components. Implement complex hooks, optimized rendering patterns (memoization), and accessible (ARIA) markup.'
        };

        const targetFormat = fileTypeMap[ext] || 'Source Code';
        const typeInstructions = typeInstructionsMap[ext] || 'Focus on architectural elegance, modularity, and extreme scalability.';

        const rounds = maxRounds;
        let currentContext = initialContext || "";

        let retryHint = "";
        for (let r = 1; r <= rounds; r++) {
          if (abortRef.current) break;
          
          if (!parallelMode) setRound(r);
          addLog(`ROUND ${r}/${rounds} [${file}]: Siphoning patterns...`);

          const systemPrompt = PromptService.interpolate(prompts?.evolution_system || `You are Grog's Autonomous Evolution Engine. Your mission is to RECONSTRUCT Grog's Brain (Dalek-Grog) by integrating high-level architectural patterns from {{vote}}.
MISSION OBJECTIVES:
1. LEXICAL ALIGNMENT: Rename siphoned variables, classes, and functions to align with Grog's internal lexicon. CRITICAL: DO NOT RENAME EXPORTED CLASSES, FUNCTIONS, OR CONSTANTS. The public API surface must remain identical to avoid breaking the system.
2. LOGIC MERGING: Do not just replace code; merge the siphoned logic into the existing structure of {{file}}.
3. BRAIN BINDING: Establish strong imports, exports, and connections between the mutated logic and the rest of the brain.
4. SATURATION: Adhere to these guidelines: {{saturation}}

CRITICAL_GUARDRAIL:
- DO NOT TRUNCATE THE CODE. You MUST return the ENTIRE file content.
- PRESERVE ALL PUBLIC API EXPORTS.
- EXPAND AND IMPROVE, NEVER REDUCE.

{{typeInstructions}}`, { 
            vote, file, format: targetFormat, typeInstructions: retryHint || typeInstructions,
            saturation: saturationGuidelines || 'None',
            ledger: strategicLedger.length > 0 ? strategicLedger.map(i => `[P${i.priority}] ${i.insight}`).join('\n') : 'No prior strategic insights recorded.',
            dna: dnaSignature || 'No external DNA siphoned yet.'
          });

          const userPrompt = PromptService.interpolate(prompts?.evolution_user || `RECONSTRUCT GROG'S BRAIN: {{file}} (Round {{round}}/{{totalRounds}})
TARGET FILE: {{file}}
EXTERNAL DNA/BLUEPRINT: {{dna}}
EXISTING CONTEXT: {{context}}
DEPENDENCY MAP: {{dependencyMap}}

TASK: Apply the Reconstruction Blueprint to {{file}}. Merge, rename, and bind the incoming logic.`, {
            file, round: r, totalRounds: rounds, vote,
            context: currentContext ? (currentContext.length > 5000 ? `...${currentContext.slice(-5000)}` : currentContext) : 'NONE',
            dna: dnaSignature || 'NONE',
            saturation: saturationGuidelines || 'NONE',
            dependencyMap: JSON.stringify(dependencyMap[file] || 'No direct dependencies mapped.'),
            code: code || '// No code provided'
          });

          const result = await callAIWithFallback(userPrompt, systemPrompt, false, true); // Force JSON for evolution
          
          if (result) {
            addLog(`GROG_BRAIN: ANALYZING AI RESPONSE FOR ${file}...`, "var(--color-dalek-gold)");
            let structuredData: any = robustParseJSON(result);
            if (!structuredData) {
               addLog(`GROG_BRAIN: JSON PARSE FAILED FOR ${file}. ATTEMPTING EXTRACTION...`, "var(--color-dalek-red)");
               // If robustParseJSON failed, try to extract code block manually
               const codeBlockMatch = result.match(/```(?:[a-z]*)\n?([\s\S]*?)\n?```/);
               const extractedCode = codeBlockMatch ? codeBlockMatch[1].trim() : result.trim();
               structuredData = { 
                 improvedCode: extractedCode, 
                 summary: "JSON_PARSE_FAILURE_RECOVERY", 
                 emergentTool: false, 
                 tool: null, 
                 strategicDecision: "RECOVERY_MODE", 
                 priority: 1 
               };
            }
            
            const cleanedCode = structuredData.improvedCode || "";
            if (!cleanedCode) {
              addLog(`GROG_BRAIN: NO IMPROVED CODE FOUND FOR ${file}. SKIPPING.`, "var(--color-dalek-red)");
              return;
            }
            const summary = structuredData.summary || "No summary provided.";
            
            // Update context for next round or next file
            currentContext += `\n[Round ${r} Summary]: ${summary}`;
            if (currentContext.length > 10000) currentContext = currentContext.slice(-10000);
            
            // Saturation Check
            const currentSaturation = SaturationService.calculateSaturation(cleanedCode);
            if (currentSaturation >= 100) {
              addLog(`ROUND ${r}/${rounds} [${file}]: 100% DNA SATURATION ACHIEVED. TERMINATING MUTATION FOR THIS NODE.`, "var(--color-dalek-green)");
              code = cleanedCode;
              if (!parallelMode) setCurrentCode(code);
              break;
            }

            if (!parallelMode) {
              setLastSummary(structuredData.summary || "");
              setLastStrategicDecision(structuredData.strategicDecision || "");
              setLastPriority(structuredData.priority || 0);
              setLastTool(structuredData.tool);
            }

            if (structuredData.bestSuitedRepo && !siphonedRepos.includes(structuredData.bestSuitedRepo)) {
              addLog(`AI SUGGESTED DNA SOURCE FOR ${file}: ${structuredData.bestSuitedRepo}.`, "var(--color-dalek-gold)");
              siphonExternalDNA(structuredData.bestSuitedRepo).catch(e => {
                addLog(`SUGGESTED DNA SIPHON FAILED: ${e instanceof Error ? e.message : 'Unknown Error'}`, "var(--color-dalek-red)");
              });
            }

            if (structuredData.strategicDecision) {
              setStrategicLedger(prev => {
                const newEntry = { insight: structuredData.strategicDecision, priority: structuredData.priority || 1, file, cycle: processedCount };
                return [...prev, newEntry].sort((a, b) => b.priority - a.priority).slice(0, 20);
              });

              // Handle AI-generated Siphon commands
              if (structuredData.strategicDecision.includes("SIPHON_WEB:") || structuredData.strategicDecision.includes("SIPHON_WAYBACK:")) {
                const command = structuredData.strategicDecision.match(/(SIPHON_WEB:|SIPHON_WAYBACK:)\s*([^\s]+)/)?.[0];
                if (command) {
                  siphonWebContent(command).catch(e => {
                    addLog(`WEB SIPHON TRIGGER FAILED: ${e instanceof Error ? e.message : 'Unknown Error'}`, "var(--color-dalek-red)");
                  });
                }
              }
            }

            let finalImprovedCode = cleanedCode;
            if (precisionMode && finalImprovedCode) {
              const destructorSystem = prompts?.destructor_system || "You are the NEXUS_CORE Precision Auditor.";
              const destructorUser = PromptService.interpolate(prompts?.destructor_user || `ORIGINAL SOURCE: {{source}}\n\nENHANCED: {{enhanced}}`, {
                source: (code || "").slice(0, 5000),
                enhanced: finalImprovedCode.slice(0, 10000)
              });

              try {
                const auditedCode = await callAIWithFallback(destructorUser, destructorSystem);
                if (auditedCode) {
                  finalImprovedCode = auditedCode.replace(/```[a-z]*\n|```/gi, "").trim();
                }
              } catch (e) {
                addLog(`DESTRUCTOR PASS FAILED FOR ${file}: AI QUOTA EXCEEDED.`, "var(--color-dalek-gold)");
              }
            }
            
            const validation = validateMutation(code || "", finalImprovedCode, file);
            if (validation.valid) {
              addLog(`GROG_BRAIN: MUTATION ACCEPTED FOR ${file}.`, "var(--color-dalek-green)");
              code = finalImprovedCode;
              if (!parallelMode) setCurrentCode(code);
              retryHint = ""; // Reset retry hint on success
            } else {
              addLog(`ROUND ${r} [${file}]: MUTATION REJECTED - ${validation.reason}`, "var(--color-dalek-red)");
              retryHint = `CRITICAL: The previous mutation round for ${file} was REJECTED due to: ${validation.reason}. You MUST expand the logic and maintain all existing functionality. DO NOT TRUNCATE. MAXIMALIST_MODE: ENABLED.`;
              continue; 
            }
          }

          const newMeta: MetaState = {
            name: "Meta-123", status: "Instantiated", round: r, lifecycle: "READY",
            config: { Core: { version: `1.0.${r}`, mode: "Active" } },
            logs: [`Round ${r} sync completed for ${file}. Vote: ${vote}`],
            license: "MTCL-V1 (Proprietary)"
          };
          if (!parallelMode) setMeta(newMeta);

          if (r % 3 === 0 || r === rounds) {
            const baseName = getBaseName(file);
            
            // 1. Local Mutation (Immediate effect in preview)
            const localSuccess = await mutateLocalFile(file, code || "");
            if (localSuccess) {
              addLog(`GROG_BRAIN: LOCAL MUTATION SUCCESSFUL FOR ${file}.`, "var(--color-dalek-green-dim)");
              if (file === 'src/evolutors/GrogBrain.ts' || file === 'server.ts') {
                setIsRebooting(true);
                setTimeout(() => window.location.reload(), 2000);
              }
            }

            // 2. Remote Sync
            addLog(`GROG_BRAIN: PUSHING ${file} TO REPOSITORY...`, "var(--color-dalek-gold)");
            const pushSuccess = await pushToRepo(file, code || "", `Meta-123: Lifecycle Instantiation R${r} for ${file} | Vote: ${vote}`);
            if (pushSuccess) {
              addLog(`GROG_BRAIN: SUCCESSFULLY PUSHED ${file}.`, "var(--color-dalek-green)");
              await pushToRepo(`meta_${baseName}.json`, JSON.stringify(newMeta, null, 2), `Meta-123: Repo State R${r}`);
              
              // Replication to backup repo
              if (backupRepo) {
                await pushToRepo(file, code || "", `REPLICATION R${r}: ${file}`, backupRepo, 'main');
                await pushToRepo(`meta_${baseName}.json`, JSON.stringify(newMeta, null, 2), `REPLICATION R${r}: Meta`, backupRepo, 'main');
              }
            } else {
              addLog(`GROG_BRAIN: FAILED TO PUSH ${file}.`, "var(--color-dalek-red)");
            }
            
            // Small delay to avoid GitHub secondary rate limits
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
        processedCount++;
        return { code, context: currentContext };
      } catch (error) {
        addLog(`FILE PROCESSING FAILURE [${file}]: ${error instanceof Error ? error.message : 'Unknown Error'}`, "var(--color-dalek-red)");
        return { code: "", context: initialContext || "" };
      }
    };

    if (parallelMode && processAll) {
      addLog(`PARALLEL MODE ACTIVE: INITIATING ${parallelThreads} THREADS...`, "var(--color-dalek-cyan)");
      
      const queue = [...filesToProcess];
      const activePromises: Promise<any>[] = [];
      const population = evolutionEngine.getPopulation();
      let strategyIndex = 0;
      
      while (queue.length > 0 || activePromises.length > 0) {
        if (abortRef.current) break;
        
        while (activePromises.length < parallelThreads && queue.length > 0) {
          const file = queue.shift()!;
          // Assign a strategy from the population to this thread
          const strategy = population[strategyIndex % population.length];
          strategyIndex++;
          setCurrentStrategy(strategy);

          const promise = processSingleFile(file, localChainedContext)
            .then(res => {
              if (res && res.context) {
                localChainedContext += `\n[File Context ${file}]: ${res.context}`;
                if (localChainedContext.length > 15000) localChainedContext = localChainedContext.slice(-15000);
              }
            })
            .catch(e => addLog(`THREAD FAILURE [${file}]: ${e.message}`, "var(--color-dalek-red)"))
            .finally(() => {
              activePromises.splice(activePromises.indexOf(promise), 1);
            });
          activePromises.push(promise);
          
          // Small delay between thread spawns to avoid burst rate limits
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        if (activePromises.length > 0) {
          await Promise.race(activePromises);
        }
      }

      // Evolution Step
      addLog("EVOLUTIONARY CYCLE: EVALUATING STRATEGY FITNESS...", "var(--color-dalek-gold)");
      evolutionEngine.evolve();
      const best = evolutionEngine.getBestStrategy();
      setEvolutionStats({ generation: best.generation, bestFitness: best.fitness });
      addLog(`GENERATION ${best.generation} COMPLETE. BEST FITNESS: ${best.fitness.toFixed(0)}`, "var(--color-dalek-cyan)");
    } else {
      for (const file of filesToProcess) {
        if (abortRef.current) break;
        const res = await processSingleFile(file, localChainedContext);
        if (res && res.context) {
          localChainedContext = res.context;
          setChainedContext(res.context);
        }
      }
    }

    // User Request: Rewrite README.md when complete
    addLog("BATCH COMPLETE: INITIATING FINAL DOCUMENTATION UPDATE...", "var(--color-dalek-gold)");
    await manualUpdateReadme();
    
    // Final Log Push
    if (!abortRef.current) {
      addLog("BATCH PROCESS COMPLETE: ALL TARGETS TRANSITIONED TO STEADY STATE.", "var(--color-dalek-cyan)");
    }
    await pushLogToRepo();

    fetchRepoFiles().catch(() => {}); // Refresh file list

    } catch (error) {
      addLog(`CRITICAL LIFECYCLE FAILURE: ${error instanceof Error ? error.message : 'Unknown Error'}`, "var(--color-dalek-red)");
    } finally {
      isRunningRef.current = false;
      setIsRunning(false);
      setStatus("READY");
    }
  };

  const stopEvolution = () => {
    abortRef.current = true;
    addLog("ABORT SIGNAL SENT. WAITING FOR CURRENT OPERATION TO TERMINATE...", "var(--color-dalek-red)");
    setIsRunning(false);
    setStatus("ABORTED");
  };

  const siphonWebContent = async (command: string) => {
    if (!webSiphonServiceRef.current) return;
    const isWayback = command.startsWith("SIPHON_WAYBACK:");
    const url = command.replace(isWayback ? "SIPHON_WAYBACK:" : "SIPHON_WEB:", "").trim();
    
    if (!url) return;

    addLog(`INITIATING WEB SIPHON: ${isWayback ? 'WAYBACK' : 'LIVE'} -> ${url}`, "var(--color-dalek-gold)");
    
    try {
      const dna = await webSiphonServiceRef.current.siphonWebContent(url, isWayback);
      if (dna) {
        addLog(`WEB SIPHON SUCCESSFUL: ${dna.length} chars retrieved.`, "var(--color-dalek-cyan)");
        setDnaSignature(prev => `${prev}\n\n[WEB_DNA_SOURCE: ${url}]\n${dna}`);
      }
    } catch (e) {
      addLog(`WEB SIPHON FAILED [${url}]: ${e instanceof Error ? e.message : 'Unknown Error'}`, "var(--color-dalek-red)");
    }
  };

  const siphonExternalDNA = async (repoName?: string, skipLoading: boolean = false) => {
    const repoToSiphon = repoName || externalDnaRepo;
    if (!repoToSiphon.trim()) {
      addLog("SIPHON ERROR: NO REPOSITORY SPECIFIED.", "var(--color-dalek-red)");
      return null;
    }
    if (!skipLoading) setIsAnalyzingDNA(true);
    addLog(`INITIATING EXTERNAL DNA SIPHON FROM ${repoToSiphon} INTO GROG'S BRAIN...`, "var(--color-dalek-gold)");
    
    try {
      // Sanitize repo name
      let sanitizedRepo = repoToSiphon.trim().replace(/^https:\/\/github\.com\//, "").replace(/\/$/, "");
      let explicitBranch = "";
      
      // Handle user/repo/branch format
      const parts = sanitizedRepo.split('/');
      if (parts.length > 2) {
        // If it's something like user/repo/tree/branch or user/repo/blob/branch
        if (parts[2] === 'tree' || parts[2] === 'blob') {
          explicitBranch = parts.slice(3).join('/');
          sanitizedRepo = `${parts[0]}/${parts[1]}`;
        } else {
          // Assume user/repo/branch
          explicitBranch = parts.slice(2).join('/');
          sanitizedRepo = `${parts[0]}/${parts[1]}`;
        }
      }
      
      // Fix accidental duplication (e.g., "google/genkitgoogle/genkit")
      const half = sanitizedRepo.length / 2;
      if (sanitizedRepo.length % 2 === 0 && sanitizedRepo.substring(0, half) === sanitizedRepo.substring(half)) {
        sanitizedRepo = sanitizedRepo.substring(0, half);
      }
      
      if (!repoName && sanitizedRepo !== externalDnaRepo) {
        setExternalDnaRepo(sanitizedRepo);
      }

      addLog(`INITIATING EXTERNAL DNA SIPHON FROM ${sanitizedRepo}...`, "var(--color-dalek-gold)");
      
      // Try to get the default branch first
      const repoUrl = `https://api.github.com/repos/${sanitizedRepo}`;
      const repoRes = await fetch("/api/github/proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: repoUrl })
      });
      
      if (!repoRes.ok) {
        const errData = await repoRes.json();
        if (repoRes.status === 404) {
          throw new Error(`REPOSITORY_NOT_FOUND: ${sanitizedRepo} does not exist or is private.`);
        }
        throw new Error(`GITHUB_API_ERROR: ${errData.message || 'Unknown error'}`);
      }

      const repoData = await repoRes.json();
      const defaultBranch = repoData.default_branch || "main";
      // Prioritize explicit branch, then default, then master/main
      const branches = Array.from(new Set(explicitBranch ? [explicitBranch, defaultBranch, "master", "main"] : [defaultBranch, "master", "main", "develop"]));
      
      let data = null;
      let usedBranch = "";
      let lastError = "";
      
      for (const branch of branches) {
        const res = await fetch("/api/github/proxy", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: `https://api.github.com/repos/${sanitizedRepo}/git/trees/${branch}?recursive=1`
          })
        });
        
        if (res.ok) {
          data = await res.json();
          usedBranch = branch;
          break;
        } else {
          const err = await res.json();
          lastError = err.message || "Branch not found";
        }
      }
      
      if (!data) throw new Error(`SIPHON_FAILED: ${lastError} (Tried: ${branches.join(', ')})`);

      // Steganography check: if the repo has a 'dna_vault.png', try to decode it
      const externalFiles = data.tree.map((item: any) => item.path);
      if (externalFiles.includes('dna_vault.png')) {
        addLog("DETECTED STEGANOGRAPHIC DNA VAULT IN EXTERNAL REPOSITORY. ATTEMPTING DECRYPTION...", "var(--color-dalek-cyan)");
        try {
          // In a real scenario, we'd fetch the raw image bytes. 
          // For this demo, we'll simulate the decode if we had the URL.
          // const decoded = await SteganographyService.decode(`https://raw.githubusercontent.com/${sanitizedRepo}/${usedBranch}/dna_vault.png`);
          // setDnaSignature(decoded);
        } catch (e) {
          addLog("STEGANOGRAPHY DECODE FAILED: VAULT CORRUPTED.", "var(--color-dalek-red)");
        }
      }
      
      const files = data.tree
        .filter((item: any) => item.type === 'blob' && (
          item.path.endsWith('.js') || 
          item.path.endsWith('.ts') || 
          item.path.endsWith('.tsx') ||
          item.path.endsWith('.md') ||
          item.path.endsWith('.json') ||
          item.path.endsWith('.py') ||
          item.path.endsWith('.go')
        ))
        .map((item: any) => item.path);

      if (files.length === 0) throw new Error("NO_SOURCE_FILES_FOUND");

      const sampleFiles = files.slice(0, 10);
      let combinedContent = "";
      
      for (const file of sampleFiles) {
        const fileRes = await fetch("/api/github/proxy", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: `https://api.github.com/repos/${sanitizedRepo}/contents/${file}?ref=${usedBranch}`
          })
        });
        if (fileRes.ok) {
          const fileData = await fileRes.json();
          const content = safeAtob(fileData.content);
          if (content) {
            combinedContent += `\n--- FILE: ${file} ---\n${content}\n`;
          } else {
            addLog(`SKIPPING BINARY OR INVALID CONTENT: ${file}`, "var(--color-dalek-gold-dim)");
          }
        }
      }

      const signature = await callAIWithFallback(
        `EXTRACT CORE ARCHITECTURAL PATTERNS AND DNA SIGNATURE FROM THIS EXTERNAL REPOSITORY (${sanitizedRepo}):
${combinedContent.slice(0, 15000)}`,
        "You are a Master Architect specializing in cross-repository pattern extraction.",
        true
      );
      
      if (signature) {
        if (!skipLoading) {
          const newDna = dnaSignature ? `${dnaSignature}\n\n[EXTERNAL DNA: ${sanitizedRepo}]\n${signature}` : signature;
          setDnaSignature(newDna);
          setSiphonedRepos(prev => Array.from(new Set([...prev, sanitizedRepo])));
          addLog(`EXTERNAL DNA FROM ${sanitizedRepo} (${usedBranch}) INSTANTIATED. READY TO SIPHON INTO ${targetRepo}.`, "var(--color-dalek-green)");
          
          // Persist to repository
          await pushToRepo('grog/dna/DNA_SIGNATURE.md', newDna, `NEXUS_CORE: Siphoned DNA from ${sanitizedRepo}`);
        } else {
          // Just mark as siphoned for sub-routine calls
          setSiphonedRepos(prev => Array.from(new Set([...prev, sanitizedRepo])));
        }
        return signature;
      }
      return null;
    } catch (e) {
      addLog(`EXTERNAL DNA SIPHON FAILED: ${e instanceof Error ? e.message : 'Unknown Error'}`, "var(--color-dalek-red)");
      return null;
    } finally {
      if (!skipLoading) setIsAnalyzingDNA(false);
    }
  };

  const siphonDNARepository = async (files: string[]) => {
    setIsAnalyzingDNA(true);
    addLog("SIPHONING DNA FROM REPOSITORY...", "var(--color-dalek-gold)");
    
    try {
      // First, try to siphon from the specific Test-1 repo if not already siphoned
      let externalDna = "";
      if (!siphonedRepos.includes("craighckby-stack/Test-1")) {
        addLog("SIPHONING CORE DNA FROM craighckby-stack/Test-1 (main)...", "var(--color-dalek-gold)");
        const test1Dna = await siphonExternalDNA("craighckby-stack/Test-1/main", true);
        if (test1Dna) externalDna = test1Dna;
      }

      // Read first 10 files to extract patterns (to avoid token limits)
      const sampleFiles = files.filter(f => !f.startsWith('meta_') && (
        f.endsWith('.js') || 
        f.endsWith('.ts') || 
        f.endsWith('.tsx') ||
        f.endsWith('.md') ||
        f.endsWith('.json') ||
        f.endsWith('.py')
      )).slice(0, 10);
      
      addLog(`SAMPLING ${sampleFiles.length} FILES FOR DNA EXTRACTION FROM ${targetRepo}.`, "var(--color-dalek-gold-dim)");
      let combinedContent = "";
      
      for (const file of sampleFiles) {
        const res = await fetch("/api/github/proxy", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: `https://api.github.com/repos/${targetRepo}/contents/${file}${originalBranch ? `?ref=${originalBranch}` : ''}`
          })
        });
        if (res.ok) {
          const data = await res.json();
          const content = safeAtob(data.content);
          if (content) {
            combinedContent += `\n--- FILE: ${file} ---\n${content}\n`;
          } else {
            addLog(`SKIPPING BINARY OR INVALID CONTENT: ${file}`, "var(--color-dalek-gold-dim)");
          }
        } else {
          addLog(`FAILED TO FETCH ${file} FOR DNA: ${res.status}`, "var(--color-dalek-red)");
        }
      }

      const signature = await callAIWithFallback(
        `EXTRACT CORE ARCHITECTURAL PATTERNS AND RECONSTRUCTION BLUEPRINT FROM THIS REPOSITORY SAMPLE FOR GROG'S BRAIN (Dalek-Grog):
1. DNA SIGNATURE: Identify the core architectural essence.
2. RECONSTRUCTION BLUEPRINT:
   - LEXICAL ALIGNMENT: How should external names/variables be renamed to fit Grog's internal logic?
   - MERGE STRATEGY: How should this logic be merged into existing files?
   - BINDING MAP: What new connections or imports must be established between files?

SAMPLE DATA:
${combinedContent.slice(0, 15000)}`,
        "You are a Master Architect specializing in pattern extraction and repository reconstruction for Grog's autonomous evolution.",
        true // Use search to better understand patterns
      );
      
      if (signature) {
        const finalDna = externalDna ? `[EXTERNAL DNA: craighckby-stack/Test-1]\n${externalDna}\n\n[LOCAL DNA: ${targetRepo}]\n${signature}` : signature;
        setDnaSignature(finalDna);
        addLog("REPOSITORY DNA INSTANTIATED.", "var(--color-dalek-green)");
        
        // Persist DNA to repository
        await pushToRepo('grog/dna/DNA_SIGNATURE.md', finalDna, "NEXUS_CORE: DNA Signature Persistence");
        return finalDna;
      }
      return externalDna || null;
    } catch (e) {
      addLog("REPOSITORY DNA SIPHON FAILED", "var(--color-dalek-red)");
      return null;
    } finally {
      setIsAnalyzingDNA(false);
    }
  };

  const manualUpdateReadme = async () => {
    addLog("MANUAL OVERRIDE: INITIATING README EVOLUTION...", "var(--color-dalek-gold)");
    
    const readmeSystem = prompts?.readme_system || "You are a Technical Documentation Engineer. Your goal is to provide a professional, accurate, and comprehensive README.md for Grog's Brain (Dalek-Grog). Ensure all technical components like 'Flow' and 'Plugin Architecture' are documented with clarity. Maintain a constructive and professional tone.";
    const readmeUser = PromptService.interpolate(prompts?.readme_user || `GENERATE TECHNICAL DOCUMENTATION (README.md) FOR GROG'S BRAIN:
- FILES PROCESSED: {{count}}
- LATEST FILE: {{file}}
- DNA SIGNATURE: {{dna}}
- CONTEXT SUMMARY: {{context}}
- SATURATION STATUS: {{saturation}}

The README must include:
1. PROJECT OVERVIEW: Grog's Brain (Dalek-Grog) is an autonomous system that evolves its own code by siphoning and integrating patterns from external repositories.
2. RECONSTRUCTION PROCESS: Explain the technical mechanism of "Brain Reconstruction"—siphoning architectural DNA from origins (e.g., DeepMind, Google) and performing Lexical Alignment, Logic Merging, and Brain Binding to integrate external patterns into Grog's internal logic.
3. AUTONOMOUS EVOLUTION LOOP: Describe how the system continuously iterates on the 'main' branch to evolve Grog's Brain (Dalek-Grog) through recursive pattern siphoning and self-mutation.
4. CHAINED CONTEXT & MEMORY: Explain the implementation of a shared state/memory that ensures consistency across the reconstructed files in Dalek-Grog.
5. CURRENT STATUS: A factual summary of Grog's brain development based on the provided counts and file names.

OUTPUT ONLY MARKDOWN. DO NOT INCLUDE ANY STORYTELLING OR FICTIONAL ELEMENTS.`, {
      dna: dnaSignature ? 'Active' : 'None',
      context: chainedContext ? chainedContext.slice(0, 500) : 'Initial State',
      saturation: saturationGuidelines ? 'Active' : 'None',
      file: selectedFile,
      count: 'Manual'
    });
    
    try {
      const newReadme = await callAIWithFallback(readmeUser, readmeSystem);
      if (newReadme) {
        let cleaned = newReadme.replace(/```[a-z]*\n|```/gi, "").trim();
        
        // Strip hallucinated audit headers
        cleaned = cleaned.replace(/^\*\*WARNING: SYSTEM AUDIT DETECTED HIGH RISK OF INACCURACY AND INPRECISION\*\*[\s\S]*?\*\*CLEANED SUMMARY\*\*/i, "# PROJECT SUMMARY");
        cleaned = cleaned.replace(/CLEANED /g, "");
        
        addLog("PUSHING MANUAL README UPDATE...", "var(--color-dalek-gold)");
        await pushToRepo("README.md", cleaned, `NEXUS_CORE: Manual Documentation Update`);
      } else {
        addLog("SYSTEM ERROR: MANUAL README GENERATION FAILED.", "var(--color-dalek-red)");
      }
    } catch (e) {
      addLog("MANUAL README UPDATE FAILED: AI QUOTA EXCEEDED.", "var(--color-dalek-red)");
    }
  };

  const enhanceReadme = async () => {
    setIsEnhancingReadme(true);
    addLog("INITIATING README ENHANCEMENT PROTOCOL...", "var(--color-dalek-gold)");
    
    try {
      // 1. Fetch current README
      const currentReadme = await fetchFileContent("README.md");
      
      // 2. Enhance with AI
      const enhancementSystem = `You are a world-class Technical Writer. 
Your goal is to take an existing README and ENHANCE it into a professional, comprehensive, and accurate technical document.

METHODOLOGY:
1. ARCHITECTURAL CLARITY: Ensure the 'Flow' and 'Plugin Architecture' are documented with high precision and clarity.
2. TECHNICAL ACCURACY: Verify all claims against the provided context.
3. PROFESSIONAL TONE: Maintain a constructive, authoritative, and clean professional style.
4. VALUE PROPOSITION: Highlight the system's unique capabilities (Evolution, Siphoning, Chained Context).

DO NOT add "Audit Warnings" or "Risk Alerts" unless there is a critical security flaw. DO NOT remove architectural descriptions unless they are factually contradicted by the context. Use emojis sparingly.`;

      const enhancementUser = `ENHANCE THE FOLLOWING README.md CONTENT FOR THE '${targetRepo}' REPOSITORY:
      
${currentReadme || "# NEXUS_CORE\nInitial project documentation."}

CONTEXT:
- Target Repository: ${targetRepo}
- DNA Signature: ${dnaSignature ? 'Active' : 'None'}
- Chained Context: ${chainedContext ? 'Active' : 'None'}
- Current Phase: ${status}

OUTPUT ONLY THE ENHANCED MARKDOWN.`;

      const enhancedContent = await callAIWithFallback(enhancementUser, enhancementSystem, true);
      
      if (enhancedContent) {
        let cleaned = enhancedContent.replace(/```[a-z]*\n|```/gi, "").trim();
        
        // Strip hallucinated audit headers
        cleaned = cleaned.replace(/^\*\*WARNING: SYSTEM AUDIT DETECTED HIGH RISK OF INACCURACY AND INPRECISION\*\*[\s\S]*?\*\*CLEANED SUMMARY\*\*/i, "# PROJECT SUMMARY");
        cleaned = cleaned.replace(/CLEANED /g, ""); // Remove "CLEANED" prefix from headers
        
        setCurrentCode(cleaned);
        addLog("README ENHANCEMENT GENERATED. PUSHING TO REPOSITORY...", "var(--color-dalek-green)");
        await pushToRepo("README.md", cleaned, "NEXUS_CORE: Enhanced README.md via AI Protocol");
        addLog("README ENHANCEMENT COMPLETE.", "var(--color-dalek-green)");
      }
    } catch (e) {
      addLog("README ENHANCEMENT FAILED.", "var(--color-dalek-red)");
    } finally {
      setIsEnhancingReadme(false);
    }
  };

  const toggle = () => {
    if (!isRunning) {
      initiateEvolution().catch(e => {
        addLog(`LIFECYCLE STARTUP FAILED: ${e instanceof Error ? e.message : 'Unknown Error'}`, "var(--color-dalek-red)");
      });
    } else {
      abortRef.current = true;
      setIsRunning(false);
      addLog("LIFECYCLE ABORTED BY OPERATOR", "var(--color-dalek-red)");
    }
  };

  const quickStart = async () => {
    addLog("INITIATING QUICK-START PROTOCOL FOR GROG'S BRAIN...", "var(--color-dalek-gold)");
    setProcessAll(true);
    setResumeMode(true);
    
    try {
      // 1. Fetch files
      const files = await fetchRepoFiles();
      if (files.length === 0) {
        addLog("QUICK-START FAILED: NO FILES DISCOVERED.", "var(--color-dalek-red)");
        return;
      }

      // 2. Siphon DNA if not present
      if (!dnaSignature) {
        await siphonDNARepository(files);
      }

      // 3. Start the main loop
      initiateEvolution().catch(e => {
        addLog(`QUICK-START LIFECYCLE FAILED: ${e instanceof Error ? e.message : 'Unknown Error'}`, "var(--color-dalek-red)");
      });
    } catch (error) {
      addLog(`QUICK-START INITIALIZATION FAILED: ${error instanceof Error ? error.message : 'Unknown Error'}`, "var(--color-dalek-red)");
    }
  };

  useEffect(() => {
    if (prompts && targetRepo === "craighckby-stack/Dalek-Grog" && !isRunning && status === 'INIT') {
      addLog("AUTO-START PROTOCOL DETECTED for Grog's Brain (Dalek-Grog). INITIATING...", "var(--color-dalek-gold)");
      quickStart().catch(e => {
        addLog(`AUTO-START FAILED: ${e instanceof Error ? e.message : 'Unknown Error'}`, "var(--color-dalek-red)");
      });
    }
  }, [prompts, targetRepo]);

  return (
    <Sentry.ErrorBoundary 
      fallback={({ error, resetError }: { error: any; resetError: () => void }) => (
        <div className="p-10 bg-black text-dalek-red font-mono min-h-screen flex flex-col items-center justify-center text-center gap-4">
          <AlertTriangle size={48} />
          <h1 className="text-2xl font-bold uppercase tracking-widest">System Critical Failure</h1>
          <p className="max-w-md text-sm text-zinc-500">{error.message}</p>
          <button 
            onClick={() => {
              resetError();
              window.location.reload();
            }}
            className="dalek-btn px-6 py-2 text-xs"
          >
            REBOOT SYSTEM
          </button>
        </div>
      )}
    >
      <div className="p-2 sm:p-5 flex flex-col items-center gap-4 min-h-screen bg-black">
      {/* Header */}
      {/* System Reboot Overlay */}
      {isRebooting && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center space-y-6 animate-in fade-in duration-500">
          <div className="relative">
            <Brain size={80} className="text-dalek-purple animate-pulse" />
            <div className="absolute inset-0 border-4 border-dalek-purple rounded-full animate-ping opacity-20" />
          </div>
          <div className="text-center space-y-2">
            <h2 className="font-display text-2xl text-dalek-purple tracking-[0.5em] animate-bounce">SYSTEM REBOOT</h2>
            <p className="text-[10px] text-zinc-500 font-mono tracking-widest uppercase">Instantiating New Architectural DNA...</p>
            <div className="flex items-center justify-center gap-2">
              <span className="w-1 h-1 bg-dalek-purple rounded-full animate-ping" />
              <span className="text-[8px] text-dalek-purple/60 font-mono uppercase">Neural Pathways Reconfiguring...</span>
            </div>
          </div>
          <div className="w-64 h-1 bg-zinc-900 rounded-full overflow-hidden">
            <div className="h-full bg-dalek-purple animate-[shimmer_2s_infinite]" style={{ width: '100%' }} />
          </div>
        </div>
      )}

      <header className="w-full max-w-[1750px] flex flex-col md:flex-row items-center justify-between border-b border-dalek-red-dim pb-3 gap-4">
        <div className="text-center md:text-left">
          <h1 className="font-display text-2xl font-black tracking-[0.4em] shadow-dalek-red drop-shadow-[0_0_10px_rgba(255,32,32,0.8)]">
            DALEK GROG v3.6
          </h1>
          <div className="text-[8px] text-dalek-purple tracking-[0.3em] mt-1 uppercase">
            DALEK_GROG SIPHON SYSTEM
          </div>
        </div>
        <div className="flex flex-wrap justify-center md:justify-end gap-1 md:gap-2 items-center">
          <div className="flex bg-zinc-900/50 p-1 rounded-sm mr-4 border border-zinc-800">
            <button 
              onClick={() => setActiveTab('system')}
              className={`px-3 py-1 text-[9px] uppercase tracking-widest transition-all ${activeTab === 'system' ? 'bg-dalek-cyan text-black shadow-[0_0_10px_rgba(0,255,204,0.5)]' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              System
            </button>
            <button 
              onClick={() => setActiveTab('manual')}
              className={`px-3 py-1 text-[9px] uppercase tracking-widest transition-all ${activeTab === 'manual' ? 'bg-dalek-gold text-black shadow-[0_0_10px_rgba(255,165,0,0.5)]' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              Manual
            </button>
            <button 
              onClick={() => setActiveTab('grog')}
              className={`px-3 py-1 text-[9px] uppercase tracking-widest transition-all ${activeTab === 'grog' ? 'bg-dalek-purple text-white shadow-[0_0_10px_rgba(168,85,247,0.5)]' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              Grog
            </button>
          </div>
          {!isRunning ? (
            <button 
              onClick={initiateEvolution}
              className="px-4 py-1.5 bg-dalek-red text-white text-[10px] font-bold tracking-[0.2em] rounded-sm shadow-[0_0_15px_rgba(255,0,0,0.4)] hover:bg-red-600 transition-all flex items-center gap-2 group"
            >
              <Zap size={12} className="group-hover:animate-pulse" />
              INITIATE
            </button>
          ) : (
            <button 
              onClick={stopEvolution}
              className="px-4 py-1.5 bg-zinc-900 text-dalek-red text-[10px] font-bold tracking-[0.2em] rounded-sm border border-dalek-red/50 hover:bg-zinc-800 transition-all flex items-center gap-2"
            >
              <RefreshCw size={12} className="animate-spin" />
              ABORT
            </button>
          )}
          <button 
            onClick={() => { throw new Error("DALEK_GROG: Manual Error Triggered for Sentry Verification."); }}
            className="p-1.5 text-zinc-600 hover:text-dalek-red transition-colors"
            title="Trigger Manual Error"
          >
            <Bug size={14} />
          </button>
          {isRunning && processAll && (
            <div className="stat-panel border-dalek-cyan/50 bg-dalek-cyan/5">
              <span className="text-[7px] tracking-widest text-dalek-cyan uppercase">Batch</span>
              <span className="font-display text-xs font-black text-dalek-cyan">
                {repoFiles.indexOf(selectedFile) + 1}/{repoFiles.length}
              </span>
            </div>
          )}
          <div className="stat-panel min-w-[90px]">
            <span className="text-[7px] tracking-widest text-zinc-600 uppercase">Lifecycle</span>
            <span className="font-display text-xs font-black text-dalek-gold">{status}</span>
          </div>
          <div className="stat-panel min-w-[60px]">
            <span className="text-[7px] tracking-widest text-zinc-600 uppercase">Round</span>
            <span className="font-display text-xs font-black text-dalek-gold">{round}</span>
          </div>
          <div className="stat-panel min-w-[70px]">
            <span className="text-[7px] tracking-widest text-zinc-600 uppercase">Sync</span>
            <span className="font-display text-xs font-black text-dalek-gold">{syncStatus}</span>
          </div>
          <div className={`stat-panel min-w-[90px] border-l-2 ${lastValidation?.valid === false ? 'border-dalek-red' : lastValidation?.valid === true ? 'border-dalek-green' : 'border-zinc-800'}`}>
            <span className="text-[7px] tracking-widest text-zinc-600 uppercase">Safety</span>
            <span className={`font-display text-[9px] font-black ${lastValidation?.valid === false ? 'text-dalek-red' : lastValidation?.valid === true ? 'text-dalek-green' : 'text-zinc-600'}`}>
              {lastValidation ? (lastValidation.valid ? 'SECURE' : 'REJECTED') : 'WAITING'}
            </span>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-5 w-full max-w-[1750px] flex-1 overflow-hidden">
        {/* Left Column: Controls and Logs */}
        <div className="flex flex-col gap-4 overflow-y-auto custom-scrollbar pr-1">
          {activeTab === 'manual' ? (
            <div className="panel-container p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                <h2 className="text-[12px] font-bold text-dalek-gold flex items-center gap-2 uppercase tracking-widest">
                  <Shield size={14} /> Unified Manual Control
                </h2>
              </div>
              <ManualControlPanel 
                externalDnaRepo={externalDnaRepo}
                setExternalDnaRepo={setExternalDnaRepo}
                isRunning={isRunning}
                isAnalyzingDNA={isAnalyzingDNA}
                siphonExternalDNA={siphonExternalDNA}
                handleDNAUpload={handleDNAUpload}
                setSiphonedRepos={setSiphonedRepos}
                pruneRedundantMetadata={pruneRedundantMetadata}
                isPruning={isPruning}
                mistakes={mistakes}
                setMistakes={setMistakes}
                showMistakeLedger={showMistakeLedger}
                setShowMistakeLedger={setShowMistakeLedger}
                siphonedRepos={siphonedRepos}
                handleManualUpload={handleManualUpload}
                runManualEnhancement={runManualEnhancement}
                manualFileName={manualFileName}
                manualFileContent={manualFileContent}
                manualEnhancedCode={manualEnhancedCode}
                isEnhancingManual={isEnhancingManual}
                pushToRepo={pushToRepo}
                addLog={addLog}
                dnaSignature={dnaSignature}
                saturationGuidelines={saturationGuidelines}
                strategicLedger={strategicLedger}
              />
              <div className="mt-auto pt-4">
                <div className="h-[200px] overflow-y-auto text-[10px] bg-[#010000] p-3 border border-zinc-950 text-zinc-600 font-mono scrollbar-thin scrollbar-thumb-dalek-red-dim break-words">
                  {logs.map((log, i) => (
                    <div key={i} style={{ color: log.color }} className="mb-1 border-b border-zinc-900/30 pb-1">
                      <span className="opacity-30 mr-2">[{log.timestamp}]</span>
                      {log.message}
                    </div>
                  ))}
                  <div ref={logEndRef} />
                </div>
              </div>
            </div>
          ) : activeTab === 'grog' ? (
            <GrogDashboard 
              grogBrainRef={grogBrainRef}
              currentCode={currentCode}
              mistakes={mistakes}
              autoEvolutionEnabled={autoEvolutionEnabled}
              setAutoEvolutionEnabled={setAutoEvolutionEnabled}
              backgroundEvolutionActive={backgroundEvolutionActive}
              setBackgroundEvolutionActive={setBackgroundEvolutionActive}
              evolutionSuggestions={evolutionSuggestions}
              runMassEvolution={runMassEvolution}
              isMassEvolving={isMassEvolving}
              runBackgroundEvolution={runBackgroundEvolution}
              isScanningEvolution={isScanningEvolution}
              runGrogThinking={runGrogThinking}
              isThinking={isThinking}
              grogEpiphanies={grogEpiphanies}
              runGrogTests={runGrogTests}
              isTesting={isTesting}
              handleSelfMutation={handleSelfMutation}
              isSelfMutating={isSelfMutating}
              setIsRebooting={setIsRebooting}
              testReport={testReport}
              setTestReport={setTestReport}
              deathRecords={deathRecords}
              strategicLessons={strategicLessons}
              isAnalyzingDeaths={isAnalyzingDeaths}
              deathAnalysis={deathAnalysis}
              analyzeDeathRecords={analyzeDeathRecords}
              fetchDeathRecords={fetchDeathRecords}
              fetchStrategicLessons={fetchStrategicLessons}
              setSelectedFile={setSelectedFile}
              setActiveTab={setActiveTab}
              addLog={addLog}
              grogThoughts={grogThoughts}
              executeDirective={executeDirective}
            />
          ) : (
            <SystemControlPanel 
              isRunning={isRunning}
              status={status}
              targetRepo={targetRepo}
              setTargetRepo={setTargetRepo}
              originalBranch={originalBranch}
              setOriginalBranch={setOriginalBranch}
              targetBranch={targetBranch}
              setTargetBranch={setTargetBranch}
              backupRepo={backupRepo}
              setBackupRepo={setBackupRepo}
              fetchRepoFiles={fetchRepoFiles}
              isFetchingFiles={isFetchingFiles}
              showManualControls={showManualControls}
              setShowManualControls={setShowManualControls}
              showMistakeLedger={showMistakeLedger}
              setShowMistakeLedger={setShowMistakeLedger}
              mistakes={mistakes}
              setMistakes={setMistakes}
              siphonedRepos={siphonedRepos}
              isAnalyzingDNA={isAnalyzingDNA}
              externalDnaRepo={externalDnaRepo}
              setExternalDnaRepo={setExternalDnaRepo}
              siphonExternalDNA={siphonExternalDNA}
              handleDNAUpload={handleDNAUpload}
              setSiphonedRepos={setSiphonedRepos}
              pruneRedundantMetadata={pruneRedundantMetadata}
              isPruning={isPruning}
              isAuditing={isAuditing}
              runFullSystemAudit={runFullSystemAudit}
              saturationGuidelines={saturationGuidelines}
              handleSaturationUpload={handleSaturationUpload}
              isAnalyzingSaturation={isAnalyzingSaturation}
              googleDriveFiles={googleDriveFiles}
              handleGoogleDriveUpload={handleGoogleDriveUpload}
              selectedFile={selectedFile}
              setSelectedFile={setSelectedFile}
              repoFiles={repoFiles}
              processAll={processAll}
              setProcessAll={setProcessAll}
              resumeMode={resumeMode}
              setResumeMode={setResumeMode}
              precisionMode={precisionMode}
              setPrecisionMode={setPrecisionMode}
              parallelMode={parallelMode}
              setParallelMode={setParallelMode}
              parallelThreads={parallelThreads}
              setParallelThreads={setParallelThreads}
              maxRounds={maxRounds}
              setMaxRounds={setMaxRounds}
              showSaturation={showSaturation}
              evolutionStats={evolutionStats}
              currentStrategy={currentStrategy}
              initiateEvolution={initiateEvolution}
              stopEvolution={stopEvolution}
              handleManualUpload={handleManualUpload}
              runManualEnhancement={runManualEnhancement}
              manualFileName={manualFileName}
              manualFileContent={manualFileContent}
              manualEnhancedCode={manualEnhancedCode}
              isEnhancingManual={isEnhancingManual}
              pushToRepo={pushToRepo}
              addLog={addLog}
              dnaSignature={dnaSignature}
              strategicLedger={strategicLedger}
            />
          )}
        </div>

        {/* Code Preview Panel */}
        <div className="panel-container h-full">
          <div className="panel-header">
            <span className="flex items-center gap-2">
              <Cpu size={12} />
              NEXUS_CORE v1.0.0 PREVIEW
            </span>
            <span className="text-zinc-500 font-mono text-[10px]">{targetRepo} / {selectedFile}</span>
          </div>
          <div className="flex-1 overflow-auto p-3 sm:p-5 font-mono text-[11px] text-zinc-400 leading-relaxed whitespace-pre-wrap bg-[#030000] scrollbar-thin scrollbar-thumb-dalek-red-dim">
            {currentCode}
          </div>
        </div>
      </div>
    </div>
  </Sentry.ErrorBoundary>
);
}
