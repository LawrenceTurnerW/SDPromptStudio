import { Copy, Check, Wand2 } from 'lucide-react';
import { useState } from 'react';
import { getNegativePrompt } from '../lib/promptEngine.js';

const MODELS = [
  { value: 'pony', label: 'Pony' },
  { value: 'sd15', label: 'SD 1.5' },
  { value: 'sdxl', label: 'SDXL' },
  { value: 'real', label: 'Real' },
];

const CopyButton = ({ text, label }) => {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button onClick={copy}
      className="flex items-center gap-1 text-xs text-[#8b949e] hover:text-[#58a6ff] transition">
      {copied ? <><Check size={12} className="text-[#3fb950]" /> コピー済</> : <><Copy size={12} /> {label}</>}
    </button>
  );
};

const NegativePrompt = ({ negativePrompt, setNegativePrompt }) => {
  return (
    <>
      {/* ネガティブプロンプト */}
      <section className="border border-[#30363d] rounded-md overflow-hidden">
        <div className="bg-[#161b22] px-4 py-3 border-b border-[#30363d] flex justify-between items-center">
          <h2 className="text-sm font-semibold">ネガティブプロンプト</h2>
          <CopyButton text={negativePrompt} label="コピー" />
        </div>
        <div className="bg-[#0d1117] p-4 space-y-3">
          <textarea
            className="w-full bg-[#161b22] border border-[#30363d] rounded-md px-3 py-2 text-sm font-mono text-[#f0883e]/70 outline-none focus:border-[#f0883e]/40 resize-none transition"
            rows={3}
            value={negativePrompt}
            onChange={(e) => setNegativePrompt(e.target.value)}
          />
          <div className="flex items-center gap-2">
            <Wand2 size={13} className="text-[#8b949e]" />
            <span className="text-xs text-[#8b949e]">モデル別テンプレート:</span>
            {MODELS.map(m => (
              <button key={m.value} onClick={() => setNegativePrompt(getNegativePrompt(m.value))}
                className="text-xs px-2 py-0.5 rounded border border-[#30363d] text-[#8b949e] hover:text-[#e6edf3] hover:border-[#58a6ff]/40 transition">
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Forge 用コピー */}
      <section className="border border-[#30363d] rounded-md overflow-hidden">
        <div className="bg-[#161b22] px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <code className="text-lg font-bold text-[#58a6ff] select-all">__people__</code>
            <span className="text-xs text-[#484f58]">Forge のプロンプト欄にペースト</span>
          </div>
          <CopyButton text="__people__" label="コピー" />
        </div>
      </section>
    </>
  );
};

export default NegativePrompt;
