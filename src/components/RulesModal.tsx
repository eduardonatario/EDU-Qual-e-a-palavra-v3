import React from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white border border-gray-200 rounded-2xl max-w-md w-full p-6 shadow-2xl relative text-slate-900"
          >
            <button
              id="close-rules-btn"
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-bold text-slate-900 mb-3">Como Jogar</h2>
            <p className="text-sm text-gray-600 mb-2">
              Digite uma palavra e pressione Enter para enviá-la.<br />
              Seu desafio é descobrir a palavra correta!
            </p>

            <p className="text-xs font-semibold text-gray-700 mb-3">
              Após cada tentativa, observe as cores das letras:
            </p>

            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3 bg-gray-50 p-2.5 rounded-xl border border-gray-200">
                <div className="w-9 h-9 rounded-lg bg-emerald-600 font-bold text-white flex items-center justify-center shrink-0">
                  T
                </div>
                <div>
                  <span className="font-semibold text-emerald-600">Verde:</span> a letra está correta e na posição certa.
                </div>
              </div>

              <div className="flex items-center gap-3 bg-gray-50 p-2.5 rounded-xl border border-gray-200">
                <div className="w-9 h-9 rounded-lg bg-amber-500 font-bold text-white flex items-center justify-center shrink-0">
                  E
                </div>
                <div>
                  <span className="font-semibold text-amber-600">Amarelo:</span> a letra faz parte da palavra, mas está em outra posição.
                </div>
              </div>

              <div className="flex items-center gap-3 bg-gray-50 p-2.5 rounded-xl border border-gray-200">
                <div className="w-9 h-9 rounded-lg bg-slate-500 font-bold text-white flex items-center justify-center shrink-0">
                  R
                </div>
                <div>
                  <span className="font-semibold text-slate-600">Cinza:</span> a letra não faz parte da palavra.
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end">
              <button
                id="understand-rules-btn"
                onClick={onClose}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 px-4 rounded-xl transition-colors shadow-xs"
              >
                Entendi, vamos jogar!
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
