import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { getAdminUser } from '@/lib/auth';

export async function GET() {
  try {
    const payload = await getAdminUser();
    if (!payload?.isAdmin) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const client = getSupabaseClient();
    const { data: sessions, error } = await client
      .from('grab_sessions')
      .select('*')
      .order('start_time', { ascending: true });

    if (error) throw new Error(`查询场次失败: ${error.message}`);

    return NextResponse.json({ sessions: sessions || [] });
  } catch (err) {
    const message = err instanceof Error ? err.message : '查询场次失败';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = await getAdminUser();
    if (!payload?.isAdmin) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const { name, startTime, endTime } = await request.json();

    if (!name || !startTime || !endTime) {
      return NextResponse.json({ error: '请填写所有字段' }, { status: 400 });
    }

    const client = getSupabaseClient();
    const { data, error } = await client
      .from('grab_sessions')
      .insert({
        name,
        start_time: startTime,
        end_time: endTime,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw new Error(`创建场次失败: ${error.message}`);

    return NextResponse.json({ success: true, session: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : '创建场次失败';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const payload = await getAdminUser();
    if (!payload?.isAdmin) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const { id, name, startTime, endTime, isActive } = await request.json();

    if (!id) {
      return NextResponse.json({ error: '缺少场次ID' }, { status: 400 });
    }

    const client = getSupabaseClient();
    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (name !== undefined) updateData.name = name;
    if (startTime !== undefined) updateData.start_time = startTime;
    if (endTime !== undefined) updateData.end_time = endTime;
    if (isActive !== undefined) updateData.is_active = isActive;

    const { error } = await client
      .from('grab_sessions')
      .update(updateData)
      .eq('id', id);

    if (error) throw new Error(`更新场次失败: ${error.message}`);

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : '更新场次失败';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const payload = await getAdminUser();
    if (!payload?.isAdmin) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: '缺少场次ID' }, { status: 400 });
    }

    const client = getSupabaseClient();
    const { error } = await client
      .from('grab_sessions')
      .delete()
      .eq('id', id);

    if (error) throw new Error(`删除场次失败: ${error.message}`);

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : '删除场次失败';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
