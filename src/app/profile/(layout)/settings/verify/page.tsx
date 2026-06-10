'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { CameraIcon, CheckIcon, ClockIcon, XIcon } from '@/components/icons';

export default function VerifyPage() {
  const { user, refreshUser } = useAuth();
  const [realName, setRealName] = useState(user?.idCardName || '');
  const [idCard, setIdCard] = useState('');
  const [frontImage, setFrontImage] = useState<File | null>(null);
  const [backImage, setBackImage] = useState<File | null>(null);
  const [frontPreview, setFrontPreview] = useState<string | null>(null);
  const [backPreview, setBackPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (user?.verifyStatus === "verified") {
    return (
      <div className="p-4 md:p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4">实名认证</h2>
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
          <CheckIcon className="w-14 h-14 mx-auto mb-3 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-md shadow-green-200" />
          <p className="text-green-700 font-medium">已完成实名认证</p>
          <p className="text-sm text-gray-500 mt-2">姓名：{user.realName}</p>
          <p className="text-xs text-gray-400 mt-1">认证后不支持自行更改，如需修改请联系管理员</p>
        </div>
      </div>
    );
  }

  if (user?.verifyStatus === "pending") {
    return (
      <div className="p-4 md:p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4">实名认证</h2>
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
          <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md shadow-amber-200"><ClockIcon className="w-7 h-7 text-white" /></div>
          <p className="text-yellow-700 font-medium">实名认证审核中</p>
          <p className="text-sm text-gray-500 mt-2">请耐心等待管理员审核</p>
        </div>
      </div>
    );
  }

  if (user?.verifyStatus === "rejected") {
    return (
      <div className="p-4 md:p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4">实名认证</h2>
        <div className="bg-blue-50 border border-red-200 rounded-xl p-6 text-center mb-4">
          <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-gradient-to-br from-red-400 to-rose-500 flex items-center justify-center shadow-md shadow-red-200"><XIcon className="w-7 h-7 text-white" /></div>
          <p className="text-red-700 font-medium">实名认证被拒绝</p>
          <p className="text-sm text-gray-500 mt-2">拒绝原因：{user.verifyRejectedReason || '未说明'}</p>
          <p className="text-xs text-gray-400 mt-1">请修改后重新提交</p>
        </div>
        {/* Re-submit form below */}
      </div>
    );
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, side: 'front' | 'back') => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (side === 'front') {
      setFrontImage(file);
      setFrontPreview(URL.createObjectURL(file));
    } else {
      setBackImage(file);
      setBackPreview(URL.createObjectURL(file));
    }
  };

  const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/upload', { method: 'POST', body: formData });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return data.key;
  };

  const handleSubmit = async () => {
    if (!realName || !idCard) { alert('请填写姓名和身份证号'); return; }
    if (!frontImage || !backImage) { alert('请上传身份证正反面照片'); return; }
    setLoading(true);
    try {
      // Upload images first
      const frontKey = await uploadFile(frontImage);
      const backKey = await uploadFile(backImage);

      const res = await fetch('/api/user/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_card_name: realName, id_card: idCard, id_card_front: frontKey, id_card_back: backKey }),
      });
      const data = await res.json();
      if (data.error) { alert(data.error); return; }
      alert('实名认证已提交，请等待审核！');
      refreshUser?.();
    } catch (err) {
      alert(err instanceof Error ? err.message : '操作失败');
    }
    finally { setLoading(false); }
  };

  return (
    <div className="p-4 md:p-6">
      <h2 className="text-lg font-bold text-gray-800 mb-4">实名认证</h2>
      <p className="text-sm text-gray-500 mb-4">完成实名认证后才能查看余额和抢购优惠券，认证后不可自行更改</p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">真实姓名</label>
          <input type="text" value={realName} onChange={e => setRealName(e.target.value)} placeholder="请输入真实姓名"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1890FF]" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">身份证号</label>
          <input type="text" value={idCard} onChange={e => setIdCard(e.target.value)} placeholder="请输入18位身份证号" maxLength={18}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1890FF]" />
        </div>

        {/* ID Card photos */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">身份证正面（人像面）</label>
          <div className="relative">
            <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'front')}
              className="absolute inset-0 opacity-0 cursor-pointer z-10" />
            <div className="w-full h-40 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors">
              {frontPreview ? (
                <img src={frontPreview} alt="正面" className="w-full h-full object-contain rounded-xl" />
              ) : (
                <div className="text-center">
                  <CameraIcon className="w-8 h-8 mx-auto mb-1 text-gray-400" />
                  <span className="text-sm text-gray-400">点击上传身份证正面</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">身份证反面（国徽面）</label>
          <div className="relative">
            <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'back')}
              className="absolute inset-0 opacity-0 cursor-pointer z-10" />
            <div className="w-full h-40 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors">
              {backPreview ? (
                <img src={backPreview} alt="反面" className="w-full h-full object-contain rounded-xl" />
              ) : (
                <div className="text-center">
                  <CameraIcon className="w-8 h-8 mx-auto mb-1 text-gray-400" />
                  <span className="text-sm text-gray-400">点击上传身份证反面</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <button onClick={handleSubmit} disabled={loading}
          className="w-full py-3 bg-gradient-to-r from-[#1890FF] to-[#00D4FF] text-white rounded-xl font-medium disabled:opacity-50 active:scale-[0.97] transition-all">
          {loading ? '提交中...' : '提交认证'}
        </button>
      </div>
    </div>
  );
}
