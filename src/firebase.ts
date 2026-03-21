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

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const getEnv = (key: string) => {
  if (typeof process !== 'undefined' && process.env && process.env[key]) return process.env[key];
  try {
    return (import.meta as any).env[key];
  } catch (e) {
    return undefined;
  }
};

const firebaseConfig = {
  apiKey: getEnv('VITE_FIREBASE_API_KEY'),
  authDomain: getEnv('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: getEnv('VITE_FIREBASE_PROJECT_ID'),
  storageBucket: getEnv('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnv('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: getEnv('VITE_FIREBASE_APP_ID')
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
