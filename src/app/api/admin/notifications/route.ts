import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { verifyAdminAuth } from '@/lib/auth';

// 获取后台通知列表
export async function GET(request: NextRequest) {
  try {
    const admin = await verifyAdminAuth(request);
    if (!admin) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const supabase = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const since = searchParams.get('since');

    let query = supabase
      .from('admin_notifications')
      .select('id, type, title, content, is_read, created_at')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (since) {
      query = query.gt('created_at', since);
    }

    const { data: notifications, error } = await query;
    if (error) {
      return NextResponse.json({ error: '获取通知失败' }, { status: 500 });
    }

    // 计算未读数
    const { count: unreadCount, error: countError } = await supabase
      .from('admin_notifications')
      .select('id', { count: 'exact', head: true })
      .eq('is_read', false);
    if (countError) {
      return NextResponse.json({ error: '获取未读数失败' }, { status: 500 });
    }

    return NextResponse.json({
      notifications: notifications || [],
      unreadCount: unreadCount || 0,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '获取通知失败';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// 标记通知已读
export async function POST(request: NextRequest) {
  try {
    const admin = await verifyAdminAuth(request);
    if (!admin) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const supabase = getSupabaseClient();
    const body = await request.json().catch(() => ({}));
    const { ids, all } = body || {};

    if (all) {
      // 全部标记已读
      const { error } = await supabase
        .from('admin_notifications')
        .update({ is_read: true })
        .eq('is_read', false);
      if (error) {
        return NextResponse.json({ error: '标记失败' }, { status: 500 });
      }
      return NextResponse.json({ success: true });
    }

    // 指定 id 标记已读
    if (Array.isArray(ids) && ids.length > 0) {
      const { error } = await supabase
        .from('admin_notifications')
        .update({ is_read: true })
        .in('id', ids);
      if (error) {
        return NextResponse.json({ error: '标记失败' }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '标记已读失败';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}