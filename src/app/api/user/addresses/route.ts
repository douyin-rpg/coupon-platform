import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { verifyAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const userId = await verifyAuth(request);
    if (!userId) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', userId)
      .order('is_default', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ addresses: data || [] });
  } catch {
    return NextResponse.json({ error: '获取地址失败' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await verifyAuth(request);
    if (!userId) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }
    const { name, phone, province, city, district, detail, isDefault } = await request.json();
    if (!name || !phone || !detail) {
      return NextResponse.json({ error: '请填写必要信息' }, { status: 400 });
    }

    const supabase = getSupabaseClient();

    if (isDefault) {
      await supabase
        .from('addresses')
        .update({ is_default: false })
        .eq('user_id', userId);
    }

    const { data, error } = await supabase
      .from('addresses')
      .insert({
        user_id: userId,
        name,
        phone,
        province,
        city,
        district,
        detail,
        is_default: isDefault || false,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, address: data });
  } catch {
    return NextResponse.json({ error: '添加地址失败' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = await verifyAuth(request);
    if (!userId) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }
    const { id, name, phone, province, city, district, detail, isDefault } = await request.json();
    const supabase = getSupabaseClient();

    if (isDefault) {
      await supabase
        .from('addresses')
        .update({ is_default: false })
        .eq('user_id', userId);
    }

    const { error } = await supabase
      .from('addresses')
      .update({ name, phone, province, city, district, detail, is_default: isDefault })
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: '更新地址失败' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = await verifyAuth(request);
    if (!userId) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: '缺少地址ID' }, { status: 400 });
    }
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('addresses')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: '删除地址失败' }, { status: 500 });
  }
}
