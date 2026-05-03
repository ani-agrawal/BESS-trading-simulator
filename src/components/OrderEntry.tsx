import { useState } from 'react';
import { OrderSide, OrderType } from '../engine/types';
import { Info } from 'lucide-react';

interface Props {
  currentPrice: number;
  cash: number;
  onPlaceOrder: (side: OrderSide, type: OrderType, volume: number, priceLimit: number | null) => void;
}

export default function OrderEntry({ currentPrice, cash, onPlaceOrder }: Props) {
  const [side, setSide] = useState<OrderSide>(OrderSide.BUY);
  const [orderType, setOrderType] = useState<OrderType>(OrderType.MARKET);
  const [volume, setVolume] = useState('10');
  const [limitPrice, setLimitPrice] = useState('');
  const [showTooltip, setShowTooltip] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const vol = parseFloat(volume);
    if (isNaN(vol) || vol <= 0) return;

    let limit: number | null = null;
    if (orderType === OrderType.LIMIT) {
      limit = parseFloat(limitPrice);
      if (isNaN(limit) || limit <= 0) return;
    }

    onPlaceOrder(side, orderType, vol, limit);
    setVolume('10');
    setLimitPrice('');
  };

  const estimatedCost = parseFloat(volume) * currentPrice;

  return (
    <div className="panel order-entry">
      <div className="panel-header">
        <h3>Place Order</h3>
        <span className="panel-subtitle">Spot Market</span>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="order-side-toggle">
          <button
            type="button"
            className={`btn-side ${side === OrderSide.BUY ? 'buy active' : 'buy'}`}
            onClick={() => setSide(OrderSide.BUY)}
          >
            BUY
          </button>
          <button
            type="button"
            className={`btn-side ${side === OrderSide.SELL ? 'sell active' : 'sell'}`}
            onClick={() => setSide(OrderSide.SELL)}
          >
            SELL
          </button>
        </div>

        <div className="form-group">
          <label>
            Order Type
            <button
              type="button"
              className="info-btn"
              onMouseEnter={() => setShowTooltip('orderType')}
              onMouseLeave={() => setShowTooltip(null)}
            >
              <Info size={14} />
            </button>
          </label>
          {showTooltip === 'orderType' && (
            <div className="edu-tooltip">
              <strong>Market Order:</strong> Executes immediately at current price (+ small slippage).<br />
              <strong>Limit Order:</strong> Only fills at your price or better. May not execute.
            </div>
          )}
          <div className="order-type-toggle">
            <button
              type="button"
              className={`btn-type ${orderType === OrderType.MARKET ? 'active' : ''}`}
              onClick={() => setOrderType(OrderType.MARKET)}
            >
              Market
            </button>
            <button
              type="button"
              className={`btn-type ${orderType === OrderType.LIMIT ? 'active' : ''}`}
              onClick={() => setOrderType(OrderType.LIMIT)}
            >
              Limit
            </button>
          </div>
        </div>

        <div className="form-group">
          <label>
            Volume (MW)
            <button
              type="button"
              className="info-btn"
              onMouseEnter={() => setShowTooltip('volume')}
              onMouseLeave={() => setShowTooltip(null)}
            >
              <Info size={14} />
            </button>
          </label>
          {showTooltip === 'volume' && (
            <div className="edu-tooltip">
              How much power to trade. 1 MW for 1 hour = 1 MWh of energy. Typical trades range from 1-100 MW.
            </div>
          )}
          <input
            type="number"
            value={volume}
            onChange={e => setVolume(e.target.value)}
            min="1"
            max="100"
            step="1"
            className="input"
          />
        </div>

        {orderType === OrderType.LIMIT && (
          <div className="form-group">
            <label>
              Limit Price (€/MWh)
              <button
                type="button"
                className="info-btn"
                onMouseEnter={() => setShowTooltip('limit')}
                onMouseLeave={() => setShowTooltip(null)}
              >
                <Info size={14} />
              </button>
            </label>
            {showTooltip === 'limit' && (
              <div className="edu-tooltip">
                {side === OrderSide.BUY
                  ? 'Maximum price you\'ll pay. Order fills only when market price drops to this level or below.'
                  : 'Minimum price you\'ll accept. Order fills only when market price rises to this level or above.'}
              </div>
            )}
            <input
              type="number"
              value={limitPrice}
              onChange={e => setLimitPrice(e.target.value)}
              step="0.5"
              placeholder={`Current: €${currentPrice.toFixed(2)}`}
              className="input"
            />
          </div>
        )}

        <div className="order-summary">
          <div className="summary-row">
            <span>Est. Cost:</span>
            <span className={side === OrderSide.BUY ? 'negative' : 'positive'}>
              {side === OrderSide.BUY ? '-' : '+'}€{isNaN(estimatedCost) ? '0.00' : estimatedCost.toFixed(2)}
            </span>
          </div>
          <div className="summary-row">
            <span>Available:</span>
            <span>€{cash.toFixed(2)}</span>
          </div>
        </div>

        <button
          type="submit"
          className={`btn btn-submit ${side === OrderSide.BUY ? 'btn-buy' : 'btn-sell'}`}
          disabled={parseFloat(volume) <= 0 || isNaN(parseFloat(volume))}
        >
          {side === OrderSide.BUY ? 'BUY' : 'SELL'} {volume} MW @ {orderType === OrderType.MARKET ? 'Market' : `€${limitPrice || '...'}`}
        </button>
      </form>
    </div>
  );
}
