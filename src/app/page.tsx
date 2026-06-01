'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Session {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

interface Coupon {
  id: string;
  name: string;
  description: string | null;
  price: string;
  total_quantity: number;
  remaining_quantity: number;
  session_id: string;
  image_url: string | null;
  is_active: boolean;
  grab_sessions: { name: string; start_time: string; end_time: string } | null;
}

interface UserInfo {
  id: string;
  username: string;
  realName: string;
  isVerified: boolean;
  paymentAccount: string | null;
  balance: string;
}

export default function HomePage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [activeSession, setActiveSession] = useState<string>('');
  const [user, setUser] = useState<UserInfo | null>(null);
  const [currentTime, setCurrentTime] = useState('');
  const [grabDialogOpen, setGrabDialogOpen] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [paymentPassword, setPaymentPassword] = useState('');
  const [grabLoading, setGrabLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      }
    } catch {
      // not logged in
    }
  }, []);

  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch('/api/sessions');
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
        if (data.sessions?.length > 0 && !activeSession) {
          setActiveSession(data.sessions[0].id);
        }
      }
    } catch {
      // ignore
    }
  }, [activeSession]);

  const fetchCoupons = useCallback(async () => {
    try {
      const res = await fetch(`/api/coupons${activeSession ? `?sessionId=${activeSession}` : ''}`);
      if (res.ok) {
        const data = await res.json();
        setCoupons(data.coupons || []);
      }
    } catch {
      // ignore
    }
  }, [activeSession]);

  useEffect(() => {
    fetchUser();
    fetchSessions();
  }, [fetchUser, fetchSessions]);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(
        `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const isSessionActive = (session: Session) => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const [startH, startM] = session.start_time.split(':').map(Number);
    const [endH, endM] = session.end_time.split(':').map(Number);
    return currentMinutes >= startH * 60 + startM && currentMinutes < endH * 60 + endM;
  };

  const getSessionStatus = (session: Session) => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const [startH, startM] = session.start_time.split(':').map(Number);
    const [endH, endM] = session.end_time.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    if (currentMinutes >= startMinutes && currentMinutes < endMinutes) return '进行中';
    if (currentMinutes < startMinutes) return '未开始';
    return '已结束';
  };

  const getCountdown = (session: Session) => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const currentSeconds = now.getSeconds();
    const [startH, startM] = session.start_time.split(':').map(Number);
    const [endH, endM] = session.end_time.split(':').map(Number);
    const startTotalSec = (startH * 60 + startM) * 60;
    const endTotalSec = (endH * 60 + endM) * 60;
    const nowTotalSec = currentMinutes * 60 + currentSeconds;

    if (nowTotalSec < startTotalSec) {
      const diff = startTotalSec - nowTotalSec;
      const h = Math.floor(diff / 3600);
      const m = Math.floor((diff % 3600) / 60);
      const s = diff % 60;
      return { label: '距开始', time: `${String(m + h * 60).padStart(2, '0')}:${String(s).padStart(2, '0')}` };
    }
    if (nowTotalSec < endTotalSec) {
      const diff = endTotalSec - nowTotalSec;
      const h = Math.floor(diff / 3600);
      const m = Math.floor((diff % 3600) / 60);
      const s = diff % 60;
      return { label: '距结束', time: `${String(m + h * 60).padStart(2, '0')}:${String(s).padStart(2, '0')}` };
    }
    return { label: '已结束', time: '00:00' };
  };

  const handleGrab = async () => {
    if (!selectedCoupon || !paymentPassword) return;
    setGrabLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/coupons/grab', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ couponId: selectedCoupon.id, paymentPassword }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMessage({ type: 'success', text: '抢券成功！' });
        setGrabDialogOpen(false);
        setPaymentPassword('');
        setSelectedCoupon(null);
        fetchCoupons();
        fetchUser();
      } else {
        setMessage({ type: 'error', text: data.error || '抢券失败' });
      }
    } catch {
      setMessage({ type: 'error', text: '网络错误' });
    } finally {
      setGrabLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
  };

  // Find active session for countdown
  const activeSessionObj = sessions.find(s => activeSession === s.id && isSessionActive(s));

  return (
    <div className="min-h-screen bg-[#F5F5F5] pb-20">
      {/* Header - 抖音风格渐变 */}
      <header className="sticky top-0 z-50 bg-gradient-to-r from-[#FE2C55] to-[#FF6B35] text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <span className="text-xl font-bold">惠</span>
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-wide">惠抢券</h1>
              <p className="text-white/70 text-[10px]">限时抢购 · 回兑赚5%</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-black/20 px-3 py-1 rounded-full text-xs font-mono tabular-nums backdrop-blur-sm">
              {currentTime || '--:--:--'}
            </div>
            {user ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => router.push('/profile')}
                  className="flex items-center gap-1.5 bg-white/15 px-3 py-1.5 rounded-full text-xs hover:bg-white/25 transition"
                >
                  <div className="w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center text-[10px] font-bold text-white">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  {user.username}
                </button>
                <button
                  onClick={handleLogout}
                  className="text-white/70 hover:text-white text-xs transition"
                >
                  退出
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Link href="/login">
                  <button className="text-xs text-white/80 hover:text-white px-3 py-1.5 transition">登录</button>
                </Link>
                <Link href="/register">
                  <button className="text-xs bg-amber-400 hover:bg-amber-500 text-white px-3 py-1.5 rounded-full font-medium transition">注册</button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Banner */}
      <div className="bg-gradient-to-b from-[#FE2C55] to-[#F5F5F5] px-4 pt-2 pb-6">
        <div className="max-w-6xl mx-auto bg-gradient-to-r from-[#FE2C55] to-[#FF6B35] rounded-2xl p-5 relative overflow-hidden">
          {/* Decorative circles */}
          <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full" />
          <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-white/5 rounded-full" />
          <div className="absolute top-2 right-20 w-8 h-8 bg-amber-400/30 rounded-full" />

          <div className="relative z-10 flex items-center justify-between">
            <div>
              <h2 className="text-white text-xl font-bold mb-1">限时抢券</h2>
              <p className="text-white/70 text-xs">抢券后可申请回兑，赚5%奖励金</p>
            </div>
            {activeSessionObj && (
              <div className="bg-black/25 rounded-xl px-4 py-2 text-center backdrop-blur-sm">
                <p className="text-white/70 text-[10px]">{getCountdown(activeSessionObj).label}</p>
                <p className="text-white text-xl font-bold tabular-nums">{getCountdown(activeSessionObj).time}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Session Tabs */}
      <div className="max-w-6xl mx-auto px-4 -mt-2">
        <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide">
          <button
            onClick={() => setActiveSession('')}
            className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              activeSession === ''
                ? 'bg-[#FE2C55] text-white shadow-md shadow-red-200'
                : 'bg-white text-gray-500 hover:bg-gray-50 shadow-sm'
            }`}
          >
            全部
          </button>
          {sessions.map((s) => {
            const status = getSessionStatus(s);
            const isActive = isSessionActive(s);
            const countdown = getCountdown(s);
            return (
              <button
                key={s.id}
                onClick={() => setActiveSession(s.id)}
                className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  activeSession === s.id
                    ? 'bg-[#FE2C55] text-white shadow-md shadow-red-200'
                    : 'bg-white text-gray-500 hover:bg-gray-50 shadow-sm'
                }`}
              >
                <span>{s.name}</span>
                <span className={`inline-block w-1.5 h-1.5 rounded-full ${isActive ? 'bg-green-400' : status === '未开始' ? 'bg-amber-400' : 'bg-gray-300'}`} />
                <span className="text-[10px] opacity-60">{s.start_time}-{s.end_time}</span>
                {isActive && countdown.time !== '00:00' && (
                  <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full tabular-nums">
                    {countdown.time}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`max-w-6xl mx-auto px-4 mb-4 p-3 rounded-xl text-sm ${
          message.type === 'success'
            ? 'bg-green-50 text-green-700 border border-green-100'
            : 'bg-red-50 text-red-600 border border-red-100'
        }`}>
          {message.text}
        </div>
      )}

      {/* Coupon Grid - 抖音电商卡片风格 */}
      <div className="max-w-6xl mx-auto px-4">
        {coupons.length === 0 ? (
          <div className="text-center py-24 text-gray-400">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🎟️</span>
            </div>
            <p className="text-base font-medium">暂无优惠券</p>
            <p className="text-xs mt-1">等待管理员添加优惠券</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {coupons.map((coupon) => {
              const session = coupon.grab_sessions;
              const isActive = session ? isSessionActive({ ...session, id: coupon.session_id, is_active: true } as Session) : false;
              const isSoldOut = coupon.remaining_quantity <= 0;
              const progressPct = coupon.total_quantity > 0
                ? ((coupon.total_quantity - coupon.remaining_quantity) / coupon.total_quantity) * 100
                : 0;
              return (
                <div
                  key={coupon.id}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 group"
                >
                  {/* Image placeholder area */}
                  <div className="relative h-32 bg-gradient-to-br from-[#FE2C55]/10 to-[#FF6B35]/10 flex items-center justify-center overflow-hidden">
                    {coupon.image_url ? (
                      <img src={coupon.image_url} alt={coupon.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center">
                        <span className="text-3xl">🎫</span>
                      </div>
                    )}
                    {/* Status tag */}
                    <div className="absolute top-2 left-2">
                      {isSoldOut ? (
                        <span className="bg-gray-500 text-white text-[10px] px-2 py-0.5 rounded-full font-medium">已抢光</span>
                      ) : !isActive ? (
                        <span className="bg-amber-500 text-white text-[10px] px-2 py-0.5 rounded-full font-medium">非抢购时间</span>
                      ) : (
                        <span className="bg-[#FE2C55] text-white text-[10px] px-2 py-0.5 rounded-full font-medium animate-pulse">抢购中</span>
                      )}
                    </div>
                    {/* Discount tag */}
                    <div className="absolute top-2 right-2">
                      <span className="bg-[#FFF0F0] text-[#FE2C55] text-[10px] px-1.5 py-0.5 rounded font-bold">
                        回兑+5%
                      </span>
                    </div>
                    {/* Sold out overlay */}
                    {isSoldOut && (
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <span className="bg-white/90 text-gray-500 text-xs px-3 py-1 rounded-full font-medium">已抢光</span>
                      </div>
                    )}
                  </div>

                  {/* Info area */}
                  <div className="p-3">
                    <h3 className="text-sm font-semibold text-[#1A1A1A] truncate">{coupon.name}</h3>
                    {coupon.description && (
                      <p className="text-[10px] text-gray-400 mt-0.5 truncate">{coupon.description}</p>
                    )}
                    <div className="flex items-end justify-between mt-2">
                      <div>
                        <span className="text-[10px] text-gray-400">¥</span>
                        <span className="text-lg font-bold text-[#FFC107] tabular-nums">
                          {parseFloat(coupon.price).toFixed(2)}
                        </span>
                      </div>
                      <span className="text-[10px] text-gray-400">
                        {session?.name || '未知场次'}
                      </span>
                    </div>
                    {/* Progress bar */}
                    <div className="mt-2">
                      <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                        <span>已抢 {Math.round(progressPct)}%</span>
                        <span>剩余 {coupon.remaining_quantity}</span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#FE2C55] to-[#FF6B35] rounded-full transition-all duration-500"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>
                    {/* Grab button */}
                    <button
                      className="w-full mt-3 py-2 rounded-xl text-xs font-bold transition-all duration-200 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        background: (!isActive || isSoldOut || !user?.isVerified)
                          ? '#ccc'
                          : 'linear-gradient(135deg, #FE2C55, #FF6B35)',
                        color: (!isActive || isSoldOut || !user?.isVerified) ? '#999' : '#fff',
                      }}
                      disabled={!isActive || isSoldOut || !user?.isVerified}
                      onClick={() => {
                        if (!user) {
                          router.push('/login');
                          return;
                        }
                        setSelectedCoupon(coupon);
                        setGrabDialogOpen(true);
                        setPaymentPassword('');
                        setMessage(null);
                      }}
                    >
                      {!user ? '登录后抢购' : !user.isVerified ? '请先完成认证' : isSoldOut ? '已抢光' : !isActive ? '未到抢购时间' : '立即抢购'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom Navigation - 抖音风格 */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-100 z-50">
        <div className="max-w-6xl mx-auto flex justify-around py-2">
          <Link href="/" className="flex flex-col items-center gap-0.5 text-[#FE2C55]">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            <span className="text-[10px] font-medium">首页</span>
          </Link>
          <Link href="/profile" className="flex flex-col items-center gap-0.5 text-gray-400 hover:text-gray-600 transition">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            <span className="text-[10px] font-medium">我的</span>
          </Link>
        </div>
      </nav>

      {/* Admin Link */}
      <div className="fixed bottom-14 right-4">
        <Link href="/admin" className="text-[10px] text-gray-300 hover:text-gray-500 transition">
          管理后台
        </Link>
      </div>

      {/* Grab Dialog */}
      <Dialog open={grabDialogOpen} onOpenChange={setGrabDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-center text-lg">确认抢购</DialogTitle>
            <DialogDescription className="text-center">
              {selectedCoupon && (
                <span>
                  抢购「{selectedCoupon.name}」，支付
                  <span className="text-[#FFC107] font-bold text-base"> ¥{parseFloat(selectedCoupon.price).toFixed(2)}</span>
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="bg-amber-50 rounded-xl p-3 text-xs text-amber-700">
              抢购成功后可申请回兑，通过后返还支付金额 + 5% 奖励
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentPassword" className="text-sm text-gray-600">支付密码</Label>
              <Input
                id="paymentPassword"
                type="password"
                placeholder="请输入余额支付密码"
                value={paymentPassword}
                onChange={(e) => setPaymentPassword(e.target.value)}
                className="rounded-xl"
              />
            </div>
            {message && message.type === 'error' && (
              <p className="text-xs text-red-500 bg-red-50 p-2 rounded-lg">{message.text}</p>
            )}
            <button
              className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all duration-200 active:scale-[0.97] disabled:opacity-50"
              style={{
                background: (grabLoading || !paymentPassword)
                  ? '#ccc'
                  : 'linear-gradient(135deg, #FE2C55, #FF6B35)',
                color: (grabLoading || !paymentPassword) ? '#999' : '#fff',
              }}
              onClick={handleGrab}
              disabled={grabLoading || !paymentPassword}
            >
              {grabLoading ? '抢购中...' : `确认支付 ¥${selectedCoupon ? parseFloat(selectedCoupon.price).toFixed(2) : '0.00'}`}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
