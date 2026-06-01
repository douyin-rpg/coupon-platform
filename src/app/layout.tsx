import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '惠抢券 - 优惠券抢购平台',
  description: '限时抢购优惠券，回兑赚取5%奖励',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="font-sans antialiased bg-gray-50 text-gray-900 min-h-screen">
        {children}
      </body>
    </html>
  );
}
