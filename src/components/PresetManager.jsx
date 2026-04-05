import { useState } from 'react';
import { Trash2, Save, RotateCcw } from 'lucide-react';

const PresetManager = ({ presets, setPresets, data, setData, negativePrompt, setNegativePrompt }) => {
  const [presetName, setPresetName] = useState("");

  const savePreset = () => {
    if (!presetName) return;
    setPresets(p => ({ ...p, [presetName]: { data, negativePrompt } }));
    setPresetName("");
  };

  const loadPreset = (name) => {
    const p = presets[name];
    setData(p.data);
    setNegativePrompt(p.negativePrompt);
  };

  const deletePreset = (name) => {
    const n = { ...presets };
    delete n[name];
    setPresets(n);
  };

  const names = Object.keys(presets);

  return (
    <section className="border border-[#30363d] rounded-md overflow-hidden">
      <div className="bg-[#161b22] px-4 py-3 border-b border-[#30363d]">
        <h2 className="text-sm font-semibold">プリセット</h2>
      </div>
      <div className="bg-[#0d1117] p-4 space-y-3">
        <div className="flex gap-2">
          <input className="flex-1 bg-[#161b22] border border-[#30363d] rounded-md px-3 py-1.5 text-sm outline-none focus:border-[#58a6ff] transition"
            placeholder="プリセット名を入力..." value={presetName} onChange={(e) => setPresetName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && savePreset()} />
          <button onClick={savePreset}
            className="flex items-center gap-1.5 bg-[#238636] hover:bg-[#2ea043] text-white text-xs font-medium px-3 py-1.5 rounded-md border border-[#2ea043]/40 transition">
            <Save size={13} /> 保存
          </button>
        </div>

        {names.length === 0 ? (
          <p className="text-xs text-[#484f58] text-center py-3">保存済みのプリセットはありません</p>
        ) : (
          <div className="divide-y divide-[#21262d]">
            {names.map(name => (
              <div key={name} className="flex justify-between items-center py-2 group">
                <span className="text-sm text-[#e6edf3]">{name}</span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                  <button onClick={() => loadPreset(name)}
                    className="flex items-center gap-1 text-xs text-[#58a6ff] hover:text-[#79c0ff] px-2 py-1 rounded hover:bg-[#161b22] transition">
                    <RotateCcw size={12} /> 読込
                  </button>
                  <button onClick={() => deletePreset(name)}
                    className="text-[#484f58] hover:text-[#f85149] p-1 rounded hover:bg-[#161b22] transition">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default PresetManager;
