
import React from 'react';
import { Layout, Search, GitBranch, Zap } from 'lucide-react';
import { AppView } from '../types';

interface BottomNavProps {
  currentView: AppView;
  setView: (view: AppView) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentView, setView }) => {
  const navItems = [
    { 
      id: 'templates' as AppView, 
      icon: Layout, 
      label: 'デザインテンプレート',
      activeColor: 'bg-amber-600',
      shadowColor: 'shadow-amber-600/20'
    },
    { 
      id: 'extractor' as AppView, 
      icon: Search, 
      label: 'デザイン抽出',
      activeColor: 'bg-emerald-600',
      shadowColor: 'shadow-emerald-600/20'
    },
    { 
      id: 'architect' as AppView, 
      icon: GitBranch, 
      label: 'プロジェクト構築AI',
      activeColor: 'bg-cyan-600',
      shadowColor: 'shadow-cyan-600/20'
    },
  ];

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <nav className="bg-[#111]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-2 flex items-center gap-2 shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
        <div className="px-4 py-2 border-r border-white/5 mr-2 hidden md:flex items-center gap-2">
          <Zap size={18} className="text-white fill-white opacity-40" />
          <span className="text-sm font-black text-white/40 tracking-tighter uppercase">Forge</span>
        </div>
        
        <div className="flex gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className={`group relative flex items-center gap-3 px-5 py-3 rounded-2xl transition-all duration-500 ease-out ${
                  isActive 
                    ? `${item.activeColor} text-white shadow-lg ${item.shadowColor}` 
                    : 'text-gray-500 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                <span className={`text-xs font-black uppercase tracking-widest whitespace-nowrap overflow-hidden transition-all duration-300 ${isActive ? 'max-w-[180px] opacity-100' : 'max-w-0 opacity-0'}`}>
                  {item.label}
                </span>
                
                {!isActive && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 px-3 py-1.5 bg-gray-900 text-[10px] font-black uppercase tracking-widest text-white rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 border border-white/10 whitespace-nowrap shadow-2xl">
                    {item.label}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-gray-900" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
