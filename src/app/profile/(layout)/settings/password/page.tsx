'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';

export default function PasswordPage() {
  const { user } = useAuth();
  const [type, setType] = useState<'login' | 'payment'>('login');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!oldPassword || !newPassword) { alert('请填写完整'); return; }
    setLoading(true);
    try {
      const endpoint = type === 'login' ? '/api/auth/me' : '/api/user/payment-password';
      const body = type === 'login'
        ? { action: 'change_login_password', oldPassword, newPassword }
        : { oldPaymentPassword: oldPassword, newPaymentPassword: newPassword };
      const res = await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.error) { alert(data.error); return; }
      alert('密码修改成功！');
      setOldPassword('');
      setNewPassword('');
    } catch { alert('操作失败'); }
    finally { setLoading(false); }
  };

  return (
    <div className="p-4 md:p-6">
      <h2 className="text-lg font-bold text-gray-800 mb-4">修改密码</h2>
      <div className="flex border-b border-gray-200 mb-4">
        <button onClick={() => setType('login')}
          className={`px-4 py-2 text-sm border-b-2 ${type === 'login' ? 'border-[#FE2C55] text-[#FE2C55]' : 'border-transparent text-gray-500'}`}>
          登录密码
        </button>
        <button onClick={() => setType('payment')}
          className={`px-4 py-2 text-sm border-b-2 ${type === 'payment' ? 'border-[#FE2C55] text-[#FE2C55]' : 'border-transparent text-gray-500'}`}>
          支付密码
        </button>
      </div>
      <div className="space-y-4">
        <div>
          <label className="block text-sm text-gray-600 mb-1">{type === 'login' ? '原登录密码' : '原支付密码'}</label>
          <input type="password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} placeholder={`请输入原${type === 'login' ? '登录' : '支付'}密码`}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#FE2C55]" />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">{type === 'login' ? '新登录密码' : '新支付密码'}</label>
          <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder={`请输入新${type === 'login' ? '登录' : '支付'}密码`}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#FE2C55]" />
        </div>
        <button onClick={handleSubmit} disabled={loading}
          className="w-full py-3 bg-gradient-to-r from-[#FE2C55] to-[#FF6B35] text-white rounded-lg font-medium disabled:opacity-50">
          {loading ? '提交中...' : '确认修改'}
        </button>
      </div>
    </div>
  );
}
