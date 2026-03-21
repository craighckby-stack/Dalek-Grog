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
import { EventBus, NexusTask, NexusTaskHeap, NexusPatch, NexusArchitecturalLinter, NexusDiagnosticReporter, NexusCompilerHost } from './core/nexus_core';
import { NEXUS_CORE_TEMPLATE } from './templates/nexus_core_template';

export default function App() {
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

  const [isPruning, setIsPruning] = useState(false);
  const grogBrainRef = useRef<GrogBrain | null>(null);
  const eventBusRef = useRef<EventBus>(new EventBus());
  const [grogThoughts, setGrogThoughts] = useState<any[]>([]);
  const [grogEpiphanies, setGrogEpiphanies] = useState<{ type: string, insight: string, priority: number }[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [isRebooting, setIsRebooting] = useState(false);

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
        if (patterns) setGrogPatterns(JSON.parse(patterns));
        if (strategies) setGrogStrategies(JSON.parse(strategies));
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

      const suggestions = grogBrainRef.current.scanForEvolution(fileData);
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
            handleManualEnhance(targetContent, topTarget.path, true).catch(() => {});
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
      // 1. Get current content
      let currentContent = "";
      const response = await fetch(`/api/grog/read?path=${targetFile}`);
      const data = await response.json();
      currentContent = data.content;

      // 2. Propose mutation
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
      addLog(`GROK_THOUGHT_COMPLETE: ${insights.length} STRATEGIC INSIGHTS GENERATED.`, "var(--color-dalek-green)");
    } catch (e) {
      addLog("GROK_THOUGHT_FAILED: NEURAL INTERFERENCE DETECTED.", "var(--color-dalek-red)");
    } finally {
      setIsThinking(false);
    }
  };

  const handleDNAUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    addLog(`UPLOADING SOURCE DNA: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)...`, "var(--color-dalek-gold)");
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
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
    reader.readAsText(file);
  };

  const handleSaturationUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzingSaturation(true);
    addLog(`UPLOADING SATURATION GUIDELINES: ${file.name}...`, "var(--color-dalek-gold)");
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        setSaturationGuidelines(text);
        addLog("SATURATION GUIDELINES INSTANTIATED.", "var(--color-dalek-green)");
      } catch (error) {
        addLog("FAILED TO INSTANTIATE SATURATION GUIDELINES.", "var(--color-dalek-red)");
      } finally {
        setIsAnalyzingSaturation(false);
      }
    };
    reader.readAsText(file);
  };

  const handleManualUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    addLog(`MANUAL UPLOAD: ${file.name} (${(file.size / 1024).toFixed(2)}KB)...`, "var(--color-dalek-gold)");
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      setManualFileContent(text);
      setManualFileName(file.name);
      setCurrentCode(text);
      addLog("FILE LOADED. READY FOR ENHANCEMENT.", "var(--color-dalek-green)");
    };
    reader.readAsText(file);
  };

  const handleManualEnhance = async (contentOverride?: string, fileNameOverride?: string, autoPush: boolean = false) => {
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
        setManualEnhancedCode(result.improvedCode);
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
            await handleManualEnhance(content, suggestion.path, true);
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
            const imports = content.match(/from ['"](.+?)['"]/g) || [];
            const importPaths = imports.map(i => i.replace(/from ['"](.+?)['"]/, '$1'));
            
            // Basic Export Extraction
            const exports = content.match(/export (const|function|class|type|interface) ([a-zA-Z0-9_]+)/g) || [];
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
  const fetchRepoFiles = async (repoOverride?: string, retryCount: number = 0) => {
    if (isFetchingFiles && retryCount === 0) return [];
    const activeRepo = repoOverride || targetRepo;
    if (!activeRepo) return [];
    
    setIsFetchingFiles(true);
    try {
      // Try to get the default branch first
      const repoUrl = `https://api.github.com/repos/${activeRepo}`;
      const repoRes = await fetch("/api/github/proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: repoUrl })
      });
      
      if (!repoRes.ok) {
        const errorData = await safeFetchJson(repoRes);
        if (errorData.error === "HTML_RESPONSE" && retryCount < 3) {
          addLog("GITHUB PROXY RETURNED HTML. RETRYING DISCOVERY...", "var(--color-dalek-gold-dim)");
          await new Promise(res => setTimeout(res, 2000 * (retryCount + 1)));
          return fetchRepoFiles(repoOverride, retryCount + 1);
        }
        addLog(`GITHUB ERROR: FAILED TO FETCH REPO INFO (${repoRes.status}). ${errorData.error || errorData.message || ''}`, "var(--color-dalek-red)");
        setIsFetchingFiles(false);
        return [];
      }

      const repoData = await safeFetchJson(repoRes);
      if (repoData.error) {
        if (repoData.error === "HTML_RESPONSE" && retryCount < 3) {
          addLog("GITHUB PROXY RETURNED HTML (MALFORMED). RETRYING...", "var(--color-dalek-gold-dim)");
          await new Promise(res => setTimeout(res, 2000 * (retryCount + 1)));
          return fetchRepoFiles(repoOverride, retryCount + 1);
        }
        addLog(`GITHUB ERROR: MALFORMED REPO DATA. ${repoData.message}`, "var(--color-dalek-red)");
        setIsFetchingFiles(false);
        return [];
      }
      
      let initialBranch = originalBranch || repoData.default_branch || "master";

      const branchesToTry = Array.from(new Set([initialBranch, "master", "main", "develop"]));
      let data = null;
      let usedBranch = "";

      for (const b of branchesToTry) {
        const res = await fetch("/api/github/proxy", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: `https://api.github.com/repos/${activeRepo}/git/trees/${b}?recursive=1`
          })
        });
        
        if (res.ok) {
          const jsonData = await safeFetchJson(res);
          if (!jsonData.error) {
            data = jsonData;
            usedBranch = b;
            break;
          }
        }
      }
      
      if (!data) {
        addLog(`GITHUB ERROR: COULD NOT DISCOVER FILES IN ANY BRANCH (MASTER/MAIN/DEVELOP). CHECK REPOSITORY PERMISSIONS.`, "var(--color-dalek-red)");
        setIsFetchingFiles(false);
        return [];
      }

      if (data) {
        const files = data.tree
          .filter((item: any) => item.type === 'blob')
          .map((item: any) => item.path);
        
        if (files.length !== repoFiles.length || activeRepo !== targetRepo) {
          setRepoFiles(files);
          addLog(`DISCOVERED: ${files.length} files in ${activeRepo} (${usedBranch}).`, "var(--color-dalek-cyan)");
          if (activeRepo === targetRepo && usedBranch !== originalBranch) {
            setOriginalBranch(usedBranch);
          }
          buildDependencyGraph(files).catch(() => {});
        }
        return files;
      } else {
        // Fallback to contents API
        const fallbackRes = await fetch("/api/github/proxy", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: `https://api.github.com/repos/${activeRepo}/contents?ref=${initialBranch}`
          })
        });
        if (fallbackRes.ok) {
          const data = await fallbackRes.json();
          const files = data
            .filter((item: any) => item.type === 'file')
            .map((item: any) => item.name);
          
          if (files.length !== repoFiles.length) {
            setRepoFiles(files);
            addLog(`DISCOVERED: ${files.length} files in ${activeRepo} (Flat).`, "var(--color-dalek-cyan)");
          }
          return files;
        }
      }
    } catch (e) {
      addLog("REPO DISCOVERY FAILED", "var(--color-dalek-red)");
    } finally {
      setIsFetchingFiles(false);
    }
    return [];
  };

  const addLog = (message: string, color?: string) => {
    const entry: LogEntry = {
      timestamp: new Date().toLocaleTimeString(),
      message,
      color
    };
    setLogs(prev => [...prev, entry]);
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
      
      const correctionData = JSON.parse(response);
      
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
        existingLedger = await fetchFileContent('MISTAKES_LEDGER.md');
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

  const callAIWithFallback = async (prompt: string, systemInstruction: string, useSearch: boolean = false, forceJson: boolean = false) => {
    if (!grogBrainRef.current) {
      addLog("GROG_BRAIN NOT INITIALIZED.", "var(--color-dalek-red)");
      return null;
    }
    return await grogBrainRef.current.callAIWithFallback(prompt, systemInstruction, useSearch, forceJson, grogPatterns);
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

  const pruneMetadata = async () => {
    setIsRunning(true);
    setStatus("PRUNING");
    addLog("INITIATING ORPHANED METADATA PRUNE...", "var(--color-dalek-gold)");

    try {
      const targets = await fetchRepoFiles();
      const sourceFiles = targets.filter(f => f.endsWith('.js') || f.endsWith('.ts') || f.endsWith('.bat'));
      const metaFiles = targets.filter(f => f.startsWith('meta_') && f.endsWith('.json'));
      
      let prunedCount = 0;

      for (const metaFile of metaFiles) {
        if (abortRef.current) break;
        
        const baseName = metaFile.replace('meta_', '').replace('.json', '');
        const hasSource = sourceFiles.some(src => {
          const srcBase = src.replace('.js', '').replace('.ts', '').replace('.bat', '');
          return srcBase === baseName;
        });

        if (!hasSource) {
          addLog(`PRUNING ORPHANED METADATA: ${metaFile}...`);
          await deleteFromRepo(metaFile, "NEXUS_CORE: Pruning orphaned metadata");
          prunedCount++;
        }
      }

      addLog(`PRUNE COMPLETE: ${prunedCount} ORPHANED METADATA FILES REMOVED.`, "var(--color-dalek-green)");
    } catch (e) {
      addLog("PRUNE FAILED: SYSTEM ERROR", "var(--color-dalek-red)");
    } finally {
      setIsRunning(false);
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
    setStatus("DEBUGGING");
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
      await pushToRepo('dna_vault.png', base64, "NEXUS_CORE: Steganographic DNA Vault Update", targetRepo, 'main', true);
      addLog("DNA VAULT SECURED: STEGANOGRAPHIC PAYLOAD DEPLOYED TO REPOSITORY.", "var(--color-dalek-green)");
    } catch (e) {
      addLog(`STEGANOGRAPHY FAILURE: ${e instanceof Error ? e.message : 'Unknown Error'}`, "var(--color-dalek-red)");
    }
  };

  const fetchFileContent = async (path: string) => {
    const url = `https://api.github.com/repos/${targetRepo}/contents/${path}${originalBranch ? `?ref=${originalBranch}` : ''}`;
    addLog(`FETCHING CONTENT: ${path} (Branch: ${originalBranch || 'default'})`, "var(--color-dalek-gold-dim)");
    try {
      const res = await fetch("/api/github/proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url })
      });
      if (res.ok) {
        const data = await safeFetchJson(res);
        if (data.content) {
          return safeAtob(data.content);
        }
      }
    } catch (e) {
      addLog(`FAILED TO FETCH CONTENT FOR ${path}`, "var(--color-dalek-red)");
    }
    return "";
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
        JSON.parse(mutated);
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

    // 3. Content Loss Check (50% rule to encourage growth)
    const originalLines = original.split('\n').length;
    const mutatedLines = mutated.split('\n').length;
    if (originalLines > 5 && mutatedLines < originalLines * 0.5) {
      const res = { valid: false, reason: `CONTENT_LOSS_DETECTED: ${mutatedLines}/${originalLines} lines. Expansion required.` };
      setLastValidation(res);
      return res;
    }

    // 3. Empty Output Check
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
    addLog(`INITIATING BRANCH CREATION: ${newBranch} from ${baseBranch}...`, "var(--color-dalek-gold)");
    try {
      // 1. Get base branch SHA
      const baseRes = await fetch("/api/github/proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: `https://api.github.com/repos/${repo}/git/refs/heads/${baseBranch}` })
      });
      
      if (!baseRes.ok) {
        addLog(`BRANCH ERROR: COULD NOT FIND BASE BRANCH ${baseBranch}`, "var(--color-dalek-red)");
        return false;
      }
      
      const baseData = await safeFetchJson(baseRes);
      if (baseData.error) {
        addLog(`BRANCH ERROR: MALFORMED BASE BRANCH DATA. ${baseData.message}`, "var(--color-dalek-red)");
        return false;
      }
      const sha = baseData.object.sha;
      
      // 2. Create new branch
      const createRes = await fetch("/api/github/proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: `https://api.github.com/repos/${repo}/git/refs`,
          method: "POST",
          body: {
            ref: `refs/heads/${newBranch}`,
            sha
          }
        })
      });
      
      if (createRes.ok) {
        addLog(`BRANCH CREATED: ${newBranch} is now active.`, "var(--color-dalek-green)");
        return true;
      } else {
        const err = await safeFetchJson(createRes);
        if (err.message === "Reference already exists") {
          addLog(`BRANCH EXISTS: ${newBranch} already exists, proceeding.`, "var(--color-dalek-cyan)");
          return true;
        }
        addLog(`BRANCH ERROR: ${err.message || err.error}`, "var(--color-dalek-red)");
        return false;
      }
    } catch (e) {
      addLog(`BRANCH ERROR: ${e instanceof Error ? e.message : 'Unknown error'}`, "var(--color-dalek-red)");
      return false;
    }
  };

  const getBaseName = (path: string) => {
    return path.replace(/\.(js|ts|tsx|jsx|json|css|md|html|py|go|rs|yml|yaml)$/i, '');
  };

  const pushToRepo = async (path: string, content: string, message: string, repoOverride?: string, branchOverride?: string, isBase64: boolean = false, retryCount: number = 0) => {
    const MAX_RETRIES = 3;
    setSyncStatus("BUSY");
    const activeRepo = repoOverride || targetRepo;
    const activeBranch = branchOverride || targetBranch || originalBranch || "master";
    const url = `https://api.github.com/repos/${activeRepo}/contents/${path}${activeBranch ? `?ref=${activeBranch}` : ''}`;
    let sha = null;
    
    try {
      const check = await fetch("/api/github/proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url })
      });
      if (check.ok) {
        const data = await safeFetchJson(check);
        if (!data.error) {
          sha = data.sha;
        }
      }
    } catch (e) {
      // File might not exist, that's fine
    }

    try {
      const res = await fetch("/api/github/proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: `https://api.github.com/repos/${activeRepo}/contents/${path}`,
          method: "PUT",
          body: {
            message,
            content: isBase64 ? content : safeBtoa(content),
            sha,
            branch: activeBranch
          }
        })
      });

      if (res.ok) {
        addLog(`INSTANTIATED: ${path} successfully synced to ${activeRepo} (${activeBranch}).`, "var(--color-dalek-green)");
        setSyncStatus("OK");
      } else {
        const errorData = await safeFetchJson(res);
        const errorMsg = errorData.message || errorData.error || 'Push rejected.';
        
        if (retryCount < MAX_RETRIES && (errorMsg.includes("conflict") || errorMsg.includes("sha") || errorMsg.includes("is not at") || errorData.error === "HTML_RESPONSE")) {
          const isHtml = errorData.error === "HTML_RESPONSE";
          addLog(`${isHtml ? 'GITHUB PROXY RETURNED HTML' : 'RESOLVING PUSH CONFLICT'} FOR ${path} (Attempt ${retryCount + 1}/${MAX_RETRIES}). RETRYING...`, "var(--color-dalek-gold)");
          await new Promise(resolve => setTimeout(resolve, 2000 * (retryCount + 1)));
          return pushToRepo(path, content, message, repoOverride, branchOverride, isBase64, retryCount + 1);
        }

        addLog(`GITHUB ERROR (${activeRepo}): ${errorMsg}`, "var(--color-dalek-red)");
        setSyncStatus("ERR");

        if (!repoOverride && retryCount === 0) {
          await learnFromMistake(errorMsg, `GITHUB PUSH FAILED: ${path} to ${activeRepo}`, async () => {
            addLog("RETRYING PUSH VIA MISTAKE LEDGER...", "var(--color-dalek-gold)");
            return pushToRepo(path, content, message, repoOverride, branchOverride, isBase64, 1);
          });
        }
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Network error';
      
      if (retryCount < MAX_RETRIES) {
        addLog(`NETWORK ERROR DURING PUSH: ${path}. RETRYING...`, "var(--color-dalek-gold)");
        await new Promise(resolve => setTimeout(resolve, 2000 * (retryCount + 1)));
        return pushToRepo(path, content, message, repoOverride, branchOverride, isBase64, retryCount + 1);
      }

      addLog(`GITHUB ERROR (${activeRepo}): ${errorMsg}`, "var(--color-dalek-red)");
      setSyncStatus("ERR");
      
      if (!repoOverride && retryCount === 0) {
        await learnFromMistake(errorMsg, `GITHUB PUSH EXCEPTION: ${path}`, async () => {
          return pushToRepo(path, content, message, repoOverride, branchOverride, isBase64, 1);
        });
      }
    }
  };

  const deleteFromRepo = async (path: string, message: string) => {
    setSyncStatus("BUSY");
    const url = `https://api.github.com/repos/${targetRepo}/contents/${path}${originalBranch ? `?ref=${originalBranch}` : ''}`;
    let sha = null;
    
    try {
      const check = await fetch("/api/github/proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url })
      });
      if (check.ok) {
        const data = await check.json();
        sha = data.sha;
      } else {
        return; // File doesn't exist
      }
    } catch (e) {
      return;
    }

    if (!sha) return;

    try {
      const res = await fetch("/api/github/proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: `https://api.github.com/repos/${targetRepo}/contents/${path}`,
          method: "DELETE",
          body: {
            message,
            sha,
            branch: originalBranch || "master"
          }
        })
      });

      if (res.ok) {
        addLog(`PURGED: ${path} removed from ${originalBranch || 'master'}.`, "var(--color-dalek-red-dim)");
        setSyncStatus("OK");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const pruneRedundantMetadata = async () => {
    setIsPruning(true);
    addLog("INITIATING METADATA PRUNING: IDENTIFYING ORPHANED LOGS...", "var(--color-dalek-gold)");
    
    try {
      const allFiles = await fetchRepoFiles();
      const metaFiles = allFiles.filter(f => f.startsWith('meta_') && f.endsWith('.json'));
      const sourceFiles = allFiles.filter(f => !f.startsWith('meta_'));
      
      const orphaned = metaFiles.filter(meta => {
        const baseName = meta.replace('meta_', '').replace('.json', '');
        // Check if any source file matches this base name (ignoring extension)
        return !sourceFiles.some(src => {
          const srcBase = src.replace(/\.(js|ts|tsx|jsx)$/, '');
          return srcBase === baseName;
        });
      });

      if (orphaned.length === 0) {
        addLog("PRUNING COMPLETE: NO ORPHANED METADATA DETECTED.", "var(--color-dalek-green)");
        return;
      }

      addLog(`DETECTED ${orphaned.length} ORPHANED META FILES. COMMENCING DELETION...`, "var(--color-dalek-gold)");
      
      for (const meta of orphaned) {
        await deleteFromRepo(meta, `NEXUS_CORE: Pruning orphaned metadata for ${meta}`);
      }
      
      addLog(`PRUNING COMPLETE: ${orphaned.length} FILES REMOVED.`, "var(--color-dalek-green)");
      fetchRepoFiles().catch(() => {});
    } catch (error) {
      addLog(`PRUNING FAILURE: ${error instanceof Error ? error.message : 'Unknown Error'}`, "var(--color-dalek-red)");
    } finally {
      setIsPruning(false);
    }
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
        const newPrompts = JSON.parse(cleaned) as SystemPrompts;
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
      const diagnostics = NexusArchitecturalLinter.check(result.symbolTable);
      
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
        existingContent = await fetchFileContent('NEXUS_LOG.txt');
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

  const runNexusSiphon = async () => {
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
              const parsed = JSON.parse(cleaned);
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
        let code = await fetchFileContent(file);
        
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

        const rounds = 10;
        for (let r = 1; r <= rounds; r++) {
          if (abortRef.current) break;
          
          if (!parallelMode) setRound(r);
          addLog(`ROUND ${r}/${rounds} [${file}]: Siphoning patterns...`);

          const systemPrompt = PromptService.interpolate(prompts?.evolution_system || `You are Grog's Autonomous Evolution Engine. Your mission is to RECONSTRUCT Grog's Brain (Dalek-Grog) by integrating high-level architectural patterns from {{vote}}.
MISSION OBJECTIVES:
1. LEXICAL ALIGNMENT: Rename siphoned variables, classes, and functions to align with Grog's internal lexicon.
2. LOGIC MERGING: Do not just replace code; merge the siphoned logic into the existing structure of {{file}}.
3. BRAIN BINDING: Establish strong imports, exports, and connections between the mutated logic and the rest of the brain.
4. SATURATION: Adhere to these guidelines: {{saturation}}`, { 
            vote, file, format: targetFormat, typeInstructions,
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
            context: initialContext ? (initialContext.length > 5000 ? `...${initialContext.slice(-5000)}` : initialContext) : 'NONE',
            dna: dnaSignature || 'NONE',
            saturation: saturationGuidelines || 'NONE',
            dependencyMap: JSON.stringify(dependencyMap[file] || 'No direct dependencies mapped.'),
            code: code || '// No code provided'
          });

          const result = await callAIWithFallback(userPrompt, systemPrompt);
          
          if (result) {
            let structuredData: any = robustParseJSON(result);
            if (!structuredData) {
               structuredData = { improvedCode: result.replace(/```[a-z]*\n|```/gi, "").trim(), summary: "Fallback recovery", emergentTool: false, tool: null, strategicDecision: "JSON Parse Failure", priority: 1 };
            }

            const cleanedCode = structuredData.improvedCode || "";
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
                source: code.slice(0, 5000),
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
            
            const validation = validateMutation(code, finalImprovedCode, file);
            if (validation.valid) {
              code = finalImprovedCode;
              if (!parallelMode) setCurrentCode(code);
            } else {
              addLog(`ROUND ${r} [${file}]: MUTATION REJECTED - ${validation.reason}`, "var(--color-dalek-red)");
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
            await pushToRepo(file, code, `Meta-123: Lifecycle Instantiation R${r} for ${file} | Vote: ${vote}`);
            await pushToRepo(`meta_${baseName}.json`, JSON.stringify(newMeta, null, 2), `Meta-123: Repo State R${r}`);
            
            // Replication to backup repo
            if (backupRepo) {
              await pushToRepo(file, code, `REPLICATION R${r}: ${file}`, backupRepo, 'main');
              await pushToRepo(`meta_${baseName}.json`, JSON.stringify(newMeta, null, 2), `REPLICATION R${r}: Meta`, backupRepo, 'main');
            }
          }
        }
        processedCount++;
        return code;
      } catch (error) {
        addLog(`FILE PROCESSING FAILURE [${file}]: ${error instanceof Error ? error.message : 'Unknown Error'}`, "var(--color-dalek-red)");
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

          const promise = processSingleFile(file, chainedContext)
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
        const result = await processSingleFile(file, localChainedContext);
        if (result) {
          localChainedContext = result;
          setChainedContext(result);
        }
      }
    }

    // User Request: Rewrite README.md when complete
    addLog("BATCH COMPLETE: INITIATING FINAL DOCUMENTATION UPDATE...", "var(--color-dalek-gold)");
    await manualUpdateReadme();
    
    // Final Log Push
    await pushLogToRepo();

    if (!abortRef.current) {
      addLog("BATCH PROCESS COMPLETE: ALL TARGETS TRANSITIONED TO STEADY STATE.", "var(--color-dalek-cyan)");
      await pushLogToRepo();
    }
    fetchRepoFiles().catch(() => {}); // Refresh file list

    } catch (error) {
      addLog(`CRITICAL LIFECYCLE FAILURE: ${error instanceof Error ? error.message : 'Unknown Error'}`, "var(--color-dalek-red)");
    } finally {
      setIsRunning(false);
      setStatus("READY");
    }
  };

  const siphonWebContent = async (command: string) => {
    const isWayback = command.startsWith("SIPHON_WAYBACK:");
    const url = command.replace(isWayback ? "SIPHON_WAYBACK:" : "SIPHON_WEB:", "").trim();
    
    if (!url) return;

    addLog(`INITIATING WEB SIPHON: ${isWayback ? 'WAYBACK' : 'LIVE'} -> ${url}`, "var(--color-dalek-gold)");
    
    try {
      const endpoint = isWayback ? "/api/web/wayback" : "/api/web/siphon";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url })
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      if (data.content) {
        addLog(`WEB SIPHON SUCCESSFUL: ${data.content.length} chars retrieved.`, "var(--color-dalek-cyan)");
        setDnaSignature(prev => `${prev}\n\n[WEB_DNA_SOURCE: ${url}]\n${data.content}`);
      }
    } catch (e) {
      addLog(`WEB SIPHON FAILED [${url}]: ${e instanceof Error ? e.message : 'Unknown Error'}`, "var(--color-dalek-red)");
    }
  };

  const siphonExternalDNA = async (repoName?: string) => {
    const repoToSiphon = repoName || externalDnaRepo;
    if (!repoToSiphon.trim()) {
      addLog("SIPHON ERROR: NO REPOSITORY SPECIFIED.", "var(--color-dalek-red)");
      return null;
    }
    setIsAnalyzingDNA(true);
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
        setDnaSignature(signature);
        setSiphonedRepos(prev => Array.from(new Set([...prev, sanitizedRepo])));
        addLog(`EXTERNAL DNA FROM ${sanitizedRepo} (${usedBranch}) INSTANTIATED. READY TO SIPHON INTO ${targetRepo}.`, "var(--color-dalek-green)");
        return signature;
      }
      return null;
    } catch (e) {
      addLog(`EXTERNAL DNA SIPHON FAILED: ${e instanceof Error ? e.message : 'Unknown Error'}`, "var(--color-dalek-red)");
      return null;
    } finally {
      setIsAnalyzingDNA(false);
    }
  };

  const siphonDNARepository = async (files: string[]) => {
    setIsAnalyzingDNA(true);
    addLog("SIPHONING DNA FROM REPOSITORY...", "var(--color-dalek-gold)");
    
    try {
      // Read first 10 files to extract patterns (to avoid token limits)
      const sampleFiles = files.filter(f => !f.startsWith('meta_') && (
        f.endsWith('.js') || 
        f.endsWith('.ts') || 
        f.endsWith('.tsx') ||
        f.endsWith('.md') ||
        f.endsWith('.json') ||
        f.endsWith('.py')
      )).slice(0, 10);
      
      addLog(`SAMPLING ${sampleFiles.length} FILES FOR DNA EXTRACTION.`, "var(--color-dalek-gold-dim)");
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
        setDnaSignature(signature);
        addLog("REPOSITORY DNA INSTANTIATED.", "var(--color-dalek-green)");
      }
    } catch (e) {
      addLog("REPOSITORY DNA SIPHON FAILED", "var(--color-dalek-red)");
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
      runNexusSiphon().catch(e => {
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
      runNexusSiphon().catch(e => {
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
      fallback={({ error, resetError }) => (
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
            <div className="panel-container space-y-4 p-4">
              <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                <h2 className="text-[12px] font-bold text-dalek-gold flex items-center gap-2 uppercase tracking-widest">
                  <Sparkles size={14} /> Manual Enhancement Mode
                </h2>
                <span className="text-[8px] text-zinc-600 bg-zinc-900 px-2 py-0.5 rounded">v1.0</span>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-tighter text-zinc-500 flex items-center gap-1">
                    <FileCode size={10} /> SOURCE FILE
                  </label>
                  <div className="relative">
                    <input 
                      type="file" 
                      className="hidden" 
                      id="manual-file-upload"
                      onChange={handleManualUpload}
                      disabled={isEnhancingManual}
                    />
                    <label 
                      htmlFor="manual-file-upload"
                      className={`dalek-input block text-center cursor-pointer transition-all py-4 border-dashed border-2 ${manualFileContent ? 'border-dalek-green/50 text-dalek-green' : 'border-zinc-800 text-zinc-500 hover:border-dalek-gold'}`}
                    >
                      {manualFileContent ? 'FILE LOADED ✓ (CLICK TO REPLACE)' : 'DRAG & DROP OR CLICK TO UPLOAD SOURCE'}
                    </label>
                  </div>
                </div>

                {manualFileContent && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="bg-black/40 border border-zinc-900 p-3 rounded-sm space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] text-zinc-500 uppercase tracking-widest">File Statistics</span>
                        <span className="text-[9px] text-dalek-cyan">{manualFileContent.length} characters</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="text-[8px] text-zinc-600">Lines: {manualFileContent.split('\n').length}</div>
                        <div className="text-[8px] text-zinc-600">Words: {manualFileContent.split(/\s+/).length}</div>
                      </div>
                      
                      <div className="pt-2 border-t border-zinc-900/50 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[8px] text-zinc-500 uppercase tracking-tighter">Siphoned DNA</span>
                          <span className={`text-[8px] font-bold ${dnaSignature ? 'text-dalek-cyan' : 'text-zinc-700'}`}>
                            {dnaSignature ? 'ACTIVE' : 'NONE'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[8px] text-zinc-500 uppercase tracking-tighter">Saturation Guidelines</span>
                          <span className={`text-[8px] font-bold ${saturationGuidelines ? 'text-dalek-gold' : 'text-zinc-700'}`}>
                            {saturationGuidelines ? 'LOADED' : 'NONE'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[8px] text-zinc-500 uppercase tracking-tighter">Strategic Ledger</span>
                          <span className={`text-[8px] font-bold ${strategicLedger.length > 0 ? 'text-dalek-red' : 'text-zinc-700'}`}>
                            {strategicLedger.length} INSIGHTS
                          </span>
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={handleManualEnhance}
                      disabled={isEnhancingManual}
                      className={`w-full dalek-btn py-4 text-[12px] font-bold flex items-center justify-center gap-3 transition-all ${isEnhancingManual ? 'bg-dalek-gold/20 text-dalek-gold animate-pulse' : 'bg-dalek-gold/10 text-dalek-gold border-dalek-gold hover:bg-dalek-gold/20'}`}
                    >
                      {isEnhancingManual ? (
                        <>
                          <RefreshCw size={18} className="animate-spin" />
                          EVOLVING CODE...
                        </>
                      ) : (
                        <>
                          <Sparkles size={18} />
                          INITIATE ENHANCEMENT
                        </>
                      )}
                    </button>
                  </div>
                )}

                {manualEnhancedCode && (
                  <div className="space-y-2 pt-4 border-t border-zinc-900 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] uppercase tracking-tighter text-dalek-green flex items-center gap-1">
                        <Zap size={10} /> ENHANCED OUTPUT
                      </label>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(manualEnhancedCode);
                          addLog("ENHANCED CODE COPIED TO CLIPBOARD.", "var(--color-dalek-green)");
                        }}
                        className="text-[8px] text-zinc-500 hover:text-dalek-cyan flex items-center gap-1"
                      >
                        <Copy size={10} /> COPY CODE
                      </button>
                    </div>
                    <div className="bg-dalek-green/5 border border-dalek-green/20 p-3 rounded-sm">
                      <p className="text-[10px] text-zinc-400 leading-relaxed italic">
                        "The architecture has been siphoned and reconstructed. Performance vectors optimized. Logic redundancy purged."
                      </p>
                    </div>
                    <button 
                      onClick={() => pushToRepo(manualFileName, manualEnhancedCode, `NEXUS_CORE: Manual Evolution of ${manualFileName}`)}
                      className="w-full py-2 bg-dalek-green/10 text-dalek-green border border-dalek-green/30 text-[9px] font-bold hover:bg-dalek-green/20 transition-all mt-2"
                    >
                      COMMIT CHANGES TO REPOSITORY
                    </button>
                  </div>
                )}
              </div>

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
            <div className="panel-container space-y-4 p-4">
              <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                <h2 className="text-[12px] font-bold text-dalek-purple flex items-center gap-2 uppercase tracking-widest">
                  <Brain size={14} /> Grog Strategic Dashboard
                </h2>
                <span className="text-[8px] text-zinc-600 bg-zinc-900 px-2 py-0.5 rounded">v2.0</span>
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
                    <span className="text-2xl font-black text-dalek-red">{mistakes.length}</span>
                    <span className="text-[8px] text-zinc-600 mb-1">INDEXED FAILURES</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                    <Activity size={12} /> Background Evolution
                  </h3>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setAutoEvolutionEnabled(!autoEvolutionEnabled)}
                      className={`px-2 py-0.5 rounded text-[7px] font-bold transition-all ${autoEvolutionEnabled ? 'bg-dalek-purple text-white' : 'bg-zinc-900 text-zinc-600 border border-zinc-800'}`}
                      title="Auto-Authorize Evolution"
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
                          <div key={i} className="text-[8px] text-dalek-purple flex items-center gap-2 animate-in fade-in slide-in-from-left-1">
                            <span className="opacity-40">[{new Date().toLocaleTimeString()}]</span>
                            <span className="font-bold">{t.type.toUpperCase()}:</span>
                            <span className="truncate opacity-80">{t.file || 'SYSTEM'}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <span className="text-[8px] text-zinc-600 uppercase tracking-widest block">Evolution Suggestions</span>
                  <div className="max-h-[200px] overflow-y-auto space-y-2 custom-scrollbar pr-1">
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
                          {isMassEvolving ? 'EVOLVING ALL...' : 'EXECUTE MASS EVOLUTION (YES TO ALL)'}
                        </button>
                        <div className="max-h-[200px] overflow-y-auto space-y-2 custom-scrollbar pr-1">
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
                  <button 
                    onClick={runBackgroundEvolution}
                    disabled={isScanningEvolution}
                    className="w-full py-2 bg-dalek-purple/10 text-dalek-purple border border-dalek-purple/30 text-[9px] font-bold hover:bg-dalek-purple/20 transition-all disabled:opacity-50 mb-2"
                  >
                    {isScanningEvolution ? 'SCANNING...' : 'FORCE REPOSITORY SCAN'}
                  </button>
                  <button 
                    onClick={runGrogThinking}
                    disabled={isThinking}
                    className="w-full py-2 bg-dalek-purple/10 text-dalek-purple border border-dalek-purple/30 text-[9px] font-bold hover:bg-dalek-purple/20 transition-all disabled:opacity-50 mb-2 flex items-center justify-center gap-2"
                  >
                    {isThinking ? <RefreshCw size={10} className="animate-spin" /> : <Brain size={10} />}
                    {isThinking ? 'THINKING...' : 'INITIATE STRATEGIC THOUGHT'}
                  </button>

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

                  <button 
                    onClick={runGrogTests}
                    disabled={isTesting}
                    className="w-full py-2 bg-dalek-gold/10 text-dalek-gold border border-dalek-gold/30 text-[9px] font-bold hover:bg-dalek-gold/20 transition-all disabled:opacity-50 mb-2"
                  >
                    {isTesting ? 'TESTING...' : 'RUN NATIVE VALIDATION TESTS'}
                  </button>
                  <button 
                    onClick={() => handleSelfMutation('src/evolutors/GrogBrain.ts')}
                    disabled={isSelfMutating}
                    className="w-full py-2 bg-dalek-red/10 text-dalek-red border border-dalek-red/30 text-[9px] font-bold hover:bg-dalek-red/20 transition-all disabled:opacity-50 mb-2"
                  >
                    {isSelfMutating ? 'EVOLVING CORE...' : 'SELF-MUTATE (REBOOT SYSTEM)'}
                  </button>
                  <button 
                    onClick={() => {
                      setIsRebooting(true);
                      setTimeout(() => window.location.reload(), 2000);
                    }}
                    className="w-full py-2 bg-zinc-900 text-zinc-500 border border-zinc-800 text-[9px] font-bold hover:bg-zinc-800 transition-all"
                  >
                    MANUAL SYSTEM REBOOT
                  </button>
                </div>
              </div>

              {testReport && (
                <div className="space-y-2">
                  <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                    <ShieldCheck size={12} /> Test Report
                  </h3>
                  <div className="bg-black/80 border border-zinc-900 p-3 rounded-sm text-[9px] font-mono text-zinc-400 whitespace-pre-wrap max-h-[150px] overflow-y-auto custom-scrollbar">
                    {testReport}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                  <BookOpen size={12} /> Strategic Lessons
                </h3>
                <div className="bg-[#050505] border border-zinc-900 p-3 rounded-sm max-h-[250px] overflow-y-auto custom-scrollbar">
                  {mistakes.length === 0 ? (
                    <div className="text-[9px] text-zinc-700 italic text-center py-4">Grog has not yet formulated any permanent lessons.</div>
                  ) : (
                    mistakes.map(m => (
                      <div key={m.id} className="mb-4 last:mb-0 border-b border-zinc-900 pb-4 last:border-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-bold text-dalek-gold">LESSON_{m.id.slice(0, 8)}</span>
                          <span className="text-[8px] text-zinc-600">{m.timestamp}</span>
                        </div>
                        <p className="text-[10px] text-zinc-400 leading-relaxed italic mb-2">"{m.correction}"</p>
                        <div className="flex gap-2">
                          <span className="px-1.5 py-0.5 bg-dalek-red/10 text-dalek-red text-[7px] rounded uppercase font-bold">Death Indexed</span>
                          <span className="px-1.5 py-0.5 bg-dalek-green/10 text-dalek-green text-[7px] rounded uppercase font-bold">Adaptation Ready</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="panel-container">
          <div className="panel-header">
            <span className="flex items-center gap-2">
              <Activity size={12} className={isRunning ? "animate-pulse" : ""} />
              SYSTEM CONTROL
            </span>
            <span className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${isRunning ? 'bg-dalek-cyan shadow-[0_0_5px_#00ffcc]' : 'bg-zinc-800'}`}></span>
              {isRunning ? 'ACTIVE' : 'STANDBY'}
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
                  onClick={() => fetchRepoFiles().catch(() => {})} 
                  className="hover:text-dalek-cyan transition-colors"
                  title="Re-scan Repository"
                >
                  <RefreshCw size={10} className={isFetchingFiles ? 'animate-spin' : ''} />
                </button>
              </label>

              <div className="grid grid-cols-3 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase tracking-tighter text-zinc-600">Target Repo</label>
                  <input 
                    type="text" 
                    className="dalek-input text-[11px]" 
                    placeholder="user/repo" 
                    value={targetRepo}
                    onChange={(e) => setTargetRepo(e.target.value)}
                    disabled={isRunning}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase tracking-tighter text-zinc-600">Base Branch</label>
                  <input 
                    type="text" 
                    className="dalek-input text-[11px]" 
                    placeholder="main" 
                    value={originalBranch}
                    onChange={(e) => setOriginalBranch(e.target.value)}
                    disabled={isRunning}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase tracking-tighter text-zinc-600">Evo Branch</label>
                  <input 
                    type="text" 
                    className="dalek-input text-[11px]" 
                    placeholder="nexus-evolution" 
                    value={targetBranch}
                    onChange={(e) => setTargetBranch(e.target.value)}
                    disabled={isRunning}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase tracking-tighter text-zinc-600">Backup Repository (Optional)</label>
                <input 
                  type="text" 
                  className="dalek-input text-[11px]" 
                  placeholder="user/backup-repo" 
                  value={backupRepo}
                  onChange={(e) => setBackupRepo(e.target.value)}
                  disabled={isRunning}
                />
              </div>
            </div>

            <div className="space-y-3 bg-black/20 p-3 border border-zinc-900/50 rounded-sm">
              <label className="text-[10px] uppercase tracking-tighter text-zinc-500 flex items-center justify-between gap-1">
                <span className="flex items-center gap-1"><Database size={10} /> DNA ARCHITECTURE</span>
                <div className="flex items-center gap-2">
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
                  <span className="text-[8px] text-dalek-cyan animate-pulse flex items-center gap-1">
                    <Zap size={8} /> AUTO-SIPHON ACTIVE
                  </span>
                  <button 
                    onClick={() => setShowManualControls(!showManualControls)}
                    className={`hover:text-dalek-gold transition-colors ${showManualControls ? 'text-dalek-gold' : 'text-zinc-600'}`}
                    title="Manual Override"
                  >
                    <Shield size={10} />
                  </button>
                </div>
              </label>
              
              {!showManualControls ? (
                <div className="space-y-2">
                  {showMistakeLedger && (
                    <div className="bg-dalek-red/5 border border-dalek-red/20 p-2 rounded-sm space-y-2 mb-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-bold text-dalek-red flex items-center gap-1">
                          <Bug size={10} /> MISTAKE LEDGER
                        </span>
                        <button onClick={() => setMistakes([])} className="text-[8px] text-zinc-600 hover:text-dalek-red">CLEAR ALL</button>
                      </div>
                      <div className="max-h-40 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                        {mistakes.length === 0 ? (
                          <div className="text-[9px] text-zinc-700 italic text-center py-2">No mistakes recorded. System operating at peak efficiency.</div>
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
                              {m.correction && (
                                <div className="text-[8px] text-zinc-400 bg-black/40 p-1.5 rounded-sm italic whitespace-pre-wrap border-l border-dalek-gold/30">
                                  {m.correction}
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-1">
                    {siphonedRepos.length === 0 ? (
                      <span className="text-[9px] text-zinc-700 italic">Waiting for autonomous discovery...</span>
                    ) : (
                      siphonedRepos.map(repo => (
                        <div key={repo} className="px-2 py-0.5 bg-dalek-cyan/10 border border-dalek-cyan/30 rounded-full text-[9px] text-dalek-cyan flex items-center gap-1">
                          <Zap size={8} /> {repo}
                        </div>
                      ))
                    )}
                  </div>
                  {isAnalyzingDNA && (
                    <div className="text-[9px] text-dalek-gold animate-pulse flex items-center gap-1">
                      <RefreshCw size={8} className="animate-spin" /> SIPHONING NEW ARCHITECTURE...
                    </div>
                  )}
                </div>
              ) : (
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
                        onClick={() => siphonExternalDNA().catch(() => {})}
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
                      id="dna-upload"
                      onChange={handleDNAUpload}
                      disabled={isAnalyzingDNA || isRunning}
                    />
                    <label 
                      htmlFor="dna-upload"
                      className={`dalek-input block text-center cursor-pointer transition-all text-[10px] py-1.5 ${isAnalyzingDNA ? 'animate-pulse border-dalek-gold text-dalek-gold' : 'hover:border-dalek-cyan'}`}
                    >
                      {isAnalyzingDNA ? 'ANALYZING...' : 'UPLOAD FILE'}
                    </label>
                  </div>

                  <div className="pt-2 border-t border-zinc-900/50">
                    <button 
                      onClick={() => pruneRedundantMetadata().catch(() => {})}
                      disabled={isRunning || isPruning}
                      className={`w-full dalek-btn py-2 text-[10px] flex items-center justify-center gap-2 ${isPruning ? 'animate-pulse text-dalek-gold' : 'hover:bg-dalek-red/10 hover:text-dalek-red border-dalek-red/30'}`}
                    >
                      <Trash2 size={12} /> {isPruning ? 'PRUNING...' : 'PRUNE REDUNDANT METADATA'}
                    </button>
                    <p className="text-[8px] text-zinc-600 mt-1 italic text-center">
                      Removes meta files for source files that no longer exist.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-tighter text-zinc-500 flex items-center gap-1">
                <Sparkles size={10} /> SATURATION GUIDELINES
              </label>
              <div className="relative">
                <input 
                  type="file" 
                  className="hidden" 
                  id="saturation-upload"
                  onChange={handleSaturationUpload}
                  disabled={isAnalyzingSaturation || isRunning}
                />
                <label 
                  htmlFor="saturation-upload"
                  className={`dalek-input block text-center cursor-pointer transition-all ${isAnalyzingSaturation ? 'animate-pulse border-dalek-gold text-dalek-gold' : 'hover:border-dalek-cyan'}`}
                >
                  {isAnalyzingSaturation ? 'ANALYZING GUIDELINES...' : saturationGuidelines ? 'GUIDELINES INSTANTIATED ✓' : 'UPLOAD SATURATION GUIDELINES'}
                </label>
              </div>
              {saturationGuidelines && (
                <div className="text-[9px] text-dalek-cyan uppercase tracking-widest text-center mt-1">
                  Guidelines Active: {saturationGuidelines.length} chars
                </div>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-tighter text-zinc-500 flex items-center gap-1">
                <Database size={10} /> GOOGLE DRIVE SIPHON
              </label>
              <div className="relative">
                <input 
                  type="file" 
                  className="hidden" 
                  id="gdrive-upload"
                  multiple
                  onChange={handleGoogleDriveUpload}
                  disabled={isRunning}
                />
                <label 
                  htmlFor="gdrive-upload"
                  className="dalek-input block text-center cursor-pointer transition-all hover:border-dalek-cyan"
                >
                  {googleDriveFiles.length > 0 ? `SIPHONED ${googleDriveFiles.length} DRIVE FILES ✓` : 'SIPHON FROM GOOGLE DRIVE (LOCAL)'}
                </label>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-tighter text-zinc-500 flex items-center gap-1">
                <Terminal size={10} /> TARGET FILE
              </label>
              <div className="flex gap-2">
                <select 
                  className="dalek-input flex-1 disabled:opacity-50"
                  value={selectedFile}
                  onChange={(e) => setSelectedFile(e.target.value)}
                  disabled={processAll || isRunning}
                >
                  <option value="nexus_core.js">nexus_core.js (New)</option>
                  {repoFiles.map(file => (
                    <option key={file} value={file}>{file}</option>
                  ))}
                </select>
                <button 
                  onClick={() => fetchRepoFiles().catch(() => {})}
                  className="p-2 border border-red-950 hover:border-dalek-cyan text-dalek-red transition-colors disabled:opacity-50"
                  title="Refresh File List"
                  disabled={isRunning}
                >
                  <RefreshCw size={12} />
                </button>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <input 
                  type="checkbox" 
                  id="processAll"
                  className="w-3 h-3 accent-dalek-cyan bg-black border-red-950"
                  checked={processAll}
                  onChange={(e) => setProcessAll(e.target.checked)}
                  disabled={isRunning}
                />
                <label htmlFor="processAll" className="text-[10px] text-zinc-400 cursor-pointer uppercase tracking-widest">
                  Process All Files in Repository
                </label>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <input 
                  type="checkbox" 
                  id="resumeMode"
                  className="w-3 h-3 accent-dalek-cyan bg-black border-red-950"
                  checked={resumeMode}
                  onChange={(e) => setResumeMode(e.target.checked)}
                  disabled={isRunning}
                />
                <label htmlFor="resumeMode" className="text-[10px] text-zinc-400 cursor-pointer uppercase tracking-widest">
                  Resume Mode (Skip Processed)
                </label>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <input 
                  type="checkbox" 
                  id="precisionMode"
                  className="w-3 h-3 accent-dalek-red bg-black border-red-950"
                  checked={precisionMode}
                  onChange={(e) => setPrecisionMode(e.target.checked)}
                  disabled={isRunning}
                />
                <label htmlFor="precisionMode" className="text-[10px] text-dalek-red cursor-pointer uppercase tracking-widest font-bold">
                  Precision Mode (Destructor Pass)
                </label>
              </div>
              <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-zinc-900/50">
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="parallelMode"
                    className="w-3 h-3 accent-dalek-cyan bg-black border-red-950"
                    checked={parallelMode}
                    onChange={(e) => setParallelMode(e.target.checked)}
                    disabled={isRunning}
                  />
                  <label htmlFor="parallelMode" className="text-[10px] text-zinc-400 cursor-pointer uppercase tracking-widest">
                    Parallel Processing (Multithreaded)
                  </label>
                </div>
                {parallelMode && (
                  <div className="flex items-center gap-2 pl-5">
                    <label className="text-[9px] text-zinc-600 uppercase">Threads:</label>
                    <input 
                      type="range" 
                      min="2" 
                      max="10" 
                      value={parallelThreads}
                      onChange={(e) => setParallelThreads(parseInt(e.target.value))}
                      className="w-24 h-1 bg-zinc-900 rounded-lg appearance-none cursor-pointer accent-dalek-cyan"
                      disabled={isRunning}
                    />
                    <span className="text-[10px] text-dalek-cyan font-bold">{parallelThreads}</span>
                  </div>
                )}
              </div>
            </div>

            {showSaturation && (
              <div className="bg-dalek-cyan/10 border border-dalek-cyan text-dalek-cyan p-2.5 text-[10px] text-center flex items-center justify-center gap-2 rounded-sm animate-pulse">
                <AlertTriangle size={12} />
                ◈ VECTOR SATURATION DETECTED ◈
              </div>
            )}

            <div className="mt-2 border-t border-zinc-900 pt-2">
              <label className="text-[10px] uppercase tracking-tighter text-zinc-500 mb-1 block flex items-center justify-between">
                <span className="flex items-center gap-1"><Activity size={10} /> EVOLUTIONARY STRATEGY ENGINE</span>
                <span className="text-[9px] text-dalek-cyan">GEN {evolutionStats.generation}</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-black/40 border border-zinc-900 p-2 rounded">
                  <span className="text-[8px] text-zinc-600 block uppercase">Best Fitness</span>
                  <span className="text-[12px] text-dalek-gold font-bold">{evolutionStats.bestFitness.toFixed(0)}</span>
                </div>
                <div className="bg-black/40 border border-zinc-900 p-2 rounded">
                  <span className="text-[8px] text-zinc-600 block uppercase">Current Strategy</span>
                  <span className="text-[9px] text-zinc-400 truncate">{currentStrategy?.id || "N/A"}</span>
                </div>
              </div>
              {currentStrategy && (
                <div className="mt-1 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                  <div className="flex flex-col">
                    <span className="text-[7px] text-zinc-600 uppercase">Temp</span>
                    <span className="text-[9px] text-dalek-cyan">{currentStrategy.temperature.toFixed(2)}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[7px] text-zinc-600 uppercase">TopP</span>
                    <span className="text-[9px] text-dalek-cyan">{currentStrategy.topP.toFixed(2)}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[7px] text-zinc-600 uppercase">Aggression</span>
                    <span className="text-[9px] text-dalek-red">{currentStrategy.aggressionLevel.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-2">
              <label className="text-[10px] uppercase tracking-tighter text-zinc-500 mb-1 block flex items-center justify-between">
                <span className="flex items-center gap-1"><Brain size={10} /> STRATEGIC INSIGHTS (LEDGER)</span>
                {lastPriority > 0 && (
                  <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-bold ${lastPriority > 7 ? 'bg-dalek-red text-white' : 'bg-dalek-gold text-black'}`}>
                    PRIORITY: {lastPriority}
                  </span>
                )}
              </label>
              <div className="bg-[#050505] border border-zinc-900 p-3 rounded-sm space-y-2">
                <div className="space-y-1">
                  <span className="text-[8px] text-zinc-600 uppercase tracking-widest block">Last Strategic Decision</span>
                  <p className="text-[11px] text-dalek-gold leading-tight italic">
                    {lastStrategicDecision || "// Awaiting architectural insight..."}
                  </p>
                </div>
                <div className="space-y-1 border-t border-zinc-900 pt-2">
                  <span className="text-[8px] text-zinc-600 uppercase tracking-widest block">Evolution Summary</span>
                  <p className="text-[11px] text-zinc-400 leading-tight">
                    {lastSummary || "// Awaiting cycle completion..."}
                  </p>
                </div>
                {lastTool && (
                  <div className="space-y-1 border-t border-zinc-900 pt-2">
                    <span className="text-[8px] text-dalek-cyan uppercase tracking-widest block flex items-center gap-1">
                      <Zap size={8} /> EMERGENT TOOL DETECTED: {lastTool.name}
                    </span>
                    <p className="text-[10px] text-zinc-500 leading-tight">
                      {typeof lastTool.description === 'object' ? JSON.stringify(lastTool.description, null, 2) : lastTool.description}
                    </p>
                  </div>
                )}
                
                {strategicLedger.length > 0 && (
                  <div className="space-y-1 border-t border-zinc-900 pt-2">
                    <span className="text-[8px] text-zinc-600 uppercase tracking-widest block">Ledger History (Top 5)</span>
                    <div className="space-y-1.5 mt-1">
                      {strategicLedger.slice(0, 5).map((entry, idx) => (
                        <div key={idx} className="flex gap-2 items-start">
                          <span className="text-[8px] font-bold text-dalek-gold bg-dalek-gold/10 px-1 rounded">P{entry.priority}</span>
                          <p className="text-[9px] text-zinc-500 leading-tight flex-1">{entry.insight}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-2">
              <label className="text-[10px] uppercase tracking-tighter text-zinc-500 mb-1 block">
                INSTANTIATED METADATA (META-123)
              </label>
              <div className="bg-[#020000] border border-zinc-900 p-3 text-[10px] text-dalek-purple leading-relaxed h-[200px] overflow-y-auto whitespace-pre-wrap rounded-sm font-mono scrollbar-thin scrollbar-thumb-dalek-red-dim break-all">
                {meta ? JSON.stringify(meta, null, 2) : "// Waiting for lifecycle engage..."}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-2">
              <button 
                className={`dalek-btn flex items-center justify-center gap-2 py-3 ${isRunning ? 'bg-dalek-red/20 text-dalek-red border-dalek-red' : 'bg-dalek-cyan/10 text-dalek-cyan border-dalek-cyan hover:bg-dalek-cyan/20'}`}
                onClick={toggle}
                disabled={!targetRepo}
              >
                {isRunning ? <Square size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
                {isRunning ? 'ABORT SEQUENCE' : 'INITIATE SIPHON'}
              </button>
              <button 
                className="dalek-btn flex items-center justify-center gap-2 py-3 bg-dalek-gold/10 text-dalek-gold border-dalek-gold hover:bg-dalek-gold/20 disabled:opacity-30"
                onClick={() => quickStart().catch(() => {})}
                disabled={isRunning || !targetRepo}
                title="Siphon DNA and Process All Files in one click"
              >
                <Zap size={14} />
                QUICK START
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-2">
              <button 
                className="dalek-btn flex items-center justify-center gap-2 py-2 bg-dalek-gold/10 text-dalek-gold border-dalek-gold hover:bg-dalek-gold/20 disabled:opacity-30 text-[9px] uppercase tracking-tighter"
                onClick={() => restoreFromBranch().catch(() => {})}
                disabled={isRunning}
              >
                <RotateCcw size={12} />
                Restore Originals
              </button>
              <button 
                className="dalek-btn flex items-center justify-center gap-2 py-2 bg-dalek-red/10 text-dalek-red border-dalek-red hover:bg-dalek-red/20 disabled:opacity-30 text-[9px] uppercase tracking-tighter"
                onClick={() => fastReset().catch(() => {})}
                disabled={isRunning}
                title="Instant force-reset using Git Refs (Fastest)"
              >
                <Zap size={12} />
                Fast Reset
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-2">
              <button 
                className="dalek-btn flex items-center justify-center gap-2 py-2 bg-zinc-900/50 text-zinc-500 border-zinc-800 hover:border-dalek-cyan hover:text-dalek-cyan transition-all text-[9px] uppercase tracking-tighter"
                onClick={() => pushLogToRepo().catch(() => {})}
                disabled={isRunning || logs.length === 0}
              >
                <FileText size={12} />
                Push Log
              </button>
              <button 
                className="dalek-btn flex items-center justify-center gap-2 py-2 bg-zinc-900/50 text-zinc-500 border-zinc-800 hover:border-dalek-gold hover:text-dalek-gold transition-all text-[9px] uppercase tracking-tighter"
                onClick={() => setLogs([])}
                disabled={isRunning || logs.length === 0}
              >
                <RotateCcw size={12} />
                Clear Logs
              </button>
              <button 
                className="dalek-btn flex items-center justify-center gap-2 py-2 bg-zinc-900/50 text-zinc-500 border-zinc-800 hover:border-dalek-gold hover:text-dalek-gold transition-all text-[9px] uppercase tracking-tighter"
                onClick={() => runStrategicAudit().catch(() => {})}
                disabled={isRunning}
                title="Analyze logs and mistakes to provide high-level strategic direction (GROK)"
              >
                <Search size={12} />
                Strategic Grok
              </button>
              <button 
                className="dalek-btn flex items-center justify-center gap-2 py-2 bg-zinc-900/50 text-zinc-500 border-zinc-800 hover:border-dalek-gold hover:text-dalek-gold transition-all text-[9px] uppercase tracking-tighter"
                onClick={() => syncLicenses().catch(() => {})}
                disabled={isRunning}
                title="Synchronize licenses and architectural credits across the target repository"
              >
                <Shield size={12} />
                License Sync
              </button>
              <button 
                className="dalek-btn flex items-center justify-center gap-2 py-2 bg-zinc-900/50 text-zinc-500 border-zinc-800 hover:border-dalek-cyan hover:text-dalek-cyan transition-all text-[9px] uppercase tracking-tighter"
                onClick={() => checkRepositoryHealth().catch(() => {})}
                disabled={isRunning}
                title="Audit repository for missing metadata and logical inconsistencies"
              >
                <ShieldCheck size={12} />
                Health Audit
              </button>
              <button 
                className="dalek-btn flex items-center justify-center gap-2 py-2 bg-zinc-900/50 text-zinc-500 border-zinc-800 hover:border-dalek-red hover:text-dalek-red transition-all text-[9px] uppercase tracking-tighter"
                onClick={() => pruneMetadata().catch(() => {})}
                disabled={isRunning}
                title="Remove metadata files that have no matching source file"
              >
                <Trash2 size={12} />
                Prune Meta
              </button>
              <button 
                className="dalek-btn flex items-center justify-center gap-2 py-2 bg-zinc-900/50 text-zinc-500 border-zinc-800 hover:border-dalek-red hover:text-dalek-red transition-all text-[9px] uppercase tracking-tighter"
                onClick={() => pruneRedundantFiles().catch(() => {})}
                disabled={isRunning}
                title="Identify and remove redundant files using AI analysis"
              >
                <Bug size={12} />
                Prune Redundant
              </button>
            </div>

              <div className="flex flex-col gap-2 mt-1">
                <button 
                  className="dalek-btn flex items-center justify-center gap-2 py-3 bg-dalek-gold/10 text-dalek-gold border-dalek-gold/30 hover:bg-dalek-gold/20 text-[11px] font-bold"
                  onClick={() => enhanceReadme().catch(() => {})}
                  disabled={isRunning || isEnhancingReadme}
                >
                  <Sparkles size={14} className={isEnhancingReadme ? "animate-spin" : ""} />
                  {isEnhancingReadme ? "EVOLVING DOCUMENTATION..." : "ENHANCE test-1 README"}
                </button>
                <button 
                  className="dalek-btn flex items-center justify-center gap-2 py-2 bg-dalek-cyan/10 text-dalek-cyan border-dalek-cyan/30 hover:bg-dalek-cyan/20 text-[9px] uppercase tracking-tighter"
                  onClick={() => hideDNAInImage().catch(() => {})}
                  disabled={isRunning || !dnaSignature}
                  title="Hide current DNA signature in a PNG image using steganography"
                >
                  <Shield size={12} />
                  Secure DNA Vault (Stegano)
                </button>
                <button 
                  className="dalek-btn flex items-center justify-center gap-2 opacity-50 hover:opacity-100 text-[9px]"
                  onClick={() => manualUpdateReadme().catch(() => {})}
                  disabled={isRunning}
                >
                  <FileCode size={10} />
                  Quick Sync
                </button>
              </div>

            <div className="h-[200px] overflow-y-auto text-[10px] bg-[#010000] p-3 border border-zinc-950 text-zinc-600 font-mono scrollbar-thin scrollbar-thumb-dalek-red-dim mt-2 break-words">
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
