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

export default function BackPage() {
  const { user } = useAuth();
  const [coupons, setCoupons] = useState<UserCoupon[]>([]);
  const [activeTab, setActiveTab] = useState('pending_use');
  const [payPassword, setPayPassword] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCoupons = () => {
    if (!user) return;
    fetch('/api/user/coupons').then(r => r.json()).then(d => setCoupons(d.coupons || [])).catch(() => {});
  };
  useEffect(fetchCoupons, [user]);

  const tabs = [
    { key: 'pending_use', label: '快捷申请', filter: 'pending_use' },
    { key: 'pending_redemption', label: '回兑待审', filter: 'pending_redemption' },
    { key: 'redeemed', label: '回兑成功', filter: 'redeemed' },
    { key: 'redemption_rejected', label: '回兑拒绝', filter: 'redemption_rejected' },
  ];

  const filtered = coupons.filter(o => o.status === activeTab);

  const handleApply = async () => {
    if (selectedIds.length === 0) { alert('请选择要回兑的券'); return; }
    if (!payPassword) { alert('请输入支付密码'); return; }
    setLoading(true);
    try {
      for (const id of selectedIds) {
        await fetch('/api/redemption/apply', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userCouponId: id, paymentPassword: payPassword }),
        });
      }
      alert('申请回兑成功！');
      setPayPassword('');
      setSelectedIds([]);
      fetchCoupons();
    } catch { alert('操作失败'); }
    finally { setLoading(false); }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  return (
    <div className="p-4 md:p-6">
      <h2 className="text-lg font-bold text-gray-800 mb-4">快捷回兑</h2>
      <div className="flex border-b border-gray-200 mb-4">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2 text-sm whitespace-nowrap border-b-2 ${activeTab === t.key ? 'border-[#FE2C55] text-[#FE2C55] font-medium' : 'border-transparent text-gray-500'}`}>
            {t.label}({coupons.filter(o => o.status === t.filter).length})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400"><span className="text-4xl block mb-3">🔄</span>暂无记录</div>
      ) : (
        <>
          <div className="space-y-3 mb-4">
            {filtered.map(o => (
              <div key={o.id} className="border border-gray-100 rounded-lg p-3 flex items-center gap-3">
                {activeTab === 'pending_use' && (
                  <input type="checkbox" checked={selectedIds.includes(o.id)} onChange={() => toggleSelect(o.id)}
                    className="w-4 h-4 text-[#FE2C55] rounded" />
                )}
                <div className="w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {o.coupon_image ? <img src={o.coupon_image} className="w-full h-full object-cover" /> : <span className="text-xl">🎫</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{o.coupon_name}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm">实付：<span className="text-[#FE2C55] font-bold">¥{o.coupon_price}</span></p>
                  <p className="text-sm">回收：<span className="text-green-500 font-bold">¥{(o.coupon_price * 1.05).toFixed(2)}</span></p>
                </div>
              </div>
            ))}
          </div>

          {activeTab === 'pending_use' && selectedIds.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4 flex items-center gap-4">
              <span className="text-sm text-gray-600">已选 {selectedIds.length} 件，回收金额：<span className="text-green-500 font-bold">¥{filtered.filter(o => selectedIds.includes(o.id)).reduce((s, o) => s + o.coupon_price * 1.05, 0).toFixed(2)}</span></span>
              <input type="password" placeholder="支付密码" value={payPassword} onChange={e => setPayPassword(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#FE2C55]" />
              <button onClick={handleApply} disabled={loading}
                className="px-6 py-2 bg-[#ff666b] text-white rounded-lg text-sm font-medium hover:bg-[#FE2C55] disabled:opacity-50">
                {loading ? '提交中...' : '申请回兑'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
