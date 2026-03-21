import { GrogBrain } from "./src/evolutors/GrogBrain.ts";
import { StrategyEvolution } from "./src/evolutors/evolutionService.ts";
import { Logger } from "./src/evolutors/logger.ts";
import { APIGate } from "./src/evolutors/apiGate.ts";
import { PromptService } from "./src/evolutors/promptService.ts";
import fs from "fs/promises";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const APP_URL = "http://localhost:3000";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "DUMMY_KEY_FOR_BYPASS";

process.env.APP_URL = APP_URL; // Force it for GrogBrain

console.log(`DEBUG: APP_URL=${process.env.APP_URL}`);
console.log(`DEBUG: GEMINI_API_KEY=${GEMINI_API_KEY ? 'SET' : 'NOT SET'}`);

async function fetchRepoFiles(dir: string = "."): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const res = path.resolve(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".git" || entry.name === "dist") return [];
      return fetchRepoFiles(res);
    } else {
      return [path.relative(process.cwd(), res)];
    }
  }));
  return files.flat();
}

async function runAutonomousExpedition() {
  const addLog = (msg: string, color?: string) => {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    console.log(`[${timestamp}] ${msg}`);
  };

  const evolution = new StrategyEvolution();
  
  // Mock Storage and EventBus
  const storage = {
    fetch: async (path: string) => {
      try {
        return await fs.readFile(path, "utf-8");
      } catch (e) {
        return null;
      }
    },
    push: async (path: string, content: string, message: string) => {
      await fs.writeFile(path, content, "utf-8");
    }
  };

  const eventBus = {
    emit: (event: string, data: any) => console.log(`[EVENT] ${event}`),
    on: (event: string, callback: any) => {}
  } as any;

  const brain = new GrogBrain(
    GEMINI_API_KEY,
    evolution,
    addLog,
    storage,
    eventBus
  );

  // If Gemini key is dummy, we need to ensure Grok/Cerebras have keys or we use bypass
  if (GEMINI_API_KEY === "DUMMY_KEY_FOR_BYPASS") {
    console.log("WARNING: Using DUMMY_KEY_FOR_BYPASS. Gemini will fail, falling back to Grok/Cerebras.");
  }

  console.log("--- INITIATING AUTONOMOUS ANCIENT DNA EXPEDITION ---");
  
  // 1. Get all files
  const allFiles = await fetchRepoFiles();
  const sourceFiles = allFiles.filter(f => f.endsWith('.ts') || f.endsWith('.tsx') || f.endsWith('.js') || f.endsWith('.bat'));

  // 2. Ask Grog to choose a target
  console.log("GROG IS ANALYZING THE CODEBASE FOR ARCHITECTURAL DECAY...");
  
  const selectionPrompt = `Analyze the following file list for the "Dalek-Grog" project.
Identify the ONE file that would benefit most from "Ancient DNA" (pre-2022 architectural patterns) to fix "LLM-generated bloat" or "Architectural Decay".

FILE LIST:
${sourceFiles.join('\n')}

Output ONLY the file path as a string. No other text.`;

  const targetFile = await brain.callAIWithFallback(selectionPrompt, "You are the Grog Strategic Architect. Choose the next target for evolution.", false, false);
  
  if (!targetFile || targetFile === "AI_EXHAUSTION_FAILURE" || !sourceFiles.includes(targetFile.trim())) {
    console.log(`SELECTION_FAILURE: Grog chose an invalid target: ${targetFile}`);
    return;
  }

  const cleanTarget = targetFile.trim();
  console.log(`TARGET_ACQUIRED: ${cleanTarget}`);

  // 3. Evolve the chosen file
  const currentContent = await fs.readFile(cleanTarget, "utf-8");
  
  console.log(`EVOLVING ${cleanTarget}...`);
  const result = await brain.evolveFile(cleanTarget, currentContent);

  console.log("--- EVOLUTION COMPLETE ---");
  console.log(`STRATEGIC DECISION: ${result.strategicDecision}`);
  console.log(`SUMMARY: ${result.summary}`);
  
  // 4. Save the evolved code
  await fs.writeFile(cleanTarget, result.improvedCode, "utf-8");
  console.log(`MUTATION_SUCCESS: ${cleanTarget} has been evolved with Ancient DNA.`);
}

runAutonomousExpedition().catch(console.error);
