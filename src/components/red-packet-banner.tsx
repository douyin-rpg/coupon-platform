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

export default function RedPacketBanner() {
  const { user, refreshUser } = useAuth();
  const [packets, setPackets] = useState<RedPacket[]>([]);
  const [open, setOpen] = useState(false);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [claimedIds, setClaimedIds] = useState<string[]>([]);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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
        setTimeout(() => setPackets(prev => prev.filter(p => p.id !== packet.id)), 600);
      } else {
        setMsg({ type: 'error', text: data.error || '领取失败' });
        // 已领取的红包直接移除
        setTimeout(() => setPackets(prev => prev.filter(p => p.id !== packet.id)), 800);
      }
    } catch {
      setMsg({ type: 'error', text: '网络错误' });
    } finally {
      setClaimingId(null);
    }
  };

  if (!user || packets.length === 0) return null;

  const totalAmount = packets.reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <>
      {/* 待领取红包横幅 */}
      <button
        onClick={() => setOpen(true)}
        className="w-full mb-6 relative overflow-hidden rounded-2xl p-4 text-left shadow-lg shadow-red-500/20 group transition-all hover:shadow-red-500/30 hover:-translate-y-0.5 active:scale-[0.98]"
        style={{ background: 'linear-gradient(135deg, #FE2C55 0%, #FF6B35 100%)' }}
      >
        <div className="absolute -right-6 -top-8 w-28 h-28 rounded-full bg-white/10" />
        <div className="absolute right-10 -bottom-8 w-20 h-20 rounded-full bg-white/5" />
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center text-2xl shrink-0">
            🧧
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-sm">有 {packets.length} 个红包待领取</p>
            <p className="text-white/80 text-xs mt-0.5">点击查看并领取，合计 ¥{totalAmount.toFixed(2)}</p>
          </div>
          <span className="flex items-center gap-1 text-white/90 text-xs bg-white/15 rounded-full px-3 py-1.5 backdrop-blur">
            立即领取
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </span>
        </div>
      </button>

      {/* 领取弹窗 */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4" onClick={() => setOpen(false)}>
          <div
            className="bg-white w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            {/* 头部 */}
            <div className="relative px-6 pt-8 pb-6 text-center text-white"
              style={{ background: 'linear-gradient(135deg, #FE2C55 0%, #FF6B35 100%)' }}>
              <div className="absolute -left-6 -top-10 w-24 h-24 rounded-full bg-white/10" />
              <div className="absolute -right-6 -top-12 w-28 h-28 rounded-full bg-white/10" />
              <button onClick={() => setOpen(false)} className="absolute right-4 top-4 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
              <div className="text-5xl mb-2">🧧</div>
              <h3 className="text-lg font-bold">我的红包</h3>
              <p className="text-white/80 text-xs mt-1">点击下方按钮领取，红包金额将存入余额</p>
            </div>

            {/* 红包列表 */}
            <div className="max-h-[45vh] overflow-y-auto p-4 space-y-3">
              {msg && (
                <div className={`text-xs p-3 rounded-xl ${msg.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                  {msg.text}
                </div>
              )}
              {packets.map(packet => {
                const isClaiming = claimingId === packet.id;
                const isClaimed = claimedIds.includes(packet.id);
                return (
                  <div key={packet.id} className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all ${isClaimed ? 'opacity-40 border-gray-100 bg-gray-50' : 'border-red-100 bg-gradient-to-r from-red-50 to-orange-50'}`}>
                    <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-xl shrink-0">🧧</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-[#FE2C55]">¥{Number(packet.amount).toFixed(2)}</p>
                      {packet.note ? (
                        <p className="text-xs text-gray-500 mt-0.5 truncate">{packet.note}</p>
                      ) : (
                        <p className="text-xs text-gray-400 mt-0.5">平台红包</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleClaim(packet)}
                      disabled={isClaiming || isClaimed}
                      className={`shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                        isClaimed
                          ? 'bg-gray-100 text-gray-400 cursor-default'
                          : 'text-white shadow-md shadow-red-500/20 hover:shadow-lg'
                      }`}
                      style={isClaimed ? undefined : { background: 'linear-gradient(135deg, #FE2C55, #FF6B35)' }}
                    >
                      {isClaiming ? '领取中...' : isClaimed ? '已领取' : '领取'}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="p-4 pt-0">
              <button
                onClick={() => setOpen(false)}
                className="w-full py-3 rounded-xl text-sm font-medium text-gray-500 bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}