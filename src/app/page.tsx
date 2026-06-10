'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/auth-context';

import BottomNav from '@/components/bottom-nav';
import Footer from '@/components/footer';

interface Banner { id: string; image_url: string; title: string; link_url: string; }
interface Category { id: string; name: string; icon: string; }
interface Session { id: string; name: string; start_time: string; end_time: string; is_active: boolean; }
interface Coupon { id: string; name: string; price: number; image_url: string; remaining_quantity: number; total_quantity: number; session_id: string; category_id: string; description: string; }
interface Article { id: string; title: string; created_at: string; }

import { HomeIcon, ShoppingCartIcon, HeadphoneIcon, UserIcon, SearchIcon, ChevronRightIcon, AnnounceIcon, CouponIcon, StreamIcon, ShoppingBagIcon, GoldIcon } from '@/components/icons';

const categoryIconMap: Record<string, React.FC<{ className?: string }>> = {
  '官方优惠券': CouponIcon,
  '主播优惠券': StreamIcon,
  '商品优惠券': ShoppingBagIcon,
  '黄金实物': GoldIcon,
};

export default function HomePage() {
  const { user } = useAuth();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [currentBanner, setCurrentBanner] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [customerServiceUrl, setCustomerServiceUrl] = useState('/');
  const [articles, setArticles] = useState<Article[]>([]);
  const [currentAnnounceIdx, setCurrentAnnounceIdx] = useState(0);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    fetch('/api/banners').then(r => r.json()).then(d => setBanners(d.banners || [])).catch(() => {});
    fetch('/api/categories').then(r => r.json()).then(d => setCategories(d.categories || [])).catch(() => {});
    fetch('/api/sessions').then(r => r.json()).then(d => setSessions(d.sessions || [])).catch(() => {});
    fetch('/api/articles?limit=5').then(r => r.json()).then(d => setArticles(d.articles || [])).catch(() => {});
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

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (articles.length <= 1) return;
    const timer = setInterval(() => setCurrentAnnounceIdx(prev => (prev + 1) % articles.length), 5000);
    return () => clearInterval(timer);
  }, [articles.length]);

  const getSessionStatus = useCallback((session: Session): 'active' | 'upcoming' | 'ended' => {
    const d = new Date(now);
    const curMin = d.getHours() * 60 + d.getMinutes();
    const [sh, sm] = session.start_time.split(':').map(Number);
    const [eh, em] = session.end_time.split(':').map(Number);
    const s = sh * 60 + sm;
    const e = eh * 60 + em;
    if (curMin >= s && curMin < e) return 'active';
    if (curMin < s) return 'upcoming';
    return 'ended';
  }, [now]);

  const getCountdown = useCallback((session: Session): string | null => {
    const d = new Date(now);
    const curMin = d.getHours() * 60 + d.getMinutes();
    const curSec = d.getSeconds();
    const [sh, sm] = session.start_time.split(':').map(Number);
    const [eh, em] = session.end_time.split(':').map(Number);
    const s = sh * 60 + sm;
    const e = eh * 60 + em;
    let target: number;
    if (curMin >= s && curMin < e) {
      target = (e - curMin) * 60 - curSec;
    } else if (curMin < s) {
      target = (s - curMin) * 60 - curSec;
    } else {
      return null;
    }
    const h = Math.floor(target / 3600);
    const m = Math.floor((target % 3600) / 60);
    const sec = target % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  }, [now]);

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

        {/* Desktop: Full-width nav bar */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-3 md:py-4">
            <div className="flex items-center gap-3">
              <Image src="/images/logo.png" alt="抖音电商" width={140} height={40} className="h-7 md:h-9 w-auto" />
            </div>
            {/* Desktop search */}
            <div className="hidden md:flex items-center gap-2">
              <div className="relative">
                <input type="text" placeholder="搜索优惠券..." value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-56 lg:w-72 h-9 pl-9 pr-4 rounded-full bg-white/8 text-white text-sm placeholder-white/30 border border-white/10 focus:border-[#00D4FF]/50 focus:outline-none focus:bg-white/10 transition-all" />
<SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/announcements" className="flex items-center gap-1 text-white/50 hover:text-white/80 transition-colors text-xs">
                <AnnounceIcon className="w-4 h-4" />
                <span className="hidden sm:inline">公告</span>
              </Link>
              {/* Desktop nav links */}
              <div className="hidden lg:flex items-center gap-4 text-white/60 text-sm">
                <Link href="/" className="hover:text-white transition-colors">首页</Link>
                <Link href="/cart" className="hover:text-white transition-colors">购物车</Link>
                <Link href="/profile/order" className="hover:text-white transition-colors">订单</Link>
                <a href={customerServiceUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-white transition-colors">
                  <HeadphoneIcon className="w-4 h-4" />
                  在线客服
                </a>
              </div>
              {user ? (
                <Link href="/profile" className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/8 text-white text-sm hover:bg-white/15 transition-all border border-white/10">
<UserIcon className="w-4 h-4" />
                  <span className="hidden sm:inline">{user.username}</span>
                </Link>
              ) : (
                <div className="flex items-center gap-2">
                  <Link href="/login" className="px-5 py-1.5 rounded-full bg-gradient-to-r from-[#1890FF] to-[#00D4FF] text-white text-sm font-medium shadow-sm shadow-blue-400/30 hover:shadow-md transition-all">登录</Link>
                  <Link href="/register" className="px-4 py-1.5 rounded-full border border-white/20 text-white/80 text-sm hover:bg-white/8 transition-all">注册</Link>
                </div>
              )}
            </div>
          </div>

          {/* Hero Title */}
          <div className="pb-4 pt-2 md:pt-6 md:pb-8">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div>
                <h1 className="text-xl md:text-3xl lg:text-4xl font-bold text-white mb-2 tracking-wide">
                  激发兴趣，引领增长
                </h1>
                <p className="text-white/40 text-xs md:text-sm">
                  抖音电商优惠券抢购平台
                </p>
              </div>
              {/* Countdown */}
              {activeSession && (
                <div className="flex items-center gap-2.5 bg-white/6 backdrop-blur-sm rounded-xl px-4 py-2.5 border border-white/8">
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
                        <span className="bg-white/10 text-white text-sm md:text-base font-bold font-mono px-1.5 py-0.5 rounded tabular-nums min-w-[28px] text-center">{val}</span>
                        {i < 2 && <span className="text-[#00D4FF]/60 font-bold mx-px text-xs">:</span>}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {!activeSession && nextSession && (
                <div className="flex items-center gap-2.5 bg-white/4 rounded-xl px-4 py-2.5 border border-white/6">
                  <span className="text-amber-400 text-xs font-medium">{nextSession.name} 即将开始</span>
                  <div className="flex items-center gap-0.5">
                    {getCountdown(nextSession)?.split(':').map((val, i) => (
                      <span key={i} className="flex items-center">
                        <span className="bg-white/8 text-white/70 text-sm md:text-base font-bold font-mono px-1.5 py-0.5 rounded tabular-nums min-w-[28px] text-center">{val}</span>
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
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-4 md:pb-6">
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

      {/* ===== Main Content Area ===== */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ===== Announcement Bar ===== */}
        {articles.length > 0 && (
          <div className="mt-3">
            <Link href="/announcements" className="block bg-white rounded-xl shadow-sm px-4 py-2.5 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 flex items-center gap-1.5">
                  <AnnounceIcon className="w-4 h-4 text-[#1890FF]" />
                  <span className="text-[#1890FF] text-xs font-bold">公告</span>
                </div>
                <div className="flex-1 overflow-hidden relative h-5">
                  <div className="absolute inset-0 flex items-center transition-all duration-500" style={{ transform: `translateY(-${currentAnnounceIdx * 100}%)` }}>
                    {articles.map((a) => (
                      <div key={a.id} className="w-full flex-shrink-0 h-5 flex items-center">
                        <span className="text-gray-600 text-sm truncate">{a.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
<ChevronRightIcon className="w-4 h-4 text-gray-300 flex-shrink-0" />
              </div>
            </Link>
          </div>
        )}

        {/* ===== Desktop: Two Column Layout (sidebar + grid) ===== */}
        <div className="mt-3 flex gap-4 pb-24 md:pb-8">
          {/* Left sidebar - desktop only */}
          <div className="hidden lg:block w-[220px] flex-shrink-0 space-y-3">
            {/* Category filter card */}
            <div className="bg-white rounded-2xl shadow-sm p-4 space-y-2">
              <h3 className="text-sm font-bold text-gray-700 mb-3">分类筛选</h3>
              <button onClick={() => setSelectedCategory('')}
                className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  !selectedCategory ? 'bg-gradient-to-r from-[#1890FF] to-[#00D4FF] text-white shadow-sm shadow-blue-500/20' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}>
                <CouponIcon className="w-4 h-4" />
                全部券
              </button>
              {categories.map(cat => {
                const IconComponent = categoryIconMap[cat.name];
                return (
                  <button key={cat.id} onClick={() => setSelectedCategory(selectedCategory === cat.id ? '' : cat.id)}
                    className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      selectedCategory === cat.id ? 'bg-gradient-to-r from-[#1890FF] to-[#00D4FF] text-white shadow-sm shadow-blue-500/20' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}>
                    {IconComponent ? <IconComponent className="w-4 h-4" /> : <span>{cat.icon}</span>}
                    <span>{cat.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Session schedule card */}
            <div className="bg-white rounded-2xl shadow-sm p-4 space-y-2">
              <h3 className="text-sm font-bold text-gray-700 mb-3">抢购场次</h3>
              {sessions.map(session => {
                const status = getSessionStatus(session);
                const countdown = getCountdown(session);
                return (
                  <div key={session.id}
                    className={`p-3 rounded-xl transition-all ${
                      status === 'active' ? 'bg-gradient-to-r from-[#1890FF] to-[#00D4FF] text-white shadow-md shadow-blue-500/20' :
                      status === 'upcoming' ? 'bg-amber-50 text-amber-600 border border-amber-200' :
                      'bg-gray-50 text-gray-400'
                    }`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-bold">{session.name}</span>
                      {status === 'active' && (
                        <span className="flex h-1.5 w-1.5 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white"></span>
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] opacity-70">{session.start_time}-{session.end_time}</span>
                    {countdown && <div className="text-xs font-mono font-bold tabular-nums mt-1">{countdown}</div>}
                    {status === 'ended' && <div className="text-[10px] mt-1">已结束</div>}
                  </div>
                );
              })}
              {!activeSession && (
                <div className="px-3 py-2 bg-amber-50 border border-amber-100 rounded-lg text-center">
                  <span className="text-amber-600 text-xs">非活动时间</span>
                </div>
              )}
            </div>
          </div>

          {/* Right content area */}
          <div className="flex-1 min-w-0 space-y-3">
            {/* Mobile: Category + Session row */}
            <div className="lg:hidden bg-white rounded-2xl shadow-sm p-3 md:p-4 space-y-3">
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
                <button onClick={() => setSelectedCategory('')}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                    !selectedCategory ? 'bg-gradient-to-r from-[#1890FF] to-[#00D4FF] text-white shadow-sm shadow-blue-500/20' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}>
                  <CouponIcon className="w-4 h-4" />
                  全部
                </button>
                {categories.map(cat => {
                  const IconComponent = categoryIconMap[cat.name];
                  return (
                    <button key={cat.id} onClick={() => setSelectedCategory(selectedCategory === cat.id ? '' : cat.id)}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                        selectedCategory === cat.id ? 'bg-gradient-to-r from-[#1890FF] to-[#00D4FF] text-white shadow-sm shadow-blue-500/20' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                      }`}>
                      {IconComponent ? <IconComponent className="w-4 h-4" /> : <span>{cat.icon}</span>}
                      <span>{cat.name}</span>
                    </button>
                  );
                })}
              </div>
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

            {/* Mobile search */}
            <div className="md:hidden">
              <div className="relative">
                <input type="text" placeholder="搜索优惠券..." value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-10 pl-10 pr-4 rounded-xl bg-white border border-gray-200 text-sm focus:border-[#1890FF] focus:outline-none shadow-sm" />
<SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>

            {/* Coupon Grid */}
            {filteredCoupons.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl shadow-sm">
                <CouponIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-400">暂无优惠券</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
                {filteredCoupons.map((coupon) => (
                  <Link key={coupon.id} href={`/coupon/${coupon.id}`}
                    className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                    <div className="relative aspect-square bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
                      <Image src={coupon.image_url} alt={coupon.name} fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent pt-8 pb-1.5 px-2.5">
                        <span className="text-white font-bold text-sm md:text-base">¥{coupon.price.toLocaleString()}</span>
                      </div>
                      
                      {coupon.remaining_quantity === 0 && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <span className="text-white font-bold text-sm bg-black/30 px-3 py-1 rounded-lg">已售罄</span>
                        </div>
                      )}
                    </div>
                    <div className="p-2.5 md:p-3">
                      <h3 className="text-xs md:text-sm font-medium text-gray-800 line-clamp-2 mb-1.5 leading-tight">{coupon.name}</h3>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-[#FE2C55] font-medium">已抢999+</span>
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
        </div>
      </div>

      {/* ===== Footer ===== */}
      <Footer />

      {/* ===== Bottom Navigation (Mobile only) ===== */}
      <BottomNav active="mall" />
    </div>
  );
}
