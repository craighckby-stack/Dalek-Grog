/**
 * Cache Manager
 * =============
 * Manages cached Google lookups and knowledge
 */

import fs from 'fs/promises';
import path from 'path';

interface CacheEntry {
  id: string;
  query: string;
  response: string;
  source: 'google' | 'wayback' | 'siphon' | 'manual';
  timestamp: string;
  hitCount: number;
}

interface CacheStats {
  totalEntries: number;
  totalHits: number;
  totalMisses: number;
  hitRate: number;
  oldestEntry: string;
  newestEntry: string;
}

export class CacheManager {
  private cachePath: string;
  private cache: Map<string, CacheEntry> = new Map();

  constructor(cachePath: string) {
    this.cachePath = cachePath;
  }

  /**
   * Load all cached entries
   */
  async loadAll(): Promise<CacheEntry[]> {
    try {
      const indexPath = path.join(this.cachePath, 'cache-index.json');
      const indexData = await fs.readFile(indexPath, 'utf-8');
      const entries: CacheEntry[] = JSON.parse(indexData);
      
      for (const entry of entries) {
        this.cache.set(entry.id, entry);
      }
      
      return entries;
    } catch {
      // No cache exists yet
      return [];
    }
  }

  /**
   * Get cached response for a query
   */
  async get(query: string): Promise<CacheEntry | null> {
    const normalizedQuery = this.normalizeQuery(query);
    
    for (const entry of this.cache.values()) {
      if (this.normalizeQuery(entry.query) === normalizedQuery) {
        // Increment hit count
        entry.hitCount++;
        await this.saveIndex();
        return entry;
      }
    }
    
    return null;
  }

  /**
   * Add entry to cache
   */
  async set(query: string, response: string, source: CacheEntry['source']): Promise<CacheEntry> {
    const entry: CacheEntry = {
      id: this.generateId(),
      query,
      response,
      source,
      timestamp: new Date().toISOString(),
      hitCount: 0
    };

    this.cache.set(entry.id, entry);
    await this.saveIndex();
    
    return entry;
  }

  /**
   * Search cache by partial query match
   */
  search(partialQuery: string): CacheEntry[] {
    const results: CacheEntry[] = [];
    const queryLower = partialQuery.toLowerCase();
    
    for (const entry of this.cache.values()) {
      if (entry.query.toLowerCase().includes(queryLower)) {
        results.push(entry);
      }
    }
    
    // Sort by hit count (most used first)
    return results.sort((a, b) => b.hitCount - a.hitCount);
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const entries = Array.from(this.cache.values());
    const totalHits = entries.reduce((sum, e) => sum + e.hitCount, 0);
    
    return {
      totalEntries: entries.length,
      totalHits,
      totalMisses: 0, // Would need to track this separately
      hitRate: entries.length > 0 ? (totalHits / entries.length) * 100 : 0,
      oldestEntry: entries.length > 0 ? 
        entries.reduce((oldest, e) => e.timestamp < oldest ? e.timestamp : oldest, entries[0].timestamp) : 
        'N/A',
      newestEntry: entries.length > 0 ? 
        entries.reduce((newest, e) => e.timestamp > newest ? e.timestamp : newest, entries[0].timestamp) : 
        'N/A'
    };
  }

  /**
   * Clear old entries (keep most used)
   */
  async prune(maxEntries: number = 1000): Promise<number> {
    const entries = Array.from(this.cache.values());
    
    // Sort by hit count (descending) then timestamp (newest first)
    entries.sort((a, b) => {
      if (b.hitCount !== a.hitCount) return b.hitCount - a.hitCount;
      return b.timestamp.localeCompare(a.timestamp);
    });
    
    // Keep top entries
    const toKeep = entries.slice(0, maxEntries);
    
    // Clear and rebuild
    this.cache.clear();
    for (const entry of toKeep) {
      this.cache.set(entry.id, entry);
    }
    
    await this.saveIndex();
    
    return entries.length - toKeep.length;
  }

  /**
   * Import cache from external source
   */
  async importFrom(filePath: string): Promise<number> {
    try {
      const data = await fs.readFile(filePath, 'utf-8');
      const entries: CacheEntry[] = JSON.parse(data);
      
      for (const entry of entries) {
        this.cache.set(entry.id, entry);
      }
      
      await this.saveIndex();
      return entries.length;
    } catch {
      return 0;
    }
  }

  /**
   * Export cache for backup
   */
  async exportTo(filePath: string): Promise<void> {
    const entries = Array.from(this.cache.values());
    await fs.writeFile(filePath, JSON.stringify(entries, null, 2), 'utf-8');
  }

  /**
   * Save index to disk
   */
  private async saveIndex(): Promise<void> {
    await fs.mkdir(this.cachePath, { recursive: true });
    
    const entries = Array.from(this.cache.values());
    await fs.writeFile(
      path.join(this.cachePath, 'cache-index.json'),
      JSON.stringify(entries, null, 2),
      'utf-8'
    );
  }

  /**
   * Normalize query for matching
   */
  private normalizeQuery(query: string): string {
    return query
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s]/g, '');
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
  }
}

export default CacheManager;
