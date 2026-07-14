'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CouponIcon, CategoryIcon, ClockIcon, PeopleIcon,
  OrderIcon, BackIcon, WalletIcon, PicIcon
} from '@/components/icons';

interface DashboardStats {
  coupons: number;
  categories: number;
  users: number;
  orders: number;
  redemptions: number;
  withdrawals: number;
  banners: number;
  sessions: number;
  totalBalance: number;
  todayUsers: number;
  yesterdayUsers: number;
  todayTransactions: number;
  yesterdayTransactions: number;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await fetch('/api/admin/dashboard');
      if (res.status === 401) {
        window.location.href = '/admin';
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <p className="text-gray-500">加载中...</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <p className="text-gray-500">加载失败</p>
      </div>
    );
  }

  const statCards = [
    { label: '商品总数', value: stats.coupons, icon: CouponIcon, color: 'bg-blue-500' },
    { label: '商品分类', value: stats.categories, icon: CategoryIcon, color: 'bg-green-500' },
    { label: '会员总数', value: stats.users, icon: PeopleIcon, color: 'bg-purple-500' },
    { label: '订单总数', value: stats.orders, icon: OrderIcon, color: 'bg-orange-500' },
    { label: '回兑申请', value: stats.redemptions, icon: BackIcon, color: 'bg-cyan-500' },
    { label: '提现申请', value: stats.withdrawals, icon: WalletIcon, color: 'bg-pink-500' },
    { label: '场次总数', value: stats.sessions, icon: ClockIcon, color: 'bg-indigo-500' },
    { label: '轮播图', value: stats.banners, icon: PicIcon, color: 'bg-red-500' },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">数据概览</h1>
        <p className="text-gray-500 text-sm mt-1">平台运营数据实时统计</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {statCards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg ${card.color} flex items-center justify-center flex-shrink-0`}>
                <card.icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-gray-500">{card.label}</p>
                <p className="text-xl font-bold text-gray-900">{card.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 账户余额 */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 mb-6 text-white">
        <p className="text-sm opacity-90">账户总余额</p>
        <p className="text-3xl font-bold mt-2">¥{(stats.totalBalance / 100).toFixed(2)}</p>
      </div>

      {/* 今日/昨日对比 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-sm font-medium text-gray-900 mb-4">今日数据</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">今日注册</span>
              <span className="text-lg font-bold text-gray-900">{stats.todayUsers}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">今日交易</span>
              <span className="text-lg font-bold text-gray-900">{stats.todayTransactions}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-sm font-medium text-gray-900 mb-4">昨日数据</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">昨日注册</span>
              <span className="text-lg font-bold text-gray-900">{stats.yesterdayUsers}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">昨日交易</span>
              <span className="text-lg font-bold text-gray-900">{stats.yesterdayTransactions}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
