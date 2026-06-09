'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const sidebarGroups = [
  {
    label: '商品管理',
    items: [
      { href: '/admin/coupons', label: '优惠券管理', icon: '🎫' },
      { href: '/admin/categories', label: '分类管理', icon: '📂' },
      { href: '/admin/sessions', label: '场次管理', icon: '⏰' },
      { href: '/admin/banners', label: '轮播图管理', icon: '🖼️' },
    ],
  },
  {
    label: '订单管理',
    items: [
      { href: '/admin/orders', label: '订单列表', icon: '📋' },
      { href: '/admin/redemptions', label: '回兑审核', icon: '♻️' },
      { href: '/admin/withdrawals', label: '提现审核', icon: '💰' },
    ],
  },
  {
    label: '用户管理',
    items: [
      { href: '/admin/users', label: '用户管理', icon: '👥' },
      { href: '/admin/verify', label: '实名审核', icon: '🪪' },
      { href: '/admin/codes', label: '注册码管理', icon: '🔑' },
    ],
  },
  {
    label: '内容管理',
    items: [
      { href: '/admin/articles', label: '文章管理', icon: '📝' },
      { href: '/admin/announcements', label: '公告管理', icon: '📢' },
    ],
  },
  {
    label: '系统设置',
    items: [
      { href: '/admin/settings', label: '系统设置', icon: '⚙️' },
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
    <div className="min-h-screen bg-gray-900 flex">
      {/* Sidebar */}
      <aside className="w-56 min-h-screen bg-gray-900 border-r border-gray-800 flex-shrink-0 overflow-y-auto">
        <div className="p-4">
          <Link href="/admin" className="block text-center">
            <span className="text-xl font-bold bg-gradient-to-r from-[#00D4FF] to-[#7B61FF] bg-clip-text text-transparent">
              惠抢券
            </span>
            <span className="block text-xs text-gray-500 mt-0.5">管理后台</span>
          </Link>
        </div>

        <nav className="px-2 pb-4">
          {sidebarGroups.map(group => (
            <div key={group.label} className="mb-4">
              <div className="px-3 py-1.5 text-xs font-medium text-gray-500 uppercase tracking-wider">
                {group.label}
              </div>
              {group.items.map(item => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                      isActive
                        ? 'bg-[#1890FF]/20 text-[#1890FF] font-medium'
                        : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                    }`}
                  >
                    <span className="text-base">{item.icon}</span>
                    {item.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
