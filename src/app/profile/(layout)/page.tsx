'use client';

import { useAuth } from '@/contexts/auth-context';
import Link from 'next/link';
import { useState, useEffect } from 'react';

interface Article { id: string; title: string; }

export default function ProfilePage() {
  const { user } = useAuth();
  const [articles, setArticles] = useState<Article[]>([]);

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
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-gray-800">{user.username}</span>
            {user.verifyStatus === "verified" ? (
              <span className="flex items-center gap-1 text-xs bg-gradient-to-r from-blue-50 to-cyan-50 text-[#1890FF] px-2 py-0.5 rounded-full border border-blue-100">
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L9.19 8.63L2 9.24L7.46 13.97L5.82 21L12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.63L12 2Z"/></svg>
                已认证
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs bg-orange-50 text-orange-500 px-2 py-0.5 rounded-full border border-orange-100">
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>
                未认证
              </span>
            )}
          </div>
          <p className="text-sm text-gray-400 mt-1">真实姓名：{user.realName}</p>
        </div>
      </div>

      {/* Balance card */}
      <div className="bg-gradient-to-r from-[#1890FF] to-[#7B61FF] rounded-2xl p-5 md:p-6 text-white mb-6 shadow-lg shadow-blue-500/20 relative overflow-hidden">
        <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/10" />
        <div className="absolute -right-4 bottom-0 w-20 h-20 rounded-full bg-white/5" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-white/70" viewBox="0 0 24 24" fill="none">
                <rect x="2" y="4" width="20" height="16" rx="3" stroke="white" strokeWidth="1.5" />
                <path d="M2 10H22" stroke="white" strokeWidth="1.5" strokeDasharray="2 2" />
                <text x="12" y="17" textAnchor="middle" fill="white" fontSize="6" fontWeight="bold">¥</text>
              </svg>
              <span className="text-sm opacity-80">账户余额</span>
            </div>
            <div className="flex items-center gap-1 text-white/60 text-xs">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
              信用分 {user.creditScore ?? 500}
            </div>
          </div>
          <p className="text-3xl font-bold">
            {user.verifyStatus === "verified" ? `¥${user.balance?.toFixed(2) || '0.00'}` : '完成认证后查看'}
          </p>
          <div className="flex gap-2 mt-4">
            <Link href="/profile/finance/deposit" className="flex-1 py-2 bg-white/15 rounded-xl text-sm text-center hover:bg-white/25 transition-colors border border-white/10">充值</Link>
            <Link href="/profile/finance/withdraw" className="flex-1 py-2 bg-[#FFC107] text-gray-800 rounded-xl text-sm font-medium text-center hover:bg-[#FFD54F] transition-colors">提现</Link>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <Link href="/profile/order?status=pending_use" className="bg-white rounded-xl p-3 text-center shadow-sm hover:shadow-md transition-shadow border border-gray-50">
          <svg className="w-6 h-6 mx-auto text-[#1890FF] mb-1" viewBox="0 0 24 24" fill="none">
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <rect x="9" y="3" width="6" height="4" rx="1" stroke="currentColor" strokeWidth="1.5" />
            <path d="M9 14l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <p className="text-xs text-gray-500">待使用</p>
        </Link>
        <Link href="/profile/back" className="bg-white rounded-xl p-3 text-center shadow-sm hover:shadow-md transition-shadow border border-gray-50">
          <svg className="w-6 h-6 mx-auto text-[#7B61FF] mb-1" viewBox="0 0 24 24" fill="none">
            <path d="M4 4h16v12H4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
            <path d="M4 8h16" stroke="currentColor" strokeWidth="1.5" />
            <path d="M12 16v4M8 20h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="17" cy="12" r="1.5" fill="currentColor" opacity="0.3" />
          </svg>
          <p className="text-xs text-gray-500">待回收</p>
        </Link>
        <Link href="/profile/finance/transactions" className="bg-white rounded-xl p-3 text-center shadow-sm hover:shadow-md transition-shadow border border-gray-50">
          <svg className="w-6 h-6 mx-auto text-[#00D4FF] mb-1" viewBox="0 0 24 24" fill="none">
            <path d="M3 3h18v18H3z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
            <path d="M3 9h18M9 9v12" stroke="currentColor" strokeWidth="1.5" />
          </svg>
          <p className="text-xs text-gray-500">资金明细</p>
        </Link>
      </div>

      {/* Quick links */}
      <div className="bg-white rounded-2xl shadow-sm p-4 mb-6 border border-gray-50">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">常用功能</h3>
        <div className="grid grid-cols-4 md:grid-cols-5 gap-3">
          <Link href="/profile/order" className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-blue-50/50 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <svg className="w-5 h-5 text-[#1890FF]" viewBox="0 0 24 24" fill="none">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <rect x="9" y="3" width="6" height="4" rx="1" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </div>
            <span className="text-[11px] text-gray-600">我的订单</span>
          </Link>
          <Link href="/profile/back" className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-purple-50/50 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
              <svg className="w-5 h-5 text-[#7B61FF]" viewBox="0 0 24 24" fill="none">
                <path d="M12 4v16M4 12l8-8 8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="text-[11px] text-gray-600">快捷回兑</span>
          </Link>
          <Link href="/profile/finance/withdraw" className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-amber-50/50 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <svg className="w-5 h-5 text-amber-500" viewBox="0 0 24 24" fill="none">
                <path d="M12 4v16M4 12h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </div>
            <span className="text-[11px] text-gray-600">提现</span>
          </Link>
          <Link href="/profile/settings/verify" className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-green-50/50 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
              <svg className="w-5 h-5 text-green-500" viewBox="0 0 24 24" fill="none">
                <path d="M12 2a5 5 0 015 5v3a5 5 0 01-10 0V7a5 5 0 015-5z" stroke="currentColor" strokeWidth="1.5" />
                <path d="M3 21v-1a7 7 0 0114 0v1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="text-[11px] text-gray-600">实名认证</span>
          </Link>
          <Link href="/profile/settings/bank" className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-cyan-50/50 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-cyan-50 flex items-center justify-center">
              <svg className="w-5 h-5 text-cyan-500" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="6" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
                <path d="M3 10h18M7 14h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
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
              <svg className="w-4 h-4 text-[#1890FF]" viewBox="0 0 24 24" fill="none">
                <path d="M3 7C3 5.34315 4.34315 4 6 4H18C19.6569 4 21 5.34315 21 7V17C21 18.6569 19.6569 20 18 20H6C4.34315 4 3 18.6569 3 17V7Z" fill="url(#p-ann)" />
                <path d="M7 9H17M7 13H13" stroke="white" strokeWidth="1" strokeLinecap="round" />
                <defs><linearGradient id="p-ann" x1="3" y1="4" x2="21" y2="20"><stop stopColor="#1890FF" /><stop offset="1" stopColor="#00D4FF" /></linearGradient></defs>
              </svg>
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
            <svg className="w-5 h-5 text-[#1890FF] flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
              <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <div>
              <p className="text-sm font-medium text-blue-700">您尚未完成实名认证</p>
              <p className="text-xs text-blue-500 mt-1">完成实名认证后才能查看余额和抢购优惠券</p>
              <div className="mt-3 flex gap-2">
                <Link href="/profile/settings/verify" className="px-4 py-2 bg-[#1890FF] text-white text-sm rounded-lg hover:bg-[#0077E6] transition-colors">去认证</Link>
                <Link href="/profile/settings/bank" className="px-4 py-2 border border-[#1890FF] text-[#1890FF] text-sm rounded-lg hover:bg-white transition-colors">绑定收款</Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
