'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader className="text-center pb-2">
          <div className="w-16 h-16 bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <span className="text-3xl text-white font-bold">管</span>
          </div>
          <CardTitle className="text-2xl font-bold">管理后台</CardTitle>
          <p className="text-sm text-gray-500 mt-1">请输入管理密码登录</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="adminPassword">管理密码</Label>
              <Input
                id="adminPassword"
                type="password"
                placeholder="请输入管理密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <p className="text-xs text-gray-400">默认密码：admin123</p>
            </div>
            {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>}
            <Button type="submit" className="w-full bg-gray-800 hover:bg-gray-900 text-white font-semibold" disabled={loading}>
              {loading ? '登录中...' : '登录'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
