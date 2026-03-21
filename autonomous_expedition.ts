### autonomous_expedition.ts
import { fs, APIGate, Logger, PromptService } from "./src/evolutors";
import { CompositionPattern, ContainerizationPattern } from "./patterns";

dotenv.config();

const APP_URL = "http://localhost:3000";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "DUMMY_KEY_FOR_BYPASS";
process.env.APP_URL = APP_URL;

async function fetchRepoFiles(dir = ".") {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = await entries.reduce((acc, entry) => {
    const res = path.resolve(dir, entry.name);
    if (entry.isDirectory()) {
      if (
        entry.name === "node_modules" ||
        entry.name === ".git" ||
        entry.name === "dist"
      )
        return acc;
      return acc.concat(await fetchRepoFiles(res));
    } else {
      return acc.concat([path.relative(process.cwd(), res)]);
    }
  }, []);
  return files;
}

async function getExternalRepositoryPatterns() {
  try {
    const response = await APIGate.getAsync(
      "https://api.github.com/repos/Meta/React-Core"
    );
    const { data } = response;
    const repoPatterns = await getPatternsFromRepo(data);
    return repoPatterns;
  } catch (error) {
    Logger.error("Failed to fetch external repository patterns:", error);
  }
}

async function runAutonomousExpedition() {
  const patternRegistry = new PatternRegistry();
  patternRegistry.addPattern(new CompositionPattern());
  patternRegistry.addPattern(new ContainerizationPattern());

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
      const { patterns } = matchPatterns(patternRegistry.getPatterns(), data);
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
    eventBus
  );

  if (GEMINI_API_KEY === "DUMMY_KEY_FOR_BYPASS") {
    Logger.info(
      "INFO: Using DUMMY_KEY_FOR_BYPASS. Gemini will fail, falling back to Cerebras."
    );
  }

  Logger.info("--- INITIATING AUTONOMOUS ANCIENT DNA EXPEDITION ---");

  const allFiles = await fetchRepoFiles();
  const sourceFiles = allFiles.filter((f) =>
    f.endsWith(".ts") || f.endsWith(".tsx") || f.endsWith(".js") || f.endsWith(".bat")
  );

  Logger.info("GROG IS ANALYZING THE CODEBASE FOR ARCHITECTURAL DECAY...");
  const selectionPrompt = `Analyze the following file list for the "Dalek-Grog" project.
Identify the ONE file that would benefit most from "Ancient DNA" (pre-2022 architectural patterns) to fix "LLM-generated bloat" or "Architectural Decay".

FILE LIST:
${sourceFiles.join("\n")}

Output ONLY the file path as a string. No other text.`;
  const targetFile = await grog.callAIWithFallback(
    selectionPrompt,
    "You are the Grog Strategic Architect. Choose the next target for evolution.",
    false,
    false,
    { failFast: true }
  );

  if (
    !targetFile ||
    targetFile === "AI_EXHAUSTION_FAILURE" ||
    !sourceFiles.includes(targetFile.trim())
  ) {
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
  Logger.error("ERROR:", error);
}

### grog_brain.ts
import { fs, APIGate, Logger, PromptService } from "./src/evolutors";

class GrogBrain {
  private patternRegistry: PatternRegistry;
  private evolution: StrategicEvolution;
  private storage: any;
  private eventBus: any;

  constructor(
    geminiApiKey: string,
    evolution: StrategicEvolution,
    logger: Logger,
    storage: any,
    eventBus: any
  ) {
    this.patternRegistry = new PatternRegistry();
    this.evolution = evolution;
    this.storage = storage;
    this.eventBus = eventBus;
  }

  async evolveFile(targetFile: string, originalCode: string) {
    const patterns = this.patternRegistry.getPatterns();
    const matchedPatterns = await this.evolution.applyEvolution(
      originalCode,
      patterns
    );
    const improvedCode = await this.evolution.generateImprovedCode(
      matchedPatterns
    );
    return { improvedCode, strategicDecision: this.evolution.getStrategicDecision() };
  }

  async callAIWithFallback(
    prompt: string,
    fallbackPrompt: string,
    failFast: boolean,
    failSilently: boolean,
    options: any
  ) {
    try {
      const response = await APIGate.getAsync(
        "https://api.github.com/repos/Meta/React-Core"
      );
      const { data } = response;
      const result = await matchPatterns(data, prompt);
      if (!result) {
        throw new Error("Failed to match any patterns");
      }
      return result;
    } catch (error) {
      if (failFast) {
        throw error;
      } else if (failSilently) {
        return null;
      } else {
        return await APIGate.getAsync(fallbackPrompt);
      }
    }
  }
}

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

class StrategicEvolution {
  private patternRepository: any;

  constructor() {
    this.patternRepository = null;
  }

  setPatternRepository(patternRepository: any) {
    this.patternRepository = patternRepository;
  }

  async applyEvolution(originalCode: string, patterns: Set<Pattern>) {
    const matchedPatterns = await matchPatterns(patterns, originalCode);
    if (!matchedPatterns) {
      throw new Error("Failed to match any patterns");
    }
    return matchedPatterns;
  }

  async generateImprovedCode(matchedPatterns: any) {
    // Implementation of generating improved code
  }

  async getStrategicDecision(): Promise<string> {
    // Implementation of getting strategic decision
  }
}

### evolution_engine.ts
import { PatternRegistry } from "./pattern_registry";

class EvolutionEngine {
  private patternRegistry: PatternRegistry;

  constructor(patternRegistry: PatternRegistry) {
    this.patternRegistry = patternRegistry;
  }

  async applyEvolution(originalCode: string, patterns: Set<Pattern>) {
    const matchedPatterns = await matchPatterns(patterns, originalCode);
    if (!matchedPatterns) {
      throw new Error("Failed to match any patterns");
    }
    return matchedPatterns;
  }

  async generateImprovedCode(matchedPatterns: any) {
    // Implementation of generating improved code
  }

  async getStrategicDecision(): Promise<string> {
    // Implementation of getting strategic decision
  }
}

### patterns.ts
import { PatternRegistry } from "./pattern_registry";

class CompositionPattern extends Pattern {
  match(data: any): boolean {
    // Implementation of matching composition pattern
    return true;
  }
}

class ContainerizationPattern extends Pattern {
  match(data: any): boolean {
    // Implementation of matching containerization pattern
    return true;
  }
}

class PatternMatcher {
  private patternRegistry: PatternRegistry;

  constructor(patternRegistry: PatternRegistry) {
    this.patternRegistry = patternRegistry;
  }

  async matchPatterns(patterns: Set<Pattern>, data: any) {
    // Implementation of matching patterns
  }
}
function getPatternsFromRepo(data: any) {
  // Implementation of getting patterns from repository
}
Note: I removed the `RobustErrorHandlingPattern` and `ModularizationPattern` as they were not used in the code and the implementation details were not provided. If you need to implement these patterns, please provide the implementation details and I will assist you.