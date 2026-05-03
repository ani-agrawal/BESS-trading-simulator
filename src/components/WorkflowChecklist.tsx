import { CheckCircle, Circle, ListChecks } from 'lucide-react';
import type { GameState } from '../engine/types';
import { getWorkflowChecklist } from '../engine/workflowChecklist';

interface Props {
  state: GameState;
}

export default function WorkflowChecklist({ state }: Props) {
  const checklist = getWorkflowChecklist(state);
  return (
    <div className="panel workflow-checklist">
      <div className="panel-header">
        <h3><ListChecks size={15} /> Trader Workflow</h3>
        <span>{checklist.completion}%</span>
      </div>
      <div className="workflow-stage">
        <strong>Current stage</strong>
        <span>{checklist.currentStage}</span>
      </div>
      <div className="workflow-steps">
        {checklist.steps.map(step => (
          <div key={step.label} className={`workflow-step ${step.done ? 'done' : ''}`}>
            {step.done ? <CheckCircle size={14} /> : <Circle size={14} />}
            <div>
              <strong>{step.label}</strong>
              <span>{step.evidence}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
