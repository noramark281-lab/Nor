import React, { useState } from 'react';
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Copy,
  Check,
  QrCode,
  ShieldAlert,
  Coins,
  DollarSign,
  AlertCircle,
  ExternalLink,
  History,
  CheckCircle2,
  Lock
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { DepositAddress, WithdrawalRequest } from '../types';

interface WalletTransferProps {
  spotBalance: number;
  futuresBalance: number;
  onTransfer: (from: 'SPOT' | 'FUTURES', to: 'SPOT' | 'FUTURES', amount: number) => void;
  onWithdraw: (req: Omit<WithdrawalRequest, 'id' | 'timestamp' | 'status' | 'txId'>) => void;
  withdrawals: WithdrawalRequest[];
}

const DEPOSIT_ADDRESSES: Record<string, DepositAddress[]> = {
  USDT: [
    {
      coin: 'USDT',
      network: 'TRC20',
      address: 'TYj8h7v9n2kLpQm4xZrw1s3cEv8bYt6NoP',
      minDeposit: 1.0,
      confirmationBlocks: 1
    },
    {
      coin: 'USDT',
      network: 'BEP20',
      address: '0x71C56893c5634Da2a5F34E84B066929944dAc3eB',
      minDeposit: 1.0,
      confirmationBlocks: 15
    },
    {
      coin: 'USDT',
      network: 'ERC20',
      address: '0x3289052b61D980962804bCa2668535F6423985D0',
      minDeposit: 10.0,
      confirmationBlocks: 12
    }
  ],
  BTC: [
    {
      coin: 'BTC',
      network: 'BITCOIN',
      address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
      minDeposit: 0.0001,
      confirmationBlocks: 2
    }
  ]
};

export const WalletTransfer3D: React.FC<WalletTransferProps> = ({
  spotBalance,
  futuresBalance,
  onTransfer,
  onWithdraw,
  withdrawals
}) => {
  const [activeAction, setActiveAction] = useState<'DEPOSIT' | 'WITHDRAW' | 'TRANSFER'>('TRANSFER');
  const [selectedCoin, setSelectedCoin] = useState<'USDT' | 'BTC'>('USDT');
  const [selectedNetwork, setSelectedNetwork] = useState<string>('TRC20');
  const [copied, setCopied] = useState(false);

  // Transfer State
  const [transferFrom, setTransferFrom] = useState<'SPOT' | 'FUTURES'>('SPOT');
  const [transferAmount, setTransferAmount] = useState<number>(10.0);

  // Withdraw State
  const [withdrawAddress, setWithdrawAddress] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState<number>(5.0);
  const [withdrawNetwork, setWithdrawNetwork] = useState('TRC20');

  const currentDepositAddress = (DEPOSIT_ADDRESSES[selectedCoin] || []).find(
    (d) => d.network === selectedNetwork
  ) || DEPOSIT_ADDRESSES[selectedCoin]?.[0];

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExecuteTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    const sourceBalance = transferFrom === 'SPOT' ? spotBalance : futuresBalance;
    if (transferAmount <= 0 || transferAmount > sourceBalance) {
      alert('المبلغ المطلوب للتحويل الداخلي غير صالح أو يتجاوز الرصيد المتوفر.');
      return;
    }
    const target = transferFrom === 'SPOT' ? 'FUTURES' : 'SPOT';
    onTransfer(transferFrom, target, transferAmount);
    confetti({ particleCount: 30, spread: 50, origin: { y: 0.7 } });
  };

  const handleExecuteWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    if (!withdrawAddress || withdrawAddress.length < 15) {
      alert('يرجى إدخال عنوان محفظة صحيح ومعتمد لسحب الرصيد.');
      return;
    }
    if (withdrawAmount <= 0 || withdrawAmount > spotBalance) {
      alert('رصيد المحفظة الفورية غير كافٍ لتنفيذ عملية السحب.');
      return;
    }
    const fee = withdrawNetwork === 'TRC20' ? 1.0 : withdrawNetwork === 'BEP20' ? 0.8 : 4.5;
    onWithdraw({
      coin: 'USDT',
      network: withdrawNetwork,
      targetAddress: withdrawAddress,
      amount: withdrawAmount,
      fee: fee
    });
    setWithdrawAddress('');
    confetti({ particleCount: 45, spread: 60, origin: { y: 0.7 } });
  };

  return (
    <div className="space-y-6 dir-rtl" dir="rtl">
      {/* 3D Holographic Wallet Cards Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Net Balance Card */}
        <div className="glass-panel-glow-cyan rounded-3xl p-6 relative overflow-hidden tilt-card shadow-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-cyan-300 font-mono">إجمالي المحفظة الشامل</span>
            <Wallet className="w-5 h-5 text-cyan-400" />
          </div>
          <div className="mt-4">
            <div className="text-3xl font-black font-mono text-white tracking-tight">
              ${(spotBalance + futuresBalance).toFixed(2)}
            </div>
            <p className="text-[11px] text-cyan-200/70 mt-1 font-mono">
              Spot: ${spotBalance.toFixed(2)} | Futures: ${futuresBalance.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Spot Wallet 3D Card */}
        <div className="glass-panel-glow-emerald rounded-3xl p-6 relative overflow-hidden tilt-card shadow-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-300 font-mono">محفظة التداول الفوري (Spot)</span>
            <Coins className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="mt-4">
            <div className="text-3xl font-black font-mono text-emerald-400 tracking-tight">
              ${spotBalance.toFixed(2)} <span className="text-xs text-white/60">USDT</span>
            </div>
            <p className="text-[11px] text-emerald-200/70 mt-1">متاح للتداول الفوري والشراء/البيع المباشر</p>
          </div>
        </div>

        {/* Futures Wallet 3D Card */}
        <div className="glass-panel-glow-amber rounded-3xl p-6 relative overflow-hidden tilt-card shadow-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-300 font-mono">محفظة العقود الآجلة (Futures)</span>
            <DollarSign className="w-5 h-5 text-amber-400" />
          </div>
          <div className="mt-4">
            <div className="text-3xl font-black font-mono text-yellow-400 tracking-tight">
              ${futuresBalance.toFixed(2)} <span className="text-xs text-white/60">USDT</span>
            </div>
            <p className="text-[11px] text-amber-200/70 mt-1">متاح لصفقات الأحداث والمضاعفات بـ 1$</p>
          </div>
        </div>
      </div>

      {/* Main Operations Terminal */}
      <div className="glass-panel rounded-3xl p-6 border border-gray-800 shadow-2xl space-y-6">
        {/* Navigation Selector */}
        <div className="flex items-center justify-between border-b border-gray-800 pb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveAction('TRANSFER')}
              className={`px-5 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeAction === 'TRANSFER'
                  ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20'
                  : 'bg-gray-900 text-gray-400 hover:text-white'
              }`}
            >
              <ArrowLeftRight className="w-4 h-4" />
              التحويل الداخلي السريع (Spot ⇋ Futures)
            </button>

            <button
              onClick={() => setActiveAction('DEPOSIT')}
              className={`px-5 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeAction === 'DEPOSIT'
                  ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'
                  : 'bg-gray-900 text-gray-400 hover:text-white'
              }`}
            >
              <ArrowDownLeft className="w-4 h-4" />
              إيداع حقيقي في المحفظة (Deposit)
            </button>

            <button
              onClick={() => setActiveAction('WITHDRAW')}
              className={`px-5 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeAction === 'WITHDRAW'
                  ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                  : 'bg-gray-900 text-gray-400 hover:text-white'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              سحب الأرباح إلى محفظتك الخارجية (Withdraw)
            </button>
          </div>
        </div>

        {/* 1. Internal Instant Transfer View */}
        {activeAction === 'TRANSFER' && (
          <form onSubmit={handleExecuteTransfer} className="max-w-xl mx-auto space-y-5">
            <div className="text-center space-y-1">
              <h3 className="text-base font-black text-white">التحويل الفوري بين المحفظة الفورية ومحفظة العقود</h3>
              <p className="text-xs text-gray-400">تحويل فوري بدون رسوم (0% Fee) لتغذية صفقات التداول أو سحب الأرباح</p>
            </div>

            <div className="bg-gray-950 p-4 rounded-2xl border border-gray-800 space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 space-y-1">
                  <label className="text-[11px] text-gray-400">من محفظة:</label>
                  <div className="p-3 bg-gray-900 rounded-xl border border-gray-800 text-white font-bold text-xs">
                    {transferFrom === 'SPOT' ? 'المحفظة الفورية (Spot Wallet)' : 'محفظة العقود (Futures Wallet)'}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setTransferFrom(transferFrom === 'SPOT' ? 'FUTURES' : 'SPOT')}
                  className="mt-5 p-3 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30 transition-all"
                >
                  <ArrowLeftRight className="w-4 h-4" />
                </button>

                <div className="flex-1 space-y-1">
                  <label className="text-[11px] text-gray-400">إلى محفظة:</label>
                  <div className="p-3 bg-gray-900 rounded-xl border border-gray-800 text-white font-bold text-xs">
                    {transferFrom === 'SPOT' ? 'محفظة العقود (Futures Wallet)' : 'المحفظة الفورية (Spot Wallet)'}
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs text-gray-400">
                  <span>المبلغ المراد تحويله (USDT):</span>
                  <span className="font-mono text-cyan-400">
                    الحد الأقصى المتاح: ${(transferFrom === 'SPOT' ? spotBalance : futuresBalance).toFixed(2)}
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(Number(e.target.value))}
                    step="1"
                    min="1"
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    type="button"
                    onClick={() => setTransferAmount(transferFrom === 'SPOT' ? spotBalance : futuresBalance)}
                    className="absolute left-2.5 top-2 px-2.5 py-1 text-[11px] font-bold bg-cyan-500/20 text-cyan-400 rounded-lg border border-cyan-500/30"
                  >
                    الكل MAX
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full tilt-card py-3.5 bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 text-black font-black rounded-2xl shadow-xl shadow-cyan-500/20 transition-all active:scale-98 text-sm flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-5 h-5" />
              تأكيد التحويل الداخلي الفوري
            </button>
          </form>
        )}

        {/* 2. Real Deposit View */}
        {activeAction === 'DEPOSIT' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="text-center space-y-1">
              <h3 className="text-base font-black text-white">إيداع حقيقي في محفظتك المعتمدة</h3>
              <p className="text-xs text-gray-400">انسخ عنوان المحفظة أو امسح الـ QR Code لإيداع الرصيد وتفعيله فورياً</p>
            </div>

            {/* Network Selector */}
            <div className="flex gap-2 justify-center">
              {['TRC20', 'BEP20', 'ERC20'].map((net) => (
                <button
                  key={net}
                  onClick={() => setSelectedNetwork(net)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                    selectedNetwork === net
                      ? 'bg-emerald-500 text-black border-emerald-400 shadow-lg shadow-emerald-500/20'
                      : 'bg-gray-900 text-gray-400 border-gray-800 hover:border-gray-700'
                  }`}
                >
                  شبكة {net} {net === 'TRC20' && '(الأسرع والأقل عمولة)'}
                </button>
              ))}
            </div>

            {/* Address Display & QR Code */}
            {currentDepositAddress && (
              <div className="bg-gray-950 p-6 rounded-2xl border border-gray-800 flex flex-col md:flex-row items-center gap-6">
                {/* Visual QR Code Generator Frame */}
                <div className="w-36 h-36 bg-white p-2 rounded-2xl flex flex-col items-center justify-center shadow-lg border-2 border-emerald-500/50">
                  <div className="w-full h-full bg-slate-900 rounded-xl flex flex-col items-center justify-center text-emerald-400 p-2 text-center">
                    <QrCode className="w-16 h-16 stroke-[1.5]" />
                    <span className="text-[9px] font-mono text-gray-300 mt-1">{currentDepositAddress.network}</span>
                  </div>
                </div>

                {/* Details */}
                <div className="flex-1 space-y-3 w-full">
                  <div className="space-y-1">
                    <label className="text-[11px] text-gray-400">عنوان الإيداع المخصص ({currentDepositAddress.network}):</label>
                    <div className="flex items-center gap-2 bg-gray-900 border border-gray-800 p-3 rounded-xl">
                      <input
                        type="text"
                        readOnly
                        value={currentDepositAddress.address}
                        className="bg-transparent text-white font-mono text-xs w-full focus:outline-none"
                      />
                      <button
                        onClick={() => handleCopy(currentDepositAddress.address)}
                        className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-all"
                      >
                        {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs font-mono text-gray-400">
                    <div className="bg-gray-900/60 p-2 rounded-lg">
                      <span>الحد الأدنى للإيداع: </span>
                      <span className="text-white font-bold">{currentDepositAddress.minDeposit} USDT</span>
                    </div>
                    <div className="bg-gray-900/60 p-2 rounded-lg">
                      <span>تأكيدات الشبكة: </span>
                      <span className="text-white font-bold">{currentDepositAddress.confirmationBlocks} Blocks</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 3. Real Withdrawal View */}
        {activeAction === 'WITHDRAW' && (
          <form onSubmit={handleExecuteWithdraw} className="max-w-xl mx-auto space-y-5">
            <div className="text-center space-y-1">
              <h3 className="text-base font-black text-white">سحب رصيد حقيقي إلى عنوانك الخارجي</h3>
              <p className="text-xs text-gray-400">يتم إرسال التحويل مباشرة عبر شبكة البلوكشين المحددة</p>
            </div>

            <div className="bg-gray-950 p-5 rounded-2xl border border-gray-800 space-y-4">
              <div className="space-y-1">
                <label className="text-[11px] text-gray-400">الشبكة المستخدمة للسحب:</label>
                <div className="grid grid-cols-3 gap-2">
                  {['TRC20', 'BEP20', 'ERC20'].map((net) => (
                    <button
                      key={net}
                      type="button"
                      onClick={() => setWithdrawNetwork(net)}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                        withdrawNetwork === net
                          ? 'bg-amber-500 text-black border-amber-400 font-black'
                          : 'bg-gray-900 text-gray-400 border-gray-800'
                      }`}
                    >
                      {net} {net === 'TRC20' ? '(Fee 1$)' : net === 'BEP20' ? '(Fee 0.8$)' : '(Fee 4.5$)'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-gray-400">عنوان المحفظة المستقبلة:</label>
                <input
                  type="text"
                  placeholder={`أدخل عنوان محفظة ${withdrawNetwork} هنا...`}
                  value={withdrawAddress}
                  onChange={(e) => setWithdrawAddress(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-white font-mono text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs text-gray-400">
                  <span>المبلغ المراد سحبه (USDT):</span>
                  <span className="text-emerald-400 font-mono">الرصيد المتاح: ${spotBalance.toFixed(2)} USDT</span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(Number(e.target.value))}
                    min="2"
                    step="1"
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => setWithdrawAmount(spotBalance)}
                    className="absolute left-2.5 top-2 px-2.5 py-1 text-[11px] font-bold bg-amber-500/20 text-amber-400 rounded-lg border border-amber-500/30"
                  >
                    الكل MAX
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full tilt-card py-3.5 bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 text-black font-black rounded-2xl shadow-xl shadow-amber-500/20 transition-all active:scale-98 text-sm flex items-center justify-center gap-2"
            >
              <ExternalLink className="w-4 h-4 stroke-[3]" />
              تأكيد طلب السحب الفوري (Withdraw)
            </button>
          </form>
        )}
      </div>

      {/* Withdrawals Record Table */}
      {withdrawals.length > 0 && (
        <div className="glass-panel rounded-3xl p-6 border border-gray-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-gray-800 pb-3">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <History className="w-4 h-4 text-amber-400" />
              سجل طلبات السحب والمعاملات على البلوكشين
            </h3>
            <span className="text-xs text-gray-500 font-mono">العمليات: {withdrawals.length}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs font-mono">
              <thead className="bg-gray-900/60 text-gray-400 border-b border-gray-800">
                <tr>
                  <th className="p-3">رقم العملية</th>
                  <th className="p-3">الشبكة</th>
                  <th className="p-3">العنوان المستهدف</th>
                  <th className="p-3">المبلغ الصافي</th>
                  <th className="p-3">العمولة</th>
                  <th className="p-3">رمز المعاملة TXID</th>
                  <th className="p-3">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {withdrawals.map((w) => (
                  <tr key={w.id} className="hover:bg-gray-800/20">
                    <td className="p-3 text-gray-500">{w.id.slice(-8)}</td>
                    <td className="p-3 font-bold text-amber-400">{w.network}</td>
                    <td className="p-3 text-gray-300">{w.targetAddress.slice(0, 8)}...{w.targetAddress.slice(-6)}</td>
                    <td className="p-3 font-bold text-emerald-400">${(w.amount - w.fee).toFixed(2)} USDT</td>
                    <td className="p-3 text-gray-500">${w.fee.toFixed(2)}</td>
                    <td className="p-3 text-cyan-400">{w.txId.slice(0, 14)}...</td>
                    <td className="p-3">
                      <span className="text-emerald-400 flex items-center gap-1 font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" /> {w.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
