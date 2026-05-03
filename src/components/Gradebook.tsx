import { GraduationCap } from 'lucide-react';
import type { GameState } from '../engine/types';
import { getGradebook } from '../engine/gradebook';

interface Props {
  state: GameState;
}

export default function Gradebook({ state }: Props) {
  const gradebook = getGradebook(state);
  return (
    <div className="panel gradebook">
      <div className="panel-header">
        <h3><GraduationCap size={15} /> Trainee Gradebook</h3>
        <span>{gradebook.completedLessons}/5 ready</span>
      </div>
      <div className="gradebook-summary">
        <strong>{gradebook.averageScore}</strong>
        <span>Average score</span>
      </div>
      <div className="gradebook-list">
        {gradebook.lessons.map(lesson => (
          <div key={lesson.lessonId} className={`gradebook-row ${lesson.readiness}`}>
            <div>
              <strong>{lesson.lessonId}. {lesson.title}</strong>
              <span>{lesson.passed}/{lesson.total} checks · {lesson.readiness.replace('-', ' ')}</span>
            </div>
            <em>{lesson.grade}</em>
          </div>
        ))}
      </div>
    </div>
  );
}
