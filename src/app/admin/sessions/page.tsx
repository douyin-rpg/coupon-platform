'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { AdminNotification } from '@/components/admin-notification';

interface Session {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
  created_at: string;
}

export default function AdminSessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editSession, setEditSession] = useState<Session | null>(null);
  const [name, setName] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/sessions');
      if (res.status === 401) {
        window.location.href = '/admin';
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleAdd = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, startTime, endTime }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAddOpen(false);
        setName('');
        setStartTime('');
        setEndTime('');
        setMessage({ type: 'success', text: '场次创建成功' });
        fetchSessions();
      } else {
        setMessage({ type: 'error', text: data.error || '创建失败' });
      }
    } catch {
      setMessage({ type: 'error', text: '网络错误' });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!editSession) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/sessions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editSession.id, name, startTime, endTime }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setEditOpen(false);
        setMessage({ type: 'success', text: '场次更新成功' });
        fetchSessions();
      } else {
        setMessage({ type: 'error', text: data.error || '更新失败' });
      }
    } catch {
      setMessage({ type: 'error', text: '网络错误' });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (session: Session) => {
    try {
      const res = await fetch('/api/admin/sessions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: session.id, isActive: !session.is_active }),
      });
      if (res.ok) {
        fetchSessions();
      }
    } catch {
      // ignore
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除该场次吗？')) return;
    try {
      const res = await fetch(`/api/admin/sessions?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setMessage({ type: 'success', text: '场次已删除' });
        fetchSessions();
      }
    } catch {
      // ignore
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="fixed left-0 top-0 bottom-0 w-56 bg-gray-900 text-white p-4">
        <h2 className="text-lg font-bold mb-6">管理后台</h2>
        <nav className="space-y-1">
          <Link href="/admin/sessions" className="block px-3 py-2 bg-gray-800 rounded-lg text-sm font-medium">场次管理</Link>
          <Link href="/admin/coupons" className="block px-3 py-2 hover:bg-gray-800 rounded-lg text-sm">优惠券管理</Link>
          <Link href="/admin/codes" className="block px-3 py-2 hover:bg-gray-800 rounded-lg text-sm">注册码管理</Link>
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
          <h1 className="text-2xl font-bold">场次管理</h1>
          <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={() => { setName(''); setStartTime(''); setEndTime(''); setAddOpen(true); }}>
            新增场次
          </Button>
        </div>

        {message && (
          <div className={`mb-4 p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {message.text}
          </div>
        )}

        <div className="space-y-3">
          {sessions.length === 0 ? (
            <Card className="border-0 shadow-sm"><CardContent className="py-12 text-center text-gray-400">暂无场次，请点击新增</CardContent></Card>
          ) : (
            sessions.map((s) => (
              <Card key={s.id} className="border-0 shadow-sm">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div>
                      <h3 className="font-medium">{s.name}</h3>
                      <p className="text-sm text-gray-500">{s.start_time} - {s.end_time}</p>
                    </div>
                    <Badge className={s.is_active ? 'bg-green-500 text-white' : 'bg-gray-400 text-white'}>
                      {s.is_active ? '已启用' : '已禁用'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Switch checked={s.is_active} onCheckedChange={() => handleToggleActive(s)} />
                    </div>
                    <Button variant="outline" size="sm" onClick={() => {
                      setEditSession(s);
                      setName(s.name);
                      setStartTime(s.start_time);
                      setEndTime(s.end_time);
                      setEditOpen(true);
                    }}>编辑</Button>
                    <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700" onClick={() => handleDelete(s.id)}>删除</Button>
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
            <DialogTitle>新增场次</DialogTitle>
            <DialogDescription>设置抢券场次的名称和时间段</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>场次名称</Label>
              <Input placeholder="如：早场抢购" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>开始时间</Label>
                <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>结束时间</Label>
                <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
              </div>
            </div>
            <Button className="w-full bg-red-600 hover:bg-red-700 text-white" onClick={handleAdd} disabled={loading || !name || !startTime || !endTime}>
              {loading ? '创建中...' : '创建场次'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>编辑场次</DialogTitle>
            <DialogDescription>修改场次的名称和时间段</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>场次名称</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>开始时间</Label>
                <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>结束时间</Label>
                <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
              </div>
            </div>
            <Button className="w-full bg-red-600 hover:bg-red-700 text-white" onClick={handleEdit} disabled={loading}>
              {loading ? '保存中...' : '保存修改'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <AdminNotification />
    </div>
  );
}
