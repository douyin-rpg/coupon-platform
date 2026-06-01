import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { verifyAdminAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const admin = await verifyAdminAuth(request);
  if (!admin) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  const supabase = getSupabaseClient();
  const since = new URL(request.url).searchParams.get('since');

  const sinceTime = since || new Date(Date.now() - 60000).toISOString();

  // 查询新增的抢券订单
  const { data: newOrders } = await supabase
    .from('user_coupons')
    .select('id, created_at, users(username), coupons(name, price)')
    .gte('created_at', sinceTime)
    .order('created_at', { ascending: false })
    .limit(10);

  // 查询新增的回兑申请
  const { data: newRedemptions } = await supabase
    .from('redemption_requests')
    .select('id, created_at, users(username)')
    .eq('status', 'pending')
    .gte('created_at', sinceTime)
    .order('created_at', { ascending: false })
    .limit(10);

  // 查询新增的提现申请
  const { data: newWithdrawals } = await supabase
    .from('withdrawals')
    .select('id, created_at, amount, users(username)')
    .eq('status', 'pending')
    .gte('created_at', sinceTime)
    .order('created_at', { ascending: false })
    .limit(10);

  // 查询新增的实名认证申请
  const { data: newVerifications } = await supabase
    .from('users')
    .select('id, username, verify_status, updated_at')
    .eq('verify_status', 'pending')
    .gte('updated_at', sinceTime)
    .order('updated_at', { ascending: false })
    .limit(10);

  const hasNew =
    (newOrders && newOrders.length > 0) ||
    (newRedemptions && newRedemptions.length > 0) ||
    (newWithdrawals && newWithdrawals.length > 0) ||
    (newVerifications && newVerifications.length > 0);

  return NextResponse.json({
    hasNew,
    orders: newOrders || [],
    redemptions: newRedemptions || [],
    withdrawals: newWithdrawals || [],
    verifications: newVerifications || [],
  });
}
