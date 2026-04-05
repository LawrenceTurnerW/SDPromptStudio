import express from "express";
import dotenv from "dotenv";
import { resolve, join, dirname } from "path";
import { existsSync, mkdirSync, writeFileSync, readFileSync, unlinkSync } from "fs";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PID_FILE = join(__dirname, '..', '.server.pid');

dotenv.config();

const app = express();
app.use(express.json());

// Production: serve built frontend
const distPath = resolve("dist");
if (existsSync(distPath)) {
  app.use(express.static(distPath));
}

// --- API: OpenRouter proxy ---
app.post("/api/generate", async (req, res) => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "API_KEY not configured in .env" });
  }
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(req.body)
    });
    const data = await response.json();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: "OpenRouter API request failed" });
  }
});

// --- API: Wildcards file operations ---

// GET: Wildcards path status
app.get("/api/wildcards/status", (req, res) => {
  const wildcardsPath = process.env.WILDCARDS_PATH;
  if (!wildcardsPath) {
    return res.json({ configured: false, path: null });
  }
  const exists = existsSync(wildcardsPath);
  return res.json({ configured: true, path: wildcardsPath, exists });
});

// POST: Export wildcards files
app.post("/api/wildcards/export", (req, res) => {
  const wildcardsPath = process.env.WILDCARDS_PATH;
  if (!wildcardsPath) {
    return res.status(400).json({ error: "WILDCARDS_PATH not configured in .env" });
  }
  if (!existsSync(wildcardsPath)) {
    mkdirSync(wildcardsPath, { recursive: true });
  }
  try {
    const { files } = req.body; // { comm: "...", base: "...", char: "...", people: "..." }
    for (const [name, content] of Object.entries(files)) {
      writeFileSync(join(wildcardsPath, `${name}.txt`), content, "utf-8");
    }
    res.json({ success: true, path: wildcardsPath });
  } catch (e) {
    res.status(500).json({ error: "Failed to write wildcards files" });
  }
});

// GET: Read current wildcards files
app.get("/api/wildcards/files", (req, res) => {
  const wildcardsPath = process.env.WILDCARDS_PATH;
  if (!wildcardsPath || !existsSync(wildcardsPath)) {
    return res.json({ files: {} });
  }
  try {
    const result = {};
    for (const name of ["comm", "base", "char", "people"]) {
      const filePath = join(wildcardsPath, `${name}.txt`);
      result[name] = existsSync(filePath) ? readFileSync(filePath, "utf-8") : "";
    }
    res.json({ files: result });
  } catch (e) {
    res.status(500).json({ error: "Failed to read wildcards files" });
  }
});

// Production: SPA fallback
if (existsSync(distPath)) {
  app.get("*", (req, res) => {
    res.sendFile(resolve(distPath, "index.html"));
  });
}

// PID ファイル管理
writeFileSync(PID_FILE, String(process.pid));
const cleanup = () => { try { unlinkSync(PID_FILE); } catch {} process.exit(); };
process.on('SIGTERM', cleanup);
process.on('SIGINT', cleanup);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT} (PID: ${process.pid})`));
