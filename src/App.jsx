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
      setExportMsg(result.success ? "書き出し完了" : (result.error || "書き出しエラー"));
      setTimeout(() => setExportMsg(null), 3000);
    } catch {
      setExportMsg("サーバーに接続できません");
      setTimeout(() => setExportMsg(null), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#e6edf3] font-sans">
      {/* Header */}
      <header className="border-b border-[#30363d] bg-[#161b22]">
        <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold flex items-center gap-2">
              <Layout size={22} className="text-[#8b949e]" />
              SD Prompt Studio
            </h1>
            <span className="text-xs text-[#8b949e] border border-[#30363d] rounded-full px-2.5 py-0.5">
              {wildcardsStatus?.configured
                ? <span className="text-[#3fb950]">{wildcardsStatus.path}</span>
                : <span className="text-[#d29922]">WILDCARDS_PATH not set</span>
              }
            </span>
          </div>
          <div className="flex items-center gap-3">
            {exportMsg && <span className="text-sm text-[#3fb950]">{exportMsg}</span>}
            <button onClick={exportToForge}
              className="bg-[#238636] hover:bg-[#2ea043] text-white text-sm font-medium px-4 py-1.5 rounded-md border border-[#2ea043]/40 transition">
              Forge へ保存
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-5xl mx-auto px-6 py-6 space-y-6">
        <TemplateEditor data={data} setData={setData} buildCharContent={buildCharContent} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <PresetManager
            presets={presets}
            setPresets={setPresets}
            data={data}
            setData={setData}
            negativePrompt={negativePrompt}
            setNegativePrompt={setNegativePrompt}
          />
          <div className="space-y-4">
            <NegativePrompt negativePrompt={negativePrompt} setNegativePrompt={setNegativePrompt} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
