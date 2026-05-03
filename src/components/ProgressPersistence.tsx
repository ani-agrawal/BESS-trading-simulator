import { useEffect } from 'react';
import { Save } from 'lucide-react';
import type { GameState } from '../engine/types';
import { getGradebook } from '../engine/gradebook';

const KEY = 'bess-training-progress';

export default function ProgressPersistence({ state }: { state: GameState }) {
  const previous = (() => {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) as { averageScore?: number; completedLessons?: number; savedAt?: string } : null;
    } catch {
      return null;
    }
  })();
  const savedAt = new Date().toLocaleString();

  useEffect(() => {
    const gradebook = getGradebook(state);
    const payload = {
      savedAt: new Date().toISOString(),
      averageScore: gradebook.averageScore,
      completedLessons: gradebook.completedLessons,
      lessons: gradebook.lessons,
    };
    localStorage.setItem(KEY, JSON.stringify(payload));
  }, [state]);

  return (
    <div className="panel progress-persistence">
      <div className="panel-header">
        <h3><Save size={15} /> Progress Save</h3>
      </div>
      <p>Training progress is saved locally in this browser with the current lesson checks and gradebook.</p>
      {previous && (
        <div className="progress-previous">
          <strong>Previous</strong>
          <span>{previous.completedLessons ?? 0}/5 ready · average {previous.averageScore ?? 0}</span>
        </div>
      )}
      <span>Last saved: {savedAt}</span>
    </div>
  );
}
