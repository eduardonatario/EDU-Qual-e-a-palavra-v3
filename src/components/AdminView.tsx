import React, { useState, useEffect } from 'react';
import { GameConfig } from '../types';
import { normalizeText, generateStandaloneHtml } from '../utils/wordle';
import { Play, CheckCircle2, AlertCircle, Copy, Download } from 'lucide-react';
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

  const [savedNotice, setSavedNotice] = useState<boolean>(false);
  const [copiedHtml, setCopiedHtml] = useState<boolean>(false);
  const [downloadedNotice, setDownloadedNotice] = useState<boolean>(false);

  useEffect(() => {
    if (config) {
      setTopic(config.topic && config.topic !== 'Gastronomia' ? config.topic : 'Cinema');
      setTargetWord(config.targetWord && config.targetWord !== 'PRATO' ? config.targetWord : 'FILME');
      setHint(
        config.hint !== undefined && config.hint !== '' && !config.hint.includes('refeição')
          ? config.hint
          : 'Sétima arte e produções audiovisuais para as telonas.'
      );
      setMaxAttempts(config.maxAttempts || 6);
      setShowInstructions(config.showInstructions === true);
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
  });

  const handleSaveAndPlay = () => {
    if (!isFormValid) return;
    const newConfig = getCurrentFormConfig();
    onSaveAndPlay(newConfig);
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
      alert('Não foi possível copiar o HTML automaticamente. Por favor, utilize o botão "Salvar HTML" para baixar o arquivo.');
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
        <h3 className="text-sm uppercase tracking-wider text-gray-500 font-bold border-b border-gray-100 pb-2">
          Dados do Jogo
        </h3>

        {/* Assunto / Tema Input */}
        <div className="space-y-1.5">
          <label htmlFor="input-topic" className="block text-xs font-semibold text-gray-700">
            Assunto / Tema do Jogo <span className="text-rose-500">*</span>
          </label>
          <input
            id="input-topic"
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Ex: Cinema, Tecnologia, Geografia, Esportes..."
            className="w-full bg-gray-50 border border-gray-200 focus:border-blue-600 focus:bg-white text-slate-900 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none transition-colors"
          />
        </div>

        {/* Palavra Escolhida Input */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label htmlFor="input-word" className="block text-xs font-semibold text-gray-700">
              Palavra Secreta a Adivinhar <span className="text-rose-500">*</span>
            </label>
            <span className="text-xs font-mono text-gray-500">
              Formatada: <span className="text-blue-600 font-bold">{normalizedWord || '—'}</span>{' '}
              ({wordLength} letras)
            </span>
          </div>
          <input
            id="input-word"
            type="text"
            value={targetWord}
            onChange={(e) => setTargetWord(e.target.value.toUpperCase())}
            placeholder="Ex: FILME, CAFÉ, BRASIL..."
            maxLength={12}
            className="w-full bg-gray-50 border border-gray-200 focus:border-blue-600 focus:bg-white text-slate-900 uppercase font-mono tracking-wider font-bold rounded-xl px-4 py-2.5 text-base focus:outline-none transition-colors"
          />
          <p className="text-[11px] text-gray-500">
            Acentos e caracteres especiais são automaticamente normalizados para o jogo (ex: &quot;CAFÉ&quot; torna-se &quot;CAFE&quot;).
          </p>
        </div>

        {/* Dica Opcional Input */}
        <div className="space-y-1.5">
          <label htmlFor="input-hint" className="block text-xs font-semibold text-gray-700">
            Dica do jogo (Esta dica aparecerá para o jogador)
          </label>
          <input
            id="input-hint"
            type="text"
            value={hint}
            onChange={(e) => setHint(e.target.value)}
            placeholder="Ex: Sétima arte e produções audiovisuais para as telonas..."
            className="w-full bg-gray-50 border border-gray-200 focus:border-blue-600 focus:bg-white text-slate-900 rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-colors"
          />
        </div>

        {/* Número de Tentativas */}
        <div className="space-y-2 pt-2 border-t border-gray-100">
          <div className="flex justify-between items-center">
            <label className="block text-xs font-semibold text-gray-700">
              Número Máximo de Tentativas
            </label>
            <span className="text-sm font-bold text-blue-600">{maxAttempts} tentativas</span>
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

        {/* Exibir Balão de Instruções Toggle */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div>
            <label htmlFor="toggle-instructions-btn" className="text-xs font-semibold text-gray-800 block">
              Exibir Instruções do jogo
            </label>
            <span className="text-[11px] text-gray-500 block">
              Exibe a caixa explicativa abaixo do teclado com as regras de cores.
            </span>
          </div>
          <button
            type="button"
            id="toggle-instructions-btn"
            onClick={() => setShowInstructions(!showInstructions)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              showInstructions ? 'bg-blue-600' : 'bg-gray-300'
            }`}
            title={showInstructions ? 'Ocultar instruções' : 'Exibir instruções'}
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
            <span>Preencha o assunto e informe uma palavra com no mínimo 3 letras.</span>
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
            <span>Preview</span>
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
            title="Copiar o código HTML do jogo para incorporar (embed)"
          >
            {copiedHtml ? <CheckCircle2 className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
            <span>{copiedHtml ? 'HTML Copiado!' : 'Copiar HTML'}</span>
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
            title="Baixar diretamente o arquivo HTML Standalone para o seu computador"
          >
            {downloadedNotice ? <CheckCircle2 className="w-4 h-4 text-white" /> : <Download className="w-4 h-4" />}
            <span>{downloadedNotice ? 'Arquivo Baixado!' : 'Salvar HTML'}</span>
          </button>
        </div>

        {savedNotice && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-1.5 text-xs font-semibold text-blue-600 pt-1"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Configurações salvas com sucesso!</span>
          </motion.div>
        )}
      </div>
    </div>
  );
};
