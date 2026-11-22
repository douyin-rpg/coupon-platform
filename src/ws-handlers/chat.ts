import { WebSocket, type WebSocketServer } from 'ws';
import type { IncomingMessage } from 'http';
import { verifyToken } from '../lib/jwt';
import {
  getOrCreateConversation,
  getConversationById,
  insertMessage,
  touchConversation,
  markConversationRead,
  closeConversation,
  reopenConversation,
  listMessages,
  getSupportSettings,
  updateSupportSettings,
  type ChatConversation,
  type ChatMessage,
  type SupportSettings,
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
  if (userId === '*') {
    userSockets.forEach(sockets => sockets.forEach(s => send(s, msg)));
    return;
  }
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

async function sendToUser(ws: WebSocket, userId: string, content: string, msgType: 'text' | 'image' = 'text', imageUrl?: string) {
  const conversation = await getOrCreateConversation(userId, {
    ip: (ws as WebSocket & { __ip?: string }).__ip,
    ua: (ws as WebSocket & { __ua?: string }).__ua,
  });
  if (!conversation) return;
  if (conversation.status === 'closed') {
    await reopenConversation(conversation.id);
    conversation.status = 'open';
    conversation.closed_by = null;
    conversation.closed_at = null;
    pushToAdmin({
      type: 'chat:reopen',
      payload: { conversationId: conversation.id, userId },
    });
  }
  const message = await insertMessage(conversation.id, 'user', content, msgType, imageUrl);
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

async function sendToAdmin(ws: WebSocket, conversationId: string, content: string, msgType: 'text' | 'image' = 'text', imageUrl?: string) {
  const conversation = await getConversationById(conversationId);
  if (!conversation) return;
  if (conversation.status === 'closed') {
    await reopenConversation(conversation.id);
    conversation.status = 'open';
    conversation.closed_by = null;
    conversation.closed_at = null;
    pushToUser(conversation.user_id, {
      type: 'chat:reopen',
      payload: { conversationId: conversation.id },
    });
  }
  const message = await insertMessage(conversationId, 'admin', content, msgType, imageUrl);
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
      const settings = await getSupportSettings();
      send(ws, { type: 'chat:ready', payload: { role: 'admin', settings } });

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
          const p = (msg.payload || {}) as {
            conversationId?: string;
            content?: string;
            msgType?: 'text' | 'image';
            imageUrl?: string;
          };
          const content = (p.content || '').trim();
          const conversationId = p.conversationId;
          if (!content || !conversationId) return;
          await sendToAdmin(ws, conversationId, content, p.msgType || 'text', p.imageUrl);
        }
        if (msg.type === 'chat:close') {
          const p = (msg.payload || {}) as { conversationId?: string };
          if (!p.conversationId) return;
          const conv = await closeConversation(p.conversationId, 'admin');
          if (conv) {
            pushToUser(conv.user_id, {
              type: 'chat:closed',
              payload: { conversation: conv, by: 'admin' },
            });
            pushToAdmin({
              type: 'chat:closed',
              payload: { conversation: conv, by: 'admin' },
            });
          }
        }
        if (msg.type === 'chat:settings') {
          const p = (msg.payload || {}) as Partial<SupportSettings>;
          if (Object.keys(p).length === 0) return;
          const settings = await updateSupportSettings(p);
          // 广播最新客服设置给所有在线用户
          pushToUser('*', { type: 'chat:status', payload: { settings } });
          pushToAdmin({ type: 'chat:settings:update', payload: { settings } });
          send(ws, { type: 'chat:settings:update', payload: { settings } });
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

    // 记录访客 IP / UA（连接握手时获取）
    const cfIp = req.headers['x-forwarded-for']?.toString().split(',')[0].trim();
    const realIp = req.headers['x-real-ip']?.toString();
    const ip = cfIp || realIp || req.socket.remoteAddress || '';
    const ua = req.headers['user-agent'] || '';
    (ws as WebSocket & { __ip?: string; __ua?: string }).__ip = ip;
    (ws as WebSocket & { __ip?: string; __ua?: string }).__ua = ua;

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
        const p = (msg.payload || {}) as {
          content?: string;
          msgType?: 'text' | 'image';
          imageUrl?: string;
        };
        const content = (p.content || '').trim();
        if (!content) return;
        await sendToUser(ws, userId, content, p.msgType || 'text', p.imageUrl);
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

    // 获取/创建会话，并推送历史 + 客服状态
    try {
      const conversation = await getOrCreateConversation(userId, { ip, ua });
      if (conversation) {
        const messages = await listMessages(conversation.id);
        const settings = await getSupportSettings();
        send(ws, {
          type: 'chat:init',
          payload: { conversation, messages: messages as ChatMessage[], settings },
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

export function notifyAllUsers(event: ChatEnvelope) {
  userSockets.forEach(sockets => sockets.forEach(s => send(s, event)));
}

export type { ChatConversation, ChatMessage, SupportSettings };