'use client';

import { useAuth } from '@/contexts/auth-context';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import BottomNav from '@/components/bottom-nav';
import Footer from '@/components/footer';

import { HomeIcon, OrderIcon, BackIcon, WalletIcon, FileTextIcon, UserIcon, ShieldIcon, LockIcon, BankIcon, MapPinIcon, LogoutIcon } from '@/components/icons';

const icons: Record<string, React.ReactNode> = {
  home: <HomeIcon className="w-4 h-4" />,
  order: <OrderIcon className="w-4 h-4" />,
  redeem: <BackIcon className="w-4 h-4" />,
  wallet: <WalletIcon className="w-4 h-4" />,
  transactions: <FileTextIcon className="w-4 h-4" />,
  info: <UserIcon className="w-4 h-4" />,
  verify: <ShieldIcon className="w-4 h-4" />,
  password: <LockIcon className="w-4 h-4" />,
  bank: <BankIcon className="w-4 h-4" />,
  address: <MapPinIcon className="w-4 h-4" />,
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
    { href: '/profile/finance/withdraw', label: '提现', icon: icons.wallet },
    { href: '/profile/finance/transactions', label: '资金明细', icon: icons.transactions },
  ]},
  { section: '用户设置', items: [
    { href: '/profile/settings/info', label: '个人信息', icon: icons.info },
    { href: '/profile/settings/verify', label: '实名认证', icon: icons.verify },
    { href: '/profile/settings/password', label: '修改密码', icon: icons.password },
    { href: '/profile/settings/bank', label: '收款账户', icon: icons.bank },
  ]},
];

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><span className="text-gray-400">加载中...</span></div>;
  }

  if (!user) {
    if (typeof window !== 'undefined') { router.push('/login'); }
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
                      router.push('/');
                    }
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                >
                  <LogoutIcon className="w-4 h-4" />
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
      <Footer />
      <BottomNav active="me" />
      <div className="md:hidden h-16" />
    </div>
  );
}
