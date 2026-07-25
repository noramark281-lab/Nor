import React from 'react';
import { Sparkles, TrendingUp, Bot, Github, Compass } from 'lucide-react';

export type ActiveTab = 'meditation' | 'mexc' | 'chat' | 'github';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  return (
    <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Compass className="w-5 h-5 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <span className="text-lg font-bold bg-gradient-to-r from-white via-slate-200 to-emerald-400 bg-clip-text text-transparent">
                MindfulTrader AI
              </span>
              <span className="hidden sm:inline-block text-xs text-emerald-400/80 block font-mono">
                Guided Meditation & MEXC Event Futures
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center space-x-1 sm:space-x-2 rtl:space-x-reverse overflow-x-auto py-2">
            <button
              id="nav-tab-meditation"
              onClick={() => setActiveTab('meditation')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'meditation'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Guided Meditation</span>
            </button>

            <button
              id="nav-tab-mexc"
              onClick={() => setActiveTab('mexc')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'mexc'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>MEXC Event Futures</span>
            </button>

            <button
              id="nav-tab-chat"
              onClick={() => setActiveTab('chat')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'chat'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Bot className="w-4 h-4 text-cyan-400" />
              <span>Gemini Assistant</span>
            </button>

            <button
              id="nav-tab-github"
              onClick={() => setActiveTab('github')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'github'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Github className="w-4 h-4 text-purple-400" />
              <span>GitHub Android Hub</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};
