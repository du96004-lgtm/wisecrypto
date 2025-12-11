export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  tradingId: string;
  avatar: string;
  kycStatus: 'pending' | 'approved' | 'rejected' | 'none';
  createdAt: number;
  demoExpiresAt?: number; // Timestamp for demo expiry
}

export interface MarketData {
  symbol: string;
  name: string;
  price: number;
  change24h: number; // Percentage
  volume: number;
  high24h: number;
  low24h: number;
  history: { time: number; price: number }[]; // For charts
}

export interface Asset {
  symbol: string;
  qty: number;
  avgPrice: number;
  borrowed?: number; // Amount borrowed in USD (for leverage)
}

export interface Trade {
  id: string;
  type: 'buy' | 'sell';
  symbol: string;
  amount: number; // Total value in USD
  qty: number;
  price: number;
  timestamp: number;
  status: 'executed' | 'pending';
  leverage?: number;
}

export interface Notification {
  id: string;
  type: 'order' | 'alert' | 'kyc' | 'system';
  title: string;
  message: string;
  read: boolean;
  timestamp: number;
}

export interface OrderBookItem {
  price: number;
  qty: number;
  total: number;
}

export interface OrderBook {
  buy: OrderBookItem[];
  sell: OrderBookItem[];
}