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
  { value: 'pony', label: 'Pony' },
  { value: 'sd15', label: 'SD 1.5' },
  { value: 'sdxl', label: 'SDXL' },
  { value: 'real', label: 'Real' },
];

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
    <div className="border border-[#6e40c9]/30 rounded-md bg-[#161b22] overflow-hidden">
      <div className="flex justify-between items-center px-3 py-2 border-b border-[#6e40c9]/20 bg-[#6e40c9]/5">
        <span className="text-xs font-medium text-[#bc8cff] flex items-center gap-1.5">
          <Wand2 size={12} /> AI 生成
        </span>
        <button onClick={onClose} className="text-[#8b949e] hover:text-[#e6edf3] transition"><X size={14} /></button>
      </div>

      <div className="p-3 space-y-3">
        {/* Mode + Model row */}
        <div className="flex gap-2 flex-wrap items-center">
          <div className="flex rounded-md overflow-hidden border border-[#30363d]">
            {MODES.map(m => {
              const Icon = m.icon;
              return (
                <button key={m.value} onClick={() => setMode(m.value)}
                  className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium transition border-r last:border-r-0 border-[#30363d] ${
                    mode === m.value
                      ? 'bg-[#6e40c9]/20 text-[#bc8cff]'
                      : 'text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#1c2129]'
                  }`}>
                  <Icon size={11} />{m.label}
                </button>
              );
            })}
          </div>

          <select value={modelType} onChange={(e) => setModelType(e.target.value)}
            className="bg-[#0d1117] border border-[#30363d] rounded-md px-2 py-1 text-xs outline-none">
            {MODELS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>

          <div className="flex items-center gap-1 text-xs text-[#8b949e]" title="ランダム性（低=安定, 高=多様）">
            <span>ランダム性</span>
            <input type="number" step="0.1" min="0" max="2" value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="w-12 bg-[#0d1117] border border-[#30363d] rounded-md px-1.5 py-1 text-xs outline-none" />
          </div>
        </div>

        {/* Input */}
        <textarea value={input} onChange={(e) => setInput(e.target.value)}
          placeholder="プロンプトを入力（生成モードなら空でもOK）..."
          className="w-full bg-[#0d1117] border border-[#30363d] rounded-md px-3 py-2 text-xs font-mono text-[#e6edf3] h-14 outline-none focus:border-[#6e40c9]/60 resize-none transition" />

        {/* Generate button */}
        <button onClick={generate} disabled={loading}
          className={`w-full py-1.5 rounded-md text-sm font-medium transition ${loading
            ? 'bg-[#21262d] text-[#484f58] cursor-wait'
            : 'bg-[#6e40c9] hover:bg-[#7c4ddb] text-white'}`}>
          {loading ? "生成中..." : "生成"}
        </button>

        {error && <div className="text-[#f85149] text-xs">{error}</div>}

        {/* Output */}
        {output && (
          <div className="space-y-2">
            <textarea value={output} onChange={(e) => setOutput(e.target.value)}
              className="w-full bg-[#0d1117] border border-[#6e40c9]/30 rounded-md px-3 py-2 text-xs font-mono text-[#bc8cff] h-14 outline-none resize-none" />
            <div className="flex gap-2">
              <button onClick={() => { onInsert(output); setOutput(""); setInput(""); }}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-xs font-medium bg-[#238636] hover:bg-[#2ea043] text-white transition">
                <Check size={12} /> 適用
              </button>
              <button onClick={() => navigator.clipboard.writeText(output)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium border border-[#30363d] text-[#8b949e] hover:text-[#e6edf3] transition">
                <Copy size={12} /> コピー
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InlineGenerator;
