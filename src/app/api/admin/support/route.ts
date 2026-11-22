import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { verifyAdminAuth } from '@/lib/auth';
import {
  insertMessage,
  touchConversation,
  getConversationById,
  closeConversation,
  reopenConversation,
  listMessages,
  listAllConversations,
  listConversationsByStatus,
  getSupportSettings,
  updateSupportSettings,
  describeDevice,
  type SupportSettings,
} from '@/lib/support';
import { notifyUserChatUpdate, notifyChatUpdate, notifyAllUsers } from '@/ws-handlers/chat';

// GET /api/admin/support - 会话列表（?status=open|closed|all）
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
        .select('username, real_name, id, phone, created_at, verify_status, login_frozen, funds_frozen')
        .eq('id', conversation?.user_id || '')
        .maybeSingle();
      const device = describeDevice(conversation?.visitor_ua);
      return NextResponse.json({ conversation, messages, user: user || null, device });
    }

    const status = request.nextUrl.searchParams.get('status') || 'all';
    const conversations =
      status === 'open'
        ? await listConversationsByStatus('open')
        : status === 'closed'
          ? await listConversationsByStatus('closed')
          : await listAllConversations();
    const settings = await getSupportSettings();
    return NextResponse.json({ conversations, settings });
  } catch {
    return NextResponse.json({ error: '获取会话失败' }, { status: 500 });
  }
}

// POST /api/admin/support - 发送/回复消息（支持图片）
export async function POST(request: NextRequest) {
  try {
    const isAdmin = await verifyAdminAuth(request);
    if (!isAdmin) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const body = await request.json();
    const conversationId = body?.conversationId;
    const content = (body?.content || '').trim();
    const msgType: 'text' | 'image' = body?.msgType === 'image' ? 'image' : 'text';
    const imageUrl = body?.imageUrl;
    if (!conversationId || !content) {
      return NextResponse.json({ error: '参数不完整' }, { status: 400 });
    }

    const conversation = await getConversationById(conversationId);
    if (!conversation) {
      return NextResponse.json({ error: '会话不存在' }, { status: 404 });
    }

    const message = await insertMessage(conversationId, 'admin', content, msgType, imageUrl);
    if (!message) {
      return NextResponse.json({ error: '发送失败' }, { status: 500 });
    }

    const updated = await touchConversation(conversation, message);
    if (updated) {
      try {
        notifyUserChatUpdate(conversation.user_id, {
          type: 'chat:message',
          payload: { conversation: updated, message },
        });
      } catch {
        // ignore
      }
    }

    return NextResponse.json({
      message,
      conversation: updated || conversation,
    });
  } catch {
    return NextResponse.json({ error: '发送失败' }, { status: 500 });
  }
}

// PATCH /api/admin/support - 标记已读 / 关闭会话 / 重开会话 / 更新客服设置
export async function PATCH(request: NextRequest) {
  try {
    const isAdmin = await verifyAdminAuth(request);
    if (!isAdmin) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    // 更新客服设置
    if (action === 'settings') {
      const patch: Partial<SupportSettings> = {};
      if (body.online && ['online', 'busy', 'offline'].includes(body.online)) {
        patch.online = body.online;
      }
      if (typeof body.work_start === 'string') patch.work_start = body.work_start;
      if (typeof body.work_end === 'string') patch.work_end = body.work_end;
      if (typeof body.auto_greeting === 'string') patch.auto_greeting = body.auto_greeting;
      if (Object.keys(patch).length === 0) {
        return NextResponse.json({ error: '参数不完整' }, { status: 400 });
      }
      const settings = await updateSupportSettings(patch);
      try {
        notifyChatUpdate({ type: 'chat:settings:update', payload: { settings } });
        notifyAllUsers({ type: 'chat:status', payload: { settings } });
      } catch {
        // ignore
      }
      return NextResponse.json({ settings });
    }

    const { conversationId } = body;
    if (!conversationId) {
      return NextResponse.json({ error: '参数不完整' }, { status: 400 });
    }

    const conversation = await getConversationById(conversationId);

    if (action === 'close') {
      const closed = await closeConversation(conversationId, 'admin');
      if (!closed) {
        return NextResponse.json({ error: '会话不存在或已关闭' }, { status: 400 });
      }
      try {
        notifyUserChatUpdate(conversation?.user_id || '', {
          type: 'chat:closed',
          payload: { conversation: closed, by: 'admin' },
        });
        notifyChatUpdate({
          type: 'chat:closed',
          payload: { conversation: closed, by: 'admin' },
        });
      } catch {
        // ignore
      }
      return NextResponse.json({ conversation: closed });
    }

    if (action === 'reopen') {
      const reopened = await reopenConversation(conversationId);
      if (!reopened) {
        return NextResponse.json({ error: '会话不存在' }, { status: 400 });
      }
      try {
        notifyUserChatUpdate(reopened.user_id, {
          type: 'chat:reopen',
          payload: { conversation: reopened },
        });
        notifyChatUpdate({ type: 'chat:reopen', payload: { conversation: reopened } });
      } catch {
        // ignore
      }
      return NextResponse.json({ conversation: reopened });
    }

    // 默认：标记已读
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