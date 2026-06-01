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
      .select('balance, verify_status')
      .eq('id', payload.userId)
      .maybeSingle();

    if (error) throw new Error(`查询余额失败: ${error.message}`);
    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 });
    }

    return NextResponse.json({
      balance: user.balance,
      isVerified: user.verify_status === 'verified',
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : '查询余额失败';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
