'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';

interface RedPacket {
  id: string;
  amount: string | number;
  note: string | null;
  status: string;
  created_at: string;
}

/* 抖音风格音符暗纹图标 */
function NoteMark({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M9 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3H9zm8.5 0v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
    </svg>
  );
}

/* 金色波光缎带 */
function GoldRibbon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 320 40" preserveAspectRatio="none" className={className} aria-hidden>
      <defs>
        <linearGradient id="ribbonGold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FBEEC2" />
          <stop offset="42%" stopColor="#EFD48D" />
          <stop offset="70%" stopColor="#D9AC55" />
          <stop offset="100%" stopColor="#B98A38" />
        </linearGradient>
        <linearGradient id="ribbonGoldSide" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E8CB83" />
          <stop offset="100%" stopColor="#A57A2F" />
        </linearGradient>
      </defs>
      {/* 缎带主体（波浪上下缘） */}
      <path
        d="M0 13 Q 16 4, 32 13 T 64 13 T 96 13 T 128 13 T 160 13 T 192 13 T 224 13 T 256 13 T 288 13 T 320 13
           L 320 27 Q 304 36, 288 27 T 256 27 T 224 27 T 192 27 T 160 27 T 128 27 T 96 27 T 64 27 T 32 27 T 0 27 Z"
        fill="url(#ribbonGold)"
      />
      {/* 上缘高光 */}
      <path
        d="M0 13 Q 16 4, 32 13 T 64 13 T 96 13 T 128 13 T 160 13 T 192 13 T 224 13 T 256 13 T 288 13 T 320 13"
        fill="none" stroke="#FFF8DC" strokeWidth="2" opacity="0.85"
      />
      {/* 下缘阴影 */}
      <path
        d="M0 27 Q 16 36, 32 27 T 64 27 T 96 27 T 128 27 T 160 27 T 192 27 T 224 27 T 256 27 T 288 27 T 320 27"
        fill="none" stroke="#8A6626" strokeWidth="2" opacity="0.55"
      />
    </svg>
  );
}

/* 爆开金光（放射线条） */
function Burst({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden>
      <defs>
        <linearGradient id="rayGold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFF3C4" />
          <stop offset="100%" stopColor="#F0B93F" />
        </linearGradient>
      </defs>
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (360 / 12) * i;
        return (
          <g key={i} transform={`rotate(${angle} 100 100)`}>
            <path d="M100 100 L 96 34 L 104 34 Z" fill="url(#rayGold)" opacity="0.9" />
          </g>
        );
      })}
      <circle cx="100" cy="100" r="30" fill="#FFFBE8" />
      <circle cx="100" cy="100" r="18" fill="#F6C85A" />
    </svg>
  );
}

export default function RedPacketBanner() {
  const { user, refreshUser } = useAuth();
  const [packets, setPackets] = useState<RedPacket[]>([]);
  const [open, setOpen] = useState(false);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [claimedIds, setClaimedIds] = useState<string[]>([]);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [phase, setPhase] = useState<'idle' | 'burst' | 'reveal'>('idle');

  const fetchPackets = useCallback(async () => {
    try {
      const res = await fetch('/api/red-packets', { credentials: 'same-origin' });
      if (res.ok) {
        const data = await res.json();
        setPackets(data.red_packets || []);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (user) fetchPackets();
  }, [user, fetchPackets]);

  const handleClaim = async (packet: RedPacket) => {
    setClaimingId(packet.id);
    setMsg(null);
    try {
      const res = await fetch(`/api/red-packets/${packet.id}`, {
        method: 'POST',
        credentials: 'same-origin',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setClaimedIds(prev => [...prev, packet.id]);
        setMsg({ type: 'success', text: data.message });
        refreshUser();
        setTimeout(() => setPackets(prev => prev.filter(p => p.id !== packet.id)), 500);
      } else {
        setMsg({ type: 'error', text: data.error || '领取失败' });
        setTimeout(() => setPackets(prev => prev.filter(p => p.id !== packet.id)), 800);
      }
    } catch {
      setMsg({ type: 'error', text: '网络错误' });
    } finally {
      setClaimingId(null);
    }
  };

  // 点击「开」：金光爆开 → 展示金额
  const handleOpen = () => {
    setMsg(null);
    setPhase('burst');
    setTimeout(() => setPhase('reveal'), 650);
  };

  const close = () => {
    setOpen(false);
    setPhase('idle');
    setClaimedIds([]);
    fetchPackets();
  };

  if (!user || packets.length === 0) return null;

  const totalAmount = packets.reduce((sum, p) => sum + Number(p.amount), 0);
  const current = packets[0];

  return (
    <>
      {/* 待领取红包横幅（抖音红包质感） */}
      <button
        onClick={() => { setPhase('idle'); setOpen(true); }}
        className="relative w-full mb-6 overflow-hidden rounded-2xl text-left shadow-lg shadow-red-500/25 transition-all hover:-translate-y-0.5 hover:shadow-red-500/35 active:scale-[0.98]"
      >
        {/* 渐变红底 */}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(135deg, #FE2C55 0%, #E0113D 55%, #B50A2F 100%)' }}
        />
        {/* 音符暗纹 */}
        <NoteMark className="absolute -right-4 -bottom-7 w-28 h-28 text-white/10 rotate-[-12deg]" />
        {/* 高光 */}
        <div className="absolute -left-8 -top-10 w-32 h-32 rounded-full bg-white/10 blur-sm" />
        <div className="absolute right-16 -bottom-8 w-24 h-24 rounded-full bg-white/5" />

        <div className="relative z-10 flex items-center gap-3 px-4 py-4">
          {/* 红包小图标（绘制，非 emoji） */}
          <div className="relative w-11 h-11 shrink-0 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center">
            <div
              className="absolute inset-0 rounded-xl"
              style={{ background: 'linear-gradient(150deg, #FF5A77, #D90A3C)' }}
            />
            <span className="relative text-white text-2xl leading-none" style={{ fontFamily: "'KaiTi','STKaiti',serif" }}>吉</span>
            <div className="absolute inset-x-1.5 top-[46%] h-[3px] rounded-full bg-[#F2D38A]/80" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-sm">有 {packets.length} 个红包待拆开</p>
            <p className="text-white/80 text-xs mt-0.5">点击拆开领取，合计 ¥{totalAmount.toFixed(2)}</p>
          </div>
          <span className="flex items-center gap-1 text-white text-xs bg-white/15 rounded-full px-3 py-1.5 backdrop-blur">
            立即拆
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </span>
        </div>
      </button>

      {/* 红包弹窗（抖音官方红包质感） */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={close}>
          <div
            className="relative w-full max-w-sm mx-auto rounded-[2rem] overflow-hidden shadow-[0_24px_80px_rgba(0,0,0,0.45)]"
            style={{ background: 'linear-gradient(168deg, #FF5A77 0%, #F6284F 38%, #DC0F3B 72%, #A80A2C 100%)' }}
            onClick={e => e.stopPropagation()}
          >
            {/* 钱包内边框（金线描边） */}
            <div
              className="absolute inset-3 rounded-[1.6rem] pointer-events-none"
              style={{ boxShadow: 'inset 0 0 0 1.5px rgba(244,215,150,0.55)' }}
            />
            {/* 顶部内高光 */}
            <div
              className="absolute -top-16 left-1/2 -translate-x-1/2 w-[130%] h-36 rounded-[50%] pointer-events-none"
              style={{ background: 'radial-gradient(closest-side, rgba(255,235,200,0.35), transparent 70%)' }}
            />
            {/* 音符暗纹 */}
            <NoteMark className="absolute -right-8 bottom-14 w-36 h-36 text-white/[0.07] rotate-[15deg] pointer-events-none" />

            {/* 关闭 */}
            <button
              onClick={close}
              className="absolute right-4 top-4 z-20 w-8 h-8 rounded-full bg-black/20 flex items-center justify-center text-white/90 hover:bg-black/30 transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
            </button>

            {/* 顶部「大吉大利」 */}
            <div className="relative pt-10 pb-2 text-center">
              <p
                className="text-3xl text-[#FFE9B0] tracking-[0.5em] pl-[0.5em]"
                style={{
                  fontFamily: "'KaiTi','STKaiti','Ma Shan Zheng',serif",
                  textShadow: '0 2px 6px rgba(120,40,10,0.55), 0 0 18px rgba(255,220,140,0.35)',
                }}
              >
                大吉大利
              </p>
              <p className="mt-1.5 text-white/70 text-xs tracking-widest">已为你准备 ¥{current ? Number(current.amount).toFixed(2) : totalAmount.toFixed(2)} 的惊喜</p>
            </div>

            {/* 红包主体区 */}
            <div className="relative px-8 pt-4 pb-12 flex flex-col items-center min-h-[300px]">
              {/* 金色缎带 */}
              <div className="absolute left-4 right-4 top-[46%] -translate-y-1/2 z-10">
                <GoldRibbon className="w-full h-10 drop-shadow-[0_6px_10px_rgba(90,30,5,0.35)]" />
              </div>

              <div className="relative z-20 mt-6 w-full flex-1 flex items-center justify-center">
                {phase === 'idle' && (
                  /* 【开】按钮 */
                  <button
                    onClick={current ? handleOpen : undefined}
                    disabled={!current}
                    className="relative w-24 h-24 rounded-full transition-transform duration-200 active:scale-90 hover:scale-105"
                    style={{
                      background: 'radial-gradient(circle at 32% 28%, #FFFDF5 0%, #FFEAD3 42%, #FFD6B3 100%)',
                      boxShadow:
                        '0 10px 22px rgba(70,20,5,0.45), inset 0 2px 6px rgba(255,255,255,0.95), inset 0 -6px 12px rgba(200,110,50,0.4)',
                    }}
                  >
                    <span
                      className="text-5xl text-[#7A2E1D] leading-none"
                      style={{ fontFamily: "'KaiTi','STKaiti','Ma Shan Zheng',serif", textShadow: '0 1px 0 rgba(255,255,255,0.6)' }}
                    >
                      开
                    </span>
                    {/* 顶光 */}
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-10 h-4 rounded-full bg-white/70 blur-[3px]" />
                  </button>
                )}

                {phase === 'burst' && (
                  <div className="relative flex items-center justify-center">
                    <Burst className="w-56 h-56 animate-[rp_burst_0.65s_ease-out_forwards]" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-20 h-20 rounded-full bg-[#FFF3C4] animate-[rp_pulse_0.4s_ease-in-out_alternate_infinite]" />
                    </div>
                    <p className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-4xl text-[#8A3D12] font-bold animate-[rp_pop_0.45s_ease-out_forwards]" style={{ fontFamily: "'KaiTi','STKaiti',serif" }}>
                      打开
                    </p>
                  </div>
                )}

                {phase === 'reveal' && current && (
                  <div className="w-full animate-[rp_rise_0.5s_cubic-bezier(0.22,1,0.36,1)_forwards]">
                    {/* 金额卡片 */}
                    <div className="relative rounded-3xl bg-white/95 px-6 py-5 text-center shadow-[0_14px_40px_rgba(90,20,0,0.35)]">
                      <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-[#F2D38A] to-transparent" />
                      <p className="text-xs text-gray-400 tracking-widest mb-1">本次红包</p>
                      <p className="text-4xl font-extrabold text-[#E44D26] tabular-nums leading-tight">
                        ¥{Number(current.amount).toFixed(2)}
                      </p>
                      {current.note ? (
                        <p className="text-xs text-gray-500 mt-1.5 truncate">{current.note}</p>
                      ) : (
                        <p className="text-xs text-gray-400 mt-1.5">平台红包</p>
                      )}
                    </div>

                    {msg && (
                      <div className={`mt-3 rounded-xl px-3 py-2 text-xs text-center ${msg.type === 'success' ? 'bg-green-100/90 text-green-700' : 'bg-red-100/90 text-red-600'}`}>
                        {msg.text}
                      </div>
                    )}

                    <button
                      onClick={() => handleClaim(current)}
                      disabled={claimingId === current.id}
                      className={`mt-4 w-full py-3.5 rounded-2xl text-white text-sm font-bold tracking-widest transition-all active:scale-[0.97] shadow-lg ${
                        claimingId === current.id
                          ? 'bg-black/30 cursor-wait'
                          : 'bg-gradient-to-r from-[#F6C85A] via-[#EFB23F] to-[#D98E2B] hover:brightness-105 shadow-amber-500/40'
                      }`}
                    >
                      <span className="inline-flex items-center gap-2">
                        {claimingId === current.id ? (
                          <>
                            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" className="opacity-30" /><path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg>
                            领取中...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.6 6.2L21 9.2l-4.7 4.5 1.2 6.3L12 16.9 6.5 20l1.2-6.3L3 9.2l6.4-1z" /></svg>
                            领取并入账
                          </>
                        )}
                      </span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* 底部文案 */}
            <div className="relative pb-5 text-center">
              <p
                className="text-white/95 text-sm tracking-[0.4em] pl-[0.4em]"
                style={{ fontFamily: "'KaiTi','STKaiti','Ma Shan Zheng',serif", textShadow: '0 1px 4px rgba(90,20,0,0.45)' }}
              >
                抖音红包
              </p>
              <p className="text-white/45 text-[10px] mt-1 tracking-wider">拆开后金额将存入账户余额</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}