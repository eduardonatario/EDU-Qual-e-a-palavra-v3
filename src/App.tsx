import { useState, useEffect } from 'react';
import { GameConfig } from './types';
import { Header } from './components/Header';
import { PlayerView } from './components/PlayerView';
import { AdminView } from './components/AdminView';
import { RulesModal } from './components/RulesModal';
import { sounds } from './utils/sound';

const STORAGE_KEY = 'wordle_custom_config_v4';

const DEFAULT_CONFIG: GameConfig = {
  topic: 'Cinema',
  targetWord: 'FILME',
  hint: 'Sétima arte e produções audiovisuais para as telonas.',
  maxAttempts: 6,
  showInstructions: false,
  language: 'pt',
  victoryAudioType: 'none',
  ttsLanguage: 'pt-BR',
  customAudioUrl: '',
  customAudioFileName: '',
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'player' | 'admin'>('player');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isRulesOpen, setIsRulesOpen] = useState<boolean>(false);

  // Initialize config from localStorage or default
  const [config, setConfig] = useState<GameConfig>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (
            parsed &&
            parsed.targetWord &&
            parsed.topic &&
            parsed.topic !== 'Gastronomia' &&
            parsed.targetWord !== 'PRATO'
          ) {
            return parsed;
          }
        }
      } catch {
        // Fallback to default
      }
    }
    return DEFAULT_CONFIG;
  });

  // Keep sound manager state in sync
  useEffect(() => {
    sounds.setSoundEnabled(soundEnabled);
  }, [soundEnabled]);

  const handleSaveConfig = (newConfig: GameConfig) => {
    setConfig(newConfig);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig));
    } catch {
      // Ignore storage errors
    }
  };

  const handleSaveAndPlay = (newConfig: GameConfig) => {
    handleSaveConfig(newConfig);
    setActiveTab('player');
  };

  const handleLanguageChange = (lang: 'pt' | 'en') => {
    const updated = { ...config, language: lang };
    handleSaveConfig(updated);
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-slate-900 flex flex-col font-sans selection:bg-blue-600 selection:text-white antialiased">
      {/* Header Bar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        config={config}
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
        onOpenRules={() => setIsRulesOpen(true)}
        onLanguageChange={handleLanguageChange}
      />

      {/* Main View Area */}
      <main className="flex-1 flex flex-col items-center justify-start w-full">
        {activeTab === 'player' ? (
          <PlayerView
            config={config}
            onOpenAdmin={() => setActiveTab('admin')}
          />
        ) : (
          <AdminView
            config={config}
            onSaveConfig={handleSaveConfig}
            onSaveAndPlay={handleSaveAndPlay}
          />
        )}
      </main>

      {/* Rules Modal */}
      <RulesModal
        isOpen={isRulesOpen}
        onClose={() => setIsRulesOpen(false)}
        language={config.language || 'pt'}
      />
    </div>
  );
}
