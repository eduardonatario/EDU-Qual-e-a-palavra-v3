import React, { useState } from 'react';
import { GameConfig } from '../types';
import { generateStandaloneHtml } from '../utils/wordle';
import { X, Copy, Download, Code, Play, Check, FileCode, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface StandaloneExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: GameConfig;
}

export const StandaloneExportModal: React.FC<StandaloneExportModalProps> = ({
  isOpen,
  onClose,
  config,
}) => {
  const [activeTab, setActiveTab] = useState<'code' | 'embed' | 'preview'>('code');
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [copiedEmbed, setCopiedEmbed] = useState<boolean>(false);

  if (!isOpen) return null;

  const htmlContent = generateStandaloneHtml(config);
  const fileName = `qual_e_a_palavra-${(config.topic || 'jogo').toLowerCase().replace(/\s+/g, '-')}.html`;

  const iframeSnippet = `<!-- Wordle Standalone Embed -->
<iframe
  srcdoc="${htmlContent.replace(/"/g, '&quot;')}"
  width="100%"
  height="650"
  style="border: none; border-radius: 12px; overflow: hidden; background: #ffffff;"
  title="Wordle - ${config.topic}"
  allow="fullscreen"
></iframe>`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(htmlContent);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleCopyEmbed = () => {
    navigator.clipboard.writeText(iframeSnippet);
    setCopiedEmbed(true);
    setTimeout(() => setCopiedEmbed(false), 2500);
  };

  const handleDownload = () => {
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/60 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          className="bg-white border border-gray-200 rounded-2xl max-w-3xl w-full h-[90vh] max-h-[700px] flex flex-col shadow-2xl relative overflow-hidden text-slate-900"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-gray-200 flex items-center justify-between bg-white shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-50 border border-blue-200 text-blue-600 rounded-xl">
                <FileCode className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 leading-tight">
                  HTML Standalone para Embed
                </h2>
                <p className="text-xs text-gray-500">
                  Arquivo auto-contido sem dependências externas para seu site ou iFrame.
                </p>
              </div>
            </div>

            <button
              id="close-export-modal-btn"
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Subheader / Mode switcher */}
          <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
            <div className="flex gap-1 bg-gray-200/80 p-1 rounded-xl border border-gray-300/60">
              <button
                id="export-tab-code"
                onClick={() => setActiveTab('code')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'code'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Code className="w-3.5 h-3.5" />
                <span>Código HTML</span>
              </button>

              <button
                id="export-tab-embed"
                onClick={() => setActiveTab('embed')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'embed'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>iFrame Snippet</span>
              </button>

              <button
                id="export-tab-preview"
                onClick={() => setActiveTab('preview')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'preview'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Play className="w-3.5 h-3.5" />
                <span>Preview ao Vivo</span>
              </button>
            </div>

            {/* Quick Download Action */}
            <button
              id="download-html-btn"
              onClick={handleDownload}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors shadow-xs ml-auto"
            >
              <Download className="w-4 h-4" />
              <span>Baixar {fileName}</span>
            </button>
          </div>

          {/* Modal Body */}
          <div className="flex-1 overflow-hidden p-4 bg-slate-950/40">
            {activeTab === 'code' && (
              <div className="h-full flex flex-col relative">
                <div className="flex justify-between items-center mb-2 px-1">
                  <span className="text-xs text-slate-400 font-mono">
                    Tamanho total: ~{(htmlContent.length / 1024).toFixed(1)} KB
                  </span>
                  <button
                    id="copy-code-btn"
                    onClick={handleCopyCode}
                    className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1 border border-slate-700 transition-colors"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCode ? 'Copiado!' : 'Copiar Código HTML'}</span>
                  </button>
                </div>

                <textarea
                  readOnly
                  value={htmlContent}
                  className="w-full flex-1 bg-slate-950 text-slate-300 font-mono text-xs p-4 rounded-xl border border-slate-800 focus:outline-none resize-none select-all overflow-auto"
                />
              </div>
            )}

            {activeTab === 'embed' && (
              <div className="h-full flex flex-col space-y-3">
                <p className="text-xs text-slate-300">
                  Copie a tag <code className="bg-slate-800 text-blue-400 px-1.5 py-0.5 rounded">&lt;iframe&gt;</code> abaixo para colar diretamente no seu blog, portal ou ambiente de aprendizagem (LMS/WordPress):
                </p>

                <div className="relative flex-1 flex flex-col">
                  <div className="flex justify-end mb-1">
                    <button
                      id="copy-embed-btn"
                      onClick={handleCopyEmbed}
                      className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1 border border-slate-700 transition-colors"
                    >
                      {copiedEmbed ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedEmbed ? 'Copiado!' : 'Copiar iFrame'}</span>
                    </button>
                  </div>

                  <textarea
                    readOnly
                    value={iframeSnippet}
                    className="w-full flex-1 bg-slate-950 text-emerald-400/90 font-mono text-xs p-4 rounded-xl border border-slate-800 focus:outline-none resize-none overflow-auto"
                  />
                </div>
              </div>
            )}

            {activeTab === 'preview' && (
              <div className="h-full w-full rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
                <iframe
                  title="Wordle Preview"
                  srcDoc={htmlContent}
                  className="w-full h-full border-0"
                />
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
