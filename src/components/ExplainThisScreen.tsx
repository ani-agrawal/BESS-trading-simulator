import { HelpCircle } from 'lucide-react';
import { GLOSSARY } from '../engine/types';
import type { LessonId } from './TrainingLesson';

interface Props {
  lessonId: LessonId;
  compact?: boolean;
}

const TERMS_BY_LESSON: Record<LessonId, string[]> = {
  1: ['BESS', 'SoC', 'Power Rating (MW)', 'Capacity (MWh)', 'Arbitrage', 'Spread'],
  2: ['Day-Ahead (DA)', 'Settlement Period (SP)', 'Gate Closure', 'Forecast vs Outturn', 'EPEX SPOT'],
  3: ['Intraday (ID)', 'Within-Day Optimisation', 'Forecast vs Outturn', 'Gate Closure', 'Spread'],
  4: ['SIP', 'NIV', 'System Price', 'NIV Chasing', 'Forecast vs Outturn'],
  5: ['Revenue Stacking', 'Balancing Mechanism (BM)', 'BOA', 'Frequency Response', 'DC/DM/DR'],
};

export default function ExplainThisScreen({ lessonId, compact = false }: Props) {
  const terms = TERMS_BY_LESSON[lessonId];
  return (
    <div className={`panel explain-screen ${compact ? 'compact' : ''}`}>
      <div className="panel-header">
        <h3><HelpCircle size={15} /> Explain This Screen</h3>
      </div>
      <div className="explain-list">
        {terms.map(term => (
          <div key={term} className="explain-term">
            <strong>{term}</strong>
            <span>{GLOSSARY[term]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
