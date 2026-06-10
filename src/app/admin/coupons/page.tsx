'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
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
import { AdminNotification } from '@/components/admin-notification';

interface Session { id: string; name: string; start_time: string; end_time: string; is_active: boolean; }
interface Category { id: string; name: string; icon: string; }
interface Coupon {
  id: string; name: string; description: string | null; price: string; original_price: string;
  discount: string | null; total_quantity: number; remaining_quantity: number; sold_count: number;
  session_id: string; category_id: string | null; image_url: string | null; is_active: boolean;
  grab_sessions: { name: string } | null; categories: { name: string } | null;
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [discount, setDiscount] = useState('');
  const [totalQuantity, setTotalQuantity] = useState('');
  const [remainingQuantity, setRemainingQuantity] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const [couponsRes, sessionsRes, catRes] = await Promise.all([
        fetch('/api/admin/coupons'), fetch('/api/admin/sessions'), fetch('/api/categories'),
      ]);
      if (couponsRes.status === 401) { window.location.href = '/admin'; return; }
      if (couponsRes.ok) { const data = await couponsRes.json(); setCoupons(data.coupons || []); }
      if (sessionsRes.ok) { const data = await sessionsRes.json(); setSessions(data.sessions || []); }
      if (catRes.ok) { const data = await catRes.json(); setCategories(data.categories || []); }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'coupons');
      const res = await fetch('/api/admin/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.url) {
        setImageUrl(data.url);
      } else {
        setMessage({ type: 'error', text: data.error || '上传失败' });
      }
    } catch {
      setMessage({ type: 'error', text: '上传失败' });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const resetForm = () => {
    setName(''); setDescription(''); setPrice(''); setOriginalPrice('');
    setDiscount(''); setTotalQuantity(''); setRemainingQuantity('');
    setSessionId(''); setCategoryId(''); setImageUrl(''); setEditId(null);
  };

  const openAdd = () => { resetForm(); setDialogOpen(true); };

  const openEdit = (c: Coupon) => {
    setEditId(c.id);
    setName(c.name);
    setDescription(c.description || '');
    setPrice(c.price);
    setOriginalPrice(c.original_price);
    setDiscount(c.discount || '');
    setTotalQuantity(String(c.total_quantity));
    setRemainingQuantity(String(c.remaining_quantity));
    setSessionId(c.session_id);
    setCategoryId(c.category_id || '');
    setImageUrl(c.image_url || '');
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const body = {
        name, description, price,
        originalPrice: originalPrice || price,
        discount: discount || null,
        totalQuantity: parseInt(totalQuantity),
        remainingQuantity: parseInt(remainingQuantity) || parseInt(totalQuantity),
        sessionId, categoryId: categoryId || null, imageUrl,
      };
      const url = editId ? '/api/admin/coupons' : '/api/admin/coupons';
      const method = editId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editId ? { ...body, id: editId } : body),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setDialogOpen(false);
        resetForm();
        setMessage({ type: 'success', text: editId ? '优惠券已更新' : '优惠券创建成功' });
        fetchData();
      } else {
        setMessage({ type: 'error', text: data.error || '操作失败' });
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
    } catch { /* ignore */ }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除该优惠券吗？')) return;
    try {
      const res = await fetch(`/api/admin/coupons?id=${id}`, { method: 'DELETE' });
      if (res.ok) { setMessage({ type: 'success', text: '优惠券已删除' }); fetchData(); }
    } catch { /* ignore */ }
  };

  return (
    <div className="p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">优惠券管理</h1>
        <Button className="bg-[#1890FF] hover:bg-[#1890FF]/80 text-white" onClick={openAdd}>
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
                  {c.image_url ? (
                    <img src={c.image_url} alt={c.name} className="w-12 h-12 rounded-xl object-cover" />
                  ) : (
                    <div className="w-12 h-12 bg-[#1890FF]/10 rounded-xl flex items-center justify-center">
                      <span className="text-[#1890FF] font-bold text-sm">券</span>
                    </div>
                  )}
                  <div>
                    <h3 className="font-medium text-gray-800">{c.name}</h3>
                    <p className="text-sm text-gray-500">
                      场次：{(c.grab_sessions as unknown as { name: string } | null)?.name || '未知'} ·
                      {c.categories ? ` 分类：${(c.categories as unknown as { name: string }).name} ·` : ''}
                      {' '}价格：¥{parseFloat(c.price).toLocaleString()} ·
                      已售：{c.sold_count || 0} ·
                      剩余：{c.remaining_quantity}/{c.total_quantity}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={c.is_active ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}>
                    {c.is_active ? '上架' : '下架'}
                  </Badge>
                  <Switch checked={c.is_active} onCheckedChange={() => handleToggleActive(c)} />
                  <Button variant="outline" size="sm" onClick={() => openEdit(c)}>编辑</Button>
                  <Button variant="outline" size="sm" className="text-red-500 hover:text-red-700" onClick={() => handleDelete(c.id)}>删除</Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editId ? '编辑优惠券' : '新增优惠券'}</DialogTitle>
            <DialogDescription className="text-gray-500">{editId ? '修改优惠券信息' : '添加新的抢购优惠券'}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2 max-h-[70vh] overflow-y-auto">
            <div className="space-y-2">
              <Label>券名称 *</Label>
              <Input placeholder="如：抖音1000元无门槛优惠券" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>描述</Label>
              <Textarea placeholder="优惠券说明" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>面值/抢购价格 *</Label>
                <Input type="number" step="0.01" placeholder="0.00" value={price} onChange={(e) => setPrice(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>原价</Label>
                <Input type="number" step="0.01" placeholder="0.00" value={originalPrice} onChange={(e) => setOriginalPrice(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>总数量 *</Label>
                <Input type="number" placeholder="100" value={totalQuantity} onChange={(e) => setTotalQuantity(e.target.value)} />
              </div>
              {editId && (
                <div className="space-y-2">
                  <Label>剩余数量</Label>
                  <Input type="number" value={remainingQuantity} onChange={(e) => setRemainingQuantity(e.target.value)} />
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>商品图片</Label>
              <div className="flex items-center gap-3">
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                  {uploading ? '上传中...' : '本地上传'}
                </Button>
                <Input className="flex-1" placeholder="或输入图片链接" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
              </div>
              {imageUrl && (
                <div className="mt-2">
                  <img src={imageUrl} alt="预览" className="w-24 h-24 rounded-lg object-cover border" />
                </div>
              )}
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
            <Button className="w-full bg-[#1890FF] hover:bg-[#1890FF]/80 text-white" onClick={handleSave} disabled={loading || !name || !price || !totalQuantity || !sessionId}>
              {loading ? '保存中...' : editId ? '保存修改' : '创建优惠券'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <AdminNotification />
    </div>
  );
}
