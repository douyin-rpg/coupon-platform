"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";

interface Coupon {
  id: string;
  name: string;
  description: string;
  price: number;
  remaining_quantity: number;
  sold_count: number;
  image_url: string | null;
  session_id: string;
  is_active: boolean;
  sessions: { name: string; start_time: string; end_time: string; is_active: boolean } | null;
}

export default function CouponDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentPassword, setPaymentPassword] = useState("");
  const [grabbing, setGrabbing] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const loadCoupon = async () => {
      const res = await fetch(`/api/coupons?id=${id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.coupons && data.coupons.length > 0) setCoupon(data.coupons[0]);
      }
    };
    loadCoupon();
  }, [id]);

  const getSessionStatus = () => {
    if (!coupon?.sessions) return { status: 'ended', canGrab: false };
    const now = new Date();
    const [sh, sm] = coupon.sessions.start_time.split(':').map(Number);
    const [eh, em] = coupon.sessions.end_time.split(':').map(Number);
    const start = new Date(now); start.setHours(sh, sm, 0, 0);
    const end = new Date(now); end.setHours(eh, em, 0, 0);
    if (now >= start && now <= end && coupon.sessions.is_active) return { status: 'active', canGrab: true };
    if (now < start) return { status: 'upcoming', canGrab: false };
    return { status: 'ended', canGrab: false };
  };

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
  const sessionStatus = getSessionStatus();
  const canGrab = user?.verifyStatus === "verified" && sessionStatus.canGrab && coupon.remaining_quantity > 0;
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
                  <div className="text-6xl mb-2">🎫</div>
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

        {/* Session info */}
        {coupon.sessions && (
          <div className="bg-white mt-2 p-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">抢购场次</span>
              <span className="text-sm font-medium text-[#1A1A1A]">{coupon.sessions.name}</span>
              <span className="text-xs text-gray-400">{coupon.sessions.start_time}-{coupon.sessions.end_time}</span>
              {sessionStatus.status === 'active' && (
                <span className="text-xs bg-[#1890FF] text-white px-1.5 py-0.5 rounded animate-pulse">抢购中</span>
              )}
              {sessionStatus.status === 'upcoming' && (
                <span className="text-xs bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded">即将开始</span>
              )}
              {sessionStatus.status === 'ended' && (
                <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">已结束</span>
              )}
            </div>
          </div>
        )}

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
              className="px-8 py-3 bg-gradient-to-r from-[#1890FF] to-[#00D4FF] text-white font-bold rounded-xl">
              登录抢购
            </button>
          ) : user.verifyStatus !== "verified" ? (
            <button onClick={() => router.push("/profile/settings/verify")}
              className="px-8 py-3 border border-[#1890FF] text-[#1890FF] font-bold rounded-xl">
              去认证
            </button>
          ) : (
            <button
              onClick={() => setShowPaymentModal(true)}
              disabled={!canGrab}
              className="px-8 py-3 bg-gradient-to-r from-[#1890FF] to-[#00D4FF] text-white font-bold rounded-xl disabled:opacity-50 active:scale-[0.97] transition-all"
            >
              {coupon.remaining_quantity <= 0 ? "已抢光" : sessionStatus.status !== 'active' ? "非抢购时间" : "立即抢购"}
            </button>
          )}
        </div>
      </div>

      {/* Payment modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => { setShowPaymentModal(false); setPaymentPassword(""); }}>
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <h3 className="text-lg font-bold text-center mb-4">确认抢购</h3>
              <div className="bg-blue-50 rounded-xl p-4 mb-4">
                <p className="text-sm text-gray-600">{coupon.name}</p>
                <p className="text-2xl font-bold text-[#1890FF] mt-1">¥{formatPrice(coupon.price)}</p>
                {user && <p className="text-xs text-gray-500 mt-1">当前余额：¥{Number(user.balance || 0).toLocaleString('zh-CN')}</p>}
              </div>
              <div className="mb-4">
                <label className="text-sm text-gray-600 mb-1 block">支付密码</label>
                <input type="password" value={paymentPassword} onChange={(e) => setPaymentPassword(e.target.value)} placeholder="请输入6位支付密码" maxLength={6} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1890FF] text-center text-lg tracking-[0.5em]" onKeyDown={(e) => e.key === "Enter" && handleGrab()} />
              </div>
              <div className="flex gap-3">
                <button onClick={() => { setShowPaymentModal(false); setPaymentPassword(""); }} className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-600">取消</button>
                <button onClick={handleGrab} disabled={grabbing || paymentPassword.length !== 6} className="flex-1 py-3 bg-gradient-to-r from-[#1890FF] to-[#00D4FF] text-white rounded-xl font-bold disabled:opacity-50">{grabbing ? "支付中..." : "确认支付"}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
