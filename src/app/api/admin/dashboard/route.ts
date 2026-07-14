import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { verifyAdminAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const isAdmin = await verifyAdminAuth(request);
  if (!isAdmin) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  const supabase = getSupabaseClient();

  // Get counts from various tables
  const [
    { count: couponCount },
    { count: categoryCount },
    { count: userCount },
    { count: orderCount },
    { count: redemptionCount },
    { count: withdrawalCount },
    { count: bannerCount },
    { count: sessionCount },
  ] = await Promise.all([
    supabase.from('coupons').select('*', { count: 'exact', head: true }),
    supabase.from('categories').select('*', { count: 'exact', head: true }),
    supabase.from('users').select('*', { count: 'exact', head: true }),
    supabase.from('user_coupons').select('*', { count: 'exact', head: true }),
    supabase.from('redemption_requests').select('*', { count: 'exact', head: true }),
    supabase.from('withdrawals').select('*', { count: 'exact', head: true }),
    supabase.from('banners').select('*', { count: 'exact', head: true }),
    supabase.from('grab_sessions').select('*', { count: 'exact', head: true }),
  ]);

  // Get today's and yesterday's stats
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString();

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString();

  const [
    { count: todayUsers },
    { count: yesterdayUsers },
  ] = await Promise.all([
    supabase.from('users').select('*', { count: 'exact', head: true }).gte('created_at', todayStr),
    supabase.from('users').select('*', { count: 'exact', head: true }).gte('created_at', yesterdayStr).lt('created_at', todayStr),
  ]);

  // Get total balance
  const { data: balanceData } = await supabase
    .from('users')
    .select('balance')
    .not('balance', 'is', null);

  const totalBalance = balanceData?.reduce((sum, u) => sum + (u.balance || 0), 0) || 0;

  // Get visitor stats (using transaction logs as proxy for activity)
  const { count: todayTransactions } = await supabase
    .from('transaction_logs')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', todayStr);

  const { count: yesterdayTransactions } = await supabase
    .from('transaction_logs')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', yesterdayStr)
    .lt('created_at', todayStr);

  return NextResponse.json({
    stats: {
      coupons: couponCount || 0,
      categories: categoryCount || 0,
      users: userCount || 0,
      orders: orderCount || 0,
      redemptions: redemptionCount || 0,
      withdrawals: withdrawalCount || 0,
      banners: bannerCount || 0,
      sessions: sessionCount || 0,
      totalBalance,
      todayUsers: todayUsers || 0,
      yesterdayUsers: yesterdayUsers || 0,
      todayTransactions: todayTransactions || 0,
      yesterdayTransactions: yesterdayTransactions || 0,
    },
  });
}
