import { useState } from 'react';
import { FileJson, Trash2 } from 'lucide-react';

const PresetManager = ({ presets, setPresets, data, setData, negativePrompt, setNegativePrompt }) => {
  const [presetName, setPresetName] = useState("");

  const savePreset = () => {
    if (!presetName) return alert("プリセット名を入力してください");
    const newPresets = { ...presets, [presetName]: { data, negativePrompt } };
    setPresets(newPresets);
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

  return (
    <div className="bg-[#161b22] p-6 rounded-xl border border-slate-700 shadow-xl flex flex-col h-[350px]">
      <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-cyan-400">
        <FileJson size={24} /> プリセットの保存・読込
      </h2>
      <div className="flex gap-2 mb-4">
        <input className="flex-1 bg-[#0d1117] border border-slate-700 rounded-lg px-4 py-3 text-base outline-none focus:border-cyan-500"
          placeholder="新しいプリセット名..." value={presetName} onChange={(e) => setPresetName(e.target.value)} />
        <button onClick={savePreset} className="bg-cyan-600 hover:bg-cyan-500 px-6 py-3 rounded-lg text-base font-black transition">保存</button>
      </div>
      <div className="flex-1 overflow-y-auto space-y-2 pr-2">
        {Object.keys(presets).map(name => (
          <div key={name} className="flex justify-between items-center bg-[#0d1117] p-3 rounded-lg border border-slate-800 hover:border-slate-600 transition">
            <span className="text-base font-bold text-slate-300">{name}</span>
            <div className="flex gap-3">
              <button onClick={() => loadPreset(name)} className="bg-slate-800 text-cyan-400 hover:bg-cyan-900 hover:text-white px-4 py-1.5 rounded text-sm font-black transition">読込</button>
              <button onClick={() => deletePreset(name)} className="p-1.5 text-slate-600 hover:text-red-500 transition"><Trash2 size={18} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PresetManager;
