import { Flag, CheckCircle, AlertTriangle } from 'lucide-react';
import type { GameState } from '../engine/types';
import { getScenarioObjective } from '../engine/scenarioObjective';

interface Props {
  state: GameState;
}

export default function ScenarioObjective({ state }: Props) {
  const objective = getScenarioObjective(state);
  return (
    <div className={`panel scenario-objective ${objective.passed ? 'passed' : ''}`}>
      <div className="panel-header">
        <h3><Flag size={15} /> Scenario Objective</h3>
        <span>{objective.regime}</span>
      </div>
      <div className="objective-target">
        {objective.passed ? <CheckCircle size={16} /> : <Flag size={16} />}
        <strong>{objective.target}</strong>
      </div>
      <div className="objective-progress">{objective.progress}</div>
      <ul className="objective-criteria">
        {objective.successCriteria.map(item => <li key={item}>{item}</li>)}
      </ul>
      <div className="objective-trap">
        <AlertTriangle size={14} />
        <span>{objective.trap}</span>
      </div>
    </div>
  );
}
