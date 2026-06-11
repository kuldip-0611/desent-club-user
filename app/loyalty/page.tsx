'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { getLoyaltyAccount, getLoyaltyRules, type LoyaltyAccount, type LoyaltyRules } from '@/services/loyalty.service';

const TX_COLORS: Record<string, string> = {
  EARNED: 'text-green-600',
  REDEEMED: 'text-red-500',
  EXPIRED: 'text-slate-400',
  BONUS: 'text-blue-600',
  REFERRAL: 'text-purple-600',
  ADJUSTED: 'text-orange-500',
};

const TX_ICONS: Record<string, string> = {
  EARNED: '🏆',
  REDEEMED: '🛍️',
  EXPIRED: '⏰',
  BONUS: '🎁',
  REFERRAL: '👥',
  ADJUSTED: '⚙️',
};

export default function LoyaltyPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [account, setAccount] = useState<LoyaltyAccount | null>(null);
  const [rules, setRules] = useState<LoyaltyRules | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { router.replace('/login'); return; }
    Promise.all([getLoyaltyAccount(), getLoyaltyRules()])
      .then(([acc, r]) => { setAccount(acc); setRules(r); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-black border-t-transparent" />
      </div>
    );
  }

  if (!account) return null;

  const rupeeValue = rules ? (account.balance * rules.rupeePerPoint).toFixed(2) : '0';

  return (
    <section className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Loyalty Points</h1>
          <p className="mt-1 text-sm text-slate-500">Earn points on every order and redeem for discounts</p>
        </div>

        {/* Balance card */}
        <div className="rounded-2xl bg-black p-6 text-white shadow-lg">
          <p className="text-sm text-slate-400">Available Balance</p>
          <p className="mt-1 text-5xl font-bold">{account.balance.toLocaleString()}</p>
          <p className="mt-1 text-sm text-slate-300">pts ≈ ₹{rupeeValue}</p>

          <div className="mt-4 grid grid-cols-2 gap-4 border-t border-white/20 pt-4">
            <div>
              <p className="text-xs text-slate-400">Total Earned</p>
              <p className="text-lg font-semibold">{account.totalEarned.toLocaleString()} pts</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Total Redeemed</p>
              <p className="text-lg font-semibold">{account.totalRedeemed.toLocaleString()} pts</p>
            </div>
          </div>
        </div>

        {/* How it works */}
        {rules && (
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-slate-900">How it works</h2>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li>🏆 Earn <strong>{rules.pointsPerRupee} point</strong> per ₹1 spent</li>
              <li>🛍️ Redeem <strong>1 point = ₹{rules.rupeePerPoint}</strong> off your order</li>
              <li>⚡ Min. <strong>{rules.minRedeemPoints} points</strong> required to redeem</li>
              <li>📉 Max redemption: <strong>{rules.maxRedeemPercent}%</strong> of order value</li>
              <li>👥 Refer friends & earn <strong>{rules.referralBonus} bonus points</strong></li>
            </ul>
          </div>
        )}

        {/* Transaction history */}
        <div className="rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-slate-900">Transaction History</h2>
          </div>
          {account.transactions.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-slate-400">
              No transactions yet. Place your first order to earn points!
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {account.transactions.map((tx) => (
                <li key={tx.id} className="flex items-center justify-between px-5 py-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{TX_ICONS[tx.type] ?? '●'}</span>
                    <div>
                      <p className="text-sm font-medium text-slate-800">{tx.description}</p>
                      <p className="text-xs text-slate-400">
                        {new Date(tx.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <span className={`text-sm font-semibold ${TX_COLORS[tx.type] ?? 'text-slate-700'}`}>
                    {['EARNED', 'BONUS', 'REFERRAL', 'ADJUSTED'].includes(tx.type) ? '+' : '-'}{tx.points} pts
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
