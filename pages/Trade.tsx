import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useData, COIN_MAPPING } from '../contexts/DataContext';
import { Card, Button, Input, Modal, Badge } from '../components/UI';
import clsx from 'clsx';
import { ArrowLeft, Star, TrendingUp, Wallet } from 'lucide-react';
import { MarketData } from '../types';

export const Trade = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const symbol = searchParams.get('symbol') || 'BTC';
  const urlSide = searchParams.get('side'); // Get side from URL
  
  const { market, balance, portfolio, executeTrade, addToWatchlist, removeFromWatchlist, watchlist } = useData();
  const coinData = market[symbol];
  const currentAsset = portfolio[symbol]; // Get holdings for this symbol

  const [orderType, setOrderType] = useState<'market' | 'limit'>('market');
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [amount, setAmount] = useState('');
  const [leverage, setLeverage] = useState(1);
  const [showConfirm, setShowConfirm] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const widgetContainerRef = useRef<HTMLDivElement>(null);

  // Set initial side based on URL param
  useEffect(() => {
    if (urlSide === 'sell') {
      setSide('sell');
    } else if (urlSide === 'buy') {
      setSide('buy');
    }
  }, [urlSide]);

  // Initialize TradingView Widget
  useEffect(() => {
    if (widgetContainerRef.current) {
        widgetContainerRef.current.innerHTML = "";
        const script = document.createElement("script");
        script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
        script.type = "text/javascript";
        script.async = true;
        
        const tvSymbol = COIN_MAPPING[symbol] || `BINANCE:${symbol}USDT`;
        
        script.innerHTML = JSON.stringify({
            "autosize": true,
            "symbol": tvSymbol,
            "interval": "D",
            "timezone": "Etc/UTC",
            "theme": "dark",
            "style": "1",
            "locale": "en",
            "enable_publishing": false,
            "backgroundColor": "#101014",
            "gridColor": "rgba(255, 255, 255, 0.05)",
            "hide_top_toolbar": false,
            "hide_legend": true,
            "save_image": false,
            "calendar": false,
            "hide_volume": true,
            "support_host": "https://www.tradingview.com"
        });
        widgetContainerRef.current.appendChild(script);
    }
  }, [symbol]);

  // Generate fake order book based on current price
  const orderBook = useMemo(() => {
    if (!coinData) return { buy: [], sell: [] };
    const price = coinData.price;
    const spread = price * 0.0005; // Tight spread
    return {
      sell: Array.from({ length: 6 }).map((_, i) => ({
        price: price + spread + (i * price * 0.0002),
        qty: Math.random() * 2,
        total: 0 // calc later
      })).reverse(),
      buy: Array.from({ length: 6 }).map((_, i) => ({
        price: price - spread - (i * price * 0.0002),
        qty: Math.random() * 2,
        total: 0
      }))
    };
  }, [coinData?.price]);

  if (!coinData) return <div className="p-10 text-center">Loading Market Data...</div>;

  const handleTrade = async () => {
    const qty = parseFloat(amount) / coinData.price;
    const success = await executeTrade(symbol, side, side === 'buy' ? qty : parseFloat(amount), coinData.price, leverage); 
    if (success) {
      setAmount('');
      setLeverage(1); // Reset leverage after trade
      setShowConfirm(false);
    }
  };

  const handlePercentage = (pct: number) => {
    if (side === 'buy') {
       // Max buy amount (USD) = Balance * Leverage
       const maxUsd = balance * leverage;
       setAmount((maxUsd * (pct / 100)).toFixed(2));
    } else {
       // Max sell amount (Qty) = Current Holdings
       const maxQty = currentAsset?.qty || 0;
       setAmount((maxQty * (pct / 100)).toFixed(6));
    }
  };

  const isWatched = watchlist.includes(symbol);
  
  // Calculations for UI
  const totalValue = parseFloat(amount) || 0;
  const marginRequired = side === 'buy' ? totalValue / leverage : 0;

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="flex items-center justify-between p-4 glass sticky top-0 z-40 bg-dark-900/80 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <ArrowLeft className="cursor-pointer" onClick={() => navigate(-1)} />
          <div onClick={() => setSearchOpen(true)} className="cursor-pointer flex items-center gap-2">
            <h1 className="text-xl font-bold">{symbol}/USD</h1>
            <Badge type={coinData.change24h >= 0 ? 'success' : 'danger'}>
              {coinData.change24h > 0 ? '+' : ''}{coinData.change24h.toFixed(2)}%
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Star 
            className={clsx("cursor-pointer", isWatched ? "fill-primary text-primary" : "text-gray-400")} 
            onClick={() => isWatched ? removeFromWatchlist(symbol) : addToWatchlist(symbol)}
          />
        </div>
      </div>

      {/* TradingView Chart */}
      <div className="h-[400px] w-full mt-2 overflow-hidden border-y border-white/5 bg-dark-800" ref={widgetContainerRef}></div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
        {/* Order Book */}
        <Card className="!p-0 overflow-hidden order-2 md:order-1 h-fit">
          <div className="flex text-[10px] text-gray-500 px-3 py-2 border-b border-white/5">
            <span className="flex-1">Price</span>
            <span className="flex-1 text-right">Qty</span>
          </div>
          <div className="text-xs">
            {orderBook.sell.map((item, i) => (
              <div key={i} className="flex px-3 py-1 relative">
                <div className="absolute right-0 top-0 bottom-0 bg-danger/10" style={{ width: `${Math.random() * 50}%` }}></div>
                <span className="flex-1 text-danger z-10">{item.price.toFixed(2)}</span>
                <span className="flex-1 text-right text-gray-300 z-10">{item.qty.toFixed(4)}</span>
              </div>
            ))}
            <div className="py-2 text-center text-lg font-bold border-y border-white/5 my-1">
              ${coinData.price.toFixed(2)}
            </div>
            {orderBook.buy.map((item, i) => (
              <div key={i} className="flex px-3 py-1 relative">
                <div className="absolute right-0 top-0 bottom-0 bg-primary/10" style={{ width: `${Math.random() * 50}%` }}></div>
                <span className="flex-1 text-primary z-10">{item.price.toFixed(2)}</span>
                <span className="flex-1 text-right text-gray-300 z-10">{item.qty.toFixed(4)}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Order Form */}
        <Card className="order-1 md:order-2">
          <div className="flex gap-2 mb-4 bg-dark-900 p-1 rounded-lg">
            <button 
              className={clsx("flex-1 py-2 rounded-md text-sm font-bold transition-all", side === 'buy' ? "bg-primary text-black" : "text-gray-400 hover:text-white")}
              onClick={() => { setSide('buy'); setAmount(''); }}
            >
              Buy
            </button>
            <button 
              className={clsx("flex-1 py-2 rounded-md text-sm font-bold transition-all", side === 'sell' ? "bg-danger text-white" : "text-gray-400 hover:text-white")}
              onClick={() => { setSide('sell'); setAmount(''); }}
            >
              Sell
            </button>
          </div>

          <div className="space-y-4">
            <div className="flex gap-2 text-xs text-gray-400 mb-2">
               <button onClick={() => setOrderType('market')} className={clsx(orderType === 'market' && "text-white underline")}>Market</button>
               <button onClick={() => setOrderType('limit')} className={clsx(orderType === 'limit' && "text-white underline")}>Limit</button>
            </div>

            <div className="relative">
              <Input 
                label={side === 'buy' ? "Amount (USD)" : `Amount (${symbol})`}
                type="number" 
                placeholder="0.00" 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              {/* Available Balance Display */}
              <div className="flex justify-between items-center mt-2 text-xs">
                <span className="text-gray-400 flex items-center gap-1">
                  <Wallet size={12} /> Available
                </span>
                <span className="text-white font-medium">
                   {side === 'buy' 
                     ? `$${(balance * leverage).toFixed(2)}` 
                     : `${currentAsset?.qty?.toFixed(6) || '0.00'} ${symbol}`
                   }
                </span>
              </div>
            </div>
            
            {/* Percentage Buttons */}
            <div className="grid grid-cols-4 gap-2">
               {[25, 50, 75, 100].map(p => (
                 <button 
                   key={p}
                   onClick={() => handlePercentage(p)}
                   className="bg-dark-800 hover:bg-dark-700 text-xs py-2 rounded-lg transition-colors text-gray-300 hover:text-white"
                 >
                   {p}%
                 </button>
               ))}
            </div>
            
            {orderType === 'limit' && (
              <Input label="Limit Price" type="number" defaultValue={coinData.price} />
            )}

            {/* Leverage Slider */}
            {side === 'buy' && (
              <div className="bg-dark-900 p-3 rounded-xl border border-white/5">
                <div className="flex justify-between items-center mb-2">
                   <div className="flex items-center gap-1 text-xs text-gray-400">
                     <TrendingUp size={12} /> Leverage
                   </div>
                   <span className="text-primary font-bold">{leverage}x</span>
                </div>
                <input 
                  type="range" 
                  min="1" 
                  max="200" 
                  step="1" 
                  value={leverage} 
                  onChange={(e) => setLeverage(Number(e.target.value))} 
                  className="w-full h-1.5 bg-dark-700 rounded-lg appearance-none cursor-pointer accent-primary" 
                />
                <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                  <span>1x</span>
                  <span>50x</span>
                  <span>100x</span>
                  <span>200x</span>
                </div>
              </div>
            )}

            <div className="text-xs text-gray-400 space-y-1">
              <div className="flex justify-between">
                <span>Available Cash</span>
                <span>${balance.toFixed(2)} USD</span>
              </div>
              {side === 'buy' && (
                <>
                  <div className="flex justify-between">
                    <span>Buying Power</span>
                    <span className="text-primary">${(balance * leverage).toLocaleString()} USD</span>
                  </div>
                  {amount && (
                     <div className="flex justify-between font-semibold pt-1 border-t border-white/5 mt-1">
                        <span>Margin Required</span>
                        <span className={clsx(balance < marginRequired ? "text-danger" : "text-white")}>
                          ${marginRequired.toFixed(2)} USD
                        </span>
                     </div>
                  )}
                </>
              )}
            </div>

            <Button 
              fullWidth 
              variant={side === 'buy' ? 'primary' : 'danger'}
              onClick={() => setShowConfirm(true)}
              disabled={!amount || (side === 'buy' && balance < marginRequired)}
            >
              {side === 'buy' ? 'Buy' : 'Sell'} {symbol}
            </Button>
          </div>
        </Card>
      </div>

      {/* Confirmation Modal */}
      <Modal isOpen={showConfirm} onClose={() => setShowConfirm(false)} title="Confirm Order">
        <div className="space-y-4">
          <div className="p-4 bg-dark-900 rounded-xl text-center">
             <div className="text-sm text-gray-400">{side === 'buy' ? 'Buying' : 'Selling'}</div>
             <div className="text-2xl font-bold my-1">
               {side === 'buy' ? `$${amount}` : `${amount} ${symbol}`}
             </div>
             {side === 'buy' && leverage > 1 && (
               <Badge type="neutral">{leverage}x Leverage</Badge>
             )}
             <div className="text-xs text-gray-500 mt-2">@ Market Price</div>
          </div>
          <Button fullWidth onClick={handleTrade} variant="primary">Confirm Execution</Button>
        </div>
      </Modal>

      {/* Coin Selector Modal */}
      <Modal isOpen={searchOpen} onClose={() => setSearchOpen(false)} title="Select Asset">
        <div className="space-y-2 max-h-[60vh] overflow-y-auto">
           {(Object.values(market) as MarketData[]).map(c => (
             <div key={c.symbol} onClick={() => { navigate(`?symbol=${c.symbol}`); setSearchOpen(false); }} className="flex justify-between p-3 hover:bg-white/5 rounded-lg cursor-pointer">
               <span className="font-bold">{c.symbol}</span>
               <span>${c.price.toFixed(2)}</span>
             </div>
           ))}
        </div>
      </Modal>
    </div>
  );
};