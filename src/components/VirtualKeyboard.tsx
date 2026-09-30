import React from 'react';
import { LetterState } from '../types';
import { Delete, CornerDownLeft } from 'lucide-react';

interface VirtualKeyboardProps {
  keyStates: Record<string, LetterState>;
  onKeyPress: (key: string) => void;
  disabled?: boolean;
}

const KEYBOARD_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'DEL'],
];

export const VirtualKeyboard: React.FC<VirtualKeyboardProps> = ({
  keyStates,
  onKeyPress,
  disabled = false,
}) => {
  const getKeyStyle = (state?: LetterState) => {
    switch (state) {
      case 'correct':
        return 'bg-emerald-600 text-white border-emerald-500 shadow-xs';
      case 'present':
        return 'bg-amber-500 text-white border-amber-400 shadow-xs';
      case 'absent':
        return 'bg-slate-700 text-white border-slate-700 opacity-90';
      default:
        return 'bg-gray-200 text-gray-800 hover:bg-gray-300 active:bg-gray-400 border-gray-300';
    }
  };

  return (
    <div id="virtual-keyboard" className="w-full max-w-lg mx-auto px-1 select-none space-y-1 sm:space-y-1.5 mt-0.5 mb-1">
      {KEYBOARD_ROWS.map((row, rIdx) => (
        <div key={rIdx} className="flex justify-center gap-1 sm:gap-1.5">
          {row.map((key) => {
            const isSpecial = key === 'ENTER' || key === 'DEL';
            const state = keyStates[key];

            return (
              <button
                key={key}
                id={`key-${key}`}
                disabled={disabled}
                onClick={() => onKeyPress(key)}
                className={`
                  h-11 sm:h-12 rounded-lg font-bold text-xs sm:text-sm tracking-tight transition-all duration-100 flex items-center justify-center border
                  ${isSpecial ? 'px-2 sm:px-3 min-w-[54px] sm:min-w-[64px] bg-gray-300 hover:bg-gray-400 text-gray-900 border-gray-300 font-extrabold' : 'flex-1 max-w-[42px]'}
                  ${!isSpecial ? getKeyStyle(state) : ''}
                  ${disabled ? 'opacity-50 cursor-not-allowed' : 'active:scale-95 cursor-pointer'}
                `}
              >
                {key === 'DEL' ? (
                  <Delete className="w-5 h-5" />
                ) : key === 'ENTER' ? (
                  <span className="flex items-center gap-1 text-[11px] sm:text-xs">
                    <CornerDownLeft className="w-3.5 h-3.5" />
                    ENTER
                  </span>
                ) : (
                  key
                )}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
};
