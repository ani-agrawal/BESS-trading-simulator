import { FileQuestion } from 'lucide-react';
import { HISTORICAL_DAYS } from '../data/historicalDays';

export default function ScenarioExamSelector() {
  const exams = HISTORICAL_DAYS.slice(0, 4);
  return (
    <div className="panel scenario-exam-selector">
      <div className="panel-header">
        <h3><FileQuestion size={15} /> Scenario Exams</h3>
      </div>
      <div className="scenario-exam-list">
        {exams.map(day => (
          <div key={day.id} className={`scenario-exam ${day.difficulty}`}>
            <strong>{day.title}</strong>
            <span>{day.difficulty} · target: beat naive benchmark</span>
          </div>
        ))}
      </div>
      <p>Use the Scenarios button, load one of these days, turn on Exam Mode, then trade without hints.</p>
    </div>
  );
}
