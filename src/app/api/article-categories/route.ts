import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export async function GET() {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('article_categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });
    if (error) throw error;
    return NextResponse.json({ categories: data });
  } catch {
    return NextResponse.json({ error: '获取分类失败' }, { status: 500 });
  }
}
