export type LetterState = 'empty' | 'tbd' | 'correct' | 'present' | 'absent';

export type AppLanguage = 'pt' | 'en';
export type VictoryAudioType = 'none' | 'tts' | 'custom';
export type TtsLanguage = 'pt-BR' | 'en-US';

export interface GameConfig {
  topic: string;
  targetWord: string;
  hint?: string;
  maxAttempts: number;
  showInstructions?: boolean;
  language?: AppLanguage;
  victoryAudioType?: VictoryAudioType;
  ttsLanguage?: TtsLanguage;
  customAudioUrl?: string;
  customAudioFileName?: string;
}

export interface LetterEvaluation {
  letter: string;
  state: LetterState;
}

export interface Attempt {
  word: string;
  evaluations: LetterEvaluation[];
}

export type GameStatus = 'IN_PROGRESS' | 'WON' | 'LOST';

export interface GameStats {
  played: number;
  wins: number;
  currentStreak: number;
  maxStreak: number;
  guessDistribution: number[];
}
