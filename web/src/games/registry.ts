// web/src/games/registry.ts
// ต้องตรงกับ server/src/games.ts (GAME_IDS)
import QuizGame from './QuizGame';
import ArrangeGame from './ArrangeGame';

export const registry: Record<string, { component: React.ComponentType<{ onComplete: (correct: boolean) => void }>; name: string }> = {
  quiz: { component: QuizGame, name: 'คำถามชุมชน' },
  arrange: { component: ArrangeGame, name: 'จับคู่ข้าวโพด' },
};
