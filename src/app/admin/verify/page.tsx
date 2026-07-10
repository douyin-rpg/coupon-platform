'use client';

import { useEffect, useState, useCallback } from 'react';
import { AdminNotification } from '@/components/admin-notification';
import { XIcon } from '@/components/icons';

interface VerifyUser {
  id: string;
  username: string;
  real_name: string;
  id_card_name: string | null;
  id_card: string | null;
  id_card_front: string | null;
  id_card_back: string | null;
  id_card_front_url: string | null;
  id_card_back_url: string | null;
  verify_status: string;
  verify_rejected_reason: string | null;
  created_at: string;
}

export default function AdminVerifyPage() {
  const [users, setUsers] = useState<VerifyUser[]>([]);
  const [status, setStatus] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<VerifyUser | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/verify?status=${status}`);
      if (res.status === 401) { window.location.href = '/admin'; return; }
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, [status]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleAction = async (userId: string, action: string, reason?: string) => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/verify', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action, reason }),
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        setSelectedUser(null);
        setRejectReason('');
        fetchUsers();
      } else {
        alert(data.error || '操作失败');
      }
    } catch { alert('网络错误'); }
    setActionLoading(false);
  };

  const statusMap: Record<string, { label: string; color: string }> = {
    pending: { label: '待审核', color: 'bg-yellow-100 text-yellow-700' },
    verified: { label: '已通过', color: 'bg-green-100 text-green-700' },
    rejected: { label: '已拒绝', color: 'bg-red-100 text-red-700' },
    unverified: { label: '未认证', color: 'bg-gray-100 text-gray-500' },
  };

  return (
    <div className="p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">实名认证审核</h1>
        <AdminNotification />
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 mb-6">
        {['all', 'pending', 'verified', 'rejected'].map((s) => (
          <button key={s} onClick={() => { setStatus(s); setLoading(true); }}
            className={`px-4 py-2 rounded-lg text-sm ${status === s ? 'bg-[#1890FF] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {s === 'all' ? '全部' : statusMap[s]?.label || s}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-gray-400 text-center py-10">加载中...</div>
      ) : users.length === 0 ? (
        <div className="text-gray-500 text-center py-10">暂无实名认证记录</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="px-4 py-3 text-left text-gray-600 font-medium">用户名</th>
                <th className="px-4 py-3 text-left text-gray-600 font-medium">姓名</th>
                <th className="px-4 py-3 text-left text-gray-600 font-medium">身份证号</th>
                <th className="px-4 py-3 text-left text-gray-600 font-medium">身份证照片</th>
                <th className="px-4 py-3 text-left text-gray-600 font-medium">状态</th>
                <th className="px-4 py-3 text-left text-gray-600 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-800">{u.username}</td>
                  <td className="px-4 py-3 text-gray-600">{u.id_card_name || '-'}</td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{u.id_card || '-'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {u.id_card_front ? (
                        <img src={u.id_card_front} alt="正面" className="w-16 h-10 object-cover rounded border cursor-pointer hover:scale-110 transition-transform"
                          onClick={() => setSelectedUser(u)} title="点击查看大图" />
                      ) : <span className="text-gray-400 text-xs">无</span>}
                      {u.id_card_back ? (
                        <img src={u.id_card_back} alt="反面" className="w-16 h-10 object-cover rounded border cursor-pointer hover:scale-110 transition-transform"
                          onClick={() => setSelectedUser(u)} title="点击查看大图" />
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs ${statusMap[u.verify_status]?.color || 'bg-gray-100 text-gray-500'}`}>
                      {statusMap[u.verify_status]?.label || u.verify_status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => setSelectedUser(u)}
                      className="px-3 py-1 bg-[#1890FF] text-white rounded text-xs hover:bg-[#1890FF]/80">
                      审核
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">实名认证详情</h3>
              <button onClick={() => { setSelectedUser(null); setRejectReason(''); }}
                className="text-gray-400 hover:text-gray-600">
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 mb-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">用户名</p>
                  <p className="text-sm font-medium">{selectedUser.username}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">状态</p>
                  <span className={`inline-block px-2 py-0.5 rounded text-xs ${statusMap[selectedUser.verify_status]?.color}`}>
                    {statusMap[selectedUser.verify_status]?.label}
                  </span>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">真实姓名</p>
                <p className="text-sm font-medium">{selectedUser.id_card_name || '未填写'}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">身份证号</p>
                <p className="text-sm font-medium">{selectedUser.id_card || '未填写'}</p>
              </div>
              {selectedUser.verify_rejected_reason && (
                <div className="bg-red-50 rounded-lg p-3">
                  <p className="text-xs text-red-500">拒绝原因</p>
                  <p className="text-sm text-red-700">{selectedUser.verify_rejected_reason}</p>
                </div>
              )}
            </div>

            {(selectedUser.id_card_front_url || selectedUser.id_card_back_url) && (
              <div className="mb-4">
                <p className="text-sm font-medium mb-2">身份证照片</p>
                <div className="grid grid-cols-2 gap-3">
                  {selectedUser.id_card_front_url && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">正面</p>
                      <img src={selectedUser.id_card_front_url} alt="身份证正面" className="w-full rounded-lg border" />
                    </div>
                  )}
                  {selectedUser.id_card_back_url && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">反面</p>
                      <img src={selectedUser.id_card_back_url} alt="身份证反面" className="w-full rounded-lg border" />
                    </div>
                  )}
                </div>
              </div>
            )}

            {selectedUser.verify_status === 'pending' && (
              <div className="space-y-3 border-t pt-4">
                <div className="flex gap-3">
                  <button onClick={() => handleAction(selectedUser.id, 'approve')}
                    disabled={actionLoading}
                    className="flex-1 py-2.5 bg-green-600 text-white rounded-xl text-sm font-medium disabled:opacity-50">
                    审核通过
                  </button>
                  <button onClick={() => {
                    if (!rejectReason) { alert('请输入拒绝原因'); return; }
                    handleAction(selectedUser.id, 'reject', rejectReason);
                  }}
                    disabled={actionLoading || !rejectReason}
                    className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium disabled:opacity-50">
                    拒绝
                  </button>
                </div>
                <input type="text" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="拒绝原因（拒绝时必填）"
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
              </div>
            )}

            <div className="flex gap-2 mt-4 pt-4 border-t">
              <button onClick={() => handleAction(selectedUser.id, 'delete_verify')}
                disabled={actionLoading}
                className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-xs hover:bg-gray-200">
                删除实名信息
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
