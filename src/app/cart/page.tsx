'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import BottomNav from '@/components/bottom-nav';

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
    description: string;
  };
}

export default function CartPage() {
  const { user, refreshUser } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showPayModal, setShowPayModal] = useState(false);
  const [payPassword, setPayPassword] = useState('');
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState('');
  const [paySuccess, setPaySuccess] = useState(false);
  const [successOrders, setSuccessOrders] = useState<string[]>([]);

  const loadCart = useCallback(async () => {
    try {
      const res = await fetch('/api/user/cart');
      if (res.ok) {
        const data = await res.json();
        setCartItems(data.items || []);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { loadCart(); }, [loadCart]);

  const removeFromCart = async (itemId: string) => {
    try {
      const res = await fetch(`/api/user/cart?id=${itemId}`, { method: 'DELETE' });
      if (res.ok) {
        setCartItems(prev => prev.filter(i => i.id !== itemId));
        setSelectedIds(prev => { const next = new Set(prev); next.delete(itemId); return next; });
      }
    } catch { /* ignore */ }
  };

  const clearCart = async () => {
    try {
      for (const item of cartItems) {
        await fetch(`/api/user/cart?id=${item.id}`, { method: 'DELETE' });
      }
      setCartItems([]);
      setSelectedIds(new Set());
    } catch { /* ignore */ }
  };

  const toggleSelect = (itemId: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === cartItems.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(cartItems.map(i => i.id)));
    }
  };

  const selectedItems = cartItems.filter(i => selectedIds.has(i.id));
  const totalPrice = selectedItems.reduce((sum, item) => sum + item.coupons.price * item.quantity, 0);

  // Batch checkout
  const handleCheckout = async () => {
    if (!payPassword) { setPayError('请输入支付密码'); return; }
    if (selectedItems.length === 0) return;
    setPaying(true);
    setPayError('');

    try {
      // Grab each selected coupon sequentially
      const results: string[] = [];
      const errors: string[] = [];
      
      for (const item of selectedItems) {
        const res = await fetch('/api/coupons/grab', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            couponId: item.coupon_id,
            paymentPassword: payPassword,
          }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          results.push(item.coupons.name);
          // Remove from cart after successful grab
          await fetch(`/api/user/cart?id=${item.id}`, { method: 'DELETE' });
        } else {
          errors.push(`${item.coupons.name}: ${data.error || '抢购失败'}`);
        }
      }

      if (results.length > 0) {
        setSuccessOrders(results);
        setPaySuccess(true);
        // Update cart
        setCartItems(prev => prev.filter(i => !selectedIds.has(i.id)));
        setSelectedIds(new Set());
        refreshUser();
      }

      if (errors.length > 0 && results.length === 0) {
        setPayError(errors.join('\n'));
      } else if (errors.length > 0) {
        setPayError(`部分抢购失败：${errors.join('; ')}`);
      }
    } catch {
      setPayError('网络错误');
    } finally {
      setPaying(false);
      setPayPassword('');
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-bold text-[#1A1A1A] text-lg">购物车</span>
            <span className="text-xs text-gray-400">({cartItems.length}件)</span>
          </div>
          {cartItems.length > 0 && (
            <button onClick={clearCart} className="text-xs text-gray-400 hover:text-red-500 transition-colors">
              清空
            </button>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 mt-3">
        {loading ? (
          <div className="text-center text-gray-400 py-16">加载中...</div>
        ) : !user ? (
          <div className="bg-white rounded-2xl p-12 text-center">
            <svg className="w-16 h-16 mx-auto mb-3 text-gray-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="7" r="4" />
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
            </svg>
            <p className="text-gray-400 mb-4">请先登录</p>
            <Link href="/login" className="text-[#1890FF] font-medium text-sm">去登录 →</Link>
          </div>
        ) : cartItems.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center">
            <svg className="w-16 h-16 mx-auto mb-3 text-gray-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p className="text-gray-400 mb-4">购物车空空如也</p>
            <Link href="/" className="text-[#1890FF] font-medium text-sm">去抢券 →</Link>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Select all */}
            <div className="bg-white rounded-t-2xl px-4 py-2.5 flex items-center gap-3 border-b border-gray-50">
              <button onClick={toggleSelectAll} className="flex items-center gap-2">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${selectedIds.size === cartItems.length ? 'bg-[#1890FF] border-[#1890FF]' : 'border-gray-300'}`}>
                  {selectedIds.size === cartItems.length && (
                    <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <path d="M5 12l5 5L20 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <span className="text-sm text-gray-600">全选</span>
              </button>
              <span className="text-xs text-gray-400 ml-auto">已选 {selectedIds.size}/{cartItems.length} 件</span>
            </div>

            {/* Cart items */}
            {cartItems.map((item) => {
              const isSelected = selectedIds.has(item.id);
              return (
                <div key={item.id} className={`bg-white p-4 flex gap-3 transition-colors ${isSelected ? 'bg-blue-50/30' : ''}`}>
                  {/* Checkbox */}
                  <button onClick={() => toggleSelect(item.id)} className="flex-shrink-0 mt-4">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-[#1890FF] border-[#1890FF]' : 'border-gray-300'}`}>
                      {isSelected && (
                        <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <path d="M5 12l5 5L20 7" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                  </button>

                  {/* Image */}
                  <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {item.coupons.image_url ? (
                      <img src={item.coupons.image_url} alt={item.coupons.name} className="w-full h-full object-cover rounded-xl" />
                    ) : (
                      <svg className="w-10 h-10 text-[#1890FF]" viewBox="0 0 24 24" fill="none">
                        <rect x="2" y="4" width="20" height="16" rx="3" stroke="currentColor" strokeWidth="1.5" />
                        <path d="M2 10H22" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2" />
                        <text x="12" y="17" textAnchor="middle" fill="currentColor" fontSize="5" fontWeight="bold">¥</text>
                      </svg>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-[#1A1A1A] line-clamp-2">{item.coupons.name}</h4>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-[#FF6B35] font-bold">¥{item.coupons.price.toLocaleString('zh-CN')}</span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-400">剩余 {item.coupons.remaining_quantity} 件</span>
                      <button onClick={() => removeFromCart(item.id)} className="text-xs text-gray-400 hover:text-red-500 transition-colors">
                        删除
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Bottom spacer for checkout bar */}
            <div className="h-20" />
          </div>
        )}
      </div>

      {/* Checkout bar */}
      {cartItems.length > 0 && (
        <div className="fixed bottom-14 left-0 right-0 md:bottom-0 bg-white border-t border-gray-100 z-40 px-4 py-3">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <div>
              <span className="text-xs text-gray-400">合计 ({selectedIds.size}件)</span>
              <div className="text-xl font-bold text-[#FF6B35] tabular-nums">¥{totalPrice.toLocaleString('zh-CN')}</div>
            </div>
            <button
              onClick={() => {
                if (selectedIds.size === 0) return;
                setShowPayModal(true);
                setPayError('');
                setPayPassword('');
              }}
              disabled={selectedIds.size === 0}
              className={`px-8 py-3 font-bold rounded-xl transition-all active:scale-[0.97] ${
                selectedIds.size === 0
                  ? 'bg-gray-200 text-gray-400'
                  : 'bg-gradient-to-r from-[#FE2C55] to-[#FF6B35] text-white hover:shadow-lg hover:shadow-red-200'
              }`}
            >
              去结算
            </button>
          </div>
        </div>
      )}

      {/* Payment modal */}
      {showPayModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center" onClick={() => { if (!paying) setShowPayModal(false); }}>
          <div className="bg-white w-full md:max-w-md md:rounded-2xl rounded-t-2xl p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">确认支付</h3>
              <button onClick={() => { if (!paying) setShowPayModal(false); }} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 mb-4">
              <div className="text-center mb-2">
                <span className="text-xs text-gray-400">支付金额</span>
                <div className="text-3xl font-bold text-[#FF6B35] mt-1 tabular-nums">¥{totalPrice.toLocaleString('zh-CN')}</div>
              </div>
              <div className="text-xs text-gray-400 text-center">
                共 {selectedItems.length} 件商品
              </div>
            </div>

            {/* Selected items summary */}
            <div className="max-h-32 overflow-y-auto mb-4 space-y-1">
              {selectedItems.map(item => (
                <div key={item.id} className="flex items-center justify-between text-xs">
                  <span className="text-gray-600 truncate flex-1">{item.coupons.name}</span>
                  <span className="text-[#FF6B35] font-medium ml-2">¥{item.coupons.price.toLocaleString('zh-CN')}</span>
                </div>
              ))}
            </div>

            {payError && (
              <div className="bg-red-50 text-red-600 text-xs p-3 rounded-lg mb-3">{payError}</div>
            )}

            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 relative">
                <input
                  type="password"
                  placeholder="输入6位支付密码"
                  value={payPassword}
                  onChange={e => setPayPassword(e.target.value.replace(/\D/g, ''))}
                  maxLength={6}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-center text-lg tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-[#1890FF] focus:border-transparent"
                  disabled={paying}
                />
              </div>
            </div>

            <button
              onClick={handleCheckout}
              disabled={paying || !payPassword}
              className={`w-full py-3 rounded-xl font-bold text-white transition-all active:scale-[0.97] ${
                paying || !payPassword
                  ? 'bg-gray-300 text-gray-500'
                  : 'bg-gradient-to-r from-[#FE2C55] to-[#FF6B35] hover:shadow-lg hover:shadow-red-200'
              }`}
            >
              {paying ? '支付中...' : '确认支付'}
            </button>
          </div>
        </div>
      )}

      {/* Success modal */}
      {paySuccess && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12l5 5L20 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">抢购成功！</h3>
            <div className="space-y-1 mb-4">
              {successOrders.map((name, i) => (
                <p key={i} className="text-sm text-gray-600">{name}</p>
              ))}
            </div>
            <div className="flex gap-3">
              <Link
                href="/profile/order"
                className="flex-1 py-2.5 bg-[#1890FF] text-white rounded-xl font-medium text-sm text-center hover:bg-[#0E7FD9] transition-colors"
              >
                查看订单
              </Link>
              <button
                onClick={() => { setPaySuccess(false); setShowPayModal(false); }}
                className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl font-medium text-sm hover:bg-gray-50 transition-colors"
              >
                继续抢券
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <BottomNav active="cart" />
    </div>
  );
}
