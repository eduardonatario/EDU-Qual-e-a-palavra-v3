import React from 'react';
import { GameConfig } from '../types';
import { Volume2, VolumeX, Settings, Play, HelpCircle } from 'lucide-react';

interface HeaderProps {
  activeTab: 'player' | 'admin';
  setActiveTab: (tab: 'player' | 'admin') => void;
  config: GameConfig;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  onOpenRules: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  config,
  soundEnabled,
  setSoundEnabled,
  onOpenRules,
}) => {
  return (
    <header id="app-header" className="w-full bg-white/95 backdrop-blur-md border-b border-gray-200 sticky top-0 z-40 transition-colors shadow-xs">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-2">
        {/* Brand & Theme badge */}
        <div className="flex items-center gap-3">
          <div className="bg-emerald-600 text-white font-black text-xl px-2.5 py-1 rounded-md tracking-wider shadow-xs">
            Q
          </div>
          <div>
            <h1 className="font-extrabold text-slate-900 tracking-tight text-lg sm:text-xl leading-none uppercase">
              Qual é a palavra?
            </h1>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1 sm:gap-1.5 bg-gray-100 p-1 rounded-xl border border-gray-200">
          <button
            id="tab-player-btn"
            onClick={() => setActiveTab('player')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'player'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
            }`}
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Preview</span>
          </button>

          <button
            id="tab-admin-btn"
            onClick={() => setActiveTab('admin')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'admin'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Configurações</span>
          </button>
        </div>

        {/* Right side controls (Sound & Help) */}
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            id="toggle-sound-btn"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            title={soundEnabled ? 'Silenciar som' : 'Ativar som'}
          >
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5 text-gray-400" />}
          </button>
          
          <button
            id="open-rules-btn"
            onClick={onOpenRules}
            className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            title="Regras do jogo"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};
