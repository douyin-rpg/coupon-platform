'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { createWsConnection, type WsConnection } from '@/lib/ws-client';
import {
  HeadphoneIcon,
  ArrowLeftIcon,
  MessageIcon,
  CheckCircleIcon,
  PictureIcon,
  PowerIcon,
  EarthIcon,
  HelpIcon,
} from '@/components/icons';
import type { ChatConversation, ChatMessage, SupportSettings } from '@/lib/support';

interface ConversationItem extends ChatConversation {
  users?: { username: string; real_name: string } | null;
}

interface UserInfo {
  id: string;
  username: string;
  real_name: string;
  phone?: string | null;
  created_at?: string;
  verify_status?: string;
}

interface DeviceInfo {
  device: string;
  os: string;
  browser: string;
}

const DEFAULT_SETTINGS: SupportSettings = {
  online: 'online',
  work_start: '09:00',
  work_end: '23:00',
  auto_greeting: '',
};

const STATUS_LABEL: Record<string, { text: string; dot: string; badge: string }> = {
  online: { text: '在线', dot: 'bg-green-500', badge: 'bg-green-50 text-green-600 border-green-200' },
  busy: { text: '忙碌', dot: 'bg-amber-400', badge: 'bg-amber-50 text-amber-600 border-amber-200' },
  offline: { text: '离线', dot: 'bg-gray-400', badge: 'bg-gray-100 text-gray-500 border-gray-200' },
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

export default function AdminSupportPage() {
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeUser, setActiveUser] = useState<UserInfo | null>(null);
  const [device, setDevice] = useState<DeviceInfo | null>(null);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [sendingImage, setSendingImage] = useState(false);
  const [connected, setConnected] = useState(false);
  const [mobileChatOpen, setMobileChatOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'open' | 'closed'>('all');
  const [settings, setSettings] = useState<SupportSettings>(DEFAULT_SETTINGS);
  const [showSettings, setShowSettings] = useState(false);
  const [workStart, setWorkStart] = useState('09:00');
  const [workEnd, setWorkEnd] = useState('23:00');
  const [greeting, setGreeting] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const connRef = useRef<WsConnection | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const activeRef = useRef<string | null>(null);
  activeRef.current = activeId;

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    });
  }, []);

  // 拉取会话列表
  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/support?status=${filter}`);
      if (res.status === 401) {
        window.location.href = '/admin';
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
        if (data.settings) {
          setSettings(data.settings as SupportSettings);
          setWorkStart(data.settings.work_start || '09:00');
          setWorkEnd(data.settings.work_end || '23:00');
          setGreeting(data.settings.auto_greeting || '');
        }
      }
    } catch {
      // ignore
    }
  }, [filter]);

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
          setDevice(data.device || null);
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
      fetch('/api/admin/support', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: id }),
      }).then(() => {
        setConversations(prev => prev.map(c => (c.id === id ? { ...c, unread_admin: 0 } : c)));
      }).catch(() => {});
    },
    [loadMessages],
  );

  // 更新客服状态
  const updateOnline = async (online: 'online' | 'busy' | 'offline') => {
    setSettings(prev => ({ ...prev, online }));
    try {
      await fetch('/api/admin/support', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'settings', online }),
      });
    } catch {
      // ignore
    }
  };

  // 保存工作时间/欢迎语
  const saveSettings = async () => {
    try {
      const res = await fetch('/api/admin/support', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'settings',
          work_start: workStart,
          work_end: workEnd,
          auto_greeting: greeting,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.settings) setSettings(data.settings as SupportSettings);
        setShowSettings(false);
      }
    } catch {
      // ignore
    }
  };

  // 关闭会话
  const closeActiveConversation = async () => {
    if (!activeId) return;
    if (!window.confirm('确定结束当前会话吗？用户端将收到会话已结束提示。')) return;
    try {
      const res = await fetch('/api/admin/support', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'close', conversationId: activeId }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.conversation) {
          setConversations(prev =>
            prev.map(c => (c.id === activeId ? data.conversation : c)),
          );
        }
      }
    } catch {
      // ignore
    }
  };

  // 重开会话
  const reopenActiveConversation = async () => {
    if (!activeId) return;
    try {
      const res = await fetch('/api/admin/support', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reopen', conversationId: activeId }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.conversation) {
          setConversations(prev => prev.map(c => (c.id === activeId ? data.conversation : c)));
        }
      }
    } catch {
      // ignore
    }
  };

  // WebSocket
  useEffect(() => {
    const conn = createWsConnection({
      path: '/ws/chat',
      onOpen: () => setConnected(true),
      onClose: () => setConnected(false),
      onError: () => setConnected(false),
      onMessage: (msg) => {
        if (msg.type === 'chat:ready') {
          const p = (msg.payload || {}) as { settings?: SupportSettings };
          if (p.settings) {
            setSettings(p.settings as SupportSettings);
            setWorkStart((p.settings as SupportSettings).work_start || '09:00');
            setWorkEnd((p.settings as SupportSettings).work_end || '23:00');
            setGreeting((p.settings as SupportSettings).auto_greeting || '');
          }
          return;
        }
        if (msg.type === 'chat:list') {
          const p = (msg.payload || {}) as { conversations: ConversationItem[] };
          setConversations(p.conversations || []);
          return;
        }
        if (msg.type === 'chat:new' || msg.type === 'chat:reopen') {
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
            if (exists) return prev.map(c => (c.id === p.conversation.id ? p.conversation : c));
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
        if (msg.type === 'chat:closed') {
          const p = (msg.payload || {}) as { conversation: ConversationItem };
          setConversations(prev => prev.map(c => (c.id === p.conversation.id ? p.conversation : c)));
          return;
        }
        if (msg.type === 'chat:settings:update') {
          const p = (msg.payload || {}) as { settings?: SupportSettings };
          if (p.settings) {
            setSettings(p.settings as SupportSettings);
            setWorkStart((p.settings as SupportSettings).work_start || '09:00');
            setWorkEnd((p.settings as SupportSettings).work_end || '23:00');
            setGreeting((p.settings as SupportSettings).auto_greeting || '');
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

  const sendContent = useCallback(
    async (content: string, msgType: 'text' | 'image' = 'text', imageUrl?: string) => {
      if (!content || !activeId) return;
      if (connRef.current && connRef.current.readyState === WebSocket.OPEN) {
        connRef.current.send({
          type: 'chat:send',
          payload: { conversationId: activeId, content, msgType, imageUrl },
        });
        return;
      }
      try {
        const res = await fetch('/api/admin/support', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ conversationId: activeId, content, msgType, imageUrl }),
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
      }
    },
    [activeId, scrollToBottom],
  );

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput('');
    setSending(true);
    await sendContent(text);
    setSending(false);
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !activeId) return;
    if (!file.type.startsWith('image/')) return;
    setSendingImage(true);
    try {
      const dataUrl = await compressImage(file);
      const optimistic: ChatMessage = {
        id: `local-${Date.now()}`,
        conversation_id: activeId,
        sender: 'admin',
        content: '[图片]',
        is_read: false,
        created_at: new Date().toISOString(),
        msg_type: 'image',
        image_url: dataUrl,
      };
      setMessages(prev => [...prev, optimistic]);
      scrollToBottom();
      await sendContent('[图片]', 'image', dataUrl);
    } catch {
      // ignore
    } finally {
      setSendingImage(false);
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
  const activeStatus = STATUS_LABEL[settings.online] || STATUS_LABEL.online;

  return (
    <div className="p-4 sm:p-6">
      {/* 页头 + 状态栏 */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#1890FF] to-[#00D4FF] flex items-center justify-center">
              <HeadphoneIcon className="w-4 h-4 text-white" filled />
            </span>
            在线客服工作台
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            <span className={connected ? 'text-green-500' : 'text-amber-500'}>
              {connected ? '● 实时通道已连接' : '○ 轮询模式（实时通道不可用）'}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* 客服状态切换 */}
          <div className="relative inline-flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-3 py-1.5">
            <span className={`w-2 h-2 rounded-full ${activeStatus.dot}`} />
            <select
              value={settings.online}
              onChange={e => updateOnline(e.target.value as 'online' | 'busy' | 'offline')}
              className="text-xs font-medium text-gray-600 bg-transparent outline-none cursor-pointer"
            >
              <option value="online">在线（可接待）</option>
              <option value="busy">忙碌</option>
              <option value="offline">离线</option>
            </select>
          </div>
          {/* 工作时间设置 */}
          <button
            onClick={() => setShowSettings(true)}
            className="text-xs text-gray-500 bg-white border border-gray-200 rounded-lg px-3 py-2 hover:text-[#1890FF] hover:border-[#1890FF]/40 transition-colors inline-flex items-center gap-1"
          >
            <HelpIcon className="w-3.5 h-3.5" />
            {settings.work_start}-{settings.work_end}
          </button>
          <button
            onClick={fetchConversations}
            className="text-xs text-gray-500 bg-white border border-gray-200 rounded-lg px-3 py-2 hover:text-[#1890FF] hover:border-[#1890FF]/40 transition-colors"
          >
            刷新
          </button>
        </div>
      </div>

      {/* 设置弹窗 */}
      {showSettings && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setShowSettings(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-5" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-gray-800 text-[15px] mb-4">客服工作设置</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 block mb-1.5">开始时间</label>
                  <input
                    type="time"
                    value={workStart}
                    onChange={e => setWorkStart(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1890FF]"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1.5">结束时间</label>
                  <input
                    type="time"
                    value={workEnd}
                    onChange={e => setWorkEnd(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1890FF]"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1.5">自动欢迎语</label>
                <textarea
                  value={greeting}
                  onChange={e => setGreeting(e.target.value)}
                  rows={3}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1890FF] resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 text-xs text-gray-500 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                取消
              </button>
              <button
                onClick={saveSettings}
                className="px-4 py-2 text-xs text-white bg-gradient-to-r from-[#1890FF] to-[#00B4FF] rounded-lg hover:opacity-90"
              >
                保存设置
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 工作台 */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex h-[calc(100vh-220px)] min-h-[460px]">
          {/* 会话列表 */}
          <div className={`${mobileChatOpen ? 'hidden' : 'flex'} md:flex w-full md:w-80 border-r border-gray-100 flex-col flex-shrink-0`}>
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[12px] font-medium text-gray-400">会话列表</span>
                <span className="bg-blue-50 text-[#1890FF] rounded-full px-2 py-0.5 text-[11px] font-semibold">
                  {filter === 'all' ? conversations.length : `${conversations.length}`}
                </span>
              </div>
              <div className="flex gap-1">
                {(['all', 'open', 'closed'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-2.5 py-1 rounded-md text-[11.5px] transition-colors ${
                      filter === f
                        ? 'bg-[#1890FF]/10 text-[#1890FF] font-medium'
                        : 'text-gray-400 hover:bg-gray-50'
                    }`}
                  >
                    {f === 'all' ? '全部' : f === 'open' ? '进行中' : '已结束'}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {conversations.length === 0 && (
                <div className="py-10 text-center text-gray-300 text-sm">暂无会话</div>
              )}
              {conversations.map((conv, idx) => {
                const userName = conv.users?.real_name || conv.users?.username || '访客';
                const isActive = conv.id === activeId;
                const isClosed = conv.status === 'closed';
                return (
                  <button
                    key={conv.id}
                    onClick={() => selectConversation(conv.id)}
                    className={`w-full text-left px-4 py-3 border-b border-gray-50 transition-colors ${
                      isActive ? 'bg-blue-50/60' : 'hover:bg-gray-50'
                    } ${isClosed ? 'opacity-60' : ''}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-[13px] font-medium ${isActive ? 'text-[#1890FF]' : 'text-gray-700'}`}>
                        {userName}
                        {isClosed && <span className="ml-1.5 text-[10px] text-gray-400">[已结束]</span>}
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
                    <div className="mt-1 flex items-center gap-1.5 text-[10px] text-gray-300">
                      <EarthIcon className="w-3 h-3" />
                      <span className="truncate">#{conv.id.slice(0, 5)} · {conv.visitor_ip || '未知IP'}</span>
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
                {/* 会话头：访客信息 */}
                <div className="px-4 py-3 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <button
                      className="md:hidden p-1 -ml-2 text-gray-500"
                      onClick={() => setMobileChatOpen(false)}
                      aria-label="返回会话列表"
                    >
                      <ArrowLeftIcon className="w-4 h-4" />
                    </button>
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#00D4FF] to-[#7B61FF] flex items-center justify-center text-white text-[13px] font-bold flex-shrink-0">
                      {activeUser?.real_name?.[0] || activeUser?.username?.[0] || '客'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-medium text-gray-700 truncate">
                        {activeUser ? `${activeUser.real_name || activeUser.username}` : '用户'}
                        <span className="text-gray-300 font-normal">
                          {' '}· @{activeUser?.username || activeConversation?.users?.username || ''}
                        </span>
                        {activeConversation?.status === 'closed' && (
                          <span className="ml-1.5 text-[10px] text-gray-400 bg-gray-100 rounded px-1.5 py-0.5">已结束</span>
                        )}
                      </div>
                      <div className="mt-0.5 flex items-center gap-1.5 text-[10.5px] text-gray-400 flex-wrap">
                        <span className="inline-flex items-center gap-0.5">
                          <EarthIcon className="w-3 h-3" /> {activeConversation?.visitor_ip || '未知IP'}
                        </span>
                        {device && (
                          <>
                            <span className="text-gray-200">|</span>
                            <span>{device.device}</span>
                            {device.os && <span>· {device.os}</span>}
                            {device.browser && <span>· {device.browser}</span>}
                          </>
                        )}
                      </div>
                    </div>
                    {/* 关闭/重开会话 */}
                    {activeConversation?.status === 'closed' ? (
                      <button
                        onClick={reopenActiveConversation}
                        className="text-xs text-[#1890FF] bg-blue-50 rounded-lg px-3 py-1.5 hover:bg-blue-100 transition-colors"
                      >
                        重新接待
                      </button>
                    ) : (
                      <button
                        onClick={closeActiveConversation}
                        className="text-xs text-[#FE2C55] bg-red-50 rounded-lg px-3 py-1.5 hover:bg-red-100 transition-colors inline-flex items-center gap-1"
                        title="结束对话"
                      >
                        <PowerIcon className="w-3.5 h-3.5" />
                        结束会话
                      </button>
                    )}
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
                  {/* 会话结束分隔条 */}
                  {activeConversation?.status === 'closed' && (
                    <div className="flex justify-center">
                      <div className="text-[11px] text-gray-400 bg-gray-100 rounded-full px-4 py-1">
                        会话已结束{activeConversation.closed_at ? ` · ${formatTime(activeConversation.closed_at)}` : ''}
                      </div>
                    </div>
                  )}
                  {messages.map(msg => {
                    const isMine = msg.sender === 'admin';
                    const isImage = msg.msg_type === 'image';
                    return (
                      <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] ${isImage ? '' : 'px-3 py-2'} text-[13px] leading-relaxed rounded-xl shadow-sm ${
                          isMine
                            ? 'bg-gradient-to-br from-[#1890FF] to-[#00B4FF] text-white rounded-br-sm'
                            : 'bg-white border border-gray-100 text-gray-700 rounded-bl-sm'
                        }`}>
                          {isImage ? (
                            <div className={`overflow-hidden rounded-xl border ${isMine ? 'border-[#1890FF]/30 rounded-br-sm' : 'border-gray-100 rounded-bl-sm'}`}>
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
                            <>
                              <div className="whitespace-pre-wrap break-words">{msg.content}</div>
                              <div className={`mt-1 text-[10px] ${isMine ? 'text-white/60' : 'text-gray-300'}`}>
                                {formatTime(msg.created_at)}
                                {isMine && <span className="ml-1 inline-flex items-center"><CheckCircleIcon className="w-3 h-3" /></span>}
                              </div>
                            </>
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

                {/* 输入区 */}
                <div className="px-4 py-3 border-t border-gray-100 bg-white">
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
                      disabled={sendingImage || activeConversation?.status === 'closed'}
                      className="p-2.5 rounded-lg text-gray-400 hover:text-[#1890FF] hover:bg-blue-50 transition-colors disabled:opacity-40 flex-shrink-0"
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
                      disabled={activeConversation?.status === 'closed'}
                      placeholder={
                        activeConversation?.status === 'closed'
                          ? '会话已结束，点击"重新接待"继续'
                          : '输入回复内容，Enter 发送'
                      }
                      className="flex-1 resize-none rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#1890FF] focus:ring-2 focus:ring-[#1890FF]/10 outline-none px-3.5 py-2.5 text-[13px] min-h-[40px] max-h-28 transition-all disabled:bg-gray-50 disabled:text-gray-300"
                    />
                    <button
                      onClick={handleSend}
                      disabled={!input.trim() || sending || activeConversation?.status === 'closed'}
                      className={`px-4 py-2.5 rounded-lg text-[13px] font-medium transition-all active:scale-95 ${
                        input.trim() && activeConversation?.status !== 'closed'
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