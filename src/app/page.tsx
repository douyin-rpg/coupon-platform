'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import Image from 'next/image';
import Link from 'next/link';

interface Session { id: string; name: string; start_time: string; end_time: string; is_active: boolean; }
interface Category { id: string; name: string; icon: string; sort_order: number; }
interface Coupon {
  id: string; name: string; price: number; original_price: number; discount: string | null;
  total_quantity: number; remaining_quantity: number; sold_count: number;
  image_url: string | null; is_active: boolean; session_id: string; category_id: string | null;
  description: string | null;
}
interface Banner { id: string; image_url: string; link_url: string | null; title: string | null; }

export default function HomePage() {
  const { user, loading: authLoading } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [activeSession, setActiveSession] = useState<string>('all');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [grabModal, setGrabModal] = useState<{ open: boolean; coupon: Coupon | null }>({ open: false, coupon: null });
  const [payPassword, setPayPassword] = useState('');
  const [grabLoading, setGrabLoading] = useState(false);
  const [grabError, setGrabError] = useState('');
  const [now, setNow] = useState(Date.now());
  const [bannerIndex, setBannerIndex] = useState(0);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Banner auto-slide
  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      setBannerIndex(prev => (prev + 1) % banners.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [banners.length]);

  // Fetch data
  const fetchData = useCallback(async () => {
    const [sessRes, catRes, coupRes, banRes] = await Promise.all([
      fetch('/api/sessions'), fetch('/api/categories'), fetch('/api/coupons'), fetch('/api/banners'),
    ]);
    if (sessRes.ok) { const d = await sessRes.json(); setSessions(d.sessions || []); }
    if (catRes.ok) { const d = await catRes.json(); setCategories(d.categories || []); }
    if (coupRes.ok) { const d = await coupRes.json(); setCoupons(d.coupons || []); }
    if (banRes.ok) { const d = await banRes.json(); setBanners(d.banners || []); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Session time check
  type SessionStatus = { status: string; label: string; remaining: number };
  const getSessionStatus = (session: Session) => {
    const cur = new Date();
    const [sh, sm] = session.start_time.split(':').map(Number);
    const [eh, em] = session.end_time.split(':').map(Number);
    const start = new Date(cur); start.setHours(sh, sm, 0, 0);
    const end = new Date(cur); end.setHours(eh, em, 0, 0);
    if (now < start.getTime()) return { status: 'upcoming', label: '即将开始', remaining: start.getTime() - now };
    if (now >= start.getTime() && now <= end.getTime()) return { status: 'active', label: '抢购中', remaining: end.getTime() - now };
    return { status: 'ended', label: '已结束', remaining: 0 };
  };

  const formatCountdown = (ms: number) => {
    if (ms <= 0) return '00:00:00';
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Filter coupons
  const filteredCoupons = coupons.filter((c) => {
    if (activeSession !== 'all' && c.session_id !== activeSession) return false;
    if (activeCategory !== 'all' && c.category_id !== activeCategory) return false;
    if (searchKeyword && !c.name.toLowerCase().includes(searchKeyword.toLowerCase())) return false;
    return true;
  });

  // Grab coupon
  const handleGrab = async () => {
    if (!grabModal.coupon) return;
    if (!user) { setGrabError('请先登录'); return; }
    if (user.verifyStatus !== "verified") { setGrabError('请先完成实名认证'); return; }
    if (!payPassword) { setGrabError('请输入支付密码'); return; }
    setGrabLoading(true); setGrabError('');
    try {
      const res = await fetch('/api/coupons/grab', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ couponId: grabModal.coupon.id, paymentPassword: payPassword }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert('抢券成功！');
        setGrabModal({ open: false, coupon: null });
        setPayPassword('');
        fetchData();
      } else {
        setGrabError(data.error || '抢券失败');
      }
    } catch { setGrabError('网络错误'); }
    finally { setGrabLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      {/* ========== HERO SECTION - 抖音电商深蓝渐变背景 + 浮动光球动画 ========== */}
      <div className="relative overflow-hidden bg-gradient-to-b from-[#0A1628] via-[#132742] to-[#0D1F35]">
        {/* Floating orbs animation */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div
            className="absolute w-64 h-64 md:w-96 md:h-96 rounded-full opacity-30 blur-3xl"
            style={{
              background: 'radial-gradient(circle, rgba(0,212,255,0.4) 0%, rgba(0,212,255,0) 70%)',
              top: '10%',
              left: '10%',
              animation: 'float-orb-1 8s ease-in-out infinite',
            }}
          />
          <div
            className="absolute w-48 h-48 md:w-72 md:h-72 rounded-full opacity-25 blur-3xl"
            style={{
              background: 'radial-gradient(circle, rgba(123,97,255,0.4) 0%, rgba(123,97,255,0) 70%)',
              top: '30%',
              right: '15%',
              animation: 'float-orb-2 10s ease-in-out infinite',
            }}
          />
          <div
            className="absolute w-56 h-56 md:w-80 md:h-80 rounded-full opacity-20 blur-3xl"
            style={{
              background: 'radial-gradient(circle, rgba(24,144,255,0.4) 0%, rgba(24,144,255,0) 70%)',
              bottom: '10%',
              left: '40%',
              animation: 'float-orb-3 12s ease-in-out infinite',
            }}
          />
          <div
            className="absolute w-32 h-32 md:w-48 md:h-48 rounded-full opacity-20 blur-2xl"
            style={{
              background: 'radial-gradient(circle, rgba(254,44,85,0.3) 0%, rgba(254,44,85,0) 70%)',
              top: '50%',
              left: '60%',
              animation: 'float-orb-1 9s ease-in-out infinite reverse',
            }}
          />
        </div>

        {/* Top bar - transparent overlay on hero */}
        <div className="relative z-10 hidden md:block">
          <div className="max-w-[1200px] mx-auto px-4 h-8 flex items-center justify-between text-gray-400 text-xs">
            <span>欢迎来到抖音电商优惠券抢购平台！</span>
            <div className="flex items-center gap-4">
              {authLoading ? null : user ? (
                <>
                  <span>您好：<Link href="/profile" className="text-[#00D4FF] font-medium">{user.username}</Link></span>
                  <button onClick={async () => { await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }); window.location.href = '/'; }} className="text-gray-400 hover:text-white">退出</button>
                  <Link href="/profile/order" className="hover:text-white">我的订单</Link>
                </>
              ) : (
                <>
                  <Link href="/login" className="text-[#00D4FF] hover:underline">登录</Link>
                  <Link href="/register" className="hover:text-white">注册</Link>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Header with logo + search */}
        <div className="relative z-10">
          <div className="max-w-[1200px] mx-auto px-4 py-3 flex items-center justify-between gap-4">
            {/* Logo - 使用抖音电商官方Logo */}
            <Link href="/" className="flex items-center gap-2 flex-shrink-0">
              <Image src="/images/logo.png" alt="抖音电商" width={140} height={36} className="h-8 md:h-9 w-auto" priority />
            </Link>

            {/* Search */}
            <div className="flex-1 max-w-xl hidden sm:block">
              <div className="flex">
                <input
                  type="text" placeholder="搜索优惠券..." value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-l-lg text-white placeholder-white/50 focus:outline-none focus:border-[#00D4FF] focus:bg-white/15 text-sm backdrop-blur-sm"
                />
                <button className="px-6 py-2 bg-gradient-to-r from-[#1890FF] to-[#00D4FF] text-white rounded-r-lg text-sm font-medium hover:opacity-90">搜索</button>
              </div>
            </div>

            {/* User info */}
            <div className="flex items-center gap-3 flex-shrink-0">
              {authLoading ? null : user ? (
                <Link href="/profile" className="flex items-center gap-2 text-sm text-white/90 hover:text-white">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00D4FF] to-[#7B61FF] flex items-center justify-center">
                    <span className="text-white text-xs font-bold">{user.username.charAt(0).toUpperCase()}</span>
                  </div>
                  <span className="hidden md:inline">{user.username}</span>
                </Link>
              ) : (
                <Link href="/login" className="px-4 py-1.5 bg-gradient-to-r from-[#1890FF] to-[#00D4FF] text-white text-sm rounded-lg hover:opacity-90">登录</Link>
              )}
            </div>
          </div>
        </div>

        {/* Category Navigation Bar - 蓝色系 */}
        <div className="relative z-10 bg-[#1890FF]">
          <div className="max-w-[1200px] mx-auto px-4">
            <div className="flex items-center h-10 text-sm text-white overflow-x-auto gap-1">
              <button onClick={() => setActiveCategory('all')}
                className={`px-4 py-2 whitespace-nowrap rounded-t-lg transition-colors ${activeCategory === 'all' ? 'bg-[#0D6EFD] font-medium' : 'hover:bg-white/10'}`}>
                全部
              </button>
              {categories.map((cat) => (
                <button key={cat.id} onClick={() => setActiveCategory(activeCategory === cat.id ? 'all' : cat.id)}
                  className={`px-4 py-2 whitespace-nowrap rounded-t-lg transition-colors ${activeCategory === cat.id ? 'bg-[#0D6EFD] font-medium' : 'hover:bg-white/10'}`}>
                  {cat.icon} {cat.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Banner Carousel - integrated into hero */}
        <div className="relative z-10 max-w-[1200px] mx-auto px-4 py-4">
          {banners.length > 0 ? (
            <div className="rounded-xl overflow-hidden h-[140px] md:h-[280px] bg-white/5 relative border border-white/10">
              <img
                src={banners[bannerIndex]?.image_url}
                alt={banners[bannerIndex]?.title || ''}
                className="w-full h-full object-cover transition-opacity duration-500"
              />
              {banners.length > 1 && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {banners.map((_, i) => (
                    <button key={i} onClick={() => setBannerIndex(i)}
                      className={`w-2 h-2 rounded-full transition-all ${i === bannerIndex ? 'bg-[#00D4FF] w-4' : 'bg-white/30'}`} />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-xl overflow-hidden h-[140px] md:h-[260px] relative flex items-center justify-center">
              {/* Default animated banner */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#1890FF]/20 to-[#7B61FF]/20 backdrop-blur-sm border border-white/10 rounded-xl" />
              <div className="relative text-center text-white">
                <h2 className="text-3xl md:text-5xl font-bold mb-2" style={{ background: 'linear-gradient(135deg, #00D4FF, #7B61FF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  限时抢购
                </h2>
                <p className="text-base md:text-lg text-white/80">抢券即可回兑赚5%奖励</p>
              </div>
              <div className="absolute right-4 top-4 md:right-8 md:top-8">
                <div className="text-white text-right bg-white/5 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/10">
                  <p className="text-xs text-white/60">当前余额</p>
                  <p className="text-xl md:text-2xl font-bold text-[#00D4FF]">{user?.verifyStatus === 'verified' ? `¥${Number(user.balance || 0).toFixed(2)}` : '登录查看'}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ========== SESSION TABS + COUNTDOWN ========== */}
      <div className="max-w-[1200px] mx-auto px-4 -mt-2 relative z-20">
        {sessions.length > 0 && (
          <div className="mb-4 bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="flex items-center border-b border-gray-100 overflow-x-auto">
              <button onClick={() => setActiveSession('all')}
                className={`px-5 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${activeSession === 'all' ? 'border-[#1890FF] text-[#1890FF]' : 'border-transparent text-gray-600 hover:text-[#1890FF]'}`}>
                全部场次
              </button>
              {sessions.map((s) => {
                const ss = getSessionStatus(s);
                return (
                  <button key={s.id} onClick={() => setActiveSession(s.id)}
                    className={`px-5 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors flex items-center gap-2 ${activeSession === s.id ? 'border-[#1890FF] text-[#1890FF]' : 'border-transparent text-gray-600 hover:text-[#1890FF]'}`}>
                    <span>{s.name}</span>
                    <span className="text-xs text-gray-400">{s.start_time}-{s.end_time}</span>
                    {ss.status === 'active' && (
                      <span className="text-xs bg-[#1890FF] text-white px-1.5 py-0.5 rounded animate-pulse">抢购中</span>
                    )}
                    {ss.status === 'upcoming' && (
                      <span className="text-xs bg-blue-50 text-[#1890FF] px-1.5 py-0.5 rounded">即将开始</span>
                    )}
                    {ss.status === 'ended' && (
                      <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">已结束</span>
                    )}
                  </button>
                );
              })}
            </div>
            {/* Active session countdown */}
            {activeSession !== 'all' && (() => {
              const s = sessions.find((x) => x.id === activeSession);
              if (!s) return null;
              const ss = getSessionStatus(s);
              if (ss.status === 'active') {
                return (
                  <div className="px-5 py-3 bg-gradient-to-r from-blue-50 to-cyan-50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">距离本场结束：</span>
                      <div className="flex gap-1">
                        {formatCountdown(ss.remaining).split(':').map((part, i) => (
                          <span key={i} className="inline-flex items-center">
                            <span className="bg-gradient-to-b from-[#1890FF] to-[#0D6EFD] text-white font-mono font-bold text-lg px-2 py-1 rounded" style={{ animation: 'countdown-pulse 1s ease-in-out infinite' }}>{part}</span>
                            {i < 2 && <span className="text-[#1890FF] font-bold mx-0.5">:</span>}
                          </span>
                        ))}
                      </div>
                    </div>
                    <span className="text-xs text-[#1890FF] font-medium">手慢无！</span>
                  </div>
                );
              }
              if (ss.status === 'upcoming') {
                return (
                  <div className="px-5 py-3 bg-blue-50 flex items-center gap-2">
                    <span className="text-sm text-gray-600">距离开始：</span>
                    <div className="flex gap-1">
                      {formatCountdown(ss.remaining).split(':').map((part, i) => (
                        <span key={i} className="inline-flex items-center">
                          <span className="bg-[#1890FF] text-white font-mono font-bold text-lg px-2 py-1 rounded">{part}</span>
                          {i < 2 && <span className="text-[#1890FF] font-bold mx-0.5">:</span>}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              }
              return <div className="px-5 py-3 bg-gray-50 text-sm text-gray-400">本场次已结束</div>;
            })()}
          </div>
        )}

        {/* ========== COUPON GRID ========== */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 md:gap-3">
          {filteredCoupons.map((coupon, idx) => {
            const session = sessions.find((s) => s.id === coupon.session_id);
            const ss: SessionStatus = session ? getSessionStatus(session) : { status: 'ended', label: '未排期', remaining: 0 };
            const canGrab = user?.verifyStatus === "verified" && ss.status === 'active' && coupon.remaining_quantity > 0;
            return (
              <Link key={coupon.id} href={`/coupon/${coupon.id}`}
                className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-all group"
                style={{ animation: `slide-up-fade 0.4s ease-out ${idx * 0.06}s both` }}>
                <div className="relative aspect-square bg-gray-100">
                  {coupon.image_url ? (
                    <img src={coupon.image_url} alt={coupon.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-50">
                      <span className="text-4xl">🎫</span>
                    </div>
                  )}
                  {/* Status badge */}
                  {ss.status === 'active' && coupon.remaining_quantity > 0 && (
                    <div className="absolute top-1.5 left-1.5 bg-[#1890FF] text-white text-[10px] px-1.5 py-0.5 rounded font-medium animate-pulse">抢购中</div>
                  )}
                  {ss.status === 'upcoming' && (
                    <div className="absolute top-1.5 left-1.5 bg-[#1890FF] text-white text-[10px] px-1.5 py-0.5 rounded font-medium">即将开始</div>
                  )}
                  {ss.status === 'ended' && (
                    <div className="absolute top-1.5 left-1.5 bg-gray-500 text-white text-[10px] px-1.5 py-0.5 rounded font-medium">已结束</div>
                  )}
                  {/* Sold out overlay */}
                  {coupon.remaining_quantity <= 0 && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <span className="text-white font-bold text-base">已售罄</span>
                    </div>
                  )}
                  {/* Discount badge */}
                  {coupon.discount && (
                    <div className="absolute top-1.5 right-1.5 bg-[#7B61FF] text-white text-[10px] px-1.5 py-0.5 rounded font-bold">{coupon.discount}</div>
                  )}
                </div>
                <div className="p-2 md:p-3">
                  <p className="text-xs md:text-sm text-gray-800 font-medium truncate">{coupon.name}</p>
                  {coupon.description && (
                    <p className="text-[10px] md:text-xs text-gray-400 truncate mt-0.5">{coupon.description}</p>
                  )}
                  <div className="flex items-end justify-between mt-1.5">
                    <div>
                      <span className="text-[#FFC107] font-bold text-base md:text-lg">¥{coupon.price}</span>
                      {coupon.original_price > 0 && coupon.original_price > coupon.price && (
                        <span className="text-[10px] text-gray-400 line-through ml-1">¥{coupon.original_price}</span>
                      )}
                    </div>
                    <span className="text-[10px] text-gray-400">已售{coupon.sold_count || 0}件</span>
                  </div>
                  {canGrab && (
                    <button onClick={(e) => { e.preventDefault(); setGrabModal({ open: true, coupon }); }}
                      className="mt-2 w-full py-1.5 bg-gradient-to-r from-[#1890FF] to-[#00D4FF] text-white text-xs md:text-sm font-medium rounded-lg hover:shadow-md active:scale-[0.97] transition-all"
                      style={{ animation: 'shimmer 2s linear infinite', backgroundSize: '200% auto' }}>
                      立即抢购
                    </button>
                  )}
                  {!user && ss.status === 'active' && coupon.remaining_quantity > 0 && (
                    <Link href="/login" onClick={(e) => e.stopPropagation()}
                      className="mt-2 block text-center py-1.5 bg-gradient-to-r from-[#1890FF] to-[#00D4FF] text-white text-xs md:text-sm font-medium rounded-lg">
                      登录抢购
                    </Link>
                  )}
                  {user && user.verifyStatus !== "verified" && ss.status === 'active' && coupon.remaining_quantity > 0 && (
                    <Link href="/profile/settings/verify" onClick={(e) => e.stopPropagation()}
                      className="mt-2 block text-center py-1.5 border border-[#1890FF] text-[#1890FF] text-xs rounded-lg">
                      认证后抢购
                    </Link>
                  )}
                </div>
              </Link>
            );
          })}
        </div>

        {filteredCoupons.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            <span className="text-5xl block mb-4">🎫</span>
            <p>暂无优惠券</p>
          </div>
        )}
      </div>

      {/* Mobile bottom nav - 蓝色主题 */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t border-gray-200 z-40">
        <div className="flex items-center justify-around h-12">
          <Link href="/" className="flex flex-col items-center text-[#1890FF]">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" /></svg>
            <span className="text-[10px]">首页</span>
          </Link>
          <Link href="/cart" className="flex flex-col items-center text-gray-500">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" /></svg>
            <span className="text-[10px]">购物车</span>
          </Link>
          <Link href="/profile" className="flex flex-col items-center text-gray-500">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            <span className="text-[10px]">我的</span>
          </Link>
        </div>
      </div>

      {/* ========== GRAB MODAL ========== */}
      {grabModal.open && grabModal.coupon && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => { setGrabModal({ open: false, coupon: null }); setPayPassword(''); setGrabError(''); }}>
          <div className="bg-white rounded-2xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-800 mb-4">确认抢购</h3>
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-4 mb-4">
              <p className="font-medium text-gray-800">{grabModal.coupon.name}</p>
              <p className="text-[#FFC107] font-bold text-2xl mt-1">¥{grabModal.coupon.price}</p>
              {grabModal.coupon.description && (
                <p className="text-xs text-gray-500 mt-1">{grabModal.coupon.description}</p>
              )}
              {user && (
                <p className="text-sm text-gray-500 mt-2">当前余额：<span className="font-bold text-[#1890FF]">¥{Number(user.balance || 0).toFixed(2)}</span></p>
              )}
            </div>
            {grabError && <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-2.5 rounded-xl mb-3">{grabError}</div>}
            <div className="mb-4">
              <label className="block text-sm text-gray-600 mb-1">支付密码</label>
              <input type="password" placeholder="请输入支付密码" value={payPassword} onChange={(e) => setPayPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1890FF] text-sm" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setGrabModal({ open: false, coupon: null }); setPayPassword(''); setGrabError(''); }}
                className="flex-1 py-2.5 border border-gray-300 rounded-xl text-gray-600 text-sm">取消</button>
              <button onClick={handleGrab} disabled={grabLoading}
                className="flex-1 py-2.5 bg-gradient-to-r from-[#1890FF] to-[#00D4FF] text-white rounded-xl text-sm font-bold disabled:opacity-50 active:scale-[0.97] transition-all">
                {grabLoading ? '抢购中...' : '确认抢购'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom spacer for mobile */}
      <div className="md:hidden h-14" />
    </div>
  );
}
