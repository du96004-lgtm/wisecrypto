import React from 'react';
import { useData } from '../contexts/DataContext';
import { Card, Badge } from '../components/UI';
import { useNavigate } from 'react-router-dom';
import { Trash2 } from 'lucide-react';

export const Watchlist = () => {
  const { watchlist, market, removeFromWatchlist } = useData();
  const navigate = useNavigate();

  return (
    <div className="p-5">
      <h2 className="text-2xl font-bold mb-6">Watchlist</h2>
      
      {watchlist.length === 0 ? (
        <div className="text-center text-gray-500 mt-20">
          Your watchlist is empty. Go to Trade to add coins.
        </div>
      ) : (
        <div className="space-y-3">
          {watchlist.map(symbol => {
            const coin = market[symbol];
            if (!coin) return null;
            
            return (
              <div key={symbol} className="relative group">
                <Card className="flex items-center justify-between relative z-10" onClick={() => navigate(`/trade?symbol=${symbol}`)}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-dark-700 flex items-center justify-center font-bold text-gray-400">
                      {symbol[0]}
                    </div>
                    <div>
                      <h4 className="font-bold">{coin.name}</h4>
                      <p className="text-xs text-gray-400">{symbol}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">${coin.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                    <Badge type={coin.change24h >= 0 ? 'success' : 'danger'}>
                      {coin.change24h >= 0 ? '+' : ''}{coin.change24h.toFixed(2)}%
                    </Badge>
                  </div>
                </Card>
                <button 
                  onClick={(e) => { e.stopPropagation(); removeFromWatchlist(symbol); }}
                  className="absolute right-[-10px] top-0 bottom-0 w-16 bg-danger flex items-center justify-center rounded-r-2xl z-0 group-hover:right-0 transition-all opacity-0 group-hover:opacity-100"
                >
                  <Trash2 color="white" size={20} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};