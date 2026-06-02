'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AdminNotification } from '@/components/admin-notification';

interface User {
  id: string;
  username: string;
  real_name: string;
  verify_status: string;
  bank_bound: boolean;
  bank_account_name: string | null;
  bank_card_number: string | null;
  bank_name: string | null;
  balance: string;
  credit_score: number;
  login_frozen: boolean;
  funds_frozen: boolean;
  register_ip: string | null;
  last_login_ip: string | null;
  last_login_at: string | null;
  is_online: boolean;
  created_at: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [actionOpen, setActionOpen] = useState(false);
  const [actionType, setActionType] = useState<'reset_password' | 'reset_payment_password' | 'add_balance' | 'deduct_balance' | 'update_credit_score'>('reset_password');
  const [newValue, setNewValue] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const refreshUsers = useCallback(async () => {
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

  useEffect(() => { refreshUsers(); }, [refreshUsers]);

  const handleAction = async () => {
    if (!selectedUser || !newValue) return;
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: actionType, newPassword: actionType === 'reset_password' ? newValue : undefined, newPaymentPassword: actionType === 'reset_payment_password' ? newValue : undefined, amount: (actionType === 'add_balance' || actionType === 'deduct_balance') ? newValue : undefined, creditScore: actionType === 'update_credit_score' ? parseInt(newValue) : undefined, note }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMessage({ type: 'success', text: data.message || '操作成功' });
        setActionOpen(false);
        setNewValue('');
        setNote('');
        refreshUsers();
      } else {
        setMessage({ type: 'error', text: data.error || '操作失败' });
      }
    } catch {
      setMessage({ type: 'error', text: '网络错误' });
    } finally {
      setLoading(false);
    }
  };

  const toggleFreeze = async (userId: string, type: 'login_frozen' | 'funds_frozen', currentState: boolean) => {
    try {
      const action = type === 'login_frozen' ? 'toggle_login_freeze' : 'toggle_funds_freeze';
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, [type]: !currentState }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMessage({ type: 'success', text: data.message });
        refreshUsers();
      } else {
        setMessage({ type: 'error', text: data.error || '操作失败' });
      }
    } catch {
      setMessage({ type: 'error', text: '网络错误' });
    }
  };

  const actionLabels: Record<string, { title: string; label: string; placeholder: string; description: string }> = {
    reset_password: { title: '重置登录密码', label: '新登录密码', placeholder: '请输入新密码', description: '重置用户的登录密码' },
    reset_payment_password: { title: '重置支付密码', label: '新支付密码', placeholder: '请输入新支付密码', description: '重置用户的余额支付密码' },
    add_balance: { title: '充值余额', label: '充值金额', placeholder: '请输入充值金额', description: '增加用户余额' },
    deduct_balance: { title: '扣款', label: '扣款金额', placeholder: '请输入扣款金额', description: '从用户余额中扣款' },
    update_credit_score: { title: '修改信用分', label: '信用分', placeholder: '请输入信用分', description: '修改用户信用分' },
  };

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

        <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">用户名</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">姓名</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">状态</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">余额</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">信用分</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">IP</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">在线</th>
                <th className="px-3 py-3 text-right text-xs font-medium text-gray-500">操作</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                  <td className="px-3 py-3 text-sm font-medium">{u.username}</td>
                  <td className="px-3 py-3 text-sm text-gray-600">{u.real_name}</td>
                  <td className="px-3 py-3">
                    <div className="flex flex-col gap-1">
                      {u.verify_status === 'verified' ? (
                        <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full w-fit">已认证</span>
                      ) : u.verify_status === 'pending' ? (
                        <span className="text-xs bg-yellow-50 text-yellow-600 px-2 py-0.5 rounded-full w-fit">审核中</span>
                      ) : (
                        <span className="text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full w-fit">未认证</span>
                      )}
                      <div className="flex gap-1">
                        {u.login_frozen && <span className="text-xs bg-red-50 text-red-600 px-1.5 py-0.5 rounded">登录冻结</span>}
                        {u.funds_frozen && <span className="text-xs bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded">资金冻结</span>}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-sm font-medium tabular-nums">¥{parseFloat(u.balance).toFixed(2)}</td>
                  <td className="px-3 py-3">
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">{u.credit_score ?? 500}</span>
                  </td>
                  <td className="px-3 py-3 text-xs text-gray-400">
                    <div>{u.last_login_ip || '-'}</div>
                    <div className="text-gray-300">注册: {u.register_ip || '-'}</div>
                  </td>
                  <td className="px-3 py-3">
                    {u.is_online ? (
                      <span className="inline-flex items-center gap-1 text-xs text-green-600">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                        在线
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">离线</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-right">
                    <div className="flex gap-1 justify-end flex-wrap">
                      <button
                        onClick={() => { setSelectedUser(u); setDetailOpen(true); }}
                        className="text-xs text-gray-600 hover:text-gray-800 px-2 py-1 hover:bg-gray-100 rounded transition"
                      >
                        详情
                      </button>
                      <button
                        onClick={() => toggleFreeze(u.id, 'login_frozen', u.login_frozen)}
                        className={`text-xs px-2 py-1 rounded transition ${u.login_frozen ? 'text-green-600 hover:bg-green-50' : 'text-red-600 hover:bg-red-50'}`}
                      >
                        {u.login_frozen ? '解冻登录' : '冻结登录'}
                      </button>
                      <button
                        onClick={() => toggleFreeze(u.id, 'funds_frozen', u.funds_frozen)}
                        className={`text-xs px-2 py-1 rounded transition ${u.funds_frozen ? 'text-green-600 hover:bg-green-50' : 'text-orange-600 hover:bg-orange-50'}`}
                      >
                        {u.funds_frozen ? '解冻资金' : '冻结资金'}
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

      {/* User Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-lg rounded-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>用户详情</DialogTitle>
            <DialogDescription>{selectedUser?.username}（{selectedUser?.real_name}）</DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4 py-2 text-sm">
              {/* 基本信息 */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <h4 className="font-semibold text-gray-700">基本信息</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div><span className="text-gray-400">用户名：</span>{selectedUser.username}</div>
                  <div><span className="text-gray-400">真实姓名：</span>{selectedUser.real_name}</div>
                  <div><span className="text-gray-400">余额：</span><span className="font-medium text-[#1890FF]">¥{parseFloat(selectedUser.balance).toFixed(2)}</span></div>
                  <div><span className="text-gray-400">信用分：</span>{selectedUser.credit_score ?? 500}</div>
                  <div><span className="text-gray-400">注册时间：</span>{new Date(selectedUser.created_at).toLocaleString()}</div>
                  <div><span className="text-gray-400">在线状态：</span>
                    {selectedUser.is_online ? (
                      <span className="text-green-600">在线</span>
                    ) : (
                      <span className="text-gray-400">离线</span>
                    )}
                  </div>
                </div>
              </div>

              {/* 认证信息 */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <h4 className="font-semibold text-gray-700">认证信息</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div><span className="text-gray-400">认证状态：</span>
                    {selectedUser.verify_status === 'verified' ? '已认证' : selectedUser.verify_status === 'pending' ? '审核中' : '未认证'}
                  </div>
                  <div><span className="text-gray-400">收款账户：</span>
                    {selectedUser.bank_bound ? `${selectedUser.bank_name} 尾号${selectedUser.bank_card_number?.slice(-4)}` : '未绑定'}
                  </div>
                </div>
              </div>

              {/* IP和登录信息 */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <h4 className="font-semibold text-gray-700">登录信息</h4>
                <div className="grid grid-cols-1 gap-3">
                  <div><span className="text-gray-400">注册IP：</span>{selectedUser.register_ip || '未知'}</div>
                  <div><span className="text-gray-400">最后登录IP：</span>{selectedUser.last_login_ip || '未知'}</div>
                  <div><span className="text-gray-400">最后登录时间：</span>{selectedUser.last_login_at ? new Date(selectedUser.last_login_at).toLocaleString() : '从未登录'}</div>
                </div>
              </div>

              {/* 限制状态 */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <h4 className="font-semibold text-gray-700">限制状态</h4>
                <div className="flex gap-3">
                  <div className={`flex-1 rounded-lg p-3 text-center ${selectedUser.login_frozen ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                    <div className="text-lg font-bold">{selectedUser.login_frozen ? '已冻结' : '正常'}</div>
                    <div className="text-xs mt-1">登录状态</div>
                    <button
                      onClick={() => toggleFreeze(selectedUser.id, 'login_frozen', selectedUser.login_frozen)}
                      className={`mt-2 text-xs px-3 py-1 rounded-lg transition ${selectedUser.login_frozen ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-red-500 text-white hover:bg-red-600'}`}
                    >
                      {selectedUser.login_frozen ? '解冻登录' : '冻结登录'}
                    </button>
                  </div>
                  <div className={`flex-1 rounded-lg p-3 text-center ${selectedUser.funds_frozen ? 'bg-orange-50 text-orange-600' : 'bg-green-50 text-green-600'}`}>
                    <div className="text-lg font-bold">{selectedUser.funds_frozen ? '已冻结' : '正常'}</div>
                    <div className="text-xs mt-1">资金状态</div>
                    <button
                      onClick={() => toggleFreeze(selectedUser.id, 'funds_frozen', selectedUser.funds_frozen)}
                      className={`mt-2 text-xs px-3 py-1 rounded-lg transition ${selectedUser.funds_frozen ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-orange-500 text-white hover:bg-orange-600'}`}
                    >
                      {selectedUser.funds_frozen ? '解冻资金' : '冻结资金'}
                    </button>
                  </div>
                </div>
              </div>

              {/* 快捷操作 */}
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => { setDetailOpen(false); setActionType('reset_password'); setNewValue(''); setActionOpen(true); }} className="p-2 text-xs bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition">重置登录密码</button>
                <button onClick={() => { setDetailOpen(false); setActionType('reset_payment_password'); setNewValue(''); setActionOpen(true); }} className="p-2 text-xs bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 transition">重置支付密码</button>
                <button onClick={() => { setDetailOpen(false); setActionType('add_balance'); setNewValue(''); setActionOpen(true); }} className="p-2 text-xs bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition">充值余额</button>
                <button onClick={() => { setDetailOpen(false); setActionType('deduct_balance'); setNewValue(''); setActionOpen(true); }} className="p-2 text-xs bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition">扣款</button>
                <button onClick={() => { setDetailOpen(false); setActionType('update_credit_score'); setNewValue(String(selectedUser.credit_score ?? 500)); setActionOpen(true); }} className="p-2 text-xs bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition col-span-2">修改信用分</button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

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
            <div className="bg-amber-50 rounded-lg p-3 text-xs text-amber-700">
              {actionLabels[actionType]?.description}
            </div>
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
                background: (loading || !newValue) ? '#ccc' : actionType.includes('deduct') ? '#DC2626' : 'linear-gradient(135deg, #1890FF, #00D4FF)',
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
      <AdminNotification />
    </div>
  );
}
