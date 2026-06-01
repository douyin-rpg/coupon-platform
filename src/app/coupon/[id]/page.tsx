"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";

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
  is_active: boolean;
  sessions: { name: string; start_time: string; end_time: string } | null;
}

interface User {
  id: string;
  username: string;
  verifyStatus: string;
  bankBound: boolean;
  balance: number;
}

export default function CouponDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentPassword, setPaymentPassword] = useState("");
  const [grabbing, setGrabbing] = useState(false);
  const [msg, setMsg] = useState("");
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const loadData = async () => {
      const [couponRes, userRes] = await Promise.all([
        fetch(`/api/coupons?id=${id}`),
        fetch("/api/auth/me"),
      ]);
      if (couponRes.ok) {
        const data = await couponRes.json();
        if (data.coupons && data.coupons.length > 0) setCoupon(data.coupons[0]);
      }
      if (userRes.ok) {
        const data = await userRes.json();
        setUser(data.user);
      }
    };
    loadData();
  }, [id]);

  const handleGrab = async () => {
    if (!user) { router.push("/login"); return; }
    if (!paymentPassword) { setMsg("请输入支付密码"); return; }
    setGrabbing(true);
    try {
      const res = await fetch("/api/coupons/grab", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ couponId: id, paymentPassword, quantity }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMsg("抢券成功！");
        setTimeout(() => router.push("/profile"), 1500);
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

  return (
    <div className="min-h-screen bg-[#F5F5F5] pb-24">
      {/* 顶部导航 */}
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
        {/* 商品图片 */}
        <div className="bg-white">
          <div className="aspect-square max-h-96 bg-gradient-to-br from-[#FFF0F0] to-[#FFF8F0] flex items-center justify-center">
            {coupon.image_url ? (
              <img src={coupon.image_url} alt={coupon.name} className="w-full h-full object-cover" />
            ) : (
              <div className="text-center">
                <div className="text-6xl mb-2">🎫</div>
                <div className="text-gray-400">{coupon.discount || "优惠券"}</div>
              </div>
            )}
          </div>
        </div>

        {/* 价格信息 */}
        <div className="bg-gradient-to-r from-[#FE2C55] to-[#FF6B35] p-4 text-white">
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold">¥{coupon.price}</span>
            {coupon.original_price > coupon.price && (
              <span className="text-sm line-through opacity-70">¥{coupon.original_price}</span>
            )}
            {coupon.discount && (
              <span className="ml-auto bg-white/20 px-2 py-0.5 rounded text-xs font-bold">{coupon.discount}</span>
            )}
          </div>
        </div>

        {/* 商品名称和描述 */}
        <div className="bg-white mt-2 p-4">
          <h1 className="text-lg font-bold text-[#1A1A1A]">{coupon.name}</h1>
          {coupon.description && <p className="text-sm text-gray-500 mt-2">{coupon.description}</p>}
        </div>

        {/* 库存和进度 */}
        <div className="bg-white mt-2 p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">库存进度</span>
            <span className="text-[#FE2C55] font-bold">已抢{progress}%</span>
          </div>
          <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#FE2C55] to-[#FF6B35] rounded-full transition-all" style={{ width: `${Math.min(progress, 100)}%` }} />
          </div>
          <div className="flex justify-between mt-1 text-xs text-gray-400">
            <span>已售 {coupon.sold_count}</span>
            <span>剩余 {coupon.remaining_quantity}</span>
          </div>
        </div>

        {/* 场次信息 */}
        {coupon.sessions && (
          <div className="bg-white mt-2 p-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">抢购场次</span>
              <span className="text-sm font-medium text-[#1A1A1A]">{coupon.sessions.name}</span>
              <span className="text-xs text-gray-400">{coupon.sessions.start_time}-{coupon.sessions.end_time}</span>
            </div>
          </div>
        )}

        {/* 数量选择 */}
        <div className="bg-white mt-2 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">购买数量</span>
            <div className="flex items-center gap-3">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500">-</button>
              <span className="text-sm font-bold w-6 text-center">{quantity}</span>
              <button onClick={() => setQuantity(Math.min(coupon.remaining_quantity, quantity + 1))} className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500">+</button>
            </div>
          </div>
        </div>

        {/* 消息提示 */}
        {msg && (
          <div className="mx-4 mt-3 p-3 rounded-xl bg-white border text-sm text-center">
            <span className={msg.includes("成功") ? "text-green-600" : "text-[#FE2C55]"}>{msg}</span>
          </div>
        )}
      </div>

      {/* 底部购买栏 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-40 p-4">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <div className="flex-1">
            <span className="text-xs text-gray-400">合计</span>
            <div className="text-xl font-bold text-[#FE2C55]">¥{(coupon.price * quantity).toFixed(2)}</div>
          </div>
          <button
            onClick={() => {
              if (!user) { router.push("/login"); return; }
              if (user.verifyStatus !== "verified") { setMsg("请先完成实名认证"); return; }
              setShowPaymentModal(true);
            }}
            disabled={coupon.remaining_quantity <= 0}
            className="px-8 py-3 bg-gradient-to-r from-[#FE2C55] to-[#FF6B35] text-white font-bold rounded-xl disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            {coupon.remaining_quantity <= 0 ? "已抢光" : "立即抢购"}
          </button>
        </div>
      </div>

      {/* 支付弹窗 */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6">
            <h3 className="text-lg font-bold text-center mb-4">确认抢购</h3>
            <div className="bg-gray-50 rounded-xl p-4 mb-4">
              <p className="text-sm text-gray-600">{coupon.name} x{quantity}</p>
              <p className="text-xl font-bold text-[#FFC107] mt-1">¥{(coupon.price * quantity).toFixed(2)}</p>
            </div>
            <div className="mb-4">
              <label className="text-sm text-gray-600 mb-1 block">支付密码</label>
              <input type="password" value={paymentPassword} onChange={(e) => setPaymentPassword(e.target.value)} placeholder="请输入支付密码" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#FE2C55]" onKeyDown={(e) => e.key === "Enter" && handleGrab()} />
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setShowPaymentModal(false); setPaymentPassword(""); }} className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-600">取消</button>
              <button onClick={handleGrab} disabled={grabbing || !paymentPassword} className="flex-1 py-3 bg-gradient-to-r from-[#FE2C55] to-[#FF6B35] text-white rounded-xl font-bold disabled:opacity-50">{grabbing ? "支付中..." : "确认支付"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
