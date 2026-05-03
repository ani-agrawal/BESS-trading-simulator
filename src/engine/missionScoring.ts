import type { GameState } from './types';
import type { LessonId } from '../components/TrainingLesson';
import { getRevenueSummary } from './battery';

export interface MissionScore {
  score: number;
  grade: string;
  strengths: string[];
  improvements: string[];
}

function gradeFromScore(score: number): string {
  if (score >= 90) return 'A';
  if (score >= 75) return 'B';
  if (score >= 60) return 'C';
  if (score >= 40) return 'D';
  return 'E';
}

export function scoreMission(state: GameState, lessonId: LessonId): MissionScore {
  const summary = getRevenueSummary(state.battery);
  const trades = state.battery.cycleLog;
  const chargeTrades = trades.filter(trade => trade.action === 'charge');
  const dischargeTrades = trades.filter(trade => trade.action === 'discharge');
  const spread = summary.avgDischargePrice - summary.avgChargePrice;
  const strengths: string[] = [];
  const improvements: string[] = [];
  let score = 50;

  if (trades.length > 0) {
    score += 10;
    strengths.push('You made at least one active decision.');
  } else {
    improvements.push('Make a deliberate trade or choose to wait when the signal is weak.');
  }

  if (chargeTrades.length > 0 && dischargeTrades.length > 0) {
    score += 15;
    strengths.push('You completed both sides of an arbitrage cycle.');
  } else if (trades.length > 0) {
    improvements.push('Try pairing charge and discharge decisions to realise the spread.');
  }

  if (spread >= 30) {
    score += 15;
    strengths.push(`Strong realised spread of £${spread.toFixed(2)}/MWh.`);
  } else if (spread >= 10) {
    score += 7;
    strengths.push(`Positive realised spread of £${spread.toFixed(2)}/MWh.`);
  } else if (chargeTrades.length > 0 && dischargeTrades.length > 0) {
    score -= 10;
    improvements.push('The realised spread was thin after efficiency and degradation.');
  }

  if (state.battery.socPct >= 20 && state.battery.socPct <= 85) {
    score += 8;
    strengths.push('SoC remains flexible.');
  } else {
    improvements.push('Avoid ending with very low or very high SoC unless there is a clear reason.');
  }

  if (lessonId >= 2) {
    const da = state.dayAhead.playerSchedule.filter(position => position.market === 'da');
    if (da.some(position => position.action === 'charge') && da.some(position => position.action === 'discharge')) {
      score += 10;
      strengths.push('Day-ahead schedule includes both charge and discharge legs.');
    } else {
      improvements.push('Build a balanced day-ahead schedule with both charging and discharging.');
    }
  }

  if (lessonId >= 3) {
    const idTrades = state.dayAhead.playerSchedule.filter(position => position.market === 'id');
    if (idTrades.length > 0) {
      score += 8;
      strengths.push('You used intraday to revise the plan.');
    } else {
      improvements.push('Use intraday when new information changes the value of a future SP.');
    }
  }

  if (lessonId >= 4 && state.analysis) {
    score = Math.round((score * 0.5) + (state.analysis.score * 0.5));
    if (state.analysis.score >= 60) strengths.push('Post-trade analysis shows you captured meaningful value.');
    else improvements.push('Review missed and bad periods in the analysis tab.');
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  return {
    score,
    grade: gradeFromScore(score),
    strengths: strengths.slice(0, 3),
    improvements: improvements.slice(0, 3),
  };
}
