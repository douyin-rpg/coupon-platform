'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { AdminNotification } from '@/components/admin-notification';

interface Order {
  id: string;
  user_id: string;
  coupon_id: string;
  status: string;
  payment_amount: string;
  created_at: string;
  verification_code: string | null;
  paid_at: string | null;
  updated_at: string | null;
  coupons: { id: string; name: string; price: string; image_url: string | null } | null;
  users: { id: string; username: string; real_name: string } | null;
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending_payment: { label: '待支付', color: 'bg-orange-500 text-white' },
  pending_use: { label: '待使用', color: 'bg-[#1890FF] text-white' },
  pending_redemption: { label: '待回收', color: 'bg-purple-500 text-white' },
  redeemed: { label: '已回收', color: 'bg-green-500 text-white' },
  redemption_rejected: { label: '回收被拒', color: 'bg-red-500 text-white' },
  expired: { label: '已过期', color: 'bg-gray-400 text-white' },
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/orders');
      if (res.status === 401) { window.location.href = '/admin'; return; }
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Auto-refresh every 5 seconds
  useEffect(() => {
    if (!autoRefresh) return;
    const timer = setInterval(fetchOrders, 5000);
    return () => clearInterval(timer);
  }, [autoRefresh, fetchOrders]);

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter);

  const formatTime = (iso: string | null) => {
    if (!iso) return '-';
    const d = new Date(iso);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`;
  };

  const formatOrderId = (id: string) => {
    const short = id.replace(/-/g, '').slice(-12).toUpperCase();
    return short.slice(0, 4) + '-' + short.slice(4, 8) + '-' + short.slice(8);
  };

  const statusCounts = orders.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="fixed left-0 top-0 bottom-0 w-56 bg-gradient-to-b from-[#0A1628] to-[#132742] text-white p-4">
        <h2 className="text-lg font-bold mb-6">管理后台</h2>
        <nav className="space-y-1">
          <Link href="/admin/sessions" className="block px-3 py-2 hover:bg-gray-800 rounded-lg text-sm">场次管理</Link>
          <Link href="/admin/coupons" className="block px-3 py-2 hover:bg-gray-800 rounded-lg text-sm">优惠券管理</Link>
          <Link href="/admin/codes" className="block px-3 py-2 hover:bg-gray-800 rounded-lg text-sm">注册码管理</Link>
          <Link href="/admin/verify" className="block px-3 py-2 hover:bg-gray-800 rounded-lg text-sm">实名审核</Link>
          <Link href="/admin/articles" className="block px-3 py-2 hover:bg-gray-800 rounded-lg text-sm">文章管理</Link>
          <Link href="/admin/redemptions" className="block px-3 py-2 hover:bg-gray-800 rounded-lg text-sm">回兑审核</Link>
          <Link href="/admin/orders" className="block px-3 py-2 bg-gray-800 rounded-lg text-sm font-medium">
            订单管理 <Badge className="ml-1 bg-[#1890FF] text-white text-[10px]">{orders.length}</Badge>
          </Link>
          <Link href="/admin/users" className="block px-3 py-2 hover:bg-gray-800 rounded-lg text-sm">用户管理</Link>
          <Link href="/admin/withdrawals" className="block px-3 py-2 hover:bg-gray-800 rounded-lg text-sm">提现审核</Link>
          <Link href="/admin/categories" className="block px-3 py-2 hover:bg-gray-800 rounded-lg text-sm">分类管理</Link>
          <Link href="/admin/banners" className="block px-3 py-2 hover:bg-gray-800 rounded-lg text-sm">轮播图管理</Link>
        </nav>
        <div className="absolute bottom-4 left-4 right-4">
          <Link href="/" className="text-xs text-gray-400 hover:text-gray-200">返回前台</Link>
        </div>
      </div>

      {/* Main content */}
      <div className="ml-56 p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">订单管理</h1>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-gray-500 cursor-pointer">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="w-4 h-4 accent-[#1890FF]"
              />
              自动刷新 (5s)
            </label>
            <button onClick={fetchOrders} className="px-3 py-1.5 text-sm bg-white border rounded-lg hover:bg-gray-50 transition-colors">
              刷新
            </button>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-4 flex-wrap">
          <button onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === 'all' ? 'bg-[#1890FF] text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
            全部 ({orders.length})
          </button>
          {Object.entries(STATUS_MAP).map(([key, { label }]) => (
            <button key={key} onClick={() => setFilter(key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === key ? 'bg-[#1890FF] text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
              {label} ({statusCounts[key] || 0})
            </button>
          ))}
        </div>

        {/* Orders list */}
        <div className="space-y-2">
          {filtered.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center text-gray-400">暂无订单</div>
          ) : (
            filtered.map((o) => {
              const couponInfo = o.coupons as unknown as { name: string; price: string; image_url: string | null } | null;
              const userInfo = o.users as unknown as { username: string; real_name: string } | null;
              const st = STATUS_MAP[o.status] || { label: o.status, color: 'bg-gray-400 text-white' };
              const isExpanded = expandedId === o.id;

              return (
                <div key={o.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <div className="p-4 cursor-pointer hover:bg-gray-50/50 transition-colors" onClick={() => setExpandedId(isExpanded ? null : o.id)}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center overflow-hidden">
                          {couponInfo?.image_url ? (
                            <img src={couponInfo.image_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <svg className="w-5 h-5 text-[#1890FF]" viewBox="0 0 24 24" fill="none">
                              <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
                              <path d="M3 9h18" stroke="currentColor" strokeWidth="1.5" />
                            </svg>
                          )}
                        </div>
                        <div>
                          <h3 className="font-medium text-sm">{couponInfo?.name || '优惠券'}</h3>
                          <p className="text-xs text-gray-500">
                            {userInfo?.real_name || '未知'}（{userInfo?.username || '未知'}）
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-[#FF6B35]">¥{parseFloat(o.payment_amount).toLocaleString('zh-CN')}</span>
                        <Badge className={st.color}>{st.label}</Badge>
                        <svg className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-gray-100 pt-3">
                      <div className="bg-gray-50 rounded-xl p-4">
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-gray-400 text-xs">订单编号</span>
                            <p className="font-mono text-xs font-medium mt-0.5">{formatOrderId(o.id)}</p>
                          </div>
                          <div>
                            <span className="text-gray-400 text-xs">支付金额</span>
                            <p className="font-bold text-[#FF6B35] mt-0.5">¥{parseFloat(o.payment_amount).toLocaleString('zh-CN')}</p>
                          </div>
                          <div>
                            <span className="text-gray-400 text-xs">核销码</span>
                            <p className="font-mono font-bold text-[#1890FF] mt-0.5">{o.verification_code || '-'}</p>
                          </div>
                          <div>
                            <span className="text-gray-400 text-xs">状态</span>
                            <p className="mt-0.5"><Badge className={st.color}>{st.label}</Badge></p>
                          </div>
                          <div>
                            <span className="text-gray-400 text-xs">下单时间</span>
                            <p className="text-xs font-mono mt-0.5">{formatTime(o.created_at)}</p>
                          </div>
                          <div>
                            <span className="text-gray-400 text-xs">支付时间</span>
                            <p className="text-xs font-mono mt-0.5">{formatTime(o.paid_at)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      <AdminNotification />
    </div>
  );
}
