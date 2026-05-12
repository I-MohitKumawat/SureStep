/**
 * Shared props interface for all game/exercise/relaxing components
 * used inside ActivityPlayScreen.
 */
export interface GameProps {
  onDone: (score?: number) => void;
  onScoreUpdate: (pts: number) => void;
  paused: boolean;
}
