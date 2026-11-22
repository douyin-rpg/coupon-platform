'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HomeIcon, HeadphoneIcon, ShoppingCartIcon, UserIcon } from '@/components/icons';

export default function BottomNav({ active = 'home' }: { active?: string }) {
  const pathname = usePathname();

  const tabs = [
    { key: 'home', label: '商城', href: '/', icon: HomeIcon },
    // 站内在线客服
    { key: 'service', label: '客服', href: '/support', icon: HeadphoneIcon },
    { key: 'cart', label: '购物车', href: '/cart', icon: ShoppingCartIcon },
    { key: 'me', label: '我', href: '/profile', icon: UserIcon },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50 safe-area-bottom">
      <div className="flex items-center justify-around h-14">
        {tabs.map((tab) => {
          const isActive = active === tab.key;
          const IconComp = tab.icon;

          return (
            <Link key={tab.key} href={tab.href} className="flex-1 flex justify-center py-1">
              <div className={`flex flex-col items-center gap-0.5 transition-colors ${isActive ? 'text-[#1890FF]' : 'text-gray-400'}`}>
                <IconComp className={`w-5 h-5 ${isActive ? 'text-[#1890FF]' : 'text-gray-400'}`} filled={isActive} />
                <span className={`text-[10px] ${isActive ? 'font-semibold' : 'font-normal'}`}>{tab.label}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
