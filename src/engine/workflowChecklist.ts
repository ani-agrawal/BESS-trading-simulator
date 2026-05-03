import type { GameState } from './types';

export interface WorkflowStep {
  label: string;
  done: boolean;
  evidence: string;
}

export interface WorkflowChecklist {
  currentStage: string;
  completion: number;
  steps: WorkflowStep[];
}

export function getWorkflowChecklist(state: GameState): WorkflowChecklist {
  const hasSchedule = state.dayAhead.playerSchedule.length > 0;
  const hasDa = state.dayAhead.playerSchedule.some(position => position.market === 'da');
  const hasId = state.dayAhead.playerSchedule.some(position => position.market === 'id');
  const hasBm = state.dayAhead.playerSchedule.some(position => position.market === 'bm') || (state.bm?.offers.length ?? 0) > 0;
  const hasPhysical = state.battery.cycleLog.length > 0;
  const hasAnalysis = Boolean(state.analysis);
  const hasSettled = state.dayAhead.revealedPeriods >= 4;

  const steps: WorkflowStep[] = [
    {
      label: 'Prepare the day',
      done: state.dayAhead.forecastPrices.length === 48,
      evidence: 'DA forecast and outturn path loaded.',
    },
    {
      label: 'Set a base plan',
      done: hasDa || hasPhysical,
      evidence: hasDa ? 'DA schedule created.' : hasPhysical ? 'Physical dispatch started.' : 'No base plan yet.',
    },
    {
      label: 'Check constraints',
      done: state.battery.socPct >= 10 && state.battery.socPct <= 90,
      evidence: `SoC ${state.battery.socPct.toFixed(0)}%.`,
    },
    {
      label: 'Revise with new information',
      done: hasId || hasBm || state.mode !== 'arbitrage',
      evidence: hasId ? 'ID revision used.' : hasBm ? 'BM price submitted.' : `Mode: ${state.mode.replace(/_/g, ' ')}.`,
    },
    {
      label: 'Monitor delivery',
      done: hasSchedule ? state.dayAhead.playerSchedule.some(position => position.delivered) : hasPhysical,
      evidence: hasSchedule ? `${state.dayAhead.playerSchedule.filter(position => position.delivered).length} scheduled position(s) delivered.` : `${state.battery.cycleLog.length} physical action(s).`,
    },
    {
      label: 'Review and explain',
      done: hasAnalysis || hasSettled,
      evidence: hasAnalysis ? `Analysis grade ${state.analysis?.grade}.` : `${state.dayAhead.revealedPeriods} SP(s) revealed.`,
    },
  ];

  const doneCount = steps.filter(step => step.done).length;
  const currentStage = steps.find(step => !step.done)?.label ?? 'Ready for independent practice';

  return {
    currentStage,
    completion: Math.round((doneCount / steps.length) * 100),
    steps,
  };
}
