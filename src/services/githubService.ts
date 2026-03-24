
/**
 * GithubService: Encapsulates all GitHub API operations via the local proxy.
 * Prunes redundant fetch calls and provides a clean interface for repository interaction.
 */

import { safeAtob, safeBtoa } from '../core/utils';

export interface GithubFile {
  path: string;
  type: 'blob' | 'tree';
  sha: string;
  size?: number;
  url: string;
}

export class GithubService {
  private repo: string;
  private branch: string;
  private log: (msg: string, color?: string) => void;

  constructor(repo: string, branch: string, log: (msg: string, color?: string) => void) {
    this.repo = repo;
    this.branch = branch;
    this.log = log;
  }

  public updateConfig(repo: string, branch: string) {
    this.repo = repo;
    this.branch = branch;
  }

  private async proxyFetch(url: string, method: string = "GET", body?: any) {
    const res = await fetch("/api/github/proxy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, method, body })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: `HTTP ${res.status}` }));
      throw new Error(err.message || `GitHub API Error: ${res.status}`);
    }

    return res.json();
  }

  /**
   * Fetches all files in the repository recursively, trying multiple branches if needed.
   */
  public async fetchRepoFiles(repo: string = this.repo, branch: string = this.branch): Promise<{ files: string[], usedBranch: string }> {
    const branches = Array.from(new Set([branch, "main", "master", "develop"]));
    let data = null;
    let usedBranch = "";

    for (const b of branches) {
      try {
        data = await this.proxyFetch(`https://api.github.com/repos/${repo}/git/trees/${b}?recursive=1`);
        usedBranch = b;
        break;
      } catch (e) {
        // Try next branch
      }
    }

    if (!data) {
      // Fallback to contents API for flat list if recursive tree fails
      try {
        const fallbackData = await this.proxyFetch(`https://api.github.com/repos/${repo}/contents?ref=${branch}`);
        const files = fallbackData
          .filter((item: any) => item.type === 'file')
          .map((item: any) => item.name);
        return { files, usedBranch: branch };
      } catch (e) {
        throw new Error(`COULD NOT DISCOVER FILES IN ANY BRANCH (${branches.join('/')}).`);
      }
    }

    const files = data.tree
      .filter((item: any) => item.type === 'blob')
      .map((item: any) => item.path);

    return { files, usedBranch };
  }

  /**
   * Fetches the content of a specific file.
   */
  public async fetchFileContent(path: string, repo: string = this.repo, branch: string = this.branch): Promise<string | null> {
    try {
      const data = await this.proxyFetch(`https://api.github.com/repos/${repo}/contents/${path}?ref=${branch}`);
      return safeAtob(data.content);
    } catch (e) {
      return null;
    }
  }

  /**
   * Pushes content to a file in the repository.
   */
  public async pushToRepo(path: string, content: string, message: string, repo: string = this.repo, branch: string = this.branch): Promise<boolean> {
    try {
      // 1. Get current file SHA if it exists
      let sha = null;
      try {
        const existing = await this.proxyFetch(`https://api.github.com/repos/${repo}/contents/${path}?ref=${branch}`);
        sha = existing.sha;
      } catch (e) {
        // File might not exist, which is fine for new files
      }

      // 2. Push update
      await this.proxyFetch(`https://api.github.com/repos/${repo}/contents/${path}`, "PUT", {
        message,
        content: safeBtoa(content),
        sha,
        branch
      });

      return true;
    } catch (e) {
      this.log(`PUSH FAILED [${path}]: ${e instanceof Error ? e.message : 'Unknown Error'}`, "var(--color-dalek-red)");
      return false;
    }
  }

  /**
   * Deletes a file from the repository.
   */
  public async deleteFromRepo(path: string, message: string, repo: string = this.repo, branch: string = this.branch): Promise<boolean> {
    try {
      const existing = await this.proxyFetch(`https://api.github.com/repos/${repo}/contents/${path}?ref=${branch}`);
      await this.proxyFetch(`https://api.github.com/repos/${repo}/contents/${path}`, "DELETE", {
        message,
        sha: existing.sha,
        branch
      });
      return true;
    } catch (e) {
      this.log(`DELETE FAILED [${path}]: ${e instanceof Error ? e.message : 'Unknown Error'}`, "var(--color-dalek-red)");
      return false;
    }
  }

  /**
   * Creates a new branch if it doesn't exist.
   */
  public async createBranch(repo: string, newBranch: string, baseBranch: string): Promise<boolean> {
    try {
      // Check if branch exists
      try {
        await this.proxyFetch(`https://api.github.com/repos/${repo}/branches/${newBranch}`);
        return true; // Already exists
      } catch (e) {
        // Doesn't exist, continue to create
      }

      const baseRef = await this.proxyFetch(`https://api.github.com/repos/${repo}/git/refs/heads/${baseBranch}`);
      await this.proxyFetch(`https://api.github.com/repos/${repo}/git/refs`, "POST", {
        ref: `refs/heads/${newBranch}`,
        sha: baseRef.object.sha
      });

      return true;
    } catch (e) {
      this.log(`BRANCH CREATION FAILED: ${e instanceof Error ? e.message : 'Unknown Error'}`, "var(--color-dalek-red)");
      return false;
    }
  }

  /**
   * Verifies repository accessibility.
   */
  public async verifyRepo(repo: string): Promise<boolean> {
    try {
      await this.proxyFetch(`https://api.github.com/repos/${repo}`);
      return true;
    } catch (e) {
      return false;
    }
  }
}
