'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function AdminLoginPage() {
  const router = useRouter();
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
        router.push('/admin/sessions');
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
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center bg-gradient-to-br from-[#FE2C55] to-[#FF6B35]">
            <span className="text-3xl text-white font-bold">管</span>
          </div>
          <h1 className="text-2xl font-bold text-white">管理后台</h1>
          <p className="text-sm text-gray-400 mt-1">请输入管理密码登录</p>
        </div>
        <div className="bg-gray-800 rounded-2xl p-6">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm text-gray-300">管理密码</Label>
              <Input
                type="password"
                placeholder="请输入管理密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="rounded-xl h-11 bg-gray-700 border-gray-600 text-white placeholder:text-gray-500"
              />
            </div>
            {error && <p className="text-xs text-red-400 bg-red-900/30 p-2.5 rounded-xl">{error}</p>}
            <button
              type="submit"
              className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all active:scale-[0.97] disabled:opacity-50"
              style={{
                background: (loading || !password) ? '#4B5563' : 'linear-gradient(135deg, #FE2C55, #FF6B35)',
                color: (loading || !password) ? '#9CA3AF' : '#fff',
              }}
              disabled={loading || !password}
            >
              {loading ? '登录中...' : '登录'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
