'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  CouponIcon, CategoryIcon, ClockIcon, PicIcon, OrderIcon,
  BackIcon, WalletIcon, PeopleIcon, ShieldIcon, KeyIcon,
  EditIcon, AnnounceIcon, SettingsIcon, LinkIcon, StarIcon
} from '@/components/icons';

const sidebarGroups = [
  {
    label: '商品管理',
    items: [
      { href: '/admin/coupons', label: '优惠券管理', Icon: CouponIcon },
      { href: '/admin/categories', label: '分类管理', Icon: CategoryIcon },
      { href: '/admin/sessions', label: '场次管理', Icon: ClockIcon },
      { href: '/admin/banners', label: '轮播图管理', Icon: PicIcon },
    ],
  },
  {
    label: '订单管理',
    items: [
      { href: '/admin/orders', label: '订单列表', Icon: OrderIcon },
      { href: '/admin/redemptions', label: '回兑审核', Icon: BackIcon },
      { href: '/admin/withdrawals', label: '提现审核', Icon: WalletIcon },
    ],
  },
  {
    label: '用户管理',
    items: [
      { href: '/admin/users', label: '用户管理', Icon: PeopleIcon },
      { href: '/admin/verify', label: '实名审核', Icon: ShieldIcon },
      { href: '/admin/codes', label: '注册码管理', Icon: KeyIcon },
      { href: '/admin/invite-codes', label: '邀请码管理', Icon: StarIcon },
    ],
  },
  {
    label: '内容管理',
    items: [
      { href: '/admin/articles', label: '文章管理', Icon: EditIcon },
      { href: '/admin/announcements', label: '公告管理', Icon: AnnounceIcon },
    ],
  },
  {
    label: '系统设置',
    items: [
      { href: '/admin/settings', label: '系统设置', Icon: SettingsIcon },
      { href: '/admin/footer-links', label: '页脚链接管理', Icon: LinkIcon },
    ],
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Login page doesn't need sidebar
  if (pathname === '/admin') {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[#0D1117] flex">
      {/* Sidebar */}
      <aside className="w-56 min-h-screen bg-[#0D1117] border-r border-white/5 flex-shrink-0 overflow-y-auto">
        {/* Logo */}
        <div className="p-5 border-b border-white/5">
          <Link href="/admin" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00D4FF] to-[#7B61FF] flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm font-bold">惠</span>
            </div>
            <div>
              <span className="text-base font-bold text-white">
                惠抢券
              </span>
              <span className="block text-[10px] text-gray-500 leading-tight">管理后台</span>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-1">
          {sidebarGroups.map(group => (
            <div key={group.label} className="mb-3">
              <div className="px-3 py-2 text-[11px] font-medium text-gray-500 tracking-wider">
                {group.label}
              </div>
              <div className="space-y-0.5">
                {group.items.map(item => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] transition-all duration-150 ${
                        isActive
                          ? 'bg-[#1890FF] text-white font-medium shadow-lg shadow-[#1890FF]/20'
                          : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                      }`}
                    >
                      <item.Icon className={`w-4 h-4 ${isActive ? 'text-white' : ''}`} />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto bg-[#F5F7FA]">
        {children}
      </main>
    </div>
  );
}
