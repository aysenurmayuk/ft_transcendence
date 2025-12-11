/**
 * Type definitions for API responses
 */

export interface User {
  id: number;
  username: string;
}

export interface AuthResponse {
  user: User;
}

export interface ErrorResponse {
  error: string;
  message?: string;
  details?: Array<{ field: string; message: string }>;
}

/**
 * Game types
 */

export interface GameState {
  ball: {
    x: number;
    y: number;
    dx: number;
    dy: number;
    radius: number;
  };
  paddle1: {
    x: number;
    y: number;
    width: number;
    height: number;
    dy: number;
  };
  paddle2: {
    x: number;
    y: number;
    width: number;
    height: number;
    dy: number;
  };
  score: {
    player1: number;
    player2: number;
  };
  isPlaying: boolean;
  isPaused: boolean;
  winner: 'player1' | 'player2' | null;
}

export interface GameControls {
  upPressed: boolean;
  downPressed: boolean;
  wPressed: boolean;
  sPressed: boolean;
}
