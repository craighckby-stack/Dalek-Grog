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

async function getExternalRepositoryPatterns() {
  try {
    const response = await APIGate.getAsync('https://api.github.com/repos/Meta/React-Core');
    const { data } = response;
    const repoPatterns = await HypergraphUtils.getPatternsFromRepo(data);
    return repoPatterns;
  } catch (error) {
    Logger.error('Failed to fetch external repository patterns:', error);
  }
}

async function runAutonomousExpedition() {
  const patternRegistry = new PatternRegistry();
  patternRegistry.addPattern(new ChainContextEnginePattern());
  patternRegistry.addPattern(new FiniteStateMachinePattern());

  const evolution = new StrategicEvolution();
  evolution.setPatternRepository(await getExternalRepositoryPatterns());

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
      Logger.info(`Wrote to storage: ${path}`);
    },
  };

  const eventBus = {
    emit(event, data) {
      Logger.info(`[EVENT] ${event}`);
      const { patterns } = PatternMatcher.matchPatterns(patternRegistry.getPatterns(), data);
      const transformedContent = storage.push(path, data, message);
      await storage.push(path, transformedContent);
    },
    on(event, callback) {
      Logger.info(`Registered on event: ${event}`);
    },
  };

  const grog = new GrogBrain(
    GEMINI_API_KEY,
    evolution,
    Logger.info,
    storage,
    eventBus,
  );

  if (GEMINI_API_KEY === "DUMMY_KEY_FOR_BYPASS") {
    Logger.info("INFO: Using DUMMY_KEY_FOR_BYPASS. Gemini will fail, falling back to Cerebras.");
  }

  Logger.info("--- INITIATING AUTONOMOUS ANCIENT DNA EXPEDITION ---");

  const allFiles = await fetchRepoFiles();
  const sourceFiles = allFiles.filter(f => f.endsWith('.ts') || f.endsWith('.tsx') || f.endsWith('.js') || f.endsWith('.bat'));

  Logger.info("GROG IS ANALYZING THE CODEBASE FOR ARCHITECTURAL DECAY...");
  const selectionPrompt = `Analyze the following file list for the "Dalek-Grog" project.
Identify the ONE file that would benefit most from "Ancient DNA" (pre-2022 architectural patterns) to fix "LLM-generated bloat" or "Architectural Decay".

FILE LIST:
${sourceFiles.join('\n')}

Output ONLY the file path as a string. No other text.`;
  const targetFile = await grog.callAIWithFallback(selectionPrompt, "You are the Grog Strategic Architect. Choose the next target for evolution.", false, false, { failFast: true });

  if (!targetFile || targetFile === "AI_EXHAUSTION_FAILURE" || !sourceFiles.includes(targetFile.trim())) {
    Logger.info(`SELECTION_FAILURE: Grog chose an invalid target: ${targetFile}`);
    return;
  }

  Logger.info(`TARGET_ACQUIRED: ${targetFile}`);
  const originalCode = await fs.readFile(targetFile, "utf-8");
  Logger.info(`EVOLVING ${targetFile}...`);
  const result = await grog.evolveFile(targetFile, originalCode);
  Logger.info("--- EVOLUTION COMPLETE ---");
  Logger.info(`STRATEGIC_DECISION: ${result.strategicDecision}`);
  await fs.writeFile(targetFile, result.improvedCode, "utf-8");
  Logger.info(`MUTATION_SUCCESS: ${targetFile} has been evolved with Ancient DNA.`);
}

try {
  runAutonomousExpedition();
} catch (error) {
  Logger.error('ERROR:', error);
}

// patterns.ts
class PatternRegistry {
  private patternSet: Set<Pattern>;

  constructor() {
    this.patternSet = new Set();
  }

  addPattern(pattern: Pattern) {
    this.patternSet.add(pattern);
  }

  getPatterns(): Set<Pattern> {
    return this.patternSet;
  }
}

abstract class Pattern {
  abstract match(data: any): boolean;
}

class ChainContextEnginePattern extends Pattern {
  match(data: any): boolean {
    // implementation to match the Chain Context Engine pattern
    return true;
  }
}

class FiniteStateMachinePattern extends Pattern {
  match(data: any): boolean {
    // implementation to match the Finite State Machine pattern
    return true;
  }
}

class PatternMatcher {
  private patternRegistry: PatternRegistry;

  constructor(patternRegistry: PatternRegistry) {
    this.patternRegistry = patternRegistry;
  }

  matchPatterns(patterns: Set<Pattern>, data: any): { patterns: Set<Pattern> } {
    const matchedPatterns = new Set<Pattern>();
    for (const pattern of patterns) {
      if (pattern.match(data)) {
        matchedPatterns.add(pattern);
      }
    }
    return { patterns: matchedPatterns };
  }
}

// errorReporter.ts
class ErrorReporter {
  static reportError(message: string, error: any) {
    Logger.error(message);
  }
}