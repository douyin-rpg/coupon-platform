'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { AdminNotification } from '@/components/admin-notification';

interface Category {
  id: string;
  name: string;
  icon: string;
  sort_order: number;
  is_active: boolean;
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('');
  const [sortOrder, setSortOrder] = useState('0');

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || []);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAdd = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, icon, sortOrder: parseInt(sortOrder) || 0 }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAddOpen(false);
        setName(''); setIcon(''); setSortOrder('0');
        setMessage({ type: 'success', text: '分类创建成功' });
        fetchData();
      } else {
        setMessage({ type: 'error', text: data.error || '创建失败' });
      }
    } catch {
      setMessage({ type: 'error', text: '网络错误' });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (cat: Category) => {
    try {
      await fetch('/api/admin/categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: cat.id, isActive: !cat.is_active }),
      });
      fetchData();
    } catch {
      // ignore
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除该分类吗？')) return;
    try {
      const res = await fetch(`/api/admin/categories?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setMessage({ type: 'success', text: '分类已删除' });
        fetchData();
      }
    } catch {
      // ignore
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="fixed left-0 top-0 bottom-0 w-56 bg-gradient-to-b from-[#0A1628] to-[#132742] text-white p-4">
        <h2 className="text-lg font-bold mb-6">管理后台</h2>
        <nav className="space-y-1">
          <Link href="/admin/sessions" className="block px-3 py-2 hover:bg-gray-800 rounded-lg text-sm">场次管理</Link>
          <Link href="/admin/coupons" className="block px-3 py-2 hover:bg-gray-800 rounded-lg text-sm">优惠券管理</Link>
          <Link href="/admin/codes" className="block px-3 py-2 hover:bg-gray-800 rounded-lg text-sm">注册码管理</Link>
          <Link href="/admin/verify" className="block px-3 py-2 hover:bg-gray-800 rounded-lg text-sm">实名审核</Link>
          <Link href="/admin/articles" className="block px-3 py-2 hover:bg-gray-800 rounded-lg text-sm">文章管理</Link>
          <Link href="/admin/redemptions" className="block px-3 py-2 hover:bg-gray-800 rounded-lg text-sm">回兑审核</Link>
          <Link href="/admin/orders" className="block px-3 py-2 hover:bg-gray-800 rounded-lg text-sm">订单管理</Link>
          <Link href="/admin/users" className="block px-3 py-2 hover:bg-gray-800 rounded-lg text-sm">用户管理</Link>
          <Link href="/admin/withdrawals" className="block px-3 py-2 hover:bg-gray-800 rounded-lg text-sm">提现审核</Link>
          <Link href="/admin/categories" className="block px-3 py-2 bg-gray-800 rounded-lg text-sm font-medium">分类管理</Link>
          <Link href="/admin/banners" className="block px-3 py-2 hover:bg-gray-800 rounded-lg text-sm">轮播图管理</Link>
        </nav>
        <div className="absolute bottom-4 left-4 right-4">
          <Link href="/" className="text-xs text-gray-400 hover:text-gray-200">返回前台</Link>
        </div>
      </div>

      <div className="ml-56 p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">分类管理</h1>
          <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={() => { setName(''); setIcon(''); setSortOrder('0'); setAddOpen(true); }}>
            新增分类
          </Button>
        </div>

        {message && (
          <div className={`mb-4 p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories.map((cat) => (
            <Card key={cat.id} className="border-0 shadow-sm">
              <CardContent className="p-4 text-center">
                <div className="text-3xl mb-2">{cat.icon}</div>
                <h3 className="font-medium">{cat.name}</h3>
                <p className="text-xs text-gray-400 mt-1">排序：{cat.sort_order}</p>
                <div className="flex items-center justify-center gap-2 mt-3">
                  <Switch checked={cat.is_active} onCheckedChange={() => handleToggleActive(cat)} />
                  <Button variant="outline" size="sm" className="text-red-600" onClick={() => handleDelete(cat.id)}>删除</Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {categories.length === 0 && (
            <Card className="border-0 shadow-sm col-span-full"><CardContent className="py-12 text-center text-gray-400">暂无分类</CardContent></Card>
          )}
        </div>
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>新增分类</DialogTitle>
            <DialogDescription>添加优惠券分类</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>分类名称 *</Label>
              <Input placeholder="如：官方优惠券" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>图标（Emoji）</Label>
              <Input placeholder="🎫" value={icon} onChange={(e) => setIcon(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>排序</Label>
              <Input type="number" placeholder="0" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} />
            </div>
            <Button className="w-full bg-red-600 hover:bg-red-700 text-white" onClick={handleAdd} disabled={loading || !name}>
              {loading ? '创建中...' : '创建分类'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <AdminNotification />
    </div>
  );
}
