'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Session {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

interface Category {
  id: string;
  name: string;
  icon: string;
}

interface Coupon {
  id: string;
  name: string;
  description: string | null;
  price: string;
  original_price: string;
  discount: string | null;
  total_quantity: number;
  remaining_quantity: number;
  sold_count: number;
  session_id: string;
  category_id: string | null;
  image_url: string | null;
  is_active: boolean;
  grab_sessions: { name: string } | null;
  categories: { name: string } | null;
}

import { AdminNotification } from '@/components/admin-notification';

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [discount, setDiscount] = useState('');
  const [totalQuantity, setTotalQuantity] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const [couponsRes, sessionsRes, catRes] = await Promise.all([
        fetch('/api/admin/coupons'),
        fetch('/api/admin/sessions'),
        fetch('/api/categories'),
      ]);
      if (couponsRes.status === 401) { window.location.href = '/admin'; return; }
      if (couponsRes.ok) {
        const data = await couponsRes.json();
        setCoupons(data.coupons || []);
      }
      if (sessionsRes.ok) {
        const data = await sessionsRes.json();
        setSessions(data.sessions || []);
      }
      if (catRes.ok) {
        const data = await catRes.json();
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
      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name, description, price,
          originalPrice: originalPrice || price,
          discount: discount || null,
          totalQuantity: parseInt(totalQuantity),
          sessionId, categoryId: categoryId || null, imageUrl,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAddOpen(false);
        setName(''); setDescription(''); setPrice(''); setOriginalPrice('');
        setDiscount(''); setTotalQuantity(''); setSessionId(''); setCategoryId(''); setImageUrl('');
        setMessage({ type: 'success', text: '优惠券创建成功' });
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

  const handleToggleActive = async (coupon: Coupon) => {
    try {
      await fetch('/api/admin/coupons', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: coupon.id, isActive: !coupon.is_active }),
      });
      fetchData();
    } catch {
      // ignore
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除该优惠券吗？')) return;
    try {
      const res = await fetch(`/api/admin/coupons?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setMessage({ type: 'success', text: '优惠券已删除' });
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
          <Link href="/admin/coupons" className="block px-3 py-2 bg-gray-800 rounded-lg text-sm font-medium">优惠券管理</Link>
          <Link href="/admin/codes" className="block px-3 py-2 hover:bg-gray-800 rounded-lg text-sm">注册码管理</Link>
          <Link href="/admin/verify" className="block px-3 py-2 hover:bg-gray-800 rounded-lg text-sm">实名审核</Link>
          <Link href="/admin/articles" className="block px-3 py-2 hover:bg-gray-800 rounded-lg text-sm">文章管理</Link>
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
          <h1 className="text-2xl font-bold">优惠券管理</h1>
          <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={() => {
            setName(''); setDescription(''); setPrice(''); setOriginalPrice('');
            setDiscount(''); setTotalQuantity(''); setSessionId(''); setCategoryId(''); setImageUrl('');
            setAddOpen(true);
          }}>
            新增优惠券
          </Button>
        </div>

        {message && (
          <div className={`mb-4 p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {message.text}
          </div>
        )}

        <div className="space-y-3">
          {coupons.length === 0 ? (
            <Card className="border-0 shadow-sm"><CardContent className="py-12 text-center text-gray-400">暂无优惠券</CardContent></Card>
          ) : (
            coupons.map((c) => (
              <Card key={c.id} className="border-0 shadow-sm">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                      <span className="text-red-600 font-bold">券</span>
                    </div>
                    <div>
                      <h3 className="font-medium">{c.name}</h3>
                      <p className="text-sm text-gray-500">
                        场次：{(c.grab_sessions as unknown as { name: string } | null)?.name || '未知'} · 
                        {c.categories ? `分类：${(c.categories as unknown as { name: string }).name} · ` : ''}
                        价格：¥{parseFloat(c.price).toFixed(2)}
                        {c.original_price && parseFloat(c.original_price) > parseFloat(c.price) && (
                          <span className="line-through text-gray-400 ml-1">¥{parseFloat(c.original_price).toFixed(2)}</span>
                        )}
                        {c.discount && <span className="ml-1 text-red-500">({c.discount})</span>} · 
                        已售：{c.sold_count || 0} · 
                        剩余：{c.remaining_quantity}/{c.total_quantity}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={c.is_active ? 'bg-green-500 text-white' : 'bg-gray-400 text-white'}>
                      {c.is_active ? '上架' : '下架'}
                    </Badge>
                    <Switch checked={c.is_active} onCheckedChange={() => handleToggleActive(c)} />
                    <Button variant="outline" size="sm" className="text-red-600" onClick={() => handleDelete(c.id)}>删除</Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Add Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>新增优惠券</DialogTitle>
            <DialogDescription>添加新的抢购优惠券</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>券名称 *</Label>
              <Input placeholder="如：满100减20" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>描述</Label>
              <Textarea placeholder="优惠券说明" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>抢购价格 *</Label>
                <Input type="number" step="0.01" placeholder="0.00" value={price} onChange={(e) => setPrice(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>原价</Label>
                <Input type="number" step="0.01" placeholder="0.00" value={originalPrice} onChange={(e) => setOriginalPrice(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>折扣标签</Label>
                <Input placeholder="如：8折" value={discount} onChange={(e) => setDiscount(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>总数量 *</Label>
                <Input type="number" placeholder="100" value={totalQuantity} onChange={(e) => setTotalQuantity(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>图片链接</Label>
                <Input placeholder="https://..." value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>所属场次 *</Label>
                <Select value={sessionId} onValueChange={setSessionId}>
                  <SelectTrigger><SelectValue placeholder="请选择场次" /></SelectTrigger>
                  <SelectContent>
                    {sessions.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name} ({s.start_time}-{s.end_time})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>分类</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger><SelectValue placeholder="请选择分类" /></SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.icon} {cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button className="w-full bg-red-600 hover:bg-red-700 text-white" onClick={handleAdd} disabled={loading || !name || !price || !totalQuantity || !sessionId}>
              {loading ? '创建中...' : '创建优惠券'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <AdminNotification />
    </div>
  );
}
