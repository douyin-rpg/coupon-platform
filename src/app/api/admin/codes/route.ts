import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { getAdminUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const payload = await getAdminUser();
    if (!payload?.isAdmin) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const client = getSupabaseClient();
    const { data: codes, error } = await client
      .from('registration_codes')
      .select('*, users(username)')
      .order('created_at', { ascending: false });

    if (error) throw new Error(`查询注册码失败: ${error.message}`);

    return NextResponse.json({ codes: codes || [] });
  } catch (err) {
    const message = err instanceof Error ? err.message : '查询注册码失败';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await getAdminUser();
    if (!payload?.isAdmin) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const body = await request.json();
    const { code, max_uses, description } = body;

    if (!code) {
      return NextResponse.json({ error: '请填写注册码' }, { status: 400 });
    }

    const client = getSupabaseClient();
    const { data, error } = await client
      .from('registration_codes')
      .insert({
        code,
        max_uses: parseInt(String(max_uses)) || 1,
        current_uses: 0,
        is_used: false,
        description: description || null,
      })
      .select()
      .single();

    if (error) throw new Error(`创建注册码失败: ${error.message}`);

    return NextResponse.json({ success: true, registrationCode: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : '创建注册码失败';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const payload = await getAdminUser();
    if (!payload?.isAdmin) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: '缺少注册码ID' }, { status: 400 });
    }

    const client = getSupabaseClient();
    const { error } = await client
      .from('registration_codes')
      .delete()
      .eq('id', id);

    if (error) throw new Error(`删除注册码失败: ${error.message}`);

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : '删除注册码失败';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
