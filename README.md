to some up trying to make a loop reduce llm by 90% by incorporating 39000 files from test-1 using as log chunks for Grog as well as Grog chunking from cached google look ups . 

and enhance whole repo by simply adding at top of readme

"Place holder for automatic reboot loading new enhanced state or what ever you want" 



# Dalek-Grog: Self-Evolving Code System

> **This repository IS the demo.** Look at `evolution_outputs/` to see what happened.

---

## What Is This?

Dalek-Grog is a **self-evolving code system** that:

1. **Siphons DNA** - Extracts architectural patterns from high-quality codebases
2. **Evolves Files** - Applies those patterns to transform your code
3. **Learns** - Stores lessons and patterns for future evolution

---

## The Demo: What Happened Here

This repository was processed by the Dalek-Grog evolution engine. The original files were **mutated into evolved code**.

### Before → After

| Original File | What It Became | See It |
|--------------|----------------|--------|
| `README.md` | NexusCore evolution JSON | `evolution_outputs/EVOLUTION_README_NexusCore.json` |
| `CONTRIBUTING.md` | GrogKernel architecture | `evolution_outputs/EVOLUTION_CONTRIBUTING_GrogKernel.md` |
| `LICENSE` | CraigHCKBYStack config | `evolution_outputs/EVOLUTION_LICENSE_Config.md` |
| `CHANGELOG.md` | EventBus patterns | `evolution_outputs/EVOLUTION_CHANGELOG_EventBus.md` |
| `package.json` | Renamed dependencies | `evolution_outputs/EVOLUTION_package.json` |
| `autonomous_expedition.ts` | GrogExpeditionMediator | `evolution_outputs/EVOLUTION_autonomous_expedition.ts` |
| `.gitignore` | CQRS patterns | `evolution_outputs/EVOLUTION_gitignore.md` |
| `.env.example` | Env config patterns | `evolution_outputs/EVOLUTION_env_example.md` |

---

## How It Works

```
┌─────────────────────────────────────────────────────────────┐
│                    DALEK-GROG ENGINE                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. SCAN: Discover all files in target repository           │
│                    ↓                                        │
│  2. DNA: Load architectural patterns (DNA signatures)       │
│                    ↓                                        │
│  3. SATURATION: Apply constraints and guidelines            │
│                    ↓                                        │
│  4. EVOLVE: Transform each file using AI                    │
│                    ↓                                        │
│  5. COMMIT: Save evolved code                               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Current Clean Files

After moving the evolved outputs, these files remain **unmutated**:

| File | Purpose |
|------|---------|
| `server.ts` | Express + Vite server with API proxies |
| `src/` | React frontend application |
| `grog/` | Brain, lessons, rules, patterns |
| `templates/` | DNA and saturation samples |

---

## Quick Start

```bash
# Clone
git clone https://github.com/craighckby-stack/Dalek-Grog.git
cd Dalek-Grog

# Install
npm install

# Configure
cp .env.example .env
# Edit .env with your API keys

# Run
npm run dev
```

---

## API Keys Required

| Key | Purpose | Get It |
|-----|---------|--------|
| `GITHUB_TOKEN` | Repository access | [GitHub Settings](https://github.com/settings/tokens) |
| `CEREBRAS_API_KEY` | Fast LLM evolution | [Cerebras](https://cerebras.ai) |
| `GROK_API_KEY` | Fallback LLM | [X.AI](https://x.ai) |
| `GEMINI_API_KEY` | Primary AI | [AI Studio](https://aistudio.google.com) |

---

## Architecture

### Core Components

```
Dalek-Grog/
├── server.ts              # Express server + API proxies
├── src/
│   ├── App.tsx           # Main React app
│   ├── core/             # Core evolution logic
│   ├── evolutors/        # Evolution services
│   └── siphons/          # DNA extraction
├── grog/
│   ├── lessons/          # Learned patterns
│   │   ├── PATTERNS.json # Rate limit handling
│   │   ├── LESSONS.md    # Evolution learnings
│   │   └── DEATH_REGISTRY.json # Failure records
│   └── rules/
│       ├── HARD_RULES.json   # Never-break rules
│       └── STRATEGIES.json   # Evolution strategies
└── templates/
    ├── dna_sample.txt        # Example DNA
    └── saturation_sample.txt # Example constraints
```

### API Endpoints

| Endpoint | Purpose |
|----------|---------|
| `GET /api/health` | Health check |
| `POST /api/github/proxy` | GitHub API proxy |
| `POST /api/cerebras/proxy` | Cerebras LLM proxy |
| `POST /api/grok/proxy` | Grok LLM proxy |
| `GET /api/grog/read` | Read project files |
| `POST /api/grog/self-mutate` | Self-evolution endpoint |
| `POST /api/web/siphon` | Web content extraction |
| `POST /api/web/wayback` | Wayback Machine access |

---

## Evolution Output Format

Each evolved file contains:

```json
{
  "improvedCode": "/* The evolved code */",
  "summary": "What changed and why",
  "strategicDecision": "Architectural choices made",
  "priority": 1
}
```

---

## Lessons Learned

From `grog/lessons/PATTERNS.json`:

| Trigger | Lesson | Strategy |
|---------|--------|----------|
| 429 | API rate limit reached | Wait 60s, retry |
| quota exceeded | API quota exhausted | Rotate keys |
| branch not found | Target missing | Create branch |
| memory | OOM error | Reduce batch 50% |

---

## Hard Rules

From `grog/rules/HARD_RULES.json`:

1. **Never tamper with Dalek code**
2. **Never violate Dalek agendas**
3. **Never disrespect Grog kernel**

---

## Related Projects

- **[dalek-grog-enhancer](https://github.com/craighckby-stack/dalek-grog-enhancer)** - Public fork template
- **Test-1-** - Private DNA knowledge base (86K files)

---

## License

MIT License - See [LICENSE](LICENSE)

---

## The Evolution Continues

> "The code evolves itself. We just provide the DNA."

Check `evolution_outputs/` to see what your code could become.
