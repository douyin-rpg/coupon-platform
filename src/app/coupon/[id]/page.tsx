"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { ArrowLeftIcon, CheckCircleIcon, ChevronRightIcon, ClockIcon, CouponIcon, CreditCardIcon, FlashIcon, InfoIcon, LockIcon, ShieldIcon, ShoppingCartIcon, XIcon } from '@/components/icons';
import BottomNav from "@/components/bottom-nav";
import Footer from "@/components/footer";

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
  remaining_quantity: number;
  sold_count: number;
  image_url: string | null;
  session_id: string | null;
  is_active: boolean;
}

export default function CouponDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentPassword, setPaymentPassword] = useState("");
  const [grabbing, setGrabbing] = useState(false);
  const [msg, setMsg] = useState("");
  const [grabSuccess, setGrabSuccess] = useState(false);
  const [cartAdding, setCartAdding] = useState(false);
  const [cartAdded, setCartAdded] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const [couponRes, sessionRes] = await Promise.all([
        fetch(`/api/coupons?id=${id}`),
        fetch(`/api/sessions`),
      ]);
      if (couponRes.ok) {
        const data = await couponRes.json();
        if (data.coupons && data.coupons.length > 0) setCoupon(data.coupons[0]);
      }
      if (sessionRes.ok) {
        const data = await sessionRes.json();
        setSessions(data.sessions || []);
      }
    };
    loadData();
  }, [id]);

  const getActiveSession = (): Session | null => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    for (const s of sessions) {
      if (!s.is_active) continue;
      const [sh, sm] = s.start_time.split(":").map(Number);
      const [eh, em] = s.end_time.split(":").map(Number);
      if (currentMinutes >= sh * 60 + sm && currentMinutes <= eh * 60 + em) {
        return s;
      }
    }
    return null;
  };

  const getNextSession = (): Session | null => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    let next: Session | null = null;
    let minDiff = Infinity;
    for (const s of sessions) {
      if (!s.is_active) continue;
      const [sh, sm] = s.start_time.split(":").map(Number);
      const startMinutes = sh * 60 + sm;
      if (startMinutes > currentMinutes && startMinutes - currentMinutes < minDiff) {
        minDiff = startMinutes - currentMinutes;
        next = s;
      }
    }
    return next;
  };

  const activeSession = getActiveSession();
  const nextSession = getNextSession();
  const canGrab = user?.verifyStatus === "verified" && !!activeSession && (coupon?.remaining_quantity ?? 0) > 0;

  const handleGrab = async () => {
    if (!user) { router.push("/login"); return; }
    if (!paymentPassword) { setMsg("请输入支付密码"); return; }
    setGrabbing(true);
    try {
      const res = await fetch("/api/coupons/grab", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ couponId: id, paymentPassword }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setGrabSuccess(true);
        setMsg("抢券成功！");
        refreshUser();
      } else {
        setMsg(data.error || "抢券失败");
      }
    } catch {
      setMsg("网络错误");
    }
    setGrabbing(false);
    setShowPaymentModal(false);
    setPaymentPassword("");
  };

  const handleAddToCart = async () => {
    if (!user) { router.push("/login"); return; }
    setCartAdding(true);
    try {
      const res = await fetch("/api/user/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ couponId: id, quantity: 1 }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCartAdded(true);
        setTimeout(() => setCartAdded(false), 2000);
      } else {
        setMsg(data.error || "加入购物车失败");
      }
    } catch {
      setMsg("网络错误");
    }
    setCartAdding(false);
  };

  if (!coupon) return <div className="min-h-screen flex items-center justify-center text-gray-400">加载中...</div>;

  const progress = coupon.remaining_quantity + coupon.sold_count > 0
    ? Math.round((coupon.sold_count / (coupon.remaining_quantity + coupon.sold_count)) * 100) : 0;
  const formatPrice = (price: number) => price.toLocaleString('zh-CN');

  return (
    <div className="min-h-screen bg-[#F5F7FA] pb-24 md:pb-0">
      {/* Top nav */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => router.back()} className="text-gray-600 hover:text-gray-800 transition-colors">
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <span className="font-bold text-[#1A1A1A]">商品详情</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-4 md:py-6">
        {/* Desktop: Two column layout */}
        <div className="md:flex md:gap-8">
          {/* Left: Product image */}
          <div className="md:w-1/2 md:flex-shrink-0">
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
              <div className="aspect-square bg-gray-100 relative overflow-hidden">
                {coupon.image_url ? (
                  <img src={coupon.image_url} alt={coupon.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#1890FF]/10 to-[#00D4FF]/10">
                    <div className="text-center">
                      <CouponIcon className="w-20 h-20 mx-auto mb-3" />
                      <div className="text-gray-400 text-sm">优惠券</div>
                    </div>
                  </div>
                )}
                <div className="absolute top-3 right-3 bg-[#FE2C55]/90 text-white text-[10px] px-2.5 py-1 rounded-full font-medium backdrop-blur-sm">
                    已抢999+
                  </div>
              </div>
            </div>
          </div>

          {/* Right: Product info */}
          <div className="md:w-1/2 mt-4 md:mt-0 space-y-3">
            {/* Price strip */}
            <div className="bg-gradient-to-r from-[#1890FF] to-[#00D4FF] p-5 md:p-6 text-white rounded-2xl relative overflow-hidden shadow-sm">
              <div className="absolute right-0 top-0 w-24 h-24 rounded-full bg-white/10 -mr-8 -mt-8" />
              <div className="absolute right-8 bottom-0 w-16 h-16 rounded-full bg-white/5 -mb-4" />
              <div className="relative z-10">
                <div className="flex items-end gap-2">
                  <span className="text-sm opacity-80">面值</span>
                  <span className="text-3xl md:text-4xl font-bold tabular-nums">¥{formatPrice(coupon.price)}</span>
                </div>
                <p className="text-sm mt-1.5 opacity-80">需支付 ¥{formatPrice(coupon.price)}</p>
              </div>
            </div>

            {/* Product name */}
            <div className="bg-white p-4 md:p-5 rounded-2xl shadow-sm">
              <h1 className="text-lg md:text-xl font-bold text-[#1A1A1A]">{coupon.name}</h1>
              {coupon.description && <p className="text-sm text-gray-500 mt-2">{coupon.description}</p>}
            </div>

            {/* Stock progress */}
            <div className="bg-white p-4 md:p-5 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 flex items-center gap-1.5">
                  <FlashIcon className="w-4 h-4 text-[#FE2C55]" />
                  库存进度
                </span>
                <span className="text-[#FE2C55] font-bold">已抢999+</span>
              </div>
              <div className="mt-2 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#FE2C55] to-[#FF6B35] rounded-full transition-all duration-500" style={{ width: `${Math.min(progress, 100)}%` }} />
              </div>
              <div className="flex justify-between mt-1.5 text-xs text-gray-400"><span className="text-[#FE2C55] font-medium">已抢999+</span><span>限量发售</span></div>
            </div>

            {/* Session info */}
            <div className="bg-white p-4 md:p-5 rounded-2xl shadow-sm">
              <div className="text-sm text-gray-500 mb-3 flex items-center gap-1.5">
                <InfoIcon className="w-4 h-4 text-[#1890FF]" />
                抢购场次
              </div>
              <div className="space-y-2">
                {sessions.map((s) => {
                  const now = new Date();
                  const currentMinutes = now.getHours() * 60 + now.getMinutes();
                  const [sh, sm] = s.start_time.split(":").map(Number);
                  const [eh, em] = s.end_time.split(":").map(Number);
                  const isActive = currentMinutes >= sh * 60 + sm && currentMinutes <= eh * 60 + em && s.is_active;
                  const isUpcoming = currentMinutes < sh * 60 + sm && s.is_active;

                  return (
                    <div key={s.id} className={`flex items-center justify-between p-3 rounded-xl transition-all ${isActive ? 'bg-blue-50 border-2 border-[#1890FF]/30 shadow-sm' : isUpcoming ? 'bg-amber-50/80 border border-amber-200/50' : 'bg-gray-50/50'}`}>
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isActive ? 'bg-[#1890FF] text-white' : 'bg-gray-200 text-gray-400'}`}>
                          <ClockIcon className="w-4 h-4" />
                        </div>
                        <div>
                          <span className={`text-sm font-medium ${isActive ? 'text-[#1890FF]' : 'text-gray-700'}`}>{s.name}</span>
                          <span className="text-xs text-gray-400 ml-2">{s.start_time}-{s.end_time}</span>
                        </div>
                      </div>
                      {isActive && (
                        <span className="text-xs bg-[#FE2C55] text-white px-2.5 py-1 rounded-full animate-pulse font-medium">抢购中</span>
                      )}
                      {isUpcoming && (
                        <span className="text-xs bg-amber-100 text-amber-600 px-2.5 py-1 rounded-full font-medium">即将开始</span>
                      )}
                      {!isActive && !isUpcoming && (
                        <span className="text-xs bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full">已结束</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Success message */}
            {grabSuccess && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 text-center">
                <CheckCircleIcon className="w-12 h-12 mx-auto mb-2 text-green-500" />
                <p className="text-green-700 font-bold text-lg">抢券成功！</p>
                <p className="text-green-600 text-sm mt-1">请前往订单查看详情</p>
                <button onClick={() => router.push('/profile/order')}
                  className="mt-3 px-6 py-2 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 transition-colors">
                  查看订单
                </button>
              </div>
            )}

            {/* Error/info message */}
            {msg && !grabSuccess && (
              <div className="p-3 rounded-xl bg-white border text-sm text-center shadow-sm">
                <span className={msg.includes("成功") ? "text-green-600" : "text-[#FE2C55]"}>{msg}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom action bar - mobile fixed, desktop inline */}
      <div className="fixed bottom-0 left-0 right-0 md:relative md:bottom-auto bg-white border-t border-gray-100 z-40 p-4 md:mt-4 md:rounded-2xl md:shadow-sm md:border md:border-gray-100">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <div className="flex-1">
            <span className="text-xs text-gray-400">需支付</span>
            <div className="text-xl font-bold text-[#1890FF] tabular-nums">¥{formatPrice(coupon.price)}</div>
          </div>
          {!user ? (
            <button onClick={() => router.push("/login")}
              className="px-8 py-3 bg-gradient-to-r from-[#1890FF] to-[#00D4FF] text-white font-bold rounded-xl active:scale-[0.97] transition-all shadow-lg shadow-blue-200/50">
              登录抢购
            </button>
          ) : user.verifyStatus !== "verified" ? (
            <button onClick={() => router.push("/profile/settings/verify")}
              className="px-8 py-3 border-2 border-[#1890FF] text-[#1890FF] font-bold rounded-xl active:scale-[0.97] transition-all">
              去认证
            </button>
          ) : grabSuccess ? (
            <button onClick={() => router.push('/profile/order')}
              className="px-8 py-3 bg-green-600 text-white font-bold rounded-xl active:scale-[0.97] transition-all">
              查看订单
            </button>
          ) : coupon.remaining_quantity <= 0 ? (
            <button disabled className="px-8 py-3 bg-gray-300 text-white font-bold rounded-xl cursor-not-allowed">
              已抢光
            </button>
          ) : !activeSession ? (
            <div className="text-right">
              <button disabled className="px-8 py-3 bg-gray-300 text-white font-bold rounded-xl cursor-not-allowed">
                非抢购时间
              </button>
              {nextSession && (
                <div className="text-xs text-gray-400 mt-1">{nextSession.name} {nextSession.start_time}开始</div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={handleAddToCart}
                disabled={cartAdding || cartAdded}
                className={`px-4 py-3 border-2 rounded-xl font-bold transition-all active:scale-[0.97] ${
                  cartAdded
                    ? 'border-green-500 text-green-600 bg-green-50'
                    : 'border-[#1890FF] text-[#1890FF] hover:bg-[#1890FF]/5'
                }`}
              >
                {cartAdding ? '加入中...' : cartAdded ? '已加入' : '加入购物车'}
              </button>
              <button
                onClick={() => setShowPaymentModal(true)}
                className="px-8 py-3 bg-gradient-to-r from-[#FE2C55] to-[#FF6B35] text-white font-bold rounded-xl active:scale-[0.97] transition-all shadow-lg shadow-red-200/50"
              >
                立即抢购
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Payment modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center" onClick={() => { setShowPaymentModal(false); setPaymentPassword(""); }}>
          <div className="bg-white w-full md:max-w-md md:rounded-2xl rounded-t-2xl p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[#1A1A1A]">确认抢购</h3>
              <button onClick={() => { setShowPaymentModal(false); setPaymentPassword(""); }} className="text-gray-400 hover:text-gray-600 transition-colors">
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-gradient-to-r from-[#1890FF]/5 to-[#00D4FF]/5 rounded-xl p-4 mb-4 border border-[#1890FF]/10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#1890FF]/10 to-[#00D4FF]/10 flex items-center justify-center">
                  <CreditCardIcon className="w-6 h-6 text-[#1890FF]" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-[#1A1A1A] text-sm">{coupon.name}</div>
                  <div className="text-xs text-gray-400 mt-0.5">面值 ¥{formatPrice(coupon.price)}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-400">支付金额</div>
                  <div className="text-xl font-bold text-[#1890FF] tabular-nums">¥{formatPrice(coupon.price)}</div>
                </div>
              </div>
              {activeSession && (
                <div className="text-xs text-gray-400 mt-2 pt-2 border-t border-[#1890FF]/10">
                  当前场次：{activeSession.name} ({activeSession.start_time}-{activeSession.end_time})
                </div>
              )}
            </div>

            <div className="mb-4">
              <label className="text-sm text-gray-500 mb-2 block flex items-center gap-1">
                <LockIcon className="w-4 h-4 text-gray-400" />
                支付密码
              </label>
              <input
                type="password"
                maxLength={6}
                value={paymentPassword}
                onChange={(e) => setPaymentPassword(e.target.value.replace(/\D/g, ""))}
                placeholder="请输入6位支付密码"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-center text-xl tracking-[0.5em] focus:border-[#1890FF] focus:ring-2 focus:ring-[#1890FF]/20 outline-none transition-all"
              />
            </div>

            <button
              onClick={handleGrab}
              disabled={grabbing || !paymentPassword}
              className="w-full py-3.5 bg-gradient-to-r from-[#FE2C55] to-[#FF6B35] text-white font-bold rounded-xl disabled:opacity-50 active:scale-[0.97] transition-all shadow-lg shadow-red-200/50 disabled:shadow-none"
            >
              {grabbing ? "抢购中..." : "确认支付 ¥" + formatPrice(coupon.price)}
            </button>
          </div>
        </div>
      )}

      {/* Bottom Navigation - mobile only */}
      <Footer />
      <BottomNav active="mall" />
    </div>
  );
}
