'use client';

import { useAuth } from '@/contexts/auth-context';
import Link from 'next/link';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();

  if (!user) return null;

  return (
    <div className="p-4 md:p-6">
      {/* User info header */}
      <div className="flex items-center gap-4 mb-6 pb-4 border-b border-gray-100">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#FE2C55] to-[#FF6B35] flex items-center justify-center">
          <span className="text-2xl text-white font-bold">{user.username.charAt(0).toUpperCase()}</span>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-gray-800">您好：{user.username}</span>
            {user.isVerified ? (
              <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full">已认证</span>
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
          <p className="text-xl font-bold text-[#FE2C55] mt-1">
            <Link href="/profile/order?status=pending_use">0</Link>
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <p className="text-sm text-gray-500">待回兑</p>
          <p className="text-xl font-bold text-orange-500 mt-1">
            <Link href="/profile/back">0</Link>
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <p className="text-sm text-gray-500">信用分</p>
          <p className="text-xl font-bold text-blue-500 mt-1">500</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <p className="text-sm text-gray-500">账户余额</p>
          <p className="text-xl font-bold text-[#FFC107] mt-1">
            {user.isVerified ? `¥${user.balance?.toFixed(2) || '0.00'}` : '未认证'}
          </p>
        </div>
      </div>

      {/* Balance section */}
      <div className="bg-gradient-to-r from-[#FE2C55] to-[#FF6B35] rounded-lg p-4 md:p-6 text-white mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm opacity-80">账户余额</p>
            <p className="text-3xl font-bold mt-1">
              {user.isVerified ? `¥${user.balance?.toFixed(2) || '0.00'}` : '完成认证后查看'}
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/profile/finance/deposit" className="px-4 py-2 bg-white/20 rounded-lg text-sm hover:bg-white/30 transition-colors">充值</Link>
            <Link href="/profile/finance/withdraw" className="px-4 py-2 bg-[#FFC107] text-gray-800 rounded-lg text-sm font-medium hover:bg-[#FFD54F] transition-colors">提现</Link>
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
        <Link href="/profile/order" className="flex flex-col items-center gap-1 p-3 bg-gray-50 rounded-lg hover:bg-red-50 transition-colors">
          <span className="text-2xl">📦</span>
          <span className="text-xs text-gray-600">我的订单</span>
        </Link>
        <Link href="/profile/back" className="flex flex-col items-center gap-1 p-3 bg-gray-50 rounded-lg hover:bg-red-50 transition-colors">
          <span className="text-2xl">🔄</span>
          <span className="text-xs text-gray-600">快捷回兑</span>
        </Link>
        <Link href="/profile/finance/deposit" className="flex flex-col items-center gap-1 p-3 bg-gray-50 rounded-lg hover:bg-red-50 transition-colors">
          <span className="text-2xl">💰</span>
          <span className="text-xs text-gray-600">充值提现</span>
        </Link>
        <Link href="/profile/settings/verify" className="flex flex-col items-center gap-1 p-3 bg-gray-50 rounded-lg hover:bg-red-50 transition-colors">
          <span className="text-2xl">🪪</span>
          <span className="text-xs text-gray-600">实名认证</span>
        </Link>
        <Link href="/profile/settings/bank" className="flex flex-col items-center gap-1 p-3 bg-gray-50 rounded-lg hover:bg-red-50 transition-colors">
          <span className="text-2xl">🏦</span>
          <span className="text-xs text-gray-600">收款账户</span>
        </Link>
      </div>

      {/* Uncertified notice */}
      {!user.isVerified && (
        <div className="mt-6 bg-orange-50 border border-orange-200 rounded-lg p-4">
          <p className="text-orange-600 font-medium text-sm">您尚未完成实名认证</p>
          <p className="text-orange-500 text-xs mt-1">完成实名认证后才能查看余额和抢购优惠券</p>
          <div className="mt-3 flex gap-2">
            <Link href="/profile/settings/verify" className="px-4 py-2 bg-[#FE2C55] text-white text-sm rounded-lg">去认证</Link>
            <Link href="/profile/settings/bank" className="px-4 py-2 border border-[#FE2C55] text-[#FE2C55] text-sm rounded-lg">绑定收款</Link>
          </div>
        </div>
      )}
    </div>
  );
}
