export type GameState = 'menu' | 'playing' | 'gameover' | 'library' | 'soundHunter';

export interface GameConfig {
    lives: number;
    difficulty: number;
    isTimerEnabled: boolean;
}
