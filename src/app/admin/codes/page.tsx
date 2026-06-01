'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AdminNotification } from '@/components/admin-notification';

interface RegCode {
  id: string;
  code: string;
  is_used: boolean;
  used_by: string | null;
  created_at: string;
  users: { username: string } | null;
}

export default function AdminCodesPage() {
  const [codes, setCodes] = useState<RegCode[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchCodes = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/codes');
      if (res.status === 401) { window.location.href = '/admin'; return; }
      if (res.ok) {
        const data = await res.json();
        setCodes(data.codes || []);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => { fetchCodes(); }, [fetchCodes]);

  const handleAdd = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: newCode }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAddOpen(false);
        setNewCode('');
        setMessage({ type: 'success', text: '注册码创建成功' });
        fetchCodes();
      } else {
        setMessage({ type: 'error', text: data.error || '创建失败' });
      }
    } catch {
      setMessage({ type: 'error', text: '网络错误' });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewCode(code);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除该注册码吗？')) return;
    try {
      const res = await fetch(`/api/admin/codes?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setMessage({ type: 'success', text: '注册码已删除' });
        fetchCodes();
      }
    } catch {
      // ignore
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="fixed left-0 top-0 bottom-0 w-56 bg-gray-900 text-white p-4">
        <h2 className="text-lg font-bold mb-6">管理后台</h2>
        <nav className="space-y-1">
          <Link href="/admin/sessions" className="block px-3 py-2 hover:bg-gray-800 rounded-lg text-sm">场次管理</Link>
          <Link href="/admin/coupons" className="block px-3 py-2 hover:bg-gray-800 rounded-lg text-sm">优惠券管理</Link>
          <Link href="/admin/codes" className="block px-3 py-2 bg-gray-800 rounded-lg text-sm font-medium">注册码管理</Link>
          <Link href="/admin/redemptions" className="block px-3 py-2 hover:bg-gray-800 rounded-lg text-sm">回兑审核</Link>
          <Link href="/admin/users" className="block px-3 py-2 hover:bg-gray-800 rounded-lg text-sm">用户管理</Link>
          <Link href="/admin/withdrawals" className="block px-3 py-2 hover:bg-gray-800 rounded-lg text-sm">提现审核</Link>
          <Link href="/admin/categories" className="block px-3 py-2 hover:bg-gray-800 rounded-lg text-sm">分类管理</Link>
          <Link href="/admin/banners" className="block px-3 py-2 hover:bg-gray-800 rounded-lg text-sm">轮播图管理</Link>
        </nav>
        <div className="absolute bottom-4 left-4 right-4">
          <Link href="/" className="text-xs text-gray-400 hover:text-gray-200">返回前台</Link>
        </div>
      </div>

      <div className="ml-56 p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">注册码管理</h1>
          <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={() => { setNewCode(''); setAddOpen(true); }}>
            新增注册码
          </Button>
        </div>

        {message && (
          <div className={`mb-4 p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {message.text}
          </div>
        )}

        <div className="space-y-3">
          {codes.length === 0 ? (
            <Card className="border-0 shadow-sm"><CardContent className="py-12 text-center text-gray-400">暂无注册码</CardContent></Card>
          ) : (
            codes.map((c) => (
              <Card key={c.id} className="border-0 shadow-sm">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                      <span className="text-purple-600 font-bold text-sm">码</span>
                    </div>
                    <div>
                      <p className="font-mono font-medium text-lg tracking-wider">{c.code}</p>
                      <p className="text-sm text-gray-500">
                        {c.is_used ? `已被 ${(c.users as unknown as { username: string } | null)?.username || '未知用户'} 使用` : '未使用'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={c.is_used ? 'bg-gray-400 text-white' : 'bg-green-500 text-white'}>
                      {c.is_used ? '已使用' : '可用'}
                    </Badge>
                    {!c.is_used && (
                      <Button variant="outline" size="sm" className="text-red-600" onClick={() => handleDelete(c.id)}>删除</Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Add Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>新增注册码</DialogTitle>
            <DialogDescription>创建新的注册码供用户注册使用</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>注册码</Label>
              <div className="flex gap-2">
                <Input placeholder="输入或自动生成注册码" value={newCode} onChange={(e) => setNewCode(e.target.value)} />
                <Button variant="outline" onClick={handleGenerate}>随机生成</Button>
              </div>
            </div>
            <Button className="w-full bg-red-600 hover:bg-red-700 text-white" onClick={handleAdd} disabled={loading || !newCode}>
              {loading ? '创建中...' : '创建注册码'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <AdminNotification />
    </div>
  );
}
