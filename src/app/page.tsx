"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  username: string;
  realName: string;
  isVerified: boolean;
  balance: number;
  paymentAccount: string | null;
}

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
  remaining_quantity: number;
  sold_count: number;
  image_url: string | null;
  session_id: string;
  category_id: string | null;
  is_active: boolean;
}

interface Category {
  id: string;
  name: string;
  icon: string;
  sort_order: number;
}

interface Banner {
  id: string;
  image_url: string;
  link_url: string | null;
  title: string | null;
}

function CountdownTimer({ startTime, endTime, isActive }: { startTime: string; endTime: string; isActive: boolean }) {
  const [timeLeft, setTimeLeft] = useState("");
  const [status, setStatus] = useState<"waiting" | "active" | "ended">("ended");

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const [sh, sm] = startTime.split(":").map(Number);
      const [eh, em] = endTime.split(":").map(Number);

      const start = new Date(now);
      start.setHours(sh, sm, 0, 0);
      const end = new Date(now);
      end.setHours(eh, em, 0, 0);

      if (now < start) {
        setStatus("waiting");
        const diff = start.getTime() - now.getTime();
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`);
      } else if (now <= end) {
        setStatus("active");
        const diff = end.getTime() - now.getTime();
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`);
      } else {
        setStatus("ended");
        setTimeLeft("已结束");
      }
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [startTime, endTime, isActive]);

  return (
    <div className="flex items-center gap-1">
      {status === "active" && (
        <div className="flex items-center gap-1">
          <span className="bg-[#FE2C55] text-white text-xs font-bold px-1.5 py-0.5 rounded">抢购中</span>
          <span className="font-mono text-[#FE2C55] font-bold text-lg tabular-nums">{timeLeft}</span>
        </div>
      )}
      {status === "waiting" && (
        <div className="flex items-center gap-1">
          <span className="bg-gray-200 text-gray-600 text-xs font-bold px-1.5 py-0.5 rounded">即将开始</span>
          <span className="font-mono text-gray-500 font-bold text-lg tabular-nums">{timeLeft}</span>
        </div>
      )}
      {status === "ended" && (
        <span className="text-gray-400 text-sm">已结束</span>
      )}
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [selectedSession, setSelectedSession] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [grabbingId, setGrabbingId] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentPassword, setPaymentPassword] = useState("");
  const [grabTarget, setGrabTarget] = useState<Coupon | null>(null);
  const [msg, setMsg] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [bannerIndex, setBannerIndex] = useState(0);

  const loadData = useCallback(async () => {
    const [userRes, sessionRes, couponRes, catRes, bannerRes] = await Promise.all([
      fetch("/api/auth/me"),
      fetch("/api/sessions"),
      fetch("/api/coupons"),
      fetch("/api/categories"),
      fetch("/api/banners"),
    ]);
    if (userRes.ok) {
      const ud = await userRes.json();
      setUser(ud.user);
    }
    if (sessionRes.ok) {
      const sd = await sessionRes.json();
      const active = sd.sessions?.filter((s: Session) => s.is_active) || [];
      setSessions(active);
      if (active.length > 0 && !selectedSession) setSelectedSession(active[0].id);
    }
    if (couponRes.ok) {
      const cd = await couponRes.json();
      setCoupons(cd.coupons?.filter((c: Coupon) => c.is_active) || []);
    }
    if (catRes.ok) {
      const catd = await catRes.json();
      setCategories(catd.categories || []);
    }
    if (bannerRes.ok) {
      const bd = await bannerRes.json();
      setBanners(bd.banners?.filter((b: Banner) => b.image_url) || []);
    }
  }, [selectedSession]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Banner auto-play
  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      setBannerIndex((prev) => (prev + 1) % banners.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [banners.length]);

  const getSessionStatus = (session: Session): "waiting" | "active" | "ended" => {
    const now = new Date();
    const [sh, sm] = session.start_time.split(":").map(Number);
    const [eh, em] = session.end_time.split(":").map(Number);
    const start = new Date(now);
    start.setHours(sh, sm, 0, 0);
    const end = new Date(now);
    end.setHours(eh, em, 0, 0);
    if (now < start) return "waiting";
    if (now <= end) return "active";
    return "ended";
  };

  const filteredCoupons = coupons.filter((c) => {
    if (selectedSession && c.session_id !== selectedSession) return false;
    if (selectedCategory && c.category_id !== selectedCategory) return false;
    if (searchQuery && !c.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const currentSession = sessions.find((s) => s.id === selectedSession);
  const sessionStatus = currentSession ? getSessionStatus(currentSession) : "ended";

  const handleGrab = (coupon: Coupon) => {
    if (!user) {
      router.push("/login");
      return;
    }
    if (!user.isVerified) {
      setMsg("请先完成实名认证");
      return;
    }
    if (sessionStatus !== "active") {
      setMsg("当前不在抢购时间内");
      return;
    }
    if (user.balance < coupon.price) {
      setMsg("余额不足，请先充值");
      return;
    }
    setGrabTarget(coupon);
    setShowPaymentModal(true);
    setPaymentPassword("");
  };

  const confirmGrab = async () => {
    if (!grabTarget || !paymentPassword) return;
    setGrabbingId(grabTarget.id);
    try {
      const res = await fetch("/api/coupons/grab", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ couponId: grabTarget.id, paymentPassword }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMsg("抢券成功！");
        loadData();
      } else {
        setMsg(data.error || "抢券失败");
      }
    } catch {
      setMsg("网络错误，请重试");
    }
    setShowPaymentModal(false);
    setGrabbingId(null);
    setGrabTarget(null);
    setPaymentPassword("");
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] pb-20">
      {/* 顶部导航 */}
      <div className="sticky top-0 z-50 bg-white shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FE2C55] to-[#FF6B35] flex items-center justify-center">
              <span className="text-white font-bold text-sm">惠</span>
            </div>
            <span className="font-bold text-lg text-[#1A1A1A]">惠抢券</span>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <Link href="/profile" className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#FE2C55]">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#FE2C55] to-[#FF6B35] flex items-center justify-center">
                  <span className="text-white text-xs font-bold">{user.username[0]}</span>
                </div>
                <span>{user.username}</span>
              </Link>
            ) : (
              <div className="flex gap-2">
                <Link href="/login" className="text-sm text-[#FE2C55] font-medium hover:underline">登录</Link>
                <Link href="/register" className="text-sm text-gray-500 hover:text-[#FE2C55]">注册</Link>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4">
        {/* 搜索栏 */}
        <div className="mt-3 relative">
          <input
            type="text"
            placeholder="搜索优惠券"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white rounded-full px-4 py-2.5 pl-10 text-sm border border-gray-200 focus:outline-none focus:border-[#FE2C55] focus:ring-1 focus:ring-[#FE2C55]"
          />
          <svg className="absolute left-3 top-3 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* 轮播图 */}
        {banners.length > 0 && (
          <div className="mt-3 relative rounded-xl overflow-hidden" style={{ aspectRatio: "2.5/1" }}>
            <div
              className="flex transition-transform duration-500 ease-out h-full"
              style={{ transform: `translateX(-${bannerIndex * 100}%)` }}
            >
              {banners.map((banner) => (
                <div key={banner.id} className="min-w-full h-full flex-shrink-0">
                  {banner.link_url ? (
                    <a href={banner.link_url} target="_blank" rel="noopener noreferrer">
                      <img src={banner.image_url} alt={banner.title || ""} className="w-full h-full object-cover" />
                    </a>
                  ) : (
                    <img src={banner.image_url} alt={banner.title || ""} className="w-full h-full object-cover" />
                  )}
                </div>
              ))}
            </div>
            {banners.length > 1 && (
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                {banners.map((_, i) => (
                  <div
                    key={i}
                    className={`w-1.5 h-1.5 rounded-full transition-all ${i === bannerIndex ? "bg-white w-4" : "bg-white/50"}`}
                    onClick={() => setBannerIndex(i)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* 默认 Banner（无自定义轮播图时） */}
        {banners.length === 0 && (
          <div className="mt-3 rounded-xl overflow-hidden bg-gradient-to-r from-[#FE2C55] to-[#FF6B35] p-6 text-white" style={{ aspectRatio: "2.5/1" }}>
            <div className="flex flex-col justify-center h-full">
              <h2 className="text-2xl font-bold mb-2">限时抢券</h2>
              <p className="text-white/80 text-sm">抢券成功申请回兑，额外奖励5%</p>
              <p className="text-white/80 text-sm mt-1">抖音商城专属优惠</p>
            </div>
          </div>
        )}

        {/* 分类导航 */}
        {categories.length > 0 && (
          <div className="mt-4 bg-white rounded-xl p-3">
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              <button
                onClick={() => setSelectedCategory("")}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  !selectedCategory ? "bg-[#FE2C55] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                全部
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(selectedCategory === cat.id ? "" : cat.id)}
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1 ${
                    selectedCategory === cat.id ? "bg-[#FE2C55] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 场次Tab + 倒计时 */}
        {sessions.length > 0 && (
          <div className="mt-4 bg-white rounded-xl p-3">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-[#1A1A1A]">抢购场次</span>
              </div>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {sessions.map((session) => {
                const status = getSessionStatus(session);
                return (
                  <button
                    key={session.id}
                    onClick={() => setSelectedSession(session.id)}
                    className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
                      selectedSession === session.id
                        ? status === "active"
                          ? "bg-[#FE2C55] text-white border-[#FE2C55]"
                          : "bg-gray-800 text-white border-gray-800"
                        : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                    }`}
                  >
                    <div className="text-center">
                      <div className="font-bold">{session.name}</div>
                      <div className="text-xs mt-0.5 opacity-80">{session.start_time}-{session.end_time}</div>
                    </div>
                  </button>
                );
              })}
            </div>
            {currentSession && (
              <div className="mt-3 flex items-center justify-center">
                <CountdownTimer
                  startTime={currentSession.start_time}
                  endTime={currentSession.end_time}
                  isActive={currentSession.is_active}
                />
              </div>
            )}
          </div>
        )}

        {/* 消息提示 */}
        {msg && (
          <div className="mt-3 p-3 rounded-xl bg-white border border-[#FE2C55]/20 text-sm text-center">
            <span className={msg.includes("成功") ? "text-green-600" : "text-[#FE2C55]"}>{msg}</span>
            <button onClick={() => setMsg("")} className="ml-2 text-gray-400 hover:text-gray-600">x</button>
          </div>
        )}

        {/* 优惠券列表 */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-3">
            <span className="font-bold text-[#1A1A1A]">
              {selectedCategory ? categories.find((c) => c.id === selectedCategory)?.name || "优惠券" : "热门优惠券"}
            </span>
            <span className="text-xs text-gray-400">共 {filteredCoupons.length} 个</span>
          </div>

          {filteredCoupons.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center text-gray-400">
              <div className="text-4xl mb-2">🎫</div>
              <p>暂无优惠券</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {filteredCoupons.map((coupon) => {
                const isGrabbing = grabbingId === coupon.id;
                const soldOut = coupon.remaining_quantity <= 0;
                const canGrab = sessionStatus === "active" && !soldOut && user?.isVerified;
                const progress = coupon.remaining_quantity + coupon.sold_count > 0
                  ? Math.round((coupon.sold_count / (coupon.remaining_quantity + coupon.sold_count)) * 100)
                  : 0;

                return (
                  <div key={coupon.id} className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    {/* 图片区 */}
                    <div className="relative aspect-square bg-gradient-to-br from-[#FFF0F0] to-[#FFF8F0] flex items-center justify-center">
                      {coupon.image_url ? (
                        <img src={coupon.image_url} alt={coupon.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-center">
                          <div className="text-4xl mb-1">🎫</div>
                          <div className="text-xs text-gray-400">{coupon.discount || "优惠券"}</div>
                        </div>
                      )}
                      {coupon.discount && (
                        <div className="absolute top-2 left-2 bg-[#FE2C55] text-white text-xs font-bold px-2 py-0.5 rounded">
                          {coupon.discount}
                        </div>
                      )}
                      {soldOut && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <span className="text-white font-bold text-lg">已抢光</span>
                        </div>
                      )}
                    </div>

                    {/* 信息区 */}
                    <div className="p-3">
                      <h3 className="text-sm font-medium text-[#1A1A1A] line-clamp-2 leading-tight">{coupon.name}</h3>
                      {coupon.description && (
                        <p className="text-xs text-gray-400 mt-1 line-clamp-1">{coupon.description}</p>
                      )}
                      <div className="mt-2 flex items-end gap-1">
                        <span className="text-[#FFC107] font-bold text-lg">¥{coupon.price}</span>
                        {coupon.original_price > coupon.price && (
                          <span className="text-xs text-gray-400 line-through">¥{coupon.original_price}</span>
                        )}
                      </div>
                      {/* 进度条 */}
                      <div className="mt-2">
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[#FE2C55] to-[#FF6B35] rounded-full transition-all"
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          />
                        </div>
                        <div className="flex justify-between mt-1">
                          <span className="text-[10px] text-gray-400">已抢{progress}%</span>
                          <span className="text-[10px] text-gray-400">剩余{coupon.remaining_quantity}件</span>
                        </div>
                      </div>
                      {/* 抢购按钮 */}
                      <button
                        onClick={() => handleGrab(coupon)}
                        disabled={!canGrab || isGrabbing}
                        className={`mt-2 w-full py-2 rounded-lg text-sm font-bold transition-all ${
                          canGrab
                            ? "bg-gradient-to-r from-[#FE2C55] to-[#FF6B35] text-white hover:scale-[1.02] active:scale-[0.98]"
                            : soldOut
                            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                            : "bg-[#FE2C55]/30 text-white/60 cursor-not-allowed"
                        }`}
                      >
                        {isGrabbing ? "抢购中..." : soldOut ? "已抢光" : sessionStatus === "active" ? "立即抢购" : "未开始"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 支付密码弹窗 */}
      {showPaymentModal && grabTarget && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6">
            <h3 className="text-lg font-bold text-center mb-4">确认抢购</h3>
            <div className="bg-gray-50 rounded-xl p-4 mb-4">
              <p className="text-sm text-gray-600">{grabTarget.name}</p>
              <p className="text-xl font-bold text-[#FFC107] mt-1">¥{grabTarget.price}</p>
            </div>
            <div className="mb-4">
              <label className="text-sm text-gray-600 mb-1 block">支付密码</label>
              <input
                type="password"
                value={paymentPassword}
                onChange={(e) => setPaymentPassword(e.target.value)}
                placeholder="请输入支付密码"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#FE2C55]"
                onKeyDown={(e) => e.key === "Enter" && confirmGrab()}
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setShowPaymentModal(false); setGrabTarget(null); }}
                className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={confirmGrab}
                disabled={!paymentPassword}
                className="flex-1 py-3 bg-gradient-to-r from-[#FE2C55] to-[#FF6B35] text-white rounded-xl font-bold disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                确认支付
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 底部导航 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-100 z-40">
        <div className="max-w-5xl mx-auto flex justify-around py-2">
          <Link href="/" className="flex flex-col items-center text-[#FE2C55]">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
            </svg>
            <span className="text-[10px] mt-0.5 font-medium">首页</span>
          </Link>
          <Link href="/cart" className="flex flex-col items-center text-gray-400 hover:text-[#FE2C55]">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
            </svg>
            <span className="text-[10px] mt-0.5">购物车</span>
          </Link>
          <Link href="/profile" className="flex flex-col items-center text-gray-400 hover:text-[#FE2C55]">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-[10px] mt-0.5">我的</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
