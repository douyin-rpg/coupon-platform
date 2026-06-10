import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { verifyAdminAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const auth = await verifyAdminAuth(request);
  if (!auth) return NextResponse.json({ error: '未授权' }, { status: 401 });

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('footer_links')
    .select('*')
    .order('section')
    .order('sort_order');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ links: data });
}

export async function POST(request: NextRequest) {
  const auth = await verifyAdminAuth(request);
  if (!auth) return NextResponse.json({ error: '未授权' }, { status: 401 });

  const supabase = getSupabaseClient();
  const body = await request.json();
  const { section, label, url, sort_order } = body;

  if (!section || !label || !url) {
    return NextResponse.json({ error: '缺少必填字段' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('footer_links')
    .insert({ section, label, url, sort_order: sort_order || 0, is_active: true })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ link: data });
}

export async function PUT(request: NextRequest) {
  const auth = await verifyAdminAuth(request);
  if (!auth) return NextResponse.json({ error: '未授权' }, { status: 401 });

  const supabase = getSupabaseClient();
  const body = await request.json();
  const { id, section, label, url, sort_order, is_active } = body;

  if (!id) return NextResponse.json({ error: '缺少ID' }, { status: 400 });

  const updateData: Record<string, unknown> = {};
  if (section !== undefined) updateData.section = section;
  if (label !== undefined) updateData.label = label;
  if (url !== undefined) updateData.url = url;
  if (sort_order !== undefined) updateData.sort_order = sort_order;
  if (is_active !== undefined) updateData.is_active = is_active;

  const { data, error } = await supabase
    .from('footer_links')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ link: data });
}

export async function DELETE(request: NextRequest) {
  const auth = await verifyAdminAuth(request);
  if (!auth) return NextResponse.json({ error: '未授权' }, { status: 401 });

  const supabase = getSupabaseClient();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) return NextResponse.json({ error: '缺少ID' }, { status: 400 });

  const { error } = await supabase.from('footer_links').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
