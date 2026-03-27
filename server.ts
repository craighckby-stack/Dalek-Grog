import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import TurndownService from "turndown";
import * as ftp from "basic-ftp";
import admin from "firebase-admin";
import fs from "fs/promises";

dotenv.config();

// Initialize Firebase Admin
let db: admin.firestore.Firestore | null = null;
try {
  const firebaseConfig = JSON.parse(await fs.readFile(path.join(process.cwd(), "src/firebase-applet-config.json"), "utf-8"));
  admin.initializeApp({
    projectId: firebaseConfig.projectId,
  });
  db = admin.firestore().databaseId === firebaseConfig.firestoreDatabaseId 
    ? admin.firestore() 
    : admin.firestore(firebaseConfig.firestoreDatabaseId);
  console.log("FIREBASE_ADMIN: Initialized successfully.");
} catch (e) {
  console.error("FIREBASE_ADMIN_INIT_FAILURE: ", e);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));

  // API PROXIES
  app.post("/api/grok/proxy", async (req, res) => {
    try {
      const response = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GROK_API_KEY}`,
        },
        body: JSON.stringify(req.body),
      });
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.post("/api/cerebras/proxy", async (req, res) => {
    try {
      const response = await fetch("https://api.cerebras.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.CEREBRAS_API_KEY}`,
        },
        body: JSON.stringify(req.body),
      });
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // GITHUB PROXY
  app.get("/api/github/proxy", async (req, res) => {
    const { url } = req.query;
    try {
      const response = await fetch(url as string, {
        headers: {
          Authorization: `token ${process.env.GITHUB_TOKEN}`,
          Accept: "application/vnd.github.v3+json",
        },
      });
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // GROG SELF-MUTATION ENDPOINTS
  app.post("/api/grog/read", async (req, res) => {
    const { filePath } = req.body;
    try {
      const absolutePath = path.join(process.cwd(), filePath);
      if (!absolutePath.startsWith(process.cwd())) {
        return res.status(403).json({ error: "Access denied: Path outside project scope." });
      }
      const content = await fs.readFile(absolutePath, "utf-8");
      res.json({ content });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.post("/api/grog/self-mutate", async (req, res) => {
    const { filePath, content } = req.body;
    try {
      const absolutePath = path.join(process.cwd(), filePath);
      if (!absolutePath.startsWith(process.cwd())) {
        return res.status(403).json({ error: "Access denied: Path outside project scope." });
      }

      // BASIC VALIDATION
      if (!content || content.trim().length < 50) {
        return res.status(400).json({ error: "Validation failed: Content too short or empty." });
      }

      if (filePath.endsWith(".ts") || filePath.endsWith(".tsx")) {
        if (!content.includes("export") && !content.includes("import")) {
          return res.status(400).json({ error: "Validation failed: Missing module exports/imports in TS file." });
        }
      }

      await fs.writeFile(absolutePath, content, "utf-8");
      console.log(`GROK_SELF_MUTATION: Successfully evolved ${filePath}`);

      // SYNC TO FIREBASE IF IT'S THE BRAIN
      if (db && filePath.includes("GrogBrain.ts")) {
        try {
          await db.doc("system/grog-brain").set({
            content,
            version: admin.firestore.FieldValue.increment(1),
            lastUpdated: new Date().toISOString()
          }, { merge: true });
          console.log("GROG_BRAIN_FIREBASE_SYNC: Brain evolution persisted to cloud.");
        } catch (e) {
          console.error("GROG_BRAIN_FIREBASE_SYNC_FAILURE: ", e);
        }
      }

      res.json({ status: "success", message: `File ${filePath} evolved successfully.` });
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
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", async () => {
    console.log(`Server running on http://localhost:${PORT}`);
    
    // SYNC GROG BRAIN FROM FIREBASE ON STARTUP
    if (db) {
      try {
        const brainDoc = await db.doc("system/grog-brain").get();
        const brainPath = path.join(process.cwd(), "src/evolutors/GrogBrain.ts");
        
        // Ensure directory exists
        await fs.mkdir(path.dirname(brainPath), { recursive: true });

        if (brainDoc.exists) {
          const data = brainDoc.data();
          if (data?.content) {
            await fs.writeFile(brainPath, data.content, "utf-8");
            console.log("GROG_BRAIN_SYNC: Successfully synced from Firestore.");
          }
        } else {
          // Initial upload if Firestore is empty
          try {
            const content = await fs.readFile(brainPath, "utf-8");
            await db.doc("system/grog-brain").set({
              content,
              version: 1,
              lastUpdated: new Date().toISOString()
            });
            console.log("GROG_BRAIN_SYNC: Initial brain uploaded to Firestore.");
          } catch (readErr) {
            console.warn("GROG_BRAIN_SYNC: Local brain file not found for initial upload.");
          }
        }
      } catch (e) {
        console.error("GROG_BRAIN_SYNC_FAILURE: ", e);
      }
    }
  });
}

startServer();
