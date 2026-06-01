'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ username: '', realName: '', password: '', confirmPassword: '', registrationCode: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) {
      setError('两次密码不一致');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
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

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FE2C55] to-[#FF6B35] flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-6">
          <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center bg-gradient-to-br from-[#FE2C55] to-[#FF6B35] shadow-lg">
            <span className="text-4xl text-white font-bold">惠</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">注册账号</h1>
          <p className="text-sm text-gray-400 mt-1">抖音电商 · 优惠券抢购平台</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-lg">{error}</div>}
          <input type="text" placeholder="用户名" value={form.username} onChange={(e) => updateField('username', e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FE2C55] text-sm" required />
          <input type="text" placeholder="真实姓名" value={form.realName} onChange={(e) => updateField('realName', e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FE2C55] text-sm" required />
          <input type="password" placeholder="登录密码" value={form.password} onChange={(e) => updateField('password', e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FE2C55] text-sm" required />
          <input type="password" placeholder="确认密码" value={form.confirmPassword} onChange={(e) => updateField('confirmPassword', e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FE2C55] text-sm" required />
          <input type="text" placeholder="注册码" value={form.registrationCode} onChange={(e) => updateField('registrationCode', e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FE2C55] text-sm" required />
          <button type="submit" disabled={loading} className="w-full py-3 bg-gradient-to-r from-[#FE2C55] to-[#FF6B35] text-white font-bold rounded-lg hover:shadow-lg transition-all disabled:opacity-50 active:scale-[0.98]">
            {loading ? '注册中...' : '注 册'}
          </button>
        </form>
        <div className="mt-4 text-center text-sm text-gray-400">
          已有账号？<Link href="/login" className="text-[#FE2C55] font-medium ml-1 hover:underline">去登录</Link>
        </div>
      </div>
    </div>
  );
}
