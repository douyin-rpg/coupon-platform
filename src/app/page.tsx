'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/auth-context';

import BottomNav from '@/components/bottom-nav';
import Footer from '@/components/footer';
import GrabNotification from '@/components/grab-notification';

interface Banner { id: string; image_url: string; title: string; link_url: string; }
interface Category { id: string; name: string; icon: string; }
interface Session { id: string; name: string; start_time: string; end_time: string; is_active: boolean; }
interface Coupon { id: string; name: string; price: number; image_url: string; remaining_quantity: number; total_quantity: number; session_id: string; category_id: string; description: string; }
interface Article { id: string; title: string; created_at: string; }

import { HomeIcon, ShoppingCartIcon, HeadphoneIcon, UserIcon, SearchIcon, ChevronRightIcon, AnnounceIcon, CouponIcon, StreamIcon, ShoppingBagIcon, GoldIcon, InfoIcon, StarIcon, CheckIcon, FlashIcon } from '@/components/icons';

const categoryIconMap: Record<string, React.FC<{ className?: string }>> = {
  '官方优惠券': CouponIcon,
  '主播优惠券': StreamIcon,
  '商品优惠券': ShoppingBagIcon,
  '黄金实物': GoldIcon,
  '优惠券说明': InfoIcon,
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
      {/* ===== Hero Section - douyinec.com style full-screen slideshow ===== */}
      <div className="relative overflow-hidden">
        {/* Full-screen slideshow background with real CDN images + video */}
        <div className="absolute inset-0">
          {[
            { bg: '#5ac8ff', img: '01' },
            { bg: '#acc9f7', img: '02' },
            { bg: '#7eb6ff', img: '03' },
            { bg: '#b8d4ff', img: '04' },
            { bg: '#8ec5ff', img: '05' },
          ].map((slide, i) => (
            <div
              key={slide.img}
              className="absolute inset-0 transition-opacity duration-[1500ms]"
              style={{
                opacity: currentBanner % 5 === i ? 1 : 0,
                backgroundColor: slide.bg,
              }}
            >
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{
                  backgroundImage: `url(https://lf3-static.bytednsdoc.com/obj/eden-cn/uvpahylwvauhojylt_lm_tvjl/ljhwZthlaukjlkulzlp/douyin-ec/page1/${slide.img}.jpg)`,
                }}
              />
              {/* Video animation layer */}
              {currentBanner % 5 === i && (
                <video
                  className="absolute inset-0 w-full h-full object-cover"
                  muted
                  playsInline
                  autoPlay
                  loop
                  poster={`https://lf3-static.bytednsdoc.com/obj/eden-cn/uvpahylwvauhojylt_lm_tvjl/ljhwZthlaukjlkulzlp/douyin-ec/page1/${slide.img}.jpg`}
                >
                  <source src={`https://lf3-static.bytednsdoc.com/obj/eden-cn/uvpahylwvauhojylt_lm_tvjl/ljhwZthlaukjlkulzlp/douyin-ec/page1/${slide.img}-a.mp4`} type="video/mp4" />
                </video>
              )}
            </div>
          ))}
          {/* Gradient overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/40" />
        </div>

        {/* Desktop nav bar - douyinec.com style */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-3 md:py-4">
            <div className="flex items-center gap-3">
              <Image src="/images/logo.png" alt="抖音电商" width={140} height={40} className="h-7 md:h-9 w-auto" />
            </div>
            {/* Desktop nav links - matching douyinec.com */}
            <div className="hidden lg:flex items-center gap-6 text-white/70 text-sm">
              <span className="text-white font-medium border-b-2 border-white pb-0.5">首页</span>
              <Link href="/cart" className="hover:text-white transition-colors">购物车</Link>
              <Link href="/profile/order" className="hover:text-white transition-colors">我的订单</Link>
              <Link href="/announcements" className="hover:text-white transition-colors">公告中心</Link>
            </div>
            <div className="flex items-center gap-3">
              {/* Mobile: search + service */}
              <Link href="/announcements" className="md:hidden flex items-center text-white/50 hover:text-white/80 transition-colors">
                <AnnounceIcon className="w-5 h-5" />
              </Link>
              {user ? (
                <Link href="/profile" className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/8 text-white text-sm hover:bg-white/15 transition-all border border-white/10">
                  <UserIcon className="w-4 h-4" />
                  <span className="hidden sm:inline">{user.username}</span>
                </Link>
              ) : (
                <div className="flex items-center gap-2">
                  <Link href="/login" className="px-5 py-1.5 rounded-full bg-[#1890FF] text-white text-sm font-medium hover:bg-[#1890FF]/80 transition-colors shadow-sm shadow-blue-400/20">登录</Link>
                  <Link href="/register" className="hidden sm:inline-flex px-4 py-1.5 rounded-full border border-white/20 text-white/80 text-sm hover:bg-white/8 transition-all">注册</Link>
                </div>
              )}
            </div>
          </div>

          {/* Hero title - matching douyinec.com */}
          <div className="pb-4 pt-4 md:pt-8 md:pb-6 text-center">
            <h1 className="text-2xl md:text-5xl lg:text-6xl font-bold text-white mb-4 tracking-wide"
              style={{ textShadow: '0 2px 20px rgba(0,0,0,0.3)' }}>
              加入抖音电商，激发兴趣 引领增长
            </h1>
            {/* Feature tags */}
            <div className="flex items-center justify-center gap-4 md:gap-6 mb-6 flex-wrap">
              <div className="flex items-center gap-1.5 text-white/80 text-xs md:text-sm">
                <CheckIcon className="w-3.5 h-3.5 md:w-4 md:h-4 text-white" />
                <span>抖音超6亿日活</span>
              </div>
              <div className="flex items-center gap-1.5 text-white/80 text-xs md:text-sm">
                <CheckIcon className="w-3.5 h-3.5 md:w-4 md:h-4 text-white" />
                <span>全面购物场景</span>
              </div>
              <div className="flex items-center gap-1.5 text-white/80 text-xs md:text-sm">
                <CheckIcon className="w-3.5 h-3.5 md:w-4 md:h-4 text-white" />
                <span>一站式全链经营</span>
              </div>
            </div>
          </div>
        </div>

        {/* Entry cards + countdown - douyinec.com style */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 md:pb-16">
          <div className="flex flex-col lg:flex-row items-start gap-6">
            {/* Left: Entry cards matching douyinec.com */}
            <div className="flex-1 w-full">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { name: '境内商家', desc: '在抖音开店卖货，带来生意增量', icon: 'https://lf3-fe.ecombdstatic.com/obj/ecom-cdn-default/ecom/fe-alliance-home/out//_next/static/media/doudian.7349dac0.png', href: '/login' },
                  { name: '即时零售', desc: '线上线下联动，即时送达', icon: 'https://lf3-fe.ecombdstatic.com/obj/ecom-cdn-default/ecom/fe-alliance-home/out//_next/static/media/kuajing.ca0721db.png', href: '/login' },
                  { name: '跨境商家', desc: '境外商家在抖音开店卖货', icon: 'https://lf3-fe.ecombdstatic.com/obj/ecom-cdn-default/ecom/fe-alliance-home/out//_next/static/media/daren.ae87ee58.png', href: '/register' },
                  { name: '达人', desc: '抖音好物推荐官', icon: 'https://lf3-fe.ecombdstatic.com/obj/ecom-cdn-default/ecom/fe-alliance-home/out//_next/static/media/daremcn.b6d7dd6d.png', href: '/register' },
                  { name: '达人机构', desc: 'MCN/招商团长/精选联盟', icon: 'https://lf3-fe.ecombdstatic.com/obj/ecom-cdn-default/ecom/fe-alliance-home/out//_next/static/media/doudian.7349dac0.png', href: '/register' },
                  { name: '服务商', desc: '与商家共同构建经营阵地', icon: 'https://lf3-fe.ecombdstatic.com/obj/ecom-cdn-default/ecom/fe-alliance-home/out//_next/static/media/kuajing.ca0721db.png', href: '/register' },
                ].map((item, i) => (
                  <a key={i} href={item.href} className="group bg-white/10 backdrop-blur-sm rounded-xl p-4 md:p-5 border border-white/8 hover:bg-white/15 hover:border-white/15 transition-all">
                    <div className="flex items-start gap-3">
                      <Image src={item.icon} alt={item.name} width={40} height={40} className="w-9 h-9 md:w-10 md:h-10 flex-shrink-0 group-hover:scale-110 transition-transform" unoptimized />
                      <div className="min-w-0">
                        <div className="text-white text-sm font-medium">{item.name}</div>
                        <div className="text-white/35 text-[11px] mt-0.5 line-clamp-2">{item.desc}</div>
                        <div className="flex items-center gap-1 mt-2 text-[#00D4FF] text-[11px] font-medium group-hover:gap-1.5 transition-all">
                          立即入驻 <ChevronRightIcon className="w-3 h-3" />
                        </div>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>

            {/* Right: Countdown + GrabNotification */}
            <div className="w-full lg:w-80 flex-shrink-0 space-y-4">
              {/* Countdown card */}
              {activeSession && (
                <div className="bg-white/8 backdrop-blur-md rounded-2xl p-5 border border-white/8"
                  style={{ boxShadow: '0 0 30px rgba(0,212,255,0.08), inset 0 1px 0 rgba(255,255,255,0.05)' }}>
                  <div className="flex items-center gap-1.5 mb-3">
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400"></span>
                    </span>
                    <span className="text-green-400 text-xs font-medium">抢购中</span>
                    <span className="text-white/25 text-xs ml-auto">{activeSession.name}</span>
                  </div>
                  <div className="flex items-center justify-center gap-1">
                    {getCountdown(activeSession)?.split(':').map((val, i) => (
                      <span key={i} className="flex items-center">
                        <span className="bg-white/8 text-white text-lg md:text-xl font-bold font-mono px-3 py-1.5 rounded-lg tabular-nums min-w-[40px] text-center"
                          style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)' }}>{val}</span>
                        {i < 2 && <span className="text-[#00D4FF]/50 font-bold mx-0.5 text-sm">:</span>}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {!activeSession && nextSession && (
                <div className="bg-white/4 rounded-2xl p-5 border border-white/5">
                  <div className="flex items-center gap-1.5 mb-3">
                    <span className="text-amber-400 text-xs font-medium">{nextSession.name} 即将开始</span>
                  </div>
                  <div className="flex items-center justify-center gap-1">
                    {getCountdown(nextSession)?.split(':').map((val, i) => (
                      <span key={i} className="flex items-center">
                        <span className="bg-white/6 text-white/60 text-lg md:text-xl font-bold font-mono px-3 py-1.5 rounded-lg tabular-nums min-w-[40px] text-center">{val}</span>
                        {i < 2 && <span className="text-white/15 font-bold mx-0.5 text-sm">:</span>}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <GrabNotification isActive={canGrab} />
            </div>
          </div>
        </div>
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

        {/* 抢购轮播通知 - 仅场次开放时显示 */}
        {activeSession && (
          <div className="mt-3">
            <GrabNotification isActive={canGrab} />
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
                  <div key={session.id} className={`px-3 py-2.5 rounded-xl text-sm ${status === 'active' ? 'bg-blue-50 border border-blue-100' : 'bg-gray-50'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {status === 'active' && <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />}
                        {status === 'upcoming' && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
                        {status === 'ended' && <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />}
                        <span className={`font-medium ${status === 'active' ? 'text-[#1890FF]' : 'text-gray-600'}`}>{session.name}</span>
                      </div>
                      <span className="text-gray-400 text-xs">{session.start_time}-{session.end_time}</span>
                    </div>
                    {countdown && status === 'active' && (
                      <div className="mt-1.5 text-xs text-[#1890FF] font-mono tabular-nums">{countdown} 后结束</div>
                    )}
                    {status === 'upcoming' && countdown && (
                      <div className="mt-1.5 text-xs text-amber-500 font-mono tabular-nums">{countdown} 后开始</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right content area */}
          <div className="flex-1 min-w-0">
            {/* Mobile category tabs */}
            <div className="flex lg:hidden gap-2 mb-3 overflow-x-auto pb-1 scrollbar-hide">
              <button onClick={() => setSelectedCategory('')}
                className={`flex-shrink-0 flex items-center gap-1 px-4 py-2 rounded-full text-xs font-medium transition-all mr-2 ${
                  !selectedCategory ? 'bg-gradient-to-r from-[#1890FF] to-[#00D4FF] text-white shadow-sm' : 'bg-white text-gray-600 shadow-sm'
                }`}>
                <CouponIcon className="w-3.5 h-3.5" />
                全部
              </button>
              {categories.map(cat => {
                const IconComponent = categoryIconMap[cat.name];
                return (
                  <button key={cat.id} onClick={() => setSelectedCategory(selectedCategory === cat.id ? '' : cat.id)}
                    className={`flex-shrink-0 flex items-center gap-1 px-4 py-2 rounded-full text-xs font-medium transition-all mr-2 ${
                      selectedCategory === cat.id ? 'bg-gradient-to-r from-[#1890FF] to-[#00D4FF] text-white shadow-sm' : 'bg-white text-gray-600 shadow-sm'
                    }`}>
                    {IconComponent ? <IconComponent className="w-3.5 h-3.5" /> : <span>{cat.icon}</span>}
                    {cat.name}
                  </button>
                );
              })}
            </div>

            {/* Mobile session info */}
            <div className="md:hidden mb-3">
              {activeSession ? (
                <div className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-[#1890FF]/5 to-[#00D4FF]/5 rounded-xl border border-[#1890FF]/10">
                  <div className="flex items-center gap-2">
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400"></span>
                    </span>
                    <span className="text-green-600 text-xs font-medium">抢购中</span>
                    <span className="text-gray-400 text-xs">{activeSession.name}</span>
                  </div>
                  <span className="text-[#1890FF] text-xs font-mono font-bold tabular-nums">{getCountdown(activeSession)}</span>
                </div>
              ) : nextSession ? (
                <div className="px-3 py-2 bg-amber-50 border border-amber-100 rounded-lg text-center">
                  <span className="text-amber-600 text-xs">{nextSession.name} 即将开始 {getCountdown(nextSession)}</span>
                </div>
              ) : (
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
