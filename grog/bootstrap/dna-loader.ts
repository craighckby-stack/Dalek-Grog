/**
 * DNA Chunk Loader
 * ================
 * Loads DNA chunks from Test-1 knowledge base
 * Supports both local and GitHub sources
 */

import fs from 'fs/promises';
import path from 'path';

interface DNAChunk {
  id: string;
  source: string;
  content: string;
  patterns: string[];
  loadedAt: string;
}

interface DNALoadResult {
  chunksLoaded: number;
  totalFiles: number;
}

// File types that contain valuable DNA patterns
const DNA_FILE_EXTENSIONS = [
  '.ts', '.tsx', '.js', '.jsx', '.py', '.java', '.go', '.rs',
  '.md', '.json', '.yaml', '.yml', '.toml'
];

// Directories to skip
const SKIP_DIRS = [
  'node_modules', '.git', 'dist', 'build', '__pycache__',
  '.next', 'coverage', 'vendor', 'bin'
];

// Priority files that should always be loaded first
const PRIORITY_FILES = [
  'README.md', 'CONSTITUTIONAL_GOVERNANCE.md', 'DALEK.md',
  'grog/lessons/PATTERNS.json', 'grog/rules/HARD_RULES.json'
];

export class DNAChunkLoader {
  private chunksPath: string;
  private chunks: Map<string, DNAChunk> = new Map();

  constructor(chunksPath: string) {
    this.chunksPath = chunksPath;
  }

  /**
   * Load DNA chunks from local Test-1 directory
   */
  async loadFromLocal(basePath: string, maxChunks: number): Promise<DNALoadResult> {
    console.log(`   Scanning: ${basePath}`);
    
    const files = await this.discoverFiles(basePath);
    console.log(`   Discovered: ${files.length} files`);
    
    const chunks = await this.processFiles(files, maxChunks);
    await this.saveChunks(chunks);
    
    return {
      chunksLoaded: chunks.length,
      totalFiles: files.length
    };
  }

  /**
   * Load DNA chunks from GitHub repository
   */
  async loadFromGitHub(repo: string, maxChunks: number): Promise<DNALoadResult> {
    console.log(`   Fetching from GitHub: ${repo}`);
    
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
      throw new Error('GITHUB_TOKEN required for remote DNA loading');
    }

    // Fetch file list from GitHub API
    const response = await fetch(
      `https://api.github.com/repos/${repo}/git/trees/main?recursive=1`,
      {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const data = await response.json();
    const files = data.tree
      .filter((item: any) => item.type === 'blob')
      .filter((item: any) => this.isDNAFile(item.path))
      .map((item: any) => item.path);

    console.log(`   Discovered: ${files.length} files via GitHub API`);

    // For GitHub, we prioritize key files to reduce API calls
    const priorityFiles = files.filter((f: string) => 
      PRIORITY_FILES.some(p => f.includes(p))
    );

    const chunks: DNAChunk[] = [];
    
    // Load priority files first
    for (const file of priorityFiles.slice(0, maxChunks / 2)) {
      try {
        const content = await this.fetchGitHubFile(repo, file, token);
        chunks.push(this.createChunk(file, content, 'github'));
      } catch (e) {
        console.log(`   ! Could not fetch ${file}`);
      }
    }

    // Then load other important files
    const otherFiles = files.filter((f: string) => !PRIORITY_FILES.some(p => f.includes(p)));
    for (const file of otherFiles.slice(0, maxChunks - chunks.length)) {
      try {
        const content = await this.fetchGitHubFile(repo, file, token);
        chunks.push(this.createChunk(file, content, 'github'));
      } catch (e) {
        // Skip files that can't be fetched
      }
    }

    await this.saveChunks(chunks);

    return {
      chunksLoaded: chunks.length,
      totalFiles: files.length
    };
  }

  /**
   * Discover all DNA files in a directory
   */
  private async discoverFiles(basePath: string): Promise<string[]> {
    const files: string[] = [];
    
    async function scan(dir: string): Promise<void> {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          
          if (entry.isDirectory()) {
            if (!SKIP_DIRS.includes(entry.name)) {
              await scan(fullPath);
            }
          } else if (entry.isFile() && DNA_FILE_EXTENSIONS.some(ext => entry.name.endsWith(ext))) {
            files.push(fullPath);
          }
        }
      } catch (e) {
        // Skip directories we can't read
      }
    }

    await scan(basePath);
    return files;
  }

  /**
   * Process files and extract DNA chunks
   */
  private async processFiles(files: string[], maxChunks: number): Promise<DNAChunk[]> {
    // Sort: priority files first, then by size (smaller = more focused patterns)
    const sorted = files.sort((a, b) => {
      const aIsPriority = PRIORITY_FILES.some(p => a.includes(p));
      const bIsPriority = PRIORITY_FILES.some(p => b.includes(p));
      if (aIsPriority && !bIsPriority) return -1;
      if (!aIsPriority && bIsPriority) return 1;
      return 0;
    });

    const chunks: DNAChunk[] = [];
    
    for (const file of sorted.slice(0, maxChunks)) {
      try {
        const content = await fs.readFile(file, 'utf-8');
        chunks.push(this.createChunk(file, content, 'local'));
      } catch (e) {
        // Skip files we can't read
      }
    }

    return chunks;
  }

  /**
   * Create a DNA chunk from file content
   */
  private createChunk(filePath: string, content: string, source: string): DNAChunk {
    // Extract patterns from content
    const patterns = this.extractPatterns(content);
    
    return {
      id: this.generateId(filePath),
      source: filePath,
      content: content.slice(0, 50000), // Limit chunk size
      patterns,
      loadedAt: new Date().toISOString()
    };
  }

  /**
   * Extract architectural patterns from content
   */
  private extractPatterns(content: string): string[] {
    const patterns: string[] = [];
    
    // Class definitions
    const classMatches = content.match(/class\s+\w+/g);
    if (classMatches) patterns.push(...classMatches.slice(0, 5));
    
    // Interface definitions
    const interfaceMatches = content.match(/interface\s+\w+/g);
    if (interfaceMatches) patterns.push(...interfaceMatches.slice(0, 5));
    
    // Function signatures
    const funcMatches = content.match(/(?:async\s+)?function\s+\w+|const\s+\w+\s*=\s*(?:async\s+)?\([^)]*\)\s*=>/g);
    if (funcMatches) patterns.push(...funcMatches.slice(0, 5));
    
    // Import patterns
    const importMatches = content.match(/import\s+.*?from\s+['"][^'"]+['"]/g);
    if (importMatches) patterns.push(...importMatches.slice(0, 3));
    
    return [...new Set(patterns)];
  }

  /**
   * Generate unique ID for chunk
   */
  private generateId(filePath: string): string {
    return Buffer.from(filePath).toString('base64').slice(0, 16);
  }

  /**
   * Fetch file from GitHub
   */
  private async fetchGitHubFile(repo: string, path: string, token: string): Promise<string> {
    const response = await fetch(
      `https://api.github.com/repos/${repo}/contents/${path}`,
      {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3.raw'
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`Could not fetch ${path}`);
    }
    
    return response.text();
  }

  /**
   * Check if file is a DNA file
   */
  private isDNAFile(filePath: string): boolean {
    return DNA_FILE_EXTENSIONS.some(ext => filePath.endsWith(ext)) &&
           !SKIP_DIRS.some(dir => filePath.includes(`/${dir}/`));
  }

  /**
   * Save chunks to local storage
   */
  private async saveChunks(chunks: DNAChunk[]): Promise<void> {
    await fs.mkdir(this.chunksPath, { recursive: true });
    
    // Save index
    const index = chunks.map(c => ({
      id: c.id,
      source: c.source,
      patterns: c.patterns
    }));
    
    await fs.writeFile(
      path.join(this.chunksPath, 'index.json'),
      JSON.stringify(index, null, 2),
      'utf-8'
    );
    
    // Save each chunk
    for (const chunk of chunks) {
      await fs.writeFile(
        path.join(this.chunksPath, `${chunk.id}.json`),
        JSON.stringify(chunk, null, 2),
        'utf-8'
      );
    }
    
    console.log(`   Saved ${chunks.length} chunks to ${this.chunksPath}`);
  }

  /**
   * Get loaded chunks
   */
  getChunks(): Map<string, DNAChunk> {
    return this.chunks;
  }

  /**
   * Search chunks by pattern
   */
  searchByPattern(query: string): DNAChunk[] {
    const results: DNAChunk[] = [];
    const queryLower = query.toLowerCase();
    
    for (const chunk of this.chunks.values()) {
      if (chunk.patterns.some(p => p.toLowerCase().includes(queryLower))) {
        results.push(chunk);
      }
    }
    
    return results;
  }
}

export default DNAChunkLoader;
