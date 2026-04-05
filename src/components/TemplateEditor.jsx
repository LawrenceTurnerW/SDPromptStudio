import { useState } from 'react';
import { Plus, ChevronDown, ChevronRight, Edit3, Settings2, Wand2 } from 'lucide-react';
import InlineGenerator from './InlineGenerator.jsx';

const CATEGORY_LABELS = {
  comm: '1. 共通 (COMM)',
  base: '2. 背景 (BASE)',
  char: '3. キャラクター',
  people: '4. 設定 (人数)'
};

// comm, base は単一テキスト。char は複数アイテム + AI。people は複数アイテムのみ。
const SINGLE_CATEGORIES = ['comm', 'base'];
const AI_ENABLED = ['comm', 'base', 'char'];

const TemplateEditor = ({ data, setData, buildCharContent }) => {
  const [aiOpen, setAiOpen] = useState({ comm: true, base: true, char: true });

  const toggleAi = (category) => setAiOpen(prev => ({ ...prev, [category]: !prev[category] }));

  // 単一カテゴリ: テキストを直接更新
  const updateSingleContent = (category, content) => {
    const newData = { ...data };
    newData[category] = content;
    setData(newData);
  };

  // 単一カテゴリ: AI 生成結果で上書き
  const handleAiOverwrite = (category, content) => {
    updateSingleContent(category, content);
  };

  // 複数アイテムカテゴリ: AI 生成結果を追加
  const handleAiInsert = (category, content) => {
    const newData = { ...data };
    newData[category] = [...newData[category], {
      title: `AI生成 (${new Date().toLocaleTimeString()})`,
      content,
      isOpen: true,
      isAdvanced: false,
      loraName: "", weightMode: "fixed", weightFixed: "1.0", trigger: ""
    }];
    setData(newData);
  };

  const updateItem = (category, idx, updates) => {
    const newData = { ...data };
    newData[category] = [...newData[category]];
    newData[category][idx] = { ...newData[category][idx], ...updates };
    setData(newData);
  };

  const addItem = (category) => {
    const newData = { ...data };
    newData[category] = [...newData[category], {
      title: "新規項目", content: "", isOpen: true,
      isAdvanced: category === 'char', loraName: "", weightMode: "fixed", weightFixed: "1.0", trigger: ""
    }];
    setData(newData);
  };

  const removeItem = (category, idx) => {
    const newData = { ...data };
    newData[category] = newData[category].filter((_, i) => i !== idx);
    setData(newData);
  };

  const renderLayoutPreview = (prompt) => {
    const hasLatentCouple = prompt.includes('ADDCOMM') || prompt.includes('ADDBASE');
    const parts = prompt.split(/\bBREAK\b/);
    return (
      <div className="mt-3">
        {hasLatentCouple && (
          <div className="flex gap-1 mb-1">
            <span className="bg-blue-900 text-blue-200 text-xs px-2 py-0.5 rounded font-bold border border-blue-700">全体(ADDCOMM)</span>
            <span className="bg-emerald-900 text-emerald-200 text-xs px-2 py-0.5 rounded font-bold border border-emerald-700">背景(ADDBASE)</span>
          </div>
        )}
        <div className="flex w-full h-10 gap-1 border border-slate-700 rounded bg-black overflow-hidden shadow-inner">
          {parts.map((_, i) => (
            <div key={i} className="flex-1 flex items-center justify-center text-sm font-black"
              style={{ backgroundColor: `hsl(${i * 70 + 200}, 60%, 25%)`, color: `hsl(${i * 70 + 200}, 100%, 90%)` }}>
              リージョン {i + 1}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderCharEditor = (item, category, idx) => (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => {
            const updates = { isAdvanced: !item.isAdvanced };
            if (item.isAdvanced) updates.content = buildCharContent(item);
            updateItem(category, idx, updates);
          }}
          className="text-xs flex items-center gap-1 text-slate-400 hover:text-cyan-400 bg-slate-800 px-2 py-1 rounded"
        >
          {item.isAdvanced ? <><Edit3 size={12} /> 直書きモードへ切替</> : <><Settings2 size={12} /> GUIモードへ切替</>}
        </button>
      </div>

      {item.isAdvanced ? (
        <div className="space-y-3">
          <div>
            <label className="text-xs font-bold text-slate-400 mb-1 block">LoRA名 (例: MyChara_v1)</label>
            <input className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-cyan-200 outline-none focus:border-cyan-500"
              value={item.loraName} onChange={(e) => updateItem(category, idx, { loraName: e.target.value })} />
          </div>

          <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
            <label className="text-xs font-bold text-slate-400 mb-2 block">重みの設定方法</label>
            <select className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-sm mb-3 outline-none"
              value={item.weightMode} onChange={(e) => updateItem(category, idx, { weightMode: e.target.value })}>
              <option value="fixed">固定値を使用</option>
              <option value="choice">複数からランダム選択</option>
              <option value="range">範囲からランダム（Jinja2必要）</option>
            </select>

            {item.weightMode === 'fixed' && (
              <div className="flex items-center gap-3">
                <span className="text-sm">重み:</span>
                <input type="number" step="0.1" className="w-24 bg-slate-900 border border-slate-600 rounded p-1.5 text-sm"
                  value={item.weightFixed} onChange={(e) => updateItem(category, idx, { weightFixed: e.target.value })} />
              </div>
            )}
            {item.weightMode === 'choice' && (
              <div>
                <span className="text-xs text-slate-500 mb-1 block">候補を「|」で区切る</span>
                <input className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-sm text-amber-200"
                  value={item.weightChoice} placeholder="例: 0.6|0.7|0.8"
                  onChange={(e) => updateItem(category, idx, { weightChoice: e.target.value })} />
              </div>
            )}
            {item.weightMode === 'range' && (
              <div className="flex items-center gap-2">
                <input type="number" step="0.1" className="w-16 bg-slate-900 border border-slate-600 rounded p-1.5 text-sm"
                  value={item.weightRangeMin} onChange={(e) => updateItem(category, idx, { weightRangeMin: e.target.value })} />
                <span>〜</span>
                <input type="number" step="0.1" className="w-16 bg-slate-900 border border-slate-600 rounded p-1.5 text-sm"
                  value={item.weightRangeMax} onChange={(e) => updateItem(category, idx, { weightRangeMax: e.target.value })} />
                <span className="ml-2">刻み:</span>
                <input type="number" step="0.1" className="w-16 bg-slate-900 border border-slate-600 rounded p-1.5 text-sm"
                  value={item.weightRangeStep} onChange={(e) => updateItem(category, idx, { weightRangeStep: e.target.value })} />
              </div>
            )}
          </div>

          <div>
            <label className="text-xs font-bold text-slate-400 mb-1 block">トリガーワード・追加プロンプト</label>
            <textarea className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm font-mono h-20 outline-none focus:border-cyan-500"
              value={item.trigger} placeholder="1girl, blue hair..."
              onChange={(e) => updateItem(category, idx, { trigger: e.target.value })} />
          </div>

          <div className="bg-cyan-950/30 border border-cyan-900/50 p-3 rounded-lg">
            <span className="text-[10px] text-cyan-500 font-bold block mb-1">出力プレビュー</span>
            <div className="text-sm font-mono text-cyan-300 break-all">{buildCharContent(item)}</div>
          </div>
        </div>
      ) : (
        <div>
          <label className="text-xs font-bold text-slate-400 mb-2 block">プロンプト直書き（複数LoRA対応）</label>
          <textarea className="w-full bg-slate-900 border border-slate-700 rounded p-3 text-sm font-mono text-cyan-200 outline-none h-40 focus:border-cyan-500"
            value={item.content} placeholder="<lora:A:1.0>, <lora:B:0.5>, 1girl..."
            onChange={(e) => updateItem(category, idx, { content: e.target.value })} />
        </div>
      )}
    </div>
  );

  // --- 単一テキストカラム（comm, base）---
  const renderSingleColumn = (category) => (
    <div className="bg-[#161b22] p-4 rounded-xl border border-slate-800 flex flex-col h-[650px] shadow-2xl">
      <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-3">
        <h2 className="font-black text-base text-slate-400 tracking-wider">{CATEGORY_LABELS[category]}</h2>
        <button onClick={() => toggleAi(category)}
          className={`p-2 rounded-lg transition border ${aiOpen[category]
            ? 'bg-violet-600 border-violet-500 text-white'
            : 'bg-slate-800 border-slate-700 text-violet-400 hover:bg-slate-700'}`}>
          <Wand2 size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pr-2">
        {aiOpen[category] && (
          <InlineGenerator
            category={category}
            onInsert={(content) => handleAiOverwrite(category, content)}
            onClose={() => toggleAi(category)}
          />
        )}

        <div>
          <label className="text-xs font-bold text-slate-500 mb-2 block uppercase">プロンプト内容</label>
          <textarea
            className="w-full bg-[#0d1117] border border-slate-700 rounded p-3 text-sm font-mono text-cyan-100 outline-none h-40 resize-none focus:border-cyan-500"
            value={data[category]}
            onChange={(e) => updateSingleContent(category, e.target.value)}
            placeholder="タグをカンマ区切りで入力..."
          />
        </div>
      </div>
    </div>
  );

  // --- 複数アイテムカラム（char, people）---
  const renderMultiColumn = (category) => (
    <div className="bg-[#161b22] p-4 rounded-xl border border-slate-800 flex flex-col h-[650px] shadow-2xl">
      <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-3">
        <h2 className="font-black text-base text-slate-400 tracking-wider">{CATEGORY_LABELS[category]}</h2>
        <div className="flex gap-1">
          {AI_ENABLED.includes(category) && (
            <button onClick={() => toggleAi(category)}
              className={`p-2 rounded-lg transition border ${aiOpen[category]
                ? 'bg-violet-600 border-violet-500 text-white'
                : 'bg-slate-800 border-slate-700 text-violet-400 hover:bg-slate-700'}`}>
              <Wand2 size={18} />
            </button>
          )}
          <button onClick={() => addItem(category)} className="text-cyan-400 hover:bg-slate-700 bg-slate-800 p-2 rounded-lg transition border border-slate-700">
            <Plus size={18} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pr-2">
        {aiOpen[category] && (
          <InlineGenerator
            category={category}
            onInsert={(content) => handleAiInsert(category, content)}
            onClose={() => toggleAi(category)}
          />
        )}

        {data[category].map((item, idx) => (
          <div key={idx} className="bg-[#0d1117] border border-slate-700 rounded-lg overflow-hidden shadow-md">
            <div className="flex items-center gap-3 p-3 cursor-pointer bg-slate-800/40 hover:bg-slate-800/80 transition"
              onClick={() => updateItem(category, idx, { isOpen: !item.isOpen })}>
              {item.isOpen ? <ChevronDown size={20} className="text-cyan-500" /> : <ChevronRight size={20} />}
              <input
                className="bg-transparent border-none text-base font-bold text-slate-200 outline-none w-full focus:text-cyan-400"
                value={item.title}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => updateItem(category, idx, { title: e.target.value })}
                placeholder="管理用タイトル"
              />
            </div>

            {item.isOpen && (
              <div className="p-4 space-y-3 border-t border-slate-700 bg-black/30">
                {category === 'char' ? renderCharEditor(item, category, idx) : (
                  <div>
                    <label className="text-xs font-bold text-slate-500 mb-2 block uppercase">プロンプト内容</label>
                    <textarea
                      className="w-full bg-[#0d1117] border border-slate-700 rounded p-3 text-sm font-mono text-cyan-100 outline-none h-32 resize-none focus:border-cyan-500"
                      value={item.content}
                      onChange={(e) => updateItem(category, idx, { content: e.target.value })}
                    />
                    {category === 'people' && renderLayoutPreview(item.content)}
                  </div>
                )}
                <button onClick={() => removeItem(category, idx)}
                  className="w-full py-2 mt-4 text-sm font-bold text-red-900 bg-red-950/20 hover:bg-red-900 hover:text-white rounded transition">
                  この項目を削除
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
      {Object.keys(data).map((category) => (
        <div key={category}>
          {SINGLE_CATEGORIES.includes(category)
            ? renderSingleColumn(category)
            : renderMultiColumn(category)
          }
        </div>
      ))}
    </div>
  );
};

export default TemplateEditor;
