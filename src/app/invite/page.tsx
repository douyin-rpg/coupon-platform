'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

export default function InvitePage() {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [required, setRequired] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if invite code is required
    fetch('/api/invite/verify')
      .then(res => res.json())
      .then(data => {
        setRequired(data.required);
        if (!data.required) {
          router.replace('/');
        }
      })
      .catch(() => setRequired(true));
  }, [router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setError('请输入邀请码');
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
      }
    } catch {
      setError('网络错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  if (!required) return null;

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center" style={{ background: 'linear-gradient(135deg, #FF9A9E 0%, #FECFEF 25%, #E0C3FC 50%, #8EC5FC 75%, #E0C3FC 100%)' }}>
      {/* Floating 3D elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Floating shapes */}
        <div className="floating-shape shape-1" />
        <div className="floating-shape shape-2" />
        <div className="floating-shape shape-3" />
        <div className="floating-shape shape-4" />
        <div className="floating-shape shape-5" />
        <div className="floating-shape shape-6" />
        <div className="floating-shape shape-7" />
        <div className="floating-shape shape-8" />
        {/* Sparkle particles */}
        <div className="sparkle sparkle-1" />
        <div className="sparkle sparkle-2" />
        <div className="sparkle sparkle-3" />
        <div className="sparkle sparkle-4" />
        <div className="sparkle sparkle-5" />
        <div className="sparkle sparkle-6" />
      </div>

      {/* Brand Logo */}
      <div className="relative z-10 mb-8 invite-fade-in" style={{ animationDelay: '0.1s' }}>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #00D4FF, #7B61FF)' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18V5l12-2v13" />
              <circle cx="6" cy="18" r="3" />
              <circle cx="18" cy="16" r="3" />
            </svg>
          </div>
          <span className="text-xl font-bold text-white drop-shadow-lg" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>抖音电商</span>
        </div>
      </div>

      {/* Main Card */}
      <div className="relative z-10 w-full max-w-md mx-4 invite-fade-in" style={{ animationDelay: '0.3s' }}>
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-8 md:p-10" style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.1), 0 0 0 1px rgba(255,255,255,0.5) inset' }}>
          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">欢迎来到惠抢券</h1>
            <p className="text-gray-500 text-sm">请输入邀请码以访问平台</p>
          </div>

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
                </svg>
              </div>
              <input
                type="text"
                value={code}
                onChange={(e) => { setCode(e.target.value); setError(''); }}
                placeholder="请输入邀请码"
                className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-pink-200 focus:border-pink-400 focus:ring-4 focus:ring-pink-100 outline-none text-gray-700 text-base transition-all duration-300 placeholder:text-gray-300"
                autoFocus
              />
            </div>

            {error && (
              <div className="text-red-500 text-sm text-center invite-shake">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-2xl text-white font-bold text-base transition-all duration-300 disabled:opacity-60 invite-btn"
              style={{
                background: loading ? '#ccc' : 'linear-gradient(135deg, #FF6B9D, #C44FE2)',
                boxShadow: loading ? 'none' : '0 8px 24px rgba(196,79,226,0.35)',
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  验证中...
                </span>
              ) : '确认进入'}
            </button>
          </form>

          {/* Hint */}
          <p className="text-center text-gray-400 text-xs mt-6">
            邀请码由平台管理员发放，请联系客服获取
          </p>
        </div>
      </div>

      {/* Feature Cards */}
      <div className="relative z-10 mt-10 w-full max-w-lg mx-4 invite-fade-in" style={{ animationDelay: '0.6s' }}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
          <FeatureCard
            icon={
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" fill="url(#grad1)" />
                <defs><linearGradient id="grad1" x1="2" y1="2" x2="22" y2="22"><stop stopColor="#FF6B9D" /><stop offset="1" stopColor="#C44FE2" /></linearGradient></defs>
              </svg>
            }
            title="激发兴趣"
            desc="精准推荐，发现式消费"
          />
          <FeatureCard
            icon={
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="3" width="7" height="7" rx="1.5" fill="url(#grad2)" />
                <rect x="14" y="3" width="7" height="7" rx="1.5" fill="url(#grad2)" opacity="0.7" />
                <rect x="3" y="14" width="7" height="7" rx="1.5" fill="url(#grad2)" opacity="0.7" />
                <rect x="14" y="14" width="7" height="7" rx="1.5" fill="url(#grad2)" opacity="0.5" />
                <defs><linearGradient id="grad2" x1="3" y1="3" x2="21" y2="21"><stop stopColor="#4FACFE" /><stop offset="1" stopColor="#00F2FE" /></linearGradient></defs>
              </svg>
            }
            title="全链经营"
            desc="一站式服务，长效经营"
          />
          <FeatureCard
            icon={
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" fill="url(#grad3)" />
                <path d="M12 6v6l4 2" stroke="white" strokeWidth="2" strokeLinecap="round" />
                <defs><linearGradient id="grad3" x1="2" y1="2" x2="22" y2="22"><stop stopColor="#A18CD1" /><stop offset="1" stopColor="#FBC2EB" /></linearGradient></defs>
              </svg>
            }
            title="限时抢购"
            desc="优价好物，多场景转化"
          />
        </div>
      </div>

      {/* Bottom spacing for mobile */}
      <div className="h-8" />
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-4 md:p-5 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-lg" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
      <div className="flex justify-center mb-3">{icon}</div>
      <div className="font-bold text-gray-800 text-sm mb-1">{title}</div>
      <div className="text-gray-400 text-xs">{desc}</div>
    </div>
  );
}
