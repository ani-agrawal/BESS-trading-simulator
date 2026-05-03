import type { SpeedPreset } from '../engine/types';
import { formatDate, formatHour } from '../engine/clock';
import { Pause, Play, RotateCcw, SkipForward } from 'lucide-react';

interface Props {
  currentTime: number;
  isPaused: boolean;
  speed: SpeedPreset;
  onTogglePause: () => void;
  onSetSpeed: (s: SpeedPreset) => void;
  onStepForward: () => void;
  onReset: () => void;
}

const speedOptions: { key: SpeedPreset; label: string }[] = [
  { key: 'manual', label: 'Manual' },
  { key: 'slow', label: 'Slow' },
  { key: 'normal', label: 'Normal' },
  { key: 'fast', label: 'Fast' },
  { key: 'ultra', label: 'Ultra' },
];

export default function MarketClock({ currentTime, isPaused, speed, onTogglePause, onSetSpeed, onStepForward, onReset }: Props) {
  return (
    <div className="market-clock">
      <div className="clock-time">
        <div className="clock-date">{formatDate(currentTime)}</div>
        <div className="clock-hour">{formatHour(currentTime)}</div>
      </div>
      <div className="clock-status">
        <span className={`status-dot ${isPaused || speed === 'manual' ? 'paused' : 'running'}`} />
        <span className="status-text">
          {isPaused ? 'PAUSED' : speed === 'manual' ? 'MANUAL' : 'RUNNING'}
        </span>
      </div>
      <div className="clock-controls">
        <button className="btn btn-icon" onClick={onTogglePause} title={isPaused ? 'Resume' : 'Pause'}>
          {isPaused ? <Play size={16} /> : <Pause size={16} />}
        </button>
        <button
          className="btn btn-icon btn-step"
          onClick={onStepForward}
          title="Step forward 1 hour"
        >
          <SkipForward size={16} />
        </button>
        <div className="speed-controls">
          {speedOptions.map(s => (
            <button
              key={s.key}
              className={`btn btn-speed ${speed === s.key ? 'active' : ''}`}
              onClick={() => onSetSpeed(s.key)}
            >
              {s.label}
            </button>
          ))}
        </div>
        <button className="btn btn-icon btn-danger" onClick={onReset} title="Reset">
          <RotateCcw size={16} />
        </button>
      </div>
    </div>
  );
}
