'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export function InviteGuard({ children }: { children: React.ReactNode }) {
  const [checked, setChecked] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Skip check for invite page itself and admin pages
    if (pathname === '/invite' || pathname.startsWith('/admin') || pathname === '/login' || pathname === '/register') {
      setChecked(true);
      return;
    }

    // 通过服务端 API 检查是否需要邀请码 & 是否已验证（cookie 是 httpOnly，JS 无法直接读取）
    fetch('/api/invite/verify')
      .then(res => res.json())
      .then(data => {
        if (data.required && !data.verified) {
          router.replace('/invite');
        } else {
          setChecked(true);
        }
      })
      .catch(() => {
        // On error, allow access
        setChecked(true);
      });
  }, [pathname, router]);

  if (!checked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1890FF]"></div>
      </div>
    );
  }

  return <>{children}</>;
}
