import type { MarketEvent, HourlyPrice } from './types';

interface EventTemplate {
  category: MarketEvent['category'];
  headlines: string[];
  descriptions: string[];
}

const eventTemplates: EventTemplate[] = [
  {
    category: 'weather',
    headlines: [
      'Cold front moving in — heating demand expected to rise',
      'Heatwave forecast — cooling demand surging',
      'Mild temperatures expected — demand moderating',
      'Storm warning — potential grid disruptions',
    ],
    descriptions: [
      'Temperatures dropping 8°C below seasonal average. Residential heating load increasing across the region.',
      'Air conditioning demand pushing peak load higher than forecast. Grid operators monitoring reserves closely.',
      'Unseasonably mild weather reducing both heating and cooling loads. Demand well below seasonal norms.',
      'High winds may cause transmission line trips, but also boosting wind generation significantly.',
    ],
  },
  {
    category: 'outage',
    headlines: [
      'Large gas plant offline for emergency repairs',
      'Nuclear unit entering unplanned maintenance',
      'Interconnector capacity reduced due to fault',
      'Major coal unit returning from maintenance ahead of schedule',
    ],
    descriptions: [
      '800 MW gas-fired unit tripped offline unexpectedly. Repairs estimated at 48-72 hours. Supply tightening.',
      '1,200 MW nuclear unit taken offline for safety inspection. Expected return in 5-7 days.',
      'Cross-border transmission capacity reduced by 500 MW due to equipment failure. Imports curtailed.',
      'A 600 MW coal unit completed repairs early and is ramping back to full capacity. Additional supply available.',
    ],
  },
  {
    category: 'demand',
    headlines: [
      'Industrial production surge in manufacturing sector',
      'Major factory shutdown for annual maintenance',
      'Electric vehicle charging load setting new records',
      'Holiday period — commercial demand dropping',
    ],
    descriptions: [
      'Heavy industry ramping up production. Steel and aluminum smelters running at full capacity.',
      'Automotive manufacturing plants entering scheduled 2-week maintenance shutdown. Base demand falling.',
      'EV charging peaks during evening hours adding 2 GW to system demand during peak periods.',
      'Commercial and office buildings largely empty. System demand 10-15% below normal weekday levels.',
    ],
  },
  {
    category: 'renewable',
    headlines: [
      'Wind generation surging — record output expected',
      'Wind drought — turbines barely turning',
      'Solar generation exceeding forecasts',
      'Cloud cover reducing solar output significantly',
    ],
    descriptions: [
      'Sustained 25+ km/h winds across northern regions. Wind farms generating at 85% capacity. Prices likely depressed.',
      'High-pressure system bringing calm conditions. Wind generation at just 5% of installed capacity.',
      'Clear skies and optimal sun angle pushing solar output to near-record levels. Midday prices could go negative.',
      'Heavy overcast conditions slashing solar generation to 20% of expected output.',
    ],
  },
  {
    category: 'policy',
    headlines: [
      'Grid operator issues capacity warning',
      'Emergency reserves activated',
      'New carbon tax taking effect',
      'Grid operator lifts capacity alert — situation normalized',
    ],
    descriptions: [
      'Transmission system operator warns that reserve margins are thin for the evening peak. Scarcity pricing possible.',
      'Strategic reserves called upon to meet demand. Additional 2 GW of emergency capacity being dispatched.',
      'Carbon levy on fossil fuel generation increasing by £5/tonne. Gas and coal plant marginal costs rising.',
      'Grid conditions have stabilized. Reserve margins back to comfortable levels. Prices expected to moderate.',
    ],
  },
];

let eventIdCounter = 0;

function seededIndex(seed: number, max: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  return Math.floor((x - Math.floor(x)) * max);
}

export function maybeGenerateEvent(
  currentTime: number,
  currentPrice: HourlyPrice,
  tickCount: number
): MarketEvent | null {
  // ~8% chance per hour of an event
  const roll = Math.sin(tickCount * 13397 + 7919) * 0.5 + 0.5;
  if (roll > 0.08) return null;

  const templateIdx = seededIndex(tickCount * 3, eventTemplates.length);
  const template = eventTemplates[templateIdx];
  const headlineIdx = seededIndex(tickCount * 7, template.headlines.length);

  const priceImpact = currentPrice.eventImpact !== 0
    ? currentPrice.eventImpact
    : (Math.sin(tickCount * 4391) * 0.5 + 0.5) * 10 - 3;

  eventIdCounter++;

  return {
    id: `evt-${eventIdCounter}-${tickCount}`,
    timestamp: currentTime,
    headline: template.headlines[headlineIdx],
    description: template.descriptions[headlineIdx],
    priceImpact: Math.round(priceImpact * 100) / 100,
    category: template.category,
  };
}
