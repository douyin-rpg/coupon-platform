'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/auth-context';

interface Banner { id: string; image_url: string; title: string; link_url: string; }
interface Category { id: string; name: string; icon: string; }
interface Session { id: string; name: string; start_time: string; end_time: string; is_active: boolean; }
interface Coupon { id: string; name: string; price: number; image_url: string; remaining_quantity: number; total_quantity: number; session_id: string; category_id: string; description: string; }
interface Announcement { id: string; title: string; content: string; is_active: boolean; created_at: string; }

export default function HomePage() {
  const { user } = useAuth();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [currentBanner, setCurrentBanner] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [showAnnouncement, setShowAnnouncement] = useState(true);

  useEffect(() => {
    fetch('/api/banners').then(r => r.json()).then(d => setBanners(d.banners || [])).catch(() => {});
    fetch('/api/categories').then(r => r.json()).then(d => setCategories(d.categories || [])).catch(() => {});
    fetch('/api/sessions').then(r => r.json()).then(d => setSessions(d.sessions || [])).catch(() => {});
    fetch('/api/announcements').then(r => r.json()).then(d => setAnnouncements((d.announcements || []).filter((a: Announcement) => a.is_active))).catch(() => {});
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedCategory) params.set('categoryId', selectedCategory);
    fetch(`/api/coupons?${params}`).then(r => r.json()).then(d => setCoupons(d.coupons || [])).catch(() => {});
  }, [selectedCategory]);

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => setCurrentBanner(prev => (prev + 1) % banners.length), 4000);
    return () => clearInterval(timer);
  }, [banners.length]);

  const getSessionStatus = (session: Session): 'active' | 'upcoming' | 'ended' => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const [sh, sm] = session.start_time.split(':').map(Number);
    const [eh, em] = session.end_time.split(':').map(Number);
    const startMin = sh * 60 + sm;
    const endMin = eh * 60 + em;
    if (currentMinutes >= startMin && currentMinutes < endMin) return 'active';
    if (currentMinutes < startMin) return 'upcoming';
    return 'ended';
  };

  const getCountdown = (session: Session): string | null => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const currentSeconds = now.getSeconds();
    const [sh, sm] = session.start_time.split(':').map(Number);
    const [eh, em] = session.end_time.split(':').map(Number);
    const startMin = sh * 60 + sm;
    const endMin = eh * 60 + em;
    let targetSeconds: number;
    if (currentMinutes >= startMin && currentMinutes < endMin) {
      targetSeconds = (endMin - currentMinutes) * 60 - currentSeconds;
    } else if (currentMinutes < startMin) {
      targetSeconds = (startMin - currentMinutes) * 60 - currentSeconds;
    } else {
      return null;
    }
    const h = Math.floor(targetSeconds / 3600);
    const m = Math.floor((targetSeconds % 3600) / 60);
    const s = targetSeconds % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const activeSession = sessions.find(s => getSessionStatus(s) === 'active');
  const nextSession = sessions.find(s => getSessionStatus(s) === 'upcoming');
  const canGrab = !!activeSession;

  const filteredCoupons = coupons.filter(c => !searchQuery || c.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="min-h-screen bg-[#F0F2F5]">
      {/* ===== Hero Section ===== */}
      <div className="relative overflow-hidden bg-gradient-to-b from-[#0B1929] via-[#0F2640] to-[#0B1929]">
        {/* Animated floating orbs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute w-96 h-96 rounded-full opacity-[0.12]"
            style={{ background: 'radial-gradient(circle, #00D4FF 0%, transparent 70%)', top: '-20%', right: '5%', animation: 'floatOrb1 8s ease-in-out infinite' }} />
          <div className="absolute w-72 h-72 rounded-full opacity-[0.08]"
            style={{ background: 'radial-gradient(circle, #7B61FF 0%, transparent 70%)', bottom: '-15%', left: '3%', animation: 'floatOrb2 10s ease-in-out infinite' }} />
          <div className="absolute w-56 h-56 rounded-full opacity-[0.06]"
            style={{ background: 'radial-gradient(circle, #1890FF 0%, transparent 70%)', top: '30%', left: '40%', animation: 'floatOrb1 7s ease-in-out infinite reverse' }} />
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
                  className="w-56 lg:w-72 h-9 pl-9 pr-4 rounded-full bg-white/8 text-white text-sm placeholder-white/30 border border-white/10 focus:border-[#00D4FF]/50 focus:outline-none focus:bg-white/10 transition-all" />
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {user ? (
                <Link href="/profile" className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/8 text-white text-sm hover:bg-white/15 transition-all border border-white/10">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  <span className="hidden sm:inline">{user.username}</span>
                </Link>
              ) : (
                <div className="flex items-center gap-2">
                  <Link href="/login" className="px-5 py-1.5 rounded-full bg-[#1890FF] text-white text-sm font-medium hover:bg-[#0077E6] transition-all">登录</Link>
                  <Link href="/register" className="px-4 py-1.5 rounded-full border border-white/20 text-white/80 text-sm hover:bg-white/8 transition-all">注册</Link>
                </div>
              )}
            </div>
          </div>

          {/* Hero Title - Official Douyin slogan */}
          <div className="pb-4 pt-2 md:pt-4 md:pb-6">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div>
                <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-white mb-1 tracking-wide">
                  激发兴趣，引领增长
                </h1>
                <p className="text-white/40 text-xs md:text-sm">
                  抖音电商优惠券抢购平台
                </p>
              </div>
              {/* Countdown */}
              {activeSession && (
                <div className="flex items-center gap-2.5 bg-white/6 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/8">
                  <div className="flex items-center gap-1.5">
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400"></span>
                    </span>
                    <span className="text-green-400 text-xs font-medium">抢购中</span>
                  </div>
                  <span className="text-white/30 text-xs">{activeSession.name}</span>
                  <div className="flex items-center gap-0.5">
                    {getCountdown(activeSession)?.split(':').map((val, i) => (
                      <span key={i} className="flex items-center">
                        <span className="bg-white/10 text-white text-sm font-bold font-mono px-1.5 py-0.5 rounded tabular-nums min-w-[26px] text-center">{val}</span>
                        {i < 2 && <span className="text-[#00D4FF]/60 font-bold mx-px text-xs">:</span>}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {!activeSession && nextSession && (
                <div className="flex items-center gap-2.5 bg-white/4 rounded-xl px-4 py-2 border border-white/6">
                  <span className="text-amber-400 text-xs font-medium">{nextSession.name} 即将开始</span>
                  <div className="flex items-center gap-0.5">
                    {getCountdown(nextSession)?.split(':').map((val, i) => (
                      <span key={i} className="flex items-center">
                        <span className="bg-white/8 text-white/70 text-sm font-bold font-mono px-1.5 py-0.5 rounded tabular-nums min-w-[26px] text-center">{val}</span>
                        {i < 2 && <span className="text-white/20 font-bold mx-px text-xs">:</span>}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Banner */}
        {banners.length > 0 && (
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-4">
            <div className="relative rounded-2xl overflow-hidden shadow-lg shadow-black/20" style={{ aspectRatio: '3.5/1' }}>
              {banners.map((banner, idx) => (
                <div key={banner.id} className="absolute inset-0 transition-opacity duration-700" style={{ opacity: idx === currentBanner ? 1 : 0 }}>
                  <Image src={banner.image_url} alt={banner.title} fill className="object-cover" priority={idx === 0} />
                </div>
              ))}
              {banners.length > 1 && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {banners.map((_, idx) => (
                    <button key={idx} onClick={() => setCurrentBanner(idx)}
                      className={`h-1 rounded-full transition-all ${idx === currentBanner ? 'bg-white w-5' : 'bg-white/30 w-3'}`} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ===== Announcement Bar ===== */}
      {announcements.length > 0 && showAnnouncement && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-3">
          <div className="bg-white rounded-xl shadow-sm px-4 py-2.5 flex items-center gap-3">
            <div className="flex-shrink-0 flex items-center gap-1.5">
              <svg className="w-4 h-4 text-[#1890FF]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
              </svg>
              <span className="text-[#1890FF] text-xs font-bold">公告</span>
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="flex animate-marquee whitespace-nowrap">
                {announcements.map((a, i) => (
                  <span key={a.id} className="text-gray-600 text-sm mx-8">{a.title}：{a.content}</span>
                ))}
              </div>
            </div>
            <button onClick={() => setShowAnnouncement(false)} className="text-gray-400 hover:text-gray-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>
      )}

      {/* ===== Category + Session Combined ===== */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-3">
        <div className="bg-white rounded-2xl shadow-sm p-3 md:p-4 space-y-3">
          {/* Category row */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            <button onClick={() => setSelectedCategory('')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                !selectedCategory ? 'bg-[#1890FF] text-white shadow-sm shadow-blue-500/20' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}>
              全部
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
          {/* Session tabs */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            {sessions.map(session => {
              const status = getSessionStatus(session);
              const countdown = getCountdown(session);
              return (
                <div key={session.id}
                  className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                    status === 'active' ? 'bg-gradient-to-r from-[#1890FF] to-[#00D4FF] text-white shadow-md shadow-blue-500/20' :
                    status === 'upcoming' ? 'bg-amber-50 text-amber-600 border border-amber-200' :
                    'bg-gray-50 text-gray-400'
                  }`}>
                  <span className="text-sm font-bold">{session.name}</span>
                  <span className="text-[10px] opacity-70">{session.start_time}-{session.end_time}</span>
                  {status === 'active' && (
                    <span className="flex h-1.5 w-1.5 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white"></span>
                    </span>
                  )}
                  {countdown && <span className="text-xs font-mono font-bold tabular-nums">{countdown}</span>}
                  {status === 'ended' && <span className="text-[10px]">已结束</span>}
                </div>
              );
            })}
          </div>
          {!activeSession && (
            <div className="px-3 py-2 bg-amber-50 border border-amber-100 rounded-lg text-center">
              <span className="text-amber-600 text-xs">当前非活动时间，请在活动时间内抢购优惠券</span>
            </div>
          )}
        </div>
      </div>

      {/* ===== Mobile Search ===== */}
      <div className="md:hidden max-w-7xl mx-auto px-4 mt-3">
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 pb-24 md:pb-8">
        {filteredCoupons.length === 0 ? (
          <div className="text-center py-20">
            <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <p className="text-gray-400">暂无优惠券</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
            {filteredCoupons.map((coupon) => (
              <Link key={coupon.id} href={`/coupon/${coupon.id}`}
                className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
                <div className="relative aspect-square bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
                  <Image src={coupon.image_url} alt={coupon.name} fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent pt-8 pb-1.5 px-2.5">
                    <span className="text-white font-bold text-sm md:text-base">¥{coupon.price.toLocaleString()}</span>
                  </div>
                  {coupon.remaining_quantity <= 10 && coupon.remaining_quantity > 0 && (
                    <div className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">即将售罄</div>
                  )}
                  {coupon.remaining_quantity === 0 && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <span className="text-white font-bold text-sm bg-black/30 px-3 py-1 rounded-lg">已售罄</span>
                    </div>
                  )}
                </div>
                <div className="p-2.5 md:p-3">
                  <h3 className="text-xs md:text-sm font-medium text-gray-800 line-clamp-2 mb-1.5 leading-tight">{coupon.name}</h3>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-gray-400">剩{coupon.remaining_quantity}件</span>
                  </div>
                  {canGrab && coupon.remaining_quantity > 0 ? (
                    <div className="mt-2 w-full py-1.5 rounded-lg bg-gradient-to-r from-[#1890FF] to-[#00D4FF] text-white text-xs font-medium text-center group-hover:shadow-md group-hover:shadow-blue-400/20 transition-all">
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
      <div className="fixed bottom-0 left-0 right-0 md:hidden bg-white/95 backdrop-blur-xl border-t border-gray-100 z-50">
        <div className="flex items-center justify-around py-1.5">
          <Link href="/" className="flex flex-col items-center gap-0.5 px-4 py-1 text-[#1890FF]">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
            <span className="text-[10px] font-medium">首页</span>
          </Link>
          <Link href="/cart" className="flex flex-col items-center gap-0.5 px-4 py-1 text-gray-400">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" /></svg>
            <span className="text-[10px]">购物车</span>
          </Link>
          <Link href="/profile" className="flex flex-col items-center gap-0.5 px-4 py-1 text-gray-400">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            <span className="text-[10px]">我的</span>
          </Link>
        </div>
        <div className="h-[env(safe-area-inset-bottom)]" />
      </div>
    </div>
  );
}
