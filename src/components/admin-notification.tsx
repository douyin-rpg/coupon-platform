'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface NotificationItem {
  id: string;
  type: 'order' | 'redemption' | 'withdrawal' | 'verification';
  message: string;
  time: string;
}

export function AdminNotification() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [lastCheck, setLastCheck] = useState(new Date().toISOString());
  const audioCtxRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
      const res = await fetch(`/api/admin/notifications?since=${encodeURIComponent(lastCheck)}`);
      if (!res.ok) return;
      const data = await res.json();

      const newNotifications: NotificationItem[] = [];
      const now = new Date().toISOString();

      if (data.orders && data.orders.length > 0) {
        for (const order of data.orders) {
          newNotifications.push({
            id: order.id,
            type: 'order',
            message: `用户 ${order.users?.username || '未知'} 抢购了 ${order.coupons?.name || '优惠券'} ¥${order.coupons?.price || 0}`,
            time: order.created_at,
          });
        }
        playNotificationSound('order');
      }

      if (data.redemptions && data.redemptions.length > 0) {
        for (const red of data.redemptions) {
          newNotifications.push({
            id: red.id,
            type: 'redemption',
            message: `用户 ${red.users?.username || '未知'} 申请了回兑`,
            time: red.created_at,
          });
        }
        playNotificationSound('redemption');
      }

      if (data.withdrawals && data.withdrawals.length > 0) {
        for (const wd of data.withdrawals) {
          newNotifications.push({
            id: wd.id,
            type: 'withdrawal',
            message: `用户 ${wd.users?.username || '未知'} 申请提现 ¥${wd.amount}`,
            time: wd.created_at,
          });
        }
        playNotificationSound('withdrawal');
      }

      if (newNotifications.length > 0) {
        setNotifications(prev => [...newNotifications, ...prev].slice(0, 50));
      }

      setLastCheck(now);
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

    // 每10秒轮询一次
    intervalRef.current = setInterval(checkNotifications, 10000);
    // 首次也检查一次
    checkNotifications();

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.removeEventListener('click', initAudio);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const typeLabel: Record<string, { text: string; color: string }> = {
    order: { text: '抢券', color: 'bg-red-500' },
    redemption: { text: '回兑', color: 'bg-amber-500' },
    withdrawal: { text: '提现', color: 'bg-blue-500' },
    verification: { text: '认证', color: 'bg-green-500' },
  };

  return (
    <div className="fixed top-4 right-4 z-50">
      {/* 声音开关 */}
      <button
        onClick={() => setSoundEnabled(!soundEnabled)}
        className="mb-2 flex items-center gap-1.5 rounded-full bg-gray-800 px-3 py-1.5 text-xs text-white shadow-lg hover:bg-gray-700 transition-colors"
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
        {soundEnabled ? '声音开' : '声音关'}
      </button>

      {/* 通知列表 */}
      {notifications.length > 0 && (
        <div className="w-72 max-h-60 overflow-y-auto rounded-lg bg-white shadow-xl border border-gray-200">
          {notifications.map((n, i) => (
            <div
              key={`${n.id}-${i}`}
              className="flex items-start gap-2 px-3 py-2 border-b border-gray-100 last:border-0 hover:bg-gray-50 text-xs"
            >
              <span className={`mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-white text-[10px] font-medium ${typeLabel[n.type]?.color || 'bg-gray-500'}`}>
                {typeLabel[n.type]?.text || '通知'}
              </span>
              <span className="text-gray-700 leading-tight">{n.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
