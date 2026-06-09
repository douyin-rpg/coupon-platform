'use client';

import { useAuth } from '@/contexts/auth-context';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import BottomNav from '@/components/bottom-nav';

// Douyin-style SVG icons
const icons = {
  home: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  order: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  redeem: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  wallet: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><path d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  transactions: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><path d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  info: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  verify: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  password: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  bank: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><path d="M3 10h18M3 6h18M3 14h18M3 18h18M5 22V4a1 1 0 011-1h12a1 1 0 011 1v18" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  address: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" strokeLinecap="round" strokeLinejoin="round"/><path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round"/></svg>,
};

const menuItems = [
  { section: '个人中心', items: [
    { href: '/profile', label: '个人中心', icon: icons.home },
  ]},
  { section: '交易管理', items: [
    { href: '/profile/order', label: '我的订单', icon: icons.order },
    { href: '/profile/back', label: '快捷回兑', icon: icons.redeem },
  ]},
  { section: '财务中心', items: [
    { href: '/profile/finance/deposit', label: '充值/提现', icon: icons.wallet },
    { href: '/profile/finance/transactions', label: '资金明细', icon: icons.transactions },
  ]},
  { section: '用户设置', items: [
    { href: '/profile/settings/info', label: '个人信息', icon: icons.info },
    { href: '/profile/settings/verify', label: '实名认证', icon: icons.verify },
    { href: '/profile/settings/password', label: '修改密码', icon: icons.password },
    { href: '/profile/settings/bank', label: '收款账户', icon: icons.bank },
    { href: '/profile/settings/address', label: '收货地址', icon: icons.address },
  ]},
];

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><span className="text-gray-400">加载中...</span></div>;
  }

  if (!user) {
    if (typeof window !== 'undefined') { window.location.href = '/login'; }
    return null;
  }

  const isActive = (href: string) => {
    if (href === '/profile') return pathname === '/profile';
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      {/* Top bar */}
      <div className="bg-gradient-to-r from-[#1890FF] to-[#00D4FF]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/images/logo.png" alt="抖音电商" width={100} height={26} className="h-6 w-auto brightness-0 invert" priority />
            </Link>
            <div className="hidden md:flex items-center gap-4 text-white/80 text-sm">
              <Link href="/" className="hover:text-white transition-colors">首页</Link>
              <Link href="/cart" className="hover:text-white transition-colors">购物车</Link>
              <Link href="/profile/order" className="hover:text-white transition-colors">我的订单</Link>
              <Link href="/profile/back" className="hover:text-white transition-colors">快捷回兑</Link>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-white/60 text-sm">{user?.username}</span>
            <Link href="/" className="text-white/80 text-sm hover:text-white transition-colors px-3 py-1.5 rounded-full border border-white/20 hover:bg-white/10">
              返回首页
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-6">
        <div className="flex gap-6">
          {/* Left sidebar - desktop */}
          <div className="hidden md:block w-[220px] flex-shrink-0">
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden sticky top-20">
              {menuItems.map((section) => (
                <div key={section.section}>
                  <div className="px-4 py-2.5 bg-gray-50/80 border-b border-gray-100">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">{section.section}</h3>
                  </div>
                  <ul>
                    {section.items.map((item) => (
                      <li key={item.href}>
                        <Link href={item.href}
                          className={`flex items-center gap-2.5 px-4 py-3 text-sm border-b border-gray-50 transition-all ${
                            isActive(item.href) ? 'text-[#1890FF] bg-blue-50/80 font-medium border-l-2 border-l-[#1890FF]' : 'text-gray-600 hover:text-[#1890FF] hover:bg-blue-50/50'
                          }`}>
                          <span className={isActive(item.href) ? 'text-[#1890FF]' : 'text-gray-400'}>{item.icon}</span>
                          {item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              {/* Logout button */}
              <div className="px-4 py-3 border-t border-gray-100">
                <button
                  onClick={async () => {
                    if (confirm('确定要退出登录吗？')) {
                      await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
                      window.location.href = '/';
                    }
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                  退出登录
                </button>
              </div>
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Mobile tabs */}
            <div className="md:hidden mb-4 bg-white rounded-2xl shadow-sm overflow-x-auto scrollbar-hide">
              <div className="flex px-1">
                <Link href="/profile" className={`px-3 py-2.5 text-xs whitespace-nowrap ${pathname === '/profile' ? 'text-[#1890FF] font-bold border-b-2 border-[#1890FF]' : 'text-gray-500'}`}>个人中心</Link>
                <Link href="/profile/order" className={`px-3 py-2.5 text-xs whitespace-nowrap ${pathname.startsWith('/profile/order') ? 'text-[#1890FF] font-bold border-b-2 border-[#1890FF]' : 'text-gray-500'}`}>我的订单</Link>
                <Link href="/profile/back" className={`px-3 py-2.5 text-xs whitespace-nowrap ${pathname.startsWith('/profile/back') ? 'text-[#1890FF] font-bold border-b-2 border-[#1890FF]' : 'text-gray-500'}`}>快捷回兑</Link>
                <Link href="/profile/finance/deposit" className={`px-3 py-2.5 text-xs whitespace-nowrap ${pathname.startsWith('/profile/finance') ? 'text-[#1890FF] font-bold border-b-2 border-[#1890FF]' : 'text-gray-500'}`}>财务</Link>
                <Link href="/profile/settings/info" className={`px-3 py-2.5 text-xs whitespace-nowrap ${pathname.startsWith('/profile/settings') ? 'text-[#1890FF] font-bold border-b-2 border-[#1890FF]' : 'text-gray-500'}`}>设置</Link>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm">
              {children}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile bottom nav */}
      <BottomNav active="me" />
      <div className="md:hidden h-16" />
    </div>
  );
}
