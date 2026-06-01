'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-red-600 to-red-500 text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <span className="text-xl font-bold">惠</span>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-wide">惠抢券</h1>
              <p className="text-red-100 text-xs">限时抢购 · 回兑赚5%</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-white/10 px-3 py-1.5 rounded-lg text-sm font-mono tabular-nums">
              {currentTime || '--:--:--'}
            </div>
            {user ? (
              <div className="flex items-center gap-3">
                <Link href="/profile">
                  <span className="text-sm hover:text-red-100 transition cursor-pointer">{user.username}</span>
                </Link>
                <Button variant="outline" size="sm" onClick={handleLogout} className="border-white/30 text-white hover:bg-white/10">
                  退出
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Link href="/login">
                  <Button variant="outline" size="sm" className="border-white/30 text-white hover:bg-white/10">登录</Button>
                </Link>
                <Link href="/register">
                  <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white">注册</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Session Tabs */}
      <div className="max-w-6xl mx-auto px-4 mt-6">
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setActiveSession('')}
            className={`px-5 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              activeSession === ''
                ? 'bg-red-600 text-white shadow-md shadow-red-200'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            全部
          </button>
          {sessions.map((s) => {
            const status = getSessionStatus(s);
            const isActive = isSessionActive(s);
            return (
              <button
                key={s.id}
                onClick={() => setActiveSession(s.id)}
                className={`px-5 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all flex items-center gap-2 ${
                  activeSession === s.id
                    ? 'bg-red-600 text-white shadow-md shadow-red-200'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <span>{s.name}</span>
                <Badge
                  variant="outline"
                  className={`text-[10px] px-1.5 py-0 ${
                    isActive ? 'bg-green-500 text-white border-green-500' : status === '未开始' ? 'bg-amber-500 text-white border-amber-500' : 'bg-gray-400 text-white border-gray-400'
                  }`}
                >
                  {status}
                </Badge>
                <span className="text-xs opacity-70">{s.start_time}-{s.end_time}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`max-w-6xl mx-auto px-4 mt-4 p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message.text}
        </div>
      )}

      {/* Coupon Grid */}
      <div className="max-w-6xl mx-auto px-4 mt-6 pb-12">
        {coupons.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-5xl mb-4">🎟️</p>
            <p className="text-lg">暂无优惠券</p>
            <p className="text-sm mt-1">等待管理员添加优惠券</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {coupons.map((coupon) => {
              const session = coupon.grab_sessions;
              const isActive = session ? isSessionActive({ ...session, id: coupon.session_id, is_active: true } as Session) : false;
              const isSoldOut = coupon.remaining_quantity <= 0;
              return (
                <Card key={coupon.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-300 border-0 shadow-sm">
                  {/* Top red strip */}
                  <div className="bg-gradient-to-r from-red-600 to-red-500 p-4 text-white relative">
                    <div className="absolute top-2 right-2">
                      {isSoldOut ? (
                        <Badge className="bg-gray-600 text-white">已抢光</Badge>
                      ) : !isActive ? (
                        <Badge className="bg-amber-500 text-white">非抢购时间</Badge>
                      ) : (
                        <Badge className="bg-green-500 text-white animate-pulse">抢购中</Badge>
                      )}
                    </div>
                    <p className="text-sm opacity-80 mb-1">{session?.name || '未知场次'}</p>
                    <h3 className="text-lg font-bold">{coupon.name}</h3>
                  </div>
                  <CardContent className="p-4">
                    {coupon.description && (
                      <p className="text-sm text-gray-500 mb-3">{coupon.description}</p>
                    )}
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-xs text-gray-400">抢购价</p>
                        <p className="text-2xl font-bold text-amber-600 tabular-nums">
                          ¥{parseFloat(coupon.price).toFixed(2)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-400">
                          剩余 <span className="text-red-600 font-semibold">{coupon.remaining_quantity}</span> / {coupon.total_quantity}
                        </p>
                        <div className="w-24 h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden">
                          <div
                            className="h-full bg-red-500 rounded-full transition-all duration-500"
                            style={{ width: `${(coupon.remaining_quantity / coupon.total_quantity) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    <Button
                      className="w-full mt-4 bg-red-600 hover:bg-red-700 text-white font-semibold disabled:bg-gray-300 disabled:text-gray-500"
                      disabled={!isActive || isSoldOut || !user?.isVerified}
                      onClick={() => {
                        setSelectedCoupon(coupon);
                        setGrabDialogOpen(true);
                        setPaymentPassword('');
                        setMessage(null);
                      }}
                    >
                      {!user ? '请先登录' : !user.isVerified ? '请先完成认证' : isSoldOut ? '已抢光' : !isActive ? '未到抢购时间' : '立即抢购'}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Admin Link */}
      <div className="fixed bottom-4 right-4">
        <Link href="/admin" className="text-xs text-gray-400 hover:text-gray-600 transition">
          管理后台
        </Link>
      </div>

      {/* Grab Dialog */}
      <Dialog open={grabDialogOpen} onOpenChange={setGrabDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>确认抢购</DialogTitle>
            <DialogDescription>
              {selectedCoupon && (
                <span>
                  您正在抢购「{selectedCoupon.name}」，需支付
                  <span className="text-amber-600 font-bold">¥{parseFloat(selectedCoupon.price).toFixed(2)}</span>
                  ，请输入支付密码确认。
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="paymentPassword">支付密码</Label>
              <Input
                id="paymentPassword"
                type="password"
                placeholder="请输入余额支付密码"
                value={paymentPassword}
                onChange={(e) => setPaymentPassword(e.target.value)}
              />
            </div>
            {message && message.type === 'error' && (
              <p className="text-sm text-red-600">{message.text}</p>
            )}
            <Button
              className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold"
              onClick={handleGrab}
              disabled={grabLoading || !paymentPassword}
            >
              {grabLoading ? '抢购中...' : `确认支付 ¥${selectedCoupon ? parseFloat(selectedCoupon.price).toFixed(2) : '0.00'}`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
