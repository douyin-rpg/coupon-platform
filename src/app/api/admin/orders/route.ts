import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { getAdminUser } from '@/lib/auth';

// GET: List all orders (user_coupons)
export async function GET() {
  try {
    const payload = await getAdminUser();
    if (!payload?.isAdmin) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const client = getSupabaseClient();
    const { data: orders, error } = await client
      .from('user_coupons')
      .select('id, user_id, coupon_id, status, payment_amount, created_at, verification_code, paid_at, updated_at, coupons(id, name, price, image_url), users(id, username, real_name)')
      .order('created_at', { ascending: false });

    if (error) throw new Error(`查询订单失败: ${error.message}`);

    return NextResponse.json({ orders: orders || [] });
  } catch (err) {
    const message = err instanceof Error ? err.message : '查询订单失败';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
