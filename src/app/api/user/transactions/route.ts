import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { verifyAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const userId = await verifyAuth(request);
    if (!userId) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('transaction_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ transactions: data || [] });
  } catch {
    return NextResponse.json({ error: '获取交易记录失败' }, { status: 500 });
  }
}
