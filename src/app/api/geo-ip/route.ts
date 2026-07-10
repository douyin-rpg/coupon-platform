import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const ip = request.nextUrl.searchParams.get('ip');

  if (!ip || ip === '-' || ip === '127.0.0.1' || ip === '::1') {
    return NextResponse.json({ location: '本地' });
  }

  try {
    // 使用 ip-api.com 免费 IP 地理位置服务
    const res = await fetch(`http://ip-api.com/json/${ip}?lang=zh-CN&fields=status,country,regionName,city,isp`, {
      next: { revalidate: 86400 }, // 缓存 24 小时
    });

    if (!res.ok) {
      return NextResponse.json({ location: '未知' });
    }

    const data = await res.json();

    if (data.status === 'success') {
      const parts = [data.country, data.regionName, data.city].filter(Boolean);
      const location = parts.length > 0 ? parts.join(' ') : '未知';
      return NextResponse.json({ location });
    }

    return NextResponse.json({ location: '未知' });
  } catch {
    return NextResponse.json({ location: '未知' });
  }
}
