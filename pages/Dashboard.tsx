import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { Card, Loader, Badge, Modal, Input, Button } from '../components/UI';
import { ArrowUpRight, ArrowDownRight, Bell, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import clsx from 'clsx';
import { MarketData, Asset } from '../types';

export const Dashboard = () => {
  const { profile } = useAuth();
  const { market, balance, portfolio, loadingData, accountType, toggleAccountType, depositToLive } = useData();
  const navigate = useNavigate();
  
  const [showDeposit, setShowDeposit] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');

  if (loadingData || !profile) return <Loader />;

  // Calculate total portfolio value
  const portfolioValue = (Object.values(portfolio) as Asset[]).reduce((acc, asset) => {
    const currentPrice = market[asset.symbol]?.price || 0;
    return acc + (asset.qty * currentPrice);
  }, 0);
  
  const totalBalance = balance + portfolioValue;
  const topMovers = (Object.values(market) as MarketData[]).sort((a, b) => Math.abs(b.change24h) - Math.abs(a.change24h)).slice(0, 4);

  // Expiry Calculation
  const isDemo = accountType === 'demo';
  const timeLeft = profile.demoExpiresAt ? Math.max(0, profile.demoExpiresAt - Date.now()) : 0;
  const daysLeft = Math.ceil(timeLeft / (1000 * 60 * 60 * 24));
  const isExpired = isDemo && timeLeft === 0;

  const handleDeposit = async () => {
      const amount = parseFloat(depositAmount);
      if (amount > 0) {
          await depositToLive(amount);
          setDepositAmount('');
          setShowDeposit(false);
          alert("Funds added successfully!");
      }
  };

  return (
    <div className="p-5 space-y-6">
      {/* Header with Account Switcher */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
           <div className="bg-dark-800 p-1 rounded-full flex border border-white/5">
              <button 
                onClick={() => !isDemo && toggleAccountType()}
                className={clsx("px-4 py-1.5 rounded-full text-xs font-bold transition-all", isDemo ? "bg-primary text-black" : "text-gray-400")}
              >
                Demo
              </button>
              <button 
                onClick={() => isDemo && toggleAccountType()}
                className={clsx("px-4 py-1.5 rounded-full text-xs font-bold transition-all", !isDemo ? "bg-white text-black" : "text-gray-400")}
              >
                Live
              </button>
           </div>
        </div>
        <button onClick={() => navigate('/notifications')} className="relative p-2 glass rounded-full hover:bg-white/5">
          <Bell size={20} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-danger rounded-full"></span>
        </button>
      </div>

      {/* Demo Expiry Alert */}
      {isDemo && (
        <div className={clsx("flex items-center gap-2 text-xs py-2 px-3 rounded-lg border", isExpired ? "bg-danger/10 border-danger text-danger" : "bg-primary/10 border-primary text-primary")}>
           <Clock size={14} />
           {isExpired 
             ? "Your Demo Trial has expired. Switch to Live to trade." 
             : `Demo Account expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}.`
           }
        </div>
      )}

      {/* Balance Card */}
      <div className={clsx("relative overflow-hidden rounded-2xl bg-gradient-to-br border p-6 transition-all", isDemo ? "from-dark-800 to-black border-primary/20" : "from-blue-900/20 to-black border-blue-500/20")}>
        <div className={clsx("absolute top-0 right-0 w-32 h-32 blur-[50px] rounded-full -mr-10 -mt-10", isDemo ? "bg-primary/20" : "bg-blue-500/20")}></div>
        <p className="text-gray-400 text-sm mb-1">{isDemo ? 'Demo Balance' : 'Live Balance'}</p>
        <h1 className="text-3xl font-bold mb-4">${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h1>
        <div className="flex gap-3">
          <button 
             onClick={() => isDemo ? navigate('/portfolio') : setShowDeposit(true)} 
             className={clsx("flex-1 text-black py-2 rounded-lg text-sm font-semibold transition-colors", isDemo ? "bg-primary hover:bg-green-400" : "bg-white hover:bg-gray-200")}
          >
            {isDemo ? 'Assets' : 'Deposit Funds'}
          </button>
          {!isDemo && (
             <button className="flex-1 bg-white/10 text-white py-2 rounded-lg text-sm font-semibold hover:bg-white/20 transition-colors">
               Withdraw
             </button>
          )}
        </div>
      </div>

      {/* Market Ticker */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Top Movers</h3>
        <div className="grid grid-cols-2 gap-3">
          {topMovers.map((coin) => (
            <Card key={coin.symbol} className="!p-3" onClick={() => navigate(`/trade?symbol=${coin.symbol}`)}>
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold">
                    {coin.symbol[0]}
                  </div>
                  <span className="font-semibold text-sm">{coin.symbol}</span>
                </div>
                <Badge type={coin.change24h >= 0 ? 'success' : 'danger'}>
                  {coin.change24h >= 0 ? '+' : ''}{coin.change24h.toFixed(2)}%
                </Badge>
              </div>
              <div className="text-lg font-bold">${coin.price.toLocaleString()}</div>
            </Card>
          ))}
        </div>
      </div>

      {/* Live Market List */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Live Market</h3>
        <div className="space-y-3">
          {(Object.values(market) as MarketData[]).map((coin) => (
            <Card key={coin.symbol} className="flex items-center justify-between" onClick={() => navigate(`/trade?symbol=${coin.symbol}`)}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-dark-700 flex items-center justify-center font-bold text-gray-400">
                  {coin.symbol[0]}
                </div>
                <div>
                  <h4 className="font-bold">{coin.name}</h4>
                  <p className="text-xs text-gray-400">{coin.symbol}/USD</p>
                </div>
              </div>
              
              {/* Mini Chart */}
              <div className="h-10 w-20">
                 <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={coin.history || []}>
                      <defs>
                        <linearGradient id={`grad${coin.symbol}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={coin.change24h >= 0 ? '#00C805' : '#FF3B30'} stopOpacity={0.3}/>
                          <stop offset="95%" stopColor={coin.change24h >= 0 ? '#00C805' : '#FF3B30'} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <Area type="monotone" dataKey="price" stroke={coin.change24h >= 0 ? '#00C805' : '#FF3B30'} fill={`url(#grad${coin.symbol})`} strokeWidth={2} isAnimationActive={false} />
                    </AreaChart>
                 </ResponsiveContainer>
              </div>

              <div className="text-right">
                <div className="font-bold">${coin.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                <div className={clsx("text-xs font-medium flex items-center justify-end", coin.change24h >= 0 ? 'text-primary' : 'text-danger')}>
                  {coin.change24h >= 0 ? <ArrowUpRight size={12}/> : <ArrowDownRight size={12}/>}
                  {Math.abs(coin.change24h).toFixed(2)}%
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Deposit Modal */}
      <Modal isOpen={showDeposit} onClose={() => setShowDeposit(false)} title="Deposit Funds (Live)">
          <div className="space-y-4">
              <div className="p-4 bg-dark-900 rounded-xl text-center border border-white/5">
                 <p className="text-xs text-gray-400">Current Live Balance</p>
                 <h2 className="text-2xl font-bold mt-1">${balance.toFixed(2)}</h2>
              </div>
              <Input 
                label="Amount (USD)" 
                type="number" 
                placeholder="1000.00" 
                value={depositAmount} 
                onChange={(e) => setDepositAmount(e.target.value)}
              />
              <Button fullWidth onClick={handleDeposit} disabled={!depositAmount || parseFloat(depositAmount) <= 0}>
                  Add Funds
              </Button>
          </div>
      </Modal>
    </div>
  );
};