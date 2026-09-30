import React, { useState, useEffect, useCallback } from 'react';
import { Attempt, GameConfig, GameStatus, LetterState } from '../types';
import { evaluateGuess, generateShareText, normalizeText } from '../utils/wordle';
import { sounds, playVictoryAudioFeedback } from '../utils/sound';
import { getTranslations } from '../utils/i18n';
import { VirtualKeyboard } from './VirtualKeyboard';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { RefreshCw, Share2, Award, Sparkles, X, Volume2 } from 'lucide-react';

interface PlayerViewProps {
  config: GameConfig;
  onOpenAdmin: () => void;
}

export const PlayerView: React.FC<PlayerViewProps> = ({ config, onOpenAdmin }) => {
  const lang = config.language || 'pt';
  const t = getTranslations(lang);
  const normalizedTarget = normalizeText(config.targetWord);
  const wordLength = normalizedTarget.length || 5;

  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [currentGuess, setCurrentGuess] = useState<string>('');
  const [status, setStatus] = useState<GameStatus>('IN_PROGRESS');
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [keyStates, setKeyStates] = useState<Record<string, LetterState>>({});
  const [shakingRowIndex, setShakingRowIndex] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [showHint, setShowHint] = useState<boolean>(false);
  const [showExpandedInstructions, setShowExpandedInstructions] = useState<boolean>(false);
  const [isClosedByUser, setIsClosedByUser] = useState<boolean>(false);

  // Show temporary toast message
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2200);
  };

  // Reset game state when target word changes or manual reset
  const handleReset = useCallback(() => {
    setAttempts([]);
    setCurrentGuess('');
    setStatus('IN_PROGRESS');
    setIsEvaluating(false);
    setKeyStates({});
    setShakingRowIndex(null);
    setCopied(false);
    setShowHint(false);

    // Ensure focus is restored to window so physical keyboard input works immediately
    if (typeof window !== 'undefined') {
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      window.focus();
    }
  }, []);

  useEffect(() => {
    handleReset();
  }, [config.targetWord, config.maxAttempts, handleReset]);

  // Handle key inputs
  const handleKeyPress = useCallback(
    (key: string) => {
      if (status !== 'IN_PROGRESS' || isEvaluating) return;

      if (key === 'DEL' || key === 'BACKSPACE') {
        if (currentGuess.length > 0) {
          sounds.playDelete();
          setCurrentGuess((prev) => prev.slice(0, -1));
        }
      } else if (key === 'ENTER') {
        if (currentGuess.length < wordLength) {
          sounds.playShake();
          setShakingRowIndex(attempts.length);
          triggerToast(t.wordLengthError(wordLength));
          setTimeout(() => setShakingRowIndex(null), 500);
          return;
        }

        // Evaluate guess
        const evaluations = evaluateGuess(currentGuess, normalizedTarget);
        const newAttempt: Attempt = {
          word: currentGuess,
          evaluations,
        };

        const nextAttempts = [...attempts, newAttempt];
        setAttempts(nextAttempts);
        setCurrentGuess('');

        // Play flip sounds with staggered delays
        evaluations.forEach((_, idx) => {
          sounds.playFlip(idx * 120);
        });

        // Update keyboard states
        const newKeyStates = { ...keyStates };
        evaluations.forEach((item) => {
          const current = newKeyStates[item.letter];
          if (
            item.state === 'correct' ||
            (item.state === 'present' && current !== 'correct') ||
            (!current && item.state === 'absent')
          ) {
            newKeyStates[item.letter] = item.state;
          }
        });
        setKeyStates(newKeyStates);

        // Check victory or defeat
        const isWin = normalizeText(currentGuess) === normalizedTarget;
        if (isWin) {
          setIsEvaluating(true);
          const flipDuration = wordLength * 120 + 80;

          // 1. Play victory sounds & confetti immediately after tiles flip
          setTimeout(() => {
            sounds.playWin();
            confetti({
              particleCount: 120,
              spread: 70,
              origin: { y: 0.6 },
            });

            // 2. If victory audio or speech is configured, read the word and show modal once done
            if (config.victoryAudioType && config.victoryAudioType !== 'none') {
              playVictoryAudioFeedback(config, () => {
                setTimeout(() => {
                  setStatus('WON');
                  setIsEvaluating(false);
                }, 350);
              });
            } else {
              // No voice/audio configured, display victory modal after celebration
              setTimeout(() => {
                setStatus('WON');
                setIsEvaluating(false);
              }, 700);
            }
          }, flipDuration);
        } else if (nextAttempts.length >= config.maxAttempts) {
          setIsEvaluating(true);
          setTimeout(() => {
            setStatus('LOST');
            setIsEvaluating(false);
          }, wordLength * 120 + 300);
        }
      } else if (currentGuess.length < wordLength) {
        const normKey = normalizeText(key);
        if (normKey.length === 1 && /^[A-Z0-9]$/.test(normKey)) {
          sounds.playKeyPop();
          setCurrentGuess((prev) => prev + normKey);
        }
      }
    },
    [attempts, config, currentGuess, isEvaluating, keyStates, normalizedTarget, status, t, wordLength]
  );

  // Physical keyboard listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.ctrlKey || e.metaKey || e.altKey) return;

      if (e.key === 'Enter') {
        e.preventDefault();
        if (status !== 'IN_PROGRESS') {
          handleReset();
        } else {
          handleKeyPress('ENTER');
        }
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        if (status === 'IN_PROGRESS') {
          handleKeyPress('DEL');
        }
      } else {
        const normKey = normalizeText(e.key);
        if (normKey.length === 1 && /^[A-Z0-9]$/.test(normKey)) {
          if (status === 'IN_PROGRESS') {
            handleKeyPress(normKey);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyPress, handleReset, status]);

  // Share results handler
  const handleShare = () => {
    const shareText = generateShareText(
      config.topic || 'Geral',
      attempts,
      config.maxAttempts,
      status === 'WON'
    );
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    triggerToast(t.resultCopied);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="w-full flex-1 flex flex-col items-center justify-start py-2 px-2 sm:px-4 max-w-xl mx-auto gap-0.5 sm:gap-1">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-16 z-50 bg-slate-900 text-white font-bold px-4 py-2 rounded-xl shadow-xl text-sm border border-slate-800 flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hint Info - formatted identically to standalone HTML export */}
      {config.hint && (
        <div className="w-full text-center mb-1 mt-0.5">
          <div className="text-[0.85rem] font-medium text-slate-500 tracking-normal">
            {t.hintPrefix} {config.hint}
          </div>
        </div>
      )}

      {/* Wordle Grid */}
      <div className="w-full flex justify-center mb-0.5">
        <div
          className="grid gap-1.5 sm:gap-2 w-full"
          style={{
            maxWidth: `${Math.min(350, wordLength * 62)}px`,
            gridTemplateRows: `repeat(${config.maxAttempts}, minmax(0, 1fr))`,
          }}
        >
          {Array.from({ length: config.maxAttempts }).map((_, rIdx) => {
            const isCompletedRow = rIdx < attempts.length;
            const isCurrentRow = rIdx === attempts.length;
            const rowAttempt = attempts[rIdx];
            const isShaking = shakingRowIndex === rIdx;

            return (
              <div
                key={rIdx}
                className={`grid gap-1.5 sm:gap-2 ${isShaking ? 'animate-shake' : ''}`}
                style={{
                  gridTemplateColumns: `repeat(${wordLength}, minmax(0, 1fr))`,
                }}
              >
                {Array.from({ length: wordLength }).map((_, cIdx) => {
                  let letter = '';
                  let state: LetterState = 'empty';

                  if (isCompletedRow && rowAttempt) {
                    const evalItem = rowAttempt.evaluations[cIdx];
                    letter = evalItem.letter;
                    state = evalItem.state;
                  } else if (isCurrentRow) {
                    letter = currentGuess[cIdx] || '';
                    state = letter ? 'tbd' : 'empty';
                  }

                  const getTileColors = () => {
                    switch (state) {
                      case 'correct':
                        return 'bg-emerald-600 border-emerald-600 text-white shadow-xs';
                      case 'present':
                        return 'bg-amber-500 border-amber-500 text-white shadow-xs';
                      case 'absent':
                        return 'bg-slate-800 border-slate-800 text-white shadow-xs';
                      case 'tbd':
                        return 'bg-white border-slate-500 text-slate-900 scale-105 shadow-xs';
                      default:
                        return 'bg-white border-gray-300 text-slate-900';
                    }
                  };

                  return (
                    <motion.div
                      key={cIdx}
                      initial={false}
                      animate={
                        state === 'tbd'
                          ? { scale: [0.95, 1.05, 1] }
                          : isCompletedRow
                          ? { rotateX: [0, 90, 0] }
                          : {}
                      }
                      transition={{
                        duration: 0.25,
                        delay: isCompletedRow ? cIdx * 0.1 : 0,
                      }}
                      className={`
                        aspect-square rounded-sm sm:rounded-md border-2 font-black text-xl sm:text-2xl flex items-center justify-center uppercase select-none transition-colors duration-300
                        ${getTileColors()}
                      `}
                    >
                      {letter}
                    </motion.div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* End Game Modal */}
      <AnimatePresence>
        {status !== 'IN_PROGRESS' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-slate-200 rounded-2xl p-6 max-w-[360px] w-full text-center shadow-xl text-slate-900"
            >
              <h2 className="text-2xl font-extrabold text-slate-900 mb-2">
                {status === 'WON' ? t.winTitle : t.lossTitle}
              </h2>

              <p className="text-slate-500 text-sm mb-3">
                {status === 'WON'
                  ? t.winMessage(attempts.length, config.maxAttempts)
                  : t.lossMessage(normalizedTarget)}
              </p>

              <div className="font-mono whitespace-pre leading-snug my-3 bg-slate-100 p-3 rounded-lg text-lg border border-slate-200 text-slate-900">
                {attempts.map((att, idx) => (
                  <div key={idx}>
                    {att.evaluations.map((ev, eIdx) => (
                      <span key={eIdx}>
                        {ev.state === 'correct' ? '🟩' : ev.state === 'present' ? '🟨' : '⬛'}
                      </span>
                    ))}
                  </div>
                ))}
              </div>

              <div className="space-y-2 mt-4">
                {status === 'WON' && config.victoryAudioType && config.victoryAudioType !== 'none' && (
                  <button
                    id="replay-audio-btn"
                    type="button"
                    onClick={() => playVictoryAudioFeedback(config)}
                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2 px-4 rounded-lg text-sm flex items-center justify-center gap-2 border border-slate-200 transition-colors"
                  >
                    <Volume2 className="w-4 h-4 text-blue-600" />
                    <span>{config.victoryAudioType === 'tts' ? t.listenPronunciationAgain : t.listenAudioAgain}</span>
                  </button>
                )}

                <button
                  id="play-again-btn"
                  onClick={handleReset}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-5 rounded-lg text-base transition-colors"
                >
                  {t.playAgain}
                </button>

                {onOpenAdmin && (
                  <button
                    id="admin-config-btn"
                    onClick={onOpenAdmin}
                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2 px-4 rounded-lg text-xs transition-colors"
                  >
                    {t.backToSettings}
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* On-screen Virtual Keyboard */}
      <VirtualKeyboard
        keyStates={keyStates}
        onKeyPress={handleKeyPress}
        disabled={status !== 'IN_PROGRESS' || isEvaluating}
      />

      {/* Keyboard Instructions and Color Legend */}
      {(config.showInstructions === true && !isClosedByUser) || showExpandedInstructions ? (
        <div className="relative w-full max-w-lg mx-auto text-center text-xs text-slate-700 my-2.5 p-3.5 sm:p-4 space-y-2.5 border border-slate-300 rounded-xl bg-slate-50/80 shadow-xs select-none">
          <button
            type="button"
            onClick={() => {
              setIsClosedByUser(true);
              setShowExpandedInstructions(false);
            }}
            className="absolute top-2.5 right-2.5 text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-200/60 transition-colors"
            title={t.closeInstructionsTitle}
            aria-label={t.closeInstructionsTitle}
          >
            <X className="w-4 h-4" />
          </button>

          <p className="font-medium text-slate-800 pr-6 whitespace-pre-line">
            {t.instructionsP1}
          </p>

          <p className="text-[11px] text-slate-600 font-semibold pt-2 border-t border-slate-200/80">
            {t.instructionsP2}
          </p>

          <div className="flex flex-col items-center justify-center gap-1.5 text-[11px] font-medium text-slate-800">
            <div className="flex items-center gap-1">
              <span>🟩</span>
              <span><strong>{t.colorGreenLabel}</strong> {t.colorGreenDesc}</span>
            </div>
            <div className="flex items-center gap-1">
              <span>🟨</span>
              <span><strong>{t.colorYellowLabel}</strong> {t.colorYellowDesc}</span>
            </div>
            <div className="flex items-center gap-1">
              <span>⬛</span>
              <span><strong>{t.colorGrayLabel}</strong> {t.colorGrayDesc}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="w-full text-center my-2">
          <button
            id="show-instructions-btn"
            type="button"
            onClick={() => {
              setShowExpandedInstructions(true);
              setIsClosedByUser(false);
            }}
            className="text-xs text-slate-500 hover:text-blue-600 flex items-center justify-center mx-auto transition-colors underline underline-offset-2 font-medium"
          >
            <span>{t.showInstructionsBtn}</span>
          </button>
        </div>
      )}
    </div>
  );
};
