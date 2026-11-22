import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/auth';
import { listQuickReplies, createQuickReply, deleteQuickReply } from '@/lib/support';

// GET /api/admin/quick-replies - 话术库列表
export async function GET(request: NextRequest) {
  try {
    const isAdmin = await verifyAdminAuth(request);
    if (!isAdmin) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }
    const replies = await listQuickReplies();
    return NextResponse.json({ replies });
  } catch {
    return NextResponse.json({ error: '获取话术失败' }, { status: 500 });
  }
}

// POST /api/admin/quick-replies - 新增话术
export async function POST(request: NextRequest) {
  try {
    const isAdmin = await verifyAdminAuth(request);
    if (!isAdmin) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }
    const body = await request.json();
    const content = (body?.content || '').trim();
    if (!content) {
      return NextResponse.json({ error: '话术内容不能为空' }, { status: 400 });
    }
    if (content.length > 500) {
      return NextResponse.json({ error: '话术过长（最多500字）' }, { status: 400 });
    }
    const reply = await createQuickReply({
      content,
      category: (body?.category || '通用').toString().slice(0, 50),
      sort_order: Number(body?.sort_order) || 0,
    });
    if (!reply) {
      return NextResponse.json({ error: '新增失败' }, { status: 500 });
    }
    return NextResponse.json({ reply });
  } catch {
    return NextResponse.json({ error: '新增失败' }, { status: 500 });
  }
}

// DELETE /api/admin/quick-replies?id=xxx - 删除话术（软删除）
export async function DELETE(request: NextRequest) {
  try {
    const isAdmin = await verifyAdminAuth(request);
    if (!isAdmin) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }
    const id = request.nextUrl.searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: '参数不完整' }, { status: 400 });
    }
    const ok = await deleteQuickReply(id);
    if (!ok) {
      return NextResponse.json({ error: '删除失败' }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: '删除失败' }, { status: 500 });
  }
}