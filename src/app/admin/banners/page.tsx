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

interface Banner {
  id: string;
  image_url: string;
  link_url: string | null;
  title: string | null;
  sort_order: number;
  is_active: boolean;
}

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [title, setTitle] = useState('');
  const [sortOrder, setSortOrder] = useState('0');

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/banners');
      if (res.ok) {
        const data = await res.json();
        setBanners(data.banners || []);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAdd = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/banners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl, linkUrl: linkUrl || null, title: title || null, sortOrder: parseInt(sortOrder) || 0 }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAddOpen(false);
        setImageUrl(''); setLinkUrl(''); setTitle(''); setSortOrder('0');
        setMessage({ type: 'success', text: '轮播图创建成功' });
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

  const handleToggleActive = async (banner: Banner) => {
    try {
      await fetch('/api/admin/banners', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: banner.id, isActive: !banner.is_active }),
      });
      fetchData();
    } catch {
      // ignore
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除该轮播图吗？')) return;
    try {
      const res = await fetch(`/api/admin/banners?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setMessage({ type: 'success', text: '轮播图已删除' });
        fetchData();
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
          <Link href="/admin/codes" className="block px-3 py-2 hover:bg-gray-800 rounded-lg text-sm">注册码管理</Link>
          <Link href="/admin/redemptions" className="block px-3 py-2 hover:bg-gray-800 rounded-lg text-sm">回兑审核</Link>
          <Link href="/admin/users" className="block px-3 py-2 hover:bg-gray-800 rounded-lg text-sm">用户管理</Link>
          <Link href="/admin/withdrawals" className="block px-3 py-2 hover:bg-gray-800 rounded-lg text-sm">提现审核</Link>
          <Link href="/admin/categories" className="block px-3 py-2 hover:bg-gray-800 rounded-lg text-sm">分类管理</Link>
          <Link href="/admin/banners" className="block px-3 py-2 bg-gray-800 rounded-lg text-sm font-medium">轮播图管理</Link>
        </nav>
        <div className="absolute bottom-4 left-4 right-4">
          <Link href="/" className="text-xs text-gray-400 hover:text-gray-200">返回前台</Link>
        </div>
      </div>

      <div className="ml-56 p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">轮播图管理</h1>
          <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={() => { setImageUrl(''); setLinkUrl(''); setTitle(''); setSortOrder('0'); setAddOpen(true); }}>
            新增轮播图
          </Button>
        </div>

        {message && (
          <div className={`mb-4 p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {message.text}
          </div>
        )}

        <div className="space-y-4">
          {banners.map((banner) => (
            <Card key={banner.id} className="border-0 shadow-sm overflow-hidden">
              <CardContent className="p-0">
                <div className="flex">
                  <div className="w-64 h-32 bg-gray-100 flex-shrink-0">
                    <img src={banner.image_url} alt={banner.title || '轮播图'} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 p-4 flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{banner.title || '无标题'}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        排序：{banner.sort_order} · 
                        链接：{banner.link_url || '无'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Switch checked={banner.is_active} onCheckedChange={() => handleToggleActive(banner)} />
                      <Button variant="outline" size="sm" className="text-red-600" onClick={() => handleDelete(banner.id)}>删除</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {banners.length === 0 && (
            <Card className="border-0 shadow-sm"><CardContent className="py-12 text-center text-gray-400">暂无轮播图</CardContent></Card>
          )}
        </div>
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>新增轮播图</DialogTitle>
            <DialogDescription>添加首页轮播图</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>图片链接 *</Label>
              <Input placeholder="https://..." value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>标题</Label>
              <Input placeholder="轮播图标题" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>跳转链接</Label>
              <Input placeholder="https://..." value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>排序</Label>
              <Input type="number" placeholder="0" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} />
            </div>
            <Button className="w-full bg-red-600 hover:bg-red-700 text-white" onClick={handleAdd} disabled={loading || !imageUrl}>
              {loading ? '创建中...' : '创建轮播图'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <AdminNotification />
    </div>
  );
}
