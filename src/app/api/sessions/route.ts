import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export async function GET() {
  try {
    const client = getSupabaseClient();
    const { data: sessions, error } = await client
      .from('grab_sessions')
      .select('*')
      .eq('is_active', true)
      .order('start_time', { ascending: true });

    if (error) throw new Error(`查询场次失败: ${error.message}`);

    return NextResponse.json({ sessions: sessions || [] });
  } catch (err) {
    const message = err instanceof Error ? err.message : '查询场次失败';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
