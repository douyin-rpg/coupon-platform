'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AdminNotification } from '@/components/admin-notification';

interface RedemptionRequest {
  id: string;
  user_coupon_id: string;
  user_id: string;
  status: string;
  admin_note: string | null;
  created_at: string;
  processed_at: string | null;
  user_coupons: { payment_amount: string; coupons: { name: string; price: string } } | null;
  users: { username: string; real_name: string } | null;
}

export default function AdminRedemptionsPage() {
  const [requests, setRequests] = useState<RedemptionRequest[]>([]);
  const [actionOpen, setActionOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<RedemptionRequest | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');
  const [adminNote, setAdminNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [batchOpen, setBatchOpen] = useState(false);
  const [batchAction, setBatchAction] = useState<'approve' | 'reject'>('approve');
  const [batchLoading, setBatchLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchRequests = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/redemptions');
      if (res.status === 401) { window.location.href = '/admin'; return; }
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests || []);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  // Auto-refresh every 3 seconds
  useEffect(() => {
    if (!autoRefresh) return;
    const timer = setInterval(fetchRequests, 3000);
    return () => clearInterval(timer);
  }, [autoRefresh, fetchRequests]);

  const handleAction = async () => {
    if (!selectedRequest) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/redemptions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedRequest.id, action: actionType, adminNote }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setActionOpen(false);
        setAdminNote('');
        setMessage({
          type: 'success',
          text: actionType === 'approve' ? '已通过，返还金额含5%奖励' : '已拒绝，返还支付金额',
        });
        fetchRequests();
      } else {
        setMessage({ type: 'error', text: data.error || '操作失败' });
      }
    } catch {
      setMessage({ type: 'error', text: '网络错误' });
    } finally {
      setLoading(false);
    }
  };

  const handleBatchAction = async () => {
    setBatchLoading(true);
    try {
      const res = await fetch('/api/admin/redemptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: batchAction }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setBatchOpen(false);
        setMessage({ type: 'success', text: data.message || `已处理 ${data.processed} 条申请` });
        fetchRequests();
      } else {
        setMessage({ type: 'error', text: data.error || '批量处理失败' });
      }
    } catch {
      setMessage({ type: 'error', text: '网络错误' });
    } finally {
      setBatchLoading(false);
    }
  };

  const statusMap: Record<string, { label: string; color: string }> = {
    pending: { label: '待审核', color: 'bg-amber-500 text-white' },
    approved: { label: '已通过', color: 'bg-green-500 text-white' },
    rejected: { label: '已拒绝', color: 'bg-red-500 text-white' },
  };

  const pendingCount = requests.filter((r) => r.status === 'pending').length;

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="fixed left-0 top-0 bottom-0 w-56 bg-gradient-to-b from-[#0A1628] to-[#132742] text-white p-4">
        <h2 className="text-lg font-bold mb-6">管理后台</h2>
        <nav className="space-y-1">
          <Link href="/admin/sessions" className="block px-3 py-2 hover:bg-gray-800 rounded-lg text-sm">场次管理</Link>
          <Link href="/admin/coupons" className="block px-3 py-2 hover:bg-gray-800 rounded-lg text-sm">优惠券管理</Link>
          <Link href="/admin/codes" className="block px-3 py-2 hover:bg-gray-800 rounded-lg text-sm">注册码管理</Link>
          <Link href="/admin/verify" className="block px-3 py-2 hover:bg-gray-800 rounded-lg text-sm">实名审核</Link>
          <Link href="/admin/articles" className="block px-3 py-2 hover:bg-gray-800 rounded-lg text-sm">文章管理</Link>
          <Link href="/admin/redemptions" className="block px-3 py-2 bg-gray-800 rounded-lg text-sm font-medium">
            回兑审核 {pendingCount > 0 && <span className="ml-1 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{pendingCount}</span>}
          </Link>
          <Link href="/admin/orders" className="block px-3 py-2 hover:bg-gray-800 rounded-lg text-sm">订单管理</Link>
          <Link href="/admin/users" className="block px-3 py-2 hover:bg-gray-800 rounded-lg text-sm">用户管理</Link>
          <Link href="/admin/withdrawals" className="block px-3 py-2 hover:bg-gray-800 rounded-lg text-sm">提现审核</Link>
          <Link href="/admin/categories" className="block px-3 py-2 hover:bg-gray-800 rounded-lg text-sm">分类管理</Link>
          <Link href="/admin/banners" className="block px-3 py-2 hover:bg-gray-800 rounded-lg text-sm">轮播图管理</Link>
        </nav>
        <div className="absolute bottom-4 left-4 right-4">
          <Link href="/" className="text-xs text-gray-400 hover:text-gray-200">返回前台</Link>
        </div>
      </div>

      <div className="ml-56 p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">回兑审核</h1>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-gray-500 cursor-pointer">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="w-4 h-4 accent-[#1890FF]"
              />
              实时刷新 (3s)
            </label>
            {pendingCount > 0 && (
              <>
                <Button
                  onClick={() => { setBatchAction('approve'); setBatchOpen(true); }}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  一键全部通过 ({pendingCount})
                </Button>
                <Button
                  onClick={() => { setBatchAction('reject'); setBatchOpen(true); }}
                  variant="outline"
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  一键全部拒绝
                </Button>
              </>
            )}
          </div>
        </div>

        {message && (
          <div className={`mb-4 p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {message.text}
          </div>
        )}

        <div className="space-y-3">
          {requests.length === 0 ? (
            <Card className="border-0 shadow-sm"><CardContent className="py-12 text-center text-gray-400">暂无回兑申请</CardContent></Card>
          ) : (
            requests.map((r) => {
              const couponInfo = r.user_coupons as unknown as { payment_amount: string; coupons: { name: string; price: string } } | null;
              const userInfo = r.users as unknown as { username: string; real_name: string } | null;
              const st = statusMap[r.status] || { label: r.status, color: 'bg-gray-400 text-white' };
              const paymentAmount = couponInfo ? parseFloat(couponInfo.payment_amount) : 0;

              return (
                <Card key={r.id} className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl flex items-center justify-center">
                          <svg className="w-6 h-6 text-[#7B61FF]" viewBox="0 0 24 24" fill="none">
                            <path d="M4 4h16v12H4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                            <path d="M4 8h16" stroke="currentColor" strokeWidth="1.5" />
                            <path d="M8 12h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="font-medium">{couponInfo?.coupons?.name || '优惠券'} - 回兑申请</h3>
                          <p className="text-sm text-gray-500">
                            申请人：{userInfo?.real_name || '未知'}（{userInfo?.username || '未知'}） · 
                            支付金额：<span className="text-[#FF6B35] font-medium">¥{paymentAmount.toLocaleString('zh-CN')}</span>
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            申请时间：{new Date(r.created_at).toLocaleString()}
                            {r.processed_at && ` · 处理时间：${new Date(r.processed_at).toLocaleString()}`}
                          </p>
                          {r.admin_note && <p className="text-sm text-gray-500 mt-1">备注：{r.admin_note}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={st.color}>{st.label}</Badge>
                        {r.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white"
                              onClick={() => {
                                setSelectedRequest(r);
                                setActionType('approve');
                                setAdminNote('');
                                setActionOpen(true);
                              }}
                            >
                              通过
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 border-red-200 hover:bg-red-50"
                              onClick={() => {
                                setSelectedRequest(r);
                                setActionType('reject');
                                setAdminNote('');
                                setActionOpen(true);
                              }}
                            >
                              拒绝
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>

      {/* Single Action Dialog */}
      <Dialog open={actionOpen} onOpenChange={setActionOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{actionType === 'approve' ? '通过回兑申请' : '拒绝回兑申请'}</DialogTitle>
            <DialogDescription>
              {actionType === 'approve' 
                ? '通过后将返还用户支付金额 + 5%奖励到余额。' 
                : '拒绝后将仅返还用户支付金额到余额。'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              {selectedRequest && (
                <div className="text-sm text-amber-700">
                  <p>券名称：{(selectedRequest.user_coupons as unknown as { coupons: { name: string } })?.coupons?.name}</p>
                  <p>支付金额：¥{((selectedRequest.user_coupons as unknown as { payment_amount: string })?.payment_amount || '0')} </p>
                  {actionType === 'approve' && (
                    <p className="font-bold mt-1">返还总计：¥{(parseFloat((selectedRequest.user_coupons as unknown as { payment_amount: string })?.payment_amount || '0') * 1.05).toFixed(2)}</p>
                  )}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>管理员备注（可选）</Label>
              <Textarea placeholder="填写审核备注..." value={adminNote} onChange={(e) => setAdminNote(e.target.value)} />
            </div>
            <Button
              className={`w-full text-white font-semibold ${actionType === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
              onClick={handleAction}
              disabled={loading}
            >
              {loading ? '处理中...' : actionType === 'approve' ? '确认通过' : '确认拒绝'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Batch Action Dialog */}
      <Dialog open={batchOpen} onOpenChange={setBatchOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{batchAction === 'approve' ? '一键通过所有回兑申请' : '一键拒绝所有回兑申请'}</DialogTitle>
            <DialogDescription>
              {batchAction === 'approve'
                ? `将一次性通过所有 ${pendingCount} 条待审核回兑申请，返还用户支付金额 + 5%奖励。`
                : `将一次性拒绝所有 ${pendingCount} 条待审核回兑申请，仅返还用户支付金额。`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className={`rounded-lg p-4 ${batchAction === 'approve' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <div className="flex items-center gap-3">
                <svg className={`w-8 h-8 ${batchAction === 'approve' ? 'text-green-500' : 'text-red-500'}`} viewBox="0 0 24 24" fill="none">
                  {batchAction === 'approve' ? (
                    <>
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
                      <path d="M8 12l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </>
                  ) : (
                    <>
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
                      <path d="M15 9l-6 6M9 9l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </>
                  )}
                </svg>
                <div>
                  <p className="font-bold text-sm">{pendingCount} 条待审核申请</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {batchAction === 'approve' ? '通过后每位用户将获得支付金额 + 5%奖励' : '拒绝后每位用户将获得支付金额退回'}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setBatchOpen(false)}
                disabled={batchLoading}
              >
                取消
              </Button>
              <Button
                className={`flex-1 text-white font-semibold ${batchAction === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                onClick={handleBatchAction}
                disabled={batchLoading}
              >
                {batchLoading ? '处理中...' : `确认${batchAction === 'approve' ? '全部通过' : '全部拒绝'}`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AdminNotification />
    </div>
  );
}
