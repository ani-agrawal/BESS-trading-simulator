import { CheckCircle2 } from 'lucide-react';

const DONE = [
  'Guided beginner lessons',
  'Exam mode and scorecards',
  'DA, ID, BM, frequency-response training',
  'Risk, exposure, revenue, forecast, and benchmark review',
  'Scenario backtests and regime comparison',
  'Progress persistence and responsive grouped panels',
];

const FUTURE = [
  'Production-grade optimiser/backtester',
  'Full BM participant stack with competitor offers',
  'Live weather/interconnector overlays',
];

export default function ProductStatus() {
  return (
    <div className="panel product-status">
      <div className="panel-header">
        <h3><CheckCircle2 size={15} /> Product Status</h3>
      </div>
      <div className="product-status-cols">
        <div>
          <h4>Built</h4>
          {DONE.map(item => <span key={item}>{item}</span>)}
        </div>
        <div>
          <h4>Later</h4>
          {FUTURE.map(item => <span key={item}>{item}</span>)}
        </div>
      </div>
    </div>
  );
}
