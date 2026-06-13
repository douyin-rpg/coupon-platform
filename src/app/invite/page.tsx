'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

export default function InvitePage() {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const router = useRouter();

  // Check if invite is required
  const [isRequired, setIsRequired] = useState(true);

  useEffect(() => {
    fetch('/api/invite/verify')
      .then(res => res.json())
      .then(data => {
        if (!data.required) {
          // Not required, redirect to home
          router.replace('/');
        }
        setIsRequired(data.required);
      })
      .catch(() => {});
  }, [router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setError('请输入邀请码');
      triggerShake();
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/invite/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim() }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        router.replace('/');
      } else {
        setError(data.error || '邀请码无效');
        triggerShake();
      }
    } catch {
      setError('网络错误，请重试');
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  if (!isRequired) return null;

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center"
      style={{
        background: 'linear-gradient(135deg, #FF9A9E 0%, #FECFEF 25%, #E8D5F5 50%, #D4BBF0 75%, #A18CD1 100%)',
      }}
    >
      {/* 浮动3D形状 */}
      <div className="floating-shape shape-1" />
      <div className="floating-shape shape-2" />
      <div className="floating-shape shape-3" />
      <div className="floating-shape shape-4" />
      <div className="floating-shape shape-5" />
      <div className="floating-shape shape-6" />
      <div className="floating-shape shape-7" />
      <div className="floating-shape shape-8" />

      {/* 闪光粒子 */}
      <div className="sparkle sparkle-1" />
      <div className="sparkle sparkle-2" />
      <div className="sparkle sparkle-3" />
      <div className="sparkle sparkle-4" />
      <div className="sparkle sparkle-5" />
      <div className="sparkle sparkle-6" />

      {/* 主内容区 */}
      <div className="relative z-10 w-full max-w-md mx-auto px-6 invite-fade-in">
        {/* Logo + 标题 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{
              background: 'linear-gradient(135deg, #00D4FF, #7B61FF)',
              boxShadow: '0 8px 32px rgba(123, 97, 255, 0.3)',
            }}
          >
            <span className="text-white text-2xl font-bold">惠</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">抖音电商优惠券抢购平台</h1>
          <p className="text-gray-600 text-sm">请输入邀请码以访问平台</p>
        </div>

        {/* 毛玻璃卡片 */}
        <div className={`bg-white/70 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/50 ${shake ? 'invite-shake' : ''}`}>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">邀请码</label>
              <div className="relative">
                <input
                  type="text"
                  value={code}
                  onChange={(e) => { setCode(e.target.value); setError(''); }}
                  className="w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-purple-400 transition-all text-center text-lg tracking-widest"
                  placeholder="请输入邀请码"
                  autoFocus
                  disabled={loading}
                />
              </div>
            </div>

            {error && (
              <div className="mb-4 p-2 bg-red-50/80 text-red-600 text-sm rounded-lg text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="invite-btn w-full py-3 rounded-xl text-white font-semibold text-base transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: 'linear-gradient(135deg, #C44FE2, #FF6B9D)',
                boxShadow: '0 6px 24px rgba(196, 79, 226, 0.35)',
              }}
            >
              {loading ? '验证中...' : '确认进入'}
            </button>
          </form>
        </div>

        {/* 价值展示卡片 */}
        <div className="mt-8 grid grid-cols-3 gap-3">
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 text-center border border-white/50 shadow-sm">
            <div className="w-10 h-10 mx-auto mb-2 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #FF6B9D, #FF9A9E)' }}
            >
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            </div>
            <h3 className="text-xs font-bold text-gray-800 mb-1">兴趣电商</h3>
            <p className="text-[10px] text-gray-500 leading-tight">新增量激发</p>
          </div>
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 text-center border border-white/50 shadow-sm">
            <div className="w-10 h-10 mx-auto mb-2 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #4FACFE, #00F2FE)' }}
            >
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/>
              </svg>
            </div>
            <h3 className="text-xs font-bold text-gray-800 mb-1">全链经营</h3>
            <p className="text-[10px] text-gray-500 leading-tight">一站式服务</p>
          </div>
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 text-center border border-white/50 shadow-sm">
            <div className="w-10 h-10 mx-auto mb-2 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #A18CD1, #FBC2EB)' }}
            >
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/>
              </svg>
            </div>
            <h3 className="text-xs font-bold text-gray-800 mb-1">优价好物</h3>
            <p className="text-[10px] text-gray-500 leading-tight">多场景转化</p>
          </div>
        </div>
      </div>

      {/* 底部版权 */}
      <div className="relative z-10 mt-8 text-center text-xs text-gray-500/70 pb-4">
        © 2024 抖音电商优惠券抢购平台
      </div>
    </div>
  );
}
