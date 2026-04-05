import { useState, useEffect } from 'react';
import { Search, ChevronDown } from 'lucide-react';

const LoraSelector = ({ onSelect }) => {
  const [loras, setLoras] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [loaded, setLoaded] = useState(false);

  const load = async () => {
    if (loaded) { setOpen(o => !o); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/loras');
      const data = await res.json();
      if (data.error) setError(data.error);
      setLoras(data.loras || []);
      setLoaded(true);
      setOpen(true);
    } catch {
      setError("サーバーに接続できません");
    }
    setLoading(false);
  };

  const filtered = loras.filter(l => {
    if (!search) return true;
    const q = search.toLowerCase();
    return l.name.toLowerCase().includes(q)
      || l.modelName?.toLowerCase().includes(q)
      || l.trainedWords?.some(w => w.toLowerCase().includes(q));
  });

  const handleSelect = (lora) => {
    onSelect({
      loraName: lora.file,
      trigger: lora.trainedWords?.join(', ') || '',
      modelName: lora.modelName || lora.name,
    });
    setOpen(false);
    setSearch("");
  };

  return (
    <div className="space-y-2">
      <button onClick={load} disabled={loading}
        className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md border border-[#30363d] text-[#58a6ff] hover:text-[#79c0ff] hover:border-[#58a6ff]/40 transition w-full justify-center">
        <ChevronDown size={13} className={open ? 'rotate-180 transition' : 'transition'} />
        {loading ? '読込中...' : 'LoRA を選択（Civitai Helper）'}
      </button>

      {error && <p className="text-xs text-[#f85149]">{error}</p>}

      {open && (
        <div className="border border-[#30363d] rounded-md bg-[#0d1117] overflow-hidden">
          {/* 検索 */}
          <div className="flex items-center gap-2 px-3 py-2 border-b border-[#30363d]">
            <Search size={13} className="text-[#8b949e]" />
            <input
              className="bg-transparent text-sm outline-none w-full text-[#e6edf3] placeholder-[#484f58]"
              placeholder="LoRA 名 / トリガーワードで検索..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>

          {/* リスト */}
          <div className="max-h-60 overflow-y-auto">
            {filtered.length === 0 && (
              <p className="text-xs text-[#484f58] text-center py-4">
                {loras.length === 0 ? 'LoRA が見つかりません' : '一致する LoRA がありません'}
              </p>
            )}
            {filtered.map((lora, i) => (
              <button key={i} onClick={() => handleSelect(lora)}
                className="w-full text-left px-3 py-2 hover:bg-[#161b22] transition border-b border-[#21262d] last:border-b-0">
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-[#e6edf3] truncate">{lora.modelName || lora.name}</div>
                    <div className="text-xs text-[#8b949e] font-mono truncate">{lora.file}</div>
                  </div>
                  {lora.baseModel && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#21262d] text-[#8b949e] border border-[#30363d] shrink-0">
                      {lora.baseModel}
                    </span>
                  )}
                </div>
                {lora.trainedWords?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {lora.trainedWords.slice(0, 5).map((w, j) => (
                      <span key={j} className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#1f2937] text-[#58a6ff] border border-[#30363d]">
                        {w}
                      </span>
                    ))}
                    {lora.trainedWords.length > 5 && (
                      <span className="text-[10px] text-[#484f58]">+{lora.trainedWords.length - 5}</span>
                    )}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LoraSelector;
