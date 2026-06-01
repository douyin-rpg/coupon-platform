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

export default function OrderPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<UserCoupon[]>([]);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    if (!user) return;
    fetch('/api/user/coupons').then(r => r.json()).then(d => setOrders(d.coupons || [])).catch(() => {});
  }, [user]);

  const tabs = [
    { key: 'all', label: '全部' },
    { key: 'pending_use', label: '待使用' },
    { key: 'pending_redemption', label: '待回兑' },
    { key: 'redeemed', label: '已回兑' },
    { key: 'redemption_rejected', label: '回兑拒绝' },
  ];

  const filtered = activeTab === 'all' ? orders : orders.filter(o => o.status === activeTab);
  const statusMap: Record<string, string> = {
    pending_use: '待使用', pending_redemption: '待回兑', redeemed: '已回兑',
    redemption_rejected: '回兑拒绝', expired: '已过期',
  };

  return (
    <div className="p-4 md:p-6">
      <h2 className="text-lg font-bold text-gray-800 mb-4">我的订单</h2>
      <div className="flex border-b border-gray-200 mb-4 overflow-x-auto">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2 text-sm whitespace-nowrap border-b-2 transition-colors ${activeTab === t.key ? 'border-[#FE2C55] text-[#FE2C55] font-medium' : 'border-transparent text-gray-500'}`}>
            {t.label}
          </button>
        ))}
      </div>
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400"><span className="text-4xl block mb-3">📦</span>暂无订单</div>
      ) : (
        <div className="space-y-3">
          {filtered.map(o => (
            <div key={o.id} className="border border-gray-100 rounded-lg p-3 flex items-center gap-3">
              <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {o.coupon_image ? <img src={o.coupon_image} className="w-full h-full object-cover" /> : <span className="text-2xl">🎫</span>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{o.coupon_name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{new Date(o.created_at).toLocaleString()}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-[#FE2C55] font-bold">¥{o.coupon_price}</p>
                <p className="text-xs text-gray-400 mt-0.5">{statusMap[o.status] || o.status}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
