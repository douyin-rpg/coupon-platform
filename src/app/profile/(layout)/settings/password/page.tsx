'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';

export default function PasswordPage() {
  const { user } = useAuth();
  const [type, setType] = useState<'login' | 'payment'>('login');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async () => {
    setMessage(null);

    if (!oldPassword || !newPassword || !confirmPassword) {
      setMessage({ type: 'error', text: '请填写完整信息' });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: '新密码至少6位' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: '两次输入的新密码不一致' });
      return;
    }

    if (oldPassword === newPassword) {
      setMessage({ type: 'error', text: '新密码不能与旧密码相同' });
      return;
    }

    setLoading(true);
    try {
      const endpoint = type === 'login' ? '/api/auth/me' : '/api/user/payment-password';
      const body = type === 'login'
        ? { oldPassword, newPassword }
        : { oldPaymentPassword: oldPassword, newPaymentPassword: newPassword };

      const res = await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (data.error) {
        setMessage({ type: 'error', text: data.error });
        return;
      }

      setMessage({ type: 'success', text: `${type === 'login' ? '登录' : '支付'}密码修改成功！` });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      setMessage({ type: 'error', text: '操作失败，请重试' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-md mx-auto">
      <h2 className="text-lg font-bold text-gray-800 mb-4">修改密码</h2>

      {/* Tab 切换 */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => { setType('login'); setMessage(null); }}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
            type === 'login'
              ? 'border-[#1890FF] text-[#1890FF]'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          登录密码
        </button>
        <button
          onClick={() => { setType('payment'); setMessage(null); }}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
            type === 'payment'
              ? 'border-[#1890FF] text-[#1890FF]'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          支付密码
        </button>
      </div>

      {/* 提示信息 */}
      {message && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${
          message.type === 'success'
            ? 'bg-green-50 text-green-700 border border-green-200'
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* 表单 */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm text-gray-600 mb-2">
            原{type === 'login' ? '登录' : '支付'}密码
          </label>
          <input
            type="password"
            value={oldPassword}
            onChange={e => setOldPassword(e.target.value)}
            placeholder={`请输入原${type === 'login' ? '登录' : '支付'}密码`}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1890FF]/20 focus:border-[#1890FF] transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-2">
            新{type === 'login' ? '登录' : '支付'}密码
          </label>
          <input
            type="password"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            placeholder={`请输入新${type === 'login' ? '登录' : '支付'}密码（至少6位）`}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1890FF]/20 focus:border-[#1890FF] transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-2">
            确认新{type === 'login' ? '登录' : '支付'}密码
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            placeholder={`请再次输入新${type === 'login' ? '登录' : '支付'}密码`}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1890FF]/20 focus:border-[#1890FF] transition-colors"
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full py-3 bg-gradient-to-r from-[#1890FF] to-[#00D4FF] text-white rounded-lg font-medium disabled:opacity-50 hover:shadow-lg transition-shadow mt-6"
        >
          {loading ? '提交中...' : '确认修改'}
        </button>
      </div>
    </div>
  );
}
