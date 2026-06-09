'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface BottomNavProps {
  /** Override the active tab key: 'mall' | 'service' | 'cart' | 'me' */
  active?: string;
}

export default function BottomNav({ active }: BottomNavProps) {
  const pathname = usePathname();
  const [customerServiceUrl, setCustomerServiceUrl] = useState('/');
  
  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(d => {
      if (d.customer_service_url) setCustomerServiceUrl(d.customer_service_url);
    }).catch(() => {});
  }, []);

  // Determine active tab
  const current = active || (
    pathname === '/cart' ? 'cart' :
    pathname === '/profile' || pathname.startsWith('/profile/') ? 'me' :
    'mall'
  );

  const tabs = [
    {
      key: 'mall',
      href: '/',
      label: '商城',
      isExternal: false,
      activeIcon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#1890FF">
          <path d="M12 2.5L2 10V20.5C2 21.0523 2.44772 21.5 3 21.5H9V15H15V21.5H21C21.5523 21.5 22 21.0523 22 20.5V10L12 2.5Z" />
        </svg>
      ),
      inactiveIcon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="1.5">
          <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2h-4v-6H9v6H5a2 2 0 01-2-2z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      key: 'service',
      href: customerServiceUrl,
      label: '客服',
      isExternal: true,
      activeIcon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#1890FF">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10h5v-2h-5c-4.34 0-8-3.36-8-7.5S7.66 5 12 5s8 3.36 8 7.5V14c0 1.1-.9 2-2 2s-2-.9-2-2v-4c0-2.21-1.79-4-4-4s-4 1.79-4 4 1.79 4 4 4c1.38 0 2.6-.7 3.33-1.77.72 1.04 1.93 1.77 3.17 1.77 2.21 0 4-1.79 4-4v-.5C22 6.48 17.52 2 12 2zm0 13c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" />
        </svg>
      ),
      inactiveIcon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="1.5">
          <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="9" cy="12" r="0.5" fill="#333" />
          <circle cx="12" cy="12" r="0.5" fill="#333" />
          <circle cx="15" cy="12" r="0.5" fill="#333" />
        </svg>
      ),
    },
    {
      key: 'cart',
      href: '/cart',
      label: '购物车',
      isExternal: false,
      activeIcon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#1890FF">
          <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49A1.003 1.003 0 0020 4H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z" />
        </svg>
      ),
      inactiveIcon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="1.5">
          <circle cx="9" cy="21" r="1" fill="#333" />
          <circle cx="20" cy="21" r="1" fill="#333" />
          <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      key: 'me',
      href: '/profile',
      label: '我',
      isExternal: false,
      activeIcon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#1890FF">
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
        </svg>
      ),
      inactiveIcon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="1.5">
          <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="12" cy="7" r="4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 md:hidden bg-white/95 backdrop-blur-md border-t border-gray-100 z-50">
      <div className="flex items-center justify-around py-1.5">
        {tabs.map((tab) => {
          const isActive = current === tab.key;
          const icon = isActive ? tab.activeIcon : tab.inactiveIcon;
          const labelClass = `text-[11px] font-semibold ${isActive ? 'text-[#1890FF]' : 'text-[#333]'}`;
          
          if (tab.isExternal) {
            return (
              <a
                key={tab.key}
                href={tab.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-0.5 px-4 py-1"
              >
                {icon}
                <span className={labelClass}>{tab.label}</span>
              </a>
            );
          }
          
          return (
            <Link
              key={tab.key}
              href={tab.href}
              className="flex flex-col items-center gap-0.5 px-4 py-1"
            >
              {icon}
              <span className={labelClass}>{tab.label}</span>
            </Link>
          );
        })}
      </div>
      {/* Safe area for iOS */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </div>
  );
}
