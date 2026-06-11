'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/auth-store';
import { getMyReferralCode, getReferralStats, type ReferralStats } from '@/services/referral.service';

export default function ReferralPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user) { router.replace('/login'); return; }
    getReferralStats()
      .then(setStats)
      .catch(() => {
        // if no stats yet, get just the code
        getMyReferralCode().then((c) => setStats({ ...c, referrals: [] })).catch(console.error);
      })
      .finally(() => setLoading(false));
  }, [user, router]);

  const handleCopy = async () => {
    if (!stats) return;
    const link = `${window.location.origin}/register?ref=${stats.code}`;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success('Referral link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (!stats) return;
    const link = `${window.location.origin}/register?ref=${stats.code}`;
    if (navigator.share) {
      await navigator.share({
        title: 'Join Desent Club',
        text: `Use my referral code ${stats.code} and get bonus loyalty points on your first order!`,
        url: link,
      });
    } else {
      handleCopy();
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-black border-t-transparent" />
      </div>
    );
  }

  return (
    <section className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Refer & Earn</h1>
          <p className="mt-1 text-sm text-slate-500">
            Share your referral code and both of you get bonus loyalty points
          </p>
        </div>

        {/* Code card */}
        {stats && (
          <div className="rounded-2xl bg-black p-6 text-white shadow-lg">
            <p className="text-sm text-slate-400">Your Referral Code</p>
            <p className="mt-2 font-mono text-4xl font-bold tracking-widest">{stats.code}</p>
            <p className="mt-1 text-sm text-slate-400">Used {stats.timesUsed} time{stats.timesUsed !== 1 ? 's' : ''}</p>

            <div className="mt-5 flex gap-3">
              <button
                onClick={handleCopy}
                className="flex-1 rounded-lg border border-white/30 py-2 text-sm font-medium transition hover:bg-white/10"
              >
                {copied ? '✓ Copied!' : '📋 Copy Link'}
              </button>
              <button
                onClick={handleShare}
                className="flex-1 rounded-lg bg-white py-2 text-sm font-medium text-black transition hover:bg-slate-100"
              >
                🚀 Share
              </button>
            </div>
          </div>
        )}

        {/* How it works */}
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-900">How Referrals Work</h2>
          <ol className="mt-3 space-y-2 text-sm text-slate-600">
            <li>1️⃣ Share your unique referral link or code with friends</li>
            <li>2️⃣ Friend registers using your link</li>
            <li>3️⃣ They place their first order</li>
            <li>4️⃣ You both get <strong>100 loyalty points</strong> instantly!</li>
          </ol>
        </div>

        {/* Referred friends */}
        {stats && stats.referrals.length > 0 && (
          <div className="rounded-xl border border-slate-200 bg-white">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="text-sm font-semibold text-slate-900">
                Friends Referred ({stats.referrals.length})
              </h2>
            </div>
            <ul className="divide-y divide-slate-100">
              {stats.referrals.map((ref) => (
                <li key={ref.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{ref.referredUser.name}</p>
                    <p className="text-xs text-slate-400">
                      Joined {new Date(ref.referredUser.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <span className={`text-xs font-semibold ${ref.rewardGiven ? 'text-green-600' : 'text-amber-500'}`}>
                    {ref.rewardGiven ? '✓ Rewarded' : 'Pending order'}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {stats && stats.referrals.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white px-5 py-10 text-center">
            <p className="text-2xl">👥</p>
            <p className="mt-2 text-sm font-medium text-slate-700">No referrals yet</p>
            <p className="text-xs text-slate-400">Share your code to start earning!</p>
          </div>
        )}
      </div>
    </section>
  );
}
