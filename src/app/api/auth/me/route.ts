import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const payload = await getCurrentUser();
    if (!payload) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const client = getSupabaseClient();
    const { data: user, error } = await client
      .from('users')
      .select('id, username, real_name, is_verified, payment_account, balance')
      .eq('id', payload.userId)
      .maybeSingle();

    if (error) throw new Error(`查询用户失败: ${error.message}`);
    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        realName: user.real_name,
        isVerified: user.is_verified,
        paymentAccount: user.payment_account,
        balance: user.balance,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : '获取用户信息失败';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
