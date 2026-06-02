'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import Link from 'next/link';

interface UserCoupon {
  id: string;
  coupon_id: string;
  coupon_name: string;
  coupon_price: number;
  coupon_image: string | null;
  status: string;
  created_at: string;
  verification_code: string | null;
  paid_at: string | null;
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
  { key: 'pending_use', label: '待使用' },
  { key: 'pending_redemption', label: '待回收' },
  { key: 'redeemed', label: '已回收' },
];

export default function OrderPage() {
  const { user, refreshUser } = useAuth();
  const [coupons, setCoupons] = useState<UserCoupon[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const [payPassword, setPayPassword] = useState('');
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [error, setError] = useState('');

  const fetchCoupons = useCallback(() => {
    if (!user) return;
    fetch('/api/user/coupons').then(r => r.json()).then(d => setCoupons(d.coupons || [])).catch(() => {});
  }, [user]);

  useEffect(fetchCoupons, [fetchCoupons]);

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
        refreshUser();
      } else {
        setError(data.error || '操作失败');
      }
    } catch { setError('网络错误'); }
    finally { setApplyingId(null); }
  };

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedCode(id);
      setTimeout(() => setCopiedCode(null), 2000);
    }).catch(() => {});
  };

  const getStatusInfo = (status: string) => STATUS_MAP[status] || { label: status, color: 'text-gray-500', bgColor: 'bg-gray-50 border-gray-200' };

  const formatTime = (iso: string | null) => {
    if (!iso) return '-';
    const d = new Date(iso);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`;
  };

  const formatOrderId = (id: string) => {
    // Use last 12 chars for display
    const short = id.replace(/-/g, '').slice(-12).toUpperCase();
    return short.slice(0, 4) + '-' + short.slice(4, 8) + '-' + short.slice(8);
  };

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-800">我的订单</h2>
        <span className="text-xs text-gray-400">共 {coupons.length} 笔</span>
      </div>

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
          <svg className="w-16 h-16 mx-auto mb-3 text-gray-200" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.2" />
            <path d="M3 9h18" stroke="currentColor" strokeWidth="1.2" />
            <circle cx="8" cy="14" r="1.5" stroke="currentColor" strokeWidth="1.2" />
          </svg>
          <p className="text-sm">暂无订单</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(o => {
            const si = getStatusInfo(o.status);
            const isExpanded = expandedId === o.id;
            return (
              <div key={o.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-sm transition-shadow">
                {/* Main card content */}
                <div className="p-4 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : o.id)}>
                  <div className="flex items-start gap-3">
                    <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {o.coupon_image ? <img src={o.coupon_image} alt={o.coupon_name} className="w-full h-full object-cover" /> : (
                        <svg className="w-8 h-8 text-[#1890FF]" viewBox="0 0 24 24" fill="none">
                          <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
                          <path d="M3 9h18" stroke="currentColor" strokeWidth="1.5" />
                          <path d="M7 14h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium text-gray-800 text-sm truncate">{o.coupon_name}</p>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${si.bgColor} ${si.color} font-medium whitespace-nowrap`}>
                          {si.label}
                        </span>
                      </div>
                      <div className="mt-1.5 flex items-center justify-between">
                        <span className="text-[#FF6B35] font-bold text-lg font-variant-numeric tabular-nums">¥{o.coupon_price.toLocaleString('zh-CN')}</span>
                        <svg className={`w-4 h-4 text-gray-300 transition-transform ${isExpanded ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded detail section */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-gray-50 pt-3">
                    <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                      {/* Order number */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" strokeLinecap="round" />
                            <rect x="9" y="3" width="6" height="4" rx="1" />
                          </svg>
                          订单编号
                        </span>
                        <span className="text-xs font-mono text-gray-600 font-medium">{formatOrderId(o.id)}</span>
                      </div>

                      {/* Payment amount */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <rect x="2" y="4" width="20" height="16" rx="3" />
                            <path d="M2 10h20" />
                          </svg>
                          支付金额
                        </span>
                        <span className="text-sm font-bold text-[#FF6B35]">¥{o.coupon_price.toLocaleString('zh-CN')}</span>
                      </div>

                      {/* Verification code */}
                      {o.verification_code && (
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                              <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            核销码
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-mono font-bold text-[#1890FF] tracking-wider bg-blue-50 px-2 py-0.5 rounded">{o.verification_code}</span>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleCopyCode(o.verification_code!, o.id); }}
                              className="text-[10px] text-gray-400 hover:text-[#1890FF] transition-colors px-1"
                            >
                              {copiedCode === o.id ? '已复制' : '复制'}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Order time */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <circle cx="12" cy="12" r="9" />
                            <path d="M12 7v5l3 3" strokeLinecap="round" />
                          </svg>
                          下单时间
                        </span>
                        <span className="text-xs text-gray-600 font-variant-numeric tabular-nums">{formatTime(o.created_at)}</span>
                      </div>

                      {/* Paid time */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
                            <circle cx="12" cy="12" r="9" />
                          </svg>
                          支付时间
                        </span>
                        <span className="text-xs text-gray-600 font-variant-numeric tabular-nums">{formatTime(o.paid_at)}</span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    {o.status === 'pending_use' && (
                      <div className="mt-3">
                        {applyingId === o.id ? (
                          <div className="space-y-2">
                            {error && <div className="bg-red-50 text-red-600 text-xs p-2 rounded-lg">{error}</div>}
                            <div className="flex items-center gap-2">
                              <input type="password" placeholder="输入支付密码" value={payPassword} onChange={e => setPayPassword(e.target.value.replace(/\D/g, ''))} maxLength={6}
                                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm text-center tracking-widest focus:outline-none focus:ring-1 focus:ring-[#1890FF]" />
                              <button onClick={() => handleApplyRedeem(o.id)}
                                className="px-4 py-2 bg-[#1890FF] text-white text-sm rounded-lg hover:bg-[#0E7FD9] transition-colors font-medium">
                                确认
                              </button>
                              <button onClick={() => { setApplyingId(null); setPayPassword(''); setError(''); }}
                                className="px-3 py-2 text-gray-400 text-sm hover:text-gray-600">取消</button>
                            </div>
                          </div>
                        ) : (
                          <button onClick={() => setApplyingId(o.id)}
                            className="w-full py-2.5 bg-[#1890FF] text-white text-sm font-medium rounded-lg hover:bg-[#0E7FD9] active:scale-[0.97] transition-all">
                            申请回收
                          </button>
                        )}
                      </div>
                    )}

                    {o.status === 'pending_redemption' && (
                      <div className="mt-3 bg-purple-50 rounded-lg p-3 flex items-center justify-between">
                        <span className="text-xs text-purple-600">回收审核中</span>
                        <span className="text-xs text-purple-400 animate-pulse">等待处理...</span>
                      </div>
                    )}

                    {o.status === 'redeemed' && (
                      <div className="mt-3 bg-green-50 rounded-lg p-3 flex items-center justify-between">
                        <span className="text-xs text-green-600">回收成功</span>
                        <span className="text-xs text-green-500 font-medium">金额已返还</span>
                      </div>
                    )}

                    {o.status === 'redemption_rejected' && (
                      <div className="mt-3 bg-red-50 rounded-lg p-3 flex items-center justify-between">
                        <span className="text-xs text-red-500">回收被拒</span>
                        <span className="text-xs text-red-400">金额已退回</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Quick action for non-expanded state */}
                {!isExpanded && o.status === 'pending_use' && (
                  <div className="px-4 pb-3">
                    <button onClick={() => setApplyingId(o.id)}
                      className="w-full py-2 bg-[#1890FF] text-white text-sm font-medium rounded-lg hover:bg-[#0E7FD9] active:scale-[0.97] transition-all">
                      申请回收
                    </button>
                  </div>
                )}

                {/* Inline apply form for non-expanded */}
                {!isExpanded && applyingId === o.id && (
                  <div className="px-4 pb-3">
                    {error && <div className="bg-red-50 text-red-600 text-xs p-2 rounded-lg mb-2">{error}</div>}
                    <div className="flex items-center gap-2">
                      <input type="password" placeholder="输入支付密码" value={payPassword} onChange={e => setPayPassword(e.target.value.replace(/\D/g, ''))} maxLength={6}
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm text-center tracking-widest focus:outline-none focus:ring-1 focus:ring-[#1890FF]" />
                      <button onClick={() => handleApplyRedeem(o.id)}
                        className="px-4 py-2 bg-[#1890FF] text-white text-sm rounded-lg font-medium">确认</button>
                      <button onClick={() => { setApplyingId(null); setPayPassword(''); setError(''); }}
                        className="px-3 py-2 text-gray-400 text-sm">取消</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
