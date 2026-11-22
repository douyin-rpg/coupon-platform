import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import {
  getOrCreateConversation,
  insertMessage,
  touchConversation,
  markConversationRead,
  listMessages,
  getClientIp,
  getSupportSettings,
} from '@/lib/support';
import { getSupabaseAdminClient } from '@/storage/database/supabase-client';
import { notifyChatUpdate } from '@/ws-handlers/chat';

function getUa(request: NextRequest): string {
  return request.headers.get('user-agent') || '';
}

// GET /api/user/support - 获取我的会话（不存在则创建）与消息历史 + 客服状态
export async function GET(request: NextRequest) {
  try {
    const userId = await verifyAuth(request);
    if (!userId) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const ip = getClientIp(request);
    const ua = getUa(request);
    const conversation = await getOrCreateConversation(userId, { ip, ua });
    if (!conversation) {
      return NextResponse.json({ error: '创建会话失败' }, { status: 500 });
    }

    const messages = await listMessages(conversation.id);
    const settings = await getSupportSettings();

    return NextResponse.json({ conversation, messages, settings });
  } catch {
    return NextResponse.json({ error: '获取会话失败' }, { status: 500 });
  }
}

// POST /api/user/support - 发送消息（WS 不可用时的 REST 兜底）
export async function POST(request: NextRequest) {
  try {
    const userId = await verifyAuth(request);
    if (!userId) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const body = await request.json();
    const content = (body?.content || '').trim();
    const msgType: 'text' | 'image' = body?.msgType === 'image' ? 'image' : 'text';
    const imageUrl = body?.imageUrl;
    if (!content) {
      return NextResponse.json({ error: '消息不能为空' }, { status: 400 });
    }
    if (msgType === 'text' && content.length > 2000) {
      return NextResponse.json({ error: '消息过长（最多2000字）' }, { status: 400 });
    }

    const ip = getClientIp(request);
    const ua = getUa(request);
    const conversation = await getOrCreateConversation(userId, { ip, ua });
    if (!conversation) {
      return NextResponse.json({ error: '创建会话失败' }, { status: 500 });
    }

    const message = await insertMessage(conversation.id, 'user', content, msgType, imageUrl);
    if (!message) {
      return NextResponse.json({ error: '发送失败' }, { status: 500 });
    }

    const updated = await touchConversation(conversation, message);

    // 实时推送（兜底：WS 断开场景下仍尝试推送在线管理员）
    try {
      notifyChatUpdate({
        type: 'chat:message',
        payload: { conversation: updated || conversation, message },
      });
    } catch {
      // ignore
    }

    return NextResponse.json({
      message,
      conversation: updated || conversation,
    });
  } catch {
    return NextResponse.json({ error: '发送失败' }, { status: 500 });
  }
}