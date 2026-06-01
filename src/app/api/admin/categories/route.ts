import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { verifyAdminAuth } from '@/lib/auth';

export async function GET() {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return NextResponse.json({ categories: data || [] });
  } catch {
    return NextResponse.json({ error: '获取分类失败' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const isAdmin = await verifyAdminAuth(request);
    if (!isAdmin) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }
    const { name, icon, sortOrder } = await request.json();
    if (!name) {
      return NextResponse.json({ error: '分类名称不能为空' }, { status: 400 });
    }
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('categories')
      .insert({ name, icon: icon || '📦', sort_order: sortOrder || 0 })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, category: data });
  } catch {
    return NextResponse.json({ error: '创建分类失败' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const isAdmin = await verifyAdminAuth(request);
    if (!isAdmin) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }
    const { id, name, icon, sortOrder, isActive } = await request.json();
    const supabase = getSupabaseClient();
    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (icon !== undefined) updateData.icon = icon;
    if (sortOrder !== undefined) updateData.sort_order = sortOrder;
    if (isActive !== undefined) updateData.is_active = isActive;

    const { error } = await supabase
      .from('categories')
      .update(updateData)
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: '更新分类失败' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const isAdmin = await verifyAdminAuth(request);
    if (!isAdmin) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: '缺少分类ID' }, { status: 400 });
    }
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: '删除分类失败' }, { status: 500 });
  }
}
