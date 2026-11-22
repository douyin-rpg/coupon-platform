'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { createWsConnection, type WsConnection } from '@/lib/ws-client';
import {
  HeadphoneIcon,
  SearchIcon,
  PictureIcon,
  PowerIcon,
  EarthIcon,
  SendIcon,
  TagIcon,
  TrashIcon,
  PlusIcon,
  EditIcon,
  MusicIcon,
  CheckIcon,
  XIcon,
  ClockIcon,
  MoreIcon,
  ChatIcon,
  BellIcon,
  ChartIcon,
  GearIcon,
} from '@/components/icons';
import {
  playNewMessageSound,
  getSoundPrefs,
  saveSoundPrefs,
  flashTitle,
} from '@/lib/sound';
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
  login_frozen?: boolean;
  funds_frozen?: boolean;
}

interface DeviceInfo {
  device: string;
  os: string;
  browser: string;
}

interface QuickReply {
  id: string;
  content: string;
  category: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

const DEFAULT_SETTINGS: SupportSettings = {
  online: 'online',
  work_start: '09:00',
  work_end: '23:00',
  auto_greeting: '',
  avatar: '',
};

const STATUS_META: Record<string, { text: string; dot: string; label: string }> = {
  online: { text: '在线（可接待）', dot: 'bg-green-400', label: '在线' },
  busy: { text: '忙碌', dot: 'bg-amber-400', label: '忙碌' },
  offline: { text: '离线', dot: 'bg-gray-400', label: '离线' },
};

const VERIFY_LABEL: Record<string, string> = {
  verified: '已实名',
  unverified: '未实名',
  pending: '审核中',
  rejected: '认证驳回',
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

export default function KefuWorkbenchPage() {
  // ── 会话列表 ──
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'open' | 'closed'>('open');
  const [keyword, setKeyword] = useState('');
  const [unreadTotal, setUnreadTotal] = useState(0);

  // ── 当前会话 ──
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeUser, setActiveUser] = useState<UserInfo | null>(null);
  const [device, setDevice] = useState<DeviceInfo | null>(null);
  const [activeConv, setActiveConv] = useState<ConversationItem | null>(null);

  // ── 输入 ──
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [sendingImage, setSendingImage] = useState(false);

  // ── 连接与设置 ──
  const [connected, setConnected] = useState(false);
  const [settings, setSettings] = useState<SupportSettings>(DEFAULT_SETTINGS);
  const [showSettings, setShowSettings] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [workStart, setWorkStart] = useState('09:00');
  const [workEnd, setWorkEnd] = useState('23:00');
  const [greeting, setGreeting] = useState('');

  // ── 话术库 ──
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([]);
  const [newReplyContent, setNewReplyContent] = useState('');

  // ── 左侧图标栏功能面板切换 ──
  const [leftPanel, setLeftPanel] = useState<'conversations' | 'quickreplies'>('conversations');

  // refs
  const connRef = useRef<WsConnection | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const activeRef = useRef<string | null>(null);
  activeRef.current = activeId;
  const conversationsRef = useRef<ConversationItem[]>([]);
  conversationsRef.current = conversations;
  const settingsRef = useRef<SupportSettings>(settings);
  settingsRef.current = settings;
  const soundOnRef = useRef(true);
  soundOnRef.current = soundOn;

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    });
  }, []);

  // 拉取会话列表（轮询高频调用，不覆盖正在编辑的表单值）
  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/support?status=${filter}`);
      if (res.status === 401) {
        window.location.href = '/admin';
        return;
      }
      if (res.ok) {
        const data = await res.json();
        const list = (data.conversations || []) as ConversationItem[];
        setConversations(list);
        const unread = list.filter(c => (c.unread_admin || 0) > 0).length;
        setUnreadTotal(unread);
        if (data.settings) {
          setSettings(data.settings as SupportSettings);
        }
      }
    } catch {
      // ignore
    }
  }, [filter]);

  // 拉取指定会话
  const loadMessages = useCallback(
    async (conversationId: string) => {
      try {
        const res = await fetch(`/api/admin/support?conversationId=${conversationId}`);
        if (res.ok) {
          const data = await res.json();
          setMessages(data.messages || []);
          setActiveUser(data.user || null);
          setDevice(data.device || null);
          setActiveConv(data.conversation || null);
          scrollToBottom();
        }
      } catch {
        // ignore
      }
    },
    [scrollToBottom],
  );

  const selectConversation = useCallback(
    (id: string) => {
      setActiveId(id);
      loadMessages(id);
      fetch('/api/admin/support', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: id }),
      })
        .then(() => {
          setConversations(prev => prev.map(c => (c.id === id ? { ...c, unread_admin: 0 } : c)));
        })
        .catch(() => {});
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

  // 更换客服头像（压缩为小尺寸 dataURL 存入设置）
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !file.type.startsWith('image/')) return;
    try {
      const dataUrl = await compressImage(file, 160, 0.85);
      // 压缩后仍可能较大，限制 200KB 以内
      if (dataUrl.length > 200 * 1024) return;
      setSettings(prev => ({ ...prev, avatar: dataUrl }));
      await fetch('/api/admin/support', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'settings', avatar: dataUrl }),
      });
    } catch {
      // ignore
    }
  };

  // 移除客服头像
  const clearAvatar = async () => {
    setSettings(prev => ({ ...prev, avatar: '' }));
    try {
      await fetch('/api/admin/support', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'settings', avatar: '' }),
      });
    } catch {
      // ignore
    }
  };

  // 关闭/重开会话
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
          setConversations(prev => prev.map(c => (c.id === activeId ? data.conversation : c)));
          setActiveConv(data.conversation);
        }
      }
    } catch {
      // ignore
    }
  };

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
          setActiveConv(data.conversation);
        }
      }
    } catch {
      // ignore
    }
  };

  // 设置标签
  const setTags = async (tags: string[]) => {
    if (!activeId) return;
    try {
      const res = await fetch('/api/admin/support', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'tags', conversationId: activeId, tags }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.conversation) {
          setActiveConv(data.conversation);
          setConversations(prev => prev.map(c => (c.id === activeId ? data.conversation : c)));
        }
      }
    } catch {
      // ignore
    }
  };

  // 设置备注
  const setRemark = async (remark: string) => {
    if (!activeId) return;
    try {
      const res = await fetch('/api/admin/support', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'remark', conversationId: activeId, remark }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.conversation) {
          setActiveConv(data.conversation);
          setConversations(prev => prev.map(c => (c.id === activeId ? data.conversation : c)));
        }
      }
    } catch {
      // ignore
    }
  };

  // 获取话术库
  const fetchQuickReplies = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/quick-replies');
      if (res.ok) {
        const data = await res.json();
        setQuickReplies(data.replies || []);
      }
    } catch {
      // ignore
    }
  }, []);

  const addQuickReply = async () => {
    const content = newReplyContent.trim();
    if (!content) return;
    try {
      const res = await fetch('/api/admin/quick-replies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, category: '自定义' }),
      });
      if (res.ok) {
        setNewReplyContent('');
        fetchQuickReplies();
      }
    } catch {
      // ignore
    }
  };

  const removeQuickReply = async (id: string) => {
    try {
      await fetch(`/api/admin/quick-replies?id=${id}`, { method: 'DELETE' });
      fetchQuickReplies();
    } catch {
      // ignore
    }
  };

  // WebSocket（低延迟：10s 心跳 / 1s 重连）
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
        if (msg.type === 'chat:new' || msg.type === 'chat:reopen') {
          const p = (msg.payload || {}) as { conversation: ConversationItem };
          if (p.conversation) {
            setConversations(prev => {
              const exists = prev.some(c => c.id === p.conversation.id);
              if (exists) return prev.map(c => (c.id === p.conversation.id ? p.conversation : c));
              return [p.conversation, ...prev];
            });
            // 新会话到达即响铃
            if (soundOnRef.current) {
              playNewMessageSound();
              flashTitle();
            }
          }
          return;
        }
        if (msg.type === 'chat:message') {
          const p = (msg.payload || {}) as { conversation: ConversationItem; message: ChatMessage };
          if (p.conversation) {
            setConversations(prev => {
              const exists = prev.some(c => c.id === p.conversation.id);
              if (exists) return prev.map(c => (c.id === p.conversation.id ? p.conversation : c));
              return [p.conversation, ...prev];
            });
          }
          // 用户发来消息：当前未在看该会话 → 响铃 + 闪烁（客服端提示音）
          if (p.message?.sender === 'user') {
            const isActive = activeRef.current === p.conversation.id;
            if (!isActive && soundOnRef.current) {
              playNewMessageSound();
              flashTitle();
            }
          }
          if (activeRef.current === p.conversation.id) {
            setMessages(prev =>
              prev.some(m => m.id === p.message?.id) ? prev : [...prev, p.message],
            );
            setActiveConv(p.conversation || null);
            scrollToBottom();
          }
          return;
        }
        if (msg.type === 'chat:closed') {
          const p = (msg.payload || {}) as { conversation: ConversationItem };
          if (p.conversation) {
            setConversations(prev => prev.map(c => (c.id === p.conversation.id ? p.conversation : c)));
            if (activeRef.current === p.conversation.id) setActiveConv(p.conversation);
          }
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
          if (p.conversationId && p.role === 'user') {
            setConversations(prev =>
              prev.map(c => (c.id === p.conversationId ? { ...c, unread_user: 0 } : c)),
            );
          }
          return;
        }
        if (msg.type === 'chat:tags' || msg.type === 'chat:remark') {
          const p = (msg.payload || {}) as { conversation: ConversationItem };
          if (p.conversation && activeRef.current === p.conversation.id) {
            setActiveConv(p.conversation);
            setConversations(prev =>
              prev.map(c => (c.id === p.conversation.id ? p.conversation : c)),
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

  // 初始化
  useEffect(() => {
    fetchConversations();
    fetchQuickReplies();
    const prefs = getSoundPrefs();
    setSoundOn(prefs.enabled);
    soundOnRef.current = prefs.enabled;
    // 首次加载完成后同步一次表单值（用于设置弹窗），此后由 WS/保存事件更新
    (async () => {
      try {
        const res = await fetch('/api/admin/support?status=all');
        if (res.ok) {
          const data = await res.json();
          if (data.settings) {
            const s = data.settings as SupportSettings;
            setSettings(s);
            setWorkStart(s.work_start || '09:00');
            setWorkEnd(s.work_end || '23:00');
            setGreeting(s.auto_greeting || '');
          }
        }
      } catch {
        // ignore
      }
    })();
  }, [fetchConversations, fetchQuickReplies]);

  // 提示音开关
  const toggleSound = () => {
    setSoundOn(prev => {
      const next = !prev;
      soundOnRef.current = next;
      saveSoundPrefs({ enabled: next, volume: getSoundPrefs().volume });
      return next;
    });
  };

  // 轮询兜底（WS 断开时 2s 刷新会话列表 + 当前会话消息，保证前后端可交流）
  useEffect(() => {
    if (connected) return;
    const timer = setInterval(() => {
      fetchConversations();
      // 关键：同步刷新当前正在查看的会话消息，否则 WS 断开时收不到用户新消息
      const id = activeRef.current;
      if (id) loadMessages(id);
    }, 2000);
    return () => clearInterval(timer);
  }, [connected, fetchConversations, loadMessages]);

  // 发送
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
          setMessages(prev => (prev.some(m => m.id === data.message?.id) ? prev : [...prev, data.message]));
          setConversations(prev => prev.map(c => (c.id === activeId ? data.conversation || c : c)));
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

  // 过滤会话
  const filtered = conversations.filter(c => {
    if (keyword) {
      const kw = keyword.toLowerCase();
      const name = (c.users?.real_name || c.users?.username || '').toLowerCase();
      const ip = (c.visitor_ip || '').toLowerCase();
      const lastMsg = (c.last_message || '').toLowerCase();
      if (!name.includes(kw) && !ip.includes(kw) && !lastMsg.includes(kw)) return false;
    }
    return true;
  });

  const activeIsClosed = activeConv?.status === 'closed';
  const activeStatus = STATUS_META[settings.online] || STATUS_META.online;
  const replyGroups = quickReplies.reduce<Record<string, QuickReply[]>>((acc, r) => {
    (acc[r.category] = acc[r.category] || []).push(r);
    return acc;
  }, {});

  return (
    <div className="flex flex-col h-screen bg-[#0F1724] overflow-hidden select-none">
      {/* ═══ 顶栏：客服状态 + 工作设置 + 提示音 ═══ */}
      <header className="h-14 flex-shrink-0 flex items-center justify-between px-4 bg-gradient-to-r from-[#060E1A] via-[#0A1A30] to-[#060E1A] border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {/* 客服头像（可点击更换） */}
            <button
              onClick={() => avatarInputRef.current?.click()}
              className="relative group flex-shrink-0"
              title="更换客服头像"
            >
              {settings.avatar ? (
                <img
                  src={settings.avatar}
                  alt="客服头像"
                  className="w-8 h-8 rounded-lg object-cover ring-2 ring-white/20 shadow-lg shadow-[#7B61FF]/30"
                />
              ) : (
                <span className="w-8 h-8 rounded-lg bg-gradient-to-bl from-[#00D4FF] to-[#7B61FF] flex items-center justify-center shadow-lg shadow-[#7B61FF]/30">
                  <HeadphoneIcon className="w-4 h-4 text-white" filled />
                </span>
              )}
              <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#060E1A] ${activeStatus.dot}`} />
              <span className="absolute inset-0 rounded-lg bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                <EditIcon className="w-3.5 h-3.5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </span>
            </button>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
            <div className="leading-tight">
              <h1 className="text-[13px] font-bold text-white tracking-wide">惠抢券·客服工作台</h1>
              <p className={`text-[10px] ${connected ? 'text-green-400' : 'text-amber-400'}`}>
                {connected ? '● 实时通道已连接' : '○ 轮询模式（延迟兜底）'}
              </p>
            </div>
          </div>
          <a
            href="/admin"
            className="ml-2 text-[11px] text-gray-400 hover:text-white border border-white/10 rounded-md px-2.5 py-1 transition-colors"
          >
            返回管理后台
          </a>
        </div>

        <div className="flex items-center gap-2.5">
          {/* 客服状态切换 */}
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg pl-3 pr-1.5 py-1.5">
            <span className={`w-2 h-2 rounded-full ${activeStatus.dot} animate-pulse`} />
            <select
              value={settings.online}
              onChange={e => updateOnline(e.target.value as 'online' | 'busy' | 'offline')}
              className="text-xs font-medium text-gray-200 bg-transparent outline-none cursor-pointer"
            >
              <option value="online" className="text-gray-800">在线（可接待）</option>
              <option value="busy" className="text-gray-800">忙碌</option>
              <option value="offline" className="text-gray-800">离线</option>
            </select>
          </div>
          {/* 工作时间 */}
          <button
            onClick={() => setShowSettings(true)}
            className="flex items-center gap-1.5 text-xs text-gray-300 bg-white/5 border border-white/10 rounded-lg px-3 py-2 hover:bg-white/10 transition-colors"
            title="修改工作时间与欢迎语"
          >
            <ClockIcon className="w-3.5 h-3.5" />
            {settings.work_start}-{settings.work_end}
          </button>
          {/* 提示音开关 */}
          <button
            onClick={toggleSound}
            className={`flex items-center gap-1.5 text-xs rounded-lg px-3 py-2 border transition-colors ${
              soundOn
                ? 'text-[#00D4FF] border-[#00D4FF]/40 bg-[#00D4FF]/10 hover:bg-[#00D4FF]/20'
                : 'text-gray-500 border-white/10 bg-white/5 hover:bg-white/10'
            }`}
            title={soundOn ? '新消息提示音：开（点击关闭）' : '新消息提示音：关（点击开启）'}
          >
            <MusicIcon className="w-3.5 h-3.5" />
            {soundOn ? '提示音开' : '提示音关'}
          </button>
          <button
            onClick={fetchConversations}
            className="text-xs text-gray-300 bg-white/5 border border-white/10 rounded-lg px-3 py-2 hover:bg-white/10 transition-colors"
          >
            刷新
          </button>
        </div>
      </header>

      {/* ═══ 设置弹窗 ═══ */}
      {showSettings && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setShowSettings(false)}
        >
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-gray-800 text-[15px]">客服工作设置</h3>
              <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-gray-600">
                <XIcon className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
              {/* 客服头像设置 */}
              <div>
                <label className="text-xs text-gray-500 block mb-2">客服头像（用户端同步展示）</label>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    {settings.avatar ? (
                      <img
                        src={settings.avatar}
                        alt="客服头像"
                        className="w-16 h-16 rounded-2xl object-cover shadow-md shadow-[#7B61FF]/20 ring-2 ring-[#00D4FF]/30"
                      />
                    ) : (
                      <span className="w-16 h-16 rounded-2xl bg-gradient-to-bl from-[#00D4FF] to-[#7B61FF] flex items-center justify-center shadow-md shadow-[#7B61FF]/20">
                        <HeadphoneIcon className="w-7 h-7 text-white" filled />
                      </span>
                    )}
                    <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${activeStatus.dot}`} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <button
                      onClick={() => avatarInputRef.current?.click()}
                      className="text-[11.5px] text-[#1890FF] bg-[#E6F7FF] border border-[#1890FF]/20 rounded-lg px-3 py-1.5 hover:bg-[#B9E6FF] transition-colors"
                    >
                      上传新头像
                    </button>
                    {settings.avatar && (
                      <button
                        onClick={clearAvatar}
                        className="text-[11.5px] text-red-400 bg-red-50/60 border border-red-100 rounded-lg px-3 py-1.5 hover:bg-red-50 transition-colors"
                      >
                        恢复默认图标
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-[10px] text-gray-300 mt-1.5">支持 JPG/PNG，自动压缩为 160px 圆形头像</p>
              </div>
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
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 text-xs text-gray-500 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                取消
              </button>
              <button
                onClick={saveSettings}
                className="px-5 py-2 text-xs text-white bg-gradient-to-r from-[#1890FF] to-[#00B4FF] rounded-lg hover:opacity-90"
              >
                保存设置
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ 工作台（垂直图标栏 + 左功能面板 + 聊天区 + 右客户信息）═══ */}
      <div className="flex-1 flex overflow-hidden">
        {/* ── 最左：垂直图标栏（CRMChat 风格）── */}
        <aside className="w-[52px] flex-shrink-0 flex flex-col items-center bg-gradient-to-b from-[#060E1A] via-[#0A1A30] to-[#060E1A] border-r border-white/5 py-2.5 z-10">
          {/* 客服头像（可上传，绿点在线） */}
          <button
            onClick={() => avatarInputRef.current?.click()}
            className="relative group mb-4 cursor-pointer"
            title="更换客服头像"
          >
            {settings.avatar ? (
              <img
                src={settings.avatar}
                alt="客服"
                className="w-9 h-9 rounded-full object-cover ring-2 ring-white/20 shadow-lg shadow-[#7B61FF]/30"
              />
            ) : (
              <span className="w-9 h-9 rounded-full bg-gradient-to-bl from-[#00D4FF] to-[#7B61FF] flex items-center justify-center shadow-lg shadow-[#7B61FF]/30">
                <HeadphoneIcon className="w-4.5 h-4.5 text-white" filled />
              </span>
            )}
            <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#0A1A30] ${activeStatus.dot}`} />
          </button>

          {/* 图标组 */}
          <div className="flex flex-col items-center gap-1 flex-1">
            {/* 对话（当前激活） */}
            <button
              onClick={() => setLeftPanel('conversations')}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all relative ${
                leftPanel === 'conversations'
                  ? 'bg-gradient-to-br from-[#00D4FF] to-[#7B61FF] text-white shadow-lg shadow-[#7B61FF]/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/10'
              }`}
              title="会话列表"
            >
              <MoreIcon className="w-5 h-5" />
              {unreadTotal > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-[#FE2C55] text-white text-[9px] font-bold flex items-center justify-center shadow-sm">
                  {unreadTotal > 99 ? '99+' : unreadTotal}
                </span>
              )}
            </button>
            {/* 访客监控 */}
            <button
              className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all"
              title="访客监控"
            >
              <EarthIcon className="w-5 h-5" />
            </button>
            {/* 消息 */}
            <button
              className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all relative"
              title="消息记录"
            >
              <ChatIcon className="w-5 h-5" />
            </button>
            {/* 数据统计 */}
            <button
              className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all"
              title="数据统计"
            >
              <ChartIcon className="w-5 h-5" />
            </button>
            {/* 快捷话术（用户要求左侧功能栏） */}
            <button
              onClick={() => setLeftPanel(leftPanel === 'quickreplies' ? 'conversations' : 'quickreplies')}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                leftPanel === 'quickreplies'
                  ? 'bg-gradient-to-br from-[#00D4FF] to-[#7B61FF] text-white shadow-lg shadow-[#7B61FF]/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/10'
              }`}
              title="快捷话术库"
            >
              <TagIcon className="w-5 h-5" />
            </button>
            {/* 系统通知 */}
            <button
              className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all"
              title="系统通知"
            >
              <BellIcon className="w-5 h-5" />
            </button>
          </div>

          {/* 底部：设置 & 收起 */}
          <button
            onClick={() => setShowSettings(true)}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all"
            title="客服工作设置（头像/在线/工作时间）"
          >
            <GearIcon className="w-5 h-5" />
          </button>
        </aside>

        {/* ── 左功能面板：会话列表 / 快捷话术库 ── */}
        <aside className="w-72 lg:w-80 flex-shrink-0 flex flex-col bg-white border-r border-gray-100">
          {leftPanel === 'quickreplies' ? (
            <>
              {/* ═══ 快捷话术库面板 ═══ */}
              <div className="px-4 pt-4 pb-3 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-[13px] font-bold text-gray-800 flex items-center gap-1.5">
                  <TagIcon className="w-4 h-4 text-[#1890FF]" /> 快捷话术库
                </h2>
                <span className="text-[10px] text-gray-300">{quickReplies.length} 条</span>
              </div>
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                {Object.keys(replyGroups).length === 0 && (
                  <p className="text-[11.5px] text-gray-300 text-center py-8">暂无话术，在下方录入第一条</p>
                )}
                {Object.entries(replyGroups).map(([category, list]) => (
                  <div key={category}>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1.5">{category}</p>
                    <div className="space-y-1.5">
                      {list.map(r => (
                        <div key={r.id} className="group flex items-start gap-1.5">
                          <button
                            onClick={() => {
                              if (activeId && !activeIsClosed) setInput(r.content);
                            }}
                            className="flex-1 text-left text-[12px] text-gray-600 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 hover:border-[#1890FF]/40 hover:text-[#1890FF] hover:bg-[#F0F8FF] transition-colors"
                          >
                            {r.content}
                          </button>
                          <button
                            onClick={() => removeQuickReply(r.id)}
                            className="text-gray-300 hover:text-[#FE2C55] opacity-0 group-hover:opacity-100 transition-opacity mt-1.5"
                            title="删除话术"
                          >
                            <TrashIcon className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/60">
                <div className="flex items-center gap-2">
                  <input
                    value={newReplyContent}
                    onChange={e => setNewReplyContent(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') addQuickReply();
                    }}
                    placeholder="录入新话术，回车保存"
                    className="flex-1 text-xs bg-white border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#1890FF]"
                  />
                  <button
                    onClick={addQuickReply}
                    className="text-xs text-white bg-[#1890FF] rounded-lg px-3 py-2 hover:bg-[#1890FF]/90 inline-flex items-center gap-1 flex-shrink-0"
                  >
                    <PlusIcon className="w-3 h-3" /> 保存
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="px-4 pt-4 pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 focus-within:border-[#1890FF]/50 focus-within:bg-white transition-colors">
              <SearchIcon className="w-4 h-4 text-gray-300" />
              <input
                value={keyword}
                onChange={e => setKeyword(e.target.value)}
                placeholder="搜索 昵称 / IP / 消息"
                className="flex-1 text-xs bg-transparent outline-none placeholder:text-gray-300"
              />
            </div>
            <div className="flex items-center gap-1 mt-3">
              {([
                { key: 'open', label: '进行中' },
                { key: 'all', label: `全部${unreadTotal ? ` · ${unreadTotal}未读` : ''}` },
                { key: 'closed', label: '已结束' },
              ] as const).map(f => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`px-3 py-1.5 rounded-md text-[11.5px] transition-colors ${
                    filter === f.key
                      ? 'bg-[#1890FF] text-white font-medium shadow-sm shadow-[#1890FF]/30'
                      : 'text-gray-400 hover:bg-gray-50'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pb-2">
            {filtered.length === 0 && (
              <div className="py-12 text-center">
                <div className="mx-auto w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-3">
                  <HeadphoneIcon className="w-5 h-5 text-gray-300" />
                </div>
                <p className="text-xs text-gray-300">暂无{filter === 'open' ? '进行中' : ''}会话</p>
              </div>
            )}
            {/* 分组：排队中（有未读）/ 我的对话（已读进行中）/ 访问中（已结束） */}
            {(() => {
              const waiting = filtered.filter(c => c.status === 'open' && (c.unread_admin || 0) > 0);
              const mine = filtered.filter(c => c.status === 'open' && !((c.unread_admin || 0) > 0));
              const closed = filtered.filter(c => c.status === 'closed');
              const groups: { title: string; count: number; list: ConversationItem[] }[] = [];
              if (waiting.length) groups.push({ title: '排队中', count: waiting.length, list: waiting });
              if (mine.length) groups.push({ title: '我的对话', count: mine.length, list: mine });
              if (closed.length) groups.push({ title: '访问中', count: closed.length, list: closed });
              if (filter === 'all' && groups.length === 0) groups.push({ title: '全部会话', count: filtered.length, list: filtered });
              if (filter === 'open' && groups.length === 0) groups.push({ title: '进行中', count: filtered.length, list: filtered });
              if (filter === 'closed' && groups.length === 0) groups.push({ title: '访问中', count: filtered.length, list: filtered });
              return groups.map(group => (
                <div key={group.title}>
                  <div className="px-4 pt-3 pb-1 flex items-center justify-between">
                    <span className="text-[10px] text-gray-400 font-medium tracking-wide">{group.title}</span>
                    <span className="text-[9px] text-gray-300 bg-gray-50 rounded-full px-1.5 py-px">{group.count}</span>
                  </div>
                  {group.list.map(conv => {
                    const userName = conv.users?.real_name || conv.users?.username || '访客';
                    const isActive = conv.id === activeId;
                    const isClosed = conv.status === 'closed';
                    const unread = conv.unread_admin || 0;
                    return (
                      <button
                        key={conv.id}
                        onClick={() => selectConversation(conv.id)}
                        className={`w-full text-left px-4 py-3 border-b border-gray-50 transition-colors ${
                          isActive ? 'bg-[#1890FF]/5' : 'hover:bg-gray-50'
                        } ${isClosed ? 'opacity-55' : ''}`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span
                              className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-[12px] font-bold text-white bg-gradient-to-br ${
                                isClosed ? 'from-gray-300 to-gray-400' : 'from-[#00D4FF] to-[#7B61FF]'
                              }`}
                            >
                              {userName.slice(0, 1)}
                            </span>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className={`text-[12.5px] font-medium truncate ${isActive ? 'text-[#1890FF]' : 'text-gray-800'}`}>
                                  {userName}
                                </span>
                                {isClosed && (
                                  <span className="text-[9px] text-gray-400 bg-gray-100 rounded px-1 py-px flex-shrink-0">已结束</span>
                                )}
                                {(conv.tags || []).slice(0, 2).map(tag => (
                                  <span key={tag} className="text-[9px] text-[#1890FF] bg-[#E6F7FF] rounded px-1 py-px flex-shrink-0">
                                    #{tag}
                                  </span>
                                ))}
                              </div>
                              <p className="text-[10.5px] text-gray-400 truncate mt-0.5">
                                {conv.last_message ? (
                                  (conv.last_message || '').startsWith('[图片]') ? '[图片]' : conv.last_message
                                ) : (
                                  <span className="text-gray-300">新会话，等待消息…</span>
                                )}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1 flex-shrink-0">
                            {unread > 0 && (
                              <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-[#FE2C55] text-white text-[10px] font-bold flex items-center justify-center shadow-sm shadow-[#FE2C55]/40">
                                {unread > 99 ? '99+' : unread}
                              </span>
                            )}
                            {conv.last_message_at && (
                              <span className="text-[10px] text-gray-300">{formatTime(conv.last_message_at)}</span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ));
            })()}
          </div>

          {/* 左栏底部：未读汇总 */}
          <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50/60 text-[10.5px] text-gray-400 flex items-center justify-between">
            <span>共 {filtered.length} 个会话</span>
            {unreadTotal > 0 && <span className="text-[#FE2C55] font-medium">{unreadTotal} 个待处理</span>}
          </div>
            </>
          )}
        </aside>

        {/* ── 中：聊天区 ── */}
        <main className="flex-1 flex flex-col min-w-0 bg-[#F5F7FA]">
          {/* 会话头 */}
          {activeId ? (
            <div className="h-14 flex-shrink-0 flex items-center justify-between px-5 bg-white border-b border-gray-100">
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-9 h-9 rounded-full flex-shrink-0 bg-gradient-to-br from-[#00D4FF] to-[#7B61FF] flex items-center justify-center text-[13px] font-bold text-white">
                  {(activeUser?.real_name || activeUser?.username || '访').slice(0, 1)}
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[13.5px] font-semibold text-gray-800">
                      {activeUser?.real_name || activeUser?.username || '访客'}
                    </span>
                    <span className="text-[10.5px] text-gray-400">@{activeUser?.username || '-'}</span>
                    {activeIsClosed && (
                      <span className="text-[9.5px] text-gray-400 bg-gray-100 rounded px-1.5 py-0.5">会话已结束</span>
                    )}
                  </div>
                  <p className="text-[10.5px] text-gray-400 truncate">
                    {device?.device || '未知设备'} · {device?.os || '-'} · {device?.browser || '-'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {(activeConv?.tags || []).slice(0, 3).map(tag => (
                  <span key={tag} className="text-[10px] text-[#1890FF] bg-[#E6F7FF] rounded px-2 py-0.5">
                    #{tag}
                  </span>
                ))}
                {activeIsClosed ? (
                  <button
                    onClick={reopenActiveConversation}
                    className="text-[11px] text-[#1890FF] bg-[#E6F7FF] border border-[#1890FF]/20 rounded-md px-3 py-1.5 hover:bg-[#B9E6FF] transition-colors inline-flex items-center gap-1"
                  >
                    <CheckIcon className="w-3 h-3" /> 重新接待
                  </button>
                ) : (
                  <button
                    onClick={closeActiveConversation}
                    className="text-[11px] text-[#FE2C55] bg-[#FE2C55]/5 border border-[#FE2C55]/25 rounded-md px-3 py-1.5 hover:bg-[#FE2C55]/10 transition-colors inline-flex items-center gap-1"
                  >
                    <PowerIcon className="w-3 h-3" /> 结束会话
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="h-14 flex-shrink-0 flex items-center px-5 bg-white border-b border-gray-100 text-sm text-gray-400">
              选择一个会话开始接待
            </div>
          )}

          {/* 消息流 */}
          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-1">
            {!activeId && (
              <div className="h-full flex flex-col items-center justify-center text-gray-300">
                <HeadphoneIcon className="w-14 h-14 mb-3" filled />
                <p className="text-sm">从左侧选择会话，开始为用户服务</p>
                <p className="text-xs text-gray-200 mt-1">新消息会实时送达并响铃提醒</p>
              </div>
            )}
            {messages.map((msg, idx) => {
              const isUser = msg.sender === 'user';
              const isImage = msg.msg_type === 'image';
              const prev = messages[idx - 1];
              const showTime = !prev || prev.sender !== msg.sender || new Date(msg.created_at).getTime() - new Date(prev.created_at).getTime() > 5 * 60 * 1000;
              return (
                <div key={msg.id}>
                  {showTime && (
                    <div className="flex items-center justify-center my-3">
                      <span className="text-[10px] text-gray-300 bg-white rounded-full px-2 py-0.5 border border-gray-50">
                        {formatTime(msg.created_at)}
                      </span>
                    </div>
                  )}
                  <div className={`flex ${isUser ? 'justify-start' : 'justify-end'} mb-2`}>
                    {isUser && (
                      <span className="w-7 h-7 rounded-full flex-shrink-0 mr-2 mt-1 bg-gradient-to-br from-[#00D4FF] to-[#7B61FF] flex items-center justify-center text-[10px] font-bold text-white">
                        {(activeUser?.real_name || activeUser?.username || '访').slice(0, 1)}
                      </span>
                    )}
                    <div className={`max-w-[65%] ${isUser ? '' : 'flex flex-col items-end'}`}>
                      {isImage ? (
                        <img
                          src={msg.image_url || msg.content}
                          alt="图片消息"
                          className="rounded-xl max-w-[240px] border border-gray-100 shadow-sm"
                          onClick={() => window.open(msg.image_url || msg.content, '_blank')}
                        />
                      ) : (
                        <div
                          className={`px-3.5 py-2.5 text-[13px] leading-relaxed rounded-xl whitespace-pre-wrap break-words ${
                            isUser
                              ? 'bg-white text-gray-700 border border-gray-100 rounded-bl-sm shadow-sm'
                              : 'bg-gradient-to-r from-[#1890FF] to-[#00B4FF] text-white rounded-br-sm shadow-md shadow-[#00B4FF]/15'
                          }`}
                        >
                          {msg.content}
                        </div>
                      )}
                    </div>
                    {!isUser && (
                      settings.avatar ? (
                        <img
                          src={settings.avatar}
                          alt="客服"
                          className="w-7 h-7 rounded-full flex-shrink-0 ml-2 mt-1 object-cover ring-1 ring-[#00B4FF]/30"
                        />
                      ) : (
                        <span className="w-7 h-7 rounded-full flex-shrink-0 ml-2 mt-1 bg-gradient-to-br from-[#00D4FF] to-[#7B61FF] flex items-center justify-center">
                          <HeadphoneIcon className="w-3.5 h-3.5 text-white" filled />
                        </span>
                      )
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* 输入区 */}
          <div className="flex-shrink-0 bg-white border-t border-gray-100">
            {activeIsClosed && activeId ? (
              <div className="px-5 py-4 text-center">
                <span className="text-xs text-gray-400 mr-3">会话已结束，无法发送消息</span>
                <button
                  onClick={reopenActiveConversation}
                  className="text-xs text-[#1890FF] bg-[#E6F7FF] rounded-md px-3 py-1.5 hover:bg-[#B9E6FF]"
                >
                  点击重新接待
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-end gap-2 px-4 py-3">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={sendingImage}
                    className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-gray-400 hover:text-[#1890FF] hover:bg-[#1890FF]/5 transition-colors"
                    title="发送图片"
                  >
                    <PictureIcon className="w-5 h-5" />
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
                  <button
                    onClick={() => {
                      if (activeId && !activeIsClosed) {
                        setLeftPanel('quickreplies');
                        fetchQuickReplies();
                      }
                    }}
                    className={`flex-shrink-0 h-9 px-3 rounded-lg flex items-center gap-1 text-[11px] transition-colors ${
                      leftPanel === 'quickreplies'
                        ? 'bg-[#1890FF] text-white'
                        : 'text-gray-400 hover:text-[#1890FF] hover:bg-[#1890FF]/5'
                    }`}
                    title="快捷话术（左侧面板）"
                  >
                    <TagIcon className="w-4 h-4" /> 话术
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
                    placeholder={activeId ? '输入消息，Enter 发送，Shift+Enter 换行' : '请先选择会话'}
                    disabled={!activeId}
                    className="flex-1 bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-[13px] outline-none resize-none focus:border-[#1890FF]/40 focus:bg-white min-h-[40px] max-h-28 transition-colors disabled:opacity-50"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || !activeId || sending}
                    className="flex-shrink-0 h-9 px-5 rounded-xl bg-gradient-to-r from-[#1890FF] to-[#00B4FF] text-white text-[12px] font-medium flex items-center gap-1.5 shadow-md shadow-[#00B4FF]/20 hover:opacity-90 active:scale-95 transition-all disabled:opacity-40 disabled:shadow-none"
                  >
                    <SendIcon className="w-3.5 h-3.5" /> 发送
                  </button>
                </div>
              </>
            )}
          </div>
        </main>

        {/* ── 右：客户信息面板 ── */}
        <aside className="w-72 xl:w-80 flex-shrink-0 flex flex-col bg-white border-l border-gray-100 hidden md:flex">
          {activeId && activeConv ? (
            <>
              {/* 客户档案 */}
              <div className="px-5 pt-5 pb-4 bg-gradient-to-b from-[#F0F8FF] to-white border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <span className="w-12 h-12 rounded-full bg-gradient-to-br from-[#00D4FF] to-[#7B61FF] flex items-center justify-center text-[16px] font-bold text-white shadow-md shadow-[#7B61FF]/20">
                    {(activeUser?.real_name || activeUser?.username || '访').slice(0, 1)}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[14px] font-bold text-gray-800 truncate">
                        {activeUser?.real_name || activeUser?.username || '访客'}
                      </span>
                      {activeUser?.verify_status === 'verified' && (
                        <span className="text-[9px] text-green-600 bg-green-50 border border-green-100 rounded px-1 py-px flex-shrink-0">
                          已实名
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-400 mt-0.5">@{activeUser?.username || '未登录访客'}</p>
                    <p className="text-[10px] text-gray-300 mt-0.5">
                      注册于 {activeUser?.created_at ? formatTime(activeUser.created_at) : '-'}
                    </p>
                  </div>
                </div>
                {/* 访客网络信息 */}
                <div className="mt-3.5 grid grid-cols-1 gap-1.5">
                  <div className="flex items-center gap-2 text-[11px] text-gray-500">
                    <EarthIcon className="w-3.5 h-3.5 text-gray-300" />
                    <span className="text-gray-400">IP</span>
                    <span className="font-mono text-gray-600">{activeConv.visitor_ip || '-'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-gray-500">
                    <MoreIcon className="w-3.5 h-3.5 text-gray-300" />
                    <span className="text-gray-400">设备</span>
                    <span className="truncate">
                      {device?.device || '未知'} · {device?.os || '-'} · {device?.browser || '-'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 账户信息 */}
              <div className="px-5 py-4 border-b border-gray-50">
                <p className="text-[11px] font-medium text-gray-400 mb-2.5 uppercase tracking-wide">账户信息</p>
                <div className="space-y-2 text-[11.5px]">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">手机号</span>
                    <span className="text-gray-700 font-mono">{activeUser?.phone || '未绑定'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">实名认证</span>
                    <span className="text-gray-700">
                      {VERIFY_LABEL[activeUser?.verify_status || 'unverified'] || '未实名'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">账户冻结</span>
                    <span className={activeUser?.login_frozen || activeUser?.funds_frozen ? 'text-[#FE2C55]' : 'text-green-500'}>
                      {activeUser?.login_frozen || activeUser?.funds_frozen ? '已冻结' : '正常'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 标签管理 */}
              <div className="px-5 py-4 border-b border-gray-50">
                <p className="text-[11px] font-medium text-gray-400 mb-2.5 uppercase tracking-wide">客户标签</p>
                <div className="flex flex-wrap gap-1.5 mb-2.5">
                  {(activeConv.tags || []).length === 0 && (
                    <span className="text-[11px] text-gray-300">暂无标签</span>
                  )}
                  {(activeConv.tags || []).map(tag => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 text-[10.5px] text-[#1890FF] bg-[#E6F7FF] rounded-md pl-2 pr-1 py-1"
                    >
                      #{tag}
                      <button
                        onClick={() => setTags((activeConv.tags || []).filter(t => t !== tag))}
                        className="text-[#1890FF]/50 hover:text-[#FE2C55] transition-colors"
                      >
                        <XIcon className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <QuickTagAdder
                  current={activeConv.tags || []}
                  onAdd={tags => setTags(tags)}
                />
              </div>

              {/* 备注 */}
              <div className="px-5 py-4 border-b border-gray-50">
                <p className="text-[11px] font-medium text-gray-400 mb-2.5 uppercase tracking-wide">客户备注</p>
                <RemarkEditor value={activeConv.remark || ''} onSave={setRemark} />
              </div>

              {/* 会话信息 */}
              <div className="px-5 py-4">
                <p className="text-[11px] font-medium text-gray-400 mb-2.5 uppercase tracking-wide">会话信息</p>
                <div className="space-y-2 text-[11.5px]">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">会话编号</span>
                    <span className="text-gray-600 font-mono">{activeConv.id.slice(0, 8)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">开始时间</span>
                    <span className="text-gray-600">{formatTime(activeConv.created_at)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">状态</span>
                    <span className={activeIsClosed ? 'text-gray-400' : 'text-green-500'}>
                      {activeIsClosed ? '已结束' : '进行中'}
                    </span>
                  </div>
                  {activeConv.closed_at && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">结束时间</span>
                      <span className="text-gray-600">{formatTime(activeConv.closed_at)}</span>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-200 text-xs">
              选择会话查看客户信息
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

// ─── 子组件：快捷标签添加 ───
function QuickTagAdder({ current, onAdd }: { current: string[]; onAdd: (tags: string[]) => void }) {
  const [value, setValue] = useState('');
  const SUGGESTIONS = ['VIP', '高意向', '投诉', '售后', '咨询', '复购'];

  const submit = (tag: string) => {
    const t = tag.trim();
    if (!t || current.includes(t) || current.length >= 10) return;
    onAdd([...current, t]);
    setValue('');
  };

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {SUGGESTIONS.filter(s => !current.includes(s)).slice(0, 4).map(s => (
          <button
            key={s}
            onClick={() => submit(s)}
            className="text-[10px] text-gray-400 bg-gray-50 border border-gray-100 rounded px-2 py-1 hover:text-[#1890FF] hover:border-[#1890FF]/30 transition-colors"
          >
            +{s}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-1.5">
        <input
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') submit(value);
          }}
          placeholder="自定义标签"
          maxLength={20}
          className="flex-1 text-[11px] bg-gray-50 border border-gray-100 rounded-lg px-2.5 py-1.5 outline-none focus:border-[#1890FF]/40"
        />
        <button
          onClick={() => submit(value)}
          className="text-[11px] text-white bg-[#1890FF] rounded-lg px-2.5 py-1.5 hover:bg-[#1890FF]/90 inline-flex items-center gap-0.5"
        >
          <PlusIcon className="w-3 h-3" /> 添加
        </button>
      </div>
    </div>
  );
}

// ─── 子组件：备注编辑 ───
function RemarkEditor({ value, onSave }: { value: string; onSave: (v: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  if (!editing) {
    return (
      <div>
        <div className="group flex items-start justify-between gap-2">
          <p className="text-[11.5px] text-gray-500 leading-relaxed whitespace-pre-wrap">
            {value || <span className="text-gray-300">暂无备注，点击右侧按钮添加</span>}
          </p>
          <button
            onClick={() => setEditing(true)}
            className="text-gray-300 hover:text-[#1890FF] flex-shrink-0"
            title="编辑备注"
          >
            <EditIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <textarea
        value={draft}
        onChange={e => setDraft(e.target.value)}
        rows={3}
        maxLength={200}
        autoFocus
        placeholder="记录客户特征、需求等（最多200字）"
        className="w-full text-[11.5px] bg-gray-50 border border-gray-100 rounded-lg px-2.5 py-2 outline-none focus:border-[#1890FF]/40 resize-none"
      />
      <div className="flex justify-end gap-2 mt-1.5">
        <button
          onClick={() => {
            setDraft(value);
            setEditing(false);
          }}
          className="text-[10.5px] text-gray-400 hover:text-gray-600 px-2 py-1"
        >
          取消
        </button>
        <button
          onClick={() => {
            onSave(draft.trim());
            setEditing(false);
          }}
          className="text-[10.5px] text-white bg-[#1890FF] rounded-md px-3 py-1 hover:bg-[#1890FF]/90"
        >
          保存
        </button>
      </div>
    </div>
  );
}