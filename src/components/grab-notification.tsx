'use client';

import { useState, useEffect, useCallback } from 'react';

interface GrabRecord {
  username: string;
  couponName: string;
  time: string;
}

interface GrabNotificationProps {
  /** Whether the current session is active (within grab time) */
  isActive: boolean;
}

export default function GrabNotification({ isActive }: GrabNotificationProps) {
  const [records, setRecords] = useState<GrabRecord[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visible, setVisible] = useState(false);
  const [animating, setAnimating] = useState(false);

  // Fetch records
  const fetchRecords = useCallback(async () => {
    try {
      const res = await fetch('/api/coupons/recent-grabs');
      const data = await res.json();
      if (data.records && data.records.length > 0) {
        // Shuffle records for randomness
        const shuffled = [...data.records].sort(() => Math.random() - 0.5);
        setRecords(shuffled);
      }
    } catch {
      // Silently fail
    }
  }, []);

  useEffect(() => {
    if (isActive) {
      fetchRecords();
      // Refresh every 30 seconds
      const interval = setInterval(fetchRecords, 30000);
      return () => clearInterval(interval);
    }
  }, [isActive, fetchRecords]);

  // Auto-rotate notifications
  useEffect(() => {
    if (!isActive || records.length === 0) return;

    // Start showing after 2 seconds
    const startTimer = setTimeout(() => {
      setVisible(true);
    }, 2000);

    return () => clearTimeout(startTimer);
  }, [isActive, records]);

  useEffect(() => {
    if (!visible || records.length === 0) return;

    const interval = setInterval(() => {
      // Slide out
      setAnimating(true);

      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % records.length);
        setAnimating(false);
      }, 400);
    }, 3000);

    return () => clearInterval(interval);
  }, [visible, records.length]);

  if (!isActive || records.length === 0 || !visible) return null;

  const record = records[currentIndex];

  return (
    <div className="fixed left-4 bottom-24 md:bottom-8 z-50 pointer-events-none">
      <div
        className={`
          flex items-center gap-2.5 bg-black/70 backdrop-blur-md
          rounded-full pl-1 pr-4 py-1
          border border-white/10 shadow-lg shadow-black/20
          transition-all duration-400
          ${animating
            ? 'opacity-0 -translate-x-4 scale-95'
            : 'opacity-100 translate-x-0 scale-100'
          }
        `}
        style={{
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1890FF] to-[#00D4FF] flex items-center justify-center flex-shrink-0">
          <span className="text-white text-xs font-bold">
            {record.username.charAt(0)}
          </span>
        </div>
        {/* Text */}
        <div className="flex flex-col min-w-0">
          <span className="text-white text-xs font-medium truncate">
            {record.username}
            <span className="text-white/60 ml-1">已抢购</span>
          </span>
          <span className="text-white/50 text-[10px] truncate">
            {record.couponName}
          </span>
        </div>
      </div>
    </div>
  );
}
