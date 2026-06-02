import { NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/auth'
import { getSupabaseClient } from '@/storage/database/supabase-client';

export async function GET() {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('article_categories')
      .select('*')
      .order('sort_order', { ascending: true });
    if (error) throw error;
    return NextResponse.json({ categories: data });
  } catch {
    return NextResponse.json({ error: '获取分类失败' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const admin = await verifyAdminAuth(request as any);
    if (!admin) return NextResponse.json({ error: '未授权' }, { status: 401 });

    const body = await request.json();
    const { name, icon, sort_order } = body;
    if (!name) return NextResponse.json({ error: '分类名不能为空' }, { status: 400 });

    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('article_categories')
      .insert({ name, icon: icon || '📄', sort_order: sort_order || 0 })
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json({ category: data });
  } catch {
    return NextResponse.json({ error: '创建分类失败' }, { status: 500 });
  }
}
