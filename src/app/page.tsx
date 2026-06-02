'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
  discount: string;
  total_quantity: number;
  remaining_quantity: number;
  sold_count: number;
  image_url: string;
  session_id: string;
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
  const [selectedSession, setSelectedSession] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [now, setNow] = useState<Date>(new Date());
  const [currentBanner, setCurrentBanner] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetch('/api/sessions').then(r => r.json()).then(d => {
      if (d.sessions?.length) {
        setSessions(d.sessions);
        if (!selectedSession) setSelectedSession(d.sessions[0].id);
      }
    }).catch(() => {});
    fetch('/api/banners').then(r => r.json()).then(d => setBanners(d.banners || [])).catch(() => {});
    fetch('/api/categories').then(r => r.json()).then(d => setCategories(d.categories || [])).catch(() => {});
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedSession) params.set('sessionId', selectedSession);
    if (selectedCategory) params.set('categoryId', selectedCategory);
    fetch(`/api/coupons?${params}`).then(r => r.json()).then(d => setCoupons(d.coupons || [])).catch(() => {});
  }, [selectedSession, selectedCategory]);

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentBanner(prev => (prev + 1) % banners.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [banners.length]);

  const getSessionStatus = useCallback((session: Session) => {
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
    if (status === 'active') {
      const [eh, em] = session.end_time.split(':').map(Number);
      const endMinutes = eh * 60 + em;
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const remaining = endMinutes - currentMinutes;
      const h = Math.floor(remaining / 60);
      const m = remaining % 60;
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(59 - now.getSeconds()).padStart(2, '0')}`;
    }
    if (status === 'upcoming') {
      const [sh, sm] = session.start_time.split(':').map(Number);
      const startMinutes = sh * 60 + sm;
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const remaining = startMinutes - currentMinutes;
      const h = Math.floor(remaining / 60);
      const m = remaining % 60;
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(59 - now.getSeconds()).padStart(2, '0')}`;
    }
    return '已结束';
  }, [now, getSessionStatus]);

  const filteredCoupons = coupons.filter(c => {
    if (!searchQuery) return true;
    return c.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const currentSession = sessions.find(s => s.id === selectedSession);
  const sessionStatus = currentSession ? getSessionStatus(currentSession) : 'ended';

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      {/* Hero Section with gradient background and floating orbs */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0A1628] via-[#132742] to-[#0D1F35]">
        {/* Floating orbs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div
            className="absolute w-72 h-72 rounded-full opacity-20"
            style={{
              background: 'radial-gradient(circle, #00D4FF 0%, transparent 70%)',
              top: '-20%',
              right: '10%',
              animation: 'floatOrb1 8s ease-in-out infinite',
            }}
          />
          <div
            className="absolute w-56 h-56 rounded-full opacity-15"
            style={{
              background: 'radial-gradient(circle, #7B61FF 0%, transparent 70%)',
              bottom: '-10%',
              left: '5%',
              animation: 'floatOrb2 10s ease-in-out infinite',
            }}
          />
          <div
            className="absolute w-40 h-40 rounded-full opacity-10"
            style={{
              background: 'radial-gradient(circle, #1890FF 0%, transparent 70%)',
              top: '40%',
              left: '50%',
              animation: 'floatOrb1 6s ease-in-out infinite reverse',
            }}
          />
        </div>

        {/* Top Navigation */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <Image src="/images/logo.png" alt="抖音电商" width={140} height={40} className="h-8 md:h-10 w-auto" />
            </div>
            <div className="hidden md:flex items-center gap-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="搜索优惠券..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64 h-9 pl-9 pr-4 rounded-full bg-white/10 text-white text-sm placeholder-white/50 border border-white/20 focus:border-[#00D4FF] focus:outline-none focus:bg-white/15 transition-all"
                />
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {user ? (
                <Link href="/profile" className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-white text-sm hover:bg-white/20 transition-all">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  {user.username}
                </Link>
              ) : (
                <div className="flex items-center gap-2">
                  <Link href="/login" className="px-4 py-1.5 rounded-full bg-[#1890FF] text-white text-sm font-medium hover:bg-[#0077E6] transition-all">
                    登录
                  </Link>
                  <Link href="/register" className="px-4 py-1.5 rounded-full border border-white/30 text-white text-sm hover:bg-white/10 transition-all">
                    注册
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Hero content */}
          <div className="pb-6 pt-4 md:pt-8 md:pb-10">
            <h1 className="text-2xl md:text-4xl font-bold text-white mb-2 tracking-wide">
              限时抢购
            </h1>
            <p className="text-white/60 text-sm md:text-base">
              抢购官方优惠券，回收即赚5%奖励
            </p>
          </div>
        </div>

        {/* Banner carousel */}
        {banners.length > 0 && (
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
            <div className="relative rounded-xl overflow-hidden shadow-2xl" style={{ aspectRatio: banners.length > 0 ? '3.5/1' : undefined }}>
              {banners.map((banner, idx) => (
                <div
                  key={banner.id}
                  className="absolute inset-0 transition-opacity duration-700"
                  style={{ opacity: idx === currentBanner ? 1 : 0 }}
                >
                  <Image
                    src={banner.image_url}
                    alt={banner.title}
                    fill
                    className="object-cover"
                    priority={idx === 0}
                  />
                </div>
              ))}
              {banners.length > 1 && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {banners.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentBanner(idx)}
                      className={`w-2 h-2 rounded-full transition-all ${idx === currentBanner ? 'bg-white w-5' : 'bg-white/40'}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Category navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-1">
        <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
          <div className="flex items-center gap-2 md:gap-4 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setSelectedCategory('')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-all ${
                !selectedCategory ? 'bg-[#1890FF] text-white shadow-sm' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span>全部</span>
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(selectedCategory === cat.id ? '' : cat.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-all ${
                  selectedCategory === cat.id ? 'bg-[#1890FF] text-white shadow-sm' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Session tabs with countdown */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Session tabs */}
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
              {sessions.map(session => {
                const status = getSessionStatus(session);
                return (
                  <button
                    key={session.id}
                    onClick={() => setSelectedSession(session.id)}
                    className={`relative flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                      selectedSession === session.id
                        ? status === 'active'
                          ? 'bg-[#1890FF] text-white shadow-md'
                          : status === 'upcoming'
                          ? 'bg-[#1890FF]/80 text-white'
                          : 'bg-gray-200 text-gray-500'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <span>{session.name}</span>
                    <span className="text-xs opacity-75">{session.start_time}-{session.end_time}</span>
                    {status === 'active' && (
                      <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400"></span>
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Countdown */}
            {currentSession && (
              <div className="flex items-center gap-3">
                {sessionStatus === 'active' ? (
                  <>
                    <span className="text-sm text-gray-500">距离结束</span>
                    <div className="flex items-center gap-1">
                      {getCountdown(currentSession).split(':').map((val, i) => (
                        <span key={i} className="flex items-center">
                          <span className="bg-[#0A1628] text-white text-lg md:text-xl font-bold font-mono px-2 py-1 rounded-md tabular-nums min-w-[36px] text-center">
                            {val}
                          </span>
                          {i < 2 && <span className="text-[#1890FF] font-bold mx-0.5">:</span>}
                        </span>
                      ))}
                    </div>
                  </>
                ) : sessionStatus === 'upcoming' ? (
                  <>
                    <span className="text-sm text-gray-500">距离开始</span>
                    <div className="flex items-center gap-1">
                      {getCountdown(currentSession).split(':').map((val, i) => (
                        <span key={i} className="flex items-center">
                          <span className="bg-[#132742] text-white text-lg md:text-xl font-bold font-mono px-2 py-1 rounded-md tabular-nums min-w-[36px] text-center">
                            {val}
                          </span>
                          {i < 2 && <span className="text-[#1890FF] font-bold mx-0.5">:</span>}
                        </span>
                      ))}
                    </div>
                  </>
                ) : (
                  <span className="text-sm text-gray-400">本场已结束</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile search */}
      <div className="md:hidden max-w-7xl mx-auto px-4 mb-3">
        <div className="relative">
          <input
            type="text"
            placeholder="搜索优惠券..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-xl bg-white border border-gray-200 text-sm focus:border-[#1890FF] focus:outline-none shadow-sm"
          />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Coupon grid */}
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
              <Link
                key={coupon.id}
                href={`/coupon/${coupon.id}`}
                className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
                style={{ animationDelay: `${index * 60}ms` }}
              >
                {/* Image */}
                <div className="relative aspect-square bg-gray-50 overflow-hidden">
                  <Image
                    src={coupon.image_url}
                    alt={coupon.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {coupon.remaining_quantity <= 10 && coupon.remaining_quantity > 0 && (
                    <div className="absolute top-2 left-2 bg-[#FF4D4F] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      即将售罄
                    </div>
                  )}
                  {coupon.remaining_quantity === 0 && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="text-white font-bold text-sm">已售罄</span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-3">
                  <h3 className="text-sm font-medium text-gray-800 line-clamp-2 mb-2 leading-tight">
                    {coupon.name}
                  </h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-[#FF4D4F] text-lg font-bold">
                      ¥{coupon.price.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-[10px] text-gray-400">
                      回收+5%奖励
                    </span>
                    <span className="text-[10px] text-gray-400">
                      库存 {coupon.remaining_quantity}
                    </span>
                  </div>
                  {sessionStatus === 'active' && coupon.remaining_quantity > 0 && (
                    <div className="mt-2 w-full py-1.5 rounded-md bg-gradient-to-r from-[#1890FF] to-[#00D4FF] text-white text-xs font-medium text-center group-hover:shadow-md transition-shadow">
                      立即抢购
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Bottom navigation (mobile) */}
      <div className="fixed bottom-0 left-0 right-0 md:hidden bg-white/80 backdrop-blur-xl border-t border-gray-200 z-50">
        <div className="flex items-center justify-around py-2">
          <Link href="/" className="flex flex-col items-center gap-0.5 text-[#1890FF]">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
            </svg>
            <span className="text-[10px] font-medium">首页</span>
          </Link>
          <Link href="/cart" className="flex flex-col items-center gap-0.5 text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
            </svg>
            <span className="text-[10px]">购物车</span>
          </Link>
          <Link href="/profile" className="flex flex-col items-center gap-0.5 text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-[10px]">我的</span>
          </Link>
        </div>
        <div className="h-[env(safe-area-inset-bottom)]" />
      </div>
    </div>
  );
}
