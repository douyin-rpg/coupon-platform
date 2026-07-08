'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { HeadphoneIcon } from '@/components/icons';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [realName, setRealName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [payPassword, setPayPassword] = useState('');
  const [confirmPayPassword, setConfirmPayPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [customerServiceUrl, setCustomerServiceUrl] = useState('/');

  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(d => {
      if (d.settings?.customer_service_url) setCustomerServiceUrl(d.settings.customer_service_url);
    }).catch(() => {});
  }, []);

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
    <div className="min-h-screen bg-gradient-to-b from-[#0A1628] via-[#132742] to-[#F5F7FA] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Floating orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute w-64 h-64 rounded-full opacity-20 blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(0,212,255,0.4) 0%, rgba(0,212,255,0) 70%)', top: '5%', right: '15%', animation: 'float-orb-1 8s ease-in-out infinite' }} />
        <div className="absolute w-48 h-48 rounded-full opacity-15 blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(123,97,255,0.4) 0%, rgba(123,97,255,0) 70%)', bottom: '20%', left: '10%', animation: 'float-orb-2 10s ease-in-out infinite' }} />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="mx-auto mb-4 flex justify-center">
            <Image src="/images/logo.png" alt="抖音电商" width={160} height={42} className="h-10 w-auto" priority />
          </div>
          <h1 className="text-2xl font-bold text-white">注册账号</h1>
        </div>

        {/* Register Form */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-6">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">用户名</label>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)}
                placeholder="请输入用户名" required
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1890FF]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">真实姓名</label>
              <input type="text" value={realName} onChange={(e) => setRealName(e.target.value)}
                placeholder="请输入真实姓名" required
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1890FF]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">登录密码</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入登录密码(至少6位)" required
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1890FF]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">确认登录密码</label>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="请再次输入登录密码" required
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1890FF]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">支付密码</label>
              <input type="password" value={payPassword} onChange={(e) => setPayPassword(e.target.value)}
                placeholder="请输入支付密码(至少6位)" required
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1890FF]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">确认支付密码</label>
              <input type="password" value={confirmPayPassword} onChange={(e) => setConfirmPayPassword(e.target.value)}
                placeholder="请再次输入支付密码" required
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1890FF]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">注册码</label>
              <input type="text" value={inviteCode} onChange={(e) => setInviteCode(e.target.value)}
                placeholder="请输入注册码" required
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1890FF]" />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-2.5 rounded-xl">{error}</div>
            )}

            <button type="submit" disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-[#1890FF] to-[#00D4FF] text-white rounded-xl text-sm font-bold disabled:opacity-50 transition-all active:scale-[0.97] hover:shadow-lg">
              {loading ? '注册中...' : '注册'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <span className="text-sm text-gray-500">已有账号？</span>
            <Link href="/login" className="text-sm text-[#1890FF] font-medium ml-1">去登录</Link>
          </div>

          <div className="mt-3 text-center">
            <a href={customerServiceUrl} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-[#1890FF]/70 hover:text-[#1890FF] transition-colors">
              <HeadphoneIcon className="w-4 h-4" />
              在线客服
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
