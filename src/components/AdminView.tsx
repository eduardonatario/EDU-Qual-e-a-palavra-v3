import React, { useState, useEffect, useRef } from 'react';
import { GameConfig, VictoryAudioType, TtsLanguage, AppLanguage } from '../types';
import { normalizeText, generateStandaloneHtml } from '../utils/wordle';
import { playVictoryAudioFeedback } from '../utils/sound';
import { getTranslations } from '../utils/i18n';
import {
  Play,
  CheckCircle2,
  AlertCircle,
  Copy,
  Download,
  Volume2,
  Upload,
  Link as LinkIcon,
  Mic,
  Music,
  Trash2,
  Globe,
} from 'lucide-react';
import { motion } from 'motion/react';

interface AdminViewProps {
  config: GameConfig;
  onSaveConfig: (newConfig: GameConfig) => void;
  onSaveAndPlay: (newConfig: GameConfig) => void;
}

export const AdminView: React.FC<AdminViewProps> = ({
  config,
  onSaveConfig,
  onSaveAndPlay,
}) => {
  const [language, setLanguage] = useState<AppLanguage>(config.language || 'pt');
  const t = getTranslations(language);

  const [topic, setTopic] = useState<string>(
    config.topic && config.topic !== 'Gastronomia' ? config.topic : 'Cinema'
  );
  const [targetWord, setTargetWord] = useState<string>(
    config.targetWord && config.targetWord !== 'PRATO' ? config.targetWord : 'FILME'
  );
  const [hint, setHint] = useState<string>(
    config.hint !== undefined && config.hint !== '' && !config.hint.includes('refeição')
      ? config.hint
      : 'Sétima arte e produções audiovisuais para as telonas.'
  );
  const [maxAttempts, setMaxAttempts] = useState<number>(config.maxAttempts || 6);
  const [showInstructions, setShowInstructions] = useState<boolean>(config.showInstructions === true);

  // Victory Audio States
  const [victoryAudioType, setVictoryAudioType] = useState<VictoryAudioType>(
    config.victoryAudioType || 'none'
  );
  const [ttsLanguage, setTtsLanguage] = useState<TtsLanguage>(
    config.ttsLanguage || 'pt-BR'
  );
  const [customAudioUrl, setCustomAudioUrl] = useState<string>(
    config.customAudioUrl || ''
  );
  const [customAudioFileName, setCustomAudioFileName] = useState<string>(
    config.customAudioFileName || ''
  );
  const [customAudioSource, setCustomAudioSource] = useState<'upload' | 'url'>(
    config.customAudioFileName ? 'upload' : 'url'
  );

  const [savedNotice, setSavedNotice] = useState<boolean>(false);
  const [copiedHtml, setCopiedHtml] = useState<boolean>(false);
  const [downloadedNotice, setDownloadedNotice] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (config) {
      setLanguage(config.language || 'pt');
      setTopic(config.topic && config.topic !== 'Gastronomia' ? config.topic : 'Cinema');
      setTargetWord(config.targetWord && config.targetWord !== 'PRATO' ? config.targetWord : 'FILME');
      setHint(
        config.hint !== undefined && config.hint !== '' && !config.hint.includes('refeição')
          ? config.hint
          : 'Sétima arte e produções audiovisuais para as telonas.'
      );
      setMaxAttempts(config.maxAttempts || 6);
      setShowInstructions(config.showInstructions === true);
      setVictoryAudioType(config.victoryAudioType || 'none');
      setTtsLanguage(config.ttsLanguage || 'pt-BR');
      setCustomAudioUrl(config.customAudioUrl || '');
      setCustomAudioFileName(config.customAudioFileName || '');
      if (config.customAudioFileName) {
        setCustomAudioSource('upload');
      }
    }
  }, [config]);

  const normalizedWord = normalizeText(targetWord);
  const wordLength = normalizedWord.length;

  const isFormValid = topic.trim().length > 0 && wordLength >= 3 && wordLength <= 10;

  const getCurrentFormConfig = (): GameConfig => ({
    topic: topic.trim(),
    targetWord: normalizedWord,
    hint: hint.trim(),
    maxAttempts,
    showInstructions,
    language,
    victoryAudioType,
    ttsLanguage,
    customAudioUrl: victoryAudioType === 'custom' ? customAudioUrl.trim() : '',
    customAudioFileName: victoryAudioType === 'custom' ? customAudioFileName : '',
  });

  const handleSaveAndPlay = () => {
    if (!isFormValid) return;
    const newConfig = getCurrentFormConfig();
    onSaveAndPlay(newConfig);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert(language === 'pt'
        ? 'Por favor, selecione um arquivo de áudio de no máximo 5MB para otimizar o carregamento.'
        : 'Please select an audio file smaller than 5MB to optimize loading.'
      );
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64Data = reader.result as string;
      setCustomAudioUrl(base64Data);
      setCustomAudioFileName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveCustomAudio = () => {
    setCustomAudioUrl('');
    setCustomAudioFileName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleTestVictoryAudio = () => {
    playVictoryAudioFeedback({
      victoryAudioType,
      ttsLanguage,
      customAudioUrl,
      targetWord: normalizedWord || 'PALAVRA',
    });
  };

  const handleCopyHtml = async () => {
    if (!isFormValid) return;
    const newConfig = getCurrentFormConfig();
    onSaveConfig(newConfig);
    const htmlContent = generateStandaloneHtml(newConfig);

    let copied = false;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(htmlContent);
        copied = true;
      }
    } catch (e) {
      console.warn('navigator.clipboard failed, using fallback:', e);
    }

    if (!copied) {
      try {
        const textArea = document.createElement('textarea');
        textArea.value = htmlContent;
        textArea.style.top = '0';
        textArea.style.left = '0';
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        copied = document.execCommand('copy');
        document.body.removeChild(textArea);
      } catch (err) {
        console.error('Copy fallback failed:', err);
      }
    }

    if (copied) {
      setCopiedHtml(true);
      setTimeout(() => setCopiedHtml(false), 2500);
    } else {
      alert(language === 'pt'
        ? 'Não foi possível copiar o HTML automaticamente. Por favor, utilize o botão "Salvar HTML" para baixar o arquivo.'
        : 'Could not copy HTML automatically. Please use the "Save HTML" button to download the file.'
      );
    }
  };

  const handleDownloadStandaloneHtml = () => {
    if (!isFormValid) return;
    const newConfig = getCurrentFormConfig();
    onSaveConfig(newConfig);
    const htmlContent = generateStandaloneHtml(newConfig);
    const fileName = `qual_e_a_palavra-${(newConfig.topic || 'jogo').toLowerCase().replace(/\s+/g, '-')}.html`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloadedNotice(true);
    setTimeout(() => setDownloadedNotice(false), 2500);
  };

  return (
    <div className="w-full max-w-2xl mx-auto py-6 px-4 space-y-6">
      {/* Main Configuration Card */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-5 text-slate-900">
        
        {/* Idioma da Interface Switcher */}
        <div className="space-y-2 pb-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-600" />
              <label className="text-xs font-semibold text-gray-800 block">
                {t.interfaceLanguageTitle}
              </label>
            </div>
            <span className="text-[11px] text-gray-500">
              {t.interfaceLanguageDesc}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              id="lang-btn-pt"
              onClick={() => {
                setLanguage('pt');
                onSaveConfig({ ...getCurrentFormConfig(), language: 'pt' });
              }}
              className={`py-2 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-2 transition-all ${
                language === 'pt'
                  ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                  : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span>{t.langOptionPt}</span>
            </button>

            <button
              type="button"
              id="lang-btn-en"
              onClick={() => {
                setLanguage('en');
                onSaveConfig({ ...getCurrentFormConfig(), language: 'en' });
              }}
              className={`py-2 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-2 transition-all ${
                language === 'en'
                  ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                  : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span>{t.langOptionEn}</span>
            </button>
          </div>
        </div>

        <h3 className="text-sm uppercase tracking-wider text-gray-500 font-bold border-b border-gray-100 pb-2">
          {t.gameDataTitle}
        </h3>

        {/* Assunto / Tema Input */}
        <div className="space-y-1.5">
          <label htmlFor="input-topic" className="block text-xs font-semibold text-gray-700">
            {t.topicLabel} <span className="text-rose-500">*</span>
          </label>
          <input
            id="input-topic"
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder={t.topicPlaceholder}
            className="w-full bg-gray-50 border border-gray-200 focus:border-blue-600 focus:bg-white text-slate-900 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none transition-colors"
          />
        </div>

        {/* Palavra Escolhida Input */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label htmlFor="input-word" className="block text-xs font-semibold text-gray-700">
              {t.wordLabel} <span className="text-rose-500">*</span>
            </label>
            <span className="text-xs font-mono text-gray-500">
              {t.wordFormatted} <span className="text-blue-600 font-bold">{normalizedWord || '—'}</span>{' '}
              ({wordLength} {t.wordLettersCount})
            </span>
          </div>
          <input
            id="input-word"
            type="text"
            value={targetWord}
            onChange={(e) => setTargetWord(e.target.value.toUpperCase())}
            placeholder={t.wordInputPlaceholder}
            maxLength={12}
            className="w-full bg-gray-50 border border-gray-200 focus:border-blue-600 focus:bg-white text-slate-900 uppercase font-mono tracking-wider font-bold rounded-xl px-4 py-2.5 text-base focus:outline-none transition-colors"
          />
          <p className="text-[11px] text-gray-500">
            {t.wordNormalizeHint}
          </p>
        </div>

        {/* Dica Opcional Input */}
        <div className="space-y-1.5">
          <label htmlFor="input-hint" className="block text-xs font-semibold text-gray-700">
            {t.hintLabel}
          </label>
          <input
            id="input-hint"
            type="text"
            value={hint}
            onChange={(e) => setHint(e.target.value)}
            placeholder={t.hintPlaceholder}
            className="w-full bg-gray-50 border border-gray-200 focus:border-blue-600 focus:bg-white text-slate-900 rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-colors"
          />
        </div>

        {/* Número de Tentativas */}
        <div className="space-y-2 pt-2 border-t border-gray-100">
          <div className="flex justify-between items-center">
            <label className="block text-xs font-semibold text-gray-700">
              {t.maxAttemptsLabel}
            </label>
            <span className="text-sm font-bold text-blue-600">{t.attemptsCount(maxAttempts)}</span>
          </div>

          <div className="flex items-center gap-2">
            {[4, 5, 6, 7, 8].map((num) => (
              <button
                key={num}
                type="button"
                id={`attempts-btn-${num}`}
                onClick={() => setMaxAttempts(num)}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border ${
                  maxAttempts === num
                    ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                    : 'bg-gray-50 border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {num}
              </button>
            ))}
          </div>
        </div>

        {/* Áudio / Leitura da Palavra ao Acertar */}
        <div className="space-y-3 pt-3 border-t border-gray-100">
          <div>
            <label className="text-xs font-semibold text-gray-800 block">
              {t.audioSectionTitle}
            </label>
            <span className="text-[11px] text-gray-500 block">
              {t.audioSectionDesc}
            </span>
          </div>

          {/* Type Selector (None, TTS, Custom Audio) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              type="button"
              id="audio-type-none"
              onClick={() => setVictoryAudioType('none')}
              className={`py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border transition-all ${
                victoryAudioType === 'none'
                  ? 'bg-blue-50 border-blue-600 text-blue-700 shadow-xs'
                  : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span>{t.audioTypeNone}</span>
            </button>

            <button
              type="button"
              id="audio-type-tts"
              onClick={() => setVictoryAudioType('tts')}
              className={`py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border transition-all ${
                victoryAudioType === 'tts'
                  ? 'bg-blue-50 border-blue-600 text-blue-700 shadow-xs'
                  : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Mic className="w-4 h-4" />
              <span>{t.audioTypeTts}</span>
            </button>

            <button
              type="button"
              id="audio-type-custom"
              onClick={() => setVictoryAudioType('custom')}
              className={`py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border transition-all ${
                victoryAudioType === 'custom'
                  ? 'bg-blue-50 border-blue-600 text-blue-700 shadow-xs'
                  : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Music className="w-4 h-4" />
              <span>{t.audioTypeCustom}</span>
            </button>
          </div>

          {/* TTS Sub-options */}
          {victoryAudioType === 'tts' && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-800 block">
                    {t.ttsLangTitle}
                  </label>
                  <span className="text-[11px] text-slate-500">
                    {t.ttsLangDesc}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    id="tts-lang-pt"
                    onClick={() => setTtsLanguage('pt-BR')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                      ttsLanguage === 'pt-BR'
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    🇧🇷 PT
                  </button>
                  <button
                    type="button"
                    id="tts-lang-en"
                    onClick={() => setTtsLanguage('en-US')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                      ttsLanguage === 'en-US'
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    🇺🇸 EN
                  </button>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between">
                <span className="text-xs text-slate-600">
                  {t.wordToRead} <strong className="text-blue-600">{normalizedWord || 'FILME'}</strong>
                </span>
                <button
                  type="button"
                  id="test-tts-btn"
                  onClick={handleTestVictoryAudio}
                  className="px-3 py-1.5 bg-white border border-slate-300 hover:border-blue-500 hover:text-blue-600 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
                >
                  <Volume2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>{t.testPronunciation}</span>
                </button>
              </div>
            </div>
          )}

          {/* Custom Audio Sub-options */}
          {victoryAudioType === 'custom' && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
              {/* Source Switcher: Upload vs URL */}
              <div className="flex items-center gap-2 border-b border-slate-200/80 pb-2.5">
                <button
                  type="button"
                  id="custom-source-upload"
                  onClick={() => setCustomAudioSource('upload')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    customAudioSource === 'upload'
                      ? 'bg-slate-800 text-white shadow-xs'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{t.uploadMp3Source}</span>
                </button>

                <button
                  type="button"
                  id="custom-source-url"
                  onClick={() => setCustomAudioSource('url')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    customAudioSource === 'url'
                      ? 'bg-slate-800 text-white shadow-xs'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <LinkIcon className="w-3.5 h-3.5" />
                  <span>{t.urlMp3Source}</span>
                </button>
              </div>

              {customAudioSource === 'upload' ? (
                <div className="space-y-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    id="audio-file-input"
                    accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac"
                    onChange={handleFileUpload}
                    className="hidden"
                  />

                  {customAudioUrl && customAudioUrl.startsWith('data:') ? (
                    <div className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-xl">
                      <div className="flex items-center gap-2 truncate pr-2">
                        <Music className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="text-xs font-medium text-slate-800 truncate">
                          {customAudioFileName || t.audioLoadedSuccess}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          id="test-uploaded-audio-btn"
                          onClick={handleTestVictoryAudio}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                          <span>{t.listenBtn}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                        >
                          {t.changeBtn}
                        </button>
                        <button
                          type="button"
                          onClick={handleRemoveCustomAudio}
                          className="p-1 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                          title={t.removeAudioTitle}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      id="upload-trigger-btn"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-4 px-4 border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl bg-white hover:bg-blue-50/40 text-center flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Upload className="w-5 h-5 text-blue-600" />
                      <span className="text-xs font-bold text-slate-800">
                        {t.uploadPromptTitle}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {t.uploadPromptSubtitle}
                      </span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      id="custom-audio-url-input"
                      type="url"
                      value={customAudioUrl}
                      onChange={(e) => {
                        setCustomAudioUrl(e.target.value);
                        setCustomAudioFileName('');
                      }}
                      placeholder={t.audioUrlPlaceholder}
                      className="flex-1 bg-white border border-slate-300 focus:border-blue-600 text-slate-900 rounded-xl px-3 py-2 text-xs focus:outline-none transition-colors"
                    />
                    {customAudioUrl && (
                      <button
                        type="button"
                        id="test-url-audio-btn"
                        onClick={handleTestVictoryAudio}
                        className="px-3 py-2 bg-white border border-slate-300 hover:border-blue-500 hover:text-blue-600 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors"
                      >
                        <Volume2 className="w-3.5 h-3.5 text-blue-600" />
                        <span>{t.listenBtn}</span>
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {t.audioUrlHint}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Exibir Balão de Instruções Toggle */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div>
            <label htmlFor="toggle-instructions-btn" className="text-xs font-semibold text-gray-800 block">
              {t.showInstructionsToggleLabel}
            </label>
            <span className="text-[11px] text-gray-500 block">
              {t.showInstructionsToggleDesc}
            </span>
          </div>
          <button
            type="button"
            id="toggle-instructions-btn"
            onClick={() => setShowInstructions(!showInstructions)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              showInstructions ? 'bg-blue-600' : 'bg-gray-300'
            }`}
            title={showInstructions ? 'Ocultar' : 'Exibir'}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                showInstructions ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Form Validation Feedback */}
        {!isFormValid && (
          <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{t.formValidationHint}</span>
          </div>
        )}

        {/* Actions bar */}
        <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row gap-2.5">
          <button
            id="save-and-play-btn"
            type="button"
            disabled={!isFormValid}
            onClick={handleSaveAndPlay}
            className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-xs ${
              isFormValid
                ? 'bg-blue-600 hover:bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Play className="w-4 h-4" />
            <span>{t.saveAndPlayBtn}</span>
          </button>

          <button
            id="copy-html-btn"
            type="button"
            disabled={!isFormValid}
            onClick={handleCopyHtml}
            className={`py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 border transition-all ${
              isFormValid
                ? 'bg-blue-600 hover:bg-blue-500 border-blue-600 text-white shadow-xs'
                : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
            }`}
            title={t.copyHtmlBtn}
          >
            {copiedHtml ? <CheckCircle2 className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
            <span>{copiedHtml ? t.copiedHtmlBtn : t.copyHtmlBtn}</span>
          </button>

          <button
            id="export-standalone-btn"
            type="button"
            disabled={!isFormValid}
            onClick={handleDownloadStandaloneHtml}
            className={`py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 border transition-all ${
              isFormValid
                ? 'bg-blue-600 hover:bg-blue-500 border-blue-600 text-white shadow-xs'
                : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
            }`}
            title={t.downloadHtmlBtn}
          >
            {downloadedNotice ? <CheckCircle2 className="w-4 h-4 text-white" /> : <Download className="w-4 h-4" />}
            <span>{downloadedNotice ? t.downloadedHtmlBtn : t.downloadHtmlBtn}</span>
          </button>
        </div>

        {savedNotice && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-1.5 text-xs font-semibold text-blue-600 pt-1"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{t.settingsSavedNotice}</span>
          </motion.div>
        )}
      </div>
    </div>
  );
};
