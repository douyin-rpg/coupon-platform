import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { verifyAdminAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const isAdmin = await verifyAdminAuth(request);
  if (!isAdmin) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '20');
  const type = searchParams.get('type') || '';
  const userId = searchParams.get('userId') || '';
  const transactionNo = searchParams.get('transactionNo') || '';
  const startDate = searchParams.get('startDate') || '';
  const endDate = searchParams.get('endDate') || '';

  const supabase = getSupabaseClient();

  let query = supabase
    .from('transaction_logs')
    .select('*, users!inner(username, real_name)', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (type) {
    query = query.eq('type', type);
  }
  if (userId) {
    query = query.eq('user_id', userId);
  }
  if (transactionNo) {
    query = query.ilike('transaction_no', `%${transactionNo}%`);
  }
  if (startDate) {
    query = query.gte('created_at', startDate);
  }
  if (endDate) {
    query = query.lte('created_at', `${endDate}T23:59:59`);
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    transactions: data || [],
    total: count || 0,
    page,
    pageSize,
  });
}
