import { BarChart3, Battery, GraduationCap, Play, ShieldCheck } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

interface Props {
  onStartTraining: () => void;
  onOpenSandbox: () => void;
}

export default function StartScreen({ onStartTraining, onOpenSandbox }: Props) {
  return (
    <main className="start-screen">
      <section className="start-hero">
        <div className="start-title">
          <Battery size={34} className="logo-icon" />
          <div>
            <h1>BESS Trading Simulator</h1>
            <p>Learn GB battery trading from first principles through guided missions, market scenarios, and post-trade review.</p>
          </div>
        </div>
        <div className="start-actions">
          <button className="btn btn-submit btn-buy" onClick={onStartTraining}>
            <GraduationCap size={17} /> Start Training
          </button>
          <button className="btn" onClick={onOpenSandbox}>
            <Play size={17} /> Open Sandbox
          </button>
          <ThemeToggle />
        </div>
      </section>

      <section className="start-path">
        <div className="start-card">
          <GraduationCap size={18} />
          <h2>Recommended Path</h2>
          <ol>
            <li>Arbitrage: price, battery, charge, discharge.</li>
            <li>Day-Ahead: build a 48-period schedule.</li>
            <li>Intraday: revise the plan as information changes.</li>
            <li>Imbalance: compare DA, SIP, and NIV outturn.</li>
            <li>Revenue Stack: BM and flexibility context.</li>
          </ol>
        </div>
        <div className="start-card">
          <BarChart3 size={18} />
          <h2>What You Practise</h2>
          <p>Settlement periods, MW vs MWh, SoC, price spreads, forecast error, position risk, and post-trade analysis.</p>
        </div>
        <div className="start-card">
          <ShieldCheck size={18} />
          <h2>Public Demo</h2>
          <p>This is an educational simulator. It uses simplified market mechanics, public Elexon data where available, and synthetic fallback data.</p>
        </div>
      </section>
    </main>
  );
}

