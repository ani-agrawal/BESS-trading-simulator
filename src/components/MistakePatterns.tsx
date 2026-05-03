import { AlertCircle } from 'lucide-react';
import type { GameState } from '../engine/types';
import { getMistakePatterns } from '../engine/mistakePatterns';

interface Props {
  state: GameState;
}

export default function MistakePatterns({ state }: Props) {
  const patterns = getMistakePatterns(state);
  return (
    <div className="panel mistake-patterns">
      <div className="panel-header">
        <h3><AlertCircle size={15} /> Habit Check</h3>
      </div>
      <div className="pattern-list">
        {patterns.map(pattern => (
          <div key={pattern.id} className={`pattern-item ${pattern.severity}`}>
            <strong>{pattern.title}</strong>
            <span>{pattern.evidence}</span>
            <p>{pattern.fix}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
