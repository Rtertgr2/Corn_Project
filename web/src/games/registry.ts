// web/src/games/registry.ts
// ต้องตรงกับ server/src/games.ts (GAME_IDS)
import QuizGame from './QuizGame';
import MergeGame from './MergeGame';

export const registry: Record<string, { component: React.ComponentType<{ onComplete: (correct: boolean) => void }>; name: string; desc: string }> = {
  quiz: { component: QuizGame, name: 'คำถามชุมชน', desc: 'ตอบคำถามชุมชนสั้นๆ ได้ 1 แต้ม' },
  merge: { component: MergeGame, name: 'รวมเมล็ด', desc: 'รวมเมล็ดเป็นต้นกล้า ต้นข้าวโพด และไอศครีม' },
};
