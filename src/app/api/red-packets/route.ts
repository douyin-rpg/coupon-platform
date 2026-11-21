import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { verifyAuth } from '@/lib/auth';

// 获取当前用户待领取的红包列表
export async function GET(request: NextRequest) {
  try {
    const userId = await verifyAuth(request);
    if (!userId) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('red_packets')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Fetch red packets failed:', error);
      return NextResponse.json({ error: '获取红包失败' }, { status: 500 });
    }

    return NextResponse.json({ red_packets: data || [], total: (data || []).length });
  } catch (error) {
    console.error('Fetch red packets error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}