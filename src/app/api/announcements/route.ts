import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export async function GET() {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ announcements: data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '获取公告失败';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
