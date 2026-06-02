import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('articles')
      .select('id, title, content, category_id, is_announcement, sort_order, created_at, updated_at, article_categories(name, icon)')
      .eq('id', id)
      .eq('is_published', true)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: '文章不存在' }, { status: 404 });
    }
    return NextResponse.json({ article: data });
  } catch (err) {
    return NextResponse.json({ error: '获取文章失败' }, { status: 500 });
  }
}
