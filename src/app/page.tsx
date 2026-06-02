'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import Image from 'next/image';
import Link from 'next/link';

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
  original_price: number;
  discount: string | null;
  total_quantity: number;
  remaining_quantity: number;
  sold_count: number;
  image_url: string;
  session_id: string | null;
  category_id: string;
  is_active: boolean;
}

interface Banner {
  id: string;
  image_url: string;
  title: string;
}

interface Category {
  id: string;
  name: string;
  icon: string;
}

export default function HomePage() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [now, setNow] = useState<Date>(new Date());
  const [currentBanner, setCurrentBanner] = useState(0);

  // Check if any session is currently active
  const getActiveSession = useCallback((): Session | null => {
    const currentTime = now.getHours() * 60 + now.getMinutes();
    return sessions.find(s => {
      const [sh, sm] = s.start_time.split(':').map(Number);
      const [eh, em] = s.end_time.split(':').map(Number);
      return currentTime >= sh * 60 + sm && currentTime < eh * 60 + em;
    }) || null;
  }, [sessions, now]);

  const getSessionStatus = useCallback((session: Session): 'active' | 'upcoming' | 'ended' => {
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const [sh, sm] = session.start_time.split(':').map(Number);
    const [eh, em] = session.end_time.split(':').map(Number);
    const start = sh * 60 + sm;
    const end = eh * 60 + em;
    if (currentTime >= start && currentTime < end) return 'active';
    if (currentTime < start) return 'upcoming';
    return 'ended';
  }, [now]);

  const getCountdown = useCallback((session: Session) => {
    const status = getSessionStatus(session);
    if (status === 'ended') return null;
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const [sh, sm] = session.start_time.split(':').map(Number);
    const [eh, em] = session.end_time.split(':').map(Number);
    const targetMinutes = status === 'active' ? eh * 60 + em : sh * 60 + sm;
    const remaining = targetMinutes - currentTime;
    const h = Math.max(0, Math.floor(remaining / 60));
    const m = Math.max(0, remaining % 60);
    const s = 59 - now.getSeconds();
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }, [now, getSessionStatus]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetch('/api/sessions').then(r => r.json()).then(d => {
      if (d.sessions?.length) setSessions(d.sessions);
    }).catch(() => {});
    fetch('/api/banners').then(r => r.json()).then(d => setBanners(d.banners || [])).catch(() => {});
    fetch('/api/categories').then(r => r.json()).then(d => setCategories(d.categories || [])).catch(() => {});
  }, []);

  // Fetch ALL coupons (no session filter - all coupons available in all sessions)
  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedCategory) params.set('categoryId', selectedCategory);
    fetch(`/api/coupons?${params}`).then(r => r.json()).then(d => setCoupons(d.coupons || [])).catch(() => {});
  }, [selectedCategory]);

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentBanner(prev => (prev + 1) % banners.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [banners.length]);

  const activeSession = getActiveSession();
  const canGrab = !!activeSession; // Can only grab when a session is active

  const filteredCoupons = coupons.filter(c => {
    if (!searchQuery) return true;
    return c.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Next upcoming session
  const nextSession = sessions.find(s => getSessionStatus(s) === 'upcoming');

  return (
    <div className="min-h-screen bg-[#F0F2F5]">
      {/* ===== Hero Section ===== */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0A1628] via-[#132742] to-[#0D1F35]">
        {/* Animated floating orbs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute w-80 h-80 rounded-full opacity-20"
            style={{ background: 'radial-gradient(circle, #00D4FF 0%, transparent 70%)', top: '-15%', right: '5%', animation: 'floatOrb1 8s ease-in-out infinite' }} />
          <div className="absolute w-64 h-64 rounded-full opacity-15"
            style={{ background: 'radial-gradient(circle, #7B61FF 0%, transparent 70%)', bottom: '-10%', left: '3%', animation: 'floatOrb2 10s ease-in-out infinite' }} />
          <div className="absolute w-48 h-48 rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, #1890FF 0%, transparent 70%)', top: '35%', left: '45%', animation: 'floatOrb1 7s ease-in-out infinite reverse' }} />
          <div className="absolute w-32 h-32 rounded-full opacity-8"
            style={{ background: 'radial-gradient(circle, #00D4FF 0%, transparent 70%)', top: '60%', right: '25%', animation: 'floatOrb2 9s ease-in-out infinite 2s' }} />
          {/* Particle dots */}
          {[...Array(6)].map((_, i) => (
            <div key={i} className="absolute w-1 h-1 rounded-full bg-white/30"
              style={{
                top: `${15 + i * 14}%`,
                left: `${10 + i * 15}%`,
                animation: `floatOrb1 ${5 + i * 0.8}s ease-in-out infinite ${i * 0.5}s`
              }} />
          ))}
        </div>

        {/* Top Navigation */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-3 md:py-4">
            <div className="flex items-center gap-3">
              <Image src="/images/logo.png" alt="抖音电商" width={140} height={40} className="h-7 md:h-9 w-auto" />
            </div>
            <div className="hidden md:flex items-center gap-2">
              <div className="relative">
                <input type="text" placeholder="搜索优惠券..." value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-56 lg:w-72 h-9 pl-9 pr-4 rounded-full bg-white/10 text-white text-sm placeholder-white/40 border border-white/15 focus:border-[#00D4FF] focus:outline-none focus:bg-white/15 transition-all" />
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {user ? (
                <Link href="/profile" className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-white text-sm hover:bg-white/20 transition-all border border-white/10">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  <span className="hidden sm:inline">{user.username}</span>
                </Link>
              ) : (
                <div className="flex items-center gap-2">
                  <Link href="/login" className="px-4 py-1.5 rounded-full bg-[#1890FF] text-white text-sm font-medium hover:bg-[#0077E6] transition-all shadow-sm shadow-blue-500/25">登录</Link>
                  <Link href="/register" className="px-4 py-1.5 rounded-full border border-white/25 text-white text-sm hover:bg-white/10 transition-all">注册</Link>
                </div>
              )}
            </div>
          </div>

          {/* Hero Title + Countdown */}
          <div className="pb-5 pt-2 md:pt-6 md:pb-8">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div>
                <h1 className="text-xl md:text-3xl lg:text-4xl font-bold text-white mb-1.5 tracking-wide">
                  限时抢购
                </h1>
                <p className="text-white/50 text-sm md:text-base">
                  抢购官方优惠券，回收即赚5%奖励
                </p>
              </div>
              {/* Current session countdown */}
              {activeSession && (
                <div className="flex items-center gap-3 bg-white/8 backdrop-blur-sm rounded-xl px-4 py-2.5 border border-white/10">
                  <div className="flex items-center gap-1.5">
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400"></span>
                    </span>
                    <span className="text-green-400 text-xs font-medium">抢购中</span>
                  </div>
                  <span className="text-white/40 text-xs">{activeSession.name} {activeSession.start_time}-{activeSession.end_time}</span>
                  <span className="text-white/30 text-xs">距离结束</span>
                  <div className="flex items-center gap-0.5">
                    {getCountdown(activeSession)?.split(':').map((val, i) => (
                      <span key={i} className="flex items-center">
                        <span className="bg-white/15 text-white text-base md:text-lg font-bold font-mono px-1.5 py-0.5 rounded tabular-nums min-w-[28px] text-center">{val}</span>
                        {i < 2 && <span className="text-[#00D4FF] font-bold mx-px">:</span>}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {!activeSession && nextSession && (
                <div className="flex items-center gap-3 bg-white/5 backdrop-blur-sm rounded-xl px-4 py-2.5 border border-white/10">
                  <span className="text-orange-400 text-xs font-medium">{nextSession.name} 即将开始</span>
                  <span className="text-white/30 text-xs">距离开始</span>
                  <div className="flex items-center gap-0.5">
                    {getCountdown(nextSession)?.split(':').map((val, i) => (
                      <span key={i} className="flex items-center">
                        <span className="bg-white/10 text-white/80 text-base font-bold font-mono px-1.5 py-0.5 rounded tabular-nums min-w-[28px] text-center">{val}</span>
                        {i < 2 && <span className="text-white/30 font-bold mx-px">:</span>}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Banner carousel */}
        {banners.length > 0 && (
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-5">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-black/30" style={{ aspectRatio: '3.5/1' }}>
              {banners.map((banner, idx) => (
                <div key={banner.id} className="absolute inset-0 transition-opacity duration-700" style={{ opacity: idx === currentBanner ? 1 : 0 }}>
                  <Image src={banner.image_url} alt={banner.title} fill className="object-cover" priority={idx === 0} />
                </div>
              ))}
              {banners.length > 1 && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {banners.map((_, idx) => (
                    <button key={idx} onClick={() => setCurrentBanner(idx)}
                      className={`h-1 rounded-full transition-all ${idx === currentBanner ? 'bg-white w-6' : 'bg-white/30 w-3'}`} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ===== Category Navigation ===== */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-1">
        <div className="bg-white rounded-2xl shadow-sm p-3 md:p-4 mb-3">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            <button onClick={() => setSelectedCategory('')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                !selectedCategory ? 'bg-[#1890FF] text-white shadow-sm shadow-blue-500/20' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}>
              <span>全部</span>
            </button>
            {categories.map(cat => (
              <button key={cat.id} onClick={() => setSelectedCategory(selectedCategory === cat.id ? '' : cat.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                  selectedCategory === cat.id ? 'bg-[#1890FF] text-white shadow-sm shadow-blue-500/20' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}>
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ===== Session Tabs ===== */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-sm p-3 md:p-4 mb-3">
          <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide">
            {sessions.map(session => {
              const status = getSessionStatus(session);
              const countdown = getCountdown(session);
              return (
                <div key={session.id}
                  className={`flex-shrink-0 flex flex-col items-center gap-1.5 px-4 py-2.5 rounded-xl transition-all ${
                    status === 'active' ? 'bg-gradient-to-br from-[#1890FF] to-[#00D4FF] text-white shadow-md shadow-blue-500/25' :
                    status === 'upcoming' ? 'bg-orange-50 text-orange-600 border border-orange-200' :
                    'bg-gray-50 text-gray-400'
                  }`}>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold">{session.name}</span>
                    {status === 'active' && (
                      <span className="flex h-1.5 w-1.5 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white"></span>
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] opacity-70">{session.start_time}-{session.end_time}</span>
                  {countdown && (
                    <span className="text-xs font-mono font-bold tabular-nums">{countdown}</span>
                  )}
                  {status === 'ended' && (
                    <span className="text-[10px]">已结束</span>
                  )}
                </div>
              );
            })}
          </div>
          {/* Non-active-time notice */}
          {!activeSession && (
            <div className="mt-3 px-3 py-2 bg-orange-50 border border-orange-100 rounded-lg text-center">
              <span className="text-orange-600 text-xs">当前非活动时间，请在活动时间内抢购优惠券</span>
            </div>
          )}
        </div>
      </div>

      {/* ===== Mobile Search ===== */}
      <div className="md:hidden max-w-7xl mx-auto px-4 mb-3">
        <div className="relative">
          <input type="text" placeholder="搜索优惠券..." value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-xl bg-white border border-gray-200 text-sm focus:border-[#1890FF] focus:outline-none shadow-sm" />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* ===== Coupon Grid ===== */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 md:pb-8">
        {filteredCoupons.length === 0 ? (
          <div className="text-center py-20">
            <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <p className="text-gray-400">暂无优惠券</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
            {filteredCoupons.map((coupon, index) => (
              <Link key={coupon.id} href={`/coupon/${coupon.id}`}
                className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                style={{ animationDelay: `${index * 50}ms` }}>
                {/* Image */}
                <div className="relative aspect-square bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
                  <Image src={coupon.image_url} alt={coupon.name} fill
                    className="object-cover group-hover:scale-110 transition-transform duration-500" />
                  {/* Price tag */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent pt-6 pb-1.5 px-2">
                    <span className="text-white font-bold text-base md:text-lg">
                      ¥{coupon.price.toLocaleString()}
                    </span>
                  </div>
                  {coupon.remaining_quantity <= 10 && coupon.remaining_quantity > 0 && (
                    <div className="absolute top-2 left-2 bg-[#FF4D4F] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                      即将售罄
                    </div>
                  )}
                  {coupon.remaining_quantity === 0 && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="text-white font-bold text-sm bg-black/30 px-3 py-1 rounded-lg">已售罄</span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-2.5 md:p-3">
                  <h3 className="text-xs md:text-sm font-medium text-gray-800 line-clamp-2 mb-1.5 leading-tight">
                    {coupon.name}
                  </h3>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[#1890FF] font-medium">
                      回收+5%奖励
                    </span>
                    <span className="text-[10px] text-gray-400">
                      剩{coupon.remaining_quantity}件
                    </span>
                  </div>
                  {canGrab && coupon.remaining_quantity > 0 ? (
                    <div className="mt-2 w-full py-1.5 rounded-lg bg-gradient-to-r from-[#1890FF] to-[#00D4FF] text-white text-xs font-medium text-center group-hover:shadow-md group-hover:shadow-blue-500/25 transition-all">
                      立即抢购
                    </div>
                  ) : coupon.remaining_quantity > 0 ? (
                    <div className="mt-2 w-full py-1.5 rounded-lg bg-gray-100 text-gray-400 text-xs font-medium text-center">
                      非活动时间
                    </div>
                  ) : null}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* ===== Bottom Navigation (Mobile) ===== */}
      <div className="fixed bottom-0 left-0 right-0 md:hidden bg-white/90 backdrop-blur-xl border-t border-gray-100 z-50">
        <div className="flex items-center justify-around py-1.5">
          <Link href="/" className="flex flex-col items-center gap-0.5 px-4 py-1 text-[#1890FF]">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
            <span className="text-[10px] font-medium">首页</span>
          </Link>
          <Link href="/cart" className="flex flex-col items-center gap-0.5 px-4 py-1 text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" /></svg>
            <span className="text-[10px]">购物车</span>
          </Link>
          <Link href="/profile" className="flex flex-col items-center gap-0.5 px-4 py-1 text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            <span className="text-[10px]">我的</span>
          </Link>
        </div>
        <div className="h-[env(safe-area-inset-bottom)]" />
      </div>
    </div>
  );
}
