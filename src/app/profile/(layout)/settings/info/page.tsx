'use client';

import { useAuth } from '@/contexts/auth-context';

export default function SettingsInfoPage() {
  const { user } = useAuth();

  return (
    <div className="p-4 md:p-6">
      <h2 className="text-lg font-bold text-gray-800 mb-4">个人信息</h2>
      <div className="space-y-4">
        <div className="flex justify-between items-center py-3 border-b border-gray-100">
          <span className="text-sm text-gray-500">用户名</span>
          <span className="text-sm text-gray-800">{user?.username || '-'}</span>
        </div>
        <div className="flex justify-between items-center py-3 border-b border-gray-100">
          <span className="text-sm text-gray-500">真实姓名</span>
          <span className="text-sm text-gray-800">{user?.realName || '-'}</span>
        </div>
        <div className="flex justify-between items-center py-3 border-b border-gray-100">
          <span className="text-sm text-gray-500">实名认证</span>
          <span className={`text-sm ${user?.verifyStatus === "verified" ? 'text-green-500' : 'text-red-500'}`}>
            {user?.verifyStatus === "verified" ? '已认证' : '未认证'}
          </span>
        </div>
        <div className="flex justify-between items-center py-3 border-b border-gray-100">
          <span className="text-sm text-gray-500">绑定收款</span>
          <span className={`text-sm ${user?.bankBound ? 'text-green-500' : 'text-gray-400'}`}>
            {user?.bankBound ? '已绑定' : '未绑定'}
          </span>
        </div>
      </div>
    </div>
  );
}
