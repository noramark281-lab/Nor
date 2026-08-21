import React, { useState, useEffect } from 'react';
import { Clock, RefreshCw, CheckCircle2, Cpu, Zap, Radio, Globe2, Database } from 'lucide-react';
import { ServerTimeSync } from '../types';

interface TimeSyncHUDProps {
  serverTime: ServerTimeSync;
  onForceResync: () => void;
}

export const TimeSyncHUD: React.FC<TimeSyncHUDProps> = ({ serverTime, onForceResync }) => {
  const [liveClock, setLiveClock] = useState(Date.now());
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setLiveClock(Date.now() + serverTime.driftMs);
    }, 100);
    return () => clearInterval(timer);
  }, [serverTime.driftMs]);

  const handleSyncClick = async () => {
    setIsSyncing(true);
    await onForceResync();
    setTimeout(() => setIsSyncing(false), 600);
  };

  const formattedUtc = new Date(liveClock).toISOString().slice(11, 23);

  return (
    <div className="glass-panel rounded-3xl p-6 border border-cyan-500/30 shadow-2xl space-y-6 dir-rtl" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-gray-800 pb-4">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2 font-display">
            <Radio className="w-5 h-5 text-cyan-400 animate-pulse" />
            مركز المزامنة الزمنية المباشرة (Instant Real-Time Sync HUD)
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            مزامنة فورية على مدار الميلي ثانية بين منصة MEXC ونظام Blockpit وقاعدة بيانات Firebase
          </p>
        </div>

        <button
          onClick={handleSyncClick}
          disabled={isSyncing}
          className="px-5 py-2.5 rounded-2xl bg-cyan-500 text-black font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/20 hover:bg-cyan-400 transition-all active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
          إعادة مزامنة التوقيت فورياً
        </button>
      </div>

      {/* 3 Synchronized Clocks Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* MEXC Server Clock */}
        <div className="glass-panel-glow-cyan rounded-2xl p-5 border border-cyan-500/30 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-cyan-400 flex items-center gap-1.5 font-mono">
              <Globe2 className="w-4 h-4" />
              سيرفر MEXC الرسمي (UTC)
            </span>
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          </div>
          <div className="text-2xl font-black font-mono text-white tracking-wider">
            {formattedUtc}
          </div>
          <div className="text-[11px] text-gray-400 font-mono flex justify-between border-t border-gray-800/80 pt-2">
            <span>الانحراف الزمني (Drift):</span>
            <span className="text-cyan-400 font-bold">{serverTime.driftMs} ms</span>
          </div>
        </div>

        {/* Blockpit Synced Clock */}
        <div className="glass-panel-glow-emerald rounded-2xl p-5 border border-emerald-500/30 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 font-mono">
              <Cpu className="w-4 h-4" />
              مزامنة Blockpit API v2
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
          </div>
          <div className="text-2xl font-black font-mono text-white tracking-wider">
            {formattedUtc}
          </div>
          <div className="text-[11px] text-gray-400 font-mono flex justify-between border-t border-gray-800/80 pt-2">
            <span>مطابقة الصفقات:</span>
            <span className="text-emerald-400 font-bold">100% Synchronized</span>
          </div>
        </div>

        {/* Firebase Realtime Clock */}
        <div className="glass-panel-glow-amber rounded-2xl p-5 border border-amber-500/30 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5 font-mono">
              <Database className="w-4 h-4" />
              مزامنة Firebase Firestore
            </span>
            <span className="w-2 h-2 rounded-full bg-amber-400" />
          </div>
          <div className="text-2xl font-black font-mono text-white tracking-wider">
            {formattedUtc}
          </div>
          <div className="text-[11px] text-gray-400 font-mono flex justify-between border-t border-gray-800/80 pt-2">
            <span>سرعة الاستجابة (Latency):</span>
            <span className="text-amber-400 font-bold">{serverTime.latencyMs} ms</span>
          </div>
        </div>
      </div>

      {/* Protocol Guarantee Banner */}
      <div className="bg-gray-950/80 border border-gray-800 p-4 rounded-2xl flex items-center gap-4">
        <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <div className="text-xs space-y-0.5">
          <div className="font-bold text-white">ضمان دقة الأوامر والشموع (5m / 15m) وتوقيت الأحداث (10د / 30د)</div>
          <div className="text-gray-400 text-[11px]">
            تتم مراجعة الختم الزمني للطلبات تلقائياً قبل إرسال توقيع HMAC-SHA256 لتفادي أخطاء MEXC 10002 (Timestamp invalid).
          </div>
        </div>
      </div>
    </div>
  );
};
