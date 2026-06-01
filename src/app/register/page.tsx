'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [realName, setRealName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [registrationCode, setRegistrationCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('两次密码输入不一致');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, realName, password, registrationCode }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        router.push('/');
      } else {
        setError(data.error || '注册失败');
      }
    } catch {
      setError('网络错误');
    } finally {
      setLoading(false);
    }
  };

  const isValid = username.length >= 3 && realName && password.length >= 6 && password === confirmPassword && registrationCode;

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #FE2C55, #FF6B35)' }}>
            <span className="text-3xl text-white font-bold">惠</span>
          </div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">创建账户</h1>
          <p className="text-sm text-gray-400 mt-1">注册您的抢券账户</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <form onSubmit={handleRegister} className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-sm text-gray-600">用户名</Label>
              <Input
                placeholder="3-50个字符"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                minLength={3}
                maxLength={50}
                className="rounded-xl h-11"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm text-gray-600">真实姓名</Label>
              <Input
                placeholder="请输入真实姓名"
                value={realName}
                onChange={(e) => setRealName(e.target.value)}
                required
                className="rounded-xl h-11"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm text-gray-600">登录密码</Label>
              <Input
                type="password"
                placeholder="至少6位"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="rounded-xl h-11"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm text-gray-600">确认密码</Label>
              <Input
                type="password"
                placeholder="请再次输入密码"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="rounded-xl h-11"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm text-gray-600">注册码</Label>
              <Input
                placeholder="请输入注册码"
                value={registrationCode}
                onChange={(e) => setRegistrationCode(e.target.value)}
                required
                className="rounded-xl h-11"
              />
              <p className="text-[10px] text-gray-400">注册码由管理员发放</p>
            </div>
            {error && <p className="text-xs text-red-500 bg-red-50 p-2.5 rounded-xl">{error}</p>}
            <button
              type="submit"
              className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all active:scale-[0.97] disabled:opacity-50"
              style={{
                background: (loading || !isValid) ? '#ccc' : 'linear-gradient(135deg, #FE2C55, #FF6B35)',
                color: (loading || !isValid) ? '#999' : '#fff',
              }}
              disabled={loading || !isValid}
            >
              {loading ? '注册中...' : '注册'}
            </button>
          </form>
          <p className="text-center text-sm text-gray-400 mt-4">
            已有账户？{' '}
            <Link href="/login" className="text-[#FE2C55] font-medium">
              立即登录
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
