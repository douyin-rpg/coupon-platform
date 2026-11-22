'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { createWsConnection, type WsConnection } from '@/lib/ws-client';
import { HeadphoneIcon, ArrowLeftIcon, MessageIcon, CheckCircleIcon } from '@/components/icons';
import type { ChatConversation, ChatMessage } from '@/lib/support';

interface ConversationItem extends ChatConversation {
  users?: { username: string; real_name: string } | null;
}

interface UserInfo {
  id: string;
  username: string;
  real_name: string;
}

export default function AdminSupportPage() {
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeUser, setActiveUser] = useState<UserInfo | null>(null);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [connected, setConnected] = useState(false);
  const [mobileChatOpen, setMobileChatOpen] = useState(false);
  const connRef = useRef<WsConnection | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    });
  }, []);

  // 拉取会话列表
  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/support');
      if (res.status === 401) {
        window.location.href = '/admin';
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // 拉取指定会话消息
  const loadMessages = useCallback(
    async (conversationId: string) => {
      try {
        const res = await fetch(`/api/admin/support?conversationId=${conversationId}`);
        if (res.ok) {
          const data = await res.json();
          setMessages(data.messages || []);
          setActiveUser(data.user || null);
          setLoadFailed(false);
          scrollToBottom();
        }
      } catch {
        setLoadFailed(true);
      }
    },
    [scrollToBottom],
  );

  const selectConversation = useCallback(
    (id: string) => {
      setActiveId(id);
      setMobileChatOpen(true);
      loadMessages(id);
      // 标记已读
      fetch('/api/admin/support', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: id }),
      }).then(() => {
        setConversations(prev =>
          prev.map(c => (c.id === id ? { ...c, unread_admin: 0 } : c)),
        );
      }).catch(() => {});
    },
    [loadMessages],
  );

  // WebSocket
  useEffect(() => {
    const conn = createWsConnection({
      path: '/ws/chat',
      onOpen: () => setConnected(true),
      onClose: () => setConnected(false),
      onError: () => setConnected(false),
      onMessage: (msg) => {
        if (msg.type === 'chat:ready') return;
        if (msg.type === 'chat:list') {
          const p = (msg.payload || {}) as { conversations: ConversationItem[] };
          setConversations(p.conversations || []);
          return;
        }
        if (msg.type === 'chat:new') {
          const p = (msg.payload || {}) as { conversation: ConversationItem };
          setConversations(prev => {
            const exists = prev.some(c => c.id === p.conversation.id);
            if (exists) return prev.map(c => (c.id === p.conversation.id ? p.conversation : c));
            return [p.conversation, ...prev];
          });
          return;
        }
        if (msg.type === 'chat:message') {
          const p = (msg.payload || {}) as {
            conversation: ConversationItem;
            message: ChatMessage;
          };
          setConversations(prev => {
            const exists = prev.some(c => c.id === p.conversation.id);
            if (exists) {
              return prev.map(c => (c.id === p.conversation.id ? p.conversation : c));
            }
            return [p.conversation, ...prev];
          });
          if (activeRef.current === p.conversation.id) {
            setMessages(prev =>
              prev.some(m => m.id === p.message.id) ? prev : [...prev, p.message],
            );
            scrollToBottom();
          }
          return;
        }
        if (msg.type === 'chat:read') {
          const p = (msg.payload || {}) as { conversationId?: string; role?: string };
          if (p.conversationId) {
            setConversations(prev =>
              prev.map(c =>
                c.id === p.conversationId
                  ? { ...c, unread_admin: p.role === 'admin' ? 0 : c.unread_admin }
                  : c,
              ),
            );
          }
        }
      },
    });
    connRef.current = conn;
    return () => {
      conn.close();
      connRef.current = null;
    };
  }, [scrollToBottom]);

  // 轮询兜底
  useEffect(() => {
    if (connected) return;
    const timer = setInterval(() => {
      fetchConversations();
    }, 5000);
    return () => clearInterval(timer);
  }, [connected, fetchConversations]);

  const activeRef = useRef<string | null>(null);
  activeRef.current = activeId;

  const handleSend = async () => {
    const text = input.trim();
    if (!text || !activeId || sending) return;
    setInput('');

    // WS 优先
    if (connRef.current && connRef.current.readyState === WebSocket.OPEN) {
      connRef.current.send({ type: 'chat:send', payload: { conversationId: activeId, content: text } });
      return;
    }

    // REST 兜底
    setSending(true);
    try {
      const res = await fetch('/api/admin/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: activeId, content: text }),
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(prev =>
          prev.some(m => m.id === data.message.id) ? prev : [...prev, data.message],
        );
        setConversations(prev =>
          prev.map(c => (c.id === activeId ? data.conversation || c : c)),
        );
        scrollToBottom();
      }
    } catch {
      // ignore
    } finally {
      setSending(false);
    }
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const sameDay = d.toDateString() === now.toDateString();
    const hm = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    if (sameDay) return hm;
    if (d.getFullYear() === now.getFullYear()) return `${d.getMonth() + 1}/${d.getDate()} ${hm}`;
    return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
  };

  const activeConversation = conversations.find(c => c.id === activeId) || null;

  return (
    <div className="p-4 sm:p-6">
      {/* 页头 */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#1890FF] to-[#00D4FF] flex items-center justify-center">
              <HeadphoneIcon className="w-4 h-4 text-white" filled />
            </span>
            在线客服
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            实时回应访客咨询 ·{' '}
            <span className={connected ? 'text-green-500' : 'text-amber-500'}>
              {connected ? '● 实时通道已连接' : '○ 轮询模式（实时通道不可用）'}
            </span>
          </p>
        </div>
        <button
          onClick={fetchConversations}
          className="text-xs text-gray-500 bg-white border border-gray-200 rounded-lg px-3 py-1.5 hover:text-[#1890FF] hover:border-[#1890FF]/40 transition-colors"
        >
          刷新列表
        </button>
      </div>

      {/* 工作台 */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex h-[calc(100vh-220px)] min-h-[420px]">
          {/* 会话列表（移动端抽屉） */}
          <div className={`${mobileChatOpen ? 'hidden' : 'flex'} md:flex w-full md:w-72 border-r border-gray-100 flex-col flex-shrink-0`}>
            <div className="px-4 py-3 border-b border-gray-50 text-[12px] font-medium text-gray-400 flex items-center justify-between">
              <span>全部会话</span>
              <span className="bg-blue-50 text-[#1890FF] rounded-full px-2 py-0.5 text-[11px] font-semibold">
                {conversations.length}
              </span>
            </div>
            <div className="flex-1 overflow-y-auto">
              {conversations.length === 0 && (
                <div className="py-10 text-center text-gray-300 text-sm">暂无会话</div>
              )}
              {conversations.map(conv => {
                const userName = conv.users?.real_name || conv.users?.username || '访客';
                const isActive = conv.id === activeId;
                return (
                  <button
                    key={conv.id}
                    onClick={() => selectConversation(conv.id)}
                    className={`w-full text-left px-4 py-3 border-b border-gray-50 transition-colors ${
                      isActive ? 'bg-blue-50/60' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-[13px] font-medium ${isActive ? 'text-[#1890FF]' : 'text-gray-700'}`}>
                        {userName}
                      </span>
                      <span className="text-[10.5px] text-gray-300">
                        {conv.last_message_at ? formatTime(conv.last_message_at) : ''}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center justify-between gap-2">
                      <span className="text-[11.5px] text-gray-400 truncate">
                        {conv.last_message || '（暂无消息）'}
                      </span>
                      {conv.unread_admin > 0 && (
                        <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-[#FE2C55] text-white text-[10px] font-semibold flex items-center justify-center flex-shrink-0">
                          {conv.unread_admin}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 聊天窗口 */}
          <div className={`${mobileChatOpen ? 'flex' : 'hidden'} md:flex flex-1 flex-col min-w-0`}>
            {!activeId ? (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-300">
                <MessageIcon className="w-10 h-10 mb-2" />
                <span className="text-sm">请选择左侧会话开始回复</span>
              </div>
            ) : (
              <>
                {/* 会话头 */}
                <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                  <button
                    className="md:hidden p-1 -ml-2 text-gray-500"
                    onClick={() => setMobileChatOpen(false)}
                    aria-label="返回会话列表"
                  >
                    <ArrowLeftIcon className="w-4 h-4" />
                  </button>
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#00D4FF] to-[#7B61FF] flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0">
                    {activeUser?.real_name?.[0] || activeUser?.username?.[0] || '客'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium text-gray-700 truncate">
                      {activeUser ? `${activeUser.real_name || activeUser.username}` : '用户'}
                      {activeConversation?.users?.username && activeUser?.username !== activeConversation.users.username ? (
                        <span className="text-gray-300 font-normal"> · {activeConversation.users.username}</span>
                      ) : null}
                    </div>
                  </div>
                </div>

                {/* 消息区 */}
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gray-50/50">
                  {loadFailed && (
                    <button
                      onClick={() => activeId && loadMessages(activeId)}
                      className="block mx-auto text-[11px] text-gray-400 bg-white border border-gray-100 rounded-full px-3 py-1 hover:text-[#1890FF]"
                    >
                      加载失败，点击重试
                    </button>
                  )}
                  {messages.map(msg => {
                    const isMine = msg.sender === 'admin';
                    return (
                      <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] px-3 py-2 text-[13px] leading-relaxed rounded-xl shadow-sm ${
                          isMine
                            ? 'bg-gradient-to-br from-[#1890FF] to-[#00B4FF] text-white rounded-br-sm'
                            : 'bg-white border border-gray-100 text-gray-700 rounded-bl-sm'
                        }`}>
                          <div className="whitespace-pre-wrap break-words">{msg.content}</div>
                          <div className={`mt-1 text-[10px] ${isMine ? 'text-white/60' : 'text-gray-300'}`}>
                            {formatTime(msg.created_at)}
                            {isMine && <span className="ml-1 inline-flex items-center"><CheckCircleIcon className="w-3 h-3" /></span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* 输入区 */}
                <div className="px-4 py-3 border-t border-gray-100 bg-white">
                  <div className="flex items-end gap-2">
                    <textarea
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      rows={1}
                      placeholder="输入回复内容，Enter 发送"
                      className="flex-1 resize-none rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#1890FF] focus:ring-2 focus:ring-[#1890FF]/10 outline-none px-3.5 py-2.5 text-[13px] min-h-[40px] max-h-28 transition-all"
                    />
                    <button
                      onClick={handleSend}
                      disabled={!input.trim() || sending}
                      className={`px-4 py-2.5 rounded-lg text-[13px] font-medium transition-all active:scale-95 ${
                        input.trim()
                          ? 'bg-gradient-to-r from-[#1890FF] to-[#00B4FF] text-white shadow-lg shadow-[#1890FF]/25'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      发送
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}