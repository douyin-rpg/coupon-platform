'use client';

import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, useCallback } from 'react';
import { createWsConnection, type WsConnection } from '@/lib/ws-client';
import {
  ArrowLeftIcon,
  MusicIcon,
  SendIcon,
  CheckCircleIcon,
  PictureIcon,
} from '@/components/icons';
import type { ChatConversation, ChatMessage, SupportSettings } from '@/lib/support';

const DEFAULT_SETTINGS: SupportSettings = {
  online: 'online',
  work_start: '09:00',
  work_end: '23:00',
  auto_greeting: '',
};

function compressImage(file: File, maxSize = 900, quality = 0.72): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxSize || height > maxSize) {
          const ratio = Math.min(maxSize / width, maxSize / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('canvas error'));
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function SupportPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [conversation, setConversation] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [connected, setConnected] = useState(false);
  const [settings, setSettings] = useState<SupportSettings>(DEFAULT_SETTINGS);
  const [sendingImage, setSendingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
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
        if (data.settings) setSettings(data.settings as SupportSettings);
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

  // WebSocket 连接
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
        if (msg.type === 'chat:ready') return;
        if (msg.type === 'chat:init') {
          const p = (msg.payload || {}) as {
            conversation: ChatConversation;
            messages: ChatMessage[];
            settings?: SupportSettings;
          };
          setConversation(p.conversation || null);
          setMessages((p.messages || []) as ChatMessage[]);
          if (p.settings) setSettings(p.settings as SupportSettings);
          scrollToBottom();
          return;
        }
        if (msg.type === 'chat:status') {
          const p = (msg.payload || {}) as { settings?: SupportSettings };
          if (p.settings) setSettings(p.settings as SupportSettings);
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
        if (msg.type === 'chat:closed') {
          const p = (msg.payload || {}) as { conversation: ChatConversation; by?: string };
          setConversation(p.conversation || null);
          return;
        }
        if (msg.type === 'chat:reopen') {
          const p = (msg.payload || {}) as { conversation: ChatConversation };
          setConversation(p.conversation || null);
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

  // 轮询兜底
  useEffect(() => {
    if (!user || connected) return;
    const timer = setInterval(async () => {
      try {
        const res = await fetch('/api/user/support');
        if (!res.ok) return;
        const data = await res.json();
        setConversation(data.conversation || null);
        if (data.settings) setSettings(data.settings as SupportSettings);
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

  const sendMessage = useCallback(
    async (content: string, msgType: 'text' | 'image' = 'text', imageUrl?: string) => {
      if (!content) return;
      // 乐观发送（WS 优先）
      if (connRef.current && connRef.current.readyState === WebSocket.OPEN) {
        connRef.current.send({
          type: 'chat:send',
          payload: { content, msgType, imageUrl },
        });
        return;
      }
      // REST 兜底
      try {
        const res = await fetch('/api/user/support', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content, msgType, imageUrl }),
        });
        if (res.ok) {
          const data = await res.json();
          setMessages(prev =>
            prev.some(m => m.id === data.message.id) ? prev : [...prev, data.message],
          );
          setConversation(data.conversation || null);
          scrollToBottom();
        }
      } catch {
        // ignore
      }
    },
    [scrollToBottom],
  );

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput('');
    setSending(true);
    await sendMessage(text);
    setSending(false);
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    if (file.size > 8 * 1024 * 1024) {
      return;
    }
    setSendingImage(true);
    try {
      const dataUrl = await compressImage(file);
      // 立即在本地追加自己的图片消息（乐观 UI），服务端回包会去重
      const optimistic: ChatMessage = {
        id: `local-${Date.now()}`,
        conversation_id: conversation?.id || '',
        sender: 'user',
        content: '[图片]',
        is_read: false,
        created_at: new Date().toISOString(),
        msg_type: 'image',
        image_url: dataUrl,
      };
      setMessages(prev => [...prev, optimistic]);
      scrollToBottom();
      await sendMessage('[图片]', 'image', dataUrl);
    } catch {
      // ignore
    } finally {
      setSendingImage(false);
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

  const isClosed = conversation?.status === 'closed';
  const statusText =
    settings.online === 'busy'
      ? '客服忙碌中，请耐心等待'
      : settings.online === 'offline'
        ? '客服暂离，留言将尽快回复'
        : '客服在线，通常几分钟内回复';
  const statusColor =
    settings.online === 'busy'
      ? 'bg-amber-400'
      : settings.online === 'offline'
        ? 'bg-gray-400'
        : 'bg-green-400';

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex flex-col">
      {/* Header - 抖音风格 */}
      <header className="bg-gradient-to-r from-[#060E1A] via-[#0A1A30] to-[#060E1A] text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="返回"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          {/* 抖音音符客服头像 */}
          <div className="relative">
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#00D4FF] to-[#7B61FF] flex items-center justify-center shadow-lg shadow-[#00D4FF]/25 ring-2 ring-white/20">
              <MusicIcon className="w-6 h-6 text-white" filled />
            </div>
            <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[#0A1A30] ${statusColor}`} />
          </div>
          <div className="flex-1">
            <h1 className="font-semibold text-[15px] flex items-center gap-1.5">
              抖音客服
              <span className="text-[10px] font-normal text-white/50 border border-white/15 bg-white/5 rounded px-1.5 py-0.5">官方</span>
            </h1>
            <p className="text-[11px] text-white/60 flex items-center gap-1">
              <span className={`inline-block w-1.5 h-1.5 rounded-full ${statusColor}`} />
              {statusText}
            </p>
          </div>
          <span className="text-[11px] text-white/50 bg-white/5 border border-white/10 rounded-full px-2.5 py-1 whitespace-nowrap">
            工作时间 {settings.work_start}-{settings.work_end}
          </span>
        </div>
      </header>

      {/* Chat body */}
      <div className="flex-1 max-w-3xl w-full mx-auto flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4">
          {/* 系统欢迎语 */}
          <div className="flex justify-center">
            <div className="max-w-[85%] bg-white rounded-xl rounded-tl-sm border border-gray-100 shadow-sm px-4 py-2.5 text-[12.5px] text-gray-500 leading-relaxed">
              {settings.auto_greeting ||
                '您好，欢迎来到惠抢券在线客服～\n请描述您遇到的问题，如：抢券失败、回兑进度、提现到账、账户绑定等，我们会尽快为您解答。'}
            </div>
          </div>

          {/* 会话已结束提示 */}
          {isClosed && (
            <div className="flex flex-col items-center gap-2 py-2">
              <div className="text-[12px] text-gray-400 bg-gray-100 rounded-full px-4 py-1.5">
                本次会话已结束，感谢您的咨询
              </div>
              <button
                onClick={() => {
                  if (connRef.current && connRef.current.readyState === WebSocket.OPEN) {
                    connRef.current.send({ type: 'chat:send', payload: { content: '您好，我回来了' } });
                  } else {
                    sendMessage('您好，我回来了');
                  }
                }}
                className="text-[12px] text-[#1890FF] bg-blue-50 rounded-full px-4 py-1.5 hover:bg-blue-100 transition-colors"
              >
                重新发起会话
              </button>
            </div>
          )}

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
                      if (data.settings) setSettings(data.settings as SupportSettings);
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
            const isImage = msg.msg_type === 'image';
            return (
              <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[78%] flex ${isMine ? 'flex-row-reverse' : 'flex-row'} items-end gap-1.5`}>
                  {isImage ? (
                    <div
                      className={`overflow-hidden rounded-xl shadow-sm border ${
                        isMine ? 'rounded-br-sm' : 'rounded-bl-sm'
                      } ${isMine ? 'border-[#1890FF]/30' : 'border-gray-100'}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={msg.image_url || msg.content}
                        alt="图片消息"
                        className="max-w-[240px] max-h-64 object-cover block"
                        loading="lazy"
                      />
                      <div className={`px-2 py-1 text-[10px] ${isMine ? 'bg-gradient-to-br from-[#1890FF] to-[#00B4FF] text-white/60' : 'bg-white text-gray-300'}`}>
                        {formatTime(msg.created_at)}
                      </div>
                    </div>
                  ) : (
                    <div
                      className={`px-3.5 py-2.5 text-[13.5px] leading-relaxed shadow-sm ${
                        isMine
                          ? 'bg-gradient-to-br from-[#1890FF] to-[#00B4FF] text-white rounded-xl rounded-br-sm'
                          : 'bg-white border border-gray-100 text-gray-700 rounded-xl rounded-bl-sm'
                      }`}
                    >
                      <div className="whitespace-pre-wrap break-words">{msg.content}</div>
                      <div className={`mt-1 text-[10px] ${isMine ? 'text-white/60' : 'text-gray-300'}`}>
                        {formatTime(msg.created_at)}
                      </div>
                    </div>
                  )}
                  {isMine && !isImage && (
                    <span className="text-[10px] text-gray-300 mb-0.5">
                      <CheckCircleIcon className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>
              </div>
            );
          })}
          {sendingImage && (
            <div className="flex justify-end">
              <div className="px-3 py-2 text-[11px] text-gray-400 bg-white border border-gray-100 rounded-xl rounded-br-sm shadow-sm">
                图片发送中...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="bg-white border-t border-gray-100 px-4 sm:px-6 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
          <div className="flex items-end gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFile}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={sendingImage}
              className="p-2.5 rounded-lg text-gray-400 hover:text-[#1890FF] hover:bg-blue-50 transition-colors disabled:opacity-50 flex-shrink-0"
              aria-label="发送图片"
              title="发送图片"
            >
              <PictureIcon className="w-5 h-5" />
            </button>
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