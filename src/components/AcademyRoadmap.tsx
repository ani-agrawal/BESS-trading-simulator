import { CURRICULUM, type TrainingLevel } from '../data/curriculum';
import { ArrowRight, Map, X } from 'lucide-react';
import { useState } from 'react';
import type { LessonId } from './TrainingLesson';

interface Props {
  level: TrainingLevel;
  currentLesson: number;
  onSelectLesson: (lessonId: LessonId) => void;
}

const MODULE_TO_LESSON: Record<number, LessonId> = {
  1: 1,
  2: 1,
  3: 1,
  4: 2,
  5: 3,
  6: 4,
  7: 5,
  8: 5,
  9: 5,
  10: 5,
  11: 5,
  12: 5,
  13: 1,
  14: 5,
  15: 5,
};

const LEVEL_COPY: Record<TrainingLevel, string> = {
  beginner: 'Beginner mode keeps the screen explainable and hides advanced tools until they are needed.',
  trader: 'Trader mode adds quizzes, risk views, and desk-style workflow checks.',
  quant: 'Quant mode opens the advanced analytics layer so you can compare models, backtests, and revenue attribution.',
};

export default function AcademyRoadmap({ level, currentLesson, onSelectLesson }: Props) {
  const [open, setOpen] = useState(false);
  const currentModules = CURRICULUM.filter(module => MODULE_TO_LESSON[module.id] === currentLesson).map(module => module.id);

  const handleSelect = (lessonId: LessonId) => {
    onSelectLesson(lessonId);
    setOpen(false);
  };

  return (
    <>
      <button className="btn" onClick={() => setOpen(true)}>
        <Map size={14} /> Academy Map
      </button>
      {open && (
        <div className="modal-overlay" onClick={() => setOpen(false)}>
          <div className="modal academy-modal" onClick={event => event.stopPropagation()}>
            <div className="modal-header">
              <h2>Trader Academy Roadmap</h2>
              <button className="btn btn-icon" onClick={() => setOpen(false)}><X size={18} /></button>
            </div>
            <p className="academy-intro">
              Current level: <strong>{level}</strong>. {LEVEL_COPY[level]}
            </p>
            <div className="academy-list">
              {CURRICULUM.map(module => {
                const lessonTarget = MODULE_TO_LESSON[module.id];
                const active = currentModules.includes(module.id);
                return (
                <div key={module.id} className={`academy-item ${active ? 'active' : ''}`}>
                  <div className="academy-number">{module.id}</div>
                  <div>
                    <h3>{module.title}</h3>
                    <p>{level === 'beginner' ? module.beginnerSummary : module.traderSkill}</p>
                    {level === 'quant' && <span>Quant angle: {module.futureFeatures.slice(0, 2).join(', ')}</span>}
                    {level !== 'quant' && <span>{module.objective}</span>}
                    <button className="btn btn-sm academy-jump" onClick={() => handleSelect(lessonTarget)}>
                      Go to Lesson {lessonTarget} <ArrowRight size={13} />
                    </button>
                  </div>
                </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
