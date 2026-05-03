import { ClipboardCheck } from 'lucide-react';
import type { GameState } from '../engine/types';
import { getExamReport } from '../engine/examReport';
import type { LessonId } from './TrainingLesson';

interface Props {
  state: GameState;
  lessonId: LessonId;
  startedAt: number | null;
}

export default function ExamReport({ state, lessonId, startedAt }: Props) {
  const report = getExamReport(state, lessonId, startedAt);
  return (
    <div className={`panel exam-report ${report.passed ? 'passed' : 'not-passed'}`}>
      <div className="panel-header">
        <h3><ClipboardCheck size={15} /> Exam Report</h3>
        <span>{report.elapsedPeriods} SPs</span>
      </div>
      <div className="exam-score">
        <strong>{report.grade}</strong>
        <div>
          <span>{report.score}/100</span>
          <p>{report.summary}</p>
        </div>
      </div>
      <div className="exam-columns">
        <div>
          <h4>Strengths</h4>
          {report.strengths.map(item => <span key={item}>{item}</span>)}
        </div>
        <div>
          <h4>Fix next</h4>
          {report.fixes.map(item => <span key={item}>{item}</span>)}
        </div>
      </div>
    </div>
  );
}
