import { Copy } from 'lucide-react';

const NegativePrompt = ({ negativePrompt, setNegativePrompt }) => {
  return (
    <div className="lg:col-span-2 bg-[#161b22] p-6 rounded-xl border border-slate-700 shadow-xl flex flex-col justify-between">
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <label className="text-sm font-black text-slate-400 tracking-widest">ネガティブプロンプト</label>
          <button onClick={() => navigator.clipboard.writeText(negativePrompt)}
            className="text-sm text-pink-500 font-bold hover:underline">
            ネガティブをコピー
          </button>
        </div>
        <textarea className="w-full bg-[#0d1117] border border-slate-800 rounded-lg p-4 text-sm font-mono text-pink-200/70 h-28 outline-none focus:border-pink-900"
          value={negativePrompt} onChange={(e) => setNegativePrompt(e.target.value)} />
      </div>

      <div className="p-6 bg-cyan-950/20 border-2 border-cyan-900/50 rounded-xl flex justify-between items-center shadow-[inset_0_0_20px_rgba(8,145,178,0.1)]">
        <div>
          <p className="text-sm text-cyan-500 font-bold mb-2">Forge のプロンプト欄に貼り付ける文字列</p>
          <code className="text-5xl font-black text-cyan-400 tracking-tighter drop-shadow-lg">__people__</code>
        </div>
        <button onClick={() => {
          navigator.clipboard.writeText("__people__");
        }} className="bg-blue-600 hover:bg-blue-500 p-6 rounded-2xl border-b-4 border-blue-800 shadow-xl transition group active:border-b-0 active:translate-y-1">
          <div className="flex flex-col items-center gap-2">
            <Copy size={36} className="text-white group-active:scale-95 transition" />
            <span className="text-white font-black text-sm">コピー</span>
          </div>
        </button>
      </div>
    </div>
  );
};

export default NegativePrompt;
