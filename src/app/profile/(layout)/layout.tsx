'use client';

import { useAuth } from '@/contexts/auth-context';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const menuItems = [
  { section: '个人中心', items: [
    { href: '/profile', label: '个人中心', icon: '👤' },
  ]},
  { section: '交易管理', items: [
    { href: '/profile/order', label: '我的订单', icon: '📦' },
    { href: '/profile/back', label: '快捷回兑', icon: '🔄' },
  ]},
  { section: '财务中心', items: [
    { href: '/profile/finance/deposit', label: '充值/提现', icon: '💰' },
    { href: '/profile/finance/transactions', label: '资金明细', icon: '📊' },
  ]},
  { section: '用户设置', items: [
    { href: '/profile/settings/info', label: '个人信息', icon: '✏️' },
    { href: '/profile/settings/verify', label: '实名认证', icon: '🪪' },
    { href: '/profile/settings/password', label: '修改密码', icon: '🔐' },
    { href: '/profile/settings/bank', label: '收款账户', icon: '🏦' },
    { href: '/profile/settings/address', label: '收货地址', icon: '📍' },
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
      {/* Top bar - Douyin Blue */}
      <div className="bg-gradient-to-r from-[#1890FF] to-[#7B61FF]">
        <div className="max-w-[1200px] mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/images/logo.png" alt="抖音电商" width={100} height={26} className="h-6 w-auto brightness-0 invert" priority />
            </Link>
            <div className="hidden md:flex items-center gap-4 text-white/90 text-sm">
              <Link href="/" className="hover:text-white">首页</Link>
              <Link href="/profile/order" className="hover:text-white">我的订单</Link>
              <Link href="/profile/back" className="hover:text-white">快捷回兑</Link>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/" className="text-white/80 text-sm hover:text-white transition-colors">返回首页</Link>
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 py-4">
        <div className="flex gap-4">
          {/* Left sidebar */}
          <div className="hidden md:block w-[200px] flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              {menuItems.map((section) => (
                <div key={section.section}>
                  <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                    <h3 className="text-sm font-bold text-gray-700">{section.section}</h3>
                  </div>
                  <ul>
                    {section.items.map((item) => (
                      <li key={item.href}>
                        <Link href={item.href}
                          className={`block px-4 py-2.5 text-sm border-b border-gray-50 transition-colors ${
                            isActive(item.href) ? 'text-[#1890FF] bg-blue-50 font-medium' : 'text-gray-600 hover:text-[#1890FF] hover:bg-blue-50'
                          }`}>
                          {item.icon} {item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Mobile tabs */}
            <div className="md:hidden mb-4 bg-white rounded-lg shadow-sm overflow-x-auto">
              <div className="flex">
                <Link href="/profile" className={`px-3 py-2 text-xs whitespace-nowrap ${pathname === '/profile' ? 'text-[#1890FF] font-medium border-b-2 border-[#1890FF]' : 'text-gray-600'}`}>个人中心</Link>
                <Link href="/profile/order" className={`px-3 py-2 text-xs whitespace-nowrap ${pathname.startsWith('/profile/order') ? 'text-[#1890FF] font-medium border-b-2 border-[#1890FF]' : 'text-gray-600'}`}>我的订单</Link>
                <Link href="/profile/back" className={`px-3 py-2 text-xs whitespace-nowrap ${pathname.startsWith('/profile/back') ? 'text-[#1890FF] font-medium border-b-2 border-[#1890FF]' : 'text-gray-600'}`}>快捷回兑</Link>
                <Link href="/profile/finance/deposit" className={`px-3 py-2 text-xs whitespace-nowrap ${pathname.startsWith('/profile/finance') ? 'text-[#1890FF] font-medium border-b-2 border-[#1890FF]' : 'text-gray-600'}`}>财务</Link>
                <Link href="/profile/settings/info" className={`px-3 py-2 text-xs whitespace-nowrap ${pathname.startsWith('/profile/settings') ? 'text-[#1890FF] font-medium border-b-2 border-[#1890FF]' : 'text-gray-600'}`}>设置</Link>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm">
              {children}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile bottom nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-200 z-40">
        <div className="flex items-center justify-around h-12">
          <Link href="/" className="flex flex-col items-center text-gray-500 hover:text-[#1890FF]">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
            <span className="text-[10px]">首页</span>
          </Link>
          <Link href="/profile/order" className="flex flex-col items-center text-gray-500 hover:text-[#1890FF]">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
            <span className="text-[10px]">订单</span>
          </Link>
          <Link href="/profile" className="flex flex-col items-center text-[#1890FF]">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            <span className="text-[10px]">我的</span>
          </Link>
        </div>
      </div>
      <div className="md:hidden h-14" />
    </div>
  );
}
