import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { verifyAdminAuth } from '@/lib/auth';
import {
  insertMessage,
  touchConversation,
  getConversationById,
  listMessages,
  listAllConversations,
} from '@/lib/support';

// GET /api/admin/support - 会话列表
// GET /api/admin/support?conversationId=xxx - 指定会话消息历史
export async function GET(request: NextRequest) {
  try {
    const isAdmin = await verifyAdminAuth(request);
    if (!isAdmin) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const conversationId = request.nextUrl.searchParams.get('conversationId');
    if (conversationId) {
      const conversation = await getConversationById(conversationId);
      const messages = await listMessages(conversationId);
      const supabase = getSupabaseClient();
      const { data: user } = await supabase
        .from('users')
        .select('username, real_name, id')
        .eq('id', conversation?.user_id || '')
        .maybeSingle();
      return NextResponse.json({ conversation, messages, user: user || null });
    }

    const conversations = await listAllConversations();
    return NextResponse.json({ conversations });
  } catch {
    return NextResponse.json({ error: '获取会话失败' }, { status: 500 });
  }
}

// POST /api/admin/support - 发送/回复消息
export async function POST(request: NextRequest) {
  try {
    const isAdmin = await verifyAdminAuth(request);
    if (!isAdmin) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const body = await request.json();
    const conversationId = body?.conversationId;
    const content = (body?.content || '').trim();
    if (!conversationId || !content) {
      return NextResponse.json({ error: '参数不完整' }, { status: 400 });
    }

    const conversation = await getConversationById(conversationId);
    if (!conversation) {
      return NextResponse.json({ error: '会话不存在' }, { status: 404 });
    }

    const message = await insertMessage(conversationId, 'admin', content);
    if (!message) {
      return NextResponse.json({ error: '发送失败' }, { status: 500 });
    }

    const updated = await touchConversation(conversation, message);

    return NextResponse.json({
      message,
      conversation: updated || conversation,
    });
  } catch {
    return NextResponse.json({ error: '发送失败' }, { status: 500 });
  }
}

// PATCH /api/admin/support - 标记会话已读
export async function PATCH(request: NextRequest) {
  try {
    const isAdmin = await verifyAdminAuth(request);
    if (!isAdmin) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const body = await request.json();
    const { conversationId } = body;
    if (!conversationId) {
      return NextResponse.json({ error: '参数不完整' }, { status: 400 });
    }

    const supabase = getSupabaseClient();
    await supabase.from('chat_conversations').update({ unread_admin: 0 }).eq('id', conversationId);
    await supabase
      .from('chat_messages')
      .update({ is_read: true })
      .eq('conversation_id', conversationId)
      .eq('sender', 'user');

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: '操作失败' }, { status: 500 });
  }
}