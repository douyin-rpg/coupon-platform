'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';

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
  description: string;
  price: number;
  image_url: string;
  session_id: string;
  category_id: string;
  remaining_quantity: number;
  total_quantity: number;
  sold_count: number;
  is_active: boolean;
}

interface Banner {
  id: string;
  image_url: string;
  link_url: string;
  title: string;
  sort_order: number;
}

interface Category {
  id: string;
  name: string;
  icon: string;
}

export default function HomePage() {
  const { user, loading: authLoading } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedSession, setSelectedSession] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [currentBanner, setCurrentBanner] = useState(0);
  const [countdown, setCountdown] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [grabModal, setGrabModal] = useState<{ open: boolean; coupon: Coupon | null }>({ open: false, coupon: null });
  const [paymentPassword, setPaymentPassword] = useState('');
  const [grabLoading, setGrabLoading] = useState(false);
  const [grabResult, setGrabResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    fetch('/api/sessions').then(r => r.json()).then(data => {
      if (data.sessions) {
        setSessions(data.sessions);
        if (data.sessions.length > 0) setSelectedSession(data.sessions[0].id);
      }
    });
    fetch('/api/banners').then(r => r.json()).then(data => setBanners(data.banners || []));
    fetch('/api/categories').then(r => r.json()).then(data => setCategories(data.categories || []));
  }, []);

  useEffect(() => {
    if (!selectedSession) return;
    const params = new URLSearchParams({ session_id: selectedSession });
    if (selectedCategory) params.set('category_id', selectedCategory);
    fetch(`/api/coupons?${params}`).then(r => r.json()).then(data => setCoupons(data.coupons || []));
  }, [selectedSession, selectedCategory]);

  // Banner auto-rotate
  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentBanner(prev => (prev + 1) % banners.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [banners.length]);

  // Countdown timer
  const updateCountdown = useCallback(() => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const activeSession = sessions.find(s => {
      const [sh, sm] = s.start_time.split(':').map(Number);
      const [eh, em] = s.end_time.split(':').map(Number);
      return currentMinutes >= sh * 60 + sm && currentMinutes < eh * 60 + em;
    });
    if (activeSession) {
      const [eh, em] = activeSession.end_time.split(':').map(Number);
      const endSeconds = eh * 3600 + em * 60;
      const nowSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
      const diff = endSeconds - nowSeconds;
      if (diff > 0) {
        setCountdown({
          hours: Math.floor(diff / 3600),
          minutes: Math.floor((diff % 3600) / 60),
          seconds: diff % 60,
        });
      }
    } else {
      // Find next session
      const nextSession = sessions.find(s => {
        const [sh, sm] = s.start_time.split(':').map(Number);
        return currentMinutes < sh * 60 + sm;
      });
      if (nextSession) {
        const [sh, sm] = nextSession.start_time.split(':').map(Number);
        const startSeconds = sh * 3600 + sm * 60;
        const nowSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
        const diff = startSeconds - nowSeconds;
        if (diff > 0) {
          setCountdown({
            hours: Math.floor(diff / 3600),
            minutes: Math.floor((diff % 3600) / 60),
            seconds: diff % 60,
          });
        }
      }
    }
  }, [sessions]);

  useEffect(() => {
    const timer = setInterval(updateCountdown, 1000);
    updateCountdown();
    return () => clearInterval(timer);
  }, [updateCountdown]);

  const currentMinutes = new Date().getHours() * 60 + new Date().getMinutes();
  const activeSession = sessions.find(s => {
    const [sh, sm] = s.start_time.split(':').map(Number);
    const [eh, em] = s.end_time.split(':').map(Number);
    return currentMinutes >= sh * 60 + sm && currentMinutes < eh * 60 + em;
  });

  const handleGrab = async () => {
    if (!grabModal.coupon || !paymentPassword) return;
    setGrabLoading(true);
    setGrabResult(null);
    try {
      const res = await fetch('/api/coupons/grab', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          couponId: grabModal.coupon.id,
          paymentPassword,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setGrabResult({ success: true, message: '抢购成功！' });
        setTimeout(() => {
          setGrabModal({ open: false, coupon: null });
          setPaymentPassword('');
          setGrabResult(null);
          // Refresh coupons
          const params = new URLSearchParams({ session_id: selectedSession });
          if (selectedCategory) params.set('category_id', selectedCategory);
          fetch(`/api/coupons?${params}`).then(r => r.json()).then(d => setCoupons(d.coupons || []));
        }, 1500);
      } else {
        setGrabResult({ success: false, message: data.error || '抢购失败' });
      }
    } catch {
      setGrabResult({ success: false, message: '网络错误' });
    }
    setGrabLoading(false);
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('zh-CN');
  };

  const pad2 = (n: number) => String(n).padStart(2, '0');

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      {/* Floating orbs background for hero */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-20 left-[10%] w-72 h-72 rounded-full float-orb-1"
          style={{ background: 'radial-gradient(circle, rgba(24,144,255,0.08) 0%, transparent 70%)' }} />
        <div className="absolute top-40 right-[15%] w-96 h-96 rounded-full float-orb-2"
          style={{ background: 'radial-gradient(circle, rgba(123,97,255,0.06) 0%, transparent 70%)' }} />
        <div className="absolute bottom-40 left-[30%] w-80 h-80 rounded-full float-orb-1"
          style={{ background: 'radial-gradient(circle, rgba(0,212,255,0.05) 0%, transparent 70%)' }} />
      </div>

      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 bg-gradient-to-r from-[#0A1628] via-[#132742] to-[#0D1F35] shadow-lg">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <Image src="/images/logo.png" alt="抖音电商" width={140} height={36} className="h-8 w-auto" />
            <span className="text-white/60 text-xs font-medium hidden sm:block">惠抢券</span>
          </Link>

          {/* Search */}
          <div className="flex-1 max-w-md mx-4 hidden md:block">
            <div className="relative">
              <input
                type="text"
                placeholder="搜索优惠券"
                className="w-full h-9 pl-10 pr-4 rounded-full bg-white/10 border border-white/10 text-sm text-white placeholder-white/40 focus:outline-none focus:border-[#00D4FF]/50 focus:bg-white/15 transition-all"
              />
              <svg className="absolute left-3 top-2.5 w-4 h-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* User area */}
          <div className="flex items-center gap-3">
            {authLoading ? (
              <div className="h-8 w-20 bg-white/10 rounded-full animate-pulse" />
            ) : user ? (
              <Link href="/profile" className="flex items-center gap-2 bg-white/10 hover:bg-white/15 px-4 py-1.5 rounded-full transition-all">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#00D4FF] to-[#7B61FF] flex items-center justify-center text-white text-xs font-bold">
                  {(user.username || 'U')[0].toUpperCase()}
                </div>
                <span className="text-white/90 text-sm">{user.username}</span>
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login" className="text-white/70 hover:text-white text-sm px-3 py-1.5 rounded-full hover:bg-white/10 transition-all">
                  登录
                </Link>
                <Link href="/register" className="bg-gradient-to-r from-[#1890FF] to-[#00D4FF] text-white text-sm px-5 py-1.5 rounded-full hover:shadow-lg hover:shadow-[#1890FF]/25 transition-all">
                  注册
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Banner Section */}
      <section className="relative bg-gradient-to-b from-[#0A1628] via-[#132742] to-[#0D1F35] overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-10 left-[5%] w-64 h-64 rounded-full float-orb-1"
            style={{ background: 'radial-gradient(circle, rgba(0,212,255,0.12) 0%, transparent 70%)' }} />
          <div className="absolute top-20 right-[10%] w-80 h-80 rounded-full float-orb-2"
            style={{ background: 'radial-gradient(circle, rgba(123,97,255,0.1) 0%, transparent 70%)' }} />
          <div className="absolute -bottom-10 left-[40%] w-96 h-48 rounded-full float-orb-1"
            style={{ background: 'radial-gradient(circle, rgba(24,144,255,0.08) 0%, transparent 70%)' }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 py-6 md:py-10">
          {/* Banner Carousel */}
          {banners.length > 0 && (
            <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-black/30 mb-6"
              style={{ aspectRatio: '3/1' }}>
              <div className="absolute inset-0 transition-opacity duration-700"
                style={{ opacity: 1 }}>
                <Image
                  src={banners[currentBanner]?.image_url || ''}
                  alt={banners[currentBanner]?.title || ''}
                  fill
                  className="object-cover"
                  priority={currentBanner === 0}
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              {/* Banner dots */}
              {banners.length > 1 && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
                  {banners.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentBanner(i)}
                      className={`w-2 h-2 rounded-full transition-all ${i === currentBanner ? 'w-6 bg-white' : 'bg-white/40'}`}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Countdown Section */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#00D4FF] animate-pulse" />
                <span className="text-white/70 text-sm">
                  {activeSession ? '抢购进行中' : '距离下一场'}
                </span>
              </div>
              <div className="flex items-center gap-1">
                {activeSession ? (
                  <>
                    <span className="bg-[#1890FF] text-white text-lg font-bold w-9 h-9 rounded-lg flex items-center justify-center font-mono">{pad2(countdown.hours)}</span>
                    <span className="text-[#00D4FF] text-lg font-bold">:</span>
                    <span className="bg-[#1890FF] text-white text-lg font-bold w-9 h-9 rounded-lg flex items-center justify-center font-mono">{pad2(countdown.minutes)}</span>
                    <span className="text-[#00D4FF] text-lg font-bold">:</span>
                    <span className="bg-[#1890FF] text-white text-lg font-bold w-9 h-9 rounded-lg flex items-center justify-center font-mono">{pad2(countdown.seconds)}</span>
                  </>
                ) : (
                  <span className="text-white/50 text-sm">暂无场次进行中</span>
                )}
              </div>
            </div>
            <div className="text-white/50 text-sm">
              {activeSession ? `${activeSession.name} ${activeSession.start_time}-${activeSession.end_time}` : '请等待下一场开始'}
            </div>
          </div>
        </div>
      </section>

      {/* Category Navigation */}
      <section className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-1 overflow-x-auto py-3 scrollbar-hide">
            <button
              onClick={() => setSelectedCategory('')}
              className={`shrink-0 px-5 py-2 rounded-full text-sm font-medium transition-all ${
                selectedCategory === '' 
                  ? 'bg-[#1890FF] text-white shadow-md shadow-[#1890FF]/20' 
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              全部
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`shrink-0 px-5 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedCategory === cat.id 
                    ? 'bg-[#1890FF] text-white shadow-md shadow-[#1890FF]/20' 
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                {cat.icon} {cat.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Session Tabs */}
      <section className="bg-white sticky top-16 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-0 border-b border-gray-100">
            {sessions.map(session => {
              const [sh, sm] = session.start_time.split(':').map(Number);
              const [eh, em] = session.end_time.split(':').map(Number);
              const isActive = currentMinutes >= sh * 60 + sm && currentMinutes < eh * 60 + em;
              const isPast = currentMinutes >= eh * 60 + em;
              return (
                <button
                  key={session.id}
                  onClick={() => setSelectedSession(session.id)}
                  className={`relative px-6 py-3.5 text-sm font-medium transition-all ${
                    selectedSession === session.id
                      ? 'text-[#1890FF]'
                      : isPast
                        ? 'text-gray-400'
                        : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#1890FF] animate-pulse" />}
                    <span>{session.name}</span>
                    <span className="text-xs text-gray-400 font-normal">{session.start_time}-{session.end_time}</span>
                  </div>
                  {selectedSession === session.id && (
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-[#1890FF] rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Coupon Grid */}
      <main className="max-w-7xl mx-auto px-4 py-6 relative z-10">
        {coupons.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <p>暂无优惠券</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
            {coupons.map(coupon => (
              <div key={coupon.id} className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg hover:shadow-[#1890FF]/5 transition-all duration-300 hover:-translate-y-0.5">
                <Link href={`/coupon/${coupon.id}`}>
                  {/* Image */}
                  <div className="relative aspect-square bg-gray-50 overflow-hidden">
                    <Image
                      src={coupon.image_url || '/images/coupons/coupon_1000.png'}
                      alt={coupon.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {coupon.remaining_quantity <= 10 && coupon.remaining_quantity > 0 && (
                      <div className="absolute top-2 left-2 bg-[#FFC107] text-[#0A1628] text-xs font-bold px-2 py-0.5 rounded-md">
                        仅剩{coupon.remaining_quantity}张
                      </div>
                    )}
                    {coupon.remaining_quantity === 0 && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="text-white font-bold text-lg">已抢光</span>
                      </div>
                    )}
                  </div>
                </Link>

                {/* Info */}
                <div className="p-3">
                  <h3 className="text-sm font-medium text-gray-800 line-clamp-1 mb-1">{coupon.name}</h3>
                  <p className="text-xs text-gray-400 line-clamp-1 mb-2">{coupon.description}</p>
                  <div className="flex items-end justify-between">
                    <div>
                      <div className="flex items-baseline gap-0.5">
                        <span className="text-xs text-[#1890FF]">¥</span>
                        <span className="text-xl font-bold text-[#1890FF] tabular-nums">{formatPrice(coupon.price)}</span>
                      </div>
                      <div className="text-xs text-gray-300 mt-0.5">
                        已售{coupon.sold_count || 0}张
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        if (!user) {
                          window.location.href = '/login';
                          return;
                        }
                        setGrabModal({ open: true, coupon });
                      }}
                      disabled={coupon.remaining_quantity === 0 || !activeSession}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        coupon.remaining_quantity === 0 || !activeSession
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-gradient-to-r from-[#1890FF] to-[#00D4FF] text-white shadow-sm hover:shadow-md hover:shadow-[#1890FF]/25 active:scale-95'
                      }`}
                    >
                      {coupon.remaining_quantity === 0 ? '已抢光' : !activeSession ? '未开抢' : '立即抢'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Grab Modal */}
      {grabModal.open && grabModal.coupon && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => { setGrabModal({ open: false, coupon: null }); setPaymentPassword(''); setGrabResult(null); }}>
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">确认抢购</h3>
                <button onClick={() => { setGrabModal({ open: false, coupon: null }); setPaymentPassword(''); setGrabResult(null); }}
                  className="text-gray-400 hover:text-gray-600">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              {/* Coupon Info */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl mb-4">
                <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-[#1890FF] to-[#00D4FF] flex items-center justify-center text-white font-bold text-lg shrink-0">
                  ¥{formatPrice(grabModal.coupon.price)}
                </div>
                <div>
                  <div className="font-medium text-sm text-gray-900">{grabModal.coupon.name}</div>
                  <div className="text-xs text-gray-400 mt-0.5">面值 ¥{formatPrice(grabModal.coupon.price)}</div>
                </div>
              </div>

              <div className="text-sm text-gray-600 mb-1">
                支付金额：<span className="text-[#1890FF] font-bold text-lg">¥{formatPrice(grabModal.coupon.price)}</span>
              </div>
              <div className="text-xs text-gray-400 mb-4">
                当前余额：¥{user?.balance?.toLocaleString() || '0'}
              </div>

              {/* Payment Password */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">支付密码</label>
                <input
                  type="password"
                  value={paymentPassword}
                  onChange={e => setPaymentPassword(e.target.value)}
                  placeholder="请输入6位支付密码"
                  maxLength={6}
                  className="w-full h-11 px-4 rounded-xl border border-gray-200 focus:border-[#1890FF] focus:ring-2 focus:ring-[#1890FF]/10 outline-none text-center text-lg tracking-[0.5em] transition-all"
                />
              </div>

              {grabResult && (
                <div className={`text-sm text-center py-2 rounded-lg mb-3 ${grabResult.success ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                  {grabResult.message}
                </div>
              )}

              <button
                onClick={handleGrab}
                disabled={grabLoading || paymentPassword.length !== 6}
                className={`w-full h-11 rounded-xl font-medium transition-all ${
                  grabLoading || paymentPassword.length !== 6
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-[#1890FF] to-[#00D4FF] text-white shadow-md hover:shadow-lg hover:shadow-[#1890FF]/25 active:scale-[0.98]'
                }`}
              >
                {grabLoading ? '处理中...' : `确认支付 ¥${formatPrice(grabModal.coupon.price)}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation (Mobile) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-gray-100 safe-area-pb">
        <div className="flex items-center">
          <Link href="/" className="flex-1 flex flex-col items-center py-2 text-[#1890FF]">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" /></svg>
            <span className="text-xs mt-0.5">首页</span>
          </Link>
          <Link href="/cart" className="flex-1 flex flex-col items-center py-2 text-gray-400">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" /></svg>
            <span className="text-xs mt-0.5">购物车</span>
          </Link>
          <Link href="/profile" className="flex-1 flex flex-col items-center py-2 text-gray-400">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            <span className="text-xs mt-0.5">我的</span>
          </Link>
        </div>
      </nav>

      {/* Desktop Footer */}
      <footer className="hidden md:block bg-[#0A1628] text-white/40 py-8 mt-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm">
          <p>惠抢券 - 抖音电商优惠券抢购平台</p>
        </div>
      </footer>

      {/* Mobile bottom padding */}
      <div className="md:hidden h-16" />
    </div>
  );
}
