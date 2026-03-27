/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * DALEK_GROG v3.1: Autonomous Evolution Engine
 * Copyright (c) 2026 craighckby-stack
 */

import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { motion, AnimatePresence } from "framer-motion";
import * as Sentry from "@sentry/react";
import { Toaster, toast } from 'sonner';
import { Terminal, Cpu, Database, Activity, AlertTriangle, Shield, ShieldCheck, RefreshCw, FileCode, Sparkles, Square, Play, RotateCcw, FileText, Trash2, Zap, Brain, Bug, Search, Copy, BookOpen, Users, LogOut } from 'lucide-react';
import { LogEntry, Mistake, MetaState } from './types';
import { robustParseJSON, safeFetchJson, safeAtob, safeBtoa } from './core/utils';
import { StrategyEvolution } from './evolutors/evolutionService';
import { GrogBrain } from './evolutors/GrogBrain';
import { EventBus } from './core/nexus_core';

import { db, auth, loginWithGoogle, handleFirestoreError, OperationType } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot, setDoc, updateDoc, arrayUnion, getDoc, collection, query, orderBy, limit, addDoc, getDocFromServer } from 'firebase/firestore';

import { GrogDashboard } from './components/GrogDashboard';

export default function App() {
  const [isRunning, setIsRunning] = useState(false);
  const [status, setStatus] = useState('INIT');
  const [round, setRound] = useState(0);
  const [syncStatus, setSyncStatus] = useState('READY');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [deathRecords, setDeathRecords] = useState<any[]>([]);
  const [strategicLessons, setStrategicLessons] = useState<any[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [activeTab, setActiveTab] = useState('grog');

  const grogBrainRef = useRef<GrogBrain | null>(null);
  const eventBusRef = useRef(new EventBus());
  const evolutionEngineRef = useRef(new StrategyEvolution());

  const addLog = (message: string, color: string = "var(--color-dalek-cyan)") => {
    const newLog = { timestamp: new Date().toLocaleTimeString(), message, color };
    setLogs(prev => [newLog, ...prev].slice(0, 100));
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setIsAuthReady(true);
      if (u) {
        addLog(`SHARED_CONSCIOUSNESS: Connected as ${u.displayName || u.email}`, "var(--color-dalek-cyan)");
        
        // Sync user profile to Firestore
        try {
          const userDocRef = doc(db, 'users', u.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (!userDoc.exists()) {
            await setDoc(userDocRef, {
              uid: u.uid,
              email: u.email,
              displayName: u.displayName,
              role: 'user',
              createdAt: new Date().toISOString()
            });
          } else {
            // Update existing profile (e.g. if displayName changed)
            await updateDoc(userDocRef, {
              displayName: u.displayName,
              email: u.email
            });
          }
        } catch (e) {
          console.error("USER_SYNC_ERROR: ", e);
          // Don't use handleFirestoreError here as it might trigger the ErrorBoundary for a non-critical sync
        }
      }
    });

    // Connection test
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'system', 'connection-test'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration. ");
          addLog("SYSTEM_ERROR: Firebase client is offline. Check configuration.", "var(--color-dalek-red)");
        }
      }
    };
    testConnection();

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!grogBrainRef.current) {
      const firebaseOps = {
        recordDeath: async (death: any) => {
          try {
            await addDoc(collection(db, 'deaths'), {
              ...death,
              authorUid: auth.currentUser?.uid || 'anonymous',
              authorName: auth.currentUser?.displayName || 'Anonymous'
            });
          } catch (e) {
            toast.error("SHARED_CONSCIOUSNESS: Death sync failed", {
              description: "Could not persist failure record to Firestore.",
              duration: 4000
            });
            handleFirestoreError(e, OperationType.WRITE, 'deaths');
          }
        },
        recordLesson: async (lesson: any) => {
          try {
            await addDoc(collection(db, 'lessons'), {
              ...lesson,
              authorUid: auth.currentUser?.uid || 'anonymous',
              authorName: auth.currentUser?.displayName || 'Anonymous'
            });
          } catch (e) {
            toast.error("SHARED_CONSCIOUSNESS: Lesson sync failed", {
              description: "Could not persist strategic lesson to Firestore.",
              duration: 4000
            });
            handleFirestoreError(e, OperationType.WRITE, 'lessons');
          }
        },
        getDeaths: async () => [],
        getLessons: async () => [],
        fetch: async (path: string) => {
          try {
            const docRef = doc(db, 'files', path.replace(/\//g, '_'));
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
              return docSnap.data().content;
            }
            return null;
          } catch (e) {
            return null;
          }
        },
        push: async (path: string, content: string, message: string) => {
          try {
            const docRef = doc(db, 'files', path.replace(/\//g, '_'));
            await setDoc(docRef, {
              path,
              content,
              lastUpdated: new Date().toISOString(),
              message
            });
            return true;
          } catch (e) {
            return false;
          }
        }
      };

      const repoOps = {
        fetch: async (path: string) => {
          const res = await fetch('/api/grog/read', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filePath: path })
          });
          const data = await res.json();
          return data.content || null;
        },
        push: async (path: string, content: string, message: string) => {
          const res = await fetch('/api/grog/self-mutate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filePath: path, content })
          });
          const data = await res.json();
          return data.status === 'success';
        }
      };

      grogBrainRef.current = new GrogBrain(undefined, evolutionEngineRef.current, addLog, repoOps, firebaseOps, eventBusRef.current);
    }
  }, []);

  useEffect(() => {
    if (!isAuthReady) return;

    const qDeaths = query(collection(db, 'deaths'), orderBy('timestamp', 'desc'), limit(50));
    const unsubDeaths = onSnapshot(qDeaths, (snap) => {
      const records = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setDeathRecords(records);
    }, (e) => handleFirestoreError(e, OperationType.GET, 'deaths'));

    const qLessons = query(collection(db, 'lessons'), orderBy('timestamp', 'desc'), limit(100));
    const unsubLessons = onSnapshot(qLessons, (snap) => {
      const lessons = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setStrategicLessons(lessons);
    }, (e) => handleFirestoreError(e, OperationType.GET, 'lessons'));

    return () => {
      unsubDeaths();
      unsubLessons();
    };
  }, [isAuthReady]);

  return (
    <div className="min-h-screen bg-black text-white selection:bg-dalek-red selection:text-white font-sans p-4 flex flex-col gap-4">
      <Toaster position="top-right" theme="dark" richColors closeButton />
      
      <header className="flex items-center justify-between border-b-2 border-dalek-red pb-4 bg-black/90 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-dalek-red flex items-center justify-center rounded-sm shadow-[0_0_20px_rgba(255,0,0,0.5)] border border-dalek-red/30">
            <Brain size={24} className="text-black" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tighter text-dalek-red uppercase italic">DALEK_GROG <span className="text-white not-italic font-light opacity-50">v3.1</span></h1>
            <p className="text-[9px] tracking-[0.3em] text-dalek-red uppercase font-bold">Autonomous Strategic Consciousness</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 ml-2 border-l border-zinc-900 pl-4">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-end">
                  <span className="text-[7px] tracking-widest text-dalek-cyan uppercase leading-none mb-1">Shared Consciousness</span>
                  <span className="text-[9px] font-bold text-zinc-400 leading-none">{user.displayName || user.email?.split('@')[0]}</span>
                </div>
                <div className="relative">
                  <img 
                    src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`} 
                    alt="Avatar" 
                    className="w-7 h-7 rounded-sm border border-dalek-cyan/30 grayscale hover:grayscale-0 transition-all cursor-pointer"
                    referrerPolicy="no-referrer"
                    onClick={() => auth.signOut()}
                    title="Click to Disconnect"
                  />
                  <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-dalek-green rounded-full border border-black animate-pulse" />
                </div>
              </div>
            ) : (
              <button 
                onClick={loginWithGoogle}
                className="px-3 py-1.5 bg-dalek-cyan/5 border border-dalek-cyan/30 text-dalek-cyan text-[9px] font-bold tracking-[0.15em] rounded-sm hover:bg-dalek-cyan/10 transition-all flex items-center gap-2 group"
              >
                <Users size={12} className="group-hover:scale-110 transition-transform" />
                CONNECT TO SHARED CONSCIOUSNESS
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-hidden">
        <GrogDashboard 
          grogBrainRef={grogBrainRef}
          currentCode={""}
          mistakes={[]}
          autoEvolutionEnabled={false}
          setAutoEvolutionEnabled={() => {}}
          backgroundEvolutionActive={false}
          setBackgroundEvolutionActive={() => {}}
          evolutionSuggestions={[]}
          runMassEvolution={async () => {}}
          isMassEvolving={false}
          runBackgroundEvolution={async () => {}}
          isScanningEvolution={false}
          runGrogThinking={async () => {}}
          isThinking={false}
          grogEpiphanies={[]}
          runGrogTests={async () => {}}
          isTesting={false}
          handleSelfMutation={async () => {}}
          isSelfMutating={false}
          setIsRebooting={() => {}}
          testReport={null}
          setTestReport={() => {}}
          deathRecords={deathRecords}
          strategicLessons={strategicLessons}
          isAnalyzingDeaths={false}
          deathAnalysis={""}
          analyzeDeathRecords={async () => {}}
          fetchDeathRecords={async () => {}}
          fetchStrategicLessons={async () => {}}
          setSelectedFile={() => {}}
          setActiveTab={setActiveTab}
          addLog={addLog}
          grogThoughts={[]}
          executeDirective={async () => {}}
        />
      </main>

      <footer className="h-[150px] overflow-y-auto text-[10px] bg-[#010000] p-3 border border-zinc-950 text-zinc-600 font-mono scrollbar-thin scrollbar-thumb-dalek-red-dim break-words">
        {logs.map((log, i) => (
          <div key={i} style={{ color: log.color }} className="mb-1 border-b border-zinc-900/30 pb-1">
            <span className="opacity-30 mr-2">[{log.timestamp}]</span>
            {log.message}
          </div>
        ))}
      </footer>
    </div>
  );
}
