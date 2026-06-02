'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AdminNotification } from '@/components/admin-notification';

interface Withdrawal {
  id: string;
  user_id: string;
  amount: string;
  bank_name: string | null;
  bank_card_number: string | null;
  bank_account_name: string | null;
  status: string;
  admin_note: string | null;
  created_at: string;
  processed_at: string | null;
  users: { username: string; real_name: string } | null;
}

export default function AdminWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null);
  const [actionOpen, setActionOpen] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');
  const [adminNote, setAdminNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchWithdrawals = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/withdrawals');
      if (res.status === 401) { window.location.href = '/admin'; return; }
      if (res.ok) {
        const data = await res.json();
        setWithdrawals(data.withdrawals || []);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => { fetchWithdrawals(); }, [fetchWithdrawals]);

  const handleAction = async () => {
    if (!selectedWithdrawal) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/withdrawals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedWithdrawal.id, status: actionType === 'approve' ? 'approved' : 'rejected', adminNote }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMessage({
          type: 'success',
          text: actionType === 'approve' ? '已通过，余额已扣除' : '已拒绝，余额已返还',
        });
        setActionOpen(false);
        setAdminNote('');
        fetchWithdrawals();
      } else {
        setMessage({ type: 'error', text: data.error || '操作失败' });
      }
    } catch {
      setMessage({ type: 'error', text: '网络错误' });
    } finally {
      setLoading(false);
    }
  };

  const statusMap: Record<string, { label: string; color: string }> = {
    pending: { label: '待审核', color: 'bg-amber-500 text-white' },
    approved: { label: '已通过', color: 'bg-green-500 text-white' },
    rejected: { label: '已拒绝', color: 'bg-red-500 text-white' },
  };

  const pendingCount = withdrawals.filter(w => w.status === 'pending').length;

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
          <Link href="/admin/users" className="block px-3 py-2 hover:bg-gray-800 rounded-lg text-sm">用户管理</Link>
          <Link href="/admin/redemptions" className="block px-3 py-2 hover:bg-gray-800 rounded-lg text-sm">回兑审核</Link>
          <Link href="/admin/withdrawals" className="block px-3 py-2 bg-gray-800 rounded-lg text-sm font-medium">
          <Link href="/admin/categories" className="block px-3 py-2 hover:bg-gray-800 rounded-lg text-sm">分类管理</Link>
          <Link href="/admin/banners" className="block px-3 py-2 hover:bg-gray-800 rounded-lg text-sm">轮播图管理</Link>
            提现审核 {pendingCount > 0 && <span className="ml-1 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{pendingCount}</span>}
          </Link>
        </nav>
        <div className="absolute bottom-4 left-4 right-4">
          <Link href="/" className="text-xs text-gray-400 hover:text-gray-200">返回前台</Link>
        </div>
      </div>

      <div className="ml-56 p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">提现审核</h1>
          <div className="flex gap-2">
            <span className="bg-amber-500 text-white text-xs px-2 py-1 rounded-full">{pendingCount} 条待审核</span>
          </div>
        </div>

        {message && (
          <div className={`mb-4 p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {message.text}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">用户</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">提现金额</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">收款账号</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">状态</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">申请时间</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">备注</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">操作</th>
              </tr>
            </thead>
            <tbody>
              {withdrawals.map((w) => {
                const userInfo = w.users as unknown as { username: string; real_name: string } | null;
                const st = statusMap[w.status] || { label: w.status, color: 'bg-gray-400 text-white' };
                return (
                  <tr key={w.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                    <td className="px-4 py-3 text-sm">{userInfo?.real_name || '-'}<span className="text-gray-400 ml-1">({userInfo?.username || '-'})</span></td>
                    <td className="px-4 py-3 text-sm font-medium tabular-nums text-amber-600">¥{parseFloat(w.amount).toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{w.bank_name} 尾号{w.bank_card_number?.slice(-4) || '-'}</td>
                    <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full ${st.color}`}>{st.label}</span></td>
                    <td className="px-4 py-3 text-xs text-gray-400">{new Date(w.created_at).toLocaleString()}</td>
                    <td className="px-4 py-3 text-xs text-gray-400">{w.admin_note || '-'}</td>
                    <td className="px-4 py-3 text-right">
                      {w.status === 'pending' && (
                        <div className="flex gap-1 justify-end">
                          <button
                            onClick={() => { setSelectedWithdrawal(w); setActionType('approve'); setAdminNote(''); setActionOpen(true); }}
                            className="text-xs text-green-600 hover:text-green-800 px-2 py-1 hover:bg-green-50 rounded transition"
                          >
                            通过
                          </button>
                          <button
                            onClick={() => { setSelectedWithdrawal(w); setActionType('reject'); setAdminNote(''); setActionOpen(true); }}
                            className="text-xs text-red-600 hover:text-red-800 px-2 py-1 hover:bg-red-50 rounded transition"
                          >
                            拒绝
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {withdrawals.length === 0 && (
            <div className="py-12 text-center text-gray-400">暂无提现申请</div>
          )}
        </div>
      </div>

      {/* Action Dialog */}
      <Dialog open={actionOpen} onOpenChange={setActionOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>{actionType === 'approve' ? '通过提现申请' : '拒绝提现申请'}</DialogTitle>
            <DialogDescription>
              {selectedWithdrawal && (
                <span>
                  用户 {(selectedWithdrawal.users as unknown as { real_name: string })?.real_name} 申请提现
                  <span className="font-bold text-amber-600"> ¥{parseFloat(selectedWithdrawal.amount).toFixed(2)}</span>
                  至 {selectedWithdrawal.bank_name} 尾号{selectedWithdrawal.bank_card_number?.slice(-4) || "-"}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className={`rounded-lg p-3 text-xs ${actionType === 'approve' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {actionType === 'approve'
                ? '通过后提现金额将从用户余额中扣除（已预扣），资金将转至用户收款账号。'
                : '拒绝后将返还已预扣的提现金额到用户余额。'}
            </div>
            <div className="space-y-2">
              <Label>备注</Label>
              <Input
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="可选备注"
                className="rounded-xl"
              />
            </div>
            {message && message.type === 'error' && (
              <p className="text-xs text-red-500 bg-red-50 p-2 rounded-lg">{message.text}</p>
            )}
            <button
              className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all active:scale-[0.97] disabled:opacity-50"
              style={{
                background: loading ? '#ccc' : actionType === 'approve' ? '#16A34A' : '#DC2626',
                color: loading ? '#999' : '#fff',
              }}
              onClick={handleAction}
              disabled={loading}
            >
              {loading ? '处理中...' : actionType === 'approve' ? '确认通过' : '确认拒绝'}
            </button>
          </div>
        </DialogContent>
      </Dialog>
      <AdminNotification />
    </div>
  );
}
