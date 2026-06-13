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

    // Check if invite_verified cookie exists
    const cookies = document.cookie.split(';');
    const verified = cookies.some(c => c.trim().startsWith('invite_verified=true'));

    if (verified) {
      setChecked(true);
      return;
    }

    // Need to check with server if invite code is required
    fetch('/api/invite/verify')
      .then(res => res.json())
      .then(data => {
        if (data.required && !verified) {
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
