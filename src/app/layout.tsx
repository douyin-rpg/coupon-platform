import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/contexts/auth-context';
import IntroAnimation from '@/components/intro-animation';
import { InviteGuard } from '@/components/invite-guard';

export const metadata: Metadata = {
  title: '惠抢券 - 优惠券抢购平台',
  description: '限时抢购优惠券，快速回兑',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="font-sans antialiased bg-gray-50 text-gray-900 min-h-screen">
        <AuthProvider>
          <InviteGuard>
            <IntroAnimation />
            {children}
          </InviteGuard>
        </AuthProvider>
      </body>
    </html>
  );
}
