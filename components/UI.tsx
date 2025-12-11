import React from 'react';
import clsx from 'clsx';

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'danger' | 'outline' | 'ghost', fullWidth?: boolean }> = ({ 
  children, variant = 'primary', fullWidth, className, ...props 
}) => {
  const baseStyles = "py-3 px-4 rounded-xl font-semibold transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2";
  const variants = {
    primary: "bg-primary text-black hover:bg-green-400 shadow-[0_4px_14px_0_rgba(0,200,5,0.39)]",
    danger: "bg-danger text-white hover:bg-red-500 shadow-[0_4px_14px_0_rgba(255,59,48,0.39)]",
    outline: "border border-dark-700 text-gray-300 hover:bg-dark-800",
    ghost: "bg-transparent text-gray-400 hover:text-white"
  };

  return (
    <button 
      className={clsx(baseStyles, variants[variant], fullWidth && "w-full", className)}
      {...props}
    >
      {children}
    </button>
  );
};

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label?: string, error?: string, icon?: React.ReactNode }> = ({ label, error, icon, className, ...props }) => (
  <div className="w-full">
    {label && <label className="block text-xs text-gray-400 mb-1 ml-1">{label}</label>}
    <div className="relative">
      {icon && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
          {icon}
        </div>
      )}
      <input 
        className={clsx(
          "w-full bg-dark-800 border border-dark-700 rounded-xl py-3 text-white placeholder-gray-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all",
          icon ? "pl-11 pr-4" : "px-4",
          error && "border-danger focus:border-danger focus:ring-danger",
          className
        )}
        {...props}
      />
    </div>
    {error && <p className="text-danger text-xs mt-1 ml-1">{error}</p>}
  </div>
);

export const Card: React.FC<{ children: React.ReactNode, className?: string, onClick?: () => void }> = ({ children, className, onClick }) => (
  <div onClick={onClick} className={clsx("glass rounded-2xl p-4 sm:p-5", className, onClick && "cursor-pointer active:scale-[0.98] transition-transform")}>
    {children}
  </div>
);

export const Badge: React.FC<{ children: React.ReactNode, type?: 'success' | 'danger' | 'neutral' }> = ({ children, type = 'neutral' }) => {
  const styles = {
    success: "bg-green-500/10 text-primary",
    danger: "bg-red-500/10 text-danger",
    neutral: "bg-gray-500/10 text-gray-400"
  };
  return (
    <span className={clsx("px-2 py-0.5 rounded-md text-xs font-medium", styles[type])}>
      {children}
    </span>
  );
};

export const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass w-full max-w-sm rounded-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-4 border-b border-white/5 flex justify-between items-center">
          <h3 className="font-semibold text-lg">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">&times;</button>
        </div>
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  );
};

export const Loader = () => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);