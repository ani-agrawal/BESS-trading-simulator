import { useState } from 'react';
import { LESSON_QUIZZES } from '../data/curriculum';
import { CheckCircle, HelpCircle } from 'lucide-react';

export default function LessonQuiz({ lessonId }: { lessonId: number }) {
  const questions = LESSON_QUIZZES[lessonId] ?? [];
  const [answers, setAnswers] = useState<Record<string, number>>({});

  if (questions.length === 0) return null;

  const correct = questions.filter(q => answers[q.id] === q.answer).length;

  return (
    <div className="panel lesson-quiz">
      <div className="panel-header">
        <h3><HelpCircle size={15} /> Quick Check</h3>
      </div>
      <div className="quiz-score">{correct}/{questions.length} correct</div>
      {questions.map(question => {
        const selected = answers[question.id];
        const answered = selected !== undefined;
        const isCorrect = selected === question.answer;
        return (
          <div key={question.id} className="quiz-question">
            <p>{question.prompt}</p>
            <div className="quiz-options">
              {question.options.map((option, index) => (
                <button
                  key={option}
                  className={`btn quiz-option ${answered && index === question.answer ? 'correct' : ''} ${selected === index && !isCorrect ? 'wrong' : ''}`}
                  onClick={() => setAnswers(prev => ({ ...prev, [question.id]: index }))}
                >
                  {option}
                </button>
              ))}
            </div>
            {answered && (
              <div className={`quiz-explanation ${isCorrect ? 'positive' : 'negative'}`}>
                <CheckCircle size={14} /> {question.explanation}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
