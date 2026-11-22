import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import {
  getOrCreateConversation,
  insertMessage,
  touchConversation,
  markConversationRead,
  listMessages,
} from '@/lib/support';

// GET /api/user/support - 获取我的会话（不存在则创建）与消息历史
export async function GET(request: NextRequest) {
  try {
    const userId = await verifyAuth(request);
    if (!userId) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const conversation = await getOrCreateConversation(userId);
    if (!conversation) {
      return NextResponse.json({ error: '创建会话失败' }, { status: 500 });
    }

    const messages = await listMessages(conversation.id);

    return NextResponse.json({ conversation, messages });
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
    if (!content) {
      return NextResponse.json({ error: '消息不能为空' }, { status: 400 });
    }
    if (content.length > 2000) {
      return NextResponse.json({ error: '消息过长（最多2000字）' }, { status: 400 });
    }

    const conversation = await getOrCreateConversation(userId);
    if (!conversation) {
      return NextResponse.json({ error: '创建会话失败' }, { status: 500 });
    }

    const message = await insertMessage(conversation.id, 'user', content);
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