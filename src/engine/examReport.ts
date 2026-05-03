import type { GameState } from './types';
import { assessLesson } from './lessonAssessment';
import { scoreMission } from './missionScoring';
import { getMistakePatterns } from './mistakePatterns';
import { getRiskReport } from './riskLimits';

export type ExamLessonId = 1 | 2 | 3 | 4 | 5;

export interface ExamReport {
  score: number;
  grade: string;
  passed: boolean;
  elapsedPeriods: number;
  readiness: string;
  summary: string;
  strengths: string[];
  fixes: string[];
}

export function getExamReport(state: GameState, lessonId: ExamLessonId, startedAt: number | null): ExamReport {
  const mission = scoreMission(state, lessonId);
  const assessment = assessLesson(state, lessonId);
  const risk = getRiskReport(state);
  const mistakes = getMistakePatterns(state).filter(pattern => pattern.id !== 'clean');
  const elapsedPeriods = startedAt === null ? 0 : Math.max(0, Math.round((state.clock.currentTime - startedAt) / 1_800_000));
  const passed = mission.score >= 70 && assessment.readiness === 'ready' && risk.status !== 'breach';

  const fixes = [
    ...assessment.items.filter(item => !item.passed).map(item => item.label),
    ...mistakes.map(pattern => pattern.title),
    ...(risk.status === 'breach' ? ['Resolve risk-limit breach'] : []),
  ].slice(0, 4);

  return {
    score: mission.score,
    grade: mission.grade,
    passed,
    elapsedPeriods,
    readiness: assessment.readiness,
    summary: passed
      ? 'Pass: you completed the core checks without a major risk breach.'
      : 'Not yet: repeat the scenario and fix the items below before moving on.',
    strengths: mission.strengths.length > 0 ? mission.strengths : ['You entered exam mode and made the attempt without hints.'],
    fixes: fixes.length > 0 ? fixes : ['Try a harder scenario or move to the next lesson.'],
  };
}
