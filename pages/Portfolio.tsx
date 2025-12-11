import React from 'react';
import { useData } from '../contexts/DataContext';
import { Card, Loader } from '../components/UI';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import clsx from 'clsx';
import { useNavigate } from 'react-router-dom';
import { Asset } from '../types';

export const Portfolio = () => {
  const { portfolio, market, balance, trades } = useData();
  const navigate = useNavigate();

  const assets = (Object.values(portfolio) as Asset[]).filter(a => a.qty > 0).map(asset => {
    const currentPrice = market[asset.symbol]?.price || 0;
    const value = asset.qty * currentPrice;
    
    // Calculate PnL: Value - (Average Entry Cost for the Asset)
    // Note: Borrowed amount doesn't affect PnL directly, it affects Net Equity.
    // Cost Basis = Qty * AvgPrice.
    const costBasis = asset.qty * asset.avgPrice;
    const pl = value - costBasis;
    const plPercent = (pl / costBasis) * 100;
    
    // Net Equity in this position = Value - Debt
    const netEquity = value - (asset.borrowed || 0);

    return { ...asset, value, pl, plPercent, currentPrice, netEquity };
  }).sort((a, b) => b.value - a.value);

  const data = assets.map(a => ({ name: a.symbol, value: a.value }));
  const COLORS = ['#00C805', '#FF3B30', '#0088FE', '#FFBB28', '#FF8042', '#8884d8'];

  // Total Net Worth = Cash Balance + Sum(Asset Value - Borrowed Debt)
  const totalValue = balance + assets.reduce((acc, a) => acc + a.netEquity, 0);

  return (
    <div className="p-5 space-y-6">
      <h2 className="text-2xl font-bold">Portfolio</h2>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
         <Card className="bg-gradient-to-br from-dark-800 to-dark-900 border-l-4 border-primary">
            <p className="text-xs text-gray-400">Net Worth</p>
            <p className="text-xl font-bold mt-1">${totalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
         </Card>
         <Card className="bg-gradient-to-br from-dark-800 to-dark-900 border-l-4 border-white">
            <p className="text-xs text-gray-400">Cash Balance</p>
            <p className="text-xl font-bold mt-1">${balance.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
         </Card>
      </div>

      {/* Chart */}
      {assets.length > 0 && (
        <div className="h-64 relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#1C1C24', border: 'none', borderRadius: '8px' }}
                itemStyle={{ color: '#fff' }}
                formatter={(val: number) => `$${val.toFixed(2)}`}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
             <div className="text-center">
               <div className="text-xs text-gray-500">Holdings</div>
               <div className="font-bold text-lg">{assets.length} Assets</div>
             </div>
          </div>
        </div>
      )}

      {/* Asset List */}
      <div>
        <h3 className="font-semibold mb-3">Your Assets</h3>
        {assets.length === 0 ? (
          <div className="text-center py-10 text-gray-500">No assets yet. Start trading!</div>
        ) : (
          <div className="space-y-3">
            {assets.map(asset => (
              <Card key={asset.symbol} className="flex justify-between items-center" onClick={() => navigate(`/trade?symbol=${asset.symbol}`)}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-dark-700 flex items-center justify-center font-bold">
                    {asset.symbol[0]}
                  </div>
                  <div>
                    <div className="font-bold">{asset.symbol}</div>
                    <div className="text-xs text-gray-400">{asset.qty.toFixed(4)} {asset.symbol}</div>
                    {asset.borrowed && asset.borrowed > 0 && (
                         <span className="text-[10px] text-danger bg-danger/10 px-1 rounded">Lev</span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold">${asset.value.toFixed(2)}</div>
                  
                  {/* PnL Display */}
                  <div className={clsx("text-xs font-medium mb-1", asset.pl >= 0 ? "text-primary" : "text-danger")}>
                    {asset.pl >= 0 ? '+' : ''}{asset.pl.toFixed(2)} ({asset.plPercent.toFixed(2)}%)
                  </div>

                  {/* Sell Button */}
                  <button 
                     onClick={(e) => {
                       e.stopPropagation();
                       navigate(`/trade?symbol=${asset.symbol}&side=sell`);
                     }}
                     className="bg-danger/10 text-danger text-xs px-3 py-1 rounded-full font-bold hover:bg-danger hover:text-white transition-all border border-danger/20"
                  >
                     Sell
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Transaction History Preview */}
      <div>
        <h3 className="font-semibold mb-3">Recent Trades</h3>
        <div className="space-y-2">
           {trades.slice(0, 5).reverse().map(trade => (
             <div key={trade.id} className="flex justify-between items-center p-3 glass rounded-lg text-sm">
                <div>
                  <span className={clsx("font-bold uppercase", trade.type === 'buy' ? 'text-primary' : 'text-danger')}>
                    {trade.type}
                  </span> {trade.symbol}
                  {trade.leverage && trade.leverage > 1 && <span className="ml-1 text-[10px] bg-dark-700 px-1 rounded">{trade.leverage}x</span>}
                  <div className="text-xs text-gray-500">{new Date(trade.timestamp).toLocaleDateString()}</div>
                </div>
                <div className="text-right">
                  <div>${trade.amount.toFixed(2)}</div>
                  <div className="text-xs text-gray-500">@{trade.price.toFixed(2)}</div>
                </div>
             </div>
           ))}
        </div>
      </div>
    </div>
  );
};