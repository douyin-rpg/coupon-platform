'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface NotificationItem {
  id: string;
  type: 'order' | 'redemption' | 'withdrawal' | 'verification';
  title: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export function AdminNotification() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [lastCheck, setLastCheck] = useState(new Date().toISOString());
  const audioCtxRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastUnreadRef = useRef<Set<string>>(new Set());

  // 播放提示音 - 使用 Web Audio API 生成
  const playNotificationSound = useCallback((type: string) => {
    if (!soundEnabled) return;
    try {
      const ctx = audioCtxRef.current || new AudioContext();
      audioCtxRef.current = ctx;

      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      // 不同类型用不同音调
      if (type === 'order') {
        oscillator.frequency.setValueAtTime(880, ctx.currentTime); // A5 高音
        oscillator.frequency.setValueAtTime(1100, ctx.currentTime + 0.15);
        oscillator.frequency.setValueAtTime(1320, ctx.currentTime + 0.3);
      } else if (type === 'redemption') {
        oscillator.frequency.setValueAtTime(660, ctx.currentTime);
        oscillator.frequency.setValueAtTime(880, ctx.currentTime + 0.15);
        oscillator.frequency.setValueAtTime(1100, ctx.currentTime + 0.3);
      } else if (type === 'withdrawal') {
        oscillator.frequency.setValueAtTime(523, ctx.currentTime);
        oscillator.frequency.setValueAtTime(659, ctx.currentTime + 0.15);
        oscillator.frequency.setValueAtTime(784, ctx.currentTime + 0.3);
      } else {
        oscillator.frequency.setValueAtTime(700, ctx.currentTime);
      }

      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.5);
    } catch {
      // Web Audio API not available
    }
  }, [soundEnabled]);

  const checkNotifications = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/notifications?since=${encodeURIComponent(lastCheck)}&limit=50`);
      if (!res.ok) return;
      const data = await res.json();

      const newItems: NotificationItem[] = data.notifications || [];

      if (newItems.length > 0) {
        setNotifications(prev => [...newItems, ...prev].slice(0, 100));
        // 有未读的新通知时播放提示音（只对未读的播放一次）
        const newUnread = newItems.filter(n => !n.is_read && !lastUnreadRef.current.has(n.id));
        if (newUnread.length > 0) {
          playNotificationSound(newUnread[0].type);
          newUnread.forEach(n => lastUnreadRef.current.add(n.id));
          // 仅在有新通知时自动展开，形成强通知效果
          setOpen(true);
        }
      }

      setUnreadCount(typeof data.unreadCount === 'number' ? data.unreadCount : 0);
      setLastCheck(new Date().toISOString());
    } catch {
      // ignore
    }
  }, [lastCheck, playNotificationSound]);

  useEffect(() => {
    // 初始化 AudioContext（需要用户交互后才能播放）
    const initAudio = () => {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContext();
      }
      document.removeEventListener('click', initAudio);
    };
    document.addEventListener('click', initAudio);

    // 首次拉取全部通知（不含 since，用于初始化角标）
    const initFetch = async () => {
      try {
        const res = await fetch('/api/admin/notifications?limit=50');
        if (!res.ok) return;
        const data = await res.json();
        setNotifications((data.notifications || []).slice(0, 100));
        setUnreadCount(typeof data.unreadCount === 'number' ? data.unreadCount : 0);
        (data.notifications || []).forEach((n: NotificationItem) => {
          if (!n.is_read) lastUnreadRef.current.add(n.id);
        });
      } catch {
        // ignore
      }
    };
    initFetch();

    // 每10秒轮询
    intervalRef.current = setInterval(checkNotifications, 10000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.removeEventListener('click', initAudio);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 标记已读
  const markRead = async (ids?: string[]) => {
    try {
      await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ids && ids.length > 0 ? { ids } : { all: true }),
      });
      setNotifications(prev => prev.map(n => (ids && !ids.includes(n.id)) || !ids ? { ...n, is_read: true } : n));
      setUnreadCount(0);
    } catch {
      // ignore
    }
  };

  const typeLabel: Record<string, { text: string; color: string }> = {
    order: { text: '抢券', color: 'bg-red-500' },
    redemption: { text: '回收', color: 'bg-amber-500' },
    withdrawal: { text: '提现', color: 'bg-blue-500' },
    verification: { text: '实名', color: 'bg-green-500' },
  };

  const typeHref: Record<string, string> = {
    order: '/admin/orders',
    redemption: '/admin/redemptions',
    withdrawal: '/admin/withdrawals',
    verification: '/admin/verify',
  };

  // 点击通知跳转到对应审核页
  const goToPage = (type: string) => {
    const href = typeHref[type];
    if (href) window.location.href = href;
  };

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col items-end gap-1">
      {/* 操作区：铃铛 + 声音开关 */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="flex items-center gap-1.5 rounded-full bg-gray-800/90 px-3 py-1.5 text-xs text-white shadow-lg hover:bg-gray-700 transition-colors backdrop-blur"
          title={soundEnabled ? '关闭声音提示' : '开启声音提示'}
        >
          {soundEnabled ? (
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z"/>
            </svg>
          ) : (
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd"/>
            </svg>
          )}
        </button>

        {/* 通知铃铛 */}
        <button
          onClick={() => setOpen(!open)}
          className="relative flex h-8 w-8 items-center justify-center rounded-full bg-gray-800/90 text-white shadow-lg hover:bg-gray-700 transition-colors backdrop-blur"
          title="后台通知"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white animate-pulse">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* 通知列表 */}
      {open && (
        <div className="w-80 max-h-[70vh] overflow-hidden rounded-xl bg-white shadow-2xl border border-gray-100 flex flex-col">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 bg-gray-50">
            <span className="text-sm font-bold text-gray-800">后台通知</span>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={() => markRead()}
                  className="text-[11px] text-blue-600 hover:text-blue-800"
                >
                  全部已读
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="py-12 text-center text-gray-400 text-sm">暂无通知</div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => { if (!n.is_read) markRead([n.id]); goToPage(n.type); }}
                  className={`flex items-start gap-2.5 px-4 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 cursor-pointer transition ${!n.is_read ? 'bg-blue-50/40' : ''}`}
                >
                  <span className={`mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-white text-[10px] font-medium ${typeLabel[n.type]?.color || 'bg-gray-500'}`}>
                    {typeLabel[n.type]?.text || '通知'}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-gray-800">{n.title}</div>
                    <div className="text-xs text-gray-600 leading-snug mt-0.5 line-clamp-2">{n.content}</div>
                    <div className="text-[10px] text-gray-400 mt-1">{new Date(n.created_at).toLocaleString()}</div>
                  </div>
                  {!n.is_read && <span className="mt-1.5 w-2 h-2 rounded-full bg-red-500 shrink-0" />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}