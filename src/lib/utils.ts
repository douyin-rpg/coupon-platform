import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 获取当前时间对应的「北京时间」(Asia/Shanghai) 的时分秒。
 * 场次/抢券时间统一以北京时间为准，与服务器/浏览器本地时区无关，
 * 避免 Vercel(UTC) 等部署环境因时区差异导致"未在抢券时间"。
 */
export function getBeijingTime(now: Date = new Date()): { hours: number; minutes: number; seconds: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Shanghai',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(now);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? '0');
  return { hours: get('hour'), minutes: get('minute'), seconds: get('second') };
}

/**
 * 获取当前时间对应的「北京时间」当日分钟数（0-1439）。
 */
export function getBeijingMinutes(now: Date = new Date()): number {
  const { hours, minutes } = getBeijingTime(now);
  return hours * 60 + minutes;
}
