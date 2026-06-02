'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AdminNotification } from '@/components/admin-notification';

export default function AdminLoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        window.location.href = '/admin/sessions';
      } else {
        setError(data.error || '登录失败');
      }
    } catch {
      setError('网络错误');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0A1628] via-[#132742] to-[#0A1628] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Floating orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute w-64 h-64 rounded-full opacity-20 blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(24,144,255,0.4) 0%, rgba(24,144,255,0) 70%)', top: '10%', right: '20%', animation: 'float-orb-1 8s ease-in-out infinite' }} />
        <div className="absolute w-48 h-48 rounded-full opacity-15 blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(123,97,255,0.4) 0%, rgba(123,97,255,0) 70%)', bottom: '15%', left: '15%', animation: 'float-orb-2 10s ease-in-out infinite' }} />
      </div>

      <div className="w-full max-w-sm relative z-10">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex justify-center">
            <Image src="/images/logo.png" alt="抖音电商" width={140} height={36} className="h-9 w-auto brightness-0 invert" priority />
          </div>
          <h1 className="text-2xl font-bold text-white">管理后台</h1>
          <p className="text-sm text-gray-400 mt-1">请输入管理密码登录</p>
        </div>
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm text-gray-300">管理密码</Label>
              <Input
                type="password"
                placeholder="请输入管理密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="rounded-xl h-11 bg-white/10 border-white/20 text-white placeholder:text-gray-500"
              />
            </div>
            {error && <p className="text-xs text-red-400 bg-red-900/30 p-2.5 rounded-xl">{error}</p>}
            <button
              type="submit"
              className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all active:scale-[0.97] disabled:opacity-50 bg-gradient-to-r from-[#1890FF] to-[#00D4FF] hover:shadow-lg hover:shadow-[#1890FF]/25"
              disabled={loading || !password}
            >
              {loading ? '登录中...' : '登录'}
            </button>
          </form>
        </div>
      </div>
      <AdminNotification />
    </div>
  );
}
