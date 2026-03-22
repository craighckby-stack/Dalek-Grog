
/**
 * WebSiphonService: Encapsulates web content siphoning logic.
 * Prunes redundant fetch calls and provides a clean interface for web content extraction.
 */

export class WebSiphonService {
  private log: (msg: string, color?: string) => void;

  constructor(log: (msg: string, color?: string) => void) {
    this.log = log;
  }

  /**
   * Siphons content from a URL via live or Wayback Machine.
   */
  public async siphonWebContent(url: string, isWayback: boolean = false): Promise<string | null> {
    this.log(`INITIATING WEB SIPHON: ${isWayback ? 'WAYBACK' : 'LIVE'} -> ${url}`, "var(--color-dalek-gold)");
    
    try {
      const endpoint = isWayback ? "/api/web/wayback" : "/api/web/siphon";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url })
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      if (data.content) {
        this.log(`WEB SIPHON SUCCESSFUL: ${data.content.length} chars retrieved.`, "var(--color-dalek-cyan)");
        return data.content;
      }
      return null;
    } catch (e) {
      this.log(`WEB SIPHON FAILED [${url}]: ${e instanceof Error ? e.message : 'Unknown Error'}`, "var(--color-dalek-red)");
      return null;
    }
  }
}
