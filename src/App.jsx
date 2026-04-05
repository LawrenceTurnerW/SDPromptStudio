import { useState, useEffect } from 'react';
import { Layout } from 'lucide-react';
import TemplateEditor from './components/TemplateEditor.jsx';
import PresetManager from './components/PresetManager.jsx';
import NegativePrompt from './components/NegativePrompt.jsx';

const STORAGE_KEY_WORK = 'sd_prompt_studio_work_v1';
const STORAGE_KEY_PRESETS = 'sd_prompt_studio_presets_v1';

const DEFAULT_DATA = {
  comm: "",
  base: "",
  char: [],
  people: [{ title: "2人 (Latent Couple)", content: "__comm__ ADDCOMM __base__ ADDBASE __char__ BREAK __char__", isOpen: true }]
};

const DEFAULT_NEGATIVE = "lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry";

const App = () => {
  const [wildcardsStatus, setWildcardsStatus] = useState(null);
  const [data, setData] = useState(DEFAULT_DATA);
  const [negativePrompt, setNegativePrompt] = useState(DEFAULT_NEGATIVE);
  const [presets, setPresets] = useState({});
  const [exportMsg, setExportMsg] = useState(null);

  useEffect(() => {
    fetch('/api/wildcards/status').then(r => r.json()).then(setWildcardsStatus).catch(() => {});

    const savedWork = localStorage.getItem(STORAGE_KEY_WORK);
    if (savedWork) {
      try {
        const p = JSON.parse(savedWork);
        if (p.data) setData(p.data);
        if (p.negativePrompt) setNegativePrompt(p.negativePrompt);
      } catch (e) { console.error(e); }
    }

    const savedPresets = localStorage.getItem(STORAGE_KEY_PRESETS);
    if (savedPresets) {
      try { setPresets(JSON.parse(savedPresets)); } catch (e) { console.error(e); }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_WORK, JSON.stringify({ data, negativePrompt }));
  }, [data, negativePrompt]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PRESETS, JSON.stringify(presets));
  }, [presets]);

  const buildCharContent = (item) => {
    if (!item.isAdvanced) return item.content;
    let weightStr = item.weightFixed;
    if (item.weightMode === 'choice') weightStr = `{${item.weightChoice}}`;
    else if (item.weightMode === 'range') weightStr = `{{range(${item.weightRangeMin}, ${item.weightRangeMax}, ${item.weightRangeStep})|random}}`;
    const loraTag = item.loraName ? `<lora:${item.loraName}:${weightStr}>` : "";
    return [loraTag, item.trigger].filter(Boolean).join(", ");
  };

  const exportToForge = async () => {
    const files = {};
    for (const [category, value] of Object.entries(data)) {
      if (typeof value === 'string') {
        files[category] = value;
      } else {
        const lines = value.map(item => category === 'char' ? buildCharContent(item) : item.content).filter(c => c !== "");
        files[category] = lines.join('\n');
      }
    }
    try {
      const res = await fetch('/api/wildcards/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files })
      });
      const result = await res.json();
      setExportMsg(result.success ? "Forge に書き出しました" : (result.error || "書き出しエラー"));
      setTimeout(() => setExportMsg(null), 3000);
    } catch {
      setExportMsg("サーバーに接続できません");
      setTimeout(() => setExportMsg(null), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-slate-200 p-6 font-sans text-base">
      <header className="flex justify-between items-center mb-6 bg-[#161b22] p-5 rounded-xl border border-slate-700 shadow-xl">
        <div className="flex items-center gap-6">
          <h1 className="text-3xl font-bold text-cyan-400 flex items-center gap-3">
            <Layout size={32} /> SD Prompt Studio
          </h1>
          <span className="text-xs text-slate-500">
            {wildcardsStatus?.configured
              ? <span className="text-green-400">{wildcardsStatus.path}</span>
              : <span className="text-yellow-400">.env で WILDCARDS_PATH を設定</span>
            }
          </span>
        </div>
        <div className="flex items-center gap-3">
          {exportMsg && <span className="text-sm text-green-400 animate-pulse">{exportMsg}</span>}
          <button onClick={exportToForge} className="bg-blue-600 hover:bg-blue-500 px-8 py-3 rounded-xl font-black text-base shadow-[0_0_15px_rgba(37,99,235,0.5)] active:scale-95 transition">
            Forge へ保存
          </button>
        </div>
      </header>

      <TemplateEditor data={data} setData={setData} buildCharContent={buildCharContent} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        <PresetManager
          presets={presets}
          setPresets={setPresets}
          data={data}
          setData={setData}
          negativePrompt={negativePrompt}
          setNegativePrompt={setNegativePrompt}
        />
        <NegativePrompt negativePrompt={negativePrompt} setNegativePrompt={setNegativePrompt} />
      </div>
    </div>
  );
};

export default App;
