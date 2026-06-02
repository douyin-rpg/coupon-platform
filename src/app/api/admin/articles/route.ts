import { NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/auth'
import { getSupabaseClient } from '@/storage/database/supabase-client';

export async function GET() {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('articles')
      .select('id, title, content, category_id, is_published, is_announcement, sort_order, created_at, updated_at, article_categories(name)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return NextResponse.json({ articles: data });
  } catch {
    return NextResponse.json({ error: '获取文章失败' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const admin = await verifyAdminAuth(request as any);
    if (!admin) return NextResponse.json({ error: '未授权' }, { status: 401 });

    const body = await request.json();
    const { title, content, category_id, is_published, is_announcement, sort_order } = body;
    if (!title || !content) return NextResponse.json({ error: '标题和内容不能为空' }, { status: 400 });

    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('articles')
      .insert({ title, content, category_id, is_published: is_published ?? true, is_announcement: is_announcement ?? false, sort_order: sort_order || 0 })
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json({ article: data });
  } catch {
    return NextResponse.json({ error: '创建文章失败' }, { status: 500 });
  }
}
