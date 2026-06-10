'use client';

import { useAuth } from '@/contexts/auth-context';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { AlertIcon, AnnounceIcon, BackIcon, BankIcon, LogoutIcon, OrderIcon, SettingsIcon, ShieldIcon, StarIcon, WalletIcon } from '@/components/icons';

interface Article { id: string; title: string; }

export default function ProfilePage() {
  const { user, logout, refreshUser } = useAuth();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loggingOut, setLoggingOut] = useState(false);

  // Refresh user data (especially balance) when page is shown
  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
      logout();
      window.location.href = '/';
    } catch {
      setLoggingOut(false);
    }
  };

  useEffect(() => {
    fetch('/api/articles?limit=3')
      .then(res => res.json())
      .then(data => { if (data.articles) setArticles(data.articles); })
      .catch(() => {});
  }, []);

  if (!user) return null;

  return (
    <div className="p-4 md:p-6">
      {/* User info header */}
      <div className="flex items-center gap-4 mb-6 pb-4 border-b border-gray-100">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#1890FF] to-[#7B61FF] flex items-center justify-center shadow-md shadow-blue-500/20">
          <span className="text-2xl text-white font-bold">{user.username.charAt(0).toUpperCase()}</span>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-gray-800">{user.username}</span>
            {user.verifyStatus === "verified" ? (
              <span className="flex items-center gap-1 text-xs bg-gradient-to-r from-blue-50 to-cyan-50 text-[#1890FF] px-2 py-0.5 rounded-full border border-blue-100">
                <StarIcon className="w-3 h-3" />
                已认证
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs bg-orange-50 text-orange-500 px-2 py-0.5 rounded-full border border-orange-100">
                <AlertIcon className="w-3 h-3" />
                未认证
              </span>
            )}
          </div>
          <p className="text-sm text-gray-400 mt-1">真实姓名：{user.realName}</p>
        </div>
        <button
          onClick={handleLogout}
          className="ml-auto flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-gray-500 hover:text-red-500 hover:bg-red-50 transition-colors"
        >
          <LogoutIcon className="w-4 h-4" />
          退出
        </button>
      </div>

      {/* Balance card */}
      <div className="bg-gradient-to-r from-[#1890FF] to-[#7B61FF] rounded-2xl p-5 md:p-6 text-white mb-6 shadow-lg shadow-blue-500/20 relative overflow-hidden">
        <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/10" />
        <div className="absolute -right-4 bottom-0 w-20 h-20 rounded-full bg-white/5" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <WalletIcon className="w-5 h-5 text-white/70" />
              <span className="text-sm opacity-80">账户余额</span>
            </div>
            <div className="flex items-center gap-1 text-white/60 text-xs">
              <ShieldIcon className="w-3.5 h-3.5" />
              信用分 {user.creditScore ?? 500}
            </div>
          </div>
          <p className="text-3xl font-bold">
            {user.verifyStatus === "verified" ? `¥${user.balance?.toFixed(2) || '0.00'}` : '完成认证后查看'}
          </p>
          <div className="flex gap-2 mt-4">
            <Link href="/profile/finance/withdraw" className="flex-1 py-2 bg-[#FFC107] text-gray-800 rounded-xl text-sm font-medium text-center hover:bg-[#FFD54F] transition-colors">提现</Link>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <Link href="/profile/order?status=pending_use" className="bg-white rounded-xl p-3 text-center shadow-sm hover:shadow-md transition-shadow border border-gray-50">
          <OrderIcon className="w-6 h-6 mx-auto text-[#1890FF] mb-1" />
          <p className="text-xs text-gray-500">待使用</p>
        </Link>
        <Link href="/profile/back" className="bg-white rounded-xl p-3 text-center shadow-sm hover:shadow-md transition-shadow border border-gray-50">
          <BackIcon className="w-6 h-6 mx-auto text-[#7B61FF] mb-1" />
          <p className="text-xs text-gray-500">待回收</p>
        </Link>
        <Link href="/profile/finance/transactions" className="bg-white rounded-xl p-3 text-center shadow-sm hover:shadow-md transition-shadow border border-gray-50">
          <WalletIcon className="w-6 h-6 mx-auto text-[#00D4FF] mb-1" />
          <p className="text-xs text-gray-500">资金明细</p>
        </Link>
      </div>

      {/* Quick links */}
      <div className="bg-white rounded-2xl shadow-sm p-4 mb-6 border border-gray-50">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">常用功能</h3>
        <div className="grid grid-cols-4 md:grid-cols-5 gap-3">
          <Link href="/profile/order" className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-blue-50/50 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <OrderIcon className="w-5 h-5 text-[#1890FF]" />
            </div>
            <span className="text-[11px] text-gray-600">我的订单</span>
          </Link>
          <Link href="/profile/back" className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-purple-50/50 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
              <BackIcon className="w-5 h-5 text-[#7B61FF]" />
            </div>
            <span className="text-[11px] text-gray-600">快捷回兑</span>
          </Link>
          <Link href="/profile/finance/withdraw" className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-amber-50/50 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <SettingsIcon className="w-5 h-5 text-amber-500" />
            </div>
            <span className="text-[11px] text-gray-600">提现</span>
          </Link>
          <Link href="/profile/settings/verify" className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-green-50/50 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
              <ShieldIcon className="w-5 h-5 text-green-500" />
            </div>
            <span className="text-[11px] text-gray-600">实名认证</span>
          </Link>
          <Link href="/profile/settings/bank" className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-cyan-50/50 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-cyan-50 flex items-center justify-center">
              <BankIcon className="w-5 h-5 text-cyan-500" />
            </div>
            <span className="text-[11px] text-gray-600">收款账户</span>
          </Link>
        </div>
      </div>

      {/* Announcements */}
      {articles.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-4 mb-6 border border-gray-50">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
              <AnnounceIcon className="w-4 h-4 text-[#1890FF]" />
              平台公告
            </h3>
            <Link href="/announcements" className="text-xs text-[#1890FF] hover:underline">查看更多</Link>
          </div>
          <div className="space-y-2">
            {articles.map(a => (
              <Link key={a.id} href={`/announcements/${a.id}`} className="block bg-gray-50 rounded-lg p-3 hover:bg-blue-50/50 transition-colors">
                <p className="text-sm font-medium text-gray-700">{a.title}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Uncertified notice */}
      {user.verifyStatus !== "verified" && (
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-100 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <OrderIcon className="w-5 h-5 text-[#1890FF]" />
            <div>
              <p className="text-sm font-medium text-blue-700">您尚未完成实名认证</p>
              <p className="text-xs text-blue-500 mt-1">完成实名认证后才能查看余额和抢购优惠券</p>
              <div className="mt-3 flex gap-2">
                <Link href="/profile/settings/verify" className="px-4 py-2 bg-[#1890FF] text-white text-sm rounded-lg hover:shadow-lg transition-colors">去认证</Link>
                <Link href="/profile/settings/bank" className="px-4 py-2 border border-[#1890FF] text-[#1890FF] text-sm rounded-lg hover:bg-white transition-colors">绑定收款</Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
