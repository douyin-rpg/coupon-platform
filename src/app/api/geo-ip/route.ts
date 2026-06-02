import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/auth';
import { getGeoBatch } from '@/lib/geo-ip';

export async function POST(request: NextRequest) {
  // 需要管理员权限
  const authResult = await verifyAdminAuth(request);
  if (!authResult) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  try {
    const { ips } = await request.json();
    if (!Array.isArray(ips)) {
      return NextResponse.json({ error: '参数错误' }, { status: 400 });
    }

    const geoMap = await getGeoBatch(ips);
    const result: Record<string, string> = {};
    geoMap.forEach((location, ip) => {
      result[ip] = location;
    });

    // 本地IP特殊处理
    for (const ip of ips) {
      if (!result[ip]) {
        if (ip === '127.0.0.1' || ip === '::1' || ip === 'localhost' || !ip) {
          result[ip] = '本地';
        } else {
          result[ip] = '未知';
        }
      }
    }

    return NextResponse.json({ locations: result });
  } catch (error) {
    console.error('Geo IP error:', error);
    return NextResponse.json({ error: '查询失败' }, { status: 500 });
  }
}
