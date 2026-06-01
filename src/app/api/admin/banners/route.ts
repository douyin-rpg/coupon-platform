import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { verifyAdminAuth } from '@/lib/auth';

export async function GET() {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('banners')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return NextResponse.json({ banners: data || [] });
  } catch {
    return NextResponse.json({ error: '获取轮播图失败' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const isAdmin = await verifyAdminAuth(request);
    if (!isAdmin) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }
    const { imageUrl, linkUrl, title, sortOrder } = await request.json();
    if (!imageUrl) {
      return NextResponse.json({ error: '图片链接不能为空' }, { status: 400 });
    }
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('banners')
      .insert({
        image_url: imageUrl,
        link_url: linkUrl || null,
        title: title || null,
        sort_order: sortOrder || 0,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, banner: data });
  } catch {
    return NextResponse.json({ error: '创建轮播图失败' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const isAdmin = await verifyAdminAuth(request);
    if (!isAdmin) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }
    const { id, imageUrl, linkUrl, title, sortOrder, isActive } = await request.json();
    const supabase = getSupabaseClient();
    const updateData: Record<string, unknown> = {};
    if (imageUrl !== undefined) updateData.image_url = imageUrl;
    if (linkUrl !== undefined) updateData.link_url = linkUrl;
    if (title !== undefined) updateData.title = title;
    if (sortOrder !== undefined) updateData.sort_order = sortOrder;
    if (isActive !== undefined) updateData.is_active = isActive;

    const { error } = await supabase
      .from('banners')
      .update(updateData)
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: '更新轮播图失败' }, { status: 500 });
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
      return NextResponse.json({ error: '缺少轮播图ID' }, { status: 400 });
    }
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('banners')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: '删除轮播图失败' }, { status: 500 });
  }
}
