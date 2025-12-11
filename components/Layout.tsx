import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, Wallet, ArrowRightLeft, Star, Settings } from 'lucide-react';
import clsx from 'clsx';

const BottomNav = () => {
  const navItems = [
    { icon: LayoutDashboard, label: 'Home', path: '/dashboard' },
    { icon: Star, label: 'Watchlist', path: '/watchlist' },
    { icon: Wallet, label: 'Portfolio', path: '/portfolio' },
    { icon: ArrowRightLeft, label: 'Trade', path: '/trade' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 glass border-t border-dark-700 pb-safe z-50 h-16 sm:h-20">
      <div className="flex justify-around items-center h-full max-w-md mx-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              clsx(
                "flex flex-col items-center justify-center w-full h-full transition-all duration-200",
                isActive ? "text-primary" : "text-gray-400 hover:text-gray-200"
              )
            }
          >
            <item.icon size={20} strokeWidth={2.5} />
            <span className="text-[10px] mt-1 font-medium">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </div>
  );
};

export const Layout = () => {
  const location = useLocation();
  const isAuthPage = location.pathname === '/' || location.pathname === '/login' || location.pathname === '/signup';

  return (
    <div className="min-h-screen bg-dark-900 text-white font-sans flex flex-col relative overflow-hidden">
      {/* Decorative gradients */}
      <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />

      <main className={clsx("flex-1 overflow-y-auto no-scrollbar", !isAuthPage && "pb-24")}>
        <Outlet />
      </main>

      {!isAuthPage && <BottomNav />}
    </div>
  );
};