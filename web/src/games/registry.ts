// web/src/games/registry.ts
// ต้องตรงกับ server/src/games.ts (GAME_IDS)
import QuizGame from './QuizGame';
import ArrangeGame from './ArrangeGame';

export const registry: Record<string, React.ComponentType<{ onComplete: (correct: boolean) => void }>> = {
  quiz: QuizGame,
  arrange: ArrangeGame,
};
