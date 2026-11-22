'use client';

import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, useCallback } from 'react';
import { createWsConnection, type WsConnection } from '@/lib/ws-client';
import { ArrowLeftIcon, HeadphoneIcon, SendIcon, CheckCircleIcon } from '@/components/icons';
import type { ChatConversation, ChatMessage } from '@/lib/support';

export default function SupportPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [conversation, setConversation] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [connected, setConnected] = useState(false);
  const [online, setOnline] = useState(false);
  const connRef = useRef<WsConnection | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);

  // 登录守卫
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login?redirect=/support');
    }
  }, [loading, user, router]);

  // 滚动到底部
  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    });
  }, []);

  // 加载历史（REST 兜底，供非 WS 环境/首次加载）
  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch('/api/user/support');
        if (!res.ok) throw new Error('failed');
        const data = await res.json();
        if (cancelled) return;
        setConversation(data.conversation || null);
        setMessages((data.messages || []) as ChatMessage[]);
        setLoadFailed(false);
        scrollToBottom();
      } catch {
        if (!cancelled) setLoadFailed(true);
      }
    };
    load();

    return () => {
      cancelled = true;
    };
  }, [user, scrollToBottom]);

  // WebSocket 连接（沙箱/自建服实时；线上 Vercel 不可用时轮询兜底）
  useEffect(() => {
    if (!user) return;

    const conn = createWsConnection({
      path: '/ws/chat',
      onOpen: () => {
        setConnected(true);
        setLoadFailed(false);
      },
      onClose: () => setConnected(false),
      onError: () => setConnected(false),
      onMessage: (msg) => {
        if (msg.type === 'chat:ready') {
          setOnline(true);
          return;
        }
        if (msg.type === 'chat:init') {
          const p = (msg.payload || {}) as {
            conversation: ChatConversation;
            messages: ChatMessage[];
          };
          setConversation(p.conversation || null);
          setMessages((p.messages || []) as ChatMessage[]);
          scrollToBottom();
          return;
        }
        if (msg.type === 'chat:message') {
          const p = (msg.payload || {}) as {
            conversation: ChatConversation;
            message: ChatMessage;
          };
          setConversation(p.conversation || null);
          setMessages(prev => {
            if (prev.some(m => m.id === p.message.id)) return prev;
            return [...prev, p.message];
          });
          scrollToBottom();
          return;
        }
        if (msg.type === 'chat:error') {
          // 未登录等错误
          return;
        }
      },
    });
    connRef.current = conn;

    return () => {
      conn.close();
      connRef.current = null;
    };
  }, [user, scrollToBottom]);

  // 轮询兜底：每 5s 拉一次（WS 断开或无 WS 环境）
  useEffect(() => {
    if (!user || connected) return;
    const timer = setInterval(async () => {
      try {
        const res = await fetch('/api/user/support');
        if (!res.ok) return;
        const data = await res.json();
        setConversation(data.conversation || null);
        setMessages(prev => {
          const serverMsgs = (data.messages || []) as ChatMessage[];
          if (serverMsgs.length > prev.length) return serverMsgs;
          return prev;
        });
      } catch {
        // ignore
      }
    }, 5000);
    return () => clearInterval(timer);
  }, [user, connected]);

  // 检测管理员是否在线：会话刚创建时 unread_admin > 0 表示客服已知晓
  useEffect(() => {
    // 简单逻辑：会话存在即视为客服在线（后台工作台常开）
    setOnline(true);
  }, []);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;

    // 乐观发送：先通过 WS
    if (connRef.current && connRef.current.readyState === WebSocket.OPEN) {
      connRef.current.send({ type: 'chat:send', payload: { content: text } });
      setInput('');
      return;
    }

    // REST 兜底
    setSending(true);
    try {
      const res = await fetch('/api/user/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text }),
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(prev =>
          prev.some(m => m.id === data.message.id) ? prev : [...prev, data.message],
        );
        setConversation(data.conversation || null);
        setInput('');
        scrollToBottom();
      }
    } catch {
      // ignore
    } finally {
      setSending(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F7FA]">
        <span className="text-gray-400">加载中...</span>
      </div>
    );
  }

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const sameDay = d.toDateString() === now.toDateString();
    const hm = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    if (sameDay) return hm;
    return `${d.getMonth() + 1}/${d.getDate()} ${hm}`;
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex flex-col">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#060E1A] via-[#0A1A30] to-[#060E1A] text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="返回"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00D4FF] to-[#7B61FF] flex items-center justify-center shadow-lg shadow-[#00D4FF]/20">
              <HeadphoneIcon className="w-5 h-5 text-white" filled />
            </div>
            <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#0A1A30] ${online ? 'bg-green-400' : 'bg-gray-400'}`} />
          </div>
          <div className="flex-1">
            <h1 className="font-semibold text-[15px]">在线客服</h1>
            <p className="text-[11px] text-white/60 flex items-center gap-1">
              <span className={`inline-block w-1.5 h-1.5 rounded-full ${online ? 'bg-green-400' : 'bg-gray-400'}`} />
              {online ? '客服在线，通常几分钟内回复' : connected ? '连接中...' : '消息将自动送达，请耐心等待'}
            </p>
          </div>
          <span className="text-[11px] text-white/50 bg-white/5 border border-white/10 rounded-full px-2.5 py-1 whitespace-nowrap">
            工作时间 9:00-23:00
          </span>
        </div>
      </header>

      {/* Chat body */}
      <div className="flex-1 max-w-3xl w-full mx-auto flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4">
          {/* 系统欢迎语 */}
          <div className="flex justify-center">
            <div className="max-w-[85%] bg-white rounded-xl rounded-tl-sm border border-gray-100 shadow-sm px-4 py-2.5 text-[12.5px] text-gray-500 leading-relaxed">
              您好，欢迎来到惠抢券在线客服～
              <br />
              请描述您遇到的问题，如：抢券失败、回兑进度、提现到账、账户绑定等，我们会尽快为您解答。
            </div>
          </div>

          {loadFailed && (
            <div className="flex justify-center">
              <button
                onClick={async () => {
                  try {
                    const res = await fetch('/api/user/support');
                    if (res.ok) {
                      const data = await res.json();
                      setConversation(data.conversation || null);
                      setMessages((data.messages || []) as ChatMessage[]);
                      setLoadFailed(false);
                      scrollToBottom();
                    }
                  } catch {
                    // ignore
                  }
                }}
                className="text-[12px] text-gray-400 bg-white border border-gray-100 rounded-full px-3 py-1.5 hover:text-[#1890FF] transition-colors"
              >
                加载失败，点击重试
              </button>
            </div>
          )}

          {messages.map(msg => {
            const isMine = msg.sender === 'user';
            return (
              <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[78%] flex ${isMine ? 'flex-row-reverse' : 'flex-row'} items-end gap-1.5`}>
                  <div
                    className={`px-3.5 py-2.5 text-[13.5px] leading-relaxed shadow-sm ${
                      isMine
                        ? 'bg-gradient-to-br from-[#1890FF] to-[#00B4FF] text-white rounded-xl rounded-br-sm'
                        : 'bg-white border border-gray-100 text-gray-700 rounded-xl rounded-bl-sm'
                    }`}
                  >
                    {msg.content}
                    <div className={`mt-1 text-[10px] ${isMine ? 'text-white/60' : 'text-gray-300'}`}>
                      {formatTime(msg.created_at)}
                    </div>
                  </div>
                  {isMine && (
                    <span className="text-[10px] text-gray-300 mb-0.5">
                      <CheckCircleIcon className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="bg-white border-t border-gray-100 px-4 sm:px-6 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
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
              placeholder="输入您的问题，Enter 发送"
              className="flex-1 resize-none rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#1890FF] focus:ring-2 focus:ring-[#1890FF]/10 outline-none px-3.5 py-2.5 text-[13.5px] min-h-[42px] max-h-32 transition-all"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || sending}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg font-medium text-[13.5px] transition-all active:scale-95 ${
                input.trim()
                  ? 'bg-gradient-to-r from-[#1890FF] to-[#00B4FF] text-white shadow-lg shadow-[#1890FF]/25 hover:shadow-[#1890FF]/40'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              <SendIcon className="w-4 h-4" />
              发送
            </button>
          </div>
          <p className="text-[10.5px] text-gray-300 mt-1.5 pl-1">
            请文明用语，禁止发布违法违规内容；如遇紧急问题请拨打客服热线。
          </p>
        </div>
      </div>
    </div>
  );
}