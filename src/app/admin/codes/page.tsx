'use client';

import { useEffect, useState, useCallback } from 'react';
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
  max_uses: number;
  current_uses: number;
  description: string | null;
  created_at: string;
  users: { username: string } | null;
}

export default function AdminCodesPage() {
  const [codes, setCodes] = useState<RegCode[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newMaxUses, setNewMaxUses] = useState('1');
  const [newDescription, setNewDescription] = useState('');
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
        body: JSON.stringify({
          code: newCode,
          max_uses: parseInt(newMaxUses) || 1,
          description: newDescription,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAddOpen(false);
        setNewCode('');
        setNewMaxUses('1');
        setNewDescription('');
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

  const isCodeExhausted = (c: RegCode) => c.current_uses >= c.max_uses;

  return (
    <div className="p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">注册码管理</h1>
        <Button className="bg-[#1890FF] hover:bg-[#1890FF]/80 text-white" onClick={() => { setNewCode(''); setNewMaxUses('1'); setNewDescription(''); setAddOpen(true); }}>
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
                      {isCodeExhausted(c)
                        ? `已用完 (${c.current_uses}/${c.max_uses})`
                        : `已使用 ${c.current_uses}/${c.max_uses} 次`
                      }
                      {c.description && <span className="ml-2 text-gray-400">· {c.description}</span>}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={isCodeExhausted(c) ? 'bg-gray-400 text-white' : 'bg-green-500 text-white'}>
                    {isCodeExhausted(c) ? '已用完' : '可用'}
                  </Badge>
                  {!isCodeExhausted(c) && (
                    <Button variant="outline" size="sm" className="text-red-600" onClick={() => handleDelete(c.id)}>删除</Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Add Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
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
            <div className="space-y-2">
              <Label>可使用次数</Label>
              <Input
                type="number"
                min="1"
                placeholder="1"
                value={newMaxUses}
                onChange={(e) => setNewMaxUses(e.target.value)}
              />
              <p className="text-xs text-gray-400">设置该注册码可被使用的次数，1表示仅可注册1个账号</p>
            </div>
            <div className="space-y-2">
              <Label>备注（可选）</Label>
              <Input
                placeholder="注册码用途备注"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
              />
            </div>
            <Button className="w-full bg-[#1890FF] hover:bg-[#1890FF]/80 text-white rounded-xl" onClick={handleAdd} disabled={loading || !newCode}>
              {loading ? '创建中...' : '创建注册码'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <AdminNotification />
    </div>
  );
}
