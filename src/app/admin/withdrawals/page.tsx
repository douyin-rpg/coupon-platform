'use client';

import { useEffect, useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface WithdrawalUser {
  username: string;
  real_name: string;
}

interface Withdrawal {
  id: string;
  user_id: string;
  amount: string;
  fee: string | null;
  actual_amount: string | null;
  user_ip: string | null;
  bank_name: string | null;
  bank_card_number: string | null;
  bank_account_name: string | null;
  status: string;
  admin_note: string | null;
  created_at: string;
  processed_at: string | null;
  users: WithdrawalUser | null;
}

const STATUS: Record<string, { label: string; dot: string; text: string; badge: string }> = {
  pending: { label: '待审核', dot: 'bg-amber-400', text: 'text-amber-600', badge: 'bg-amber-50 border-amber-200' },
  approved: { label: '已通过', dot: 'bg-green-500', text: 'text-green-600', badge: 'bg-green-50 border-green-200' },
  rejected: { label: '已拒绝', dot: 'bg-red-500', text: 'text-red-600', badge: 'bg-red-50 border-red-200' },
};

export default function AdminWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
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
    if (actionType === 'reject' && !adminNote.trim()) {
      setMessage({ type: 'error', text: '拒绝提现时必须填写原因，用户将看到该原因' });
      return;
    }
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
          text: actionType === 'approve' ? '已通过，资金将打款至用户收款账号' : '已拒绝，已退还余额并告知用户原因',
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

  const pendingCount = withdrawals.filter(w => w.status === 'pending').length;
  const fmtTime = (t: string) => new Date(t).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  const fmtDate = (t: string) => new Date(t).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });

  const toAmount = (w: Withdrawal): number => {
    if (w.actual_amount != null && w.actual_amount !== '') return parseFloat(w.actual_amount);
    const amount = parseFloat(w.amount);
    const fee = parseFloat(w.fee || '0');
    return Math.round((amount - fee) * 100) / 100;
  };
  const toFee = (w: Withdrawal): string => w.fee || '0.00';

  const openDetail = (w: Withdrawal) => {
    setSelectedWithdrawal(w);
    setDetailOpen(true);
  };

  const openAction = (w: Withdrawal, type: 'approve' | 'reject') => {
    setSelectedWithdrawal(w);
    setActionType(type);
    setAdminNote('');
    setActionOpen(true);
    setDetailOpen(false);
  };

  return (
    <div className="p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">提现审核</h1>
        <span className="bg-amber-500 text-white text-xs px-2 py-1 rounded-full">{pendingCount} 条待审核</span>
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-left">
                <th className="px-4 py-3 text-xs font-medium text-gray-500">申请日期</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500">用户名</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500">提现金额</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500">收款账户</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500">用户IP</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500">审核日期</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500">审核状态</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500">操作</th>
              </tr>
            </thead>
            <tbody>
              {withdrawals.map((w) => {
                const st = STATUS[w.status] || { label: w.status, dot: 'bg-gray-400', text: 'text-gray-500', badge: 'bg-gray-50 border-gray-200' };
                const amount = toAmount(w);
                const fee = toFee(w);
                const userInfo = w.users as unknown as WithdrawalUser | null;
                return (
                  <tr key={w.id} className="border-b border-gray-50 hover:bg-gray-50/60 transition cursor-pointer" onClick={() => openDetail(w)}>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{fmtTime(w.created_at)}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-800">{userInfo?.real_name || '-'}<span className="text-gray-400 font-normal ml-1">({userInfo?.username || '-'})</span></td>
                    <td className="px-4 py-3">
                      <div className="text-[15px] font-bold tabular-nums text-[#FE2C55]">¥{amount.toFixed(2)}</div>
                      <div className="text-[11px] text-gray-400 tabular-nums">(已扣: {fee})</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs text-gray-600">
                        <div>【类型】{w.bank_name || '-'}</div>
                        <div className="font-mono">【帐号】{w.bank_card_number || '-'}</div>
                        <div>【姓名】{w.bank_account_name || userInfo?.real_name || '-'}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-gray-500">{w.user_ip || '-'}</td>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{w.processed_at ? fmtDate(w.processed_at) : '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full border ${st.badge} ${st.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                        {st.label}
                      </span>
                    </td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      {w.status === 'pending' && (
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => openAction(w, 'approve')}
                            className="text-xs text-white bg-green-500 hover:bg-green-600 px-2.5 py-1 rounded-lg transition"
                          >
                            通过
                          </button>
                          <button
                            onClick={() => openAction(w, 'reject')}
                            className="text-xs text-white bg-red-500 hover:bg-red-600 px-2.5 py-1 rounded-lg transition"
                          >
                            拒绝
                          </button>
                        </div>
                      )}
                      {w.status !== 'pending' && (
                        <span className="text-xs text-gray-300">已处理</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {withdrawals.length === 0 && (
          <div className="py-12 text-center text-gray-400">暂无提现申请</div>
        )}
      </div>

      {/* 详情弹窗 */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>提现申请详情</DialogTitle>
            <DialogDescription>
              {(selectedWithdrawal?.users as unknown as WithdrawalUser | null)?.username || ''} 的提现申请
            </DialogDescription>
          </DialogHeader>
          {selectedWithdrawal && (
            <div className="space-y-3 py-2 text-sm">
              <div className="grid grid-cols-3 gap-3 bg-gray-50 rounded-lg p-3">
                <div>
                  <p className="text-xs text-gray-400">申请金额</p>
                  <p className="font-bold tabular-nums text-[#FE2C55]">¥{parseFloat(selectedWithdrawal.amount).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">手续费</p>
                  <p className="font-bold tabular-nums text-gray-600">¥{toFee(selectedWithdrawal)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">实际到账</p>
                  <p className="font-bold tabular-nums text-green-600">¥{toAmount(selectedWithdrawal).toFixed(2)}</p>
                </div>
              </div>
              <div className="text-xs text-gray-600 space-y-1">
                <p><span className="text-gray-400">开户名：</span>{selectedWithdrawal.bank_account_name || '-'}</p>
                <p><span className="text-gray-400">开户银行：</span>{selectedWithdrawal.bank_name || '-'}</p>
                <p><span className="text-gray-400">银行卡号：</span><span className="font-mono">{selectedWithdrawal.bank_card_number || '-'}</span></p>
                <p><span className="text-gray-400">用户IP：</span>{selectedWithdrawal.user_ip || '-'}</p>
                <p><span className="text-gray-400">申请时间：</span>{fmtDate(selectedWithdrawal.created_at)}</p>
                {selectedWithdrawal.processed_at && <p><span className="text-gray-400">审核时间：</span>{fmtDate(selectedWithdrawal.processed_at)}</p>}
              </div>
              {selectedWithdrawal.admin_note && (
                <div className="bg-orange-50 border border-orange-100 rounded-lg p-3 text-xs text-orange-700">
                  审核备注/拒绝原因：{selectedWithdrawal.admin_note}
                </div>
              )}
              {selectedWithdrawal.status === 'pending' && (
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => openAction(selectedWithdrawal, 'approve')}
                    className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-green-500 hover:bg-green-600 transition active:scale-[0.97]"
                  >
                    通过
                  </button>
                  <button
                    onClick={() => openAction(selectedWithdrawal, 'reject')}
                    className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-red-500 hover:bg-red-600 transition active:scale-[0.97]"
                  >
                    拒绝
                  </button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 审核操作弹窗 */}
      <Dialog open={actionOpen} onOpenChange={setActionOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>{actionType === 'approve' ? '通过提现申请' : '拒绝提现申请'}</DialogTitle>
            <DialogDescription>
              {selectedWithdrawal && (
                <span>
                  用户 {(selectedWithdrawal.users as unknown as WithdrawalUser | null)?.real_name} 申请提现
                  <span className="font-bold text-[#FE2C55]"> ¥{parseFloat(selectedWithdrawal.amount).toFixed(2)}</span>
                  （实际到账 <span className="font-bold text-green-600">¥{toAmount(selectedWithdrawal).toFixed(2)}</span>）
                  至 <span className="font-mono">{selectedWithdrawal.bank_card_number || '-'}</span>（{selectedWithdrawal.bank_name}）
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className={`rounded-lg p-3 text-xs ${actionType === 'approve' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {actionType === 'approve'
                ? '通过后按“实际到账金额”打款至用户收款账号，手续费由平台收取，资金明细将标记到账。'
                : '拒绝后将返还已预扣的提现金额（含手续费）到用户余额，请填写原因告知用户。'}
            </div>
            <div className="space-y-2">
              <Label>{actionType === 'approve' ? '备注（可选）' : '拒绝原因（必填，用户可见）'}</Label>
              <Input
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder={actionType === 'reject' ? '请填写拒绝原因，例如：账户信息有误' : '可选备注'}
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
    </div>
  );
}