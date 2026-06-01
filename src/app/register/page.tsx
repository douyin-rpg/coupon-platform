'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-amber-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader className="text-center pb-2">
          <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <span className="text-3xl text-white font-bold">惠</span>
          </div>
          <CardTitle className="text-2xl font-bold">注册</CardTitle>
          <p className="text-sm text-gray-500 mt-1">创建您的抢券账户</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">用户名</Label>
              <Input
                id="username"
                placeholder="3-50个字符"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                minLength={3}
                maxLength={50}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="realName">真实姓名</Label>
              <Input
                id="realName"
                placeholder="请输入真实姓名"
                value={realName}
                onChange={(e) => setRealName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">登录密码</Label>
              <Input
                id="password"
                type="password"
                placeholder="至少6位"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">确认密码</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="再次输入密码"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="registrationCode">注册码</Label>
              <Input
                id="registrationCode"
                placeholder="请输入注册码"
                value={registrationCode}
                onChange={(e) => setRegistrationCode(e.target.value)}
                required
              />
              <p className="text-xs text-gray-400">注册码由管理员提供</p>
            </div>
            {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>}
            <Button
              type="submit"
              className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold"
              disabled={loading}
            >
              {loading ? '注册中...' : '注册'}
            </Button>
          </form>
          <p className="text-center text-sm text-gray-500 mt-4">
            已有账户？{' '}
            <Link href="/login" className="text-red-600 hover:underline font-medium">
              立即登录
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
