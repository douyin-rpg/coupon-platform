'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';

export default function BankPage() {
  const { user, refreshUser } = useAuth();
  const [paymentAccount, setPaymentAccount] = useState(user?.paymentAccount || '');
  const [payPassword, setPayPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleBind = async () => {
    if (!paymentAccount) { alert('请输入收款账号'); return; }
    if (!payPassword) { alert('请输入支付密码'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/user/payment-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentAccount, paymentPassword: payPassword }),
      });
      const data = await res.json();
      if (data.error) { alert(data.error); return; }
      alert('收款账号绑定成功！');
      setPayPassword('');
      refreshUser?.();
    } catch { alert('操作失败'); }
    finally { setLoading(false); }
  };

  return (
    <div className="p-4 md:p-6">
      <h2 className="text-lg font-bold text-gray-800 mb-4">收款账号</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm text-gray-600 mb-1">收款账号</label>
          <input type="text" value={paymentAccount} onChange={e => setPaymentAccount(e.target.value)} placeholder="请输入支付宝/微信/银行卡号"
            className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#FE2C55]" />
          <p className="text-xs text-gray-400 mt-1">支持支付宝账号、微信号、银行卡号等</p>
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">支付密码验证</label>
          <input type="password" value={payPassword} onChange={e => setPayPassword(e.target.value)} placeholder="请输入支付密码以确认"
            className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#FE2C55]" />
        </div>
        <button onClick={handleBind} disabled={loading}
          className="w-full py-3 bg-gradient-to-r from-[#FE2C55] to-[#FF6B35] text-white rounded-lg font-medium disabled:opacity-50">
          {loading ? '提交中...' : user?.paymentAccount ? '更新绑定' : '确认绑定'}
        </button>
      </div>
    </div>
  );
}
