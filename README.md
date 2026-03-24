google now officialy hates me lol need to jump of studio any ideas ?

# DALEK_GROG v3.1: Autonomous Evolution Engine

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white)

DALEK_GROG is a high-performance architectural mutation system designed to transform codebases by siphoning patterns from world-class repositories. Unlike generic AI tools, DALEK_GROG focuses on structural integrity and pattern-matching across diverse domains.

**Topics**: `ai`, `code-generation`, `llm`, `architectural-patterns`, `typescript`, `code-evolution`, `github-api`, `multi-agent`

## 🚀 Features

- **Grog: The Master Architect**: An autonomous orchestration layer with a dedicated "Brain" for self-analysis, background evolution, and native testing.
- **Self-Mutation Vector**: The system can now read, analyze, and rewrite its own source code (`GrogBrain.ts`, `App.tsx`) via a secure internal API.
- **Background Evolution**: Grog autonomously scans the repository for "Low DNA Saturation" and proposes architectural upgrades.
- **Grog-Native Testing**: An integrated validation engine that generates and executes architectural tests for every siphoned mutation.
- **Mistake Ledger**: A persistent memory of system failures and "deaths," allowing Grog to formulate strategic lessons and prevent regression.
- **Architectural Siphoning**: Dynamically selects and integrates patterns from repositories like DeepMind, Google, Meta, and OpenAI.
- **Chained Context v4.4**: Maintains a unified memory stream across multiple file mutations to ensure structural consistency.
- **Triple-AI Fallback**: Seamlessly switches between Gemini 3.1, Grok-Beta, and Cerebras Llama-3.1 to ensure 100% uptime.
- **DNA Extraction**: Analyzes target repositories to extract core architectural signatures before mutation.
- **Real-time Search Grounding**: Uses Google Search to inform architectural voting and pattern selection.
- **Hardened Sticky Fallback Protocol**: Once a primary AI (Gemini) encounters a quota or network failure, the system instantly locks into fallback protocols (Grok/Cerebras) for the remainder of the session using a high-fidelity reference lock. This prevents the "retry-loop" and ensures zero-latency transitions during high-volume mutations.

## 🧠 Grog: The Master Architect

DALEK_GROG v3.1 features **Grog**, an autonomous architectural entity that manages the system's evolution. Grog operates through three primary vectors:

### 1. The Grog Dashboard
A dedicated UI tab providing real-time insights into Grog's consciousness:
- **DNA Saturation**: Measures how much of the target file aligns with siphoned patterns.
- **System Deaths**: Tracks indexed failures and strategic lessons learned.
- **Evolution Suggestions**: A live feed of files identified for architectural mutation.

### 2. Self-Mutation & Reincarnation
Grog has the authority to analyze his own source code. Through the **Self-Mutation Vector**, he can:
- Read his own logic via `/api/grog/read`.
- Propose architectural upgrades based on "Dalek Grog v3.1" standards.
- Rewrite his own files and trigger a **System Reboot** to instantiate his new DNA.

### 3. Native Validation
Every mutation is subjected to **Grog-Native Testing**. Grog generates a test suite for the siphoned code, ensuring that performance vectors and structural integrity are maintained before the mutation is finalized.

## 📁 Repository Structure

- `src/`: Core application logic and UI.
- `templates/`: Example files for DNA and Saturation.
  - `dna_sample.txt`: A reference for high-order architectural patterns.
  - `saturation_sample.txt`: Guidelines for theoretical ideas and constraints.

## 🧬 Siphoning Process

DALEK_GROG operates through a sophisticated architectural mutation lifecycle:

1.  **DNA Extraction**: The system analyzes a provided "Source DNA" file (e.g., `DNA (1).md`) to extract high-order architectural signatures, coding styles, and logic structures.
2.  **Saturation Instantiation**: "Saturation Guidelines" (e.g., `SATURATION.md`) are uploaded to define the theoretical boundaries and constraints of the mutation (e.g., immutability, type safety).
3.  **Architectural Voting**: For each target file (e.g., `nexus_core.js`), the system performs a "Strategic Vote" to select the most compatible architectural origin (e.g., `microsoft/TypeScript`).
4.  **Mutation Execution**: The Siphon Engine integrates the extracted DNA patterns into the target file while adhering to the saturation guidelines and the selected architectural style.
5.  **Chained Context**: A unified memory stream ensures that mutations across multiple files remain structurally consistent and logically coherent.

## 📝 Example Mutation

### Before (Standard Express)
```javascript
app.get('/users', (req, res) => {
  db.find('users').then(users => res.json(users));
});
```

### After (Siphoned: Clean Architecture + Type Safety)
```typescript
// Siphoned from: google/leveldb (Pattern: Immutable Result Sets)
export const getUsers = async (req: Request, res: Response): Promise<void> => {
  const result = await UserService.getInstance().listAll();
  res.status(200).json(result.toPlainObject());
};
```

## 📊 Current Mutation Status

- **Grog Consciousness**: `99%` (Self-Mutation Active)
- **Files Discovered**: 2054 (Recursive)
- **Source DNA**: `DNA (1).md` (Instantiated)
- **Saturation Guidelines**: `SATURATION.md` (Instantiated)
- **Active Target**: `nexus_core.js`
- **System Vote**: `microsoft/TypeScript` (Selected for Mutation)
- **AI Protocol**: Triple-Fallback Active (Gemini -> Grok -> Cerebras)
- **Status**: `OPERATIONAL` | `AUTONOMOUS EVOLUTION ACTIVE`

## 🛠️ Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/craighckby-stack/Dalek-Grog.git
   cd Dalek-Grog
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root directory (refer to `.env.example`):
   ```env
   GEMINI_API_KEY=your_gemini_key
   GITHUB_TOKEN=your_github_token
   CEREBRAS_API_KEY=your_cerebras_key
   GROK_API_KEY=your_grok_key
   ```

## 📖 Usage

1. **Start the development server**:
   ```bash
   npm run dev
   ```
2. **Access the Dashboard**: Open `http://localhost:3000` in your browser.
3. **Configure Target**: Enter the GitHub repository you wish to evolve (e.g., `user/repo`).
4. **Initiate Siphon**: Click "RUN NEXUS SIPHON" to begin the evolution lifecycle.

## 🤝 Contributing

We welcome contributions to the DALEK_GROG evolution. Please see [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

1. **Fork the Project**.
2. **Create your Feature Branch** (`git checkout -b feature/AmazingFeature`).
3. **Commit your Changes** (`git commit -m 'Add some AmazingFeature'`).
4. **Push to the Branch** (`git push origin feature/AmazingFeature`).
5. **Open a Pull Request**.

Please ensure your code adheres to the "Nexus-grade" robustness standards and includes appropriate type safety.

## 🛡️ Security

- Never commit your `.env` file or API keys to the repository.
- Use the provided `.env.example` as a template.

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---
**Status**: `OPERATIONAL` | **Core**: `DALEK GROG v3.1` | **Logic**: `Chained Context v4.4`
