'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

const INTRO_SHOWN_KEY = 'huiqiang_intro_shown';

export default function IntroAnimation() {
  const [visible, setVisible] = useState(false);
  const [phase, setPhase] = useState<'loading' | 'reveal' | 'done'>('loading');

  useEffect(() => {
    const alreadyShown = localStorage.getItem(INTRO_SHOWN_KEY);
    if (!alreadyShown) {
      setVisible(true);
      document.body.style.overflow = 'hidden';
      // Phase 1: Logo loading (1.5s)
      const t1 = setTimeout(() => setPhase('reveal'), 1500);
      // Phase 2: Reveal animation (1.2s) then mark done
      const t2 = setTimeout(() => {
        setPhase('done');
        document.body.style.overflow = '';
        localStorage.setItem(INTRO_SHOWN_KEY, 'true');
        // Fade out
        setTimeout(() => setVisible(false), 600);
      }, 2700);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center transition-opacity duration-600 ${
        phase === 'done' ? 'opacity-0' : 'opacity-100'
      }`}
      style={{ background: 'linear-gradient(135deg, #0A1628 0%, #132742 40%, #0D1F35 100%)' }}
    >
      {/* Animated floating orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute w-80 h-80 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #00D4FF 0%, transparent 70%)', top: '-15%', right: '5%', animation: 'floatOrb1 6s ease-in-out infinite' }} />
        <div className="absolute w-60 h-60 rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, #7B61FF 0%, transparent 70%)', bottom: '-10%', left: '5%', animation: 'floatOrb2 8s ease-in-out infinite' }} />
        <div className="absolute w-40 h-40 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #1890FF 0%, transparent 70%)', top: '40%', left: '35%', animation: 'floatOrb1 5s ease-in-out infinite reverse' }} />
      </div>

      {/* Center content */}
      <div className={`flex flex-col items-center transition-all duration-700 ${
        phase === 'loading' ? 'scale-90 opacity-0' : 'scale-100 opacity-100'
      }`}>
        {/* Logo */}
        <div className="relative mb-6">
          <div className="absolute inset-0 blur-2xl opacity-50"
            style={{ background: 'linear-gradient(135deg, #00D4FF, #7B61FF)' }} />
          <Image src="/images/logo.png" alt="抖音电商" width={200} height={52}
            className="relative h-12 md:h-16 w-auto animate-pulse" priority />
        </div>

        {/* Tagline */}
        <div className={`text-center transition-all duration-500 ${
          phase === 'reveal' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}>
          <h1 className="text-2xl md:text-4xl font-bold text-white mb-2 tracking-wide">
            惠抢券
          </h1>
          <p className="text-sm md:text-base text-white/50 tracking-widest">
            美好生活 · 触手可得
          </p>
        </div>

        {/* Loading bar */}
        <div className={`mt-8 w-48 h-0.5 bg-white/10 rounded-full overflow-hidden transition-all duration-500 ${
          phase === 'loading' ? 'opacity-100' : 'opacity-0'
        }`}>
          <div className="h-full rounded-full"
            style={{
              background: 'linear-gradient(90deg, #00D4FF, #7B61FF)',
              animation: 'loadingBar 1.5s ease-in-out forwards',
            }} />
        </div>
      </div>

      <style jsx>{`
        @keyframes loadingBar {
          0% { width: 0%; }
          60% { width: 70%; }
          100% { width: 100%; }
        }
        @keyframes floatOrb1 {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-20px) scale(1.05); }
        }
        @keyframes floatOrb2 {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(15px) scale(1.08); }
        }
      `}</style>
    </div>
  );
}
