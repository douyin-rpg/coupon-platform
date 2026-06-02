"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";

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
  const { user } = useAuth();
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentPassword, setPaymentPassword] = useState("");
  const [grabbing, setGrabbing] = useState(false);
  const [msg, setMsg] = useState("");

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
        setMsg("抢券成功！");
        setTimeout(() => router.push("/profile/order"), 1500);
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

  if (!coupon) return <div className="min-h-screen flex items-center justify-center text-gray-400">加载中...</div>;

  const progress = coupon.remaining_quantity + coupon.sold_count > 0
    ? Math.round((coupon.sold_count / (coupon.remaining_quantity + coupon.sold_count)) * 100) : 0;
  const formatPrice = (price: number) => price.toLocaleString('zh-CN');

  return (
    <div className="min-h-screen bg-[#F5F7FA] pb-24">
      {/* Top nav */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => router.back()} className="text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="font-bold text-[#1A1A1A]">商品详情</span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto">
        {/* Product image */}
        <div className="bg-white">
          <div className="aspect-square max-h-96 bg-gray-100">
            {coupon.image_url ? (
              <img src={coupon.image_url} alt={coupon.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-50">
                <div className="text-center">
                  <svg className="w-16 h-16 mx-auto mb-2 text-[#1890FF]" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M3 9h18" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M9 5v4" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                  <div className="text-gray-400">优惠券</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Price strip */}
        <div className="bg-gradient-to-r from-[#1890FF] to-[#00D4FF] p-5 text-white">
          <div className="flex items-end gap-2">
            <span className="text-sm">面值</span>
            <span className="text-3xl font-bold">¥{formatPrice(coupon.price)}</span>
          </div>
          <p className="text-sm mt-1.5 opacity-80">需支付 ¥{formatPrice(coupon.price)}，回收后返还金额+5%奖励</p>
        </div>

        {/* Product name */}
        <div className="bg-white mt-2 p-4">
          <h1 className="text-lg font-bold text-[#1A1A1A]">{coupon.name}</h1>
          {coupon.description && <p className="text-sm text-gray-500 mt-2">{coupon.description}</p>}
        </div>

        {/* Stock progress */}
        <div className="bg-white mt-2 p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">库存进度</span>
            <span className="text-[#1890FF] font-bold">已抢{progress}%</span>
          </div>
          <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#1890FF] to-[#00D4FF] rounded-full transition-all" style={{ width: `${Math.min(progress, 100)}%` }} />
          </div>
          <div className="flex justify-between mt-1 text-xs text-gray-400">
            <span>已售 {coupon.sold_count}</span>
            <span>剩余 {coupon.remaining_quantity}</span>
          </div>
        </div>

        {/* Session info - show all sessions */}
        <div className="bg-white mt-2 p-4">
          <div className="text-sm text-gray-500 mb-3">抢购场次</div>
          <div className="space-y-2">
            {sessions.map((s) => {
              const now = new Date();
              const currentMinutes = now.getHours() * 60 + now.getMinutes();
              const [sh, sm] = s.start_time.split(":").map(Number);
              const [eh, em] = s.end_time.split(":").map(Number);
              const isActive = currentMinutes >= sh * 60 + sm && currentMinutes <= eh * 60 + em && s.is_active;
              const isUpcoming = currentMinutes < sh * 60 + sm && s.is_active;

              return (
                <div key={s.id} className={`flex items-center justify-between p-2.5 rounded-xl ${isActive ? 'bg-blue-50 border border-blue-200' : isUpcoming ? 'bg-amber-50 border border-amber-200' : 'bg-gray-50'}`}>
                  <div className="flex items-center gap-2">
                    <svg className={`w-4 h-4 ${isActive ? 'text-[#1890FF]' : 'text-gray-400'}`} viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
                      <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                    <span className={`text-sm font-medium ${isActive ? 'text-[#1890FF]' : 'text-gray-700'}`}>{s.name}</span>
                    <span className="text-xs text-gray-400">{s.start_time}-{s.end_time}</span>
                  </div>
                  {isActive && (
                    <span className="text-xs bg-[#1890FF] text-white px-2 py-0.5 rounded-full animate-pulse">抢购中</span>
                  )}
                  {isUpcoming && (
                    <span className="text-xs bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full">即将开始</span>
                  )}
                  {!isActive && !isUpcoming && (
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">已结束</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Message */}
        {msg && (
          <div className="mx-4 mt-3 p-3 rounded-xl bg-white border text-sm text-center">
            <span className={msg.includes("成功") ? "text-green-600" : "text-[#1890FF]"}>{msg}</span>
          </div>
        )}
      </div>

      {/* Bottom action bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-40 p-4">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <div className="flex-1">
            <span className="text-xs text-gray-400">需支付</span>
            <div className="text-xl font-bold text-[#1890FF]">¥{formatPrice(coupon.price)}</div>
          </div>
          {!user ? (
            <button onClick={() => router.push("/login")}
              className="px-8 py-3 bg-gradient-to-r from-[#1890FF] to-[#00D4FF] text-white font-bold rounded-xl active:scale-[0.97] transition-all">
              登录抢购
            </button>
          ) : user.verifyStatus !== "verified" ? (
            <button onClick={() => router.push("/profile/settings/verify")}
              className="px-8 py-3 border border-[#1890FF] text-[#1890FF] font-bold rounded-xl active:scale-[0.97] transition-all">
              去认证
            </button>
          ) : coupon.remaining_quantity <= 0 ? (
            <button disabled className="px-8 py-3 bg-gray-300 text-white font-bold rounded-xl">
              已抢光
            </button>
          ) : !activeSession ? (
            <div className="text-right">
              <button disabled className="px-8 py-3 bg-gray-300 text-white font-bold rounded-xl">
                非抢购时间
              </button>
              {nextSession && (
                <div className="text-xs text-gray-400 mt-1">{nextSession.name} {nextSession.start_time}开始</div>
              )}
            </div>
          ) : (
            <button
              onClick={() => setShowPaymentModal(true)}
              className="px-8 py-3 bg-gradient-to-r from-[#1890FF] to-[#00D4FF] text-white font-bold rounded-xl active:scale-[0.97] transition-all shadow-lg shadow-blue-200"
            >
              立即抢购
            </button>
          )}
        </div>
      </div>

      {/* Payment modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center">
          <div className="bg-white w-full md:max-w-md md:rounded-2xl rounded-t-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[#1A1A1A]">确认抢购</h3>
              <button onClick={() => { setShowPaymentModal(false); setPaymentPassword(""); }} className="text-gray-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="bg-blue-50 rounded-xl p-4 mb-4">
              <div className="text-sm text-gray-500">商品</div>
              <div className="font-medium text-[#1A1A1A]">{coupon.name}</div>
              <div className="flex items-end gap-1 mt-2">
                <span className="text-sm text-gray-500">支付金额</span>
                <span className="text-2xl font-bold text-[#1890FF]">¥{formatPrice(coupon.price)}</span>
              </div>
              {activeSession && (
                <div className="text-xs text-gray-400 mt-1">当前场次: {activeSession.name} ({activeSession.start_time}-{activeSession.end_time})</div>
              )}
            </div>

            <div className="mb-4">
              <label className="text-sm text-gray-500 mb-1 block">支付密码</label>
              <input
                type="password"
                maxLength={6}
                value={paymentPassword}
                onChange={(e) => setPaymentPassword(e.target.value.replace(/\D/g, ""))}
                placeholder="请输入6位支付密码"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-center text-xl tracking-[0.5em] focus:border-[#1890FF] focus:ring-1 focus:ring-[#1890FF] outline-none"
              />
            </div>

            <button
              onClick={handleGrab}
              disabled={grabbing || !paymentPassword}
              className="w-full py-3 bg-gradient-to-r from-[#1890FF] to-[#00D4FF] text-white font-bold rounded-xl disabled:opacity-50 active:scale-[0.97] transition-all"
            >
              {grabbing ? "抢购中..." : "确认支付"}
            </button>

            <p className="text-xs text-gray-400 text-center mt-3">支付后可申请回收，回收通过后返还金额+5%奖励</p>
          </div>
        </div>
      )}
    </div>
  );
}
