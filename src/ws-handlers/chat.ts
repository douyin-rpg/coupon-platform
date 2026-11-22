import { WebSocket, type WebSocketServer } from 'ws';
import type { IncomingMessage } from 'http';
import { verifyToken } from '../lib/jwt';
import {
  getOrCreateConversation,
  getConversationById,
  insertMessage,
  touchConversation,
  markConversationRead,
  listMessages,
  type ChatConversation,
  type ChatMessage,
} from '../lib/support';

interface ChatEnvelope {
  type: string;
  payload?: Record<string, unknown> | null;
}

// ─── 连接注册表 ────────────────────────────────
const userSockets = new Map<string, Set<WebSocket>>();
const adminSockets = new Set<WebSocket>();

function parseCookies(req: IncomingMessage): Record<string, string> {
  const header = req.headers.cookie || '';
  const out: Record<string, string> = {};
  header.split(';').forEach(pair => {
    const idx = pair.indexOf('=');
    if (idx > -1) {
      const key = pair.slice(0, idx).trim();
      const val = pair.slice(idx + 1).trim();
      if (key) out[key] = decodeURIComponent(val);
    }
  });
  return out;
}

function send(ws: WebSocket, msg: ChatEnvelope) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(msg));
  }
}

function pushToUser(userId: string, msg: ChatEnvelope) {
  const sockets = userSockets.get(userId);
  if (!sockets) return;
  sockets.forEach(s => send(s, msg));
}

function pushToAdmin(msg: ChatEnvelope) {
  adminSockets.forEach(s => send(s, msg));
}

function removeUserSocket(userId: string, ws: WebSocket) {
  const sockets = userSockets.get(userId);
  if (!sockets) return;
  sockets.delete(ws);
  if (sockets.size === 0) userSockets.delete(userId);
}

async function handleSend(ws: WebSocket, userId: string, content: string) {
  const conversation = await getOrCreateConversation(userId);
  if (!conversation) return;
  const message = await insertMessage(conversation.id, 'user', content);
  if (!message) return;
  const updated = await touchConversation(conversation, message);
  pushToAdmin({
    type: 'chat:message',
    payload: { conversation: updated || conversation, message },
  });
  send(ws, {
    type: 'chat:message',
    payload: { conversation: updated || conversation, message },
  });
}

async function handleAdminSend(ws: WebSocket, conversationId: string, content: string) {
  const conversation = await getConversationById(conversationId);
  if (!conversation) return;
  const message = await insertMessage(conversationId, 'admin', content);
  if (!message) return;
  const updated = await touchConversation(conversation, message);
  if (updated) {
    pushToUser(conversation.user_id, {
      type: 'chat:message',
      payload: { conversation: updated, message },
    });
    pushToAdmin({
      type: 'chat:message',
      payload: { conversation: updated, message },
    });
  }
}

// ─── 处理器 ────────────────────────────────────
export function setupChatHandler(wss: WebSocketServer) {
  wss.on('connection', async (ws: WebSocket, req: IncomingMessage) => {
    const cookies = parseCookies(req);

    // 管理员连接
    const adminPayload = await verifyToken(cookies['admin_token'] || '');
    if (adminPayload?.isAdmin) {
      adminSockets.add(ws);
      send(ws, { type: 'chat:ready', payload: { role: 'admin' } });

      ws.on('message', async (raw) => {
        let msg: ChatEnvelope;
        try {
          msg = JSON.parse(raw.toString());
        } catch {
          return;
        }
        if (msg.type === 'ping') {
          send(ws, { type: 'pong', payload: null });
          return;
        }
        if (msg.type === 'chat:send') {
          const p = (msg.payload || {}) as { conversationId?: string; content?: string };
          const content = (p.content || '').trim();
          const conversationId = p.conversationId;
          if (!content || !conversationId) return;
          await handleAdminSend(ws, conversationId, content);
        }
        if (msg.type === 'chat:open' || msg.type === 'chat:read') {
          const p = (msg.payload || {}) as { conversationId?: string };
          if (!p.conversationId) return;
          await markConversationRead(p.conversationId, 'admin');
          pushToAdmin({
            type: 'chat:read',
            payload: { conversationId: p.conversationId, role: 'admin' },
          });
        }
      });

      ws.on('close', () => {
        adminSockets.delete(ws);
      });
      return;
    }

    // 用户连接
    const userPayload = await verifyToken(cookies['auth_token'] || '');
    if (!userPayload?.userId) {
      send(ws, { type: 'chat:error', payload: { message: '未登录或登录已过期' } });
      ws.close();
      return;
    }
    const userId = userPayload.userId;

    if (!userSockets.has(userId)) userSockets.set(userId, new Set());
    userSockets.get(userId)!.add(ws);

    // 先注册消息监听（避免 await 期间客户端消息丢失）
    ws.on('message', async (raw) => {
      let msg: ChatEnvelope;
      try {
        msg = JSON.parse(raw.toString());
      } catch {
        return;
      }
      if (msg.type === 'ping') {
        send(ws, { type: 'pong', payload: null });
        return;
      }
      if (msg.type === 'chat:send') {
        const p = (msg.payload || {}) as { content?: string };
        const content = (p.content || '').trim();
        if (!content) return;
        await handleSend(ws, userId, content);
      }
      if (msg.type === 'chat:read') {
        const p = (msg.payload || {}) as { conversationId?: string };
        if (p.conversationId) {
          await markConversationRead(p.conversationId, 'user');
          pushToAdmin({
            type: 'chat:read',
            payload: { conversationId: p.conversationId, role: 'user' },
          });
        }
      }
    });

    ws.on('close', () => {
      removeUserSocket(userId, ws);
    });

    send(ws, { type: 'chat:ready', payload: { role: 'user' } });

    // 获取/创建会话，并推送历史
    try {
      const conversation = await getOrCreateConversation(userId);
      if (conversation) {
        const messages = await listMessages(conversation.id);
        send(ws, {
          type: 'chat:init',
          payload: { conversation, messages: messages as ChatMessage[] },
        });
        await markConversationRead(conversation.id, 'user');
        pushToAdmin({
          type: 'chat:read',
          payload: { conversationId: conversation.id, role: 'user' },
        });
      }
    } catch {
      // ignore
    }
  });
}

// 导出供 REST API 使用的推送能力（离线兜底）
export function notifyChatUpdate(event: ChatEnvelope) {
  pushToAdmin(event);
}

export function notifyUserChatUpdate(userId: string, event: ChatEnvelope) {
  pushToUser(userId, event);
}

export type { ChatConversation, ChatMessage };