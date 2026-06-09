'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';

interface UserCoupon {
  id: string;
  coupon_id: string;
  coupon_name: string;
  coupon_price: number;
  coupon_image: string | null;
  status: string;
  created_at: string;
  verification_code: string | null;
}

export default function BackPage() {
  const { user, refreshUser } = useAuth();
  const [coupons, setCoupons] = useState<UserCoupon[]>([]);
  const [activeTab, setActiveTab] = useState('pending_use');
  const [payPassword, setPayPassword] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchCoupons = useCallback(() => {
    if (!user) return;
    fetch('/api/user/coupons').then(r => r.json()).then(d => setCoupons(d.coupons || [])).catch(() => {});
  }, [user]);

  useEffect(fetchCoupons, [fetchCoupons]);

  const tabs = [
    { key: 'pending_use', label: '快捷申请', filter: 'pending_use' },
    { key: 'pending_redemption', label: '待审核', filter: 'pending_redemption' },
    { key: 'redeemed', label: '回收成功', filter: 'redeemed' },
  ];

  const filtered = coupons.filter(o => o.status === activeTab);

  const handleApply = async () => {
    if (selectedIds.length === 0) { setError('请选择要回收的券'); return; }
    if (!payPassword) { setError('请输入支付密码'); return; }
    setLoading(true); setError('');
    try {
      for (const id of selectedIds) {
        const res = await fetch('/api/redemption/apply', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userCouponId: id, paymentPassword: payPassword }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          setError(data.error || '操作失败');
          break;
        }
      }
      if (!error) {
        alert('申请回收成功！等待后台审核');
      }
      setPayPassword('');
      setSelectedIds([]);
      fetchCoupons();
      refreshUser();
    } catch { setError('网络错误'); }
    finally { setLoading(false); }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const selectedTotal = filtered.filter(o => selectedIds.includes(o.id)).reduce((s, o) => s + o.coupon_price, 0);

  return (
    <div className="p-4 md:p-6">
      <h2 className="text-lg font-bold text-gray-800 mb-4">快捷回收</h2>

      {/* Tabs */}
      <div className="flex overflow-x-auto gap-1 mb-4 pb-1">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-all font-medium ${activeTab === t.key ? 'bg-[#1890FF] text-white shadow-md shadow-blue-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
            {t.label} ({coupons.filter(o => o.status === t.filter).length})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <svg className="w-16 h-16 mx-auto mb-3 text-gray-200" viewBox="0 0 24 24" fill="none">
            <path d="M4 4h16v12H4z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
            <path d="M4 8h16" stroke="currentColor" strokeWidth="1.2" />
          </svg>
          <p className="text-sm">暂无记录</p>
        </div>
      ) : (
        <>
          <div className="space-y-3 mb-4">
            {filtered.map(o => (
              <div key={o.id} className="bg-white rounded-xl border border-gray-100 p-3 flex items-center gap-3">
                {activeTab === 'pending_use' && (
                  <input type="checkbox" checked={selectedIds.includes(o.id)} onChange={() => toggleSelect(o.id)}
                    className="w-4 h-4 text-[#1890FF] rounded border-gray-300 focus:ring-[#1890FF] accent-[#1890FF]" />
                )}
                <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {o.coupon_image ? <img src={o.coupon_image} alt={o.coupon_name} className="w-full h-full object-cover" /> : (
                    <svg className="w-6 h-6 text-[#1890FF]" viewBox="0 0 24 24" fill="none">
                      <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
                      <path d="M3 9h18" stroke="currentColor" strokeWidth="1.5" />
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{o.coupon_name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">实付：¥{o.coupon_price.toLocaleString('zh-CN')}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-gray-400">
                    {activeTab === 'pending_use' ? '面值' : activeTab === 'redeemed' ? '已返还' : '待返还'}
                  </p>
                  <p className="text-sm font-bold text-[#1890FF]">¥{o.coupon_price.toLocaleString('zh-CN')}</p>
                </div>
              </div>
            ))}
          </div>

          {activeTab === 'pending_use' && selectedIds.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              {error && <div className="bg-red-50 text-red-600 text-xs p-2 rounded-lg mb-3">{error}</div>}
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-600">已选 {selectedIds.length} 件</span>
                <span className="text-sm">合计：<span className="text-[#1890FF] font-bold">¥{selectedTotal.toLocaleString('zh-CN')}</span></span>
              </div>
              <div className="flex items-center gap-2">
                <input type="password" placeholder="支付密码" value={payPassword} onChange={e => setPayPassword(e.target.value.replace(/\D/g, ''))} maxLength={6}
                  className="flex-1 px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-center tracking-widest focus:outline-none focus:ring-1 focus:ring-[#1890FF]" />
                <button onClick={handleApply} disabled={loading}
                  className="px-6 py-2.5 bg-[#1890FF] text-white rounded-lg text-sm font-medium hover:bg-[#0E7FD9] disabled:opacity-50 transition-all">
                  {loading ? '提交中...' : '申请回收'}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
