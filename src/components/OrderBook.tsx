import type { Order } from '../engine/types';
import { OrderStatus, OrderSide } from '../engine/types';

interface Props {
  orders: Order[];
}

export default function OrderBook({ orders }: Props) {
  const activeOrders = orders.filter(o => o.status === OrderStatus.PENDING);
  const filledOrders = orders.filter(o => o.status === OrderStatus.FILLED).slice(-5).reverse();

  return (
    <div className="panel order-book">
      <div className="panel-header">
        <h3>Orders</h3>
        <span className="panel-subtitle">{activeOrders.length} active</span>
      </div>

      {activeOrders.length > 0 && (
        <div className="orders-section">
          <h4>Pending</h4>
          <table className="data-table">
            <thead>
              <tr>
                <th>Side</th>
                <th>Type</th>
                <th>Vol</th>
                <th>Limit</th>
              </tr>
            </thead>
            <tbody>
              {activeOrders.map(o => (
                <tr key={o.id}>
                  <td className={o.side === OrderSide.BUY ? 'buy-text' : 'sell-text'}>
                    {o.side.toUpperCase()}
                  </td>
                  <td>{o.orderType}</td>
                  <td>{o.volumeMw} MW</td>
                  <td>{o.priceLimit ? `€${o.priceLimit.toFixed(2)}` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {filledOrders.length > 0 && (
        <div className="orders-section">
          <h4>Recently Filled</h4>
          <table className="data-table">
            <thead>
              <tr>
                <th>Side</th>
                <th>Vol</th>
                <th>Price</th>
              </tr>
            </thead>
            <tbody>
              {filledOrders.map(o => (
                <tr key={o.id}>
                  <td className={o.side === OrderSide.BUY ? 'buy-text' : 'sell-text'}>
                    {o.side.toUpperCase()}
                  </td>
                  <td>{o.filledVolume} MW</td>
                  <td>€{o.filledPrice?.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeOrders.length === 0 && filledOrders.length === 0 && (
        <div className="empty-state">No orders yet.</div>
      )}
    </div>
  );
}
