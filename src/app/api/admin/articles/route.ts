import { NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/auth'
import { getSupabaseClient } from '@/storage/database/supabase-client';

export async function GET() {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('articles')
      .select('id, title, content, category_id, image_url, is_published, is_announcement, sort_order, view_count, created_at, updated_at, article_categories(name)')
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
    const { title, content, category_id, image_url, is_published, is_announcement, sort_order, view_count } = body;
    if (!title || !content) return NextResponse.json({ error: '标题和内容不能为空' }, { status: 400 });

    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('articles')
      .insert({ title, content, category_id, image_url: image_url || null, is_published: is_published ?? true, is_announcement: is_announcement ?? false, sort_order: sort_order || 0, view_count: view_count || 0 })
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json({ article: data });
  } catch {
    return NextResponse.json({ error: '创建文章失败' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const admin = await verifyAdminAuth(request as any);
    if (!admin) return NextResponse.json({ error: '未授权' }, { status: 401 });

    const body = await request.json();
    const { id, title, content, category_id, image_url, is_published, is_announcement, sort_order, view_count } = body;
    if (!id) return NextResponse.json({ error: '缺少文章ID' }, { status: 400 });

    const supabase = getSupabaseClient();
    const updates: Record<string, unknown> = {};
    if (title !== undefined) updates.title = title;
    if (content !== undefined) updates.content = content;
    if (category_id !== undefined) updates.category_id = category_id;
    if (image_url !== undefined) updates.image_url = image_url || null;
    if (is_published !== undefined) updates.is_published = is_published;
    if (is_announcement !== undefined) updates.is_announcement = is_announcement;
    if (sort_order !== undefined) updates.sort_order = sort_order;
    if (view_count !== undefined) updates.view_count = view_count;

    const { data, error } = await supabase
      .from('articles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json({ article: data });
  } catch {
    return NextResponse.json({ error: '更新文章失败' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const admin = await verifyAdminAuth(request as any);
    if (!admin) return NextResponse.json({ error: '未授权' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: '缺少文章ID' }, { status: 400 });

    const supabase = getSupabaseClient();
    const { error } = await supabase.from('articles').delete().eq('id', id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: '删除文章失败' }, { status: 500 });
  }
}
