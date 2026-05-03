import { TrendingUpDown } from 'lucide-react';
import type { GameState } from '../engine/types';
import { getForecastReview } from '../engine/forecastReview';

interface Props {
  state: GameState;
}

export default function ForecastReview({ state }: Props) {
  const review = getForecastReview(state);
  return (
    <div className="panel forecast-review">
      <div className="panel-header">
        <h3><TrendingUpDown size={15} /> Forecast Review</h3>
      </div>
      <div className="forecast-verdict">{review.verdict}</div>
      <div className="forecast-metrics">
        <div><span>MAE</span><strong>£{review.mae.toFixed(2)}</strong></div>
        <div><span>Bias</span><strong>{review.bias >= 0 ? '+' : ''}£{review.bias.toFixed(2)}</strong></div>
        <div><span>Big miss</span><strong>{review.biggestMissPeriod === null ? '-' : `SP${review.biggestMissPeriod + 1}`}</strong></div>
      </div>
      <ul className="forecast-lessons">
        {review.lessons.map(lesson => <li key={lesson}>{lesson}</li>)}
      </ul>
    </div>
  );
}
