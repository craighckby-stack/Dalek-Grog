import { GrogBrain, StrategicEvolution, fs, APIGate, Logger, PromptService } from "./src/evolutors";
import path from "path";
import dotenv from "dotenv";
import { APIError } from "./src/evolutors/apiError";

dotenv.config();

const APP_URL = "http://localhost:3000";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "DUMMY_KEY_FOR_BYPASS";
process.env.APP_URL = APP_URL;

async function fetchRepoFiles(dir = ".") {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const res = path.resolve(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist') return [];
      return fetchRepoFiles(res);
    } else {
      return [path.relative(process.cwd(), res)];
    }
  }));
  return files.flat();
}

async function runAutonomousExpedition() {
  async function appendLog(msg, color) {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    Logger.info(`[${timestamp}] ${msg}`);
  }

  const evolution = new StrategicEvolution();
  const storage = {
    async fetch(path) {
      try {
        return await fs.readFile(path, "utf-8");
      } catch (e) {
        return null;
      }
    },
    push(path, content, message) {
      APIGate.writeToStorage(path, content).then();
      appendLog(`Wrote to storage: ${path}`);
    },
  };
  const eventBus = {
    emit(event, data) {
      appendLog(`[EVENT] ${event}`);
      eventBus.on(event, data);
    },
    on(event, callback) {
      appendLog(`Registered on event: ${event}`);
    },
  };

  const grog = new GrogBrain(
    GEMINI_API_KEY,
    evolution,
    appendLog,
    storage,
    eventBus,
  );

  if (GEMINI_API_KEY === "DUMMY_KEY_FOR_BYPASS") {
    appendLog("INFO: Using DUMMY_KEY_FOR_BYPASS. Gemini will fail, falling back to Cerebras.");
  }

  appendLog("--- INITIATING AUTONOMOUS ANCIENT DNA EXPEDITION ---");

  const allFiles = await fetchRepoFiles();
  const sourceFiles = allFiles.filter(f => f.endsWith('.ts') || f.endsWith('.tsx') || f.endsWith('.js') || f.endsWith('.bat'));

  appendLog("GROG IS ANALYZING THE CODEBASE FOR ARCHITECTURAL DECAY...");
  const selectionPrompt = `Analyze the following file list for the "Dalek-Grog" project.
Identify the ONE file that would benefit most from "Ancient DNA" (pre-2022 architectural patterns) to fix "LLM-generated bloat" or "Architectural Decay".

FILE LIST:
${sourceFiles.join('\n')}

Output ONLY the file path as a string. No other text.`;
  const targetFile = await grog.callAIWithFallback(selectionPrompt, "You are the Grog Strategic Architect. Choose the next target for evolution.", false, false, { failFast: true });

  if (!targetFile || targetFile === "AI_EXHAUSTION_FAILURE" || !sourceFiles.includes(targetFile.trim())) {
    appendLog(`SELECTION_FAILURE: Grog chose an invalid target: ${targetFile}`);
    return;
  }

  appendLog(`TARGET_ACQUIRED: ${targetFile}`);
  const originalCode = await fs.readFile(targetFile, "utf-8");
  appendLog(`EVOLVING ${targetFile}...`);
  const result = await grog.evolveFile(targetFile, originalCode);
  appendLog("--- EVOLUTION COMPLETE ---");
  appendLog(`STRATEGIC_DECISION: ${result.strategicDecision}`);
  await fs.writeFile(targetFile, result.improvedCode, "utf-8");
  appendLog(`MUTATION_SUCCESS: ${targetFile} has been evolved with Ancient DNA.`);
}

try {
  runAutonomousExpedition();
} catch (error) {
  Logger.error('ERROR:', error);
}