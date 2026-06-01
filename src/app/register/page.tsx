'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [realName, setRealName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [payPassword, setPayPassword] = useState('');
  const [confirmPayPassword, setConfirmPayPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('登录密码至少6位');
      return;
    }
    if (password !== confirmPassword) {
      setError('两次输入的登录密码不一致');
      return;
    }
    if (payPassword.length < 6) {
      setError('支付密码至少6位');
      return;
    }
    if (payPassword !== confirmPayPassword) {
      setError('两次输入的支付密码不一致');
      return;
    }
    if (!inviteCode) {
      setError('请输入注册码');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          realName,
          password,
          payPassword,
          registrationCode: inviteCode,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        window.location.href = '/login';
      } else {
        setError(data.error || '注册失败');
      }
    } catch {
      setError('网络错误');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center bg-gradient-to-br from-[#FE2C55] to-[#FF6B35]">
            <span className="text-3xl text-white font-bold">惠</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">注册惠抢券</h1>
        </div>

        {/* Register Form */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">用户名</label>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)}
                placeholder="请输入用户名" required
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FE2C55]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">真实姓名</label>
              <input type="text" value={realName} onChange={(e) => setRealName(e.target.value)}
                placeholder="请输入真实姓名" required
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FE2C55]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">登录密码</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入登录密码(至少6位)" required
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FE2C55]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">确认登录密码</label>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="请再次输入登录密码" required
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FE2C55]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">支付密码</label>
              <input type="password" value={payPassword} onChange={(e) => setPayPassword(e.target.value)}
                placeholder="请输入支付密码(至少6位)" required
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FE2C55]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">确认支付密码</label>
              <input type="password" value={confirmPayPassword} onChange={(e) => setConfirmPayPassword(e.target.value)}
                placeholder="请再次输入支付密码" required
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FE2C55]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">注册码</label>
              <input type="text" value={inviteCode} onChange={(e) => setInviteCode(e.target.value)}
                placeholder="请输入注册码" required
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FE2C55]" />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-2.5 rounded-xl">{error}</div>
            )}

            <button type="submit" disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-[#FE2C55] to-[#FF6B35] text-white rounded-xl text-sm font-bold disabled:opacity-50 transition-all active:scale-[0.97]">
              {loading ? '注册中...' : '注册'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <span className="text-sm text-gray-500">已有账号？</span>
            <Link href="/login" className="text-sm text-[#FE2C55] font-medium ml-1">去登录</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
