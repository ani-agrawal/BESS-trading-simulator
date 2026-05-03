import type { GameState } from './types';

export interface SettlementRow {
  period: number;
  timeLabel: string;
  daMwh: number;
  idMwh: number;
  contractedMwh: number;
  physicalMwh: number;
  imbalanceMwh: number;
  daCashflow: number;
  idCashflow: number;
  imbalanceCashflow: number;
  totalCashflow: number;
  sipPrice: number | null;
  status: 'settled' | 'delivered' | 'scheduled' | 'open';
}

export interface PositionBookSummary {
  rows: SettlementRow[];
  totalContractedMwh: number;
  totalPhysicalMwh: number;
  totalImbalanceMwh: number;
  totalDaCashflow: number;
  totalIdCashflow: number;
  totalImbalanceCashflow: number;
  totalCashflow: number;
}

const SP_HOURS = 0.5;

function periodLabel(period: number): string {
  return `${String(Math.floor(period / 2)).padStart(2, '0')}:${period % 2 === 0 ? '00' : '30'}`;
}

export function buildPositionBook(state: GameState): PositionBookSummary {
  const rows: SettlementRow[] = Array.from({ length: 48 }, (_, period) => {
    const positions = state.dayAhead.playerSchedule.filter(position => position.period === period);
    const daPositions = positions.filter(position => position.market === 'da');
    const idPositions = positions.filter(position => position.market === 'id');
    const deliveredPositions = positions.filter(position => position.delivered);

    const signedMwh = (action: 'charge' | 'discharge', mw: number) => (
      action === 'discharge' ? mw * SP_HOURS : -mw * SP_HOURS
    );
    const cashflow = (action: 'charge' | 'discharge', mw: number, price: number) => (
      action === 'discharge' ? mw * SP_HOURS * price : -mw * SP_HOURS * price
    );

    const daMwh = daPositions.reduce((sum, position) => sum + signedMwh(position.action, position.mw), 0);
    const idMwh = idPositions.reduce((sum, position) => sum + signedMwh(position.action, position.mw), 0);
    const contractedMwh = daMwh + idMwh;
    const physicalMwh = deliveredPositions.reduce((sum, position) => sum + signedMwh(position.action, position.mw), 0);
    const imbalanceMwh = physicalMwh - contractedMwh;
    const daCashflow = daPositions.reduce((sum, position) => sum + cashflow(position.action, position.mw, position.price), 0);
    const idCashflow = idPositions.reduce((sum, position) => sum + cashflow(position.action, position.mw, position.price), 0);
    const sipPrice = period < state.dayAhead.revealedPeriods ? state.dayAhead.sipOutturn[period] : null;
    const imbalanceCashflow = sipPrice === null ? 0 : imbalanceMwh * sipPrice;
    const totalCashflow = daCashflow + idCashflow + imbalanceCashflow;
    const hasSchedule = positions.length > 0;
    const hasDelivery = deliveredPositions.length > 0;
    const status: SettlementRow['status'] = sipPrice !== null
      ? 'settled'
      : hasDelivery
        ? 'delivered'
        : hasSchedule
          ? 'scheduled'
          : 'open';

    return {
      period,
      timeLabel: periodLabel(period),
      daMwh,
      idMwh,
      contractedMwh,
      physicalMwh,
      imbalanceMwh,
      daCashflow,
      idCashflow,
      imbalanceCashflow,
      totalCashflow,
      sipPrice,
      status,
    };
  });

  const sum = (selector: (row: SettlementRow) => number) => rows.reduce((total, row) => total + selector(row), 0);

  return {
    rows,
    totalContractedMwh: sum(row => row.contractedMwh),
    totalPhysicalMwh: sum(row => row.physicalMwh),
    totalImbalanceMwh: sum(row => row.imbalanceMwh),
    totalDaCashflow: sum(row => row.daCashflow),
    totalIdCashflow: sum(row => row.idCashflow),
    totalImbalanceCashflow: sum(row => row.imbalanceCashflow),
    totalCashflow: sum(row => row.totalCashflow),
  };
}
