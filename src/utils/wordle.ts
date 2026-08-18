import { Attempt, GameConfig, LetterEvaluation, LetterState } from '../types';

/**
 * Normalizes text for comparison by removing diacritics/accents and non-alphanumeric chars.
 * E.g., "Café!" -> "CAFE"
 */
export function normalizeText(text: string): string {
  if (!text) return '';
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
}

/**
 * Evaluates a guessed word against the target word using standard Wordle logic.
 * Correctly handles duplicate letters.
 */
export function evaluateGuess(guessWord: string, targetWord: string): LetterEvaluation[] {
  const normalizedGuess = normalizeText(guessWord);
  const normalizedTarget = normalizeText(targetWord);
  const length = normalizedTarget.length;

  const result: LetterEvaluation[] = new Array(length);
  const targetLettersCount: Record<string, number> = {};

  // Count remaining letters in target
  for (let i = 0; i < length; i++) {
    const char = normalizedTarget[i];
    targetLettersCount[char] = (targetLettersCount[char] || 0) + 1;
  }

  // Pass 1: Find EXACT matches (correct / green)
  for (let i = 0; i < length; i++) {
    const guessChar = normalizedGuess[i] || '';
    const targetChar = normalizedTarget[i];

    if (guessChar === targetChar) {
      result[i] = { letter: guessChar, state: 'correct' };
      targetLettersCount[guessChar]--;
    }
  }

  // Pass 2: Find PRESENT matches (yellow) and ABSENT (gray)
  for (let i = 0; i < length; i++) {
    if (result[i]) continue; // Already marked correct

    const guessChar = normalizedGuess[i] || '';
    if (guessChar && targetLettersCount[guessChar] && targetLettersCount[guessChar] > 0) {
      result[i] = { letter: guessChar, state: 'present' };
      targetLettersCount[guessChar]--;
    } else {
      result[i] = { letter: guessChar, state: 'absent' };
    }
  }

  return result;
}

/**
 * Generates Qual é a palavra? shareable emoji block text.
 */
export function generateShareText(
  topic: string,
  attempts: Attempt[],
  maxAttempts: number,
  won: boolean
): string {
  const scoreText = won ? `${attempts.length}/${maxAttempts}` : `X/${maxAttempts}`;
  let text = `🧩 Qual é a palavra?\nResultado: ${scoreText}\n\n`;

  for (const attempt of attempts) {
    const row = attempt.evaluations
      .map((ev) => {
        if (ev.state === 'correct') return '🟩';
        if (ev.state === 'present') return '🟨';
        return '⬛';
      })
      .join('');
    text += `${row}\n`;
  }

  return text.trim();
}

/**
 * Generates a complete standalone HTML document string containing the entire Qual é a palavra? game logic,
 * styling, and audio for embed / distribution.
 */
export function generateStandaloneHtml(config: GameConfig): string {
  const normTarget = normalizeText(config.targetWord);
  const wordLen = normTarget.length;

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Qual é a palavra?</title>
  <style>
    /* Scoped App Styles to avoid interfering with host site */
    .qep-app-wrapper,
    .qep-app-wrapper *,
    .qep-app-wrapper *::before,
    .qep-app-wrapper *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }

    body {
      margin: 0;
      padding: 0;
      background-color: #ffffff;
    }

    .qep-app-wrapper {
      --qep-bg-color: #ffffff;
      --qep-card-bg: #f8fafc;
      --qep-tile-bg: #ffffff;
      --qep-tile-border: #d1d5db;
      --qep-text-main: #0f172a;
      --qep-text-muted: #64748b;
      --qep-color-correct: #16a34a;
      --qep-color-present: #eab308;
      --qep-color-absent: #64748b;
      --qep-key-bg: #e2e8f0;
      --qep-key-text: #0f172a;

      background-color: var(--qep-bg-color);
      color: var(--qep-text-main);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      width: 100%;
      min-height: 100vh;
      padding: 12px;
      position: relative;
    }

    .qep-header {
      width: 100%;
      max-width: 500px;
      text-align: center;
      padding-bottom: 8px;
      border-bottom: 1px solid #e2e8f0;
      margin-bottom: 12px;
    }

    .qep-title {
      font-size: 1.5rem;
      font-weight: 800;
      letter-spacing: 0.02em;
      color: #0f172a;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      text-transform: uppercase;
    }

    .qep-hint-box {
      margin-top: 6px;
      font-size: 0.85rem;
      color: var(--qep-text-muted);
      font-weight: 500;
    }

    .qep-main {
      width: 100%;
      max-width: 500px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
    }

    .qep-grid {
      display: grid;
      grid-template-rows: repeat(${config.maxAttempts}, 1fr);
      gap: 6px;
      width: 100%;
      max-width: ${Math.min(350, wordLen * 62)}px;
      aspect-ratio: ${wordLen} / ${config.maxAttempts};
    }

    .qep-row {
      display: grid;
      grid-template-columns: repeat(${wordLen}, 1fr);
      gap: 6px;
    }

    .qep-tile {
      aspect-ratio: 1;
      background-color: #ffffff;
      border: 2px solid var(--qep-tile-border);
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      font-weight: 800;
      text-transform: uppercase;
      user-select: none;
      transition: transform 0.15s ease, background-color 0.3s ease, border-color 0.3s ease;
      color: #0f172a;
    }

    .qep-tile[data-state="tbd"] {
      border-color: #64748b;
      animation: qep-pop 0.1s ease-in-out;
    }

    .qep-tile[data-state="correct"] {
      background-color: var(--qep-color-correct);
      border-color: var(--qep-color-correct);
      color: #ffffff;
      animation: qep-flip 0.5s ease forwards;
    }

    .qep-tile[data-state="present"] {
      background-color: var(--qep-color-present);
      border-color: var(--qep-color-present);
      color: #ffffff;
      animation: qep-flip 0.5s ease forwards;
    }

    .qep-tile[data-state="absent"] {
      background-color: var(--qep-color-absent);
      border-color: var(--qep-color-absent);
      color: #ffffff;
      animation: qep-flip 0.5s ease forwards;
    }

    .qep-shake {
      animation: qep-shake 0.4s ease-in-out;
    }

    @keyframes qep-pop {
      0% { transform: scale(0.9); }
      50% { transform: scale(1.1); }
      100% { transform: scale(1); }
    }

    @keyframes qep-shake {
      10%, 90% { transform: translateX(-2px); }
      20%, 80% { transform: translateX(4px); }
      30%, 50%, 70% { transform: translateX(-6px); }
      40%, 60% { transform: translateX(6px); }
    }

    .qep-keyboard {
      width: 100%;
      max-width: 500px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      user-select: none;
      margin-top: 4px;
    }

    .qep-kb-row {
      display: flex;
      justify-content: center;
      gap: 4px;
      width: 100%;
    }

    .qep-kb-key {
      height: 48px;
      border-radius: 6px;
      background-color: var(--qep-key-bg);
      color: var(--qep-key-text);
      font-weight: 700;
      font-size: 0.9rem;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      flex: 1;
      max-width: 44px;
      border: none;
      outline: none;
      transition: background-color 0.2s ease, transform 0.05s ease;
    }

    .qep-kb-key:active {
      transform: scale(0.95);
    }

    .qep-kb-key.wide {
      flex: 1.5;
      max-width: 65px;
      font-size: 0.75rem;
      background-color: #cbd5e1;
    }

    .qep-kb-key[data-state="correct"] { background-color: var(--qep-color-correct); color: white; }
    .qep-kb-key[data-state="present"] { background-color: var(--qep-color-present); color: white; }
    .qep-kb-key[data-state="absent"] { background-color: var(--qep-color-absent); color: white; opacity: 0.85; }

    .qep-instructions-wrapper {
      margin-top: 14px;
      text-align: center;
      width: 100%;
      max-width: 500px;
      box-sizing: border-box;
    }

    .qep-show-instructions-btn {
      background: transparent;
      border: none;
      color: #64748b;
      font-size: 0.8rem;
      text-decoration: underline;
      cursor: pointer;
      font-family: inherit;
      font-weight: 500;
      padding: 6px 12px;
      transition: color 0.2s;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
    }

    .qep-instructions-box {
      position: relative;
      margin-top: 6px;
      text-align: center;
      font-size: 0.8rem;
      color: #334155;
      line-height: 1.5;
      border: 1px solid #cbd5e1;
      border-radius: 12px;
      background-color: #f8fafc;
      padding: 12px 14px;
      width: 100%;
      box-sizing: border-box;
    }

    .qep-close-instructions-btn {
      position: absolute;
      top: 8px;
      right: 8px;
      background: transparent;
      border: none;
      color: #94a3b8;
      font-size: 1.1rem;
      cursor: pointer;
      font-weight: bold;
      padding: 2px 8px;
      border-radius: 6px;
      line-height: 1;
    }

    /* Modal Palette preserved */
    .qep-modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15,23,42,0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
      z-index: 99999;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.3s ease;
    }

    .qep-modal-backdrop.show {
      opacity: 1;
      pointer-events: auto;
    }

    .qep-modal-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 24px;
      max-width: 360px;
      width: 100%;
      text-align: center;
      box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);
      color: #0f172a;
    }

    .qep-modal-title {
      font-size: 1.5rem;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 8px;
    }

    .qep-modal-msg {
      color: var(--qep-text-muted);
      margin-bottom: 12px;
      font-size: 0.9rem;
    }

    .qep-share-grid {
      font-family: monospace;
      white-space: pre;
      line-height: 1.2;
      margin: 12px 0;
      background: #f1f5f9;
      padding: 12px;
      border-radius: 8px;
      font-size: 1.1rem;
      border: 1px solid #e2e8f0;
      color: #0f172a;
    }

    .qep-btn {
      background: #2563eb;
      color: #ffffff;
      border: none;
      padding: 10px 20px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 0.95rem;
      cursor: pointer;
      margin-top: 16px;
      width: 100%;
      transition: background-color 0.2s ease;
    }

    .qep-btn:hover {
      background: #1d4ed8;
    }

    .qep-toast {
      position: fixed;
      top: 70px;
      background: #0f172a;
      color: #ffffff;
      padding: 8px 16px;
      border-radius: 8px;
      font-weight: 700;
      font-size: 0.9rem;
      box-shadow: 0 10px 15px -3px rgba(0,0,0,0.2);
      opacity: 0;
      transform: translateY(-10px);
      transition: all 0.2s ease;
      z-index: 9999;
      pointer-events: none;
    }

    .qep-toast.show {
      opacity: 1;
      transform: translateY(0);
    }
  </style>
</head>
<body>
  <div class="qep-app-wrapper" id="qep-app-wrapper">
    <div id="qep-toast" class="qep-toast"></div>

    <header class="qep-header">
      <div class="qep-title">Qual é a palavra?</div>
      ${config.hint ? `<div class="qep-hint-box">Dica: ${escapeHtml(config.hint)}</div>` : ''}
    </header>

    <main class="qep-main">
      <div id="qep-grid" class="qep-grid"></div>
      <div class="qep-keyboard" id="qep-keyboard"></div>
      <div class="qep-instructions-wrapper">
        <button id="qep-show-instructions-btn" onclick="document.getElementById('qep-instructions-box').style.display='block'; this.style.display='none';" class="qep-show-instructions-btn" style="display: ${config.showInstructions !== false ? 'none' : 'inline-flex'};">
          Exibir Instruções do jogo
        </button>

        <div id="qep-instructions-box" class="qep-instructions-box" style="display: ${config.showInstructions !== false ? 'block' : 'none'};">
          <button id="qep-close-instructions-btn" onclick="document.getElementById('qep-instructions-box').style.display='none'; document.getElementById('qep-show-instructions-btn').style.display='inline-flex';" class="qep-close-instructions-btn" title="Fechar instruções" aria-label="Fechar instruções">
            &times;
          </button>
          <p style="margin-bottom: 8px; padding-right: 16px;">Digite uma palavra e pressione Enter para enviá-la.<br>Seu desafio é descobrir a palavra correta!</p>
          <p style="margin-bottom: 6px; font-weight: 600; border-top: 1px solid #e2e8f0; padding-top: 8px;">Após cada tentativa, observe as cores das letras:</p>
          <div style="display: flex; flex-direction: column; gap: 4px; align-items: center; font-size: 0.78rem;">
            <div>🟩 <strong>Verde:</strong> a letra está correta e na posição certa.</div>
            <div>🟨 <strong>Amarelo:</strong> a letra faz parte da palavra, mas está em outra posição.</div>
            <div>⬛ <strong>Cinza:</strong> a letra não faz parte da palavra.</div>
          </div>
        </div>
      </div>
    </main>

    <div id="qep-modal" class="qep-modal-backdrop">
      <div class="qep-modal-card">
        <h2 id="qep-modal-title" class="qep-modal-title">Parabéns!</h2>
        <p id="qep-modal-msg" class="qep-modal-msg"></p>
        <div id="qep-share-grid" class="qep-share-grid"></div>
        <button class="qep-btn" onclick="resetGame()">Jogar Novamente</button>
      </div>
    </div>
  </div>

  <script>
    const CONFIG = {
      topic: ${JSON.stringify(config.topic)},
      targetWord: ${JSON.stringify(normTarget)},
      wordLength: ${wordLen},
      maxAttempts: ${config.maxAttempts}
    };

    let attempts = [];
    let currentGuess = "";
    let isGameOver = false;
    let keyStates = {};

    function normalizeText(text) {
      return text.normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    }

    function init() {
      createGrid();
      createKeyboard();
      window.addEventListener('keydown', handleKeyDown);
    }

    function createGrid() {
      const grid = document.getElementById('qep-grid');
      grid.innerHTML = '';
      for (let r = 0; r < CONFIG.maxAttempts; r++) {
        const row = document.createElement('div');
        row.className = 'qep-row';
        row.id = 'row-' + r;
        for (let c = 0; c < CONFIG.wordLength; c++) {
          const tile = document.createElement('div');
          tile.className = 'qep-tile';
          tile.id = 'tile-' + r + '-' + c;
          row.appendChild(tile);
        }
        grid.appendChild(row);
      }
    }

    function createKeyboard() {
      const kb = document.getElementById('qep-keyboard');
      kb.innerHTML = '';
      const layout = [
        ['Q','W','E','R','T','Y','U','I','O','P'],
        ['A','S','D','F','G','H','J','K','L'],
        ['ENTER','Z','X','C','V','B','N','M','DEL']
      ];

      layout.forEach(rowKeys => {
        const row = document.createElement('div');
        row.className = 'qep-kb-row';
        rowKeys.forEach(key => {
          const btn = document.createElement('button');
          btn.className = 'qep-kb-key' + (key === 'ENTER' || key === 'DEL' ? ' wide' : '');
          btn.textContent = key === 'DEL' ? '⌫' : key;
          btn.id = 'key-' + key;
          btn.onclick = () => onKeyPress(key);
          row.appendChild(btn);
        });
        kb.appendChild(row);
      });
    }

    function showToast(msg) {
      const t = document.getElementById('qep-toast');
      t.textContent = msg;
      t.classList.add('show');
      setTimeout(() => t.classList.remove('show'), 2000);
    }

    function handleKeyDown(e) {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable)) {
        return;
      }
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      if (isGameOver) {
        if (e.key === 'Enter') resetGame();
        return;
      }
      if (e.key === 'Enter') onKeyPress('ENTER');
      else if (e.key === 'Backspace') onKeyPress('DEL');
      else {
        const normKey = normalizeText(e.key);
        if (normKey.length === 1 && /^[A-Z0-9]$/.test(normKey)) {
          onKeyPress(normKey);
        }
      }
    }

    function onKeyPress(key) {
      if (isGameOver) return;

      if (key === 'DEL') {
        if (currentGuess.length > 0) {
          currentGuess = currentGuess.slice(0, -1);
          updateCurrentRow();
        }
      } else if (key === 'ENTER') {
        submitGuess();
      } else if (currentGuess.length < CONFIG.wordLength) {
        const normKey = normalizeText(key);
        if (normKey.length === 1 && /^[A-Z0-9]$/.test(normKey)) {
          currentGuess += normKey;
          updateCurrentRow();
        }
      }
    }

    function updateCurrentRow() {
      const rowIdx = attempts.length;
      for (let c = 0; c < CONFIG.wordLength; c++) {
        const tile = document.getElementById('tile-' + rowIdx + '-' + c);
        const letter = currentGuess[c] || '';
        tile.textContent = letter;
        tile.setAttribute('data-state', letter ? 'tbd' : '');
      }
    }

    function submitGuess() {
      if (currentGuess.length < CONFIG.wordLength) {
        showToast('Palavra incompleta!');
        const row = document.getElementById('row-' + attempts.length);
        row.classList.add('qep-shake');
        setTimeout(() => row.classList.remove('qep-shake'), 400);
        return;
      }

      const eval = evaluate(currentGuess, CONFIG.targetWord);
      attempts.push({ word: currentGuess, eval });
      const rowIdx = attempts.length - 1;

      // Update tiles with state & keyboard
      eval.forEach((item, c) => {
        const tile = document.getElementById('tile-' + rowIdx + '-' + c);
        setTimeout(() => {
          tile.setAttribute('data-state', item.state);
        }, c * 100);

        // Update keyboard state priority: correct > present > absent
        const currState = keyStates[item.letter];
        if (item.state === 'correct' || (item.state === 'present' && currState !== 'correct') || (!currState && item.state === 'absent')) {
          keyStates[item.letter] = item.state;
          const kBtn = document.getElementById('key-' + item.letter);
          if (kBtn) {
            setTimeout(() => kBtn.setAttribute('data-state', item.state), (CONFIG.wordLength + 1) * 100);
          }
        }
      });

      const isWin = normalizeText(currentGuess) === CONFIG.targetWord;
      currentGuess = "";

      if (isWin || attempts.length >= CONFIG.maxAttempts) {
        isGameOver = true;
        setTimeout(() => showEndModal(isWin), CONFIG.wordLength * 120 + 300);
      }
    }

    function evaluate(guess, target) {
      const len = target.length;
      const res = new Array(len);
      const counts = {};

      for (let i = 0; i < len; i++) {
        counts[target[i]] = (counts[target[i]] || 0) + 1;
      }

      for (let i = 0; i < len; i++) {
        if (guess[i] === target[i]) {
          res[i] = { letter: guess[i], state: 'correct' };
          counts[guess[i]]--;
        }
      }

      for (let i = 0; i < len; i++) {
        if (!res[i]) {
          if (counts[guess[i]] && counts[guess[i]] > 0) {
            res[i] = { letter: guess[i], state: 'present' };
            counts[guess[i]]--;
          } else {
            res[i] = { letter: guess[i], state: 'absent' };
          }
        }
      }
      return res;
    }

    function showEndModal(isWin) {
      const modal = document.getElementById('qep-modal');
      const title = document.getElementById('qep-modal-title');
      const msg = document.getElementById('qep-modal-msg');
      const share = document.getElementById('qep-share-grid');

      if (isWin) {
        title.textContent = 'Parabéns!';
        msg.textContent = 'Você acertou em ' + attempts.length + '/' + CONFIG.maxAttempts + ' tentativas!';
      } else {
        title.textContent = '❌ Fim de Jogo';
        msg.textContent = 'A palavra correta era: ' + CONFIG.targetWord;
      }

      let shareText = "";
      attempts.forEach(a => {
        shareText += a.eval.map(e => e.state === 'correct' ? '🟩' : e.state === 'present' ? '🟨' : '⬛').join('') + '\\n';
      });
      share.textContent = shareText;

      modal.classList.add('show');
    }

    function resetGame() {
      attempts = [];
      currentGuess = "";
      isGameOver = false;
      keyStates = {};
      document.getElementById('qep-modal').classList.remove('show');
      createGrid();
      createKeyboard();
      if (document.activeElement && document.activeElement.blur) {
        document.activeElement.blur();
      }
      window.focus();
    }

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      init();
    } else {
      document.addEventListener('DOMContentLoaded', init);
    }
  </script>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
