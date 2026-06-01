'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';

export default function WithdrawPage() {
  const { user, refreshUser } = useAuth();
  const [amount, setAmount] = useState('');
  const [payPassword, setPayPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleWithdraw = async () => {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) { alert('请输入有效金额'); return; }
    if (!payPassword) { alert('请输入支付密码'); return; }
    if (!user?.isVerified) { alert('请先完成实名认证'); return; }
    if (!user?.paymentAccount) { alert('请先绑定收款账号'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/user/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: numAmount, paymentPassword: payPassword }),
      });
      const data = await res.json();
      if (data.error) { alert(data.error); return; }
      alert('提现申请已提交，等待审核');
      setAmount('');
      setPayPassword('');
      refreshUser?.();
    } catch { alert('操作失败'); }
    finally { setLoading(false); }
  };

  return (
    <div className="p-4 md:p-6">
      <h2 className="text-lg font-bold text-gray-800 mb-4">申请提现</h2>
      <div className="bg-white rounded-xl p-4 mb-4">
        <div className="text-center py-4">
          <p className="text-sm text-gray-500">可用余额</p>
          <p className="text-3xl font-bold text-[#FE2C55] mt-1">¥{user?.balance ? Number(user.balance).toFixed(2) : '0.00'}</p>
        </div>
      </div>

      {!user?.isVerified ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
          <p className="text-yellow-700 text-sm">请先完成实名认证后再申请提现</p>
          <a href="/profile/settings/verify" className="text-[#FE2C55] text-sm mt-2 inline-block">去认证 →</a>
        </div>
      ) : !user?.paymentAccount ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
          <p className="text-yellow-700 text-sm">请先绑定收款账号后再申请提现</p>
          <a href="/profile/settings/bank" className="text-[#FE2C55] text-sm mt-2 inline-block">去绑定 →</a>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">提现金额</label>
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="请输入提现金额"
              className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#FE2C55]" />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">支付密码</label>
            <input type="password" value={payPassword} onChange={e => setPayPassword(e.target.value)} placeholder="请输入支付密码"
              className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#FE2C55]" />
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500">提现到：<span className="text-gray-700">{user.paymentAccount}</span></p>
          </div>
          <button onClick={handleWithdraw} disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-[#FE2C55] to-[#FF6B35] text-white rounded-lg font-medium disabled:opacity-50">
            {loading ? '提交中...' : '确认提现'}
          </button>
        </div>
      )}
    </div>
  );
}
