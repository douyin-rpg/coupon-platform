"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import BottomNav from "@/components/bottom-nav";
import Footer from "@/components/footer";
import { ArrowLeftIcon, CheckCircleIcon, CheckIcon, CouponIcon, MinusIcon, PlusIcon, TrashIcon, XIcon } from '@/components/icons';

interface CartItem {
  id: string;
  coupon_id: string;
  quantity: number;
  created_at: string;
  coupon_name: string;
  coupon_price: number;
  coupon_image: string | null;
  coupon_remaining: number;
}

export default function CartPage() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [showPayModal, setShowPayModal] = useState(false);
  const [payPassword, setPayPassword] = useState("");
  const [paying, setPaying] = useState(false);
  const [payResults, setPayResults] = useState<{ name: string; success: boolean; error?: string }[]>([]);
  const [showResults, setShowResults] = useState(false);

  const loadCart = async () => {
    try {
      const res = await fetch("/api/user/cart");
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
      }
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => {
    loadCart();
  }, []);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === items.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(items.map((i) => i.id)));
  };

  const removeItem = async (id: string) => {
    try {
      await fetch("/api/user/cart", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cartItemId: id }),
      });
      setItems((prev) => prev.filter((i) => i.id !== id));
      setSelectedIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
    } catch { /* ignore */ }
  };

  const clearCart = async () => {
    try {
      await fetch("/api/user/cart", { method: "DELETE" });
      setItems([]);
      setSelectedIds(new Set());
    } catch { /* ignore */ }
  };

  const totalAmount = items.filter((i) => selectedIds.has(i.id)).reduce((sum, i) => sum + i.coupon_price * i.quantity, 0);
  const totalCount = items.filter((i) => selectedIds.has(i.id)).reduce((sum, i) => sum + i.quantity, 0);

  const handleCheckout = async () => {
    if (!payPassword) return;
    setPaying(true);
    const results: { name: string; success: boolean; error?: string }[] = [];
    const selectedItems = items.filter((i) => selectedIds.has(i.id));

    for (const item of selectedItems) {
      try {
        const res = await fetch("/api/coupons/grab", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ couponId: item.coupon_id, paymentPassword: payPassword }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          results.push({ name: item.coupon_name, success: true });
          try {
            await fetch("/api/user/cart", {
              method: "DELETE",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ cartItemId: item.id }),
            });
          } catch { /* ignore */ }
        } else {
          results.push({ name: item.coupon_name, success: false, error: data.error || "抢购失败" });
        }
      } catch {
        results.push({ name: item.coupon_name, success: false, error: "网络错误" });
      }
    }

    setPayResults(results);
    setShowResults(true);
    setShowPayModal(false);
    setPayPassword("");
    setPaying(false);
    setSelectedIds(new Set());
    refreshUser();
    loadCart();
  };

  if (!user) {
    router.push("/login");
    return null;
  }

  const formatPrice = (price: number) => price.toLocaleString("zh-CN");

  return (
    <div className="min-h-screen bg-[#F5F7FA] pb-24 md:pb-8">
      {/* Top bar */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="text-gray-600 hover:text-gray-800 md:hidden">
              <ArrowLeftIcon className="w-5 h-5" />
            </button>
            <span className="font-bold text-[#1A1A1A] text-lg">购物车</span>
            {items.length > 0 && <span className="text-xs text-gray-400">({items.length}件)</span>}
          </div>
          {items.length > 0 && (
            <button onClick={clearCart} className="text-xs text-gray-400 hover:text-[#FE2C55] transition-colors">清空</button>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-4">
        {loading ? (
          <div className="text-center py-20 text-gray-400">加载中...</div>
        ) : items.length === 0 ? (
          <div className="text-center py-20">
            <CouponIcon className="w-20 h-20 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-400 text-sm mb-4">购物车是空的</p>
            <button onClick={() => router.push("/")}
              className="px-6 py-2.5 bg-gradient-to-r from-[#1890FF] to-[#00D4FF] text-white rounded-xl text-sm font-medium active:scale-[0.97] transition-all shadow-lg shadow-blue-200/50">
              去抢券
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id}
                className={`bg-white rounded-2xl shadow-sm p-4 transition-all ${selectedIds.has(item.id) ? "ring-2 ring-[#1890FF]/30 border-[#1890FF]" : ""}`}>
                {/* Desktop: horizontal layout */}
                <div className="flex items-center gap-3 md:gap-4">
                  <button onClick={() => toggleSelect(item.id)}
                    className={`flex-shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                      selectedIds.has(item.id) ? "bg-[#1890FF] border-[#1890FF]" : "border-gray-300 bg-white"
                    }`}>
                    {selectedIds.has(item.id) && (
                      <CheckIcon className="w-3 h-3 text-white" />
                    )}
                  </button>

                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                    {item.coupon_image ? (
                      <img src={item.coupon_image} alt={item.coupon_name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#1890FF]/10 to-[#00D4FF]/10">
                        <span className="text-xs text-[#1890FF]">¥{formatPrice(item.coupon_price)}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-[#1A1A1A] truncate">{item.coupon_name}</h3>
                    <div className="text-xs text-gray-400 mt-1">剩余 {item.coupon_remaining} 件</div>
                    <div className="text-lg font-bold text-[#1890FF] mt-1 md:mt-0 tabular-nums">¥{formatPrice(item.coupon_price)}</div>
                  </div>

                  <button onClick={() => removeItem(item.id)}
                    className="flex-shrink-0 text-gray-300 hover:text-[#FE2C55] transition-colors p-1">
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom checkout bar - mobile fixed, desktop inline */}
      {items.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 md:relative md:bottom-auto bg-white border-t border-gray-100 z-40 p-4 md:mt-4 md:rounded-2xl md:shadow-sm md:border">
          <div className="max-w-6xl mx-auto flex items-center gap-3">
            <button onClick={toggleAll}
              className="flex items-center gap-2 flex-shrink-0">
              <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                selectedIds.size === items.length && items.length > 0 ? "bg-[#1890FF] border-[#1890FF]" : "border-gray-300 bg-white"
              }`}>
                {selectedIds.size === items.length && items.length > 0 && (
                  <CheckIcon className="w-3 h-3 text-white" />
                )}
              </div>
              <span className="text-sm text-gray-500">全选</span>
            </button>
            <div className="flex-1 text-right">
              <span className="text-sm text-gray-500">合计：</span>
              <span className="text-xl font-bold text-[#FE2C55] tabular-nums">¥{formatPrice(totalAmount)}</span>
              {totalCount > 1 && <span className="text-xs text-gray-400 ml-1">({totalCount}件)</span>}
            </div>
            <button
              onClick={() => { if (selectedIds.size > 0) setShowPayModal(true); }}
              disabled={selectedIds.size === 0}
              className="px-8 py-3 bg-gradient-to-r from-[#FE2C55] to-[#FF6B35] text-white font-bold rounded-xl disabled:opacity-40 active:scale-[0.97] transition-all shadow-lg shadow-red-200/50 disabled:shadow-none">
              结算{selectedIds.size > 0 ? `(${totalCount})` : ""}
            </button>
          </div>
        </div>
      )}

      {/* Payment modal */}
      {showPayModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center" onClick={() => { setShowPayModal(false); setPayPassword(""); }}>
          <div className="bg-white w-full md:max-w-md md:rounded-2xl rounded-t-2xl p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[#1A1A1A]">确认结算</h3>
              <button onClick={() => { setShowPayModal(false); setPayPassword(""); }} className="text-gray-400 hover:text-gray-600">
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-gradient-to-r from-[#1890FF]/5 to-[#00D4FF]/5 rounded-xl p-4 mb-4 border border-[#1890FF]/10">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">已选 {totalCount} 件商品</span>
                <span className="text-xl font-bold text-[#1890FF] tabular-nums">¥{formatPrice(totalAmount)}</span>
              </div>
            </div>

            <div className="mb-4">
              <label className="text-sm text-gray-500 mb-2 block">支付密码</label>
              <input
                type="password"
                maxLength={6}
                value={payPassword}
                onChange={(e) => setPayPassword(e.target.value.replace(/\D/g, ""))}
                placeholder="请输入6位支付密码"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-center text-xl tracking-[0.5em] focus:border-[#1890FF] focus:ring-2 focus:ring-[#1890FF]/20 outline-none"
              />
            </div>

            <button
              onClick={handleCheckout}
              disabled={paying || !payPassword}
              className="w-full py-3.5 bg-gradient-to-r from-[#FE2C55] to-[#FF6B35] text-white font-bold rounded-xl disabled:opacity-50 active:scale-[0.97] transition-all">
              {paying ? "支付中..." : "确认支付 ¥" + formatPrice(totalAmount)}
            </button>
          </div>
        </div>
      )}

      {/* Results modal */}
      {showResults && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={() => setShowResults(false)}>
          <div className="bg-white w-[90%] max-w-md rounded-2xl p-6 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-[#1A1A1A] mb-4">结算结果</h3>
            <div className="space-y-2">
              {payResults.map((r, i) => (
                <div key={i} className={`flex items-center justify-between p-3 rounded-xl text-sm ${
                  r.success ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
                }`}>
                  <span className="font-medium truncate flex-1">{r.name}</span>
                  <span className="ml-2 flex-shrink-0">
                    {r.success ? (
                      <CheckCircleIcon className="w-5 h-5 text-[#1890FF]" />
                    ) : (
                      <XIcon className="w-5 h-5 text-gray-300" />
                    )}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex gap-3">
              <button onClick={() => setShowResults(false)}
                className="flex-1 py-3 border border-gray-200 text-gray-600 font-medium rounded-xl active:scale-[0.97] transition-all">
                关闭
              </button>
              <button onClick={() => { setShowResults(false); router.push("/profile/order"); }}
                className="flex-1 py-3 bg-gradient-to-r from-[#1890FF] to-[#00D4FF] text-white font-bold rounded-xl active:scale-[0.97] transition-all">
                查看订单
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
      <BottomNav active="cart" />
    </div>
  );
}
