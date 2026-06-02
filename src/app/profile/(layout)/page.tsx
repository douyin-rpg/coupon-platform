'use client';

import { useAuth } from '@/contexts/auth-context';
import Link from 'next/link';
import { useState, useEffect } from 'react';

interface Announcement {
  id: string;
  title: string;
  content: string;
}

export default function ProfilePage() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    fetch('/api/announcements')
      .then(res => res.json())
      .then(data => { if (data.announcements) setAnnouncements(data.announcements); })
      .catch(() => {});
  }, []);

  if (!user) return null;

  return (
    <div className="p-4 md:p-6">
      {/* User info header */}
      <div className="flex items-center gap-4 mb-6 pb-4 border-b border-gray-100">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#1890FF] to-[#7B61FF] flex items-center justify-center shadow-md">
          <span className="text-2xl text-white font-bold">{user.username.charAt(0).toUpperCase()}</span>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-gray-800">您好：{user.username}</span>
            {user.verifyStatus === "verified" ? (
              <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">已认证</span>
            ) : (
              <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">未认证</span>
            )}
          </div>
          <p className="text-sm text-gray-400 mt-1">真实姓名：{user.realName}</p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <p className="text-sm text-gray-500">待使用</p>
          <p className="text-xl font-bold text-[#1890FF] mt-1">
            <Link href="/profile/order?status=pending_use">0</Link>
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <p className="text-sm text-gray-500">待回兑</p>
          <p className="text-xl font-bold text-[#7B61FF] mt-1">
            <Link href="/profile/back">0</Link>
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <p className="text-sm text-gray-500">信用分</p>
          <p className="text-xl font-bold text-[#00D4FF] mt-1">{user.creditScore ?? 100}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <p className="text-sm text-gray-500">账户余额</p>
          <p className="text-xl font-bold text-[#FFC107] mt-1">
            {user.verifyStatus === "verified" ? `¥${user.balance?.toFixed(2) || '0.00'}` : '未认证'}
          </p>
        </div>
      </div>

      {/* Balance card */}
      <div className="bg-gradient-to-r from-[#1890FF] to-[#7B61FF] rounded-xl p-4 md:p-6 text-white mb-6 shadow-lg relative overflow-hidden">
        <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/10" />
        <div className="absolute -right-4 bottom-0 w-20 h-20 rounded-full bg-white/5" />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <p className="text-sm opacity-80">账户余额</p>
            <p className="text-3xl font-bold mt-1">
              {user.verifyStatus === "verified" ? `¥${user.balance?.toFixed(2) || '0.00'}` : '完成认证后查看'}
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/profile/finance/deposit" className="px-4 py-2 bg-white/20 rounded-lg text-sm hover:bg-white/30 transition-colors">充值</Link>
            <Link href="/profile/finance/withdraw" className="px-4 py-2 bg-[#FFC107] text-gray-800 rounded-lg text-sm font-medium hover:bg-[#FFD54F] transition-colors">提现</Link>
          </div>
        </div>
      </div>

      {/* Announcements */}
      {announcements.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1.5">
            <svg className="w-4 h-4 text-[#1890FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>
            平台公告
          </h3>
          <div className="space-y-2">
            {announcements.map(a => (
              <div key={a.id} className="bg-blue-50/60 border border-blue-100 rounded-lg p-3">
                <p className="text-sm font-medium text-gray-700">{a.title}</p>
                <p className="text-xs text-gray-500 mt-1 whitespace-pre-wrap">{a.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
        <Link href="/profile/order" className="flex flex-col items-center gap-1 p-3 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors">
          <span className="text-2xl">📦</span>
          <span className="text-xs text-gray-600">我的订单</span>
        </Link>
        <Link href="/profile/back" className="flex flex-col items-center gap-1 p-3 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors">
          <span className="text-2xl">🔄</span>
          <span className="text-xs text-gray-600">快捷回兑</span>
        </Link>
        <Link href="/profile/finance/deposit" className="flex flex-col items-center gap-1 p-3 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors">
          <span className="text-2xl">💰</span>
          <span className="text-xs text-gray-600">充值提现</span>
        </Link>
        <Link href="/profile/settings/verify" className="flex flex-col items-center gap-1 p-3 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors">
          <span className="text-2xl">🪪</span>
          <span className="text-xs text-gray-600">实名认证</span>
        </Link>
        <Link href="/profile/settings/bank" className="flex flex-col items-center gap-1 p-3 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors">
          <span className="text-2xl">🏦</span>
          <span className="text-xs text-gray-600">收款账户</span>
        </Link>
      </div>

      {/* Uncertified notice */}
      {user.verifyStatus !== "verified" && (
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="blue-600 font-medium text-sm text-blue-700">您尚未完成实名认证</p>
          <p className="text-blue-500 text-xs mt-1">完成实名认证后才能查看余额和抢购优惠券</p>
          <div className="mt-3 flex gap-2">
            <Link href="/profile/settings/verify" className="px-4 py-2 bg-[#1890FF] text-white text-sm rounded-lg hover:bg-[#40A9FF] transition-colors">去认证</Link>
            <Link href="/profile/settings/bank" className="px-4 py-2 border border-[#1890FF] text-[#1890FF] text-sm rounded-lg hover:bg-blue-50 transition-colors">绑定收款</Link>
          </div>
        </div>
      )}
    </div>
  );
}
