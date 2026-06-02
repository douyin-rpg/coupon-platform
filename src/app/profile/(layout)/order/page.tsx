'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';

interface UserCoupon {
  id: string;
  coupon_id: string;
  coupon_name: string;
  coupon_price: number;
  coupon_image: string | null;
  status: string;
  created_at: string;
}

const STATUS_MAP: Record<string, { label: string; color: string; bgColor: string }> = {
  pending_payment: { label: '待支付', color: 'text-orange-600', bgColor: 'bg-orange-50 border-orange-200' },
  pending_use: { label: '待使用', color: 'text-[#1890FF]', bgColor: 'bg-blue-50 border-blue-200' },
  pending_redemption: { label: '待回收', color: 'text-purple-600', bgColor: 'bg-purple-50 border-purple-200' },
  redeemed: { label: '已回收', color: 'text-green-600', bgColor: 'bg-green-50 border-green-200' },
  redemption_rejected: { label: '回收被拒', color: 'text-red-600', bgColor: 'bg-red-50 border-red-200' },
  expired: { label: '已过期', color: 'text-gray-400', bgColor: 'bg-gray-50 border-gray-200' },
};

const TAB_LIST = [
  { key: 'all', label: '全部' },
  { key: 'pending_payment', label: '待支付' },
  { key: 'pending_use', label: '待使用' },
  { key: 'pending_redemption', label: '待回收' },
  { key: 'redeemed', label: '已回收' },
];

export default function OrderPage() {
  const { user } = useAuth();
  const [coupons, setCoupons] = useState<UserCoupon[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const [payPassword, setPayPassword] = useState('');
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const fetchCoupons = () => {
    if (!user) return;
    fetch('/api/user/coupons').then(r => r.json()).then(d => setCoupons(d.coupons || [])).catch(() => {});
  };
  useEffect(fetchCoupons, [user]);

  const filtered = activeTab === 'all' ? coupons : coupons.filter(o => o.status === activeTab);

  const handleApplyRedeem = async (couponId: string) => {
    if (!payPassword) { setError('请输入支付密码'); return; }
    setApplyingId(couponId);
    setError('');
    try {
      const res = await fetch('/api/redemption/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userCouponId: couponId, paymentPassword: payPassword }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert('申请回收成功！等待后台审核');
        setPayPassword('');
        setApplyingId(null);
        fetchCoupons();
      } else {
        setError(data.error || '操作失败');
      }
    } catch { setError('网络错误'); }
    finally { setApplyingId(null); }
  };

  const getStatusInfo = (status: string) => STATUS_MAP[status] || { label: status, color: 'text-gray-500', bgColor: 'bg-gray-50 border-gray-200' };

  return (
    <div className="p-4 md:p-6">
      <h2 className="text-lg font-bold text-gray-800 mb-4">我的订单</h2>

      {/* Tabs */}
      <div className="flex overflow-x-auto gap-1 mb-4 pb-1">
        {TAB_LIST.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-all font-medium ${activeTab === t.key ? 'bg-[#1890FF] text-white shadow-md shadow-blue-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
            {t.label}
            {t.key !== 'all' && <span className="ml-1 text-[10px] opacity-70">({coupons.filter(o => o.status === t.key).length})</span>}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <span className="text-5xl block mb-3">📋</span>
          <p>暂无订单</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(o => {
            const si = getStatusInfo(o.status);
            return (
              <div key={o.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-sm transition-shadow">
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {o.coupon_image ? <img src={o.coupon_image} className="w-full h-full object-cover" /> : <span className="text-2xl">🎫</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium text-gray-800 text-sm truncate">{o.coupon_name}</p>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${si.bgColor} ${si.color} font-medium whitespace-nowrap`}>
                          {si.label}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center justify-between">
                        <span className="text-[#FFC107] font-bold text-lg">¥{o.coupon_price}</span>
                        <span className="text-[10px] text-gray-400">{new Date(o.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  {o.status === 'pending_use' && (
                    <div className="mt-3 pt-3 border-t border-gray-50">
                      <button onClick={() => setApplyingId(o.id)}
                        className="w-full py-2.5 bg-gradient-to-r from-[#7B61FF] to-[#9B7BFF] text-white text-sm font-medium rounded-lg hover:shadow-lg hover:shadow-purple-200/50 active:scale-[0.97] transition-all">
                        申请回收 (回收可得 ¥{(o.coupon_price * 1.05).toFixed(2)})
                      </button>
                    </div>
                  )}

                  {/* Redemption apply form */}
                  {applyingId === o.id && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      {error && <div className="bg-red-50 text-red-600 text-xs p-2 rounded-lg mb-2">{error}</div>}
                      <div className="flex items-center gap-2">
                        <input type="password" placeholder="输入支付密码" value={payPassword} onChange={e => setPayPassword(e.target.value)} maxLength={6}
                          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#7B61FF]" />
                        <button onClick={() => handleApplyRedeem(o.id)}
                          className="px-4 py-2 bg-[#7B61FF] text-white text-sm rounded-lg hover:bg-[#6B51EF] transition-colors">
                          确认
                        </button>
                        <button onClick={() => { setApplyingId(null); setPayPassword(''); setError(''); }}
                          className="px-3 py-2 text-gray-400 text-sm">取消</button>
                      </div>
                    </div>
                  )}

                  {o.status === 'pending_redemption' && (
                    <div className="mt-3 pt-3 border-t border-gray-50">
                      <div className="flex items-center justify-between text-xs text-purple-500">
                        <span>回收审核中，预计回收金额：¥{(o.coupon_price * 1.05).toFixed(2)}</span>
                        <span className="animate-pulse">审核中...</span>
                      </div>
                    </div>
                  )}

                  {o.status === 'redeemed' && (
                    <div className="mt-3 pt-3 border-t border-gray-50">
                      <div className="flex items-center justify-between text-xs text-green-600">
                        <span>回收成功</span>
                        <span className="font-medium">+¥{(o.coupon_price * 1.05).toFixed(2)}</span>
                      </div>
                    </div>
                  )}

                  {o.status === 'redemption_rejected' && (
                    <div className="mt-3 pt-3 border-t border-gray-50">
                      <div className="flex items-center justify-between text-xs text-red-500">
                        <span>回收被拒，金额已退回</span>
                        <span>+¥{o.coupon_price.toFixed(2)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
