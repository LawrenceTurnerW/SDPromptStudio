import { useState } from 'react';
import { Wand2, Sparkles, Zap, PaintBucket, Tags, Copy, Check, X } from 'lucide-react';
import { buildSystemPrompt, extractLoras, restoreLoras, cleanResult } from '../lib/promptEngine.js';

const MODES = [
  { value: 'generate', label: '生成', icon: Sparkles },
  { value: 'optimize', label: '最適化', icon: Zap },
  { value: 'enhance', label: '強化', icon: PaintBucket },
  { value: 'add', label: 'タグ追加', icon: Tags },
];

const MODELS = [
  { value: 'pony', label: 'PONY' },
  { value: 'sd15', label: 'SD1.5' },
  { value: 'sdxl', label: 'SDXL' },
  { value: 'real', label: 'Real' },
];

// category → structure の自動マッピング
const STRUCTURE_MAP = { comm: 'common', base: 'base', char: 'character' };

const InlineGenerator = ({ category, onInsert, onClose }) => {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [mode, setMode] = useState("generate");
  const [modelType, setModelType] = useState("pony");
  const [temperature, setTemperature] = useState(0.3);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const structure = STRUCTURE_MAP[category];

  const generate = async () => {
    if (!input.trim() && mode !== 'generate') return;
    setLoading(true);
    setError(null);

    const { cleaned, loras } = extractLoras(input);
    const system = buildSystemPrompt(mode, structure, modelType);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "deepseek/deepseek-chat",
          temperature,
          max_tokens: 400,
          messages: [
            { role: "system", content: system },
            { role: "user", content: cleaned || "Generate a creative prompt" }
          ]
        })
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error.message || data.error);
        setLoading(false);
        return;
      }
      let result = data.choices?.[0]?.message?.content || "";
      result = cleanResult(result, structure, modelType);
      result = restoreLoras(result, loras);
      setOutput(result);
    } catch {
      setError("サーバーに接続できません");
    }
    setLoading(false);
  };

  return (
    <div className="bg-violet-950/30 border border-violet-800/50 rounded-lg p-3 space-y-2">
      {/* ヘッダー */}
      <div className="flex justify-between items-center">
        <span className="text-xs font-bold text-violet-400 flex items-center gap-1">
          <Wand2 size={12} /> AI 生成
        </span>
        <button onClick={onClose} className="text-slate-500 hover:text-slate-300"><X size={14} /></button>
      </div>

      {/* モード */}
      <div className="flex gap-1 flex-wrap">
        {MODES.map(m => {
          const Icon = m.icon;
          return (
            <button key={m.value} onClick={() => setMode(m.value)}
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-bold transition ${mode === m.value
                ? 'bg-violet-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>
              <Icon size={11} />{m.label}
            </button>
          );
        })}
      </div>

      {/* モデル + Temp */}
      <div className="flex gap-2 items-center">
        <select value={modelType} onChange={(e) => setModelType(e.target.value)}
          className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs outline-none flex-1">
          {MODELS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
        <div className="flex items-center gap-1 text-xs text-slate-500">
          <span>T:</span>
          <input type="number" step="0.1" min="0" max="2" value={temperature}
            onChange={(e) => setTemperature(parseFloat(e.target.value))}
            className="w-12 bg-slate-900 border border-slate-700 rounded px-1.5 py-1 text-xs outline-none" />
        </div>
      </div>

      {/* 入力 */}
      <textarea value={input} onChange={(e) => setInput(e.target.value)}
        placeholder="入力（空でもOK）..."
        className="w-full bg-[#0d1117] border border-slate-700 rounded p-2 text-xs font-mono text-slate-200 h-16 outline-none focus:border-violet-500 resize-none" />

      {/* 生成ボタン */}
      <button onClick={generate} disabled={loading}
        className={`w-full py-2 rounded-lg font-bold text-sm transition ${loading
          ? 'bg-slate-700 text-slate-400 cursor-wait'
          : 'bg-violet-600 hover:bg-violet-500 text-white active:scale-[0.98]'}`}>
        {loading ? "生成中..." : "AI で生成"}
      </button>

      {error && <div className="text-red-400 text-xs">{error}</div>}

      {/* 出力 */}
      {output && (
        <div className="space-y-1.5">
          <textarea value={output} onChange={(e) => setOutput(e.target.value)}
            className="w-full bg-violet-950/30 border border-violet-800/50 rounded p-2 text-xs font-mono text-violet-200 h-16 outline-none resize-none" />
          <div className="flex gap-2">
            <button onClick={() => { onInsert(output); setOutput(""); setInput(""); }}
              className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded text-xs font-bold bg-green-700 hover:bg-green-600 text-white transition">
              <Check size={12} /> 追加
            </button>
            <button onClick={() => navigator.clipboard.writeText(output)}
              className="flex items-center gap-1 px-3 py-1.5 rounded text-xs font-bold bg-slate-800 text-slate-400 hover:text-white transition">
              <Copy size={12} /> コピー
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InlineGenerator;
