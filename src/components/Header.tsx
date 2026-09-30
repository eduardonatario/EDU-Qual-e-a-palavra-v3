import React from 'react';
import { GameConfig, AppLanguage } from '../types';
import { getTranslations } from '../utils/i18n';
import { Volume2, VolumeX, Settings, Play, HelpCircle, Globe } from 'lucide-react';

interface HeaderProps {
  activeTab: 'player' | 'admin';
  setActiveTab: (tab: 'player' | 'admin') => void;
  config: GameConfig;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  onOpenRules: () => void;
  onLanguageChange: (lang: AppLanguage) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  config,
  soundEnabled,
  setSoundEnabled,
  onOpenRules,
  onLanguageChange,
}) => {
  const lang = config.language || 'pt';
  const t = getTranslations(lang);

  const toggleLanguage = () => {
    onLanguageChange(lang === 'pt' ? 'en' : 'pt');
  };

  return (
    <header id="app-header" className="w-full bg-white/95 backdrop-blur-md border-b border-gray-200 sticky top-0 z-40 transition-colors shadow-xs">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between gap-2">
        {/* Brand & Theme badge */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="bg-emerald-600 text-white font-black text-lg sm:text-xl px-2.5 py-0.5 sm:py-1 rounded-md tracking-wider shadow-xs select-none">
            {t.appShortTitle}
          </div>
          <div>
            <h1 className="font-extrabold text-slate-900 tracking-tight text-base sm:text-xl leading-none uppercase">
              {t.appTitle}
            </h1>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1 sm:gap-1.5 bg-gray-100 p-1 rounded-xl border border-gray-200">
          <button
            id="tab-player-btn"
            onClick={() => setActiveTab('player')}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'player'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
            }`}
          >
            <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current" />
            <span>{t.previewTab}</span>
          </button>

          <button
            id="tab-admin-btn"
            onClick={() => setActiveTab('admin')}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'admin'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
            }`}
          >
            <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>{t.configTab}</span>
          </button>
        </div>

        {/* Right side controls (Language, Sound & Help) */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          {/* Language toggle button */}
          <button
            id="toggle-language-btn"
            type="button"
            onClick={toggleLanguage}
            className="flex items-center gap-1 px-2 py-1.5 text-xs font-bold text-slate-700 hover:text-blue-600 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors shadow-2xs"
            title={lang === 'pt' ? 'Mudar para Inglês (Switch to English)' : 'Mudar para Português (Switch to Portuguese)'}
          >
            <Globe className="w-3.5 h-3.5 text-blue-600" />
            <span>{lang === 'pt' ? 'PT' : 'EN'}</span>
          </button>

          <button
            id="toggle-sound-btn"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-1.5 sm:p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            title={soundEnabled ? t.soundMute : t.soundUnmute}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" /> : <VolumeX className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />}
          </button>
          
          <button
            id="open-rules-btn"
            onClick={onOpenRules}
            className="p-1.5 sm:p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            title={t.rulesTitle}
          >
            <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};
