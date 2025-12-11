import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { ref, onValue, set, push, update, get } from 'firebase/database';
import { db } from '../services/firebase';
import { useAuth } from './AuthContext';
import { MarketData, Asset, Trade, Notification } from '../types';

interface DataContextType {
  market: Record<string, MarketData>;
  portfolio: Record<string, Asset>;
  balance: number;
  accountType: 'demo' | 'live';
  trades: Trade[];
  notifications: Notification[];
  watchlist: string[];
  executeTrade: (symbol: string, type: 'buy' | 'sell', qty: number, price: number, leverage?: number) => Promise<boolean>;
  addToWatchlist: (symbol: string) => void;
  removeFromWatchlist: (symbol: string) => void;
  depositToLive: (amount: number) => Promise<void>;
  toggleAccountType: () => void;
  loadingData: boolean;
}

const DataContext = createContext<DataContextType>({
  market: {},
  portfolio: {},
  balance: 0,
  accountType: 'demo',
  trades: [],
  notifications: [],
  watchlist: [],
  executeTrade: async () => false,
  addToWatchlist: () => {},
  removeFromWatchlist: () => {},
  depositToLive: async () => {},
  toggleAccountType: () => {},
  loadingData: true,
});

export const useData = () => useContext(DataContext);

const FINNHUB_KEY = 'd4scif1r01qvsjbgubg0d4scif1r01qvsjbgubgg';

// Mapping local symbols to Finnhub symbols
export const COIN_MAPPING: Record<string, string> = {
  'BTC': 'BINANCE:BTCUSDT',
  'ETH': 'BINANCE:ETHUSDT',
  'SOL': 'BINANCE:SOLUSDT',
  'BNB': 'BINANCE:BNBUSDT',
  'XRP': 'BINANCE:XRPUSDT',
  'ADA': 'BINANCE:ADAUSDT',
  'DOGE': 'BINANCE:DOGEUSDT',
  'DOT': 'BINANCE:DOTUSDT',
};

const SYMBOL_TO_ID: Record<string, string> = Object.entries(COIN_MAPPING).reduce((acc, [key, val]) => ({...acc, [val]: key}), {});

const NAMES: Record<string, string> = {
  'BTC': 'Bitcoin',
  'ETH': 'Ethereum',
  'SOL': 'Solana',
  'BNB': 'Binance Coin',
  'XRP': 'Ripple',
  'ADA': 'Cardano',
  'DOGE': 'Dogecoin',
  'DOT': 'Polkadot',
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile } = useAuth();
  const [market, setMarket] = useState<Record<string, MarketData>>({});
  const [portfolio, setPortfolio] = useState<Record<string, Asset>>({});
  
  const [balances, setBalances] = useState({ demo: 0, live: 0 });
  const [accountType, setAccountType] = useState<'demo' | 'live'>('demo');
  
  const [trades, setTrades] = useState<Trade[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [watchlist, setWatchlist] = useState<string[]>(['BTC', 'ETH', 'SOL']);
  const [loadingData, setLoadingData] = useState(true);
  const socketRef = useRef<WebSocket | null>(null);

  // Initialize Market Data
  useEffect(() => {
    const initializeMarket = async () => {
      const initialMarket: Record<string, MarketData> = {};
      const promises = Object.keys(COIN_MAPPING).map(async (symbol) => {
        const finnhubSymbol = COIN_MAPPING[symbol];
        try {
          const res = await fetch(`https://finnhub.io/api/v1/quote?symbol=${finnhubSymbol}&token=${FINNHUB_KEY}`);
          const data = await res.json();
          const history = Array.from({ length: 20 }).map((_, i) => ({
             time: Date.now() - (20 - i) * 60000,
             price: data.c * (1 + (Math.random() - 0.5) * 0.01)
          }));
          history.push({ time: Date.now(), price: data.c });

          initialMarket[symbol] = {
            symbol,
            name: NAMES[symbol],
            price: data.c || 0,
            change24h: data.dp || 0,
            volume: Math.random() * 100000000,
            high24h: data.h || data.c,
            low24h: data.l || data.c,
            history
          };
        } catch (error) {
          initialMarket[symbol] = {
            symbol, name: NAMES[symbol], price: 0, change24h: 0, volume: 0, high24h: 0, low24h: 0, history: []
          };
        }
      });

      await Promise.all(promises);
      setMarket(initialMarket);
      setLoadingData(false);

      const socket = new WebSocket(`wss://ws.finnhub.io?token=${FINNHUB_KEY}`);
      socketRef.current = socket;

      socket.addEventListener('open', () => {
        Object.values(COIN_MAPPING).forEach(sym => {
          socket.send(JSON.stringify({ type: 'subscribe', symbol: sym }));
        });
      });

      socket.addEventListener('message', (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === 'trade' && message.data) {
            setMarket(prev => {
              const updated = { ...prev };
              message.data.forEach((trade: any) => {
                const localSymbol = SYMBOL_TO_ID[trade.s];
                if (localSymbol && updated[localSymbol]) {
                  const currentCoin = updated[localSymbol];
                  const newPrice = trade.p;
                  const newHistory = [...currentCoin.history, { time: trade.t, price: newPrice }];
                  if (newHistory.length > 50) newHistory.shift();
                  
                  updated[localSymbol] = {
                    ...currentCoin,
                    price: newPrice,
                    history: newHistory,
                    high24h: Math.max(currentCoin.high24h, newPrice),
                    low24h: Math.min(currentCoin.low24h, newPrice)
                  };
                }
              });
              return updated;
            });
          }
        } catch (e) {
          console.error(e);
        }
      });
    };

    initializeMarket();
    return () => {
      if (socketRef.current) socketRef.current.close();
    };
  }, []);

  // Listen to User Data
  useEffect(() => {
    if (!user) {
      setPortfolio({});
      setBalances({ demo: 0, live: 0 });
      setTrades([]);
      return;
    }

    const balanceRef = ref(db, `portfolio/${user.uid}/balance`);
    const assetsRef = ref(db, `portfolio/${user.uid}/assets/${accountType}`);
    const tradesRef = ref(db, `trades/${user.uid}`);
    const notifRef = ref(db, `notifications/${user.uid}`);
    const watchlistRef = ref(db, `users/${user.uid}/watchlist`);

    const unsubBalance = onValue(balanceRef, (snap) => {
        const val = snap.val();
        if (val) {
            if (typeof val.usd === 'number') {
                setBalances({ demo: val.usd, live: 0 });
            } else {
                setBalances({ demo: val.demo || 0, live: val.live || 0 });
            }
        } else {
            setBalances({ demo: 0, live: 0 });
        }
    });

    const unsubAssets = onValue(assetsRef, (snap) => setPortfolio(snap.val() || {}));
    
    const unsubTrades = onValue(tradesRef, (snap) => {
      const data = snap.val();
      if (data) setTrades(Object.values(data));
    });

    const unsubNotif = onValue(notifRef, (snap) => {
      const data = snap.val();
      if (data) setNotifications(Object.values(data));
    });

    const unsubWatchlist = onValue(watchlistRef, (snap) => {
        const data = snap.val();
        if (data) setWatchlist(data);
    })

    return () => {
      unsubBalance();
      unsubAssets();
      unsubTrades();
      unsubNotif();
      unsubWatchlist();
    };
  }, [user, accountType]);

  const toggleAccountType = () => {
      setAccountType(prev => prev === 'demo' ? 'live' : 'demo');
  };

  const executeTrade = async (symbol: string, type: 'buy' | 'sell', qty: number, price: number, leverage: number = 1): Promise<boolean> => {
    if (!user) return false;

    // Check Expiry for Demo
    if (accountType === 'demo' && profile?.demoExpiresAt) {
        if (Date.now() > profile.demoExpiresAt) {
            alert("Your 3-Day Demo Trial has expired. Please deposit funds to trade Live.");
            return false;
        }
    }

    const currentBalance = balances[accountType];
    const totalValue = qty * price;

    if (type === 'buy') {
      const marginRequired = totalValue / leverage;
      
      if (currentBalance < marginRequired) {
        alert(`Insufficient Margin. Required: $${marginRequired.toFixed(2)}`);
        return false;
      }
      
      const currentAsset = portfolio[symbol] || { symbol, qty: 0, avgPrice: 0, borrowed: 0 };
      const newQty = currentAsset.qty + qty;
      const borrowedAmount = totalValue - marginRequired;
      const totalBorrowed = (currentAsset.borrowed || 0) + borrowedAmount;
      
      // Calculate new weighted average price
      const currentTotalCost = currentAsset.qty * currentAsset.avgPrice;
      const newAvgPrice = (currentTotalCost + totalValue) / newQty;

      const updates: Record<string, any> = {};
      updates[`portfolio/${user.uid}/balance/${accountType}`] = currentBalance - marginRequired;
      updates[`portfolio/${user.uid}/assets/${accountType}/${symbol}`] = { 
        symbol, 
        qty: newQty, 
        avgPrice: newAvgPrice,
        borrowed: totalBorrowed 
      };
      
      const tradeId = push(ref(db, `trades/${user.uid}`)).key;
      updates[`trades/${user.uid}/${tradeId}`] = {
        id: tradeId, type, symbol, amount: totalValue, qty, price, timestamp: Date.now(), status: 'executed', account: accountType, leverage
      };

      const notifId = push(ref(db, `notifications/${user.uid}`)).key;
      updates[`notifications/${user.uid}/${notifId}`] = {
        id: notifId, type: 'order', title: 'Order Executed', 
        message: `Bought ${qty.toFixed(4)} ${symbol} (${leverage}x Lev)`, read: false, timestamp: Date.now()
      };

      await update(ref(db), updates);
      return true;
    } 
    else {
      // SELL Logic
      const currentAsset = portfolio[symbol];
      if (!currentAsset || currentAsset.qty < qty) {
        alert("Insufficient Holdings");
        return false;
      }

      const fraction = qty / currentAsset.qty;
      const borrowedToRepay = (currentAsset.borrowed || 0) * fraction;
      
      const proceeds = totalValue; // qty * price
      const netProceeds = proceeds - borrowedToRepay;
      
      const newQty = currentAsset.qty - qty;
      const newBorrowed = (currentAsset.borrowed || 0) - borrowedToRepay;

      const updates: Record<string, any> = {};
      
      updates[`portfolio/${user.uid}/balance/${accountType}`] = currentBalance + netProceeds;
      
      if (newQty <= 0.000001) { // Floating point tolerance
        updates[`portfolio/${user.uid}/assets/${accountType}/${symbol}`] = null;
      } else {
        updates[`portfolio/${user.uid}/assets/${accountType}/${symbol}`] = { 
          ...currentAsset, 
          qty: newQty,
          borrowed: newBorrowed 
        };
      }

      const tradeId = push(ref(db, `trades/${user.uid}`)).key;
      updates[`trades/${user.uid}/${tradeId}`] = {
        id: tradeId, type, symbol, amount: totalValue, qty, price, timestamp: Date.now(), status: 'executed', account: accountType
      };

      const notifId = push(ref(db, `notifications/${user.uid}`)).key;
      updates[`notifications/${user.uid}/${notifId}`] = {
        id: notifId, type: 'order', title: 'Order Executed', 
        message: `Sold ${qty.toFixed(4)} ${symbol}`, read: false, timestamp: Date.now()
      };

      await update(ref(db), updates);
      return true;
    }
  };

  const depositToLive = async (amount: number) => {
      if(!user) return;
      const newBal = balances.live + amount;
      await set(ref(db, `portfolio/${user.uid}/balance/live`), newBal);
      
      const notifId = push(ref(db, `notifications/${user.uid}`)).key;
      const updates: Record<string, any> = {};
      updates[`notifications/${user.uid}/${notifId}`] = {
        id: notifId, type: 'system', title: 'Deposit Successful', message: `Added $${amount.toFixed(2)} to Live Account`, read: false, timestamp: Date.now()
      };
      await update(ref(db), updates);
  }

  const addToWatchlist = (symbol: string) => {
    if (!user || watchlist.includes(symbol)) return;
    const newList = [...watchlist, symbol];
    set(ref(db, `users/${user.uid}/watchlist`), newList);
  };

  const removeFromWatchlist = (symbol: string) => {
    if (!user) return;
    const newList = watchlist.filter(s => s !== symbol);
    set(ref(db, `users/${user.uid}/watchlist`), newList);
  };

  return (
    <DataContext.Provider value={{ 
      market, portfolio, balance: balances[accountType], accountType, trades, notifications, watchlist, 
      executeTrade, addToWatchlist, removeFromWatchlist, depositToLive, toggleAccountType, loadingData 
    }}>
      {children}
    </DataContext.Provider>
  );
};