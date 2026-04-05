import { useState } from 'react';
import { Sparkles, Zap, PaintBucket, Tags, Copy, ArrowDownToLine } from 'lucide-react';
import { buildSystemPrompt, extractLoras, restoreLoras, cleanResult, getNegativePrompt } from '../lib/promptEngine.js';

const MODES = [
  { value: 'generate', label: '生成', icon: Sparkles },
  { value: 'optimize', label: '最適化', icon: Zap },
  { value: 'enhance', label: '強化', icon: PaintBucket },
  { value: 'add', label: 'タグ追加', icon: Tags },
];

const STRUCTURES = [
  { value: 'common', label: 'COMMON（共通）' },
  { value: 'base', label: 'BASE（背景）' },
  { value: 'character', label: 'CHARACTER（キャラ）' },
];

const MODELS = [
  { value: 'pony', label: 'PONY' },
  { value: 'sd15', label: 'SD 1.5' },
  { value: 'sdxl', label: 'SDXL' },
  { value: 'real', label: 'Real' },
];

const PromptGenerator = ({ onInsert }) => {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [negative, setNegative] = useState("");
  const [mode, setMode] = useState("generate");
  const [structure, setStructure] = useState("common");
  const [modelType, setModelType] = useState("pony");
  const [temperature, setTemperature] = useState(0.3);
  const [maxTokens, setMaxTokens] = useState(400);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
          max_tokens: maxTokens,
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

  const generateNeg = () => setNegative(getNegativePrompt(modelType));

  // 構造に応じたカテゴリマッピング
  const insertCategory = structure === 'common' ? 'comm' : structure === 'base' ? 'base' : 'char';

  return (
    <div className="space-y-4">
      {/* モード選択 */}
      <div className="flex gap-2">
        {MODES.map(m => {
          const Icon = m.icon;
          return (
            <button key={m.value} onClick={() => setMode(m.value)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition border ${mode === m.value
                ? 'bg-cyan-600 border-cyan-500 text-white'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:border-slate-500'}`}>
              <Icon size={16} />{m.label}
            </button>
          );
        })}
      </div>

      {/* 設定行 */}
      <div className="flex gap-3 flex-wrap">
        <select value={structure} onChange={(e) => setStructure(e.target.value)}
          className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm outline-none">
          {STRUCTURES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <select value={modelType} onChange={(e) => setModelType(e.target.value)}
          className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm outline-none">
          {MODELS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <span>Temp:</span>
          <input type="number" step="0.1" min="0" max="2" value={temperature}
            onChange={(e) => setTemperature(parseFloat(e.target.value))}
            className="w-16 bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-sm outline-none" />
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <span>Tokens:</span>
          <input type="number" step="50" min="100" max="2000" value={maxTokens}
            onChange={(e) => setMaxTokens(parseInt(e.target.value))}
            className="w-20 bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-sm outline-none" />
        </div>
      </div>

      {/* 入力 */}
      <textarea value={input} onChange={(e) => setInput(e.target.value)}
        placeholder="プロンプトを入力（生成モードなら空でもOK）..."
        className="w-full bg-[#0d1117] border border-slate-700 rounded-lg p-4 text-sm font-mono text-slate-200 h-28 outline-none focus:border-cyan-500 resize-none" />

      {/* 生成ボタン */}
      <button onClick={generate} disabled={loading}
        className={`w-full py-3 rounded-xl font-black text-lg transition ${loading
          ? 'bg-slate-700 text-slate-400 cursor-wait'
          : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)] active:scale-[0.98]'}`}>
        {loading ? "生成中..." : "AI で生成"}
      </button>

      {error && <div className="text-red-400 text-sm">{error}</div>}

      {/* 出力 */}
      {output && (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-xs font-bold text-slate-400">生成結果</label>
            <div className="flex gap-2">
              <button onClick={() => navigator.clipboard.writeText(output)}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-cyan-400 bg-slate-800 px-2 py-1 rounded">
                <Copy size={12} /> コピー
              </button>
              {onInsert && (
                <button onClick={() => onInsert(insertCategory, output)}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-green-400 bg-slate-800 px-2 py-1 rounded">
                  <ArrowDownToLine size={12} /> {insertCategory} に挿入
                </button>
              )}
            </div>
          </div>
          <textarea value={output} onChange={(e) => setOutput(e.target.value)}
            className="w-full bg-cyan-950/20 border border-cyan-900/50 rounded-lg p-4 text-sm font-mono text-cyan-200 h-28 outline-none resize-none" />
        </div>
      )}

      {/* ネガティブ */}
      <div className="flex gap-2">
        <button onClick={generateNeg} className="text-xs text-pink-400 hover:text-pink-300 bg-slate-800 px-3 py-1.5 rounded border border-slate-700">
          ネガティブ生成
        </button>
        {negative && (
          <button onClick={() => navigator.clipboard.writeText(negative)}
            className="text-xs text-slate-400 hover:text-pink-400 bg-slate-800 px-3 py-1.5 rounded border border-slate-700">
            <Copy size={12} className="inline mr-1" />コピー
          </button>
        )}
      </div>
      {negative && (
        <div className="text-sm font-mono text-pink-200/60 bg-pink-950/10 border border-pink-900/30 rounded-lg p-3">{negative}</div>
      )}
    </div>
  );
};

export default PromptGenerator;
