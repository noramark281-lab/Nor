import React, { useState } from 'react';
import {
  Bot,
  Play,
  Pause,
  Sliders,
  Clock,
  TrendingUp,
  Cpu,
  Zap,
  ShieldAlert,
  CheckCircle2,
  RefreshCw,
  PlusCircle,
  Activity,
  Award
} from 'lucide-react';
import { BotStrategyConfig, BotLog, Language } from '../types';

interface CloudBotManagerProps {
  bots: BotStrategyConfig[];
  logs: BotLog[];
  lang: Language;
  onToggleBot: (botId: string, enabled: boolean) => Promise<void>;
  onUpdateBotConfig: (bot: BotStrategyConfig) => Promise<void>;
}

export const CloudBotManager: React.FC<CloudBotManagerProps> = ({
  bots,
  logs,
  lang,
  onToggleBot,
  onUpdateBotConfig,
}) => {
  const isAr = lang === 'ar';
  const [selectedBotForEdit, setSelectedBotForEdit] = useState<BotStrategyConfig | null>(null);

  const totalBotsRunning = bots.filter(b => b.enabled).length;
  const totalProfitUsdt = bots.reduce((sum, b) => sum + b.profitUsdt, 0);
  const totalTradesCount = bots.reduce((sum, b) => sum + b.totalTrades, 0);
  const totalWinTrades = bots.reduce((sum, b) => sum + b.winningTrades, 0);
  const winRate = totalTradesCount > 0 ? ((totalWinTrades / totalTradesCount) * 100).toFixed(1) : '100.0';

  return (
    <div className="space-y-6">
      
      {/* 24/7 Cloud Status Overview Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 rounded-2xl border border-slate-800 p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 rtl:right-auto rtl:left-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-slate-950 shadow-lg shadow-emerald-500/20 shrink-0">
              <Bot className="w-8 h-8 stroke-[2]" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-slate-100">
                  {isAr ? 'محرك التداول السحابي الآلي 24/7' : '24/7 Cloud Automated Bot Engine'}
                </h2>
                <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  {isAr ? 'السحابة نشطة' : 'Cloud Server Active'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-xl">
                {isAr
                  ? 'يعمل هذا المحرك بشكل مستمر على السحابة على مدار الساعة للتداول النيابي التلقائي في العقود الآجلة لمنصة MEXC وفقًا لقواعد التحكم بالخطر والاستراتيجية المحددة.'
                  : 'Runs 24/7 on the cloud to auto-execute futures trades on your MEXC account based on technical signals and grid rules.'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center w-full md:w-auto bg-slate-950/80 p-4 rounded-xl border border-slate-800 font-mono">
            <div>
              <div className="text-[11px] text-slate-400 uppercase">{isAr ? 'الأرباح الكلية' : 'Total Profit'}</div>
              <div className="text-lg font-extrabold text-emerald-400">+${totalProfitUsdt.toFixed(2)}</div>
            </div>
            <div className="border-x border-slate-800 px-3">
              <div className="text-[11px] text-slate-400 uppercase">{isAr ? 'معدل النجاح' : 'Win Rate'}</div>
              <div className="text-lg font-extrabold text-cyan-400">{winRate}%</div>
            </div>
            <div>
              <div className="text-[11px] text-slate-400 uppercase">{isAr ? 'البوتات النشطة' : 'Running'}</div>
              <div className="text-lg font-extrabold text-slate-100">{totalBotsRunning} / {bots.length}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Bot Strategy Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {bots.map(bot => {
          const isRunning = bot.enabled && bot.status === 'RUNNING';

          return (
            <div
              key={bot.id}
              className={`bg-slate-900 rounded-xl border p-5 space-y-4 transition-all relative overflow-hidden ${
                isRunning
                  ? 'border-emerald-500/50 shadow-lg shadow-emerald-950/20'
                  : 'border-slate-800 opacity-90'
              }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-lg ${
                    bot.type === 'GRID' ? 'bg-cyan-500/10 text-cyan-400' :
                    bot.type === 'AI_TREND' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                  }`}>
                    {bot.type === 'GRID' ? <Sliders className="w-5 h-5" /> :
                     bot.type === 'AI_TREND' ? <Cpu className="w-5 h-5" /> : <TrendingUp className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-100 text-sm">{bot.name}</h3>
                    <span className="text-xs font-mono text-emerald-400">{bot.symbol.replace('_', '/')} Perpetual</span>
                  </div>
                </div>

                {/* Status Toggle Switch */}
                <button
                  onClick={() => onToggleBot(bot.id, !bot.enabled)}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all shadow-md ${
                    isRunning
                      ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/40'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/40'
                  }`}
                >
                  {isRunning ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                  <span>{isRunning ? (isAr ? 'إيقاف 24h' : 'Pause') : (isAr ? 'تشغيل 24h' : 'Start 24/7')}</span>
                </button>
              </div>

              {/* Bot Strategy Details */}
              <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-slate-950 p-3 rounded-lg border border-slate-800/80">
                <div>
                  <span className="text-slate-400 text-[10px]">{isAr ? 'الرافعة المالية' : 'Leverage'}:</span>
                  <div className="font-bold text-slate-200">{bot.leverage}x</div>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px]">{isAr ? 'الهامش المخصص' : 'Allocated'}:</span>
                  <div className="font-bold text-slate-200">${bot.allocatedMargin} USDT</div>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px]">{isAr ? 'هدف جني الربح' : 'Take Profit'}:</span>
                  <div className="font-bold text-emerald-400">+{bot.takeProfitPercent}%</div>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px]">{isAr ? 'وقف الخسارة' : 'Stop Loss'}:</span>
                  <div className="font-bold text-rose-400">-{bot.stopLossPercent}%</div>
                </div>
              </div>

              {/* Strategy Parameters specifics */}
              {bot.type === 'GRID' && (
                <div className="text-[11px] font-mono text-slate-400 bg-slate-950/50 p-2.5 rounded border border-slate-800 flex justify-between">
                  <span>{isAr ? 'نطاق السعر' : 'Grid Range'}:</span>
                  <span className="text-slate-200 font-bold">${bot.lowerPrice} - ${bot.upperPrice}</span>
                </div>
              )}

              {/* Bot Execution Performance */}
              <div className="flex items-center justify-between text-xs font-mono pt-2 border-t border-slate-800">
                <div className="text-slate-400">
                  {isAr ? 'إجمالي الصفقات' : 'Trades'}: <strong className="text-slate-200">{bot.totalTrades}</strong>
                </div>
                <div className="text-emerald-400 font-extrabold">
                  +${bot.profitUsdt.toFixed(2)} USDT
                </div>
              </div>

              <button
                onClick={() => setSelectedBotForEdit(bot)}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>{isAr ? 'تعديل معايير البوت' : 'Edit Bot Config'}</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Edit Config Modal */}
      {selectedBotForEdit && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-emerald-400" />
              <span>{isAr ? 'تعديل إعدادات البوت السحابي' : 'Edit Cloud Bot Config'}</span>
            </h3>

            <div className="space-y-3 text-xs font-mono">
              <div>
                <label className="block text-slate-400 mb-1">{isAr ? 'اسم الاستراتيجية' : 'Bot Name'}</label>
                <input
                  type="text"
                  value={selectedBotForEdit.name}
                  onChange={e => setSelectedBotForEdit({ ...selectedBotForEdit, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">{isAr ? 'الرافعة (Leverage)' : 'Leverage'}</label>
                  <input
                    type="number"
                    value={selectedBotForEdit.leverage}
                    onChange={e => setSelectedBotForEdit({ ...selectedBotForEdit, leverage: parseInt(e.target.value, 10) || 1 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">{isAr ? 'الهامش (USDT)' : 'Margin'}</label>
                  <input
                    type="number"
                    value={selectedBotForEdit.allocatedMargin}
                    onChange={e => setSelectedBotForEdit({ ...selectedBotForEdit, allocatedMargin: parseFloat(e.target.value) || 100 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-emerald-400 mb-1">{isAr ? 'ربح مستهدف (TP %)' : 'Take Profit %'}</label>
                  <input
                    type="number"
                    step="0.1"
                    value={selectedBotForEdit.takeProfitPercent}
                    onChange={e => setSelectedBotForEdit({ ...selectedBotForEdit, takeProfitPercent: parseFloat(e.target.value) || 1 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-rose-400 mb-1">{isAr ? 'وقف خسارة (SL %)' : 'Stop Loss %'}</label>
                  <input
                    type="number"
                    step="0.1"
                    value={selectedBotForEdit.stopLossPercent}
                    onChange={e => setSelectedBotForEdit({ ...selectedBotForEdit, stopLossPercent: parseFloat(e.target.value) || 1 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedBotForEdit(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={async () => {
                  await onUpdateBotConfig(selectedBotForEdit);
                  setSelectedBotForEdit(null);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold"
              >
                {isAr ? 'حفظ التغييرات' : 'Save Config'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Real-time Cloud Logs Stream */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-5 space-y-3">
        <h3 className="font-bold text-slate-100 text-sm flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            <span>{isAr ? 'سجل عمليات البوت المباشرة للسحابة 24h' : '24/7 Cloud Execution Live Log'}</span>
          </span>
          <span className="text-xs font-mono text-slate-400">
            {logs.length} {isAr ? 'حدث' : 'events'}
          </span>
        </h3>

        <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 h-64 overflow-y-auto space-y-2 font-mono text-xs no-scrollbar">
          {logs.map(log => (
            <div key={log.id} className="flex items-start gap-3 p-2 rounded hover:bg-slate-900/60 transition-colors">
              <span className="text-slate-500 text-[11px] shrink-0 pt-0.5">
                {new Date(log.timestamp).toLocaleTimeString()}
              </span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                log.level === 'SUCCESS' ? 'bg-emerald-500/20 text-emerald-400' :
                log.level === 'WARN' ? 'bg-amber-500/20 text-amber-400' : 'bg-cyan-500/20 text-cyan-400'
              }`}>
                {log.level}
              </span>
              <div className="text-slate-200">
                <span className="text-emerald-400 font-bold mr-2 rtl:ml-2">[{log.strategyName}]</span>
                <span>{log.message}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
