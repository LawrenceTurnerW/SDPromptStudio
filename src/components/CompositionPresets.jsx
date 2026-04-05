import { Users } from 'lucide-react';

function buildComposition(n) {
  if (n === 1) {
    return `__comm__ ADDCOMM __base__ ADDBASE __char__`;
  }
  // N人: ADDCOMM + ADDBASE で共通/背景を全体適用、各リージョンに __char__
  // Combinatorial モードで重複なしに展開される
  const charBreaks = Array.from({ length: n }, () => '__char__').join(' BREAK ');
  return `__comm__ ADDCOMM __base__ ADDBASE ${charBreaks}`;
}

const PRESETS = [1, 2, 3, 4];

const CompositionPresets = ({ onAdd }) => {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Users size={14} className="text-[#8b949e]" />
      <span className="text-xs text-[#8b949e]">テンプレート:</span>
      {PRESETS.map(n => (
        <button key={n} onClick={() => onAdd({
          title: `${n}人構図`,
          content: buildComposition(n),
          isOpen: true,
        })}
          className="text-xs px-2.5 py-1 rounded-md border border-[#30363d] text-[#8b949e] hover:text-[#e6edf3] hover:border-[#58a6ff]/40 transition">
          {n}人
        </button>
      ))}
    </div>
  );
};

export default CompositionPresets;
