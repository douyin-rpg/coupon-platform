"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface CartItem {
  id: string;
  coupon_id: string;
  quantity: number;
  coupons: {
    id: string;
    name: string;
    price: number;
    original_price: number;
    remaining_quantity: number;
    image_url: string | null;
    discount: string;
  };
}

export default function CartPage() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    try {
      const res = await fetch("/api/user/cart");
      if (res.ok) {
        const data = await res.json();
        setCartItems(data.items || []);
      }
    } catch {}
    setLoading(false);
  };

  const removeFromCart = async (itemId: string) => {
    try {
      const res = await fetch("/api/user/cart", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId }),
      });
      if (res.ok) loadCart();
    } catch {}
  };

  const totalPrice = cartItems.reduce((sum, item) => sum + item.coupons.price * item.quantity, 0);

  return (
    <div className="min-h-screen bg-[#F5F5F5] pb-24">
      {/* 顶部 */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="text-gray-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="font-bold text-[#1A1A1A]">购物车</span>
            <span className="text-xs text-gray-400">({cartItems.length})</span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 mt-4">
        {loading ? (
          <div className="text-center text-gray-400 py-12">加载中...</div>
        ) : cartItems.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center">
            <div className="text-5xl mb-3">🛒</div>
            <p className="text-gray-400 mb-4">购物车空空如也</p>
            <Link href="/" className="text-[#FE2C55] font-medium text-sm">去抢券 →</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {cartItems.map((item) => (
              <div key={item.id} className="bg-white rounded-2xl shadow-sm p-4 flex gap-3">
                <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-[#FFF0F0] to-[#FFF8F0] flex items-center justify-center flex-shrink-0">
                  {item.coupons.image_url ? (
                    <img src={item.coupons.image_url} alt={item.coupons.name} className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    <span className="text-2xl">🎫</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-[#1A1A1A] line-clamp-2">{item.coupons.name}</h4>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-[#FFC107] font-bold">¥{item.coupons.price}</span>
                    {item.coupons.original_price > item.coupons.price && (
                      <span className="text-xs text-gray-400 line-through">¥{item.coupons.original_price}</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-400">x{item.quantity}</span>
                    <button onClick={() => removeFromCart(item.id)} className="text-xs text-red-400 hover:text-red-600">删除</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 底部结算栏 */}
      {cartItems.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-40 p-4">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <div>
              <span className="text-xs text-gray-400">合计</span>
              <span className="text-xl font-bold text-[#FE2C55] ml-2">¥{totalPrice.toFixed(2)}</span>
            </div>
            <Link href="/" className="px-8 py-3 bg-gradient-to-r from-[#FE2C55] to-[#FF6B35] text-white font-bold rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all">
              去抢券
            </Link>
          </div>
        </div>
      )}

      {/* 底部导航 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-100 z-30">
        <div className="max-w-5xl mx-auto flex justify-around py-2">
          <Link href="/" className="flex flex-col items-center text-gray-400 hover:text-[#FE2C55]">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="text-[10px] mt-0.5">首页</span>
          </Link>
          <Link href="/cart" className="flex flex-col items-center text-[#FE2C55]">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49A1.003 1.003 0 0020 4H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z" />
            </svg>
            <span className="text-[10px] mt-0.5 font-medium">购物车</span>
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
