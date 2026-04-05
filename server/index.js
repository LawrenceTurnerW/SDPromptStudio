import express from "express";
import dotenv from "dotenv";
import { resolve, join, dirname } from "path";
import { existsSync, mkdirSync, writeFileSync, readFileSync, unlinkSync, readdirSync } from "fs";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = resolve(__dirname, '..');
const PID_FILE = join(ROOT_DIR, '.server.pid');
const CONFIG_FILE = join(ROOT_DIR, 'config.json');

dotenv.config({ path: join(ROOT_DIR, '.env') });

const app = express();
app.use(express.json());

// --- Config management ---
function loadConfig() {
  if (existsSync(CONFIG_FILE)) {
    try { return JSON.parse(readFileSync(CONFIG_FILE, 'utf-8')); } catch {}
  }
  return {};
}

function saveConfig(config) {
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
}

function getWildcardsPath() {
  const config = loadConfig();
  return config.wildcardsPath || process.env.WILDCARDS_PATH || null;
}

// Production: serve built frontend
const distPath = resolve(ROOT_DIR, 'dist');
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

// --- API: Config ---
app.get("/api/config", (req, res) => {
  const config = loadConfig();
  const wildcardsPath = config.wildcardsPath || process.env.WILDCARDS_PATH || "";
  res.json({ wildcardsPath });
});

app.post("/api/config", (req, res) => {
  const { wildcardsPath } = req.body;
  if (typeof wildcardsPath !== 'string') {
    return res.status(400).json({ error: "Invalid path" });
  }
  const config = loadConfig();
  config.wildcardsPath = wildcardsPath.trim();
  saveConfig(config);
  const exists = wildcardsPath.trim() ? existsSync(wildcardsPath.trim()) : false;
  res.json({ success: true, wildcardsPath: config.wildcardsPath, exists });
});

// --- API: Wildcards file operations ---

app.get("/api/wildcards/status", (req, res) => {
  const wildcardsPath = getWildcardsPath();
  if (!wildcardsPath) {
    return res.json({ configured: false, path: null });
  }
  const exists = existsSync(wildcardsPath);
  return res.json({ configured: true, path: wildcardsPath, exists });
});

app.post("/api/wildcards/export", (req, res) => {
  const wildcardsPath = getWildcardsPath();
  if (!wildcardsPath) {
    return res.status(400).json({ error: "Wildcards パスが未設定です" });
  }
  if (!existsSync(wildcardsPath)) {
    mkdirSync(wildcardsPath, { recursive: true });
  }
  const ALLOWED_FILES = ['comm', 'base', 'char', 'people'];
  try {
    const { files } = req.body;
    for (const [name, content] of Object.entries(files)) {
      if (!ALLOWED_FILES.includes(name)) continue;
      writeFileSync(join(wildcardsPath, `${name}.txt`), content, "utf-8");
    }
    res.json({ success: true, path: wildcardsPath });
  } catch (e) {
    res.status(500).json({ error: "Failed to write wildcards files" });
  }
});

app.get("/api/wildcards/files", (req, res) => {
  const wildcardsPath = getWildcardsPath();
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

// --- API: LoRA list with Civitai metadata ---

function getForgeRoot() {
  const wPath = getWildcardsPath();
  if (!wPath) return null;
  // wildcards path: .../extensions/sd-dynamic-prompts/wildcards → go up 3 levels to forge root
  const forgeRoot = resolve(wPath, '..', '..', '..');
  return existsSync(forgeRoot) ? forgeRoot : null;
}

function scanLorasRecursive(dir, prefix = '') {
  const results = [];
  if (!existsSync(dir)) return results;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      results.push(...scanLorasRecursive(join(dir, entry.name), prefix ? `${prefix}/${entry.name}` : entry.name));
    } else if (entry.name.endsWith('.safetensors')) {
      const baseName = entry.name.replace('.safetensors', '');
      const infoPath = join(dir, `${baseName}.civitai.info`);
      const lora = { file: prefix ? `${prefix}/${baseName}` : baseName, name: baseName };
      if (existsSync(infoPath)) {
        try {
          const info = JSON.parse(readFileSync(infoPath, 'utf-8'));
          lora.modelName = info.model?.name || baseName;
          lora.trainedWords = info.trainedWords || [];
          lora.baseModel = info.baseModel || '';
          // サンプルプロンプトを1つ取得
          const sampleImg = info.images?.find(img => img.meta?.prompt);
          if (sampleImg) lora.samplePrompt = sampleImg.meta.prompt;
        } catch {}
      }
      results.push(lora);
    }
  }
  return results;
}

app.get("/api/loras", (req, res) => {
  const forgeRoot = getForgeRoot();
  if (!forgeRoot) {
    return res.json({ loras: [], error: "Forge root not found (Wildcards パスを先に設定してください)" });
  }
  const loraDir = join(forgeRoot, 'models', 'Lora');
  if (!existsSync(loraDir)) {
    return res.json({ loras: [], error: `LoRA フォルダが見つかりません: ${loraDir}` });
  }
  const loras = scanLorasRecursive(loraDir);
  res.json({ loras });
});

// Production: SPA fallback
if (existsSync(distPath)) {
  app.get("*", (req, res) => {
    res.sendFile(resolve(distPath, "index.html"));
  });
}

// PID file management
writeFileSync(PID_FILE, String(process.pid));
const cleanup = () => { try { unlinkSync(PID_FILE); } catch {} process.exit(); };
process.on('SIGTERM', cleanup);
process.on('SIGINT', cleanup);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT} (PID: ${process.pid})`));
