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
    const { data: coupons, error } = await client
      .from('user_coupons')
      .select('id, coupon_id, status, payment_amount, created_at, coupons(name, price, description)')
      .eq('user_id', payload.userId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`查询我的券失败: ${error.message}`);

    return NextResponse.json({ coupons: coupons || [] });
  } catch (err) {
    const message = err instanceof Error ? err.message : '查询我的券失败';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
