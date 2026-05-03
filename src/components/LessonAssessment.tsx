import { CheckCircle, Circle, ClipboardCheck } from 'lucide-react';
import type { GameState } from '../engine/types';
import { assessLesson } from '../engine/lessonAssessment';
import type { AssessmentLessonId } from '../engine/lessonAssessment';

interface Props {
  state: GameState;
  lessonId: AssessmentLessonId;
}

const READINESS_LABEL = {
  'not-started': 'Not started',
  practising: 'Practising',
  ready: 'Ready',
};

export default function LessonAssessment({ state, lessonId }: Props) {
  const assessment = assessLesson(state, lessonId);
  return (
    <div className={`panel lesson-assessment readiness-${assessment.readiness}`}>
      <div className="panel-header">
        <h3><ClipboardCheck size={15} /> Lesson Check</h3>
        <span>{assessment.passed}/{assessment.total}</span>
      </div>
      <div className="assessment-readiness">
        <strong>{READINESS_LABEL[assessment.readiness]}</strong>
        <small>{assessment.nextAction}</small>
      </div>
      <div className="assessment-list">
        {assessment.items.map(item => (
          <div key={item.label} className={`assessment-item ${item.passed ? 'passed' : ''}`}>
            {item.passed ? <CheckCircle size={14} /> : <Circle size={14} />}
            <div>
              <strong>{item.label}</strong>
              <span>{item.evidence}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
