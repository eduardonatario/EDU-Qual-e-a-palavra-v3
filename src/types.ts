export type LetterState = 'empty' | 'tbd' | 'correct' | 'present' | 'absent';

export interface GameConfig {
  topic: string;
  targetWord: string;
  hint?: string;
  maxAttempts: number;
  showInstructions?: boolean;
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
