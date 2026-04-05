import { useState } from 'react';
import { Plus, ChevronDown, ChevronRight, Edit3, Settings2, Wand2, Trash2 } from 'lucide-react';
import InlineGenerator from './InlineGenerator.jsx';
import LoraSelector from './LoraSelector.jsx';

const SECTION_INFO = {
  comm: { label: '共通 (COMM)', desc: '全リージョンに適用される品質・スタイルタグ' },
  base: { label: '背景 (BASE)', desc: '背景・環境・ライティング' },
  char: { label: 'キャラクター', desc: 'キャラクター定義（LoRA・トリガーワード）' },
  people: { label: '構図', desc: '構図テンプレート（Latent Couple / Regional Prompter）' },
};

const SINGLE_CATEGORIES = ['comm', 'base'];
const AI_ENABLED = ['comm', 'base', 'char'];

const TemplateEditor = ({ data, setData, buildCharContent }) => {
  const [aiOpen, setAiOpen] = useState({ comm: true, base: true, char: true });

  const toggleAi = (cat) => setAiOpen(p => ({ ...p, [cat]: !p[cat] }));

  const updateSingleContent = (cat, content) => setData(d => ({ ...d, [cat]: content }));



  const handleAiInsert = (cat, content) => {
    setData(d => ({
      ...d,
      [cat]: [...d[cat], {
        title: `AI生成`, content, isOpen: true,
        isAdvanced: false, loraName: "", weightMode: "fixed", weightFixed: "1.0", trigger: ""
      }]
    }));
  };

  const updateItem = (cat, idx, updates) => {
    setData(d => {
      const list = [...d[cat]];
      list[idx] = { ...list[idx], ...updates };
      return { ...d, [cat]: list };
    });
  };

  const addItem = (cat) => {
    setData(d => ({
      ...d,
      [cat]: [...d[cat], {
        title: "新規項目", content: "", isOpen: true,
        isAdvanced: cat === 'char', loraName: "", weightMode: "fixed", weightFixed: "1.0", trigger: ""
      }]
    }));
  };

  const removeItem = (cat, idx) => {
    setData(d => ({ ...d, [cat]: d[cat].filter((_, i) => i !== idx) }));
  };

  const renderLayoutPreview = (prompt) => {
    const hasLC = prompt.includes('ADDCOMM') || prompt.includes('ADDBASE');
    const parts = prompt.split(/\bBREAK\b/);
    return (
      <div className="mt-3 space-y-1.5">
        {hasLC && (
          <div className="flex gap-1.5">
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#1f2937] text-[#58a6ff] border border-[#30363d]">ADDCOMM</span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#1f2937] text-[#3fb950] border border-[#30363d]">ADDBASE</span>
          </div>
        )}
        <div className="flex h-8 gap-px rounded overflow-hidden border border-[#30363d]">
          {parts.map((_, i) => (
            <div key={i} className="flex-1 flex items-center justify-center text-xs font-medium"
              style={{ backgroundColor: `hsl(${210 + i * 30}, 40%, ${18 + i * 4}%)`, color: `hsl(${210 + i * 30}, 70%, 70%)` }}>
              リージョン {i + 1}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderCharEditor = (item, cat, idx) => (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button onClick={() => {
          const updates = { isAdvanced: !item.isAdvanced };
          if (item.isAdvanced) updates.content = buildCharContent(item);
          updateItem(cat, idx, updates);
        }} className="text-xs flex items-center gap-1 text-[#8b949e] hover:text-[#58a6ff] transition">
          {item.isAdvanced ? <><Edit3 size={11} /> 直書き</> : <><Settings2 size={11} /> GUI</>}
        </button>
      </div>

      {item.isAdvanced ? (
        <div className="space-y-3">
          <LoraSelector onSelect={({ loraName, trigger, modelName }) => {
            updateItem(cat, idx, {
              loraName,
              trigger: trigger || item.trigger,
              title: modelName || item.title,
            });
          }} />

          <div>
            <label className="text-xs text-[#8b949e] mb-1 block">LoRA 名</label>
            <input className="w-full bg-[#0d1117] border border-[#30363d] rounded-md px-3 py-1.5 text-sm outline-none focus:border-[#58a6ff] transition"
              value={item.loraName} onChange={(e) => updateItem(cat, idx, { loraName: e.target.value })} />
          </div>

          <div className="bg-[#0d1117] p-3 rounded-md border border-[#30363d]">
            <label className="text-xs text-[#8b949e] mb-2 block">重み設定</label>
            <select className="w-full bg-[#161b22] border border-[#30363d] rounded-md px-3 py-1.5 text-sm mb-3 outline-none"
              value={item.weightMode} onChange={(e) => updateItem(cat, idx, { weightMode: e.target.value })}>
              <option value="fixed">固定値</option>
              <option value="choice">ランダム選択</option>
              <option value="range">範囲指定（Jinja2）</option>
            </select>

            {item.weightMode === 'fixed' && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#8b949e]">重み:</span>
                <input type="number" step="0.1" className="w-20 bg-[#161b22] border border-[#30363d] rounded-md px-2 py-1 text-sm outline-none"
                  value={item.weightFixed} onChange={(e) => updateItem(cat, idx, { weightFixed: e.target.value })} />
              </div>
            )}
            {item.weightMode === 'choice' && (
              <div>
                <span className="text-[11px] text-[#8b949e] mb-1 block">| で区切って入力</span>
                <input className="w-full bg-[#161b22] border border-[#30363d] rounded-md px-3 py-1.5 text-sm text-[#d29922] outline-none"
                  value={item.weightChoice} placeholder="0.6|0.7|0.8"
                  onChange={(e) => updateItem(cat, idx, { weightChoice: e.target.value })} />
              </div>
            )}
            {item.weightMode === 'range' && (
              <div className="flex items-center gap-2 text-sm">
                <input type="number" step="0.1" className="w-16 bg-[#161b22] border border-[#30363d] rounded-md px-2 py-1 text-sm outline-none"
                  value={item.weightRangeMin} onChange={(e) => updateItem(cat, idx, { weightRangeMin: e.target.value })} />
                <span className="text-[#8b949e]">〜</span>
                <input type="number" step="0.1" className="w-16 bg-[#161b22] border border-[#30363d] rounded-md px-2 py-1 text-sm outline-none"
                  value={item.weightRangeMax} onChange={(e) => updateItem(cat, idx, { weightRangeMax: e.target.value })} />
                <span className="text-[#8b949e]">刻み</span>
                <input type="number" step="0.1" className="w-16 bg-[#161b22] border border-[#30363d] rounded-md px-2 py-1 text-sm outline-none"
                  value={item.weightRangeStep} onChange={(e) => updateItem(cat, idx, { weightRangeStep: e.target.value })} />
              </div>
            )}
          </div>

          <div>
            <label className="text-xs text-[#8b949e] mb-1 block">トリガーワード / プロンプト</label>
            <textarea className="w-full bg-[#0d1117] border border-[#30363d] rounded-md px-3 py-2 text-sm font-mono h-16 outline-none focus:border-[#58a6ff] resize-none transition"
              value={item.trigger} placeholder="1girl, blue hair..."
              onChange={(e) => updateItem(cat, idx, { trigger: e.target.value })} />
          </div>

          <div className="bg-[#0d1117] border border-[#30363d] rounded-md p-3">
            <span className="text-[11px] text-[#8b949e] block mb-1">プレビュー</span>
            <div className="text-sm font-mono text-[#58a6ff] break-all">{buildCharContent(item)}</div>
          </div>
        </div>
      ) : (
        <textarea className="w-full bg-[#0d1117] border border-[#30363d] rounded-md px-3 py-2 text-sm font-mono h-32 outline-none focus:border-[#58a6ff] resize-none transition"
          value={item.content} placeholder="<lora:A:1.0>, 1girl..."
          onChange={(e) => updateItem(cat, idx, { content: e.target.value })} />
      )}
    </div>
  );

  const renderSection = (cat) => {
    const info = SECTION_INFO[cat];
    const isSingle = SINGLE_CATEGORIES.includes(cat);
    const hasAi = AI_ENABLED.includes(cat);

    return (
      <section key={cat} className="border border-[#30363d] rounded-md overflow-hidden">
        {/* Section header */}
        <div className="bg-[#161b22] px-4 py-3 flex justify-between items-center border-b border-[#30363d]">
          <div>
            <h2 className="text-sm font-semibold text-[#e6edf3]">{info.label}</h2>
            <p className="text-xs text-[#8b949e] mt-0.5">{info.desc}</p>
          </div>
          <div className="flex gap-2">
            {hasAi && (
              <button onClick={() => toggleAi(cat)}
                className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md border transition ${
                  aiOpen[cat]
                    ? 'bg-[#6e40c9]/20 border-[#6e40c9]/40 text-[#bc8cff]'
                    : 'border-[#30363d] text-[#8b949e] hover:text-[#e6edf3] hover:border-[#6e40c9]/40'
                }`}>
                <Wand2 size={14} /> AI
              </button>
            )}
            {!isSingle && (
              <button onClick={() => addItem(cat)}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md border border-[#30363d] text-[#8b949e] hover:text-[#e6edf3] hover:border-[#58a6ff]/40 transition">
                <Plus size={14} /> 追加
              </button>
            )}
          </div>
        </div>

        {/* Section body */}
        <div className="bg-[#0d1117] p-4 space-y-3">
          {/* AI panel */}
          {hasAi && aiOpen[cat] && (
            <InlineGenerator
              category={cat}
              onInsert={(content) => isSingle ? updateSingleContent(cat, content) : handleAiInsert(cat, content)}
              onClose={() => toggleAi(cat)}
            />
          )}

          {/* Single text (comm, base) */}
          {isSingle && (
            <textarea
              className="w-full bg-[#161b22] border border-[#30363d] rounded-md px-3 py-2 text-sm font-mono text-[#e6edf3] outline-none focus:border-[#58a6ff] resize-none transition"
              rows={3}
              value={data[cat]}
              onChange={(e) => updateSingleContent(cat, e.target.value)}
              placeholder="タグを入力..."
            />
          )}

          {/* Multi items (char, people) */}
          {!isSingle && data[cat].map((item, idx) => (
            <div key={idx} className="border border-[#30363d] rounded-md overflow-hidden">
              <div className="flex items-center gap-2 px-3 py-2 bg-[#161b22] cursor-pointer hover:bg-[#1c2129] transition"
                onClick={() => updateItem(cat, idx, { isOpen: !item.isOpen })}>
                {item.isOpen
                  ? <ChevronDown size={16} className="text-[#8b949e] shrink-0" />
                  : <ChevronRight size={16} className="text-[#8b949e] shrink-0" />}
                <input
                  className="bg-transparent text-sm font-medium text-[#e6edf3] outline-none w-full"
                  value={item.title}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => updateItem(cat, idx, { title: e.target.value })}
                  placeholder="タイトル"
                />
                <button onClick={(e) => { e.stopPropagation(); removeItem(cat, idx); }}
                  className="text-[#8b949e] hover:text-[#f85149] transition shrink-0 p-1">
                  <Trash2 size={14} />
                </button>
              </div>

              {item.isOpen && (
                <div className="p-3 border-t border-[#30363d]">
                  {cat === 'char' ? renderCharEditor(item, cat, idx) : (
                    <div>
                      <textarea
                        className="w-full bg-[#161b22] border border-[#30363d] rounded-md px-3 py-2 text-sm font-mono text-[#e6edf3] outline-none focus:border-[#58a6ff] resize-none transition"
                        rows={3}
                        value={item.content}
                        onChange={(e) => updateItem(cat, idx, { content: e.target.value })}
                      />
                      {cat === 'people' && renderLayoutPreview(item.content)}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Empty state */}
          {!isSingle && data[cat].length === 0 && (
            <p className="text-sm text-[#484f58] text-center py-4">項目がありません</p>
          )}
        </div>
      </section>
    );
  };

  return (
    <div className="space-y-4">
      {Object.keys(data).map(renderSection)}
    </div>
  );
};

export default TemplateEditor;
