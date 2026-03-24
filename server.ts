import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import TurndownService from "turndown";
import * as ftp from "basic-ftp";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  const turndownService = new TurndownService();

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Proxy for GitHub
  app.post("/api/github/proxy", async (req, res) => {
    const { url, method, body, headers: customHeaders } = req.body;
    const token = process.env.GITHUB_TOKEN;

    if (!token) {
      return res.status(500).json({ error: "GITHUB_TOKEN missing on server" });
    }

    if (!url) {
      return res.status(400).json({ error: "URL REQUIRED" });
    }

    try {
      const response = await fetch(url, {
        method: method || "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `token ${token}`,
          "User-Agent": "DALEK_GROG_EVOLUTION_ENGINE",
          ...customHeaders
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      const data = await response.json().catch(() => null);
      if (data) {
        res.status(response.status).json(data);
      } else {
        res.status(response.status).send();
      }
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Proxy for Cerebras
  app.post("/api/cerebras/proxy", async (req, res) => {
    const { messages, model } = req.body;
    const key = process.env.CEREBRAS_API_KEY;

    if (!key) {
      return res.status(500).json({ error: "CEREBRAS_API_KEY missing on server" });
    }

    try {
      const response = await fetch("https://api.cerebras.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${key}`,
        },
        body: JSON.stringify({
          model: model || "llama3.1-8b",
          messages,
        }),
      });

      const data = await response.json();
      res.status(response.status).json(data);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Proxy for Grok
  app.post("/api/grok/proxy", async (req, res) => {
    const { messages, model } = req.body;
    const key = process.env.GROK_API_KEY;

    if (!key) {
      return res.status(500).json({ error: "GROK_API_KEY missing on server" });
    }

    try {
      const response = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${key}`,
        },
        body: JSON.stringify({
          model: model || "grok-3",
          messages,
        }),
      });

      const data = await response.json();
      res.status(response.status).json(data);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });


  // Grog Self-Mutation Vector
  app.get("/api/grog/read", async (req, res) => {
    const { path: filePath } = req.query;
    const fs = await import("fs/promises");
    
    try {
      const absolutePath = path.resolve(__dirname, filePath as string);
      if (!absolutePath.startsWith(__dirname)) {
        return res.status(403).json({ error: "ACCESS_DENIED: Read restricted to project scope." });
      }

      const content = await fs.readFile(absolutePath, "utf-8");
      res.json({ content });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.post("/api/grog/self-mutate", async (req, res) => {
    const { filePath, content } = req.body;
    const fs = await import("fs/promises");
    
    try {
      // Security: Only allow mutation of files within the project
      const absolutePath = path.resolve(__dirname, filePath);
      if (!absolutePath.startsWith(__dirname)) {
        return res.status(403).json({ error: "ACCESS_DENIED: Mutation restricted to project scope." });
      }

      // Ensure parent directory exists
      const dirPath = path.dirname(absolutePath);
      await fs.mkdir(dirPath, { recursive: true });

      await fs.writeFile(absolutePath, content, "utf-8");
      console.log(`GROK_SELF_MUTATION: Successfully evolved ${filePath}`);
      res.json({ status: "success", message: `File ${filePath} evolved successfully.` });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // WEB SIPHON: Manual internet retrieval for GROK
  app.post("/api/web/siphon", async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "URL REQUIRED" });

    try {
      let content = "";
      
      if (url.startsWith("ftp://")) {
        // FTP SIPHON: Retrieval from legacy FTP archives
        const client = new ftp.Client();
        client.ftp.verbose = false;
        try {
          const parsedUrl = new URL(url);
          await client.access({
            host: parsedUrl.hostname,
            user: parsedUrl.username || "anonymous",
            password: parsedUrl.password || "anonymous",
            secure: false
          });
          
          // Fetch the file content as a string
          const chunks: any[] = [];
          await client.downloadTo(new (await import("stream")).Writable({
            write(chunk, encoding, callback) {
              chunks.push(chunk);
              callback();
            }
          }), parsedUrl.pathname);
          
          content = Buffer.concat(chunks).toString("utf-8");
        } finally {
          client.close();
        }
      } else {
        // HTTP(S) SIPHON
        const response = await fetch(url, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
          }
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const html = await response.text();
        content = turndownService.turndown(html);
      }
      
      // Chunk it back as a code block for Grog
      const formatted = `\`\`\`markdown\n# SIPHONED CONTENT: ${url}\n\n${content.slice(0, 15000)}\n\`\`\``;
      
      res.json({ content: formatted });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // WAYBACK SIPHON: Retrieval from Wayback Machine
  app.post("/api/web/wayback", async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "URL REQUIRED" });

    try {
      // 1. Check availability
      const availRes = await fetch(`https://archive.org/wayback/available?url=${encodeURIComponent(url)}`);
      const availData = await availRes.json();
      
      const snapshot = availData.archived_snapshots?.closest;
      if (!snapshot || !snapshot.available) {
        return res.status(404).json({ error: "NO SNAPSHOT AVAILABLE IN WAYBACK MACHINE" });
      }

      // 2. Fetch snapshot
      const snapshotUrl = snapshot.url;
      const response = await fetch(snapshotUrl);
      if (!response.ok) throw new Error(`HTTP ${response.status} FETCHING SNAPSHOT`);

      const html = await response.text();
      const markdown = turndownService.turndown(html);
      
      const formatted = `\`\`\`markdown\n# WAYBACK SNAPSHOT: ${url}\n# TIMESTAMP: ${snapshot.timestamp}\n\n${markdown.slice(0, 15000)}\n\`\`\``;
      
      res.json({ content: formatted, snapshotUrl });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
