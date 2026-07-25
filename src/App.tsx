import React, { useState } from 'react';
import { Navbar, ActiveTab } from './components/Navbar';
import { MeditationTab } from './components/MeditationTab';
import { MexcTradingTab } from './components/MexcTradingTab';
import { GeminiChatTab } from './components/GeminiChatTab';
import { GithubAndroidBuildTab } from './components/GithubAndroidBuildTab';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('meditation');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* Top Sticky Navigation */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {activeTab === 'meditation' && <MeditationTab />}
        {activeTab === 'mexc' && <MexcTradingTab />}
        {activeTab === 'chat' && <GeminiChatTab />}
        {activeTab === 'github' && <GithubAndroidBuildTab />}
      </main>

      {/* Minimal Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-6 text-center text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            MindfulTrader AI • Guided Meditation & MEXC Event Futures Platform
          </div>
          <div className="text-slate-600">
            Powered by Google Gemini 3.5 & 3.1 APIs (@google/genai)
          </div>
        </div>
      </footer>
    </div>
  );
}
