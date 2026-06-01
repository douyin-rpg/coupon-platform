'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface User {
  id: string;
  username: string;
  real_name: string;
  is_verified: boolean;
  payment_account: string | null;
  balance: string;
  created_at: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [actionOpen, setActionOpen] = useState(false);
  const [actionType, setActionType] = useState<'reset_password' | 'reset_payment_password' | 'add_balance' | 'deduct_balance'>('reset_password');
  const [newValue, setNewValue] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/users');
      if (res.status === 401) { window.location.href = '/admin'; return; }
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleAction = async () => {
    if (!selectedUser || !newValue) return;
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: actionType, newPassword: actionType === 'reset_password' ? newValue : undefined, newPaymentPassword: actionType === 'reset_payment_password' ? newValue : undefined, amount: (actionType === 'add_balance' || actionType === 'deduct_balance') ? newValue : undefined, note }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMessage({ type: 'success', text: data.message || '操作成功' });
        setActionOpen(false);
        setNewValue('');
        setNote('');
        fetchUsers();
      } else {
        setMessage({ type: 'error', text: data.error || '操作失败' });
      }
    } catch {
      setMessage({ type: 'error', text: '网络错误' });
    } finally {
      setLoading(false);
    }
  };

  const actionLabels: Record<string, { title: string; label: string; placeholder: string; description: string }> = {
    reset_password: { title: '重置登录密码', label: '新登录密码', placeholder: '请输入新密码', description: '重置用户的登录密码' },
    reset_payment_password: { title: '重置支付密码', label: '新支付密码', placeholder: '请输入新支付密码', description: '重置用户的余额支付密码' },
    add_balance: { title: '充值余额', label: '充值金额', placeholder: '请输入充值金额', description: '增加用户余额' },
    deduct_balance: { title: '扣款', label: '扣款金额', placeholder: '请输入扣款金额', description: '从用户余额中扣款' },
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="fixed left-0 top-0 bottom-0 w-56 bg-gray-900 text-white p-4">
        <h2 className="text-lg font-bold mb-6">管理后台</h2>
        <nav className="space-y-1">
          <Link href="/admin/sessions" className="block px-3 py-2 hover:bg-gray-800 rounded-lg text-sm">场次管理</Link>
          <Link href="/admin/coupons" className="block px-3 py-2 hover:bg-gray-800 rounded-lg text-sm">优惠券管理</Link>
          <Link href="/admin/codes" className="block px-3 py-2 hover:bg-gray-800 rounded-lg text-sm">注册码管理</Link>
          <Link href="/admin/users" className="block px-3 py-2 bg-gray-800 rounded-lg text-sm font-medium">用户管理</Link>
          <Link href="/admin/redemptions" className="block px-3 py-2 hover:bg-gray-800 rounded-lg text-sm">回兑审核</Link>
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
          <h1 className="text-2xl font-bold">用户管理</h1>
          <span className="text-sm text-gray-500">共 {users.length} 位用户</span>
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
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">用户名</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">真实姓名</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">认证状态</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">收款账号</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">余额</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">注册时间</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">操作</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                  <td className="px-4 py-3 text-sm font-medium">{u.username}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{u.real_name}</td>
                  <td className="px-4 py-3">
                    {u.is_verified ? (
                      <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full">已认证</span>
                    ) : (
                      <span className="text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">未认证</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{u.payment_account || '-'}</td>
                  <td className="px-4 py-3 text-sm font-medium tabular-nums">¥{parseFloat(u.balance).toFixed(2)}</td>
                  <td className="px-4 py-3 text-xs text-gray-400">{new Date(u.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex gap-1 justify-end">
                      <button
                        onClick={() => { setSelectedUser(u); setActionType('reset_password'); setNewValue(''); setActionOpen(true); }}
                        className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 hover:bg-blue-50 rounded transition"
                      >
                        重置密码
                      </button>
                      <button
                        onClick={() => { setSelectedUser(u); setActionType('reset_payment_password'); setNewValue(''); setActionOpen(true); }}
                        className="text-xs text-amber-600 hover:text-amber-800 px-2 py-1 hover:bg-amber-50 rounded transition"
                      >
                        重置支付密码
                      </button>
                      <button
                        onClick={() => { setSelectedUser(u); setActionType('add_balance'); setNewValue(''); setActionOpen(true); }}
                        className="text-xs text-green-600 hover:text-green-800 px-2 py-1 hover:bg-green-50 rounded transition"
                      >
                        充值
                      </button>
                      <button
                        onClick={() => { setSelectedUser(u); setActionType('deduct_balance'); setNewValue(''); setActionOpen(true); }}
                        className="text-xs text-red-600 hover:text-red-800 px-2 py-1 hover:bg-red-50 rounded transition"
                      >
                        扣款
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && (
            <div className="py-12 text-center text-gray-400">暂无注册用户</div>
          )}
        </div>
      </div>

      {/* Action Dialog */}
      <Dialog open={actionOpen} onOpenChange={setActionOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>{actionLabels[actionType]?.title}</DialogTitle>
            <DialogDescription>
              用户：{selectedUser?.username}（{selectedUser?.real_name}） · 当前余额：¥{selectedUser ? parseFloat(selectedUser.balance).toFixed(2) : '0.00'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {(actionType === 'add_balance' || actionType === 'deduct_balance') && (
              <div className="bg-amber-50 rounded-lg p-3 text-xs text-amber-700">
                {actionType === 'add_balance' ? '充值将直接增加用户余额' : '扣款将从用户余额中减少，余额不足时无法扣款'}
              </div>
            )}
            <div className="space-y-2">
              <Label>{actionLabels[actionType]?.label}</Label>
              <Input
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                placeholder={actionLabels[actionType]?.placeholder}
                className="rounded-xl"
              />
            </div>
            {(actionType === 'add_balance' || actionType === 'deduct_balance') && (
              <div className="space-y-2">
                <Label>备注</Label>
                <Input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="可选备注"
                  className="rounded-xl"
                />
              </div>
            )}
            {message && message.type === 'error' && (
              <p className="text-xs text-red-500 bg-red-50 p-2 rounded-lg">{message.text}</p>
            )}
            <button
              className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all active:scale-[0.97] disabled:opacity-50"
              style={{
                background: (loading || !newValue) ? '#ccc' : actionType.includes('deduct') ? '#DC2626' : 'linear-gradient(135deg, #FE2C55, #FF6B35)',
                color: (loading || !newValue) ? '#999' : '#fff',
              }}
              onClick={handleAction}
              disabled={loading || !newValue}
            >
              {loading ? '处理中...' : '确认'}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
