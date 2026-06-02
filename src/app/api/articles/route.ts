import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export async function GET(request: Request) {
  try {
    const supabase = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('category_id');

    let query = supabase
      .from('articles')
      .select('id, title, content, category_id, is_announcement, sort_order, created_at, article_categories(name, icon)')
      .eq('is_published', true)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json({ articles: data });
  } catch (err) {
    return NextResponse.json({ error: '获取文章失败' }, { status: 500 });
  }
}
